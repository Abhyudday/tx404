# @tx404/adapter-avnu

Experimental AVNU private-swap integration for already-shielded funds.

This package delegates execution to AVNU's deployed private-swap route. It does not deploy or claim ownership of an anonymizer contract. Swap activity and open-note output amounts may remain public; the link to the initiating user is hidden.

Any sponsored paymaster API key belongs in a server route, never browser code.

```ts
import { createAvnuPrivateSwapAdapter } from "@tx404/adapter-avnu";

const avnu = createAvnuPrivateSwapAdapter({ walletAccount, network: "sepolia" });
const result = await avnu.execute({
  quote,
  slippage: 0.01,
  takerAddress: walletAccount.address,
  chainId: "SN_SEPOLIA",
});
```

If sponsored mode requires a secret API key, call `buildAvnuPrivateSwapFee` and `submitAvnuPrivateSwap` from `@tx404/adapter-avnu/server` in a server-only route. Keep wallet proving in the browser.
