import type { HumanApprovalProvider } from "@seeker-platform/approval-ui";
import type { PaymentPolicyEngine, PolicyDecision } from "@seeker-platform/payment-policy";
import type { SeekerWallet } from "@seeker-platform/seeker-wallet";
import type { TransactionAuditSink } from "@seeker-platform/transaction-audit";

export interface X402PaymentRequirement {
  provider: string;
  recipient: string;
  amount: number;
  asset: string;
  purpose: string;
  paymentUrl?: string;
}

export interface X402ClientOptions {
  requestingApplication: string;
  requestingActor: string;
  policyEngine: PaymentPolicyEngine;
  wallet: SeekerWallet;
  auditSink: TransactionAuditSink;
  approvalProvider?: HumanApprovalProvider;
  taskSpendSoFar?: number;
  dailySpendSoFar?: number;
}

export interface FetchLike {
  (input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

export class X402Client {
  constructor(
    private readonly options: X402ClientOptions,
    private readonly fetchImpl: FetchLike = fetch
  ) {}

  async fetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
    const initial = await this.fetchImpl(input, init);
    if (initial.status !== 402) {
      return initial;
    }

    const requirement = await parsePaymentRequirement(initial);
    const decision = this.options.policyEngine.evaluate({
      provider: requirement.provider,
      asset: requirement.asset,
      amount: requirement.amount,
      taskSpendSoFar: this.options.taskSpendSoFar ?? 0,
      dailySpendSoFar: this.options.dailySpendSoFar ?? 0,
      purpose: requirement.purpose
    });

    const approval = await this.resolveApproval(requirement, decision);
    if (!approval.approved) {
      await this.record(requirement, decision, approval.approvedAmount, "denied", "denied");
      throw new Error(`Payment denied: ${decision.reason}`);
    }

    const payment = await this.options.wallet.pay({
      provider: requirement.provider,
      recipient: requirement.recipient,
      amount: approval.approvedAmount,
      asset: requirement.asset,
      purpose: requirement.purpose
    });

    const retry = await this.fetchImpl(input, {
      ...init,
      headers: {
        ...headersToObject(init.headers),
        "x-payment-signature": payment.signature,
        "x-payment-asset": payment.asset,
        "x-payment-amount": String(payment.paidAmount)
      }
    });

    await this.record(
      requirement,
      decision,
      payment.paidAmount,
      approval.source,
      retry.ok ? "paid" : "failed",
      payment.signature
    );

    return retry;
  }

  private async resolveApproval(requirement: X402PaymentRequirement, decision: PolicyDecision) {
    if (decision.status === "denied") {
      return { approved: false, approvedAmount: 0, source: "denied" as const };
    }

    if (decision.status === "approved") {
      return { approved: true, approvedAmount: decision.approvedAmount, source: "policy" as const };
    }

    if (!this.options.approvalProvider) {
      return { approved: false, approvedAmount: 0, source: "denied" as const };
    }

    const response = await this.options.approvalProvider.requestApproval({
      requestingApplication: this.options.requestingApplication,
      requestingActor: this.options.requestingActor,
      provider: requirement.provider,
      purpose: requirement.purpose,
      amount: requirement.amount,
      asset: requirement.asset
    });

    return {
      approved: response.approved,
      approvedAmount: response.approved ? response.approvedAmount : 0,
      source: response.approved ? "human" as const : "denied" as const
    };
  }

  private async record(
    requirement: X402PaymentRequirement,
    decision: PolicyDecision,
    approvedAmount: number,
    approvalSource: "policy" | "human" | "denied",
    result: "paid" | "denied" | "failed",
    transactionSignature?: string
  ) {
    await this.options.auditSink.record({
      requestingApplication: this.options.requestingApplication,
      requestingActor: this.options.requestingActor,
      purpose: requirement.purpose,
      provider: requirement.provider,
      requestedAmount: requirement.amount,
      approvedAmount,
      asset: requirement.asset,
      policyDecision: decision.status,
      approvalSource,
      transactionSignature,
      result
    });
  }
}

export function paymentRequiredResponse(requirement: X402PaymentRequirement): Response {
  return new Response(JSON.stringify(requirement), {
    status: 402,
    headers: {
      "content-type": "application/json",
      "x402-payment-required": "true"
    }
  });
}

async function parsePaymentRequirement(response: Response): Promise<X402PaymentRequirement> {
  const body = await response.json() as Partial<X402PaymentRequirement>;
  if (!body.provider || !body.recipient || !body.asset || !body.purpose || typeof body.amount !== "number") {
    throw new Error("Invalid x402 payment requirement.");
  }
  return body as X402PaymentRequirement;
}

function headersToObject(headers: HeadersInit | undefined): Record<string, string> {
  if (!headers) return {};
  if (headers instanceof Headers) return Object.fromEntries(headers.entries());
  if (Array.isArray(headers)) return Object.fromEntries(headers);
  return headers;
}
