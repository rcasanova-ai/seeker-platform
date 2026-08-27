# Security Model

This repository does not store private keys, seed phrases, or wallet secrets.

## Principles

- Wallet adapters must delegate signing to Seeker/Seed Vault compatible wallet flows.
- Payment requests are untrusted input.
- Policy evaluation denies when inputs are incomplete or unsupported.
- Human approval is required above configured thresholds.
- Audit events must not contain secrets.
- Identity is not payment authorization.

## Current Status

The current implementation uses mock wallet and provider flows for automated tests. It is not production-ready for real money.

## Hardware Boundary

Seeker/Seed Vault signing must be validated on physical Seeker hardware or compatible Android wallet tooling. The application receives public keys and signatures, not private keys.
