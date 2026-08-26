import { describe, expect, it } from "vitest";
import { mockPaidApi } from "./index.js";

describe("mockPaidApi", () => {
  it("requires payment before returning the resource", async () => {
    expect((await mockPaidApi("https://example.test")).status).toBe(402);
    expect((await mockPaidApi("https://example.test", {
      headers: { "x-payment-signature": "mock-signature" }
    })).status).toBe(200);
  });
});
