# Security Policy

## Scope

Tx404 is a non-custodial client SDK. It builds requests for a user's privacy-enabled Starknet wallet; it does not receive or store viewing keys, signing keys, notes, proofs, wallet signatures, or user funds.

Security-sensitive areas include Wallet API action construction, address and amount normalization, capability detection, adapter validation, privacy disclosures, and transaction result handling.

## Reporting

Do not open a public issue for a vulnerability. Use GitHub's private vulnerability reporting for this repository. Include affected versions, reproduction steps, impact, and any suggested mitigation.

## Adapter Boundary

`@tx404/core` does not make arbitrary contracts private. Each protocol adapter expands the trust and audit surface. The AVNU adapter delegates to AVNU's first-party private-swap route. Custom production anonymizers remain the integrating team's responsibility to review, test, audit, deploy, and maintain.

## Key Material

Reports or examples must never include real private keys, viewing keys, wallet signatures, paymaster API keys, or RPC credentials. Paymaster API keys belong in server-only code.
