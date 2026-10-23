"use client"

import { CircleAlert, CircleCheck, ExternalLink, LoaderCircle, ShieldCheck } from "lucide-react"
import { useState } from "react"

import { GuillocheBand } from "@/components/ahadi/guilloche"
import { CodeBlock } from "@/components/ahadi/docs/code-block"
import { Hash } from "@/components/ahadi/hash"
import { EXPLORER_TX, pct, short, usd } from "@/lib/format"
import { canonicalRule, fullTime, ordinal, sha256Hex } from "@/lib/ledger-data"
import type { FundView, Line } from "@/lib/types"
import { cn } from "@/lib/utils"

type Check = { state: "idle" } | { state: "busy" } | { state: "done"; computed: string } | { state: "error"; message: string }

const RELEASE: Record<string, (target: number) => string> = {
  eligible_over_target_capped_at_100: (t) => `The share of the pool released for prizes is the number of eligible teams divided by ${t}, capped at 100%.`,
}
const ROUNDING: Record<string, string> = {
  floor_cent_remainder_to_reserve: "Each prize is rounded down to the cent. Any remainder joins the reserve.",
}
const CARRY: Record<string, string> = {
  reserve_to_next_event: "Whatever is not awarded moves to the next event's fund when this event closes, on the record.",
}

/** The funding rule as a document, next to its on-chain record and an in-browser fingerprint check. */
export function RuleDocument({ rule, ruleLine, publishedTx }: { rule: FundView["rule"]; ruleLine: Line | null; publishedTx: string | null }) {
  const [check, setCheck] = useState<Check>({ state: "idle" })
  const canonical = canonicalRule(rule)
  const pretty = JSON.stringify(JSON.parse(canonical), null, 2)

  async function verify() {
    setCheck({ state: "busy" })
    try {
      const computed = await sha256Hex(canonical)
      await new Promise((r) => setTimeout(r, 350))
      setCheck({ state: "done", computed })
    } catch {
      setCheck({ state: "error", message: "Your browser could not compute SHA-256 here. Try a recent browser over https." })
    }
  }
  const matches = check.state === "done" && check.computed === rule.hash
  const groups = rule.hash.match(/.{1,16}/g) ?? [rule.hash]

  const clauses: { t: string; b: React.ReactNode }[] = [
    { t: "The pool", b: <>The fund holds a prize pool of <strong className="tnum">{usd(rule.pool_cents)}</strong>, paid in {rule.asset}, the testnet stand in for US dollars.</> },
    { t: "The release", b: RELEASE[rule.release]?.(rule.target_teams) ?? rule.release },
    {
      t: "The places",
      b: (
        <>
          The released pool is split between {rule.place_shares_bp.length} places:{" "}
          <span className="mt-2 flex flex-wrap gap-1.5">
            {rule.place_shares_bp.map((bp, i) => (
              <span key={i} className="tnum rounded-md border border-hair bg-paper px-2 py-0.5 text-sm text-ink">
                {ordinal(i + 1)} {pct(bp)}
              </span>
            ))}
          </span>
        </>
      ),
    },
    { t: "Undeliverable prizes", b: <>A prize that cannot be delivered is held for its winner for {rule.claim_window_days} days, then returns to the fund.</> },
    { t: "What is left", b: CARRY[rule.carry_forward] ?? rule.carry_forward },
    { t: "Rounding", b: ROUNDING[rule.rounding] ?? rule.rounding },
  ]

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] [&>*]:min-w-0">
      {/* The document */}
      <article className="relative overflow-hidden rounded-2xl border bg-card shadow-sm" aria-label="The funding rule">
        <GuillocheBand />
        <div className="px-6 pt-4 pb-6 sm:px-8">
          <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-dashed pb-4">
            <div>
              <div className="text-sm text-muted-foreground">Funding rule, version {rule.version}</div>
              <h3 className="mt-0.5 text-xl font-semibold">{rule.name}</h3>
            </div>
            <span className="hash text-muted-foreground">{rule.event_id}</span>
          </div>
          <ol className="mt-5 space-y-4">
            {clauses.map((c, i) => (
              <li key={c.t} className="grid grid-cols-[1.75rem_1fr] gap-2">
                <span className="tnum pt-0.5 font-display text-sm font-semibold text-note">{i + 1}.</span>
                <div>
                  <div className="font-medium">{c.t}</div>
                  <div className="mt-0.5 leading-relaxed text-ink-2 [&_strong]:font-semibold [&_strong]:text-ink">{c.b}</div>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-6 border-t border-dashed pt-4 text-sm text-muted-foreground">
            {ruleLine?.party ? `Published by ${ruleLine.party}, organiser, ` : "Published "}before registration opened. Ahadi applies it in MeTTa; it cannot change it.
          </p>
        </div>
      </article>

      {/* The record */}
      <div className="space-y-4">
        <div className="rounded-2xl border bg-card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-sans text-lg font-semibold tracking-normal">On record</h3>
            <ShieldCheck className="size-5 text-note" aria-hidden />
          </div>
          <div className="mt-4 rounded-xl bg-paper-2/70 p-4">
            <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
              <span>SHA-256 fingerprint</span>
              <Hash value={rule.hash} head={4} tail={4} className="text-ink-2" />
            </div>
            <div className="hash mt-1 grid grid-cols-2 gap-x-3 text-[0.8125rem] leading-6 text-ink sm:text-sm" aria-label={rule.hash}>
              {groups.map((g, i) => (
                <span key={i}>{g}</span>
              ))}
            </div>
          </div>
          <dl className="mt-4 divide-y text-sm">
            <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-2.5">
              <dt className="text-muted-foreground">Written to</dt>
              <dd className="hash">rule:{rule.event_id}</dd>
            </div>
            {ruleLine && (
              <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-2.5">
                <dt className="text-muted-foreground">Recorded</dt>
                <dd>{fullTime(ruleLine.created_at)}</dd>
              </div>
            )}
            {publishedTx && (
              <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-2.5">
                <dt className="text-muted-foreground">Transaction</dt>
                <dd>
                  <a href={EXPLORER_TX + publishedTx} target="_blank" rel="noreferrer" className="hash inline-flex items-center gap-1 rounded text-note underline-offset-4 hover:underline">
                    {short(publishedTx, 8, 6)} <ExternalLink className="size-3.5" aria-hidden />
                  </a>
                </dd>
              </div>
            )}
          </dl>

          <button
            type="button"
            onClick={verify}
            disabled={check.state === "busy"}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-note px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-note-ink disabled:opacity-70"
          >
            {check.state === "busy" && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
            {check.state === "done" ? "Verify again" : "Verify this fingerprint in your browser"}
          </button>
          <div aria-live="polite">
            {check.state === "done" && (
              <div className={cn("mt-3 flex gap-2.5 rounded-xl px-3.5 py-3 text-sm", matches ? "bg-note-soft text-note-ink" : "bg-failed-soft text-failed")}>
                {matches ? <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden /> : <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />}
                <p>
                  {matches ? (
                    <>
                      It matches. Your browser hashed the rule below and got <span className="hash">{short(check.computed, 8, 6)}</span>, the fingerprint on record.
                    </>
                  ) : (
                    <>
                      It does not match: your browser got <span className="hash">{short(check.computed, 8, 6)}</span>. The rule shown differs from the one on record.
                    </>
                  )}
                </p>
              </div>
            )}
            {check.state === "error" && <p className="mt-3 rounded-xl bg-failed-soft px-3.5 py-3 text-sm text-failed">{check.message}</p>}
          </div>
        </div>

        <CodeBlock
          code={pretty}
          lang="json"
          title="The rule as hashed: keys sorted, then minified"
          maxHeight="16rem"
          footer="SHA-256 over the minified UTF-8 form of this object, without its hash field."
        />
      </div>
    </div>
  )
}
