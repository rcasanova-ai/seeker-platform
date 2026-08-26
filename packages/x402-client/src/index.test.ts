import { StaticApprovalProvider } from "@seeker-platform/approval-ui";
import { PaymentPolicyEngine } from "@seeker-platform/payment-policy";
import { MockSeekerWallet } from "@seeker-platform/seeker-wallet";
import { InMemoryTransactionAuditSink } from "@seeker-platform/transaction-audit";
import { describe, expect, it } from "vitest";
import { paymentRequiredResponse, X402Client } from "./index.js";

describe("X402Client", () => {
  it("pays a mocked 402 requirement and retries the request", async () => {
    const auditSink = new InMemoryTransactionAuditSink();
    let calls = 0;
    const fetchImpl = async () => {
      calls += 1;
      if (calls === 1) {
        return paymentRequiredResponse({
          provider: "verification.example",
          recipient: "recipient",
          amount: 0.01,
          asset: "USD",
          purpose: "company verification"
        });
      }
      return Response.json({ verified: true });
    };

    const client = new X402Client({
      requestingApplication: "test-app",
      requestingActor: "test-agent",
      policyEngine: new PaymentPolicyEngine({
        maximumTransactionAmount: 1,
        maximumTaskBudget: 1,
        dailyBudget: 1,
        allowedProviders: ["verification.example"],
        allowedAssets: ["USD"],
        humanApprovalThreshold: 0.5
      }),
      wallet: new MockSeekerWallet(),
      auditSink,
      approvalProvider: new StaticApprovalProvider({ approved: true, approvedAmount: 0.01 })
    }, fetchImpl);

    const response = await client.fetch("https://verification.example/company");
    await expect(response.json()).resolves.toEqual({ verified: true });
    await expect(auditSink.list()).resolves.toHaveLength(1);
  });
});
