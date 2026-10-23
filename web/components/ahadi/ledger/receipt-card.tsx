import { Seal } from "@/components/ahadi/brand"
import { Guilloche, GuillocheBand } from "@/components/ahadi/guilloche"
import { Hash } from "@/components/ahadi/hash"
import { KIND, KindChip } from "@/components/ahadi/status"
import { EXPLORER_ACCOUNT, EXPLORER_TX, usd } from "@/lib/format"
import { fullTime, headline, stroops, type LineDetail } from "@/lib/ledger-data"
import { cn } from "@/lib/utils"

/** One ledger line printed as a receipt: guilloché edges, a perforation, and the real artefacts in mono. */
export function ReceiptCard({ line, eventName, partyLabel }: { line: LineDetail; eventName: string; partyLabel: string }) {
  const k = KIND[line.kind]
  const sign = k?.sign ?? 0
  const ledgerNo = line.kind !== "control" && line.proposal?.result?.tx_hash === line.tx_hash ? line.proposal?.result?.ledger : null
  const rid = line.request_id?.replace(/^(rule|carry):/, "") ?? null
  const d = line.detail ?? {}

  const rows: { k: string; v: React.ReactNode }[] = [
    { k: sign > 0 ? "From" : line.kind === "carried_out" ? "To" : "Party", v: partyLabel },
  ]
  if (line.party_public) rows.push({ k: "Wallet", v: <Hash value={line.party_public} href={EXPLORER_ACCOUNT + line.party_public} head={6} tail={6} /> })
  rows.push({ k: "Recorded", v: fullTime(line.created_at) })
  if (line.tx_hash) rows.push({ k: "Transaction", v: <Hash value={line.tx_hash} href={EXPLORER_TX + line.tx_hash} head={8} tail={8} /> })
  else if (d.attempted_tx) rows.push({ k: "Attempted", v: <Hash value={d.attempted_tx} head={8} tail={8} /> })
  if (ledgerNo) rows.push({ k: "Ledger", v: <span className="tnum">{Number(ledgerNo).toLocaleString("en-US")}</span> })
  if (line.fee_stroops) rows.push({ k: "Network fee", v: <span className="tnum">{stroops(line.fee_stroops)}</span> })
  if (rid) rows.push({ k: "Request fingerprint", v: <Hash value={rid} head={8} tail={8} /> })

  return (
    <article className="relative overflow-hidden rounded-2xl border bg-card shadow-lg" aria-label={`Receipt for line ${line.seq}`}>
      <GuillocheBand />
      <Guilloche className="pointer-events-none absolute -right-24 -bottom-24 size-72 opacity-40 [mask-image:radial-gradient(circle_at_60%_60%,black_30%,transparent_70%)]" />

      <div className="relative px-6 pt-4 pb-6 sm:px-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Seal className="size-9" />
            <div>
              <div className="font-display text-lg leading-tight font-semibold">Ahadi receipt</div>
              <div className="text-sm text-muted-foreground">{eventName}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Line</div>
            <div className="tnum font-display text-2xl leading-none font-semibold">{String(line.seq).padStart(3, "0")}</div>
          </div>
        </div>

        <div className="mt-6">
          <KindChip kind={line.kind} />
          <div className={cn("tnum mt-3 font-display font-semibold tracking-tight", line.amount_cents === 0 ? "text-3xl text-muted-foreground" : "text-5xl", sign === 0 && line.amount_cents > 0 && "text-muted-foreground line-through decoration-2")}>
            {line.amount_cents === 0 ? "No money moved" : usd(line.amount_cents)}
          </div>
          <p className="mt-2 text-ink-2">{headline(line)}.</p>
        </div>
      </div>

      {/* perforation */}
      <div className="relative h-6" aria-hidden>
        <span className="absolute top-1/2 -left-3 size-6 -translate-y-1/2 rounded-full border bg-paper" />
        <span className="absolute top-1/2 -right-3 size-6 -translate-y-1/2 rounded-full border bg-paper" />
        <span className="absolute inset-x-5 top-1/2 border-t-2 border-dashed border-hair" />
      </div>

      <dl className="relative space-y-2.5 px-6 pt-3 pb-6 text-sm sm:px-8">
        {rows.map((r) => (
          <div key={r.k} className="flex items-baseline gap-2">
            <dt className="shrink-0 text-muted-foreground">{r.k}</dt>
            <span className="mb-1 min-w-4 flex-1 border-b border-dotted border-hair" aria-hidden />
            <dd className="min-w-0 text-right break-words">{r.v}</dd>
          </div>
        ))}
      </dl>

      <div className="relative border-t border-dashed bg-paper/60 px-6 py-3 sm:px-8">
        <p className="text-xs text-muted-foreground">
          Stellar testnet. {line.tx_hash ? "Anyone can check this receipt without trusting Ahadi." : "No transaction settled, so the ledger line is the record."}
        </p>
        {line.tx_hash && <p className="hash mt-1 truncate text-[0.6875rem] text-muted-foreground">/verify?tx={line.tx_hash}</p>}
      </div>
      <GuillocheBand className="rotate-180" />
    </article>
  )
}
