export type MobilePermission = "camera" | "microphone" | "wallet" | "identity";

export interface MobileSession {
  id: string;
  application: string;
  actor: string;
  permissions: readonly MobilePermission[];
  createdAt: string;
}

export function createMobileSession(input: Omit<MobileSession, "id" | "createdAt">): MobileSession {
  return {
    ...input,
    id: `mobile-session-${Date.now()}`,
    createdAt: new Date().toISOString()
  };
}
