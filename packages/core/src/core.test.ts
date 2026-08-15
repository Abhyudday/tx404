import { describe, expect, it, vi } from "vitest";
import { createTx404 } from "./client";
import { Tx404Error } from "./errors";
import { normalizeAddress, normalizeAmount, supportsStrk20 } from "./validation";

function wallet() {
  return {
    strk20InvokeTransaction: vi.fn(async (actions) => {
      return { transaction_hash: `0x${actions[0].type}` };
    }),
    strk20PrepareInvoke: vi.fn(async (actions) => ({ actions, simulated: true })),
    strk20Balances: vi.fn(async () => [{ token: "0x1", balance: "42" }]),
  };
}

describe("Tx404 core", () => {
  it("normalizes numeric addresses and amounts without floating point", () => {
    expect(normalizeAddress("0x0001")).toBe("0x1");
    expect(normalizeAmount(10n ** 18n)).toBe("0xde0b6b3a7640000");
  });

  it("rejects invalid values", () => {
    expect(() => normalizeAddress("0x0")).toThrowError(Tx404Error);
    expect(() => normalizeAmount("0")).toThrowError(Tx404Error);
  });

  it("detects Wallet API 0.10.3 without reading balances", () => {
    expect(supportsStrk20(["0.10.2"])).toBeUndefined();
    expect(supportsStrk20(["0.10.3"])).toBe("0.10.3");
  });

  it("treats an explicit empty Wallet API list as unsupported", async () => {
    const connected = wallet();
    const client = createTx404({
      walletAccount: connected,
      walletApiVersions: [],
      network: "sepolia",
    });

    expect(client.getCapabilities().privacy).toBe(false);
    await expect(client.shield({ token: "0x1", amount: 1n })).rejects.toMatchObject({
      code: "PRIVACY_UNSUPPORTED",
    });
    expect(connected.strk20Balances).not.toHaveBeenCalled();
  });

  it("builds a private payment through the wallet", async () => {
    const connected = wallet();
    const client = createTx404({
      walletAccount: connected,
      walletApiVersions: ["0.10.3"],
      network: "sepolia",
    });

    const result = await client.pay({
      token: "0x1",
      amount: 25n,
      recipient: "0x2",
      reference: "order-1",
    });

    expect(connected.strk20InvokeTransaction).toHaveBeenCalledWith([
      { type: "transfer", token: "0x1", amount: "0x19", recipient: "0x2" },
    ]);
    expect(result.reference).toBe("order-1");
    expect(result.disclosure.private).toContain("Sender");

    const { pay } = client;
    await expect(pay({ token: "0x1", amount: 1n, recipient: "0x2" })).resolves.toMatchObject({
      operation: "transfer",
    });
  });

  it("preserves invoke placeholders and rejects a non-final invoke", async () => {
    const connected = wallet();
    const client = createTx404({ walletAccount: connected, network: "sepolia" });
    const disclosure = { private: [], public: [] } as const;

    const prepared = await client.prepareInvoke({
      actions: [
        { type: "transfer", token: "0x1", amount: "OPEN", recipient: "0x2" },
        { type: "invoke", contract: "0x3", calldata: ["${poolAddress}", "${openNoteIds[0]}"] },
      ],
      disclosure,
    });

    expect(prepared.actions[1]).toEqual({
      type: "invoke",
      contract: "0x3",
      calldata: ["${poolAddress}", "${openNoteIds[0]}"],
    });

    await expect(
      client.prepareInvoke({
        actions: [
          { type: "invoke", contract: "0x3", calldata: [] },
          { type: "transfer", token: "0x1", amount: "OPEN", recipient: "0x2" },
        ],
        disclosure,
      })
    ).rejects.toMatchObject({ code: "ADAPTER_UNSUPPORTED" });
  });

  it("returns submitted when no provider is configured", async () => {
    const connected = wallet();
    const client = createTx404({ walletAccount: connected, network: "sepolia" });
    const result = await client.shield({ token: "0x1", amount: 1n });
    expect(await result.wait()).toEqual({ transactionHash: "0xdeposit", status: "submitted" });
  });

  it("bounds confirmation waits", async () => {
    const connected = wallet();
    const client = createTx404({
      walletAccount: connected,
      network: "sepolia",
      provider: { waitForTransaction: vi.fn(() => new Promise(() => undefined)) },
    });
    const result = await client.shield({ token: "0x1", amount: 1n });
    await expect(result.wait({ timeoutMs: 5, pollIntervalMs: 1 })).rejects.toMatchObject({
      code: "CONFIRMATION_TIMEOUT",
    });
  });
});
