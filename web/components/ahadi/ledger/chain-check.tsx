"use client"

import { CircleCheck, CircleX, LoaderCircle, RefreshCw } from "lucide-react"
import { useState } from "react"

import { Hash } from "@/components/ahadi/hash"
import { ApiError } from "@/lib/api"
import { EXPLORER_ACCOUNT } from "@/lib/format"
import { fullTime, stroops, verifyTx, type VerifyCheck, type VerifyResult } from "@/lib/ledger-data"
import { cn } from "@/lib/utils"

export type KeyNames = Record<string, string>

export function CheckList({ checks, className }: { checks: VerifyCheck[]; className?: string }) {
  return (
    <ul className={cn("space-y-2", className)}>
      {checks.map((c) => (
        <li key={c.name} className={cn("flex items-start gap-2.5 rounded-xl px-3.5 py-3 text-sm", c.passed ? "bg-note-soft text-note-ink" : "bg-failed-soft text-failed")}>
          {c.passed ? <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden /> : <CircleX className="mt-0.5 size-4 shrink-0" aria-hidden />}
          <span>
            <span className="sr-only">{c.passed ? "Passed: " : "Failed: "}</span>
            {c.text}
          </span>
        </li>
      ))}
    </ul>
  )
}

export function KeyName({ value, names }: { value: string; names: KeyNames }) {
  const name = names[value]
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-0.5">
      {name && <span className="font-medium">{name}</span>}
      <Hash value={value} href={EXPLORER_ACCOUNT + value} head={5} tail={4} label={`Open account ${value} on the block explorer`} />
    </span>
  )
}

type State = { s: "idle" } | { s: "busy" } | { s: "done"; r: VerifyResult; at: Date } | { s: "error"; msg: string }

/** Re-reads the transaction from Stellar testnet through the bridge and compares it with this ledger line. */
export function ChainCheck({ tx, names }: { tx: string; names: KeyNames }) {
  const [st, setSt] = useState<State>({ s: "idle" })

  async function run() {
    setSt({ s: "busy" })
    try {
      const r = await verifyTx(tx)
      setSt({ s: "done", r, at: new Date() })
    } catch (e) {
      setSt({ s: "error", msg: e instanceof ApiError ? e.message : "Could not reach the checker. Try again in a moment." })
    }
  }

  const done = st.s === "done" ? st.r : null
  const checks = done?.checks ?? []
  const allPass = checks.length > 0 && checks.every((c) => c.passed)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={run}
          disabled={st.s === "busy"}
          className="inline-flex items-center gap-2 rounded-lg bg-note px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-note-ink disabled:opacity-70"
        >
          {st.s === "busy" ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : st.s === "done" ? <RefreshCw className="size-4" aria-hidden /> : null}
          {st.s === "done" ? "Check again" : st.s === "busy" ? "Asking Stellar testnet" : "Check it against the chain"}
        </button>
        {st.s === "done" && <span className="text-sm text-muted-foreground">Read live from Stellar testnet at {st.at.toLocaleTimeString("en-GB")}</span>}
      </div>

      <div aria-live="polite" className="space-y-4">
        {st.s === "error" && <p className="rounded-xl bg-failed-soft px-3.5 py-3 text-sm text-failed">{st.msg}</p>}
        {done && !done.found_on_chain && (
          <p className="rounded-xl bg-failed-soft px-3.5 py-3 text-sm text-failed">Stellar testnet has no transaction with this hash. The receipt does not hold up.</p>
        )}
        {done?.found_on_chain && done.tx && (
          <>
            <p className={cn("font-medium", allPass ? "text-note-ink" : "text-failed")}>
              {checks.length === 0
                ? "Found on chain."
                : allPass
                  ? `All ${checks.length} checks pass. The chain agrees with this line.`
                  : `${checks.filter((c) => !c.passed).length} of ${checks.length} checks fail.`}
            </p>
            <CheckList checks={checks} />
            <dl className="grid gap-x-6 gap-y-3 rounded-xl border bg-paper/60 p-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Ledger</dt>
                <dd className="tnum mt-0.5">{done.tx.ledger.toLocaleString("en-US")}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Closed at</dt>
                <dd className="mt-0.5">{fullTime(done.tx.created_at)}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Memo on chain</dt>
                <dd className="mt-0.5">{done.tx.memo_hex ? <Hash value={done.tx.memo_hex} head={10} tail={8} /> : "No memo"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Signed by</dt>
                <dd className="mt-1 space-y-1">
                  {(done.signers ?? []).length === 0 ? <span className="text-ink-2">The sender&apos;s own key (not a fund payout)</span> : done.signers!.map((s) => <div key={s}><KeyName value={s} names={names} /></div>)}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Fee charged</dt>
                <dd className="tnum mt-0.5">{stroops(done.tx.fee_charged)}</dd>
              </div>
            </dl>
          </>
        )}
      </div>
    </div>
  )
}
