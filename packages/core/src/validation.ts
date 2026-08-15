import { Tx404Error } from "./errors";

const STARKNET_ADDRESS_BOUND = 2n ** 251n;

export function normalizeAddress(value: string): string {
  try {
    const address = BigInt(value);
    if (address <= 0n || address >= STARKNET_ADDRESS_BOUND) throw new Error();
    return `0x${address.toString(16)}`;
  } catch {
    throw new Tx404Error("INVALID_ADDRESS", `Invalid Starknet address: ${value}`);
  }
}

export function normalizeAmount(value: bigint | string): string {
  try {
    const amount = typeof value === "bigint" ? value : BigInt(value);
    if (amount <= 0n) throw new Error();
    return `0x${amount.toString(16)}`;
  } catch {
    throw new Tx404Error("INVALID_AMOUNT", "Amount must be a positive integer in the token's smallest unit.");
  }
}

export function parseWalletApiVersion(version: string): [number, number, number] | undefined {
  const match = version.match(/(?:^|[^0-9])(\d+)\.(\d+)(?:\.(\d+))?/);
  if (!match) return undefined;
  return [Number(match[1]), Number(match[2]), Number(match[3] ?? 0)];
}

export function supportsStrk20(versions: readonly string[]): string | undefined {
  return versions.find((version) => {
    const parsed = parseWalletApiVersion(version);
    if (!parsed) return false;
    const [major, minor, patch] = parsed;
    return major > 0 || minor > 10 || (minor === 10 && patch >= 3);
  });
}
