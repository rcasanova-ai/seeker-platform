import { describe, expect, it } from "vitest";
import { MockSeekerWallet } from "./index.js";

describe("MockSeekerWallet", () => {
  it("returns a mock signature without exposing keys", async () => {
    const wallet = new MockSeekerWallet();
    const payment = await wallet.pay({
      provider: "example-provider",
      recipient: "example-recipient",
      amount: 0.01,
      asset: "USD",
      purpose: "company verification"
    });

    expect(payment.signature).toContain("mock-signature");
    expect(Object.keys(payment)).not.toContain("privateKey");
  });
});
