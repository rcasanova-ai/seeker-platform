import { StaticApprovalProvider } from "@seeker-platform/approval-ui";
import { PaymentPolicyEngine } from "@seeker-platform/payment-policy";
import { MockSeekerWallet } from "@seeker-platform/seeker-wallet";
import { InMemoryTransactionAuditSink } from "@seeker-platform/transaction-audit";
import { paymentRequiredResponse, X402Client } from "@seeker-platform/x402-client";

export async function runMockPhyllCompanyVerification() {
  const auditSink = new InMemoryTransactionAuditSink();
  let calls = 0;

  const fetchImpl = async () => {
    calls += 1;
    if (calls === 1) {
      return paymentRequiredResponse({
        provider: "phyll-verification.example",
        recipient: "mock-provider-recipient",
        amount: 0.01,
        asset: "USD",
        purpose: "company verification"
      });
    }

    return Response.json({
      companyId: "mock-company",
      verified: true,
      source: "mock-phyll-provider"
    });
  };

  const client = new X402Client({
    requestingApplication: "Santati Phyll",
    requestingActor: "phyll-agent",
    policyEngine: new PaymentPolicyEngine({
      maximumTransactionAmount: 0.25,
      maximumTaskBudget: 1,
      dailyBudget: 5,
      allowedProviders: ["phyll-verification.example"],
      allowedAssets: ["USD"],
      humanApprovalThreshold: 0.1
    }),
    wallet: new MockSeekerWallet(),
    auditSink,
    approvalProvider: new StaticApprovalProvider({ approved: true, approvedAmount: 0.01 })
  }, fetchImpl);

  const response = await client.fetch("https://phyll-verification.example/company/mock-company");
  return {
    verification: await response.json(),
    auditEvents: await auditSink.list()
  };
}
