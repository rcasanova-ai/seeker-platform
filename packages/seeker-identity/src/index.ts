export interface SeekerIdentity {
  subject: string;
  displayName?: string;
  authenticatedAt: string;
}

export interface IdentityProvider {
  authenticate(): Promise<SeekerIdentity>;
}

export class MockIdentityProvider implements IdentityProvider {
  async authenticate(): Promise<SeekerIdentity> {
    return {
      subject: "mock-seeker-user",
      displayName: "Mock Seeker User",
      authenticatedAt: new Date().toISOString()
    };
  }
}
