# @tx404/core

Framework-neutral, non-custodial STRK20 payment primitives for Starknet dapps.

The host application injects a connected `WalletAccountV6`. Tx404 never receives a viewing key, signing key, note list, proof, or user funds.

```ts
import { createTx404 } from "@tx404/core";

const tx404 = createTx404({
  walletAccount,
  walletApiVersions,
  network: "sepolia",
});

await tx404.pay({ token, amount: 1_000_000n, recipient });
```

See the repository README for capability detection, privacy disclosures, and integration requirements.
