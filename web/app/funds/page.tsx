import { CircleAlert, CircleCheck } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { Hash } from "@/components/ahadi/hash"
import { PageIntro } from "@/components/ahadi/docs/page-parts"
import {
  Figure,
  LedgerSection,
  StatusPill,
} from "@/components/ahadi/ledger/bits"
import { MoneyFlow, MoneyFlowList } from "@/components/ahadi/ledger/money-flow"
import { OfflineState } from "@/components/ahadi/ledger/offline"
import { getEvents, getFund, tryServer } from "@/lib/api"
import { EXPLORER_ACCOUNT, EXPLORER_TX, usd } from "@/lib/format"
import { eventIdFor, longDate } from "@/lib/ledger-data"
import type { EventSummary, FundView } from "@/lib/types"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Public ledger",
  description:
    "Every Ahadi prize fund, linked by the reserves carried from one event to the next. Each line has a receipt on Stellar testnet.",
}

/** Order funds along the carry-forward chain: start from a fund nothing carried into. */
function chain(funds: FundView[]): FundView[] {
  const byId = new Map(funds.map((f) => [f.event.event_id, f]))
  const events = funds.map((f) => ({ event_id: f.event.event_id, name: f.event.name }))
  const nextOf = (f: FundView) =>
    eventIdFor(f.lines.find((l) => l.kind === "carried_out")?.party, events)
  const targets = new Set(funds.map(nextOf).filter(Boolean))
  const out: FundView[] = []
  const seen = new Set<string>()
  const firstSeq = (f: FundView) =>
    Math.min(...f.lines.map((l) => l.seq), Number.MAX_SAFE_INTEGER)
  const when = (f: FundView) => Date.parse(`1 ${f.event.short ?? ""}`) || 0
  const starts = funds
    .filter((f) => !targets.has(f.event.event_id))
    .sort((a, b) => firstSeq(a) - firstSeq(b) || when(a) - when(b))
  for (const start of starts) {
    let f: FundView | undefined = start
    while (f && !seen.has(f.event.event_id)) {
      out.push(f)
      seen.add(f.event.event_id)
      const n = nextOf(f)
      f = n ? byId.get(n) : undefined
    }
  }
  for (const f of funds) if (!seen.has(f.event.event_id)) out.push(f)
  return out
}

export default async function FundsPage() {
  const events = await tryServer(getEvents)
  // One at a time: the bridge mishandles concurrent fund reads.
  const loaded: FundView[] = []
  for (const e of events ?? []) {
    const f = await tryServer(() => getFund(e.event_id))
    if (f) loaded.push(f)
  }
  const funds = chain(loaded)
  const summaries = new Map((events ?? []).map((e) => [e.event_id, e]))

  const deposited = funds.reduce((s, f) => s + f.totals.received_cents, 0)
  const paid = funds.reduce((s, f) => s + f.totals.paid_cents, 0)
  const held = funds.reduce((s, f) => s + f.totals.held_cents, 0)
  const carried = funds.reduce((s, f) => s + f.totals.carried_out_cents, 0)
  const allBalanced = funds.length > 0 && funds.every((f) => f.totals.balanced)
  const nothingMoved = funds.every(
    (f) => f.totals.received_cents + f.totals.carried_in_cents === 0
  )

  return (
    <>
      <PageIntro
        title="The public ledger"
        aside={
          funds.length > 0 && (
            <dl className="grid w-full max-w-4xl grid-cols-2 overflow-hidden rounded-2xl border bg-paper/60 text-left sm:grid-cols-4">
              <Stat k="Deposited by sponsors" v={usd(deposited)} />
              <Stat k="Paid to winners" v={usd(paid)} tone="text-note-ink" />
              <Stat k="Held for winners" v={usd(held)} tone="text-held" />
              <Stat
                k="Carried to the next event"
                v={usd(carried)}
                tone="text-carried"
              />
            </dl>
          )
        }
      >
        <p>
          Every event&apos;s prize fund, and every dollar that moved through it.
          What one rule does not award flows into the next fund, so the funds
          read as one continuous chain.{" "}
          {allBalanced && (
            <>
              Each balance matches its account on Stellar testnet to the cent.
            </>
          )}
        </p>
      </PageIntro>

      <div className="ahadi-page space-y-20 pt-12 pb-24">
        {!events && <OfflineState />}
        {events && funds.length === 0 && (
          <div className="rounded-2xl border border-dashed bg-card px-6 py-14 text-center">
            <h2 className="text-xl font-semibold">No funds yet</h2>
            <p className="mx-auto mt-2 max-w-md text-ink-2">
              When an organiser publishes a funding rule, the event&apos;s fund
              appears here with its ledger.
            </p>
          </div>
        )}

        {funds.length > 0 && (
          <LedgerSection
            id="flow"
            title="Where the money went"
            lede="Each band is real money on Stellar testnet, drawn to scale from the ledger. Click a winner or the carry to open its receipt, or a fund to open its ledger."
          >
            {nothingMoved ? (
              <NothingYet funds={funds} />
            ) : (
              <Figure
                label="Where the money went"
                className="hidden md:block"
                caption={
                  carried > 0
                    ? `The reserve the first rule did not award, ${usd(carried)}, left in one transaction signed by both keys and opened the next fund.`
                    : "As payouts settle, each one appears here as its own band, linked to its receipt."
                }
              >
                <MoneyFlow funds={funds} />
              </Figure>
            )}
            {!nothingMoved && (
              <div className="mt-8 md:hidden">
                <MoneyFlowList funds={funds} />
                <p className="mx-auto mt-4 max-w-md text-center text-sm text-muted-foreground">
                  Bars are drawn to scale. Dashed ones are set by the rule but not settled yet. Tap a line to open its receipt.
                </p>
              </div>
            )}
          </LedgerSection>
        )}

        {funds.length > 0 && (
          <LedgerSection
            id="statements"
            title="Fund statements"
            lede="One statement per fund, oldest first. The closing balance is checked against the fund's account on chain every time this page loads."
          >
            <ol
              className={cn(
                "mt-8 grid gap-6",
                funds.length > 1 && "lg:grid-cols-2",
                funds.length > 2 && "2xl:grid-cols-3"
              )}
            >
              {funds.map((f, i) => (
                <li key={f.event.event_id} className="min-w-0">
                  <Statement
                    fund={f}
                    summary={summaries.get(f.event.event_id)}
                    index={i + 1}
                    from={funds[i - 1] ?? null}
                  />
                </li>
              ))}
            </ol>
          </LedgerSection>
        )}
      </div>
    </>
  )
}

function Stat({ k, v, tone }: { k: string; v: string; tone?: string }) {
  return (
    <div className="border-hair px-5 py-4 [&:not(:first-child)]:border-l max-sm:[&:nth-child(3)]:border-l-0 max-sm:[&:nth-child(n+3)]:border-t">
      <dt className="text-sm text-muted-foreground">{k}</dt>
      <dd
        className={cn(
          "tnum mt-1 font-display text-xl font-semibold sm:text-2xl",
          tone
        )}
      >
        {v}
      </dd>
    </div>
  )
}

function Statement({
  fund,
  summary,
  index,
  from,
}: {
  fund: FundView
  summary?: EventSummary
  index: number
  from: FundView | null
}) {
  const { event, totals, rule, lines } = fund
  const ruleLine = lines.find((l) => l.kind === "rule")
  const carriedIn = lines.find((l) => l.kind === "carried_in")
  const carriedOut = lines.find((l) => l.kind === "carried_out")
  const paidN = lines.filter((l) => l.kind === "paid").length
  const heldN = lines.filter((l) => l.kind === "held").length
  const problems = lines.filter((l) =>
    ["failed", "rejected", "duplicate", "control"].includes(l.kind)
  ).length
  const opening = totals.carried_in_cents

  const rows: {
    k: React.ReactNode
    v: number
    sign: 1 | -1
    tone?: string
    href?: string
  }[] = []
  if (opening > 0)
    rows.push({
      k: <>Carried in from {from?.event.short ?? "the previous event"}</>,
      v: opening,
      sign: 1,
      tone: "text-carried",
      href: carriedIn ? `/receipt/${carriedIn.id}` : undefined,
    })
  rows.push({ k: "Deposits from sponsors", v: totals.received_cents, sign: 1 })
  if (totals.returned_cents > 0)
    rows.push({
      k: "Unclaimed prizes returned",
      v: totals.returned_cents,
      sign: 1,
    })
  rows.push({
    k: `Paid to winners${paidN ? ` (${paidN})` : ""}`,
    v: totals.paid_cents,
    sign: -1,
  })
  rows.push({
    k: `Held for winners${heldN ? ` (${heldN})` : ""}`,
    v: totals.held_cents,
    sign: -1,
    tone: "text-held",
  })
  rows.push({
    k: "Carried to the next event",
    v: totals.carried_out_cents,
    sign: -1,
    tone: "text-carried",
    href: carriedOut ? `/receipt/${carriedOut.id}` : undefined,
  })

  return (
    <article
      className="flex h-full flex-col overflow-hidden rounded-2xl border bg-card"
      aria-labelledby={`st-${event.event_id}`}
    >
      <header className="flex flex-wrap items-start justify-between gap-4 border-b px-6 pt-5 pb-4 sm:px-7">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="tnum">Statement {index}</span>
            <StatusPill status={event.status} />
          </div>
          <h3
            id={`st-${event.event_id}`}
            className="mt-2 text-2xl font-semibold"
          >
            <Link
              href={`/funds/${event.event_id}`}
              className="rounded hover:text-note"
            >
              {event.name}
            </Link>
          </h3>
          <p className="mt-0.5 text-ink-2">
            {event.cities.join(", ")}
            {event.registered != null && (
              <span className="tnum">
                , {event.registered} teams registered
                {event.eligible != null ? `, ${event.eligible} eligible` : ""}
              </span>
            )}
          </p>
        </div>
        <div className="text-right text-sm">
          <div className="text-muted-foreground">Prize pool in the rule</div>
          <div className="tnum font-display text-xl font-semibold">
            {usd(summary?.pool_cents ?? rule.pool_cents)}
          </div>
        </div>
      </header>

      <div className="flex-1 px-6 py-5 sm:px-7">
        <table className="w-full text-[0.9375rem]">
          <caption className="sr-only">
            Money in and out of the {event.name} fund
          </caption>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <th
                  scope="row"
                  className="py-1.5 pr-2 text-left font-normal text-ink-2"
                >
                  <span className="flex items-baseline gap-2">
                    {r.href ? (
                      <Link
                        href={r.href}
                        className="rounded underline decoration-hair underline-offset-4 hover:decoration-note"
                      >
                        {r.k}
                      </Link>
                    ) : (
                      <span>{r.k}</span>
                    )}
                    <span
                      className="mb-1 flex-1 border-b border-dotted border-hair"
                      aria-hidden
                    />
                  </span>
                </th>
                <td
                  className={cn(
                    "tnum py-1.5 text-right whitespace-nowrap",
                    r.v === 0 ? "text-muted-foreground" : r.tone
                  )}
                >
                  {r.v === 0 ? usd(0) : usd(r.sign * r.v, { sign: true })}
                </td>
              </tr>
            ))}
            <tr className="border-t border-ink/70">
              <th scope="row" className="pt-3 text-left font-semibold">
                Balance in the fund
              </th>
              <td className="tnum pt-3 text-right font-display text-xl font-semibold whitespace-nowrap">
                {usd(totals.available_cents)}
              </td>
            </tr>
          </tbody>
        </table>
        <p
          className={cn(
            "mt-3 flex items-center justify-end gap-1.5 text-sm",
            totals.balanced ? "text-note-ink" : "text-failed"
          )}
        >
          {totals.balanced ? (
            <CircleCheck className="size-4" aria-hidden />
          ) : (
            <CircleAlert className="size-4" aria-hidden />
          )}
          {totals.chain_balance_cents === null
            ? "Chain balance unavailable right now"
            : totals.balanced
              ? "Equal to the account on Stellar testnet"
              : `Chain says ${usd(totals.chain_balance_cents)}`}
        </p>
      </div>

      <dl className="grid gap-x-6 gap-y-3 border-t bg-paper/50 px-6 py-4 text-sm sm:grid-cols-2 sm:px-7">
        <div className="min-w-0">
          <dt className="text-muted-foreground">
            Rule fingerprint
            {ruleLine ? `, recorded ${longDate(ruleLine.created_at)}` : ""}
          </dt>
          <dd className="mt-0.5">
            {event.rule_hash ? (
              <Hash
                value={event.rule_hash}
                href={
                  event.rule_published_tx
                    ? EXPLORER_TX + event.rule_published_tx
                    : undefined
                }
                head={10}
                tail={6}
                label="Open the rule record on the block explorer"
              />
            ) : (
              "Not recorded yet"
            )}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-muted-foreground">Fund account, 2 of 2</dt>
          <dd className="mt-0.5">
            <Hash
              value={event.fund}
              href={EXPLORER_ACCOUNT + event.fund}
              head={8}
              tail={6}
              label="Open the fund account on the block explorer"
            />
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Ledger lines</dt>
          <dd className="tnum mt-0.5">
            {lines.length}
            {problems > 0 && (
              <span className="text-ink-2">
                , {problems} failures and refusals on the record
              </span>
            )}
          </dd>
        </div>
        <div className="flex items-end sm:justify-end">
          <Link
            href={`/funds/${event.event_id}`}
            className="inline-flex items-center rounded-lg bg-note px-4 py-2 font-medium text-white transition-colors hover:bg-note-ink"
          >
            Open the ledger<span className="sr-only"> for {event.name}</span>
          </Link>
        </div>
      </dl>
    </article>
  )
}

function NothingYet({ funds }: { funds: FundView[] }) {
  return (
    <div className="mt-8 rounded-2xl border border-dashed bg-card px-6 py-10 text-center sm:px-10">
      <p className="mx-auto max-w-2xl text-ink-2">
        Nothing has moved yet. The rules are on record, so this is what each
        fund will hold once its sponsor deposits. The picture fills in, band by
        band, as money arrives and payouts settle.
      </p>
      <ol className="mt-6 flex flex-col items-center justify-center gap-3 md:flex-row">
        {funds.map((f, i) => (
          <li key={f.event.event_id} className="flex items-center gap-3">
            {i > 0 && (
              <span
                className="hidden h-px w-10 border-t border-dashed border-carried md:block"
                aria-hidden
              />
            )}
            <Link
              href={`/funds/${f.event.event_id}`}
              className="rounded-xl border border-dashed px-4 py-3 hover:border-note"
            >
              <span className="block text-sm text-muted-foreground">
                {f.event.short ?? f.event.name}
              </span>
              <span className="tnum font-display text-lg font-semibold">
                {usd(f.rule.pool_cents)}
              </span>
              <span className="block text-xs text-muted-foreground">
                pool in the rule
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  )
}
