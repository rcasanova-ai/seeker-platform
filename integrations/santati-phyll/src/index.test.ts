import { describe, expect, it } from "vitest";
import { runMockPhyllCompanyVerification } from "./index.js";

describe("Santati Phyll scaffold", () => {
  it("records a paid mocked company verification", async () => {
    const result = await runMockPhyllCompanyVerification();

    expect(result.verification).toMatchObject({ verified: true });
    expect(result.auditEvents[0]).toMatchObject({
      requestingApplication: "Santati Phyll",
      requestedAmount: 0.01,
      result: "paid"
    });
  });
});
