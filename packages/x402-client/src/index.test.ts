import { StaticApprovalProvider } from "@seeker-platform/approval-ui";
import { PaymentPolicyEngine } from "@seeker-platform/payment-policy";
import { MockSeekerWallet } from "@seeker-platform/seeker-wallet";
import { InMemoryTransactionAuditSink } from "@seeker-platform/transaction-audit";
import { describe, expect, it } from "vitest";
import { paymentRequiredResponse, X402Client } from "./index.js";

function policyEngine(overrides = {}) {
  return new PaymentPolicyEngine({
    maximumTransactionAmount: 1,
    maximumTaskBudget: 1,
    dailyBudget: 1,
    allowedProviders: ["verification.example"],
    allowedAssets: ["USD"],
    humanApprovalThreshold: 0.5,
    ...overrides
  });
}

function paidRequirement(amount = 0.01) {
  return {
    provider: "verification.example",
    recipient: "recipient",
    amount,
    asset: "USD",
    purpose: "company verification"
  };
}

describe("X402Client", () => {
  it("pays a mocked 402 requirement and retries the request", async () => {
    const auditSink = new InMemoryTransactionAuditSink();
    let calls = 0;
    const fetchImpl = async () => {
      calls += 1;
      if (calls === 1) {
        return paymentRequiredResponse({
          ...paidRequirement()
        });
      }
      return Response.json({ verified: true });
    };

    const client = new X402Client({
      requestingApplication: "test-app",
      requestingActor: "test-agent",
      policyEngine: policyEngine(),
      wallet: new MockSeekerWallet(),
      auditSink,
      approvalProvider: new StaticApprovalProvider({ approved: true, approvedAmount: 0.01 })
    }, fetchImpl);

    const response = await client.fetch("https://verification.example/company");
    await expect(response.json()).resolves.toEqual({ verified: true });
    await expect(auditSink.list()).resolves.toHaveLength(1);
  });

  it("rejects malformed 402 responses", async () => {
    const client = new X402Client({
      requestingApplication: "test-app",
      requestingActor: "test-agent",
      policyEngine: policyEngine(),
      wallet: new MockSeekerWallet(),
      auditSink: new InMemoryTransactionAuditSink()
    }, async () => Response.json({ amount: "bad" }, { status: 402 }));

    await expect(client.fetch("https://verification.example/company"))
      .rejects.toMatchObject({ code: "MALFORMED_PAYMENT_REQUIREMENT" });
  });

  it("denies unsupported payment requirements", async () => {
    const auditSink = new InMemoryTransactionAuditSink();
    const client = new X402Client({
      requestingApplication: "test-app",
      requestingActor: "test-agent",
      policyEngine: policyEngine(),
      wallet: new MockSeekerWallet(),
      auditSink
    }, async () => paymentRequiredResponse({
      ...paidRequirement(),
      asset: "UNSUPPORTED"
    }));

    await expect(client.fetch("https://verification.example/company"))
      .rejects.toMatchObject({ code: "PAYMENT_DENIED" });
    expect((await auditSink.list())[0].result).toBe("denied");
  });

  it("denies policy rejected payments", async () => {
    const client = new X402Client({
      requestingApplication: "test-app",
      requestingActor: "test-agent",
      policyEngine: policyEngine({ maximumTransactionAmount: 0.001 }),
      wallet: new MockSeekerWallet(),
      auditSink: new InMemoryTransactionAuditSink()
    }, async () => paymentRequiredResponse(paidRequirement()));

    await expect(client.fetch("https://verification.example/company"))
      .rejects.toMatchObject({ code: "PAYMENT_DENIED" });
  });

  it("uses human approval for threshold payments", async () => {
    const auditSink = new InMemoryTransactionAuditSink();
    const client = new X402Client({
      requestingApplication: "test-app",
      requestingActor: "test-agent",
      policyEngine: policyEngine(),
      wallet: new MockSeekerWallet(),
      auditSink,
      approvalProvider: new StaticApprovalProvider({ approved: true, approvedAmount: 0.5 })
    }, async (_input, init) => new Headers(init?.headers).has("x-payment-signature")
      ? Response.json({ verified: true })
      : paymentRequiredResponse(paidRequirement(0.5)));

    await client.fetch("https://verification.example/company");

    expect((await auditSink.list())[0].approvalSource).toBe("human");
  });

  it("records signing failures", async () => {
    const auditSink = new InMemoryTransactionAuditSink();
    const client = new X402Client({
      requestingApplication: "test-app",
      requestingActor: "test-agent",
      policyEngine: policyEngine(),
      wallet: new MockSeekerWallet({ failSigning: true }),
      auditSink
    }, async () => paymentRequiredResponse(paidRequirement()));

    await expect(client.fetch("https://verification.example/company"))
      .rejects.toMatchObject({ code: "PAYMENT_EXECUTION_FAILED" });
    expect((await auditSink.list())[0].result).toBe("failed");
  });
});
