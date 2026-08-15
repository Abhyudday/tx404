import type { WALLET_API } from "@starknet-io/types-js";

export type Tx404Network = "sepolia" | "mainnet";
export type Tx404Operation = "shield" | "transfer" | "unshield" | "invoke";
export type Tx404ErrorCode =
  | "WALLET_NOT_CONNECTED"
  | "PRIVACY_UNSUPPORTED"
  | "NETWORK_MISMATCH"
  | "INVALID_ADDRESS"
  | "INVALID_AMOUNT"
  | "USER_REJECTED"
  | "SCREENING_REJECTED"
  | "INSUFFICIENT_PUBLIC_BALANCE"
  | "INSUFFICIENT_SHIELDED_BALANCE"
  | "NOTE_NOT_MATURE"
  | "POOL_FEE_REQUIRED"
  | "SUBMISSION_FAILED"
  | "CONFIRMATION_TIMEOUT"
  | "ADAPTER_UNSUPPORTED";

export type Tx404WalletAccount = {
  address?: string;
  strk20InvokeTransaction(actions: WALLET_API.STRK20_ACTION[]): Promise<{
    transaction_hash: string;
  }>;
  strk20PrepareInvoke(
    actions: WALLET_API.STRK20_ACTION[],
    simulate?: boolean
  ): Promise<unknown>;
  strk20Balances(tokens: string[]): Promise<WALLET_API.STRK20_BALANCE_ENTRY[]>;
};

export type Tx404Provider = {
  waitForTransaction(
    transactionHash: string,
    options?: { retries?: number; retryInterval?: number }
  ): Promise<unknown>;
};

export type Tx404Config = {
  walletAccount: Tx404WalletAccount;
  walletApiVersions?: readonly string[];
  network: Tx404Network;
  walletNetwork?: Tx404Network;
  provider?: Tx404Provider;
  confirmation?: {
    timeoutMs?: number;
    pollIntervalMs?: number;
  };
};

export type Tx404Capabilities = {
  privacy: boolean;
  walletApiVersion?: string;
  operations: Record<"shield" | "transfer" | "unshield" | "balances" | "invoke", boolean>;
};

export type Tx404Balance = {
  token: string;
  balance: bigint;
};

export type PrivacyDisclosure = {
  private: readonly string[];
  public: readonly string[];
};

export type Tx404Receipt = {
  transactionHash: string;
  status: "confirmed" | "submitted";
  receipt?: unknown;
};

export type WaitOptions = {
  timeoutMs?: number;
  pollIntervalMs?: number;
};

export type Tx404Submission = {
  transactionHash: string;
  operation: Tx404Operation;
  network: Tx404Network;
  status: "submitted";
  disclosure: PrivacyDisclosure;
  wait(options?: WaitOptions): Promise<Tx404Receipt>;
};

export type Tx404InvokeRequest = {
  actions: WALLET_API.STRK20_ACTION[];
  disclosure: PrivacyDisclosure;
};

export type Tx404Preparation = {
  actions: WALLET_API.STRK20_ACTION[];
  result: unknown;
  disclosure: PrivacyDisclosure;
};

export type PaymentInput = {
  token: string;
  amount: bigint | string;
  recipient: string;
  reference?: string;
};

export type Tx404PaymentSubmission = Tx404Submission & {
  reference?: string;
};
