import { CircleCheck, CircleAlert } from "lucide-react"

import { usd } from "@/lib/format"
import type { Totals } from "@/lib/types"
import { cn } from "@/lib/utils"

const SEGMENTS = [
  { key: "paid_cents", label: "Paid", color: "var(--note)" },
  { key: "held_cents", label: "Held for winners", color: "var(--held)" },
  { key: "carried_out_cents", label: "Carried forward", color: "var(--carried)" },
  { key: "available_cents", label: "In the fund now", color: "var(--paper-2)" },
] as const

export function FundEquation({ totals, compact = false, className }: { totals: Totals; compact?: boolean; className?: string }) {
  const inflow = totals.received_cents + totals.carried_in_cents + totals.returned_cents
  const denom = Math.max(inflow, 1)
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <div>
          <div className="text-sm text-muted-foreground">Came in</div>
          <div className={cn("tnum font-display font-semibold tracking-tight", compact ? "text-3xl" : "text-4xl sm:text-5xl")}>{usd(inflow)}</div>
        </div>
        <Balanced totals={totals} />
      </div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-paper-2" role="img" aria-label={`Of ${usd(inflow)}: paid ${usd(totals.paid_cents)}, held ${usd(totals.held_cents)}, carried forward ${usd(totals.carried_out_cents)}, in the fund ${usd(totals.available_cents)}`}>
        {SEGMENTS.map((s) => {
          const v = totals[s.key]
          if (v <= 0) return null
          return (
            <div
              key={s.key}
              className="h-full transition-[width] duration-500 ease-[var(--ease-ahadi)] first:rounded-l-full last:rounded-r-full"
              style={{
                width: `${(v / denom) * 100}%`,
                background: s.key === "available_cents" ? "repeating-linear-gradient(135deg, var(--paper-2) 0 5px, var(--hair) 5px 6px)" : s.color,
              }}
            />
          )
        })}
      </div>
      <dl className={cn("grid gap-x-6 gap-y-3", compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4")}>
        {SEGMENTS.map((s) => (
          <div key={s.key} className="min-w-0">
            <dt className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <span className="size-2.5 shrink-0 rounded-full border border-black/5" style={{ background: s.color }} aria-hidden />
              {s.label}
            </dt>
            <dd className="tnum mt-0.5 text-lg font-semibold">{usd(totals[s.key])}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export function Balanced({ totals }: { totals: Totals }) {
  if (totals.chain_balance_cents === null) {
    return <span className="text-sm text-muted-foreground">Chain balance unavailable</span>
  }
  return totals.balanced ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-note-soft px-3 py-1.5 text-sm font-medium text-note-ink" title="The ledger's 'in the fund now' equals the fund account's balance on Stellar testnet">
      <CircleCheck className="size-4" aria-hidden /> Matches the chain to the cent
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-failed-soft px-3 py-1.5 text-sm font-medium text-failed">
      <CircleAlert className="size-4" aria-hidden /> Ledger {usd(totals.available_cents)} vs chain {usd(totals.chain_balance_cents)}
    </span>
  )
}
