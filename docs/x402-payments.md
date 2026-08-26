# x402 Payments

The `@seeker-platform/x402-client` package models an HTTP x402 flow:

1. Send the original request.
2. Detect `402 Payment Required`.
3. Parse provider, asset, amount, recipient, and purpose.
4. Evaluate payment policy.
5. Request explicit approval when required.
6. Ask the wallet abstraction to pay.
7. Retry the original request with payment proof.
8. Return the purchased resource.

The example provider is mocked and does not require real money.
