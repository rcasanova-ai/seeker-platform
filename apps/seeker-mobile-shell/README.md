# Seeker Mobile Shell

Reusable mobile application foundation for Seeker integrations.

Official Solana Mobile documentation currently recommends React Native/Expo for mobile dApps and Mobile Wallet Adapter 2.0 for wallet interactions. This package keeps the shell's shared state and registry logic in portable TypeScript so it can be consumed by a future Expo/React Native app without making repository-wide Node tests depend on native mobile tooling.

This shell is not branded as Santati or Toasty.

## Provides

- Wallet connection state.
- Identity/session state.
- Network status.
- Wallet address projection.
- Pending transaction approval requests.
- Recent transaction/activity history.
- Deep-link handling foundation.
- Integration capability registry.

## Requires Device Validation

Real wallet authorization, Seed Vault-backed signing, deep links on Android, and Seeker-specific device behavior require physical Seeker hardware or compatible Android wallet tooling.
