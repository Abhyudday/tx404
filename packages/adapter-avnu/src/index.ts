import {
  createStrk20WalletProver,
  executePrivateSwap,
  PRIVACY_POOL_ADDRESS,
  SEPOLIA_PRIVACY_POOL_ADDRESS,
  type ExecutePrivateSwapParams,
  type PrivateFeeMode,
  type Quote,
} from "@avnu/avnu-sdk";
import { Tx404Error, normalizeAddress, type PrivacyDisclosure, type Tx404Network } from "@tx404/core";

export const AVNU_PRIVATE_SWAP_DISCLOSURE: PrivacyDisclosure = {
  private: ["The link from the user's address to the swap"],
  public: ["Swap route and activity", "Open-note output token and amount", "Timing"],
};

export type AvnuPrivateSwapWallet = Parameters<typeof createStrk20WalletProver>[0];

export type AvnuPrivateSwapInput = {
  quote: Quote;
  slippage: number;
  takerAddress: string;
  poolFeeToken?: string;
  tip?: PrivateFeeMode["tip"];
  chainId?: string;
};

export type AvnuPrivateSwapResult = Awaited<ReturnType<typeof executePrivateSwap>> & {
  disclosure: PrivacyDisclosure;
};

function poolAddressFor(network: Tx404Network): string {
  return network === "mainnet" ? PRIVACY_POOL_ADDRESS : SEPOLIA_PRIVACY_POOL_ADDRESS;
}

function validateSlippage(slippage: number): void {
  if (!Number.isFinite(slippage) || slippage <= 0 || slippage > 1) {
    throw new Tx404Error("INVALID_AMOUNT", "AVNU slippage must be greater than 0 and no more than 1.");
  }
}

export function createAvnuPrivateSwapAdapter(config: {
  walletAccount: AvnuPrivateSwapWallet;
  network: Tx404Network;
}) {
  const prover = createStrk20WalletProver(config.walletAccount);

  return {
    id: "avnu-private-swap" as const,
    disclosure: AVNU_PRIVATE_SWAP_DISCLOSURE,
    poolAddress: poolAddressFor(config.network),

    async execute(input: AvnuPrivateSwapInput): Promise<AvnuPrivateSwapResult> {
      validateSlippage(input.slippage);
      const takerAddress = normalizeAddress(input.takerAddress);
      const feeMode: PrivateFeeMode = {
        poolFeeToken: normalizeAddress(input.poolFeeToken ?? input.quote.sellTokenAddress),
        tip: input.tip,
      };
      const params: ExecutePrivateSwapParams = {
        quote: input.quote,
        slippage: input.slippage,
        takerAddress,
        poolAddress: poolAddressFor(config.network),
        feeMode,
        prover,
        chainId: input.chainId,
      };

      try {
        const result = await executePrivateSwap(params);
        return { ...result, disclosure: AVNU_PRIVATE_SWAP_DISCLOSURE };
      } catch (error) {
        throw new Tx404Error("SUBMISSION_FAILED", "AVNU private swap failed.", error);
      }
    },
  };
}
