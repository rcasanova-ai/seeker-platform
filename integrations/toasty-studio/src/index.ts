import type { SeekerIdentity } from "@seeker-platform/seeker-identity";
import { createMobileSession } from "@seeker-platform/mobile-session";

export interface ToastyJoinRequest {
  sessionId: string;
  actor: string;
  identity?: SeekerIdentity;
}

export function createToastySeekerClientSession(request: ToastyJoinRequest) {
  return {
    toastySessionId: request.sessionId,
    seekerMobileSession: createMobileSession({
      application: "Toasty Studio",
      actor: request.actor,
      permissions: ["camera", "microphone"]
    }),
    identitySubject: request.identity?.subject,
    remoteRecordingArchitecture: "existing-toasty-authoritative"
  };
}
