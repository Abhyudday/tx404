# Tx404

Tx404 is a non-custodial shielding API/SDK: drop shield, unshield, and private-transfer into any app without touching a viewing key. It provides core STRK20 privacy primitives through the Starknet Wallet API, plus one reference `privacy_invoke` DeFi flow.

Tx404 is the privacy layer other apps call. Its backend never holds an end user's private key, viewing key, funds, or transaction signing authority. Every action is signed by the end user's own privacy-enabled wallet.

> Demo defaults (fixed token, fixed amounts, and an *echo* helper that just round-trips) are marked `DEMO` in the code — swap them for your own.

## Quick start

```bash
npm install
cp .env.example .env.local     # add your Alchemy key
npm run dev                    # http://localhost:3000
```

Needs a free [Alchemy](https://alchemy.com) Starknet RPC key and a privacy-enabled wallet (Ready first; other supported wallets degrade gracefully) on Sepolia or Mainnet.

## SDK quick start

Tx404 is being extracted as a framework-neutral core plus an optional React adapter. The host app owns wallet discovery and passes its connected `WalletAccountV6` into Tx404:

```tsx
import { Tx404Provider, usePrivateTransfer } from "@tx404/react";

function PrivatePay({ walletAccount, walletApiVersions, recipient }) {
  const { execute, pending } = usePrivateTransfer();

  return (
    <button
      disabled={pending}
      onClick={() => execute({
        token: "0x...",
        amount: 1000000000000000000n,
        recipient,
      })}
    >
      {pending ? "Confirm in wallet" : "Pay privately"}
    </button>
  );
}

function App({ walletAccount, walletApiVersions, recipient }) {
  return (
    <Tx404Provider walletAccount={walletAccount} walletApiVersions={walletApiVersions} network="sepolia">
      <PrivatePay {...{ walletAccount, walletApiVersions, recipient }} />
    </Tx404Provider>
  );
}
```

See [`examples/next-checkout/README.md`](examples/next-checkout/README.md) and [`TX404_PRODUCT_PLAN.md`](TX404_PRODUCT_PLAN.md) for the package boundary and privacy disclosures. Core does not require a Tx404 account, backend, API key, viewing key, or signing key.

The demo includes a configurable private merchant flow at [`/checkout`](http://localhost:3000/checkout).

## Packages

- `@tx404/core` - framework-neutral shield, transfer/payment, unshield, consented balance, and invoke APIs.
- `@tx404/react` - provider and hooks over the core client.
- `@tx404/adapter-avnu` - experimental AVNU private swaps for already-shielded funds. Browser code never accepts a paymaster API key; server-only fee/submission helpers are exported from `@tx404/adapter-avnu/server`.

All packages build as ESM and CommonJS with declarations and source maps. Run `npm run test:consumer` to verify the built package exports from a separate workspace consumer.

## What's inside

- **Connect** — `get-starknet` v6 discovery + wallet picker, with `eip1193Adapters: []` to stop MetaMask popups → `SelectWallet.tsx`
- **Actions** — shield / unshield / private transfer / reference `privacy_invoke` / balances via `strk20InvokeTransaction` → `WalletAccountV6Tag.tsx`
- **SDK packages** — framework-neutral `@tx404/core` plus React provider/hooks under `packages/`
- **Config** — token, RPC providers, helper addresses (all `DEMO`-labelled) → `src/utils/constants.ts`
- **Anonymizer** — a minimal `privacy_invoke` contract you can deploy from the UI → `cairo/src/lib.cairo`

Stack: Next.js 16 · React 19 · TypeScript · starknet.js 10 · zustand. No component framework.

## Gotchas worth knowing

- **Placeholders are literal strings.** In the `invoke` action, `"OPEN"`, `"${poolAddress}"`, `"${openNoteIds[0]}"` are substituted by the wallet — never `num.toHex` them. Only real token/amounts get hex-normalized.
- The reference helper is a **no-op demo** — replace its body with one app-specific action (swap/vault/lend); the `privacy_invoke` shape stays the same. Tx404 does not claim to anonymize arbitrary contracts.
- AVNU swaps use AVNU's first-party private executor. The sell token must already be shielded; swap activity and open-note output amounts may remain public.
- Ready wallet works today (Xverse's Wallet API is landing); the app degrades gracefully for others.

## Deploy

Standard Next.js on [Vercel](https://vercel.com/new) — set `NEXT_PUBLIC_PROVIDER_URL` (and optionally `NEXT_PUBLIC_STRK20_ECHO_HELPER_SEPOLIA`).

Release, Sepolia acceptance, mainnet gating, deployment, and demo steps are in [`docs/RELEASE_RUNBOOK.md`](docs/RELEASE_RUNBOOK.md).

## Links

[STRK20 by example](https://strk20-by-example.org/) · [Privacy SDK](https://github.com/starkware-libs/starknet-privacy) · [WalletAccount guide](https://starknet-js.com/docs/next/guides/account/walletAccount/#with-get-starknet-v6)

Bootstrapped from the [STRK20 starter kit](https://github.com/Akashneelesh/strk20-starter-kit).
