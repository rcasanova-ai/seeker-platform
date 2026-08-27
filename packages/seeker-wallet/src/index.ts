export type WalletNetwork = "solana:mainnet" | "solana:devnet" | "solana:testnet" | "solana:localnet";
export type WalletCapability =
  | "discover-wallets"
  | "authorize"
  | "reauthorize"
  | "deauthorize"
  | "sign-transactions"
  | "sign-and-send-transactions";

export type WalletConnectionStatus = "disconnected" | "discovering" | "connecting" | "connected" | "failed";

export interface WalletConnection {
  address: string;
  network: WalletNetwork;
  adapter: "mock" | "solana-mobile-wallet-adapter";
  authorizationScope?: string;
  connectedAt: string;
  capabilities: readonly WalletCapability[];
}

export interface WalletDiscoveryResult {
  available: boolean;
  adapter: "mock" | "solana-mobile-wallet-adapter";
  capabilities: readonly WalletCapability[];
  reason?: string;
}

export interface WalletSessionState {
  status: WalletConnectionStatus;
  network: WalletNetwork;
  connection?: WalletConnection;
  lastError?: SeekerWalletError;
}

export interface PaymentInstruction {
  provider: string;
  recipient: string;
  amount: number;
  asset: string;
  purpose: string;
  reference?: string;
}

export interface SignedPayment {
  signature: string;
  paidAmount: number;
  asset: string;
  provider: string;
}

export interface TransactionSigningRequest {
  transaction: Uint8Array;
  network?: WalletNetwork;
}

export interface SignedTransaction {
  signedTransaction: Uint8Array;
}

export interface TransactionSubmissionRequest {
  signedTransaction: Uint8Array;
  network?: WalletNetwork;
}

export interface TransactionSubmission {
  signature: string;
}

export interface SeekerWallet {
  getState(): WalletSessionState;
  discover(): Promise<WalletDiscoveryResult>;
  connect(): Promise<WalletConnection>;
  disconnect(): Promise<void>;
  getPublicKey(): Promise<string>;
  signTransaction(request: TransactionSigningRequest): Promise<SignedTransaction>;
  submitTransaction(request: TransactionSubmissionRequest): Promise<TransactionSubmission>;
  signAndSubmitTransaction?(request: TransactionSigningRequest): Promise<TransactionSubmission>;
  pay(instruction: PaymentInstruction): Promise<SignedPayment>;
}

export class SeekerWalletError extends Error {
  constructor(
    message: string,
    readonly code:
      | "WALLET_UNAVAILABLE"
      | "AUTHORIZATION_FAILED"
      | "NOT_CONNECTED"
      | "UNSUPPORTED_CAPABILITY"
      | "SIGNING_FAILED"
      | "SUBMISSION_FAILED",
    readonly cause?: unknown
  ) {
    super(message);
    this.name = "SeekerWalletError";
  }
}

export class MockSeekerWallet implements SeekerWallet {
  private state: WalletSessionState;

  constructor(
    private readonly options: {
      available?: boolean;
      failAuthorization?: boolean;
      failSigning?: boolean;
      failSubmission?: boolean;
      connection?: Partial<WalletConnection>;
    } = {}
  ) {
    this.state = {
      status: "disconnected",
      network: options.connection?.network ?? "solana:devnet"
    };
  }

  getState(): WalletSessionState {
    return this.state;
  }

  async discover(): Promise<WalletDiscoveryResult> {
    if (this.options.available === false) {
      return {
        available: false,
        adapter: "mock",
        capabilities: [],
        reason: "Mock wallet configured as unavailable."
      };
    }

    return {
      available: true,
      adapter: "mock",
      capabilities: mockCapabilities
    };
  }

  async connect(): Promise<WalletConnection> {
    const discovery = await this.discover();
    if (!discovery.available) {
      return this.fail("Mock wallet is unavailable.", "WALLET_UNAVAILABLE");
    }

    if (this.options.failAuthorization) {
      return this.fail("Mock wallet authorization failed.", "AUTHORIZATION_FAILED");
    }

    const connection = {
      address: this.options.connection?.address ?? "mock-seeker-wallet-address",
      network: this.options.connection?.network ?? "solana:devnet",
      adapter: "mock" as const,
      authorizationScope: this.options.connection?.authorizationScope ?? "mock-session",
      connectedAt: new Date().toISOString(),
      capabilities: mockCapabilities
    };

    this.state = {
      status: "connected",
      network: connection.network,
      connection
    };

    return connection;
  }

  async disconnect(): Promise<void> {
    this.state = {
      status: "disconnected",
      network: this.state.network
    };
  }

  async getPublicKey(): Promise<string> {
    return this.requireConnection().address;
  }

  async signTransaction(request: TransactionSigningRequest): Promise<SignedTransaction> {
    this.requireConnection();
    if (this.options.failSigning) {
      throw this.setError("Mock signing failed.", "SIGNING_FAILED");
    }

    return {
      signedTransaction: new Uint8Array([...request.transaction, 1])
    };
  }

  async submitTransaction(): Promise<TransactionSubmission> {
    this.requireConnection();
    if (this.options.failSubmission) {
      throw this.setError("Mock submission failed.", "SUBMISSION_FAILED");
    }

    return {
      signature: `mock-submission-${Date.now()}`
    };
  }

  async pay(instruction: PaymentInstruction): Promise<SignedPayment> {
    this.requireConnection();
    if (instruction.amount <= 0) {
      throw new Error("Payment amount must be greater than zero.");
    }
    if (this.options.failSigning) {
      throw this.setError("Mock payment signing failed.", "SIGNING_FAILED");
    }
    if (this.options.failSubmission) {
      throw this.setError("Mock payment submission failed.", "SUBMISSION_FAILED");
    }

    return {
      signature: `mock-signature-${instruction.provider}-${Date.now()}`,
      paidAmount: instruction.amount,
      asset: instruction.asset,
      provider: instruction.provider
    };
  }

  private requireConnection(): WalletConnection {
    if (!this.state.connection) {
      throw this.setError("Wallet is not connected.", "NOT_CONNECTED");
    }
    return this.state.connection;
  }

  private fail<T>(message: string, code: SeekerWalletError["code"]): T {
    throw this.setError(message, code);
  }

  private setError(message: string, code: SeekerWalletError["code"]) {
    const error = new SeekerWalletError(message, code);
    this.state = {
      ...this.state,
      status: "failed",
      lastError: error
    };
    return error;
  }
}

export interface MobileWalletAdapterRuntime {
  discover(): Promise<WalletDiscoveryResult>;
  authorize(network: WalletNetwork): Promise<WalletConnection>;
  deauthorize(connection: WalletConnection): Promise<void>;
  signTransactions(connection: WalletConnection, transactions: readonly Uint8Array[]): Promise<readonly Uint8Array[]>;
  submitTransaction?(connection: WalletConnection, signedTransaction: Uint8Array): Promise<string>;
  signAndSubmitTransaction?(connection: WalletConnection, transaction: Uint8Array): Promise<string>;
}

export class MobileWalletAdapterSeekerWallet implements SeekerWallet {
  private state: WalletSessionState;

  constructor(
    private readonly runtime: MobileWalletAdapterRuntime,
    private readonly network: WalletNetwork = "solana:mainnet"
  ) {
    this.state = {
      status: "disconnected",
      network
    };
  }

  getState(): WalletSessionState {
    return this.state;
  }

  async discover(): Promise<WalletDiscoveryResult> {
    this.state = { ...this.state, status: "discovering" };
    return this.runtime.discover();
  }

  async connect(): Promise<WalletConnection> {
    this.state = { ...this.state, status: "connecting" };
    try {
      const discovery = await this.runtime.discover();
      if (!discovery.available) {
        throw new SeekerWalletError(discovery.reason ?? "No compatible mobile wallet is available.", "WALLET_UNAVAILABLE");
      }

      const connection = await this.runtime.authorize(this.network);
      this.state = {
        status: "connected",
        network: connection.network,
        connection
      };
      return connection;
    } catch (error) {
      if (error instanceof SeekerWalletError) {
        this.state = { ...this.state, status: "failed", lastError: error };
        throw error;
      }
      throw this.setError("Mobile Wallet Adapter authorization failed.", "AUTHORIZATION_FAILED", error);
    }
  }

  async disconnect(): Promise<void> {
    if (this.state.connection) {
      await this.runtime.deauthorize(this.state.connection);
    }
    this.state = {
      status: "disconnected",
      network: this.network
    };
  }

  async getPublicKey(): Promise<string> {
    return this.requireConnection().address;
  }

  async signTransaction(request: TransactionSigningRequest): Promise<SignedTransaction> {
    const connection = this.requireCapability("sign-transactions");
    try {
      const [signedTransaction] = await this.runtime.signTransactions(connection, [request.transaction]);
      if (!signedTransaction) {
        throw new Error("Wallet returned no signed transaction.");
      }
      return { signedTransaction };
    } catch (error) {
      throw this.setError("Transaction signing failed.", "SIGNING_FAILED", error);
    }
  }

  async submitTransaction(request: TransactionSubmissionRequest): Promise<TransactionSubmission> {
    const connection = this.requireConnection();
    if (!this.runtime.submitTransaction) {
      throw this.setError("Transaction submission is not supported by this wallet runtime.", "UNSUPPORTED_CAPABILITY");
    }
    try {
      return {
        signature: await this.runtime.submitTransaction(connection, request.signedTransaction)
      };
    } catch (error) {
      throw this.setError("Transaction submission failed.", "SUBMISSION_FAILED", error);
    }
  }

  async signAndSubmitTransaction(request: TransactionSigningRequest): Promise<TransactionSubmission> {
    const connection = this.requireCapability("sign-and-send-transactions");
    if (!this.runtime.signAndSubmitTransaction) {
      throw this.setError("Sign-and-submit is not supported by this wallet runtime.", "UNSUPPORTED_CAPABILITY");
    }
    try {
      return {
        signature: await this.runtime.signAndSubmitTransaction(connection, request.transaction)
      };
    } catch (error) {
      throw this.setError("Transaction signing/submission failed.", "SUBMISSION_FAILED", error);
    }
  }

  async pay(instruction: PaymentInstruction): Promise<SignedPayment> {
    this.requireConnection();
    throw new SeekerWalletError(
      `No default production payment builder is registered for ${instruction.asset}. Use an injectable payment executor.`,
      "UNSUPPORTED_CAPABILITY"
    );
  }

  private requireConnection(): WalletConnection {
    if (!this.state.connection) {
      throw this.setError("Wallet is not connected.", "NOT_CONNECTED");
    }
    return this.state.connection;
  }

  private requireCapability(capability: WalletCapability): WalletConnection {
    const connection = this.requireConnection();
    if (!connection.capabilities.includes(capability)) {
      throw this.setError(`Wallet does not support ${capability}.`, "UNSUPPORTED_CAPABILITY");
    }
    return connection;
  }

  private setError(message: string, code: SeekerWalletError["code"], cause?: unknown) {
    const error = new SeekerWalletError(message, code, cause);
    this.state = {
      ...this.state,
      status: "failed",
      lastError: error
    };
    return error;
  }
}

const mockCapabilities: readonly WalletCapability[] = [
  "discover-wallets",
  "authorize",
  "deauthorize",
  "sign-transactions",
  "sign-and-send-transactions"
];
