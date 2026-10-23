import { Check, Clock3, ExternalLink } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

import { Balanced } from "@/components/ahadi/fund-equation"
import { Hash } from "@/components/ahadi/hash"
import type { Fingerprint } from "@/lib/docs-live"
import { EXPLORER_TX, short, usd } from "@/lib/format"
import type { HomeData } from "@/lib/home-data"
import { cn } from "@/lib/utils"

const pct = (bp: number) => `${(bp / 100).toFixed(bp % 100 === 0 ? 0 : 2)}%`

/**
 * One payout followed end to end with the live ledger's own values: the rule on record, the
 * MeTTa derivation, the two signatures, and the receipt on Stellar testnet.
 */
export function PayoutFlow({
  data,
  fp,
}: {
  data: HomeData
  fp: Fingerprint | null
}) {
  const { fund, payout, place, placeCents, shareBp } = data
  if (!fund) return <OfflineFlow />
  const rule = fund.rule
  const der = fund.derivation
  const team =
    payout?.party ??
    fund.placements?.find((p) => p.place === place)?.team ??
    null
  const settled = Boolean(payout?.tx_hash)

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b px-5 py-4 sm:px-6">
        <div>
          <div className="text-sm text-muted-foreground">
            One payout, followed end to end. Live from Stellar testnet.
          </div>
          <div className="font-display text-lg font-semibold">
            {fund.event.name}
            <span className="font-sans text-base font-normal text-ink-2">
              , place {place}
              {team ? `, ${team}` : ""}
            </span>
          </div>
        </div>
        <Balanced totals={fund.totals} />
      </div>

      <ol className="grid lg:grid-cols-4">
        <Stage i={0} n="Rule on record" tone="ink" last={false}>
          <Big>{usd(rule.pool_cents)}</Big>
          <Rows
            rows={[
              ["Target", `${rule.target_teams} teams`],
              [
                "Places",
                rule.place_shares_bp
                  .map((b) => (b / 100).toFixed(0))
                  .join(", ") + "%",
              ],
            ]}
          />
          <Mono>
            <span className="text-muted-foreground">rule hash </span>
            {fund.event.rule_hash
              ? short(fund.event.rule_hash, 8, 6)
              : "not recorded yet"}
          </Mono>
          {fund.event.rule_published_tx && (
            <ChainLink href={EXPLORER_TX + fund.event.rule_published_tx}>
              Recorded on chain before registration
            </ChainLink>
          )}
        </Stage>

        <Stage i={1} n="Derived in MeTTa" tone="note" last={false}>
          {der && placeCents !== null && shareBp !== null ? (
            <>
              <Big>{usd(placeCents)}</Big>
              <Rows
                rows={[
                  [
                    "Release",
                    `${der.eligible} of ${rule.target_teams} qualified = ${pct(der.release_bp)}`,
                  ],
                  ["Award pool", usd(der.award_cents)],
                  [`Place ${place}`, `${pct(shareBp)} of the pool`],
                ]}
              />
              <Mono>
                <span className="text-note">(ahadi-place-cents</span>{" "}
                {der.award_cents} {shareBp}
                <span className="text-note">)</span>{" "}
                <span className="text-muted-foreground">=</span> {placeCents}
              </Mono>
            </>
          ) : (
            <>
              <Big muted>Not yet</Big>
              <p className="text-sm leading-relaxed text-ink-2">
                Amounts are derived when the organiser attests how many teams
                qualified: release = min(100%, eligible / {rule.target_teams}),
                then each place&apos;s share.
              </p>
            </>
          )}
        </Stage>

        <Stage i={2} n="Two keys sign" tone="agent" last={false}>
          <ul className="space-y-2">
            <KeyRow label="Ahadi's key" color="var(--agent)" done={settled} />
            <KeyRow
              label="Organiser's key"
              color="var(--organiser)"
              done={settled}
            />
          </ul>
          <Rows
            rows={[
              [
                "Weights",
                settled
                  ? "1 + 1 = 2, threshold met"
                  : "1 + 1 needed, threshold 2",
              ],
            ]}
          />
          <p className="text-sm leading-relaxed text-ink-2">
            Ahadi signs only what the rule allows. The organiser signs in their
            own browser.
          </p>
        </Stage>

        <Stage i={3} n="Receipt on Stellar" tone="note" last>
          {settled && payout ? (
            <>
              <Big>
                {payout.kind === "held" ? "Held" : "Paid"}{" "}
                {usd(payout.amount_cents)}
              </Big>
              <Rows
                rows={[
                  ["To", payout.party ?? "winner"],
                  ["Ledger line", String(payout.seq)],
                ]}
              />
              <div className="flex items-center gap-2 text-[0.8125rem]">
                <span className="text-muted-foreground">tx</span>
                <Hash
                  value={payout.tx_hash!}
                  href={EXPLORER_TX + payout.tx_hash}
                  head={8}
                  tail={6}
                  label="Open the transaction on stellar.expert"
                />
              </div>
              {fp && fp.line.id === payout.id && (
                <div
                  className={cn(
                    "flex items-start gap-2 rounded-lg px-3 py-2 text-[0.8125rem]",
                    fp.matches
                      ? "bg-note-soft text-note-ink"
                      : "bg-failed-soft text-failed"
                  )}
                >
                  <Check className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  <span>
                    Memo{" "}
                    <span className="hash">
                      {short(payout.request_id, 6, 4)}
                    </span>{" "}
                    {fp.matches ? "equals" : "differs from"} the SHA-256 of the
                    request, recomputed on this page.
                  </span>
                </div>
              )}
            </>
          ) : (
            <>
              <Big muted>Waiting</Big>
              <p className="text-sm leading-relaxed text-ink-2">
                No payout has settled yet. When it does, its transaction hash
                and memo appear here, and anyone can check them on an explorer.
              </p>
            </>
          )}
        </Stage>
      </ol>
    </div>
  )
}

const TONE = {
  ink: "bg-ink text-paper",
  note: "bg-note text-white",
  agent: "bg-agent text-white",
} as const

function Stage({
  i,
  n,
  tone,
  last,
  children,
}: {
  i: number
  n: string
  tone: keyof typeof TONE
  last: boolean
  children: ReactNode
}) {
  return (
    <li
      className={cn(
        "relative flex flex-col gap-3 border-t px-5 py-5 first:border-t-0 sm:px-6 lg:border-t-0 lg:border-l lg:first:border-l-0",
        "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:fill-mode-both motion-safe:slide-in-from-bottom-2"
      )}
      style={{
        animationDelay: `${150 + i * 260}ms`,
        animationDuration: "700ms",
      }}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "tnum flex size-6 items-center justify-center rounded-full text-xs font-semibold",
            TONE[tone]
          )}
        >
          {i + 1}
        </span>
        <span className="text-sm font-semibold">{n}</span>
      </div>
      {children}
      {!last && (
        <span
          className="absolute top-[1.55rem] -right-[0.6rem] z-10 hidden size-5 items-center justify-center rounded-full border bg-card text-ink-2 lg:flex"
          aria-hidden
        >
          <svg viewBox="0 0 12 12" className="size-3">
            <path
              d="M3 6h6M6.5 3.5 9 6 6.5 8.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      )}
    </li>
  )
}

function Big({
  children,
  muted = false,
}: {
  children: ReactNode
  muted?: boolean
}) {
  return (
    <div
      className={cn(
        "tnum font-display text-[1.75rem] leading-none font-semibold tracking-tight",
        muted && "text-muted-foreground"
      )}
    >
      {children}
    </div>
  )
}

function Rows({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="space-y-1 text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-3">
          <dt className="text-muted-foreground">{k}</dt>
          <dd className="tnum text-right">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

function Mono({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg bg-paper-2 px-3 py-2 font-mono text-[0.75rem] break-words text-ink">
      {children}
    </div>
  )
}

function ChainLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 text-[0.8125rem] font-medium text-note underline-offset-4 hover:underline"
    >
      {children}
      <ExternalLink className="size-3" aria-hidden />
    </a>
  )
}

function KeyRow({
  label,
  color,
  done,
}: {
  label: string
  color: string
  done: boolean
}) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2">
      <span className="flex items-center gap-2 text-sm font-medium">
        <span
          className="size-2.5 rounded-full"
          style={{ background: color }}
          aria-hidden
        />
        {label}
      </span>
      {done ? (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-note-ink">
          <Check className="size-3.5" aria-hidden /> Signed
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Clock3 className="size-3.5" aria-hidden /> Waiting
        </span>
      )}
    </li>
  )
}

function OfflineFlow() {
  const steps = [
    [
      "Rule on record",
      "The rule's SHA-256 is written to the fund before registration.",
    ],
    [
      "Derived in MeTTa",
      "20 of 50 teams qualify: 40% of USD 1,700.00 is released, USD 680.00. First place gets 25%: USD 170.00.",
    ],
    [
      "Two keys sign",
      "Ahadi's key and the organiser's key, weight 1 each, threshold 2.",
    ],
    [
      "Receipt on Stellar",
      "The memo is the request's fingerprint, so anyone can match chain to ledger.",
    ],
  ]
  return (
    <div className="rounded-2xl border bg-card p-6">
      <p className="text-sm text-muted-foreground">
        The live ledger is offline right now. This is how the October payout to
        first place works.
      </p>
      <ol className="mt-5 grid gap-5 lg:grid-cols-4">
        {steps.map(([t, d], i) => (
          <li key={t}>
            <div className="text-sm font-semibold">
              {i + 1}. {t}
            </div>
            <p className="mt-1 text-sm leading-relaxed text-ink-2">{d}</p>
          </li>
        ))}
      </ol>
      <Link
        href="/how-it-works"
        className="mt-5 inline-block text-sm font-medium text-note underline-offset-4 hover:underline"
      >
        How it works
      </Link>
    </div>
  )
}
