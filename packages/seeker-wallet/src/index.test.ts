import { describe, expect, it } from "vitest";
import { MockSeekerWallet, SeekerWalletError } from "./index.js";

describe("MockSeekerWallet", () => {
  it("reports wallet unavailable", async () => {
    const wallet = new MockSeekerWallet({ available: false });

    await expect(wallet.connect()).rejects.toMatchObject({ code: "WALLET_UNAVAILABLE" });
  });

  it("connects and retrieves the public key", async () => {
    const wallet = new MockSeekerWallet();
    await wallet.connect();

    await expect(wallet.getPublicKey()).resolves.toBe("mock-seeker-wallet-address");
    expect(wallet.getState().status).toBe("connected");
  });

  it("handles authorization failure explicitly", async () => {
    const wallet = new MockSeekerWallet({ failAuthorization: true });

    await expect(wallet.connect()).rejects.toBeInstanceOf(SeekerWalletError);
    expect(wallet.getState().lastError?.code).toBe("AUTHORIZATION_FAILED");
  });

  it("returns a mock signature without exposing keys", async () => {
    const wallet = new MockSeekerWallet();
    await wallet.connect();
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

  it("surfaces signing failures", async () => {
    const wallet = new MockSeekerWallet({ failSigning: true });
    await wallet.connect();

    await expect(wallet.signTransaction({ transaction: new Uint8Array([1, 2, 3]) }))
      .rejects.toMatchObject({ code: "SIGNING_FAILED" });
  });

  it("surfaces payment submission failures", async () => {
    const wallet = new MockSeekerWallet({ failSubmission: true });
    await wallet.connect();

    await expect(wallet.pay({
      provider: "example-provider",
      recipient: "example-recipient",
      amount: 0.01,
      asset: "USD",
      purpose: "company verification"
    })).rejects.toMatchObject({ code: "SUBMISSION_FAILED" });
  });
});
