import type { WALLET_API } from "@starknet-io/types-js";
import { DISCLOSURES } from "./disclosures";
import { classifyWalletError, Tx404Error } from "./errors";
import type {
  PaymentInput,
  Tx404Balance,
  Tx404Capabilities,
  Tx404Config,
  Tx404InvokeRequest,
  Tx404Operation,
  Tx404PaymentSubmission,
  Tx404Preparation,
  Tx404Receipt,
  Tx404Submission,
  WaitOptions,
} from "./types";
import { normalizeAddress, normalizeAmount, supportsStrk20 } from "./validation";

const DEFAULT_TIMEOUT_MS = 120_000;
const DEFAULT_POLL_INTERVAL_MS = 3_000;

function validateInvokeActions(actions: WALLET_API.STRK20_ACTION[]): WALLET_API.STRK20_ACTION[] {
  if (!actions.length) {
    throw new Tx404Error("ADAPTER_UNSUPPORTED", "An invoke request must contain at least one action.");
  }
  if (actions.filter((action) => action.type === "invoke").length > 1) {
    throw new Tx404Error("ADAPTER_UNSUPPORTED", "STRK20 permits at most one invoke action per transaction.");
  }
  if (actions.at(-1)?.type !== "invoke") {
    throw new Tx404Error("ADAPTER_UNSUPPORTED", "The invoke action must be the final STRK20 action.");
  }
  return actions;
}

function createTimeout(ms: number): { promise: Promise<never>; cancel: () => void } {
  let timer: ReturnType<typeof setTimeout>;
  return {
    promise: new Promise((_, reject) => {
      timer = setTimeout(
        () => reject(new Tx404Error("CONFIRMATION_TIMEOUT", "The transaction was submitted but confirmation timed out.")),
        ms
      );
    }),
    cancel: () => clearTimeout(timer),
  };
}

export function createTx404(config: Tx404Config) {
  const supportedVersion = supportsStrk20(config.walletApiVersions ?? []);

  function assertReady(): void {
    if (!config.walletAccount) {
      throw new Tx404Error("WALLET_NOT_CONNECTED", "A WalletAccountV6 instance is required.");
    }
    if (config.walletNetwork && config.walletNetwork !== config.network) {
      throw new Tx404Error("NETWORK_MISMATCH", `Wallet is on ${config.walletNetwork}, expected ${config.network}.`);
    }
    if (config.walletApiVersions !== undefined && !supportedVersion) {
      throw new Tx404Error("PRIVACY_UNSUPPORTED", "The connected wallet does not support Wallet API 0.10.3 or newer.");
    }
  }

  async function waitForTransaction(
    transactionHash: string,
    options: WaitOptions = {}
  ): Promise<Tx404Receipt> {
    if (!config.provider) {
      return { transactionHash, status: "submitted" };
    }

    const timeoutMs = options.timeoutMs ?? config.confirmation?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const pollIntervalMs = options.pollIntervalMs ?? config.confirmation?.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
    const timeout = createTimeout(timeoutMs);
    try {
      const receipt = await Promise.race([
        config.provider.waitForTransaction(transactionHash, {
          retries: Math.max(1, Math.ceil(timeoutMs / pollIntervalMs)),
          retryInterval: pollIntervalMs,
        }),
        timeout.promise,
      ]);
      return { transactionHash, status: "confirmed", receipt };
    } finally {
      timeout.cancel();
    }
  }

  async function submit(
    operation: Tx404Operation,
    actions: WALLET_API.STRK20_ACTION[],
    disclosure = DISCLOSURES[operation]
  ): Promise<Tx404Submission> {
    assertReady();
    try {
      const result = await config.walletAccount.strk20InvokeTransaction(actions);
      return {
        transactionHash: result.transaction_hash,
        operation,
        network: config.network,
        status: "submitted",
        disclosure,
        wait: (options) => waitForTransaction(result.transaction_hash, options),
      };
    } catch (error) {
      throw classifyWalletError(error);
    }
  }

  return {
    getCapabilities(): Tx404Capabilities {
      const privacy = config.walletApiVersions === undefined ? true : Boolean(supportedVersion);
      return {
        privacy,
        walletApiVersion: supportedVersion,
        operations: {
          shield: privacy,
          transfer: privacy,
          unshield: privacy,
          balances: privacy,
          invoke: privacy,
        },
      };
    },

    shield(input: { token: string; amount: bigint | string }): Promise<Tx404Submission> {
      return submit("shield", [
        { type: "deposit", token: normalizeAddress(input.token), amount: normalizeAmount(input.amount) },
      ]);
    },

    transfer(input: PaymentInput): Promise<Tx404Submission> {
      return submit("transfer", [
        {
          type: "transfer",
          token: normalizeAddress(input.token),
          amount: normalizeAmount(input.amount),
          recipient: normalizeAddress(input.recipient),
        },
      ]);
    },

    async pay(input: PaymentInput): Promise<Tx404PaymentSubmission> {
      const submission = await submit("transfer", [
        {
          type: "transfer",
          token: normalizeAddress(input.token),
          amount: normalizeAmount(input.amount),
          recipient: normalizeAddress(input.recipient),
        },
      ]);
      return { ...submission, reference: input.reference };
    },

    unshield(input: PaymentInput): Promise<Tx404Submission> {
      return submit("unshield", [
        {
          type: "withdraw",
          token: normalizeAddress(input.token),
          amount: normalizeAmount(input.amount),
          recipient: normalizeAddress(input.recipient),
        },
      ]);
    },

    async getBalances(input: { tokens: string[] }): Promise<Tx404Balance[]> {
      assertReady();
      try {
        const balances = await config.walletAccount.strk20Balances(input.tokens.map(normalizeAddress));
        return balances.map((entry) => ({
          token: normalizeAddress(entry.token),
          balance: BigInt(entry.balance),
        }));
      } catch (error) {
        throw classifyWalletError(error);
      }
    },

    async prepareInvoke(input: Tx404InvokeRequest): Promise<Tx404Preparation> {
      assertReady();
      const actions = validateInvokeActions(input.actions);
      try {
        const result = await config.walletAccount.strk20PrepareInvoke(actions, true);
        return { actions, result, disclosure: input.disclosure };
      } catch (error) {
        throw classifyWalletError(error);
      }
    },

    invoke(input: Tx404InvokeRequest): Promise<Tx404Submission> {
      return submit("invoke", validateInvokeActions(input.actions), input.disclosure);
    },
  };
}

export type Tx404Client = ReturnType<typeof createTx404>;
