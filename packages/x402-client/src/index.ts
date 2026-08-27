import type { HumanApprovalProvider } from "@seeker-platform/approval-ui";
import type { PaymentPolicyEngine, PolicyDecision } from "@seeker-platform/payment-policy";
import type { PaymentInstruction, SeekerWallet, SignedPayment } from "@seeker-platform/seeker-wallet";
import type { TransactionAuditSink } from "@seeker-platform/transaction-audit";

export interface X402PaymentRequirement {
  provider: string;
  recipient: string;
  amount: number;
  asset: string;
  purpose: string;
  paymentUrl?: string;
}

export interface PaymentExecutor {
  execute(instruction: PaymentInstruction, wallet: SeekerWallet): Promise<SignedPayment>;
}

export interface X402ClientOptions {
  requestingApplication: string;
  requestingActor: string;
  policyEngine: PaymentPolicyEngine;
  wallet: SeekerWallet;
  auditSink: TransactionAuditSink;
  approvalProvider?: HumanApprovalProvider;
  paymentExecutor?: PaymentExecutor;
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

    const requirement = await parsePaymentRequirement(initial).catch((error) => {
      throw new X402ClientError("Malformed x402 payment requirement.", "MALFORMED_PAYMENT_REQUIREMENT", error);
    });
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
      throw new X402ClientError(`Payment denied: ${decision.reason}`, "PAYMENT_DENIED");
    }

    const payment = await this.executePayment(requirement, approval.approvedAmount, approval.source);

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

  private async executePayment(
    requirement: X402PaymentRequirement,
    approvedAmount: number,
    approvalSource: "policy" | "human" | "denied"
  ): Promise<SignedPayment> {
    try {
      await this.options.wallet.connect();
      const instruction = {
        provider: requirement.provider,
        recipient: requirement.recipient,
        amount: approvedAmount,
        asset: requirement.asset,
        purpose: requirement.purpose,
        reference: requirement.paymentUrl
      };

      return await (this.options.paymentExecutor
        ? this.options.paymentExecutor.execute(instruction, this.options.wallet)
        : this.options.wallet.pay(instruction));
    } catch (error) {
      await this.record(
        requirement,
        { status: "approved", approvedAmount, reason: "Payment execution failed after approval." },
        approvedAmount,
        approvalSource,
        "failed"
      );
      throw new X402ClientError("Payment execution failed.", "PAYMENT_EXECUTION_FAILED", error);
    }
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

export class X402ClientError extends Error {
  constructor(
    message: string,
    readonly code:
      | "MALFORMED_PAYMENT_REQUIREMENT"
      | "PAYMENT_DENIED"
      | "PAYMENT_EXECUTION_FAILED",
    readonly cause?: unknown
  ) {
    super(message);
    this.name = "X402ClientError";
  }
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
