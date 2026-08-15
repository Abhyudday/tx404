import {
  buildPrivateSwapFee,
  submitPrivateSwap,
  type AvnuOptions,
  type BuildPrivateSwapFeeParams,
  type SubmitPrivateSwapParams,
} from "@avnu/avnu-sdk";

function requireServer(): void {
  if (typeof window !== "undefined") {
    throw new Error("@tx404/adapter-avnu/server cannot run in a browser.");
  }
}

export async function buildAvnuPrivateSwapFee(
  params: BuildPrivateSwapFeeParams,
  options?: AvnuOptions
) {
  requireServer();
  return buildPrivateSwapFee(params, options);
}

export async function submitAvnuPrivateSwap(
  params: SubmitPrivateSwapParams,
  options?: AvnuOptions
) {
  requireServer();
  return submitPrivateSwap(params, options);
}
