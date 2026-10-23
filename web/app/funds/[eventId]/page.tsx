import { CircleCheck, Download } from "lucide-react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { FundEquation } from "@/components/ahadi/fund-equation"
import { Hash } from "@/components/ahadi/hash"
import { CodeBlock } from "@/components/ahadi/docs/code-block"
import { DocNav, type NavGroup } from "@/components/ahadi/docs/doc-nav"
import { DataTable } from "@/components/ahadi/docs/page-parts"
import { Crumbs, LedgerSection, StatusPill } from "@/components/ahadi/ledger/bits"
import { CarryCard } from "@/components/ahadi/ledger/carry-card"
import { LedgerViews } from "@/components/ahadi/ledger/ledger-views"
import { OfflineState } from "@/components/ahadi/ledger/offline"
import { Placements } from "@/components/ahadi/ledger/placements"
import { RuleDocument } from "@/components/ahadi/ledger/rule-card"
import { Waterfall } from "@/components/ahadi/ledger/waterfall"
import { ApiError, getEvents, getFund, tryServer } from "@/lib/api"
import { EXPLORER_ACCOUNT, pct, usd } from "@/lib/format"
import { eventIdFor, readStep } from "@/lib/ledger-data"
import type { FundView } from "@/lib/types"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

type Props = { params: Promise<{ eventId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { eventId } = await params
  const fund = await tryServer(() => getFund(eventId))
  return {
    title: fund ? `${fund.event.name} ledger` : "Public ledger",
    description: fund ? `Every dollar of the ${fund.event.name} prize fund, with a Stellar testnet receipt for each line.` : undefined,
  }
}

const SITE = "https://ahadi.codewitheugene.top"

export default async function FundPage({ params }: Props) {
  const { eventId } = await params
  let fund: FundView
  try {
    fund = await getFund(eventId)
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound()
    return (
      <div className="ahadi-page py-16">
        <Crumbs items={[{ label: "Public ledger", href: "/funds" }, { label: eventId }]} />
        <OfflineState className="mt-8" />
      </div>
    )
  }
  const events = (await tryServer(getEvents)) ?? []
  const nameOf = (id: string) => events.find((e) => e.event_id === id)?.name ?? id
  const partyNames = Object.fromEntries(events.map((e) => [e.event_id, e.name]))

  const { event, rule, derivation, placements, totals, lines } = fund
  const ruleLine = lines.find((l) => l.kind === "rule") ?? null
  const carriedIn = lines.find((l) => l.kind === "carried_in")
  const carriedOut = lines.find((l) => l.kind === "carried_out")
  const feeXlm = (totals.network_fee_stroops / 1e7).toFixed(7).replace(/0+$/, "").replace(/\.$/, "")
  const problems = lines.filter((l) => ["failed", "rejected", "duplicate", "control"].includes(l.kind)).length

  const nav: NavGroup[] = [
    {
      title: event.short ?? "This fund",
      items: [
        { id: "money", label: "Where the money is" },
        { id: "rule", label: "The rule" },
        { id: "derivation", label: "The derivation" },
        ...(derivation && placements?.length ? [{ id: "winners", label: "Winners and payouts" }] : []),
        { id: "ledger", label: "The ledger" },
        { id: "export", label: "Export" },
      ],
    },
  ]

  const facts: { k: string; v: string; tone?: string }[] = [
    { k: "Prize pool", v: usd(rule.pool_cents) },
    { k: "Released for prizes", v: derivation ? `${usd(derivation.award_cents)}, ${pct(derivation.release_bp)}` : "At the cutoff" },
    { k: "Paid", v: usd(totals.paid_cents), tone: "text-note-ink" },
    { k: "Held for winners", v: usd(totals.held_cents), tone: "text-held" },
    { k: carriedIn ? "Carried in" : "Carried forward", v: usd(carriedIn ? totals.carried_in_cents : totals.carried_out_cents), tone: "text-carried" },
    { k: "In the fund now", v: usd(totals.available_cents) },
  ]

  return (
    <>
      <header className="border-b bg-card">
        <div className="ahadi-page pt-8 pb-10 lg:pt-10">
          <Crumbs items={[{ label: "Public ledger", href: "/funds" }, { label: event.name }]} />
          <div className="mx-auto mt-6 flex max-w-4xl flex-col items-center text-center">
            <h1 className="text-[2.5rem] leading-[1.04] font-semibold sm:text-5xl lg:text-[3.5rem]">{event.name}</h1>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-ink-2">
              <StatusPill status={event.status} />
              <span>{event.cities.join(", ")}</span>
              {event.registered !== null && (
                <span className="tnum">
                  {event.registered} teams registered{event.eligible !== null ? `, ${event.eligible} eligible` : ""}
                </span>
              )}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm">
              <span className="text-muted-foreground">Fund account, 2 of 2 vault on Stellar testnet</span>
              <Hash value={event.fund} href={EXPLORER_ACCOUNT + event.fund} head={10} tail={8} label="Open the fund account on the block explorer" />
              {totals.balanced && (
                <span className="flex items-center gap-1.5 text-note-ink">
                  <CircleCheck className="size-4" aria-hidden /> Ledger equals the chain balance
                </span>
              )}
            </div>
          </div>
          <dl className="mt-8 grid grid-cols-2 overflow-hidden rounded-2xl border bg-paper/60 sm:grid-cols-3 xl:grid-cols-6">
            {facts.map((f, i) => (
              <div key={f.k} className={cn("border-hair px-5 py-4", i > 0 && "border-l", "max-sm:[&:nth-child(odd)]:border-l-0 max-sm:[&:nth-child(n+3)]:border-t", "sm:max-xl:[&:nth-child(3n+1)]:border-l-0 sm:max-xl:[&:nth-child(n+4)]:border-t")}>
                <dt className="text-sm text-muted-foreground">{f.k}</dt>
                <dd className={cn("tnum mt-1 font-display text-lg font-semibold sm:text-xl", f.tone)}>{f.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      <div className="ahadi-page pb-24 lg:grid lg:grid-cols-[13.5rem_minmax(0,1fr)] lg:gap-12 lg:pt-12 2xl:grid-cols-[15rem_minmax(0,1fr)] 2xl:gap-16">
        <DocNav groups={nav} label="Sections of this ledger" />

        <div className="min-w-0 space-y-20 pt-10 lg:pt-0">
          <LedgerSection
            id="money"
            title="Where the money is"
            lede={`Everything that came in, and where each dollar went. The balance is read live from the fund's account. Network fees so far: ${feeXlm} XLM, paid in testnet lumens, never from prize money.`}
          >
            <div className="mt-8 space-y-6">
              {carriedIn && <CarryCard line={carriedIn} direction="in" otherName={carriedIn.party ?? nameOf(carriedIn.detail?.from_event)} otherId={carriedIn.detail?.from_event ?? ""} />}
              <div className="rounded-2xl border bg-card p-5 sm:p-8">
                <FundEquation totals={totals} />
              </div>
              {carriedOut && <CarryCard line={carriedOut} direction="out" otherName={nameOf(eventIdFor(carriedOut.party, events) ?? carriedOut.party ?? "")} otherId={eventIdFor(carriedOut.party, events) ?? ""} />}
            </div>
          </LedgerSection>

          <LedgerSection
            id="rule"
            title="The rule"
            lede="Fixed before anyone registered, and recorded on Stellar as a fingerprint. If a single character of it changed, the fingerprint would not match. Check it yourself: your browser can recompute it."
          >
            <div className="mt-8">
              <RuleDocument rule={rule} ruleLine={ruleLine} publishedTx={event.rule_published_tx} />
            </div>
          </LedgerSection>

          <LedgerSection
            id="derivation"
            title={derivation ? `How ${usd(rule.pool_cents)} became these prizes` : "How the pool will become prizes"}
            lede={
              derivation
                ? `At the cutoff the organiser attested ${derivation.eligible} eligible teams. Ahadi applied the rule in MeTTa, step by step. The language model never picks a number.`
                : "Nothing has been derived yet. When registration closes and the organiser attests how many teams qualified, Ahadi applies the rule. This is what the rule already fixes."
            }
          >
            <div className={cn("mt-8 grid items-start gap-6 [&>*]:min-w-0", derivation && "2xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]")}>
              <figure>
                <div className="overflow-x-auto rounded-2xl border bg-card p-4 sm:p-6" tabIndex={0} role="group" aria-label="The derivation as a picture">
                  <div className="min-w-[640px]">
                    <Waterfall fund={fund} />
                  </div>
                </div>
                <figcaption className="mx-auto mt-3 max-w-2xl text-center text-sm text-muted-foreground">
                  Drawn to scale. Solid bars have settled; dashed ones are fixed by the rule but not paid yet.
                </figcaption>
              </figure>
              {derivation && (
                <DataTable
                  caption="The derivation steps"
                  minWidth={560}
                  head={["Step", "What", "Worked out", <span key="r" className="block text-right">Result</span>]}
                  colClassName={["w-12 tnum", "", "tnum", "text-right tnum font-semibold text-ink whitespace-nowrap"]}
                  rows={derivation.steps.map((st, i) => {
                    const r = readStep(st)
                    return [
                      <span key="n" className="text-muted-foreground">{i + 1}</span>,
                      <span key="w">
                        <span className="font-medium text-ink">{r.label}</span>
                        <span className="hash block text-xs text-muted-foreground">{st.rule}</span>
                      </span>,
                      <span key="f">
                        {r.formula}
                        {r.note && <span className="block text-carried">{r.note}</span>}
                      </span>,
                      r.result,
                    ]
                  })}
                />
              )}
            </div>
          </LedgerSection>

          {derivation && placements && placements.length > 0 && (
            <LedgerSection
              id="winners"
              title="Winners and their payouts"
              lede="Each prize comes straight from the derivation. The route says how it travels; a payout that cannot be delivered is held for its winner instead of being lost."
            >
              <Placements placements={placements} prizes={derivation.place_cents} shares={rule.place_shares_bp} lines={lines} claimDays={rule.claim_window_days} />
            </LedgerSection>
          )}

          <LedgerSection
            id="ledger"
            title="The ledger"
            lede={`${lines.length} ${lines.length === 1 ? "line" : "lines"}${problems ? `, including ${problems} failures and refusals, recorded next to the payouts` : ""}. Nothing is edited or removed: a correction is a new line.`}
          >
            <LedgerViews lines={lines} partyNames={partyNames} />
          </LedgerSection>

          <LedgerSection id="export" title="Export" lede="The same lines as the table, for a spreadsheet or a script. No account or key needed.">
            <div className="mt-8 grid gap-6 xl:grid-cols-2">
              <ExportCard
                href={`/api/funds/${event.event_id}/ledger.csv`}
                label="CSV"
                what="One row per line: sequence, time, kind, party, wallet, amount, detail, transaction hash and receipt link."
                code={`curl -s ${SITE}/api/funds/${event.event_id}/ledger.csv`}
              />
              <ExportCard
                href={`/api/funds/${event.event_id}/ledger.json`}
                label="JSON"
                what="The full lines with their detail objects, as the API serves them. Each has receipt_url and horizon_url."
                code={`curl -s ${SITE}/api/funds/${event.event_id}/ledger.json | jq '.lines[] | {seq, kind, amount_cents, tx_hash}'`}
              />
            </div>
          </LedgerSection>
        </div>
      </div>
    </>
  )
}

function ExportCard({ href, label, what, code }: { href: string; label: string; what: string; code: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-4 rounded-2xl border bg-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-sans text-lg font-semibold tracking-normal">{label}</h3>
          <p className="mt-1 text-sm text-ink-2">{what}</p>
        </div>
        <a href={href} download className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-note px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-note-ink">
          <Download className="size-4" aria-hidden />
          Download<span className="sr-only"> the {label} export</span>
        </a>
      </div>
      <CodeBlock code={code} lang="bash" wrap />
    </div>
  )
}
