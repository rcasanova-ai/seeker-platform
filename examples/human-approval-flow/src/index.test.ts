import { describe, expect, it } from "vitest";
import { runHumanApprovalFlow } from "./index.js";

describe("human approval flow", () => {
  it("autonomously approves a small payment", async () => {
    const result = await runHumanApprovalFlow(0.01);
    expect(result.auditEvents[0].approvalSource).toBe("policy");
    expect(result.resource).toMatchObject({ resource: "paid resource returned" });
  });

  it("uses human approval above threshold", async () => {
    const result = await runHumanApprovalFlow(1);
    expect(result.auditEvents[0].approvalSource).toBe("human");
  });
});
