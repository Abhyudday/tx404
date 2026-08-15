# Tx404 Release Runbook

## Package Release

1. Confirm `npm run verify` and `npm run pack:check` pass from a clean checkout.
2. Review generated tarball contents; only `dist`, package metadata, and package README should ship.
3. Verify peer dependency compatibility against the current Wallet API, starknet.js, and AVNU releases.
4. Bump all Tx404 package versions together while the React and adapter packages require exact `@tx404/core` compatibility.
5. Publish core first, React second, and adapters last.
6. Install the published versions in an external checkout and repeat the consumer smoke test.

No package publication is performed automatically by CI. Registry authentication and release approval remain manual.

## Sepolia Acceptance

Use Ready wallet and two controlled test accounts.

1. Confirm capability detection reports Wallet API `>= 0.10.3` without a balance prompt.
2. Shield a small test amount and observe the separate ERC-20 approval and deposit prompts.
3. Explicitly request the selected token's shielded balance.
4. Wait for note maturity before spending.
5. Transfer privately to the second registered account.
6. Unshield a small amount and confirm the public recipient/token/amount disclosure.
7. Reject one wallet prompt and verify `USER_REJECTED` behavior.
8. Exercise a bounded confirmation timeout and verify the explorer fallback.
9. Test AVNU only with an already-shielded sell token and a quote for the connected chain.
10. Save public transaction hashes only; never save wallet payloads or private state.

## Mainnet Gate

Mainnet requires explicit owner approval immediately before any action.

1. Re-check the canonical pool address against STRK20 by Example, the official explorer, and the network-labelled SDK constant.
2. Re-check Wallet API support, package versions, pool fee, RPC chain ID, and AVNU constants.
3. Execute at least three small, intentional pool transactions: shield, private transfer/payment, and unshield or the reference adapter.
4. Confirm each transaction touched the canonical pool before adding its hash to `strk20.json`.
5. Never automate or script wallet signatures for submission evidence.

## Deployment and Demo

1. Deploy the Next.js demo with `NEXT_PUBLIC_PROVIDER_URL` configured in the platform secret store.
2. Do not expose a paymaster API key as a `NEXT_PUBLIC_` variable. Use server-only routes for sponsored AVNU operations.
3. Set the repository Website field to the deployed URL.
4. Add `demo_url` only if hackathon auto-detection does not find the deployment.
5. Record a three-minute walkthrough covering installation, checkout integration, wallet-owned signing, privacy boundaries, and verified mainnet evidence.
6. Add the final video URL and verified transaction hashes to `strk20.json` before the deadline.
