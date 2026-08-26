export type ApprovalSource = "policy" | "human" | "denied";
export type TransactionResult = "paid" | "denied" | "failed";

export interface TransactionAuditEvent {
  id: string;
  requestingApplication: string;
  requestingActor: string;
  purpose: string;
  provider: string;
  requestedAmount: number;
  approvedAmount: number;
  asset: string;
  policyDecision: string;
  approvalSource: ApprovalSource;
  transactionSignature?: string;
  result: TransactionResult;
  timestamp: string;
}

export interface TransactionAuditSink {
  record(event: Omit<TransactionAuditEvent, "id" | "timestamp">): Promise<TransactionAuditEvent>;
  list(): Promise<readonly TransactionAuditEvent[]>;
}

export class InMemoryTransactionAuditSink implements TransactionAuditSink {
  private readonly events: TransactionAuditEvent[] = [];

  async record(event: Omit<TransactionAuditEvent, "id" | "timestamp">): Promise<TransactionAuditEvent> {
    const stored = Object.freeze({
      ...event,
      id: `audit-${this.events.length + 1}`,
      timestamp: new Date().toISOString()
    });

    this.events.push(stored);
    return stored;
  }

  async list(): Promise<readonly TransactionAuditEvent[]> {
    return [...this.events];
  }
}
