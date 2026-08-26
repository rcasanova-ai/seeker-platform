export type WalletNetwork = "solana-mainnet" | "solana-devnet" | "solana-testnet";

export interface WalletConnection {
  address: string;
  network: WalletNetwork;
  adapter: "mock" | "solana-mobile-wallet-adapter" | "seeker-seed-vault";
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

export interface SeekerWallet {
  connect(): Promise<WalletConnection>;
  pay(instruction: PaymentInstruction): Promise<SignedPayment>;
}

export class MockSeekerWallet implements SeekerWallet {
  constructor(private readonly connection: WalletConnection = {
    address: "mock-seeker-wallet-address",
    network: "solana-devnet",
    adapter: "mock"
  }) {}

  async connect(): Promise<WalletConnection> {
    return this.connection;
  }

  async pay(instruction: PaymentInstruction): Promise<SignedPayment> {
    if (instruction.amount <= 0) {
      throw new Error("Payment amount must be greater than zero.");
    }

    return {
      signature: `mock-signature-${instruction.provider}-${Date.now()}`,
      paidAmount: instruction.amount,
      asset: instruction.asset,
      provider: instruction.provider
    };
  }
}
