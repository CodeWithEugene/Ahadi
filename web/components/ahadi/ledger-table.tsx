"use client"

import Link from "next/link"
import { useMemo, useState } from "react"

import { Hash } from "@/components/ahadi/hash"
import { KIND, KindChip } from "@/components/ahadi/status"
import { EXPLORER_TX, short, usd, when } from "@/lib/format"
import type { Line, LineKind } from "@/lib/types"
import { cn } from "@/lib/utils"

const FILTERS: { id: string; label: string; kinds: LineKind[] | null }[] = [
  { id: "all", label: "Everything", kinds: null },
  { id: "money", label: "Money in and out", kinds: ["received", "paid", "held", "carried_out", "carried_in", "returned"] },
  { id: "problems", label: "Failures and refusals", kinds: ["failed", "rejected", "duplicate", "control"] },
  { id: "rule", label: "Rule and attestation", kinds: ["rule", "attested"] },
]

export function lineNote(l: Line): string | null {
  const d = l.detail ?? {}
  if (l.kind === "failed") return `${d.text ?? ""}${d.next === "claimable" ? " Rerouted to a held prize." : ""}`
  if (l.kind === "rejected") return d.reason ?? null
  if (l.kind === "duplicate") return d.reason ?? "Already handled."
  if (l.kind === "control") return d.text ?? null
  if (l.kind === "attested") return `${d.eligible} of ${d.target} target teams qualified, releasing ${(d.release_bp / 100).toFixed(0)}% for awards.`
  if (l.kind === "held" && d.claim_expiry) return `Claimable until ${new Date(d.claim_expiry * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}.`
  if (l.kind === "rule") return `Fingerprint ${short(d.rule_hash, 10, 6)}`
  if (l.kind === "paid" && d.quote) return `Winner asked for USDC on ${d.quote.to_chain}: simulated dry quote ${d.quote.amount_out} out.`
  return null
}

export function LedgerTable({ lines, compact = false, partyNames }: { lines: Line[]; compact?: boolean; partyNames?: Record<string, string> }) {
  const [filter, setFilter] = useState("all")
  const shown = useMemo(() => {
    const f = FILTERS.find((x) => x.id === filter)
    const ls = f?.kinds ? lines.filter((l) => f.kinds!.includes(l.kind)) : lines
    return [...ls].reverse()
  }, [lines, filter])

  return (
    <div className="space-y-3">
      {!compact && (
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter ledger lines">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm transition-colors",
                filter === f.id ? "border-ink bg-ink text-paper" : "border-hair bg-card text-ink-2 hover:border-ink/40",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <caption className="sr-only">Ledger lines, newest first</caption>
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th scope="col" className="w-12 px-4 py-3 font-medium">Line</th>
              <th scope="col" className="px-4 py-3 font-medium">What happened</th>
              <th scope="col" className="px-4 py-3 font-medium">Who</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Amount</th>
              <th scope="col" className="px-4 py-3 font-medium">Receipt</th>
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  Nothing here yet.
                </td>
              </tr>
            )}
            {shown.map((l) => {
              const k = KIND[l.kind]
              const note = lineNote(l)
              const signed = (k?.sign ?? 0) * l.amount_cents
              return (
                <tr key={l.id} className="group border-b last:border-0 hover:bg-paper/70">
                  <td className="tnum px-4 py-3 align-top text-muted-foreground">
                    <Link href={`/receipt/${l.id}`} className="rounded hover:text-foreground" aria-label={`Open line ${l.seq}`}>
                      {l.seq}
                    </Link>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-col items-start gap-1.5">
                      <KindChip kind={l.kind} />
                      {note && <p className="max-w-md text-[0.8125rem] leading-snug text-ink-2">{note}</p>}
                      <span className="text-xs text-muted-foreground">{when(l.created_at)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="font-medium">{l.party ? (partyNames?.[l.party] ?? l.party) : <span className="text-muted-foreground">Not recorded</span>}</div>
                    {l.party_public && <div className="hash text-muted-foreground">{short(l.party_public, 5, 4)}</div>}
                  </td>
                  <td className={cn("tnum px-4 py-3 text-right align-top font-semibold whitespace-nowrap", signed > 0 && "text-note-ink", (l.amount_cents === 0 || signed === 0) && "text-muted-foreground font-normal")}>
                    {l.amount_cents === 0 ? <span className="text-xs">No money</span> : signed === 0 ? <span className="text-muted-foreground line-through decoration-1">{usd(l.amount_cents)}</span> : usd(signed, { sign: true })}
                  </td>
                  <td className="px-4 py-3 align-top">
                    {l.tx_hash ? (
                      <div className="flex flex-col gap-1">
                        <Hash value={l.tx_hash} href={EXPLORER_TX + l.tx_hash} />
                        <Link href={`/receipt/${l.id}`} className="text-xs text-note underline-offset-4 hover:underline">
                          Check this line
                        </Link>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">{l.kind === "control" || l.kind === "failed" ? "Nothing settled" : "Off chain record"}</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
