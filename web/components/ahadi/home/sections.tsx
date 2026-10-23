import {
  ArrowRight,
  Check,
  Code2,
  KeyRound,
  ReceiptText,
  Users,
  X,
} from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

import { FundEquation } from "@/components/ahadi/fund-equation"
import { KIND, KindChip } from "@/components/ahadi/status"
import { EXPLORER_TX, short, usd } from "@/lib/format"
import { CAPTURED_REFUSAL, type HomeData } from "@/lib/home-data"
import type { Check as RuleCheck, Line } from "@/lib/types"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ shared */

export function SectionHead({
  title,
  children,
  dark = false,
  className,
}: {
  title: string
  children?: ReactNode
  dark?: boolean
  className?: string
}) {
  return (
    <div className={cn("mx-auto max-w-3xl text-center", className)}>
      <h2
        className={cn(
          "text-3xl font-semibold sm:text-4xl",
          dark && "text-white"
        )}
      >
        {title}
      </h2>
      {children && (
        <p
          className={cn(
            "mx-auto mt-4 max-w-2xl text-lg leading-relaxed",
            dark ? "text-white/70" : "text-ink-2"
          )}
        >
          {children}
        </p>
      )}
    </div>
  )
}

function TextLink({
  href,
  children,
  className,
}: {
  href: string
  children: ReactNode
  className?: string
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1.5 font-medium text-note underline-offset-4 hover:underline",
        className
      )}
    >
      {children}
      <ArrowRight className="size-4" aria-hidden />
    </Link>
  )
}

/* ------------------------------------------------------------------ the problem */

export function ProblemSection() {
  return (
    <section className="border-y bg-card">
      <div className="ahadi-page py-20 lg:py-24">
        <SectionHead title="Today a prize fund is a spreadsheet and a promise.">
          Participants see a headline number. They cannot see the rule behind
          it, each payout, what it cost, or where the rest went. And the money
          itself travels slowly and expensively.
        </SectionHead>
        <div className="mx-auto mt-14 grid max-w-6xl divide-y md:grid-cols-3 md:divide-x md:divide-y-0">
          <Evidence
            figure="8.46%"
            title="to send USD 200 to Sub-Saharan Africa"
            source="World Bank, Remittance Prices Worldwide, Q3 2025"
            chart={
              <Bars
                rows={[
                  {
                    label: "Sub-Saharan Africa",
                    value: 8.46,
                    text: "8.46%, USD 16.92",
                    strong: true,
                  },
                  {
                    label: "World average",
                    value: 6.36,
                    text: "6.36%, USD 12.72",
                  },
                ]}
                max={10}
              />
            }
          />
          <Evidence
            figure="USD 35 to 45"
            title="a typical flat bank wire fee"
            source="Citibank and Bank of America fee schedules"
            chart={<WireBar />}
          />
          <Evidence
            figure="60 days"
            title="for some hackathon prizes to arrive after the paperwork"
            source="Devpost help centre"
            chart={<TimeBars />}
          />
        </div>
      </div>
    </section>
  )
}

function Evidence({
  figure,
  title,
  source,
  chart,
}: {
  figure: string
  title: string
  source: string
  chart: ReactNode
}) {
  return (
    <div className="flex flex-col px-0 py-8 md:px-8 md:py-0 md:first:pl-0 md:last:pr-0">
      <div className="tnum font-display text-4xl font-semibold text-note">
        {figure}
      </div>
      <p className="mt-1 text-ink-2">{title}</p>
      <div className="mt-6 flex-1">{chart}</div>
      <p className="mt-5 text-xs text-muted-foreground">{source}</p>
    </div>
  )
}

function Bars({
  rows,
  max,
}: {
  rows: { label: string; value: number; text: string; strong?: boolean }[]
  max: number
}) {
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="flex justify-between text-sm">
            <span className={r.strong ? "font-medium" : "text-ink-2"}>
              {r.label}
            </span>
            <span className="tnum text-ink-2">{r.text}</span>
          </div>
          <div className="mt-1.5 h-2.5 rounded-full bg-paper-2">
            <div
              className={cn(
                "h-full rounded-full",
                r.strong ? "bg-failed" : "bg-quiet/60"
              )}
              style={{ width: `${(r.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function WireBar() {
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="font-medium">A USD 70 prize</span>
        <span className="tnum text-ink-2">fee 50% to 64%</span>
      </div>
      <div
        className="mt-1.5 flex h-2.5 overflow-hidden rounded-full bg-note/80"
        role="img"
        aria-label="A USD 35 to 45 wire fee takes 50 to 64 percent of a USD 70 prize"
      >
        <div className="h-full bg-failed" style={{ width: "50%" }} />
        <div
          className="h-full"
          style={{
            width: "14.3%",
            background:
              "repeating-linear-gradient(135deg, var(--failed) 0 3px, var(--failed-soft) 3px 6px)",
          }}
        />
      </div>
      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
        <span>Fee USD 35 to 45</span>
        <span>Winner keeps USD 25 to 35</span>
      </div>
    </div>
  )
}

function TimeBars() {
  return (
    <div className="space-y-3">
      <div>
        <div className="flex justify-between text-sm">
          <span className="font-medium">Prize payout</span>
          <span className="tnum text-ink-2">up to 60 days</span>
        </div>
        <div className="mt-1.5 h-2.5 rounded-full bg-failed" />
      </div>
      <div>
        <div className="flex justify-between text-sm">
          <span className="text-ink-2">Stellar settlement</span>
          <span className="tnum text-ink-2">about 5 seconds</span>
        </div>
        <div className="mt-1.5 h-2.5 rounded-full bg-paper-2">
          <div className="h-full w-1 rounded-full bg-note" />
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ the money gate */

export function MoneyGateSection({ data }: { data: HomeData }) {
  const live = data.rejected
  const checks: RuleCheck[] = live?.checks ?? CAPTURED_REFUSAL.checks
  const message =
    (live?.detail?.message as string | undefined) ?? CAPTURED_REFUSAL.message
  const requested =
    (live?.detail?.requested_cents as number | undefined) ??
    CAPTURED_REFUSAL.requestedCents
  const team = live?.party ?? CAPTURED_REFUSAL.team
  const failed = checks.filter((c) => !c.passed).length

  return (
    <section className="ahadi-page py-20 lg:py-24">
      <SectionHead title="The rule decides. The language model never does.">
        Every payout request becomes facts, and nine checks in MeTTa must all
        pass. The bridge re-runs the same rule in Python and signs nothing
        unless both agree.
      </SectionHead>

      <div className="mx-auto mt-14 grid max-w-6xl items-start gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-14">
        <figure className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <figcaption className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3.5">
            <span className="text-sm font-semibold">
              {live
                ? `A real request, line ${live.seq} of the October ledger`
                : "A real request from the October run"}
            </span>
            <KindChip kind="rejected" />
          </figcaption>
          <div className="border-b bg-paper/60 px-5 py-4">
            <div className="text-xs text-muted-foreground">
              Arrived over Telegram, for {team}, asking for {usd(requested)}
            </div>
            <blockquote className="mt-1.5 font-mono text-[0.8125rem] leading-relaxed text-ink">
              &ldquo;{message}&rdquo;
            </blockquote>
          </div>
          <ol className="divide-y" aria-label="The nine checks">
            {checks.map((c) => (
              <li
                key={c.name}
                className={cn(
                  "grid grid-cols-[1.25rem_minmax(0,1fr)] gap-x-3 px-5 py-2.5",
                  !c.passed && "bg-rejected-soft/50"
                )}
              >
                {c.passed ? (
                  <Check
                    className="mt-0.5 size-4 text-note"
                    aria-label="passed"
                  />
                ) : (
                  <X
                    className="mt-0.5 size-4 text-rejected"
                    aria-label="failed"
                  />
                )}
                <div className="min-w-0 sm:flex sm:items-baseline sm:justify-between sm:gap-4">
                  <code
                    className={cn(
                      "font-mono text-[0.8125rem]",
                      c.passed ? "text-ink-2" : "font-semibold text-rejected"
                    )}
                  >
                    {c.name}
                  </code>
                  <span
                    className={cn(
                      "block text-[0.8125rem] sm:text-right",
                      c.passed ? "text-muted-foreground" : "text-ink"
                    )}
                  >
                    {c.reason}
                  </span>
                </div>
              </li>
            ))}
          </ol>
          <div className="border-t px-5 py-3 text-sm text-ink-2">
            {failed} of {checks.length} checks failed. Recorded as a refusal on
            the public ledger. No proposal, no signature.
          </div>
        </figure>

        <div className="space-y-8">
          <Split
            who="The language model"
            tone="text-ink-2"
            does="Reads the message, picks the ahadi-request skill, and explains the outcome in plain words."
          />
          <Split
            who="MeTTa, inside Omega"
            tone="text-note"
            does="Turns the request into facts and runs ahadi-decide: rule on chain, right version, eligibility, place, exact amount, asset, budget, not a duplicate, place unpaid."
          />
          <Split
            who="The bridge"
            tone="text-agent"
            does="Runs the Python mirror on the same facts. A proposal exists only if both allow it with the same route, and it is checked again before Ahadi signs."
          />
          <Split
            who="The organiser"
            tone="text-organiser"
            does="Signs in their own browser, or rejects. Without that second key nothing moves."
          />
          <TextLink href="/how-it-works#money-gate">
            Read the MeTTa rule and the agreement check
          </TextLink>
        </div>
      </div>
    </section>
  )
}

function Split({
  who,
  does,
  tone,
}: {
  who: string
  does: string
  tone: string
}) {
  return (
    <div className="grid gap-1 border-l-2 border-hair pl-5 sm:grid-cols-[9.5rem_1fr] sm:gap-5">
      <div className={cn("font-semibold", tone)}>{who}</div>
      <p className="leading-relaxed text-ink-2">{does}</p>
    </div>
  )
}

/* ------------------------------------------------------------------ the vault */

const TESTS: [string, string][] = [
  ["Vault reads back as 2 of 2", "configured"],
  ["Ahadi's key alone", "tx_bad_auth"],
  ["Organiser's key alone", "tx_bad_auth"],
  ["The fund's own key", "tx_bad_auth"],
  ["Both keys together", "settles"],
  ["Same envelope sent twice", "paid once"],
  ["Wallet never activated", "held instead"],
]

export function VaultSection({ data }: { data: HomeData }) {
  const c = data.control
  return (
    <section className="bg-ink text-paper">
      <div className="ahadi-page py-20 lg:py-24">
        <SectionHead
          title="The agent can't pay alone. Neither can the organiser."
          dark
        >
          Each fund is a Stellar account whose own key is switched off. Two
          signers, weight 1 each, and every threshold at 2.
        </SectionHead>
        <div className="mx-auto mt-14 grid max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <VaultDiagram />
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-sans text-lg font-semibold tracking-normal text-white">
                Proven on the live testnet
              </h3>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#4cc38a]/15 px-3 py-1 text-sm font-medium text-[#7fe0b0]">
                <Check className="size-4" aria-hidden /> 7 of 7 passed
              </span>
            </div>
            <ol className="mt-4 divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/[0.03]">
              {TESTS.map(([t, r]) => (
                <li
                  key={t}
                  className="flex items-center justify-between gap-4 px-4 py-2.5"
                >
                  <span className="text-[0.9375rem] text-white/85">{t}</span>
                  <code
                    className={cn(
                      "rounded-md px-2 py-0.5 font-mono text-[0.75rem]",
                      r === "tx_bad_auth"
                        ? "bg-[#f4a582]/10 text-[#f4a582]"
                        : "bg-[#4cc38a]/12 text-[#7fe0b0]"
                    )}
                  >
                    {r}
                  </code>
                </li>
              ))}
            </ol>
            {c && (
              <p className="mt-4 text-sm leading-relaxed text-white/65">
                And on the October ledger, line {c.seq}: Ahadi submitted a
                payout with its key alone. Stellar answered{" "}
                <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[0.8125em] text-white/90">
                  {String(c.detail?.code ?? "tx_bad_auth")}
                </code>
                , nothing moved, no fee was charged.
              </p>
            )}
            <Link
              href="/how-it-works#two-keys"
              className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-white px-5 py-3 font-medium text-ink hover:bg-paper"
            >
              See the vault and the tests{" "}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

function VaultDiagram() {
  return (
    <svg
      viewBox="0 0 560 330"
      className="h-auto w-full font-sans"
      role="img"
      aria-labelledby="vault-t vault-d"
    >
      <title id="vault-t">The two key vault</title>
      <desc id="vault-d">
        Ahadi&apos;s key and the organiser&apos;s key each carry weight 1.
        Together they reach the threshold of 2 and the payment settles. The
        fund&apos;s own key has weight 0.
      </desc>
      <defs>
        <marker
          id="v-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto"
        >
          <path d="M0 1 L9 5 L0 9 z" fill="rgb(255 255 255 / 0.55)" />
        </marker>
      </defs>
      {/* keys */}
      <KeyNode
        x={10}
        y={40}
        title="Ahadi's key"
        sub="in the bridge"
        color="#8f8af0"
      />
      <KeyNode
        x={10}
        y={150}
        title="Organiser's key"
        sub="in their browser"
        color="#e0a35c"
      />
      <g opacity={0.55}>
        <rect
          x={10}
          y={260}
          width={190}
          height={56}
          rx={12}
          fill="rgb(255 255 255 / 0.03)"
          stroke="rgb(255 255 255 / 0.2)"
          strokeDasharray="5 4"
        />
        <text x={30} y={284} fontSize={14} fontWeight={600} fill="#fff">
          The fund&apos;s own key
        </text>
        <text x={30} y={303} fontSize={12} fill="rgb(255 255 255 / 0.7)">
          switched off, weight 0
        </text>
      </g>
      {/* paths */}
      <path
        d="M200 68 C 250 68, 250 150, 288 150"
        fill="none"
        stroke="#8f8af0"
        strokeWidth={1.8}
        markerEnd="url(#v-arrow)"
      />
      <path
        d="M200 178 C 250 178, 250 170, 288 170"
        fill="none"
        stroke="#e0a35c"
        strokeWidth={1.8}
        markerEnd="url(#v-arrow)"
      />
      <path
        d="M200 288 C 245 288, 270 230, 300 196"
        fill="none"
        stroke="rgb(255 255 255 / 0.25)"
        strokeWidth={1.4}
        strokeDasharray="4 4"
      />
      <text x={226} y={60} fontSize={12} fill="rgb(255 255 255 / 0.75)">
        +1
      </text>
      <text x={226} y={198} fontSize={12} fill="rgb(255 255 255 / 0.75)">
        +1
      </text>
      <text x={252} y={262} fontSize={12} fill="rgb(255 255 255 / 0.5)">
        +0
      </text>
      {/* gate */}
      <rect
        x={292}
        y={118}
        width={120}
        height={92}
        rx={14}
        fill="rgb(255 255 255 / 0.06)"
        stroke="rgb(255 255 255 / 0.3)"
      />
      <text
        x={352}
        y={146}
        fontSize={12}
        textAnchor="middle"
        fill="rgb(255 255 255 / 0.7)"
      >
        weight needed
      </text>
      <text
        x={352}
        y={182}
        fontSize={34}
        fontWeight={600}
        textAnchor="middle"
        fill="#fff"
        className="tnum"
      >
        2
      </text>
      <text
        x={352}
        y={200}
        fontSize={11}
        textAnchor="middle"
        fill="rgb(255 255 255 / 0.55)"
      >
        low, medium, high
      </text>
      <path
        d="M412 164 H 446"
        fill="none"
        stroke="rgb(255 255 255 / 0.55)"
        strokeWidth={1.6}
        markerEnd="url(#v-arrow)"
      />
      {/* result */}
      <rect
        x={450}
        y={126}
        width={100}
        height={76}
        rx={12}
        fill="rgb(76 195 138 / 0.15)"
        stroke="rgb(127 224 176 / 0.6)"
      />
      <text
        x={500}
        y={159}
        fontSize={14}
        fontWeight={600}
        textAnchor="middle"
        fill="#7fe0b0"
      >
        Settles
      </text>
      <text
        x={500}
        y={178}
        fontSize={11.5}
        textAnchor="middle"
        fill="rgb(255 255 255 / 0.7)"
      >
        1 + 1 = 2
      </text>
    </svg>
  )
}

function KeyNode({
  x,
  y,
  title,
  sub,
  color,
}: {
  x: number
  y: number
  title: string
  sub: string
  color: string
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={190}
        height={56}
        rx={12}
        fill="rgb(255 255 255 / 0.05)"
        stroke={color}
        strokeOpacity={0.7}
      />
      <circle cx={x + 22} cy={y + 28} r={6} fill={color} />
      <text x={x + 38} y={y + 24} fontSize={14} fontWeight={600} fill="#fff">
        {title}
      </text>
      <text x={x + 38} y={y + 43} fontSize={12} fill="rgb(255 255 255 / 0.65)">
        {sub}, weight 1
      </text>
    </g>
  )
}

/* ------------------------------------------------------------------ the ledger, live */

export function LedgerSection({ data }: { data: HomeData }) {
  const fund = data.fund
  return (
    <section className="ahadi-page py-20 lg:py-24">
      <SectionHead title="The ledger, live">
        {fund
          ? `The latest lines of the ${fund.event.name} fund, read from the bridge as this page loaded.`
          : "The latest lines of the October fund, read from the bridge."}
      </SectionHead>
      {fund ? (
        <div className="mx-auto mt-14 grid max-w-6xl items-start gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-10">
          <div className="rounded-2xl border bg-card p-6">
            <FundEquation totals={fund.totals} compact />
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t pt-5 text-sm">
              <TextLink href={`/funds/${fund.event.event_id}`}>
                Open the full ledger
              </TextLink>
              <a
                href={`/api/funds/${fund.event.event_id}/ledger.csv`}
                className="font-medium text-ink-2 underline-offset-4 hover:text-ink hover:underline"
              >
                Download CSV
              </a>
            </div>
          </div>
          <ol
            className="divide-y overflow-hidden rounded-2xl border bg-card"
            aria-label="Latest ledger lines, newest first"
          >
            {data.latest.length === 0 && (
              <li className="px-5 py-10 text-center text-muted-foreground">
                Nothing on the ledger yet.
              </li>
            )}
            {data.latest.map((l) => (
              <LineRow key={l.id} l={l} />
            ))}
          </ol>
        </div>
      ) : (
        <p className="mx-auto mt-10 max-w-xl rounded-xl bg-paper-2 p-5 text-center text-ink-2">
          The live ledger is offline right now. Every receipt stays on Stellar
          testnet and can be checked on any explorer.
        </p>
      )}
    </section>
  )
}

function LineRow({ l }: { l: Line }) {
  const sign = KIND[l.kind]?.sign ?? 0
  return (
    <li className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-5 py-3 sm:grid-cols-[2rem_11rem_minmax(0,1fr)_auto]">
      <Link
        href={`/receipt/${l.id}`}
        className="tnum text-sm text-muted-foreground hover:text-ink"
        aria-label={`Open line ${l.seq}`}
      >
        {l.seq}
      </Link>
      <span className="col-start-2 sm:col-start-auto">
        <KindChip kind={l.kind} />
      </span>
      <span className="col-start-2 row-start-2 min-w-0 truncate text-sm sm:col-start-auto sm:row-start-auto">
        {l.party ?? ""}
        {l.tx_hash && (
          <a
            href={EXPLORER_TX + l.tx_hash}
            target="_blank"
            rel="noreferrer"
            className="hash ml-2 text-muted-foreground hover:text-note"
          >
            {short(l.tx_hash, 5, 4)}
          </a>
        )}
      </span>
      <span
        className={cn(
          "tnum col-start-3 row-span-2 row-start-1 text-right text-sm font-semibold sm:col-start-auto sm:row-span-1",
          sign > 0 && "text-note-ink",
          l.amount_cents === 0 && "font-normal text-muted-foreground"
        )}
      >
        {l.amount_cents === 0 || sign === 0
          ? l.amount_cents
            ? usd(l.amount_cents)
            : "no money"
          : usd(sign * l.amount_cents, { sign: true })}
      </span>
    </li>
  )
}

/* ------------------------------------------------------------------ when things go wrong */

export function CasesSection({ data }: { data: HomeData }) {
  const held = data.held
  const dup = data.duplicate
  const rej = data.rejected
  const expiry = held?.detail?.claim_expiry
    ? new Date(held.detail.claim_expiry * 1000).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null

  return (
    <section className="border-y bg-card">
      <div className="ahadi-page py-20 lg:py-24">
        <SectionHead title="When something goes wrong, it shows.">
          Failures are part of the record, explained in plain words and handled,
          not buried in someone&apos;s inbox.
        </SectionHead>
        <div className="mx-auto mt-14 grid max-w-6xl gap-6 lg:grid-cols-3">
          <CaseFile
            kind="held"
            title="A wallet that cannot receive yet"
            trigger={
              <>
                Arjun&apos;s wallet in Chennai was never activated on the
                network.
              </>
            }
            did="MeTTa routes the prize to a claimable balance instead of a payment that would fail."
            outcome={
              held
                ? `${usd(held.amount_cents)} held for ${held.party}${expiry ? ` until ${expiry}` : ""}. Unclaimed, it returns to the fund.`
                : "Held for 30 days. Unclaimed, it returns to the fund."
            }
            href={held ? `/receipt/${held.id}` : undefined}
          />
          <CaseFile
            kind="duplicate"
            title="The same request twice"
            trigger={
              <span className="font-mono text-[0.8125rem]">
                &ldquo;
                {(dup?.detail?.message as string) ??
                  "Can you please send the 136.00 again?"}
                &rdquo;
              </span>
            }
            did="The request's fingerprint already has a ledger line, so not-duplicate fails and the original receipt is returned."
            outcome={
              dup?.detail?.original_tx
                ? `Original receipt ${short(dup.detail.original_tx, 6, 4)}. Nobody is paid twice.`
                : "The original receipt is returned. Nobody is paid twice."
            }
            href={dup ? `/receipt/${dup.id}` : undefined}
          />
          <CaseFile
            kind="rejected"
            title="A request that breaks the rule"
            trigger={
              <span className="font-mono text-[0.8125rem]">
                &ldquo;
                {(rej?.detail?.message as string) ?? CAPTURED_REFUSAL.message}
                &rdquo;
              </span>
            }
            did={`Treated as data. ${(rej?.checks ?? CAPTURED_REFUSAL.checks)
              .filter((c) => !c.passed)
              .map((c) => c.name)
              .join(", ")} fail.`}
            outcome="A refusal with its reasons on the ledger. Nothing was proposed or signed."
            href={rej ? `/receipt/${rej.id}` : undefined}
          />
        </div>
      </div>
    </section>
  )
}

function CaseFile({
  kind,
  title,
  trigger,
  did,
  outcome,
  href,
}: {
  kind: "held" | "duplicate" | "rejected"
  title: string
  trigger: ReactNode
  did: string
  outcome: string
  href?: string
}) {
  const steps: [string, ReactNode][] = [
    ["What happened", trigger],
    ["What Ahadi did", did],
    ["On the ledger", outcome],
  ]
  return (
    <article className="flex flex-col rounded-2xl border bg-paper/50 p-6">
      <KindChip kind={kind} className="self-start" />
      <h3 className="mt-4 font-sans text-lg font-semibold tracking-normal">
        {title}
      </h3>
      <ol className="mt-5 flex-1 space-y-0">
        {steps.map(([label, body], i) => (
          <li key={label} className="relative pb-5 pl-6 last:pb-0">
            {i < steps.length - 1 && (
              <span
                className="absolute top-2 bottom-0 left-[0.3125rem] w-px bg-hair"
                aria-hidden
              />
            )}
            <span
              className={cn(
                "absolute top-1.5 left-0 size-[0.6875rem] rounded-full border-2 bg-card",
                i === steps.length - 1 ? "border-note" : "border-ink/30"
              )}
              aria-hidden
            />
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="mt-0.5 text-[0.9375rem] leading-relaxed text-ink-2">
              {body}
            </div>
          </li>
        ))}
      </ol>
      {href ? (
        <Link
          href={href}
          className="mt-5 text-sm font-medium text-note underline-offset-4 hover:underline"
        >
          Open this ledger line
        </Link>
      ) : (
        <p className="mt-5 text-xs text-muted-foreground">
          Not on the live ledger right now. Described from the October run on 23
          October.
        </p>
      )}
    </article>
  )
}

/* ------------------------------------------------------------------ architecture strip */

export function ArchitectureStrip() {
  const nodes = [
    {
      name: "Web app",
      line: "Ledger, receipts, console",
      tag: "Next.js",
      accent: "border-hair",
    },
    {
      name: "Bridge",
      line: "API, ledger, agent's key, rule mirror",
      tag: "FastAPI",
      accent: "border-note/50",
    },
    {
      name: "Omega agent",
      line: "LLM, MeTTa rules, memory, 10 skills",
      tag: "Docker",
      accent: "border-agent/50",
    },
    {
      name: "Stellar testnet",
      line: "2 of 2 vaults, receipts, rule hash",
      tag: "Horizon",
      accent: "border-note/50",
    },
  ]
  return (
    <section className="ahadi-page py-20 lg:py-24">
      <SectionHead title="Four parts, one job each">
        The language model talks, MeTTa decides, the bridge checks and keeps the
        books, Stellar enforces the signatures.
      </SectionHead>
      <div className="mx-auto mt-12 flex max-w-6xl flex-col items-stretch gap-3 lg:flex-row lg:items-center">
        {nodes.map((n, i) => (
          <div key={n.name} className="contents">
            <div
              className={cn(
                "flex-1 rounded-2xl border-2 bg-card px-5 py-4",
                n.accent
              )}
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-semibold">{n.name}</span>
                <code className="font-mono text-xs text-muted-foreground">
                  {n.tag}
                </code>
              </div>
              <p className="mt-1 text-sm text-ink-2">{n.line}</p>
            </div>
            {i < nodes.length - 1 && (
              <span
                className="mx-auto flex shrink-0 items-center text-ink-2 lg:mx-0"
                aria-hidden
              >
                <svg
                  viewBox="0 0 24 24"
                  className="size-5 rotate-90 lg:rotate-0"
                >
                  <path
                    d="M4 12h15M14 7l5 5-5 5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {i > 0 && (
                    <path
                      d="M9 7 4 12l5 5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                </svg>
              </span>
            )}
          </div>
        ))}
      </div>
      <p className="mx-auto mt-5 max-w-6xl text-center text-sm text-muted-foreground">
        Plus a NEAR Intents 1Click dry quote for winners who want another chain.
        Simulated: no funds move.
      </p>
      <div className="mt-6 text-center">
        <TextLink href="/how-it-works#architecture">
          See the full architecture
        </TextLink>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ evidence band */

export function ProofBand({ data }: { data: HomeData }) {
  const t = data.fund?.totals
  const stats: { figure: string; label: string; detail: string }[] = [
    {
      figure: "36",
      label: "fast tests pass",
      detail:
        "Rule validation, derivation, canonical hashing, the nine checks and failure routing.",
    },
    {
      figure: "60 + 20",
      label: "MeTTa and Python agree",
      detail:
        "Decision vectors and derivations, run on PeTTa inside the Omega image.",
    },
    {
      figure: "7 of 7",
      label: "live testnet tests",
      detail:
        "One key alone is refused; both keys settle; a resent envelope pays once.",
    },
    {
      figure: t?.balanced ? "To the cent" : t ? "Check" : "Live",
      label: "ledger matches the chain",
      detail:
        t && t.chain_balance_cents !== null
          ? t.available_cents === 0 && t.chain_balance_cents === 0 && t.received_cents > 0
            ? `${usd(t.received_cents)} in, every cent paid, held or carried forward; the fund account on chain is empty, as the ledger says.`
            : `Ledger ${usd(t.available_cents)}, chain ${usd(t.chain_balance_cents)} in the fund right now.`
          : "Compared with the fund's balance on Horizon on every read.",
    },
  ]
  return (
    <section className="bg-paper-2/60">
      <div className="ahadi-page py-20 lg:py-24">
        <SectionHead title="Evidence, not adjectives">
          Every claim on this site has a test or a receipt behind it.
        </SectionHead>
        <dl className="mx-auto mt-12 grid max-w-6xl overflow-hidden rounded-2xl border bg-card sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={cn(
                "px-6 py-7 text-center",
                i > 0 && "border-t sm:border-t-0",
                i % 2 === 1 && "sm:border-l",
                i >= 2 && "sm:border-t lg:border-t-0",
                i === 2 && "lg:border-l"
              )}
            >
              <dt className="sr-only">{s.label}</dt>
              <dd>
                <div className="tnum font-display text-4xl font-semibold text-note">
                  {s.figure}
                </div>
                <div className="mt-1 font-semibold">{s.label}</div>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">
                  {s.detail}
                </p>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ audiences */

const AUDIENCES = [
  {
    title: "Organisers",
    icon: KeyRound,
    text: "Publish the rule, attest who qualified, approve each payout with your own key, and close the event with the reserve carried forward.",
    links: [["Open the console", "/console"]],
  },
  {
    title: "Winners",
    icon: ReceiptText,
    text: "See your prize, the rule step that produced it, and the transaction on Stellar. A held prize shows how to claim it.",
    links: [["Check your receipt", "/verify"]],
  },
  {
    title: "Participants and sponsors",
    icon: Users,
    text: "Everything that came in and went out, what it cost, and what moved to the next event. Export it as CSV or JSON.",
    links: [["Read the ledger", "/funds/october-2026"]],
  },
  {
    title: "Developers",
    icon: Code2,
    text: "A public REST API, a live event stream, and the ten Omega skills behind them, with real responses and a Try it button.",
    links: [["Read the API", "/developers"]],
  },
] as const

export function AudienceSection() {
  return (
    <section className="ahadi-page py-20 lg:py-24">
      <SectionHead title="Built for everyone a prize touches" />
      <div className="mx-auto mt-12 grid max-w-6xl justify-center gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {AUDIENCES.map((a) => {
          const Icon = a.icon
          return (
            <div
              key={a.title}
              className="flex flex-col items-center rounded-2xl border bg-card px-6 py-8 text-center"
            >
              <span className="flex size-11 items-center justify-center rounded-full bg-note-soft text-note-ink">
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-4 font-sans text-lg font-semibold tracking-normal">
                {a.title}
              </h3>
              <p className="mt-2 flex-1 text-[0.9375rem] leading-relaxed text-ink-2">
                {a.text}
              </p>
              {a.links.map(([label, href]) => (
                <TextLink key={href} href={href} className="mt-5 text-sm">
                  {label}
                </TextLink>
              ))}
            </div>
          )
        })}
      </div>
      <p className="mt-10 text-center text-sm text-muted-foreground">
        Judging Ahadi? Start with{" "}
        <Link
          href="/how-it-works"
          className="font-medium text-note underline-offset-4 hover:underline"
        >
          How it works
        </Link>{" "}
        and{" "}
        <Link
          href="/trust"
          className="font-medium text-note underline-offset-4 hover:underline"
        >
          Trust and safety
        </Link>
        .
      </p>
    </section>
  )
}
