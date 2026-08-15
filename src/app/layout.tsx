import type { Metadata } from 'next'
import { Bricolage_Grotesque, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'

// Three typefaces, three jobs. Bricolage Grotesque carries the voice and is used
// for headlines only. IBM Plex Sans reads as engineering prose and handles all UI
// text. IBM Plex Mono holds every hex address, hash, amount and micro-label, so
// values stay scannable and never get confused with prose.
const display = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})
const body = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
})
const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Tx404 · Shielded STRK20 transfers on Starknet',
  description:
    'A non-custodial SDK for shielded STRK20 balances, payments and transfers. Key material never leaves the user’s wallet.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  )
}
