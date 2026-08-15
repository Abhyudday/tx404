# Tx404 Product and Delivery Plan

Updated 2026-08-14. This plan turns Tx404 from a starter-kit UI into a drop-in privacy SDK for Starknet applications. `STRK20_INTEGRATION_PLAN.md` remains the protocol-integration and security reference; this document defines the product, package boundaries, public API, delivery sequence, and hackathon submission strategy.

## 1. Product thesis

Tx404 gives a Web3 startup a small, typed API for adding private payments to an existing Starknet application:

```ts
const tx404 = createTx404({ walletAccount })

await tx404.shield({ token, amount })
await tx404.transfer({ token, amount, recipient })
await tx404.unshield({ token, amount, recipient })
const balances = await tx404.getBalances({ tokens: [token] })
```

The startup keeps its existing wallet and product UI. Tx404 translates product-level operations into Starknet Wallet API requests; the user's privacy-enabled wallet owns registration, viewing keys, note discovery, proof generation, and signing.

Tx404 is not a hosted custodian, relayer, wallet, or universal anonymizer. The phrase "any Web3 startup" means any startup that can settle a payment or supported action on Starknet through a compatible user wallet. It does not mean Tx404 can hide arbitrary transactions on every chain or call any Starknet contract privately without an app-specific integration.

## 2. Target customers and first workflows

Primary adopter: a frontend team with an existing Starknet dapp and users who connect their own wallets.

First supported workflows:

1. Private P2P or marketplace payment: transfer an already-shielded ERC-20 to a registered recipient.
2. Private checkout: a merchant supplies recipient, token, amount, and order reference; Tx404 handles capability checks and the private transfer request.
3. Shield before spending: move a public ERC-20 balance into STRK20 as a separate, visibly public edge transaction.
4. Unshield to a public recipient: explicitly disclose the public withdrawal edge.
5. Shielded balance display: request only specified token balances after deliberate user consent.
6. One reference private DeFi action: AVNU private swap for already-shielded funds, using AVNU's deployed executor rather than claiming generic `privacy_invoke` support.

Deferred workflows:

- Recurring subscriptions, payroll batches, escrow, and payment links can be built from the core payment API after the single-payment path is reliable.
- EVM-to-pool funding may later use the early Starknet Privacy Bridge. It is not part of the sprint's stable API.
- Private sub-accounts remain unavailable to normal Wallet API dapps until a wallet-facing method ships.
- Lending, staking, vaults, and custom protocol calls require a first-party private route or a separately reviewed and audited anonymizer adapter.

## 3. Privacy contract with integrators

| Flow | Private | Public |
|---|---|---|
| In-pool transfer/payment | Sender, recipient, token, amount, and spent notes | Timing and the fact that a relayed pool transaction occurred |
| Shield | Resulting note and later in-pool movement | Depositor, token, amount, approval, and timing |
| Unshield | Prior private history | Withdrawal recipient, token, amount, and timing |
| Shielded balance query | Data is returned only through wallet-mediated consent | The dapp learns the balances the user approved sharing |
| AVNU private swap | Link from the user's address to the swap | Swap route/activity and open-note output amount may be visible |

Tx404 must expose these boundaries in documentation and operation metadata. It must not label shield or unshield edges as fully private, attribute a relayed transaction's sender to the user, or imply that selective disclosure is automatic compliance.

## 4. Architecture

```text
Integrating dapp
  -> @tx404/core              framework-neutral payment API
  -> @tx404/react             provider, hooks, optional unstyled controls
  -> starknet.js WalletAccountV6
  -> privacy-enabled wallet   keys, notes, discovery, proving, signing
  -> STRK20 pool              shielded settlement

Optional explicit adapter
  -> @tx404/adapter-avnu      first-party private swap route
  -> AVNU executor/paymaster

Demo application
  -> apps/demo                adopter-facing checkout and primitive explorer
```

### Trust boundaries

- The integrator supplies an already-connected `WalletAccountV6`; core never asks for or accepts a viewing key or private key.
- Tx404's browser code builds Wallet API actions and receives transaction hashes and consented balance results.
- No Tx404 backend is required for core operations.
- A future backend may serve public configuration, payment-request metadata, adapter manifests, or server-side AVNU fee submission. It must never sign for users, store viewing keys, receive user funds, or proxy balance queries.
- RPC URLs and public contract metadata are configuration. Secret API keys remain server-side or in ignored environment files as appropriate.

## 5. Package layout

Move toward an npm-workspace monorepo without rewriting the working demo in one step:

```text
packages/
  core/
    src/client.ts
    src/actions.ts
    src/capabilities.ts
    src/errors.ts
    src/types.ts
  react/
    src/Tx404Provider.tsx
    src/hooks/
    src/components/       # optional unstyled primitives, not required by core
  adapter-avnu/
    src/index.ts
apps/
  demo/                   # current Next.js app migrated after core extraction
examples/
  next-checkout/          # minimal adopter integration
cairo/
  src/lib.cairo           # conformance-only echo helper, clearly labelled demo
```

Sprint publishing can start with `@tx404/core` and `@tx404/react`. The AVNU adapter can remain in-repo until its browser/server split is proven. Do not publish the low-level StarkWare Privacy SDK as a transitive dependency: that route requires viewing keys and is for wallets or controlled accounts, not normal dapps.

## 6. Public SDK design

### Client construction

```ts
type Tx404Config = {
  walletAccount: WalletAccountV6
  network: "sepolia" | "mainnet"
  confirmation?: {
    timeoutMs?: number
    pollIntervalMs?: number
  }
}

const tx404 = createTx404(config)
```

An explicit network is required and must match the wallet before submission. Mainnet defaults are never inferred during development.

### Stable sprint API

```ts
tx404.getCapabilities(): Promise<Tx404Capabilities>

tx404.shield(input: {
  token: Address
  amount: Amount
}): Promise<Tx404Submission>

tx404.transfer(input: {
  token: Address
  amount: Amount
  recipient: Address
}): Promise<Tx404Submission>

tx404.unshield(input: {
  token: Address
  amount: Amount
  recipient: Address
}): Promise<Tx404Submission>

tx404.getBalances(input: {
  tokens: Address[]
}): Promise<Tx404Balance[]>

tx404.prepareInvoke(input: Tx404InvokeRequest): Promise<Tx404Preparation>
tx404.invoke(input: Tx404InvokeRequest): Promise<Tx404Submission>
```

`getCapabilities` uses wallet API version/spec support only. It must never call `strk20Balances` as a feature probe because balance reads request access to private user data.

### Payment convenience API

The convenience layer adds product semantics without changing settlement:

```ts
await tx404.pay({
  recipient,
  token,
  amount,
  reference: "order_123", // local metadata only; never added onchain by default
})
```

`pay` is an alias over private transfer plus validation and lifecycle events. The reference is returned to the integrator for local correlation and must not be inserted into public calldata unless the integrator explicitly chooses disclosure.

### Adapter contract

Adapters are allowlisted action builders, not arbitrary callbacks that receive internal state:

```ts
interface Tx404Adapter<TInput> {
  readonly id: string
  readonly supportedNetworks: readonly Tx404Network[]
  validate(input: TInput, context: PublicAdapterContext): void
  build(input: TInput, context: PublicAdapterContext): STRK20_ACTION[]
  describePrivacy(input: TInput): PrivacyDisclosure
}
```

An adapter receives public addresses and operation inputs only. It cannot access keys, notes, proofs, or raw balance consent. Core validates action order, permits at most one invoke action, preserves literal placeholders such as `${poolAddress}` and `${openNoteIds[0]}`, and rejects unsupported networks.

### Results and lifecycle

Every write returns a consistent result:

```ts
type Tx404Submission = {
  transactionHash: string
  operation: "shield" | "transfer" | "unshield" | "invoke"
  network: Tx404Network
  status: "submitted"
  wait(options?: WaitOptions): Promise<Tx404Receipt>
}
```

Do not block the initial method until final confirmation. Paymaster-relayed transactions can be slow to appear through an RPC; `wait` has a finite timeout and returns a submitted/unknown state with an explorer URL rather than treating timeout as transaction failure.

### Error model

Expose typed, actionable errors:

- `WALLET_NOT_CONNECTED`
- `PRIVACY_UNSUPPORTED`
- `NETWORK_MISMATCH`
- `INVALID_ADDRESS`
- `INVALID_AMOUNT`
- `USER_REJECTED`
- `SCREENING_REJECTED`
- `INSUFFICIENT_PUBLIC_BALANCE`
- `INSUFFICIENT_SHIELDED_BALANCE`
- `NOTE_NOT_MATURE`
- `POOL_FEE_REQUIRED`
- `SUBMISSION_FAILED`
- `CONFIRMATION_TIMEOUT`
- `ADAPTER_UNSUPPORTED`

Keep the original error as `cause`, but do not expose raw wallet payloads through telemetry by default.

## 7. React integration

The React package should be a thin adapter over core:

```tsx
<Tx404Provider walletAccount={walletAccount} network="sepolia">
  <Checkout />
</Tx404Provider>
```

Hooks:

- `useTx404()` returns the core client and capabilities.
- `useShield()` returns `execute`, status, result, and typed error.
- `usePrivateTransfer()` supports payment and raw transfer inputs.
- `useUnshield()` exposes the public-edge disclosure before execution.
- `useShieldedBalances(tokens)` never runs until explicitly enabled by user action.
- `useTx404Adapter(adapter)` runs one registered reference action.

Optional components should be unstyled or CSS-variable-driven: `ShieldButton`, `PrivatePayButton`, `UnshieldButton`, `ShieldedBalance`, and `PrivacyDisclosure`. Startups must be able to use the hooks without adopting Tx404's demo visual design.

## 8. Reference integration

The sprint needs one credible adopter flow, not another generic dashboard.

Build `examples/next-checkout` as a small merchant checkout:

1. The merchant creates a payment request with recipient, accepted token, amount, and local order ID.
2. The customer connects a Ready wallet.
3. Tx404 reports whether private payments are supported without reading balances.
4. The customer explicitly requests the needed token balance.
5. The customer pays from an existing shielded balance.
6. The merchant UI receives the submitted hash and confirms settlement without claiming the relayer sender is the customer.
7. A separate action demonstrates shielding and clearly marks its public edge.
8. The optional AVNU adapter swaps an already-shielded token before settlement, subject to available quote/paymaster support.

The existing echo helper remains a conformance demo for `privacy_invoke`, not the product's headline. AVNU is the preferred sprint reference because it is a real deployed private route and avoids shipping unaudited custom Cairo. If AVNU cannot be verified end to end on the target network, keep the core private checkout as the judged product and show the echo flow only as a technical adapter demonstration.

## 9. Delivery phases

### Phase 0 - plan and baseline (complete)

- Public repository, MIT license, registration PR, `strk20.json`, starter integration, and protocol plan exist.
- TypeScript and production build pass.

Exit criterion: current demo remains buildable before extraction.

### Phase 1 - framework-neutral core

Status: implemented in the current repository; packaging and external consumer smoke testing remain.

1. Create `packages/core` with address/amount normalization, action builders, capability detection, submission, finite confirmation wait, and typed errors.
2. Extract shield, transfer, unshield, and balance logic from `WalletAccountV6Tag.tsx`; the component calls core instead of constructing actions directly.
3. Require dependency injection of `WalletAccountV6`; do not put wallet discovery inside core.
4. Add Vitest tests with a fake wallet account for exact Wallet API action payloads and error mapping.

Exit criterion: the demo uses only public core methods for all four primitives, and core has no React or Next.js imports.

### Phase 2 - React plugin and checkout example

Status: initial provider, hooks, and checkout integration example implemented; visual integration and clean consumer-package install remain.

1. Build provider and hooks around a single core client instance.
2. Add an unstyled private-pay control with explicit privacy disclosure.
3. Create `examples/next-checkout` with configurable token, amount, and merchant recipient.
4. Document installation in an existing Next.js app in under ten steps.

Exit criterion: a second app can install local packages and complete a private payment without importing demo internals.

### Phase 3 - one real adapter

Status: AVNU adapter, server-only paymaster helpers, package builds, tests, and privacy disclosures implemented. Live wallet execution remains part of Phase 4 acceptance.

1. Implement an adapter registry and generic `prepareInvoke` dry run.
2. Add AVNU private swap as the only promoted adapter, pinning `@avnu/avnu-sdk >= 4.2.0` after compatibility verification.
3. Keep prover work client-side and any paymaster API key path server-side.
4. Document that the sell token must already be shielded and that swap activity/open-note amount may be public.

Exit criterion: one adapter runs end to end or is explicitly excluded from the live demo with the blocker documented. No second adapter is started during the sprint.

### Phase 4 - Sepolia acceptance

Status: automated checks and acceptance runbook implemented; manual Ready wallet and two-account network execution pending.

Verify with Ready wallet:

- capability detection and unsupported-wallet fallback;
- shield approval followed by deposit as two user-visible steps;
- consented balance read for specified tokens only;
- note maturity handling;
- private payment to a second registered account;
- unshield to a public recipient;
- rejection, screening failure, RPC delay, and confirmation timeout states;
- reference invoke dry run, success, and atomic rollback where testable.

Exit criterion: reproducible test checklist with transaction hashes and no secret material in logs or repository history.

### Phase 5 - mainnet and submission

Status: runbook and deploy-ready application implemented. Blocked on explicit mainnet approval, wallet signatures, external deployment credentials, and demo recording.

Mainnet requires explicit owner approval immediately before execution.

1. Re-verify the canonical pool address against the starter's DEMO-labelled constants, STRK20 by Example, and the official explorer.
2. Re-verify Ready support, Wallet API spec, starknet.js/get-starknet versions, pool fee, AVNU constants, and RPC chain ID.
3. Execute at least three real mainnet operations that touch the pool, ideally shield, private transfer/payment, and unshield or reference invoke.
4. Add only confirmed mainnet hashes to `strk20.json`.
5. Deploy the demo, set repository Website metadata, and add the URL to `strk20.json` only if auto-detection does not find it.
6. Record a three-minute walkthrough: install SDK, integrate checkout, show wallet ownership of signing, run private payment, inspect public/private boundaries, and show mainnet evidence.

Exit criterion: live product, three or more verified pool transactions, complete README/API docs, demo URL, and demo video before August 31 at 23:59 UTC.

## 10. Testing strategy

Unit tests:

- exact action construction for each primitive;
- address normalization by numeric value rather than string spelling;
- decimal-to-base-unit handling without floating point;
- wallet API capability version parsing;
- no balance read during capability detection;
- network mismatch and unsupported wallet rejection;
- placeholder preservation and one-invoke limit;
- error classification and redaction;
- finite confirmation timeout.

Integration tests:

- fake `WalletAccountV6` contract tests for submission/result behavior;
- Next.js example build against packaged exports;
- React hook state transitions for idle, prompting, submitted, confirmed, rejected, and timed out;
- package smoke test from a clean consumer fixture.

Wallet/network tests:

- Ready extension on Sepolia first;
- wallet test dapp comparison;
- manual multi-account payment test;
- explicitly approved mainnet smoke test.

Cairo tests apply only to the demonstration helper. A production anonymizer needs its own Starknet Foundry tests, failure/rollback tests, review, and audit outside core SDK acceptance.

## 11. Security and data handling

- Never accept, derive, persist, log, or transmit an end user's viewing key or signing key.
- Never accept raw discovered notes or proofs in the public dapp API.
- Never auto-run `getBalances`; it is a consented operation.
- Never hardcode a contract address without network-labelled source and independent verification.
- Never combine shield and payment by default. Offer composition only later with an explicit linkage warning.
- Never put order IDs, invoices, memos, or customer identifiers onchain by default.
- Never identify the user from the private transaction sender; private transactions are relayed.
- Keep analytics opt-in and limited to SDK version, operation category, network, timing, and normalized error code. Exclude addresses, amounts, tokens, transaction calldata, balances, and wallet payloads.
- Publish a security policy and document that custom adapters expand the integrator's trust and audit surface.

## 12. Developer experience requirements

The SDK succeeds only if adoption is materially easier than copying the starter kit.

- One constructor, four core methods, one capabilities call.
- Framework-neutral core with optional React package.
- No required Tx404 account, dashboard, API key, or backend for core payments.
- Explicit peer dependency versions and an automated compatibility matrix.
- Runnable examples and copy-paste snippets tested in CI.
- Typed errors and operation state rather than raw wallet JSON.
- A privacy disclosure object available to integrator UIs for every operation.
- Tree-shakeable ESM output, declaration files, source maps, and package export maps.
- Semver: core primitives stable at `0.1.x`; adapters marked experimental until mainnet-tested.

## 13. Hackathon score strategy

### STRK20 integration depth - 30%

- Use Wallet API capability detection, all four core primitives, balance consent, typed action construction, dry-run invoke, and one real adapter.
- Demonstrate correct note maturity, fee, relayer, open-note, and hidden-versus-visible behavior.

### Working mainnet product - 30%

- Prioritize a complete private checkout over extra components.
- Record at least three verified mainnet pool transactions in `strk20.json`.
- Keep a deployed demo usable with Ready wallet and a deterministic fallback when unsupported.

### Innovation - 25%

- Make privacy an installable product capability rather than a standalone wallet or one-off dapp.
- Provide operation-level privacy disclosures and adapter boundaries that prevent integrations from overclaiming privacy.
- Prove portability with a separate checkout example consuming packaged APIs.

### Documentation and open source - 15%

- Publish API reference, ten-step quickstart, architecture/trust-boundary diagram, privacy model, adapter guide, security policy, contributing guide, and test evidence.
- Keep all sprint work public and make package/example builds reproducible in CI.

## 14. Success metrics

Sprint metrics:

- A clean consumer app reaches a private payment with no copied internal code.
- Four core primitives exposed through framework-neutral TypeScript.
- One React checkout integration and one reference adapter.
- Ready Sepolia acceptance checklist complete.
- Three or more verified mainnet pool transactions.
- Public demo and three-minute walkthrough.

Post-sprint metrics:

- Time to first successful private payment.
- Number of external applications using `@tx404/core`.
- Successful operation rate by wallet/API version without collecting user financial data.
- Number of reviewed adapters with explicit privacy disclosures.

## 15. Key risks and mitigations

| Risk | Mitigation |
|---|---|
| Wallet support is narrow | Ready-first testing, capability detection, graceful fallback, no fake support claims |
| Ecosystem versions drift during sprint | Pin known versions, run freshness checks, maintain a tested compatibility table |
| "Universal privacy" overpromise | Define Starknet settlement boundary and explicit adapter model in every public description |
| Users expect shield/unshield edges to be hidden | Return and render operation-specific privacy disclosures |
| Fresh notes cannot be spent immediately | Detect/describe maturity and keep shield separate from payment by default |
| Pool fees make small payments impractical | Query current fee, show it before confirmation, avoid hardcoded fee assumptions |
| Relayed transaction confirmation is delayed | Return hash immediately, bounded wait, explorer fallback |
| Custom anonymizer creates audit risk | Promote first-party AVNU route; keep echo helper demo-only; require audit for custom production adapters |
| Mainnet evidence is left too late | Reserve a mainnet acceptance window after Sepolia checks and owner approval |

## 16. Resource map

- Hackathon rules and judging: https://strk20.starknet.io/hackathon
- Builder routes and official resources: https://strk20.starknet.io/build
- IDEA-26 and sprint ideas: https://github.com/starkience/strk20-hackathon/blob/main/IDEAS.md
- STRK20 model and privacy limits: https://strk20-by-example.org/what-is-strk20
- Wallet API route: https://strk20-by-example.org/starknet-wallet-api/overview
- Direct starknet.js route: https://strk20-by-example.org/starknet-wallet-api/starknet-js
- React hook reference: https://strk20-by-example.org/starknet-wallet-api/starknet-start-hook
- Private DeFi wiring: https://strk20-by-example.org/starknet-wallet-api/private-defi
- AVNU private swaps: https://strk20-by-example.org/starknet-wallet-api/avnu-private-swaps
- Anonymizer anatomy: https://strk20-by-example.org/helpers/privacy-invoke
- Privacy SDK and protocol source: https://github.com/starkware-libs/starknet-privacy
- Starter kit: https://github.com/Akashneelesh/strk20-starter-kit
- Resource collection and PoCs: https://github.com/Akashneelesh/awesome-strk20
- Wallet integration test dapp: https://starknet-wallet-account.vercel.app/
- Agent skill: https://github.com/starkience/strk20-agent-skills

## 17. Immediate execution order

1. Create the workspace and `packages/core` without moving the demo yet.
2. Lock the public types and typed error model.
3. Extract and test the four primitive methods.
4. Switch the existing demo component to consume core.
5. Add React hooks and the separate checkout example.
6. Run the full Ready/Sepolia acceptance checklist.
7. Add and verify the AVNU adapter only after core checkout works.
8. Request explicit mainnet approval, execute evidence transactions, deploy, and record the walkthrough.
