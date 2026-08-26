export type PolicyDecisionStatus = "approved" | "requires-human-approval" | "denied";

export interface PaymentPolicy {
  maximumTransactionAmount: number;
  maximumTaskBudget: number;
  dailyBudget: number;
  allowedProviders: readonly string[];
  allowedAssets: readonly string[];
  humanApprovalThreshold: number;
}

export interface PolicyContext {
  provider: string;
  asset: string;
  amount: number;
  taskSpendSoFar: number;
  dailySpendSoFar: number;
  purpose: string;
}

export interface PolicyDecision {
  status: PolicyDecisionStatus;
  approvedAmount: number;
  reason: string;
}

export class PaymentPolicyEngine {
  constructor(private readonly policy: PaymentPolicy) {}

  evaluate(context: PolicyContext): PolicyDecision {
    if (!Number.isFinite(context.amount) || context.amount <= 0) {
      return denied("Invalid payment amount.");
    }

    if (!this.policy.allowedProviders.includes(context.provider)) {
      return denied("Provider is not allowed.");
    }

    if (!this.policy.allowedAssets.includes(context.asset)) {
      return denied("Asset is not allowed.");
    }

    if (context.amount > this.policy.maximumTransactionAmount) {
      return denied("Payment exceeds maximum transaction amount.");
    }

    if (context.taskSpendSoFar + context.amount > this.policy.maximumTaskBudget) {
      return denied("Payment exceeds task budget.");
    }

    if (context.dailySpendSoFar + context.amount > this.policy.dailyBudget) {
      return denied("Payment exceeds daily budget.");
    }

    if (context.amount >= this.policy.humanApprovalThreshold) {
      return {
        status: "requires-human-approval",
        approvedAmount: context.amount,
        reason: "Payment meets or exceeds human approval threshold."
      };
    }

    return {
      status: "approved",
      approvedAmount: context.amount,
      reason: "Payment is allowed by policy."
    };
  }
}

function denied(reason: string): PolicyDecision {
  return {
    status: "denied",
    approvedAmount: 0,
    reason
  };
}
