# STRK20 Privacy Integration Plan - Tx404

Generated 2026-08-14 by the strk20-privacy-integration skill. Package and wallet statuses are time-sensitive and must be re-verified before each release.

## 1. Project snapshot

- Stack: Next.js 16, React 19, TypeScript 5.9, starknet.js 10.4.0, get-starknet 6.0.2, Wallet API types 0.10.3, and one Cairo `privacy_invoke` reference helper. There is no backend account or key-management service.
- Wallet connection: `src/app/components/client/WalletHandle/SelectWallet.tsx` discovers wallets and constructs `WalletAccountV6`.
- Transaction layer: `src/app/components/client/WalletHandle/WalletAccountV6Tag.tsx` requests shield, unshield, private transfer, shielded balance, and reference invoke actions from the connected wallet.
- Configuration: `src/utils/constants.ts` contains DEMO-labelled token, network, and helper values. No pool address is hardcoded in application verification logic.
- Reference contract: `cairo/src/lib.cairo` implements the sprint's single demonstration `privacy_invoke` flow. It is not a generic anonymizer.
- Privacy goal: keep end-user balances, transfer history, transfer amount and token, and counterparties private inside the STRK20 pool. Tx404 itself has no custodial user account and never receives a viewing key or signing key.
- Environment: Sepolia while building, Ready wallet first, and graceful degradation for wallets without Wallet API 0.10.3 support. Mainnet requires explicit owner approval at the time of use.

## 2. Chosen route: Privacy Wallet API via starknet.js

Tx404 is infrastructure embedded by normal dapps whose users connect their own wallets. `WalletAccountV6` is therefore the correct route: the wallet manages registration, viewing keys, notes, proof generation, and signing while Tx404 only requests actions. The reference DeFi flow additionally uses one app-specific anonymizer contract; production integrations must supply and audit their own helper rather than treating Tx404 as a generic contract anonymizer.

**The rule this follows:** Tx404 never touches a user's viewing key, signing key, notes, or proofs. The user's wallet acts through starknet.js.

## 3. What this delivers - hidden vs visible

| Private | Public |
|---|---|
| Sender, receiver, amount, token, and spent notes for transfers entirely inside the pool | Shield and unshield addresses, token amounts, and public ERC-20 legs |
| Shielded balances and transfer history, disclosed by the wallet only after user consent | The fact and timing of pool interactions |
| End-user address behind the reference `privacy_invoke` action | The helper interaction and open-note token/amount may be visible |

Shielding and a later private transfer should remain separate by default: combining them improves immediacy but makes the public deposit easier to correlate with the private transfer. Private transactions are relayed, so user activity must never be attributed from the transaction sender; any future history indexer must read the pool `Deposit` event and filter on its first indexed key.

## 4. Prerequisites and versions

- `starknet@10.4.0`
- `@starknet-io/get-starknet-discovery@6.0.2` and `@starknet-io/get-starknet-wallet-standard@6.0.2`, inherited from the tested starter. The current `next` release is 6.0.4; verify compatibility and upgrade together before release.
- `@starknet-io/types-js@0.10.3`
- Ready extension for wallet testing
- Node.js 22 or newer for the Next.js application
- Scarb toolchain only for team-owned reference-contract development

## 5. Phase 1 - core primitives

Status: implemented in the imported starter baseline; headless and wallet verification remain.

1. Discover supported wallets and construct `WalletAccountV6` in `SelectWallet.tsx`.
2. Detect STRK20 support with the wallet API version, without reading balances as a capability probe.
3. Request shield, private transfer, unshield, and shielded balances in `WalletAccountV6Tag.tsx`.
4. Keep unsupported-wallet behavior explicit and non-destructive; Ready is the first supported path.
5. Explain the two shield signatures (ERC-20 approval, then deposit), note maturity, pool fees, and screening failures in transaction state copy before production release.

## 6. Phase 2 - embeddable SDK surface

Status: implemented with `@tx404/core`, `@tx404/react`, typed errors, privacy disclosures, tests, publishable bundles, and a consumer smoke fixture.

1. Extract the transaction request shapes from `WalletAccountV6Tag.tsx` into a small typed client API without moving key, note, or proof handling out of the wallet.
2. Keep React adapters thin and expose shield, unshield, private transfer, and consented balance query as the only sprint primitives.
3. Add unit tests for action construction, address normalization, unsupported-wallet behavior, timeout behavior, and error mapping.
4. Re-check pool fees at runtime with `get_fee_amount`; never hardcode fee assumptions.

## 7. Phase 3 - one reference privacy_invoke flow

Status: echo-shaped conformance demonstration exists and an AVNU first-party private-swap adapter is implemented. Live wallet acceptance remains pending.

- Specify one protocol action as input token -> action -> output token, including approvals, balance-delta accounting, slippage constraints, and atomic rollback.
- Check for a first-party private route before adopting a custom helper. AVNU private swaps currently provide one such route without a Tx404-owned anonymizer.
- If a custom helper is retained, the Tx404 team owns its review, tests, audit, deployment, and maintenance. Audit and explicit mainnet approval are mandatory before deployment.
- Record deployed addresses in `strk20.json`; record only verified mainnet transactions that touched the canonical pool.

## 8. Testing

1. Run install, TypeScript/build checks, and any Cairo tests available in the repository.
2. On Sepolia, verify wallet connect, rejection, unsupported-wallet fallback, shield approval/deposit prompts, note maturity, balance consent, private transfer, unshield, and reference invoke rollback.
3. Compare behavior with the Wallet test dapp and Ready extension. A local devnet does not exercise hosted wallet proving.
4. Do not submit a mainnet action without explicit owner approval. Before the sprint deadline, separately verify the canonical pool address against the DEMO-labelled starter constants and strk20-by-example.org, then collect at least three real mainnet transaction hashes in `strk20.json`.

## 9. Compliance and security notes

- Deposit screening is enforced onchain by the protocol and applies on every route. Self-hosted proving does not bypass it.
- Selective disclosure can support a legitimate regulatory request; it is not automatic compliance or regulator endorsement. The integrating app owns its legal decisions and use-case-specific controls.
- Tx404 never stores private keys, viewing keys, wallet signatures, proofs, or user funds. Environment files and local agent configuration are excluded from Git.
- The team owns review, audit, deployment, and maintenance of any production anonymizer contract.

## 10. Open items to re-verify

- Compatibility and migration from get-starknet 6.0.2 to the current 6.0.4 release.
- Xverse dapp-facing Wallet API status; Ready remains the tested wallet until verified otherwise.
- Wallet API support for private sub-accounts; it is outside this sprint until the wallet-facing API ships.
- Current pool fee and paymaster behavior.
- Canonical mainnet pool and helper addresses before verification logic or `strk20.json` entries are added.

## 11. Links

- Wallet API overview: https://strk20-by-example.org/starknet-wallet-api/overview
- starknet.js WalletAccountV6: https://strk20-by-example.org/starknet-wallet-api/starknet-js
- Private DeFi flow: https://strk20-by-example.org/starknet-wallet-api/private-defi
- Anonymizer contract anatomy: https://strk20-by-example.org/helpers/privacy-invoke
- Privacy model and limits: https://strk20-by-example.org/what-is-strk20
- Wallet test dapp: https://starknet-wallet-account.vercel.app/
- Privacy SDK references: https://github.com/starkware-libs/starknet-privacy
