import Link from "next/link"

import { Hash } from "@/components/ahadi/hash"
import { KindChip } from "@/components/ahadi/status"
import { EXPLORER_ACCOUNT, EXPLORER_TX, pct, usd } from "@/lib/format"
import { longDate, ordinal, placeOutcomes } from "@/lib/ledger-data"
import type { Line, Placement } from "@/lib/types"

const CHAIN: Record<string, string> = { solana: "Solana", ethereum: "Ethereum", base: "Base", near: "NEAR" }

function route(p: Placement, line: Line | undefined, claimDays: number): { label: string; sub: string } {
  if (line?.kind === "held") return { label: "Held as a claimable balance", sub: `Wallet not activated; ${claimDays} days to claim` }
  if (p.wants_other_chain) return { label: "Stellar, then cross-chain", sub: `USDC on ${CHAIN[p.wants_other_chain] ?? p.wants_other_chain}, dry quote only` }
  return { label: "Direct to wallet", sub: "One Stellar payment, two signatures" }
}

export function Placements({ placements, prizes, shares, lines, claimDays }: { placements: Placement[]; prizes: number[]; shares: number[]; lines: Line[]; claimDays: number }) {
  const outcomes = placeOutcomes(lines)
  const cols = "md:grid-cols-[3.5rem_minmax(0,1.5fr)_7rem_minmax(0,1.5fr)_minmax(0,1.1fr)_minmax(0,1.1fr)]"
  return (
    <div className="mt-8 overflow-hidden rounded-2xl border bg-card">
      <div className={`hidden gap-4 border-b px-5 py-3 text-sm text-muted-foreground md:grid ${cols}`} aria-hidden>
        <span>Place</span>
        <span>Winner</span>
        <span className="text-right">Prize</span>
        <span>Route</span>
        <span>Status</span>
        <span>Receipt</span>
      </div>
      <ul>
        {placements.map((p) => {
          const o = outcomes.get(p.place)
          const line = o?.line
          const failedFirst = o?.history.find((h) => h.kind === "failed")
          const r = route(p, line, claimDays)
          const claimBy = line?.kind === "held" && line.detail?.claim_expiry ? longDate(new Date(line.detail.claim_expiry * 1000).toISOString()) : null
          return (
            <li key={p.place} className={`grid grid-cols-[2.75rem_minmax(0,1fr)_auto] gap-x-3 gap-y-3 border-b px-4 py-4 last:border-0 md:items-center md:gap-4 md:px-5 ${cols}`}>
              <span className="tnum font-display text-lg font-semibold text-ink-2">{ordinal(p.place)}</span>
              <div className="min-w-0">
                <div className="font-medium">{p.team}</div>
                <div className="text-sm text-muted-foreground">
                  {p.person}, {p.city}
                </div>
                <Hash value={p.public} href={EXPLORER_ACCOUNT + p.public} head={5} tail={4} className="mt-0.5 text-muted-foreground" label={`Open ${p.team}'s wallet on the block explorer`} />
              </div>
              <div className="text-right">
                <div className="tnum font-semibold">{usd(prizes[p.place - 1] ?? 0)}</div>
                <div className="tnum text-xs text-muted-foreground">{pct(shares[p.place - 1] ?? 0)} of awards</div>
              </div>
              <div className="col-span-2 col-start-2 min-w-0 md:col-span-1 md:col-start-auto">
                <div className="text-sm font-medium">{r.label}</div>
                <div className="text-xs text-muted-foreground">{r.sub}</div>
              </div>
              <div className="col-span-2 col-start-2 flex flex-col items-start gap-1 md:col-span-1 md:col-start-auto">
                {line ? <KindChip kind={line.kind} /> : <span className="rounded-full border border-dashed px-2.5 py-1 text-xs text-muted-foreground">Not paid yet</span>}
                {claimBy && <span className="text-xs text-ink-2">Claimable until {claimBy}</span>}
                {failedFirst && line?.kind !== "failed" && (
                  <Link href={`/receipt/${failedFirst.id}`} className="rounded text-xs text-muted-foreground underline-offset-4 hover:underline">
                    After a failed first attempt
                  </Link>
                )}
              </div>
              <div className="col-span-2 col-start-2 flex flex-wrap items-center gap-x-3 gap-y-1 md:col-span-1 md:col-start-auto">
                {line?.tx_hash ? <Hash value={line.tx_hash} href={EXPLORER_TX + line.tx_hash} /> : <span className="text-sm text-muted-foreground">No receipt yet</span>}
                {line && (
                  <Link href={`/receipt/${line.id}`} className="rounded text-sm font-medium text-note underline-offset-4 hover:underline" aria-label={`Proof for the ${ordinal(p.place)} place payout`}>
                    Proof
                  </Link>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
