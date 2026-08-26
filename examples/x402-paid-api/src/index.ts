import { paymentRequiredResponse } from "@seeker-platform/x402-client";

export async function mockPaidApi(_input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  if (!headers.has("x-payment-signature")) {
    return paymentRequiredResponse({
      provider: "verification.example",
      recipient: "mock-paid-api-recipient",
      amount: 0.01,
      asset: "USD",
      purpose: "mock paid API resource"
    });
  }

  return Response.json({
    resource: "purchased mock API result",
    paid: true
  });
}
