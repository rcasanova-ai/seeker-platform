import { describe, expect, it } from "vitest";
import { PaymentPolicyEngine } from "./index.js";

const policy = {
  maximumTransactionAmount: 1,
  maximumTaskBudget: 5,
  dailyBudget: 10,
  allowedProviders: ["verification.example"],
  allowedAssets: ["USD"],
  humanApprovalThreshold: 0.5
};

describe("PaymentPolicyEngine", () => {
  it("approves allowed small payments", () => {
    const decision = new PaymentPolicyEngine(policy).evaluate({
      provider: "verification.example",
      asset: "USD",
      amount: 0.01,
      taskSpendSoFar: 0,
      dailySpendSoFar: 0,
      purpose: "company verification"
    });

    expect(decision.status).toBe("approved");
  });

  it("denies unknown providers by default", () => {
    const decision = new PaymentPolicyEngine(policy).evaluate({
      provider: "unknown.example",
      asset: "USD",
      amount: 0.01,
      taskSpendSoFar: 0,
      dailySpendSoFar: 0,
      purpose: "company verification"
    });

    expect(decision.status).toBe("denied");
  });
});
