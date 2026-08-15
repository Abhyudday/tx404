"use client";

import { DISCLOSURES } from "@tx404/core";
import styles from "./home.module.css";
import SelectWallet from "./components/client/WalletHandle/SelectWallet";
import WalletAccountV6Tag from "./components/client/WalletHandle/WalletAccountV6Tag";

/* The hero's ledger is rendered from the SDK's own disclosure table rather than
   from marketing copy, so the page cannot claim more privacy than the client
   actually delivers. Hatched row = private. The legible footer = the one thing
   an observer really does learn. */
const PRIVATE_FIELDS = DISCLOSURES.transfer.private;
const PUBLIC_FIELDS = DISCLOSURES.transfer.public;

export default function Page() {
  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <a href="/" className={styles.brand}>
          <span className={styles.brandMark}>404</span>
          <span>tx404</span>
        </a>
        <div className={styles.navRight}>
          <span className={styles.networkTag}><i /> Starknet / STRK20</span>
          <SelectWallet variant="nav" />
        </div>
      </nav>

      <main>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>
              <span className={styles.eyebrowMark} /> Privacy infrastructure for Starknet
            </p>
            <h1 className={styles.heroTitle}>
              Transfers that<br />settle without<br /><em>saying who.</em>
            </h1>
            <p className={styles.heroSub}>
              Tx404 is a non-custodial SDK for shielded STRK20 transfers. Keys, notes, and
              proofs stay inside the user&rsquo;s wallet — your app calls four methods.
            </p>
            <div className={styles.heroActions}>
              <a className={styles.primaryAction} href="#console">
                Open the console <span className={styles.actionGlyph} aria-hidden="true">↓</span>
              </a>
              <a
                className={styles.secondaryAction}
                href="https://github.com/Abhyudday/tx404"
                target="_blank"
                rel="noreferrer"
              >
                Read the source <span className={styles.actionGlyph} aria-hidden="true">↗</span>
              </a>
            </div>
          </div>

          <div className={styles.observer}>
            <div className={styles.observerHead}>
              <span className={styles.observerTitle}>What an observer sees</span>
              <span className={styles.observerChip}>In-pool transfer</span>
            </div>

            <div className={styles.ledger}>
              {PRIVATE_FIELDS.map((field) => (
                <div className={styles.row} key={field}>
                  <span className={styles.rowKey}>{field}</span>
                  <span className={styles.rowVal}>
                    <span className={styles.bar} aria-hidden="true" />
                    <span className={styles.srOnly}>Not published</span>
                  </span>
                </div>
              ))}
            </div>

            <div className={styles.observerFoot}>
              <span className={styles.footLabel}><i /> Published onchain</span>
              <p className={styles.footText}>{PUBLIC_FIELDS.join(". ")}.</p>
            </div>
          </div>
        </section>

        <section className={styles.facts}>
          <div className={styles.fact}>
            <span className={styles.factKey}>No custody</span>
            <p className={styles.factName}>Keys never leave the wallet</p>
            <p className={styles.factNote}>
              Tx404 is not a custodian, a relayer, or a wallet. It holds no keys and cannot
              move funds on anyone&rsquo;s behalf.
            </p>
          </div>
          <div className={styles.fact}>
            <span className={styles.factKey}>Four methods</span>
            <p className={styles.factName}>Shield, transfer, unshield, balances</p>
            <p className={styles.factNote}>
              Every call returns a submission you await, then a receipt you await. The same
              shape each time.
            </p>
          </div>
          <div className={styles.fact}>
            <span className={styles.factKey}>Your design system</span>
            <p className={styles.factName}>Typed core, optional UI</p>
            <p className={styles.factNote}>
              A TypeScript core with React hooks. The bundled components are
              CSS-variable driven, so they inherit your tokens instead of fighting them.
            </p>
          </div>
        </section>

        <section id="console" className={styles.consoleSection}>
          <div className={styles.sectionIntro}>
            <p className={styles.eyebrow}>
              <span className={styles.eyebrowMark} /> Live reference console
            </p>
            <h2 className={styles.sectionTitle}>Run the real thing.</h2>
            <p className={styles.sectionNote}>
              The console calls the same methods your app would. Connect a privacy-enabled
              wallet on Sepolia — before each call it shows what stays in the pool and what
              goes onchain.
            </p>
          </div>

          <div className={styles.consoleFrame}>
            <div className={styles.consoleBar}>
              <span className={styles.liveDot} /> Tx404 reference console
              <span className={styles.barMeta}>Sepolia first</span>
            </div>
            <WalletAccountV6Tag />
          </div>
        </section>

        <section className={styles.bottomBand}>
          <div>
            <span className={styles.wordmark}>tx404</span>
            <p className={styles.bandCopy}>
              The pool keeps the details. Your product keeps the experience.
            </p>
          </div>
          <a href="/checkout" className={styles.checkoutLink}>
            Open the private checkout <span className={styles.actionGlyph} aria-hidden="true">→</span>
          </a>
        </section>
      </main>

      <footer className={styles.footer}>
        <span>Tx404 / open infrastructure</span>
        <span>Starknet.js v10.4.0 · Wallet API 0.10.3</span>
        <a href="https://strk20-by-example.org/" target="_blank" rel="noreferrer">STRK20 docs ↗</a>
      </footer>
    </div>
  );
}
