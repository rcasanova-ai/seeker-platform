# Seeker Platform

Reusable shared integration platform for building products on Solana Seeker.

This repository is intentionally not owned by Santati, Toasty, or any single product. It provides shared Seeker-oriented primitives that product integrations can consume without absorbing product-specific business logic.

## Why This Exists

Solana Seeker creates opportunities for mobile-first agents, paid APIs, wallet-backed authorization, and device-native sessions. Those capabilities should be built once as reusable platform pieces, then consumed by products such as Santati and Toasty Studio.

## Shared-Platform Philosophy

- Keep wallet signing separate from identity.
- Keep payment policy separate from application intent.
- Keep human approval as a reusable contract, not a product-specific modal.
- Keep integrations thin, demonstrative, and replaceable.
- Deny spending when policy cannot be evaluated.
- Never expose, store, or mock private keys as real secrets.

## Architecture

The platform is organized as an npm TypeScript monorepo:

- `packages/*` contains reusable platform packages.
- `integrations/*` contains deliberately thin product integration scaffolds.
- `apps/*` contains reusable app foundations such as the Seeker mobile shell.
- `examples/*` contains runnable mocked flows.
- `docs/*` explains the architecture, security model, x402 flow, and wallet signing model.

## Package Responsibilities

- `@seeker-platform/seeker-wallet`: wallet connectivity and signing/payment abstraction for Solana Mobile Wallet Adapter and Seeker/Seed Vault compatible flows.
- `@seeker-platform/seeker-identity`: reusable Seeker identity/authentication abstraction, deliberately separate from wallet/payment authorization.
- `@seeker-platform/x402-client`: HTTP client that detects 402 payment requirements, evaluates policy, requests approval when needed, executes payment, retries, and returns the purchased resource.
- `@seeker-platform/payment-policy`: autonomous spending policy engine.
- `@seeker-platform/transaction-audit`: immutable-style audit event contracts and in-memory append-only store.
- `@seeker-platform/approval-ui`: contracts for explicit human approval.
- `@seeker-platform/mobile-session`: shared mobile session primitives.
- `@seeker-platform/seeker-mobile-shell`: portable state and registry foundation for a future Expo/React Native Seeker app.

## Consumers, Not Owners

Santati and Toasty Studio are consumers of this platform. Santati Phyll uses the paid-resource flow as a proof of concept. Toasty Studio uses this repository only to explore a Seeker mobile client path around its existing authoritative architecture.

## Current POC Status

Implemented:

- TypeScript workspace scaffolding.
- Wallet discovery, connection state, public key, signing/submission interfaces, capability detection, and explicit wallet errors.
- x402 client handling of malformed 402s, policy denial, approval escalation, payment failure, retry, and audit generation.
- Mock x402 paid API example.
- Human approval flow example.
- Thin Santati Phyll and Toasty Studio integration scaffolds.
- Seeker mobile shell state/registry foundation.
- Seeker engagement integration scaffold.

Mocked:

- Seeker wallet connection.
- Seed Vault signing.
- Real Solana transfers.
- Real x402 provider interoperability.
- Real Santati production integration.
- Real Toasty production integration.

Requires physical Seeker or compatible Android validation:

- Real Mobile Wallet Adapter authorization.
- Seed Vault-backed signing.
- Android deep-link behavior.
- Wallet discovery against installed mobile wallets.

## Development Roadmap

1. Replace mock wallet adapter with Solana Mobile Wallet Adapter integration.
2. Validate x402 payment request schema against production providers.
3. Add durable audit sinks.
4. Add Seeker-native human approval UI.
5. Add integration tests against sandbox payment providers.
6. Add product-specific adapters in consumer repositories, not here.

## Development Setup

```bash
npm install
npm run typecheck
npm test
npm run build
npm run lint:secrets
```

The current mobile shell is portable TypeScript. A future native shell should use the current Solana Mobile recommended React Native/Expo path and provide the `MobileWalletAdapterRuntime` implementation.

## Security Principles

- Never store private keys, seed phrases, wallet secrets, or bearer credentials.
- Treat payment requests as untrusted input.
- Deny by default when policy cannot be evaluated.
- Separate identity from spending authorization.
- Record audit events without secrets.
- Require explicit human approval above configured thresholds.
