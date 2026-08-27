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

## Implemented

- Resource request and HTTP 402 detection.
- Payment requirement parsing and validation.
- Policy evaluation.
- Autonomous approval.
- Human approval escalation.
- Injectable payment execution.
- Retry with payment proof headers.
- Audit event generation.
- Tests for malformed, denied, failed, approved, human-approved, and successful flows.

## Current x402/Solana Boundary

The repository installs the current x402 package family, including `@x402/core`, `@x402/fetch`, and `@x402/svm`. The shared client keeps payment execution injectable so a future Solana/SVM executor can use real x402 payment payloads and wallet signing without spending real funds in tests.

Reference docs:

- https://docs.x402.org/getting-started/quickstart-for-buyers
