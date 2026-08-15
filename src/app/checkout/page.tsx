"use client";

import { useMemo, useState } from "react";
import { createTx404, DISCLOSURES, type Tx404Error } from "@tx404/core";
import { constants as starknetConstants } from "starknet";
import SelectWallet from "../components/client/WalletHandle/SelectWallet";
import { useStoreWallet } from "../components/Wallet/walletContext";
import { useFrontendProvider } from "../components/client/provider/providerContext";
import * as constants from "@/utils/constants";
import styles from "./checkout.module.css";

const DEFAULT_AMOUNT = 1n * 10n ** 18n;

export default function CheckoutPage() {
  const walletAccount = useStoreWallet((state) => state.myWalletAccount);
  const walletApiVersions = useStoreWallet((state) => state.walletApiList);
  const connectedAddress = useStoreWallet((state) => state.address);
  const chain = useStoreWallet((state) => state.chain);
  const providerIndex = useFrontendProvider((state) => state.currentFrontendProviderIndex);
  const [recipient, setRecipient] = useState(connectedAddress);
  const [amount, setAmount] = useState(DEFAULT_AMOUNT.toString());
  const [reference, setReference] = useState("order-404");
  const [status, setStatus] = useState("Connect a privacy-enabled wallet to begin.");
  const [transactionHash, setTransactionHash] = useState<string>();
  const [pending, setPending] = useState(false);

  const client = useMemo(() => {
    if (!walletAccount) return undefined;
    return createTx404({
      walletAccount,
      walletApiVersions,
      network: providerIndex === 0 ? "mainnet" : "sepolia",
      walletNetwork: chain
        ? chain === starknetConstants.StarknetChainId.SN_MAIN
          ? "mainnet"
          : "sepolia"
        : undefined,
      provider: constants.myFrontendProviders[providerIndex],
    });
  }, [chain, providerIndex, walletAccount, walletApiVersions]);

  const capabilities = client?.getCapabilities();

  async function pay() {
    if (!client) return;
    setPending(true);
    setTransactionHash(undefined);
    setStatus("Confirm the private payment in your wallet.");
    try {
      const submission = await client.pay({
        token: constants.addrSTRK,
        amount,
        recipient,
        reference,
      });
      setTransactionHash(submission.transactionHash);
      setStatus("Payment submitted. Confirmation may take several minutes.");
      const receipt = await submission.wait({ timeoutMs: 120_000 });
      setStatus(receipt.status === "confirmed" ? "Private payment confirmed." : "Payment submitted.");
    } catch (reason) {
      const error = reason as Tx404Error;
      setStatus(`${error.code ?? "PAYMENT_FAILED"}: ${error.message ?? String(reason)}`);
    } finally {
      setPending(false);
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a href="/" className={styles.brand}>Tx404</a>
        <SelectWallet variant="nav" />
      </header>

      <section className={styles.checkout}>
        <div className={styles.heading}>
          <span className={styles.kicker}>Private checkout</span>
          <h1>Pay with<br /><em>shielded STRK.</em></h1>
          <p>The merchant receives an in-pool transfer without publishing the sender, recipient, token, or amount.</p>
        </div>

        <div className={styles.form}>
          <label>
            Merchant address
            <input value={recipient} onChange={(event) => setRecipient(event.target.value)} placeholder="0x..." />
          </label>
          <label>
            Amount in STRK base units
            <input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="numeric" />
          </label>
          <label>
            Local order reference
            <input value={reference} onChange={(event) => setReference(event.target.value)} />
          </label>

          <div className={styles.disclosure}>
            <div><strong>Private</strong><span>{DISCLOSURES.transfer.private.join(", ")}</span></div>
            <div><strong>Visible</strong><span>{DISCLOSURES.transfer.public.join(", ")}</span></div>
          </div>

          <button
            className={styles.pay}
            onClick={pay}
            disabled={!client || !capabilities?.privacy || pending || !recipient || !amount}
          >
            {pending ? "Waiting for wallet" : "Pay privately"}
          </button>

          <div className={styles.status} aria-live="polite">
            <span className={capabilities?.privacy ? styles.ready : styles.waiting} />
            <span>{status}</span>
          </div>

          {transactionHash ? (
            <a
              className={styles.hash}
              href={`${providerIndex === 0 ? "https://voyager.online" : "https://sepolia.voyager.online"}/tx/${transactionHash}`}
              target="_blank"
              rel="noreferrer"
            >
              View transaction
            </a>
          ) : null}
        </div>
      </section>
    </main>
  );
}
