import type { ApprovalRequest } from "@seeker-platform/approval-ui";
import type { MobileSession } from "@seeker-platform/mobile-session";

export type EngagementEventType =
  | "mobile-session-authenticated"
  | "deep-link-received"
  | "notification-ready"
  | "approval-requested"
  | "activity-recorded"
  | "integration-action-triggered";

export interface EngagementEvent {
  id: string;
  type: EngagementEventType;
  application: string;
  actor: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

export function mobileSessionAuthenticated(session: MobileSession): EngagementEvent {
  return event("mobile-session-authenticated", session.application, session.actor, {
    sessionId: session.id,
    permissions: session.permissions
  });
}

export function approvalRequested(request: ApprovalRequest): EngagementEvent {
  return event("approval-requested", request.requestingApplication, request.requestingActor, {
    provider: request.provider,
    purpose: request.purpose,
    amount: request.amount,
    asset: request.asset
  });
}

export function integrationActionTriggered(application: string, actor: string, action: string): EngagementEvent {
  return event("integration-action-triggered", application, actor, { action });
}

function event(
  type: EngagementEventType,
  application: string,
  actor: string,
  payload: Record<string, unknown>
): EngagementEvent {
  return {
    id: `engagement-${Date.now()}`,
    type,
    application,
    actor,
    payload,
    timestamp: new Date().toISOString()
  };
}
