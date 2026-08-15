# @tx404/react

React provider and hooks for `@tx404/core`.

```tsx
<Tx404Provider walletAccount={walletAccount} walletApiVersions={versions} network="sepolia">
  <Checkout />
</Tx404Provider>
```

Exports `useTx404`, `useShield`, `usePrivateTransfer`, `useUnshield`, and `useShieldedBalances`. Balance reads only run after the host explicitly enables and invokes them.
