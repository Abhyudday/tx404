"use client";

import styles from "./home.module.css";
import SelectWallet from "./components/client/WalletHandle/SelectWallet";
import WalletAccountV6Tag from "./components/client/WalletHandle/WalletAccountV6Tag";

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
            <p className={styles.eyebrow}><span /> PRIVACY INFRASTRUCTURE FOR STARKNET</p>
            <h1>Make the<br /><em>transaction</em><br />disappear.</h1>
            <p className={styles.heroSub}>A non-custodial SDK for private payments, balances, and transfers. Your users keep every key. Your app ships the experience.</p>
            <div className={styles.heroActions}>
              <a className={styles.primaryAction} href="#console">Open the console <span>↘</span></a>
              <a className={styles.secondaryAction} href="https://github.com/Abhyudday/tx404" target="_blank" rel="noreferrer">Read the source <span>↗</span></a>
            </div>
          </div>

          <div className={styles.heroDiagram} aria-label="Tx404 privacy flow diagram">
            <div className={styles.diagramHeader}><span>TX404 / FLOW_01</span><span>NON-CUSTODIAL</span></div>
            <div className={styles.diagramCanvas}>
              <div className={styles.diagramLine} />
              <div className={`${styles.node} ${styles.nodeWallet}`}><b>W</b><span>USER WALLET</span></div>
              <div className={`${styles.node} ${styles.nodeTx}`}><strong>404</strong><span>TX404 LAYER</span></div>
              <div className={`${styles.node} ${styles.nodePool}`}><b>◇</b><span>STRK20 POOL</span></div>
              <div className={styles.flowLabel}>key material<br /><strong>never leaves</strong></div>
              <div className={styles.diagramFoot}><span>shielded state</span><span>public edge</span></div>
            </div>
          </div>
        </section>

        <section className={styles.metrics}>
          <div><strong>01</strong><span>Wallet-mediated</span><small>No custody. No keys.</small></div>
          <div><strong>02</strong><span>Four primitives</span><small>Shield / send / unshield / query</small></div>
          <div><strong>03</strong><span>Built for builders</span><small>TypeScript core + React hooks</small></div>
        </section>

        <section id="console" className={styles.consoleSection}>
          <div className={styles.sectionIntro}>
            <p className={styles.eyebrow}><span /> LIVE REFERENCE CONSOLE</p>
            <h2>Try the private rail.</h2>
            <p>Connect a privacy-enabled wallet to test the same primitives an integrating app calls. Start on Sepolia.</p>
          </div>
          <div className={styles.consoleFrame}>
            <div className={styles.consoleBar}><span className={styles.liveDot} /> TX404 CONTROL SURFACE <span className={styles.barMeta}>TESTNET FIRST / READY</span></div>
            <WalletAccountV6Tag />
          </div>
        </section>

        <section className={styles.bottomBand}>
          <div><span className={styles.bigCode}>tx404</span><p>Private by architecture.<br />Simple by interface.</p></div>
          <a href="/checkout" className={styles.checkoutLink}>Open private checkout <span>↗</span></a>
        </section>
      </main>

      <footer className={styles.footer}>
        <span>TX404 / OPEN INFRASTRUCTURE</span>
        <span>Starknet.js v10.4.0 · Wallet API 0.10.3</span>
        <a href="https://strk20-by-example.org/" target="_blank" rel="noreferrer">STRK20 docs ↗</a>
      </footer>
    </div>
  );
}
