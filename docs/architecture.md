# Architecture

`seeker-platform` is a shared TypeScript monorepo for Seeker-compatible product integrations.

## Flow

1. A product agent or mobile client requests a resource.
2. The provider may respond with HTTP 402 and a payment requirement.
3. `x402-client` parses the requirement.
4. `payment-policy` evaluates whether the spend is allowed.
5. `approval-ui` requests human approval when policy requires it.
6. `seeker-wallet` executes the payment through a wallet adapter.
7. `x402-client` retries the original request.
8. `transaction-audit` records the decision, signature, result, and purpose.

## Boundaries

Identity, payment authorization, wallet signing, policy decisions, and audit recording remain separate packages. Integrations are thin consumers and should not own shared Seeker behavior.
