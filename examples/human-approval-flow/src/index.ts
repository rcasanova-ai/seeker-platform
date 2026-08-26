import { StaticApprovalProvider } from "@seeker-platform/approval-ui";
import { PaymentPolicyEngine } from "@seeker-platform/payment-policy";
import { MockSeekerWallet } from "@seeker-platform/seeker-wallet";
import { InMemoryTransactionAuditSink } from "@seeker-platform/transaction-audit";
import { paymentRequiredResponse, X402Client } from "@seeker-platform/x402-client";

export async function runHumanApprovalFlow(amount: number) {
  const auditSink = new InMemoryTransactionAuditSink();
  let calls = 0;

  const fetchImpl = async () => {
    calls += 1;
    if (calls === 1) {
      return paymentRequiredResponse({
        provider: "verification.example",
        recipient: "mock-recipient",
        amount,
        asset: "USD",
        purpose: "agent requested paid resource"
      });
    }

    return Response.json({
      resource: "paid resource returned",
      calls
    });
  };

  const client = new X402Client({
    requestingApplication: "human-approval-flow-example",
    requestingActor: "example-agent",
    policyEngine: new PaymentPolicyEngine({
      maximumTransactionAmount: 2,
      maximumTaskBudget: 3,
      dailyBudget: 5,
      allowedProviders: ["verification.example"],
      allowedAssets: ["USD"],
      humanApprovalThreshold: 1
    }),
    wallet: new MockSeekerWallet(),
    auditSink,
    approvalProvider: new StaticApprovalProvider({
      approved: true,
      approvedAmount: amount,
      approver: "mock-human"
    })
  }, fetchImpl);

  const response = await client.fetch("https://verification.example/resource");
  return {
    resource: await response.json(),
    auditEvents: await auditSink.list()
  };
}
