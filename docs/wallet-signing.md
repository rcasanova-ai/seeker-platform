# Wallet Signing

`@seeker-platform/seeker-wallet` defines wallet contracts for Seeker-compatible signing and payment execution.

The package is designed around Solana Mobile Wallet Adapter 2.0 and Seeker/Seed Vault compatible flows, where private keys stay inside the wallet or secure device capability.

## Implemented

- Wallet discovery contract.
- Connection/session state.
- Public key retrieval.
- Transaction signing interface.
- Transaction submission interface.
- Capability detection.
- Explicit wallet error codes.
- Mock wallet for local tests.
- `MobileWalletAdapterRuntime` boundary for a real mobile runtime.

## Requires Seeker Validation

Real wallet discovery, authorization, Seed Vault-backed signing, and Android deep-link behavior require physical Seeker hardware or compatible Android tooling.

Production adapters must never export, persist, log, or derive private keys.

Reference docs:

- https://docs.solanamobile.com/developers/mobile-wallet-adapter
- https://docs.solanamobile.com/get-started/react-native/create-solana-mobile-app
