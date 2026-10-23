import Link from "next/link"

import { cn } from "@/lib/utils"

function rosette(r0: number, a: number, k: number, phase = 0, n = 168): string {
  const pts: string[] = []
  for (let i = 0; i < n; i++) {
    const t = (2 * Math.PI * i) / n
    const r = r0 + a * Math.cos(k * t + phase)
    pts.push(`${(20 + r * Math.cos(t)).toFixed(2)} ${(20 + r * Math.sin(t)).toFixed(2)}`)
  }
  return "M" + pts.join("L") + "Z"
}

const OUTER = rosette(18.2, 0.55, 24, 0, 240)
const INNER = rosette(16.1, 0.45, 24, Math.PI, 240)

/**
 * The Ahadi mark: a banknote rosette seal holding an "A" whose two legs are the two keys
 * (Ahadi's in indigo, the organiser's in amber). The crossbar is a green tick: a payout
 * settles only where both signatures meet.
 */
export function Seal({ className, title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("size-8", className)} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <path d={OUTER} fill="var(--card, #fff)" stroke="var(--note)" strokeWidth="1.1" strokeLinejoin="round" />
      <path d={INNER} fill="none" stroke="var(--note)" strokeOpacity="0.4" strokeWidth="0.55" />
      <path d="M13.4 28.4 20 11.6" stroke="var(--agent)" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M26.6 28.4 20 11.6" stroke="var(--organiser)" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M15.7 22.1 18.7 24.7 24.4 18.9" stroke="var(--note)" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

const LETTERS = "M15.3 11.2V24M15.3 17.2a6.4 6.6 0 1 1-12.8 0a6.4 6.6 0 1 1 12.8 0 M23.2 2.5V24M23.2 17.4a5.9 6.2 0 0 1 11.8 0V24 M53.9 11.2V24M53.9 17.2a6.4 6.6 0 1 1-12.8 0a6.4 6.6 0 1 1 12.8 0 M73.7 2.5V24M73.7 17.2a6.4 6.6 0 1 1-12.8 0a6.4 6.6 0 1 1 12.8 0 M81.6 11.2V24"
const TITTLE = "M79.6 5.7 L81.6 7.9 L89.4 0.2"

/** The "ahadi" lettering, drawn in the mark's monoline stroke; the i is dotted with the settlement tick. */
export function Lettering({ className }: { className?: string }) {
  return (
    <svg viewBox="0 -1 92 28" className={cn("h-[1.35rem] w-auto", className)} aria-hidden>
      <path d={LETTERS} fill="none" stroke="currentColor" strokeWidth="3.1" strokeLinecap="round" strokeLinejoin="round" />
      <path d={TITTLE} fill="none" stroke="var(--note)" strokeWidth="3.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5 rounded-md text-ink", className)} aria-label="Ahadi home">
      <Seal className="size-9" />
      <Lettering />
    </Link>
  )
}
