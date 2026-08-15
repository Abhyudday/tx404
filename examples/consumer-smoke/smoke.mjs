import { createAvnuPrivateSwapAdapter } from "@tx404/adapter-avnu";
import { createTx404 } from "@tx404/core";
import { Tx404Provider } from "@tx404/react";

const calls = [];
const walletAccount = {
  async strk20InvokeTransaction(actions) {
    calls.push(actions);
    return { transaction_hash: "0x404" };
  },
  async strk20PrepareInvoke() {
    return { call: {}, proof: {} };
  },
  async strk20Balances() {
    return [];
  },
};

const tx404 = createTx404({
  walletAccount,
  walletApiVersions: ["0.10.3"],
  network: "sepolia",
});

const submission = await tx404.pay({ token: "0x1", amount: 1n, recipient: "0x2" });
if (submission.transactionHash !== "0x404" || calls[0][0].type !== "transfer") {
  throw new Error("Core package export failed its consumer smoke test.");
}

const avnu = createAvnuPrivateSwapAdapter({ walletAccount, network: "sepolia" });
if (avnu.id !== "avnu-private-swap" || !avnu.poolAddress.startsWith("0x254a6b")) {
  throw new Error("AVNU adapter package export failed its consumer smoke test.");
}

if (typeof Tx404Provider !== "function") {
  throw new Error("React package export failed its consumer smoke test.");
}

console.log("Tx404 package consumer smoke test passed.");
