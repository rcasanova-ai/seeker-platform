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

## Current Foundation

`@seeker-platform/seeker-wallet` now exposes discovery, connection, public key retrieval, transaction signing, transaction submission, connection state, capability detection, and explicit wallet errors. The production boundary is `MobileWalletAdapterRuntime`, which lets a Seeker/Android mobile shell provide the official Solana Mobile Wallet Adapter runtime while tests use mocks.

`@seeker-platform/x402-client` now handles malformed 402 bodies, unsupported requirements, policy denial, autonomous approval, human approval, wallet/payment failures, retry, and audit generation. Payment execution remains injectable so tests do not spend real funds.

`apps/seeker-mobile-shell` is a portable shell-state foundation for an Expo/React Native Seeker app. It tracks wallet state, identity/session state, network status, pending approvals, recent activity, deep links, and registered integration capabilities.

`integrations/seeker-engagement` is a small proof integration for authenticated mobile sessions, deep links, notification-ready contracts, approval events, activity events, and integration-triggered actions.

## Current Official Dependency Direction

The wallet boundary is based on current Solana Mobile guidance for Mobile Wallet Adapter 2.0 and the current npm packages:

- `@solana-mobile/mobile-wallet-adapter-protocol`
- `@solana-mobile/mobile-wallet-adapter-protocol-kit`
- `@solana/kit`

The x402 foundation tracks the current x402 package family:

- `@x402/core`
- `@x402/fetch`
- `@x402/svm`

The code does not claim production interoperability until tested against real providers and devices.

Reference docs checked during this update:

- Solana Mobile Wallet Adapter: https://docs.solanamobile.com/developers/mobile-wallet-adapter
- Solana Mobile React Native setup: https://docs.solanamobile.com/get-started/react-native/create-solana-mobile-app
- x402 buyer quickstart: https://docs.x402.org/getting-started/quickstart-for-buyers
