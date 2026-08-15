import type { Tx404ErrorCode } from "./types";

export class Tx404Error extends Error {
  readonly code: Tx404ErrorCode;
  override readonly cause?: unknown;

  constructor(code: Tx404ErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = "Tx404Error";
    this.code = code;
    this.cause = cause;
  }
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    return String(error.message);
  }
  return String(error);
}

export function classifyWalletError(error: unknown): Tx404Error {
  if (error instanceof Tx404Error) return error;

  const message = errorMessage(error);
  const normalized = message.toLowerCase();

  if (normalized.includes("reject") || normalized.includes("denied") || normalized.includes("cancel")) {
    return new Tx404Error("USER_REJECTED", "The wallet request was rejected.", error);
  }
  if (normalized.includes("screen")) {
    return new Tx404Error("SCREENING_REJECTED", "The shield request was declined by deposit screening.", error);
  }
  if (normalized.includes("matur") || normalized.includes("10 block")) {
    return new Tx404Error("NOTE_NOT_MATURE", "The selected shielded funds are not mature yet.", error);
  }
  if (normalized.includes("insufficient") && normalized.includes("shield")) {
    return new Tx404Error("INSUFFICIENT_SHIELDED_BALANCE", "Insufficient shielded balance.", error);
  }
  if (normalized.includes("insufficient")) {
    return new Tx404Error("INSUFFICIENT_PUBLIC_BALANCE", "Insufficient public balance.", error);
  }
  if (normalized.includes("fee")) {
    return new Tx404Error("POOL_FEE_REQUIRED", "The operation cannot cover the current pool fee.", error);
  }

  return new Tx404Error("SUBMISSION_FAILED", message || "The private operation failed.", error);
}
