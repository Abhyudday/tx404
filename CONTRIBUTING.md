# Contributing

## Setup

```bash
npm ci
npm run verify
```

Use Node.js 22 for this repository. Core SDK code must remain framework-neutral and non-custodial. React behavior belongs in `packages/react`; protocol-specific behavior belongs in a named adapter.

## Requirements

- Add tests for action payloads, capability checks, errors, or adapter behavior changed by the patch.
- Do not add viewing-key, signing-key, note, proof, or custody APIs to the dapp SDK.
- Do not use a balance query for wallet feature detection.
- Document what each operation hides and what remains public.
- Do not hardcode pool or helper addresses without a network label and an official source.
- Mainnet-affecting changes require explicit owner approval and manual wallet verification.
