import { describe, expect, it } from "vitest";
import { InMemoryTransactionAuditSink } from "./index.js";

describe("InMemoryTransactionAuditSink", () => {
  it("records immutable-style audit events without secrets", async () => {
    const sink = new InMemoryTransactionAuditSink();
    const event = await sink.record({
      requestingApplication: "test-app",
      requestingActor: "agent",
      purpose: "test",
      provider: "provider",
      requestedAmount: 0.01,
      approvedAmount: 0.01,
      asset: "USD",
      policyDecision: "approved",
      approvalSource: "policy",
      transactionSignature: "mock-signature",
      result: "paid"
    });

    expect(event.id).toBe("audit-1");
    expect(JSON.stringify(event)).not.toMatch(/private|secret|seed/i);
  });
});
