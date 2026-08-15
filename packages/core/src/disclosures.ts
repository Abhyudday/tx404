import type { PrivacyDisclosure, Tx404Operation } from "./types";

export const DISCLOSURES: Record<Tx404Operation | "balances", PrivacyDisclosure> = {
  shield: {
    private: ["The resulting note and later in-pool activity"],
    public: ["Depositor address", "Token and amount", "Approval and timing"],
  },
  transfer: {
    private: ["Sender", "Recipient", "Token", "Amount", "Spent notes"],
    public: ["Timing and the fact that a relayed pool transaction occurred"],
  },
  unshield: {
    private: ["Prior in-pool activity"],
    public: ["Withdrawal recipient", "Token and amount", "Timing"],
  },
  balances: {
    private: ["Viewing key and note data remain in the wallet"],
    public: ["The integrating dapp receives the balances approved by the user"],
  },
  invoke: {
    private: ["The initiating user's address"],
    public: ["The helper action and open-note amounts may be visible"],
  },
};
