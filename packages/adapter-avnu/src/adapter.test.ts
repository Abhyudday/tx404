import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  executePrivateSwap: vi.fn(async () => ({ transactionHash: "0xabc" })),
}));

vi.mock("@avnu/avnu-sdk", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@avnu/avnu-sdk")>();
  return {
    ...actual,
    createStrk20WalletProver: vi.fn(() => ({ buildAndProve: vi.fn() })),
    executePrivateSwap: mocks.executePrivateSwap,
  };
});

import { createAvnuPrivateSwapAdapter } from "./index";

describe("AVNU adapter", () => {
  it("uses the Sepolia pool and keeps paymaster keys out of the browser API", async () => {
    const adapter = createAvnuPrivateSwapAdapter({
      walletAccount: { strk20PrepareInvoke: vi.fn() },
      network: "sepolia",
    });
    const quote = {
      quoteId: "quote",
      sellTokenAddress: "0x1",
      sellAmount: 10n,
      buyTokenAddress: "0x2",
      buyAmount: 9n,
      chainId: "SN_SEPOLIA",
    } as Parameters<typeof adapter.execute>[0]["quote"];

    const result = await adapter.execute({
      quote,
      slippage: 0.01,
      takerAddress: "0x3",
      chainId: "SN_SEPOLIA",
    });

    expect(adapter.poolAddress).toMatch(/^0x254a6b/);
    expect(mocks.executePrivateSwap).toHaveBeenCalledWith(
      expect.not.objectContaining({ paymasterApiKey: expect.anything() })
    );
    expect(result.disclosure.public).toContain("Open-note output token and amount");
  });

  it("rejects invalid slippage before invoking AVNU", async () => {
    const adapter = createAvnuPrivateSwapAdapter({
      walletAccount: { strk20PrepareInvoke: vi.fn() },
      network: "mainnet",
    });
    await expect(
      adapter.execute({ quote: {} as never, slippage: 2, takerAddress: "0x1" })
    ).rejects.toMatchObject({ code: "INVALID_AMOUNT" });
  });
});
