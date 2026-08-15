"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { createTx404, type Tx404Client } from "@tx404/core";
import type {
  PaymentInput,
  Tx404Config,
  Tx404Submission,
} from "@tx404/core";

const Tx404Context = createContext<Tx404Client | null>(null);

export function Tx404Provider(props: Tx404Config & { children: React.ReactNode }) {
  const { children, ...config } = props;
  const client = useMemo(
    () => createTx404(config),
    [
      config.walletAccount,
      config.walletApiVersions,
      config.network,
      config.walletNetwork,
      config.provider,
      config.confirmation?.timeoutMs,
      config.confirmation?.pollIntervalMs,
    ]
  );
  return <Tx404Context.Provider value={client}>{children}</Tx404Context.Provider>;
}

export function useTx404(): Tx404Client {
  const client = useContext(Tx404Context);
  if (!client) throw new Error("useTx404 must be used inside Tx404Provider");
  return client;
}

export function usePrivateTransfer() {
  const client = useTx404();
  const [submission, setSubmission] = useState<Tx404Submission>();
  const [error, setError] = useState<unknown>();
  const [pending, setPending] = useState(false);

  async function execute(input: PaymentInput) {
    setPending(true);
    setError(undefined);
    try {
      const result = await client.transfer(input);
      setSubmission(result);
      return result;
    } catch (reason) {
      setError(reason);
      throw reason;
    } finally {
      setPending(false);
    }
  }

  return { execute, submission, error, pending };
}

export function useShield() {
  const client = useTx404();
  const [submission, setSubmission] = useState<Tx404Submission>();
  const [error, setError] = useState<unknown>();
  const [pending, setPending] = useState(false);

  async function execute(input: { token: string; amount: bigint | string }) {
    setPending(true);
    setError(undefined);
    try {
      const result = await client.shield(input);
      setSubmission(result);
      return result;
    } catch (reason) {
      setError(reason);
      throw reason;
    } finally {
      setPending(false);
    }
  }

  return { execute, submission, error, pending };
}

export function useUnshield() {
  const client = useTx404();
  const [submission, setSubmission] = useState<Tx404Submission>();
  const [error, setError] = useState<unknown>();
  const [pending, setPending] = useState(false);

  async function execute(input: PaymentInput) {
    setPending(true);
    setError(undefined);
    try {
      const result = await client.unshield(input);
      setSubmission(result);
      return result;
    } catch (reason) {
      setError(reason);
      throw reason;
    } finally {
      setPending(false);
    }
  }

  return { execute, submission, error, pending };
}

export function useShieldedBalances(tokens: string[], enabled = false) {
  const client = useTx404();
  const [balances, setBalances] = useState<Awaited<ReturnType<Tx404Client["getBalances"]>>>();
  const [error, setError] = useState<unknown>();
  const [pending, setPending] = useState(false);

  async function refresh() {
    if (!enabled) return;
    setPending(true);
    setError(undefined);
    try {
      const result = await client.getBalances({ tokens });
      setBalances(result);
      return result;
    } catch (reason) {
      setError(reason);
      throw reason;
    } finally {
      setPending(false);
    }
  }

  return { balances, refresh, error, pending };
}
