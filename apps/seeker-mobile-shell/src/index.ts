import type { ApprovalRequest } from "@seeker-platform/approval-ui";
import type { MobileSession } from "@seeker-platform/mobile-session";
import type { SeekerIdentity } from "@seeker-platform/seeker-identity";
import type { WalletNetwork, WalletSessionState } from "@seeker-platform/seeker-wallet";
import type { TransactionAuditEvent } from "@seeker-platform/transaction-audit";

export interface IntegrationCapability {
  id: string;
  integration: string;
  description: string;
  actions: readonly string[];
}

export interface DeepLinkEvent {
  url: string;
  receivedAt: string;
  integrationHint?: string;
}

export interface SeekerMobileShellState {
  wallet: WalletSessionState;
  identity?: SeekerIdentity;
  session?: MobileSession;
  networkStatus: "unknown" | "online" | "offline";
  network: WalletNetwork;
  walletAddress?: string;
  pendingApprovals: readonly ApprovalRequest[];
  recentActivity: readonly TransactionAuditEvent[];
  deepLinks: readonly DeepLinkEvent[];
  capabilities: readonly IntegrationCapability[];
}

export class SeekerMobileShellRegistry {
  private state: SeekerMobileShellState;

  constructor(initialWallet: WalletSessionState) {
    this.state = {
      wallet: initialWallet,
      networkStatus: "unknown",
      network: initialWallet.network,
      walletAddress: initialWallet.connection?.address,
      pendingApprovals: [],
      recentActivity: [],
      deepLinks: [],
      capabilities: []
    };
  }

  snapshot(): SeekerMobileShellState {
    return {
      ...this.state,
      pendingApprovals: [...this.state.pendingApprovals],
      recentActivity: [...this.state.recentActivity],
      deepLinks: [...this.state.deepLinks],
      capabilities: [...this.state.capabilities]
    };
  }

  updateWallet(wallet: WalletSessionState): SeekerMobileShellState {
    this.state = {
      ...this.state,
      wallet,
      network: wallet.network,
      walletAddress: wallet.connection?.address
    };
    return this.snapshot();
  }

  setIdentity(identity: SeekerIdentity): SeekerMobileShellState {
    this.state = { ...this.state, identity };
    return this.snapshot();
  }

  setSession(session: MobileSession): SeekerMobileShellState {
    this.state = { ...this.state, session };
    return this.snapshot();
  }

  setNetworkStatus(networkStatus: SeekerMobileShellState["networkStatus"]): SeekerMobileShellState {
    this.state = { ...this.state, networkStatus };
    return this.snapshot();
  }

  registerCapability(capability: IntegrationCapability): SeekerMobileShellState {
    this.state = {
      ...this.state,
      capabilities: [
        ...this.state.capabilities.filter((existing) => existing.id !== capability.id),
        capability
      ]
    };
    return this.snapshot();
  }

  addApprovalRequest(request: ApprovalRequest): SeekerMobileShellState {
    this.state = {
      ...this.state,
      pendingApprovals: [...this.state.pendingApprovals, request]
    };
    return this.snapshot();
  }

  recordActivity(event: TransactionAuditEvent): SeekerMobileShellState {
    this.state = {
      ...this.state,
      recentActivity: [event, ...this.state.recentActivity].slice(0, 25)
    };
    return this.snapshot();
  }

  receiveDeepLink(event: Omit<DeepLinkEvent, "receivedAt">): SeekerMobileShellState {
    this.state = {
      ...this.state,
      deepLinks: [
        { ...event, receivedAt: new Date().toISOString() },
        ...this.state.deepLinks
      ].slice(0, 25)
    };
    return this.snapshot();
  }
}
