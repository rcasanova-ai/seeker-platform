import { createMobileSession } from "@seeker-platform/mobile-session";
import { describe, expect, it } from "vitest";
import { approvalRequested, mobileSessionAuthenticated } from "./index.js";

describe("seeker engagement scaffold", () => {
  it("creates notification-ready mobile session events", () => {
    const session = createMobileSession({
      application: "example",
      actor: "agent",
      permissions: ["identity"]
    });

    expect(mobileSessionAuthenticated(session)).toMatchObject({
      type: "mobile-session-authenticated",
      application: "example"
    });
  });

  it("creates approval request events without secrets", () => {
    const event = approvalRequested({
      requestingApplication: "example",
      requestingActor: "agent",
      provider: "provider",
      purpose: "paid action",
      amount: 1,
      asset: "USD"
    });

    expect(JSON.stringify(event)).not.toMatch(/private|secret|seed/i);
  });
});
