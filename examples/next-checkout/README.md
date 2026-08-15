# Tx404 Next.js Checkout Example

This example shows the intended integration boundary for a Starknet startup. The host app owns wallet discovery and connects a privacy-enabled wallet; Tx404 receives the connected `WalletAccountV6` and exposes a private payment method.

```tsx
"use client";

import { Tx404Provider, usePrivateTransfer } from "@tx404/react";

function PayButton({ walletAccount, recipient }: Props) {
  const { execute, pending, submission, error } = usePrivateTransfer();

  return (
    <button
      disabled={pending}
      onClick={() => execute({
        token: "0x...",
        amount: 1000000000000000000n,
        recipient,
        reference: "order-123", // local metadata; never sent onchain
      })}
    >
      {pending ? "Confirm in wallet" : "Pay privately"}
    </button>
  );
}

export function Checkout(props: Props) {
  return (
    <Tx404Provider
      walletAccount={props.walletAccount}
      walletApiVersions={props.walletApiVersions}
      network="sepolia"
    >
      <PayButton {...props} />
    </Tx404Provider>
  );
}
```

The customer must have a shielded balance of the selected token. Shielding is a separate public edge operation and should be explained before signing. The private transfer hides the in-pool sender, recipient, token, amount, and spent notes; timing and the fact of pool interaction remain visible.

Tx404 never receives a viewing key, signing key, note list, proof, or user funds. It does not provide a server endpoint that signs or relays on the user's behalf.
