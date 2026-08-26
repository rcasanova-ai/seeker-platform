# Wallet Signing

`@seeker-platform/seeker-wallet` defines wallet contracts for Seeker-compatible signing and payment execution.

The package is designed around Solana Mobile Wallet Adapter and Seeker/Seed Vault compatible flows, where private keys stay inside the wallet or secure device capability. This scaffold includes a mock adapter only.

Production adapters must never export or persist private keys.
