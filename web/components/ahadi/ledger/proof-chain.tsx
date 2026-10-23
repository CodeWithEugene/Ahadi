"use client"

import {
  ArrowRight,
  Ban,
  CircleCheck,
  CircleDashed,
  CircleX,
  FileJson,
  Fingerprint,
  KeyRound,
  LoaderCircle,
  NotebookText,
  RefreshCw,
  StickyNote,
} from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

import { KIND } from "@/components/ahadi/status"
import { ApiError } from "@/lib/api"
import { short, usd } from "@/lib/format"
import {
  canonicalJson,
  sha256Hex,
  verifyTx,
  type VerifyResult,
} from "@/lib/ledger-data"
import type { Line } from "@/lib/types"
import { cn } from "@/lib/utils"

type State = "pass" | "fail" | "blocked" | "skip"
type Step = {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  state: State
  value: string | null
  note: string
}

export type ProofKeys = { agent?: string; organiser?: string }

const strip = (id: string | null | undefined) =>
  id ? id.replace(/^(rule|carry):/, "") : null

/** Work out each link of the chain from what the browser computed and what Stellar returned. */
function evaluate(
  line: Line,
  request: Record<string, unknown> | null,
  fp: string | null,
  v: VerifyResult | null,
  keys: ProofKeys
): Step[] {
  const rid = strip(line.request_id)
  const d = line.detail ?? {}
  const tx = line.tx_hash
  const steps: Step[] = []

  // 1. The request
  if (request) {
    const bits = [
      "amount_cents" in request ? usd(Number(request.amount_cents)) : null,
      typeof request.team === "string" ? request.team : null,
      typeof request.place === "number" ? `place ${request.place}` : null,
    ].filter(Boolean)
    steps.push({
      id: "request",
      title: "The request",
      icon: FileJson,
      state: "pass",
      value: bits.length
        ? bits.join(", ")
        : `${Object.keys(request).length} fields`,
      note: "What Ahadi proposed and both keys were asked to sign.",
    })
  } else {
    const why: Partial<Record<string, string>> = {
      received: "A deposit is the sponsor's own payment, not an Ahadi request.",
      rejected: "Refused by the rule, so no request was ever built or signed.",
      duplicate: "The same request as an earlier line; nothing new was built.",
      attested: "The organiser's attestation is recorded off chain.",
    }
    steps.push({
      id: "request",
      title: "The request",
      icon: FileJson,
      state: "skip",
      value: null,
      note: why[line.kind] ?? "No signed request belongs to this line.",
    })
  }

  // 2. The fingerprint
  if (request && fp && !rid) {
    steps.push({
      id: "fingerprint",
      title: "SHA-256 fingerprint",
      icon: Fingerprint,
      state: "pass",
      value: short(fp, 8, 6),
      note: "Your browser hashed the request Ahadi tried to send with its key alone.",
    })
  } else if (request && fp) {
    steps.push({
      id: "fingerprint",
      title: "SHA-256 fingerprint",
      icon: Fingerprint,
      state: fp === rid ? "pass" : "fail",
      value: short(fp, 8, 6),
      note:
        fp === rid
          ? "Your browser hashed the request and got the fingerprint on the ledger."
          : `Your browser got a different fingerprint from the ledger's ${short(rid, 6, 4)}.`,
    })
  } else {
    steps.push({
      id: "fingerprint",
      title: "SHA-256 fingerprint",
      icon: Fingerprint,
      state: "skip",
      value: rid ? short(rid, 8, 6) : null,
      note: rid
        ? "Recorded on the ledger; there is no request here to rehash."
        : "Nothing to fingerprint.",
    })
  }

  // 3. The memo
  const memo = v?.tx?.memo_hex ?? null
  if (!tx) {
    steps.push({
      id: "memo",
      title: "Memo on the transaction",
      icon: StickyNote,
      state: "skip",
      value: null,
      note:
        line.kind === "control" || line.kind === "failed"
          ? "Stellar refused the transaction, so no memo was ever recorded."
          : "This line never needed a transaction.",
    })
  } else if (!v || !v.found_on_chain) {
    steps.push({
      id: "memo",
      title: "Memo on the transaction",
      icon: StickyNote,
      state: "fail",
      value: null,
      note: "Stellar testnet has no transaction with this hash.",
    })
  } else if (
    (line.kind === "carried_out" || line.kind === "carried_in") &&
    memo &&
    memo === d.from_rule_hash
  ) {
    steps.push({
      id: "memo",
      title: "Memo on the transaction",
      icon: StickyNote,
      state: "pass",
      value: short(memo, 8, 6),
      note: "The memo is the fingerprint of the rule that released this reserve.",
    })
  } else if (line.kind === "received") {
    const ok = !!memo && memo === d.memo
    steps.push({
      id: "memo",
      title: "Memo on the transaction",
      icon: StickyNote,
      state: ok ? "pass" : memo ? "fail" : "skip",
      value: memo ? short(memo, 8, 6) : null,
      note: ok
        ? "The sponsor's memo on chain is the one the ledger recorded."
        : memo
          ? "The memo on chain differs from the one recorded."
          : "The deposit carries no memo.",
    })
  } else {
    const target = fp ?? rid
    const ok = !!memo && memo === target
    steps.push({
      id: "memo",
      title: "Memo on the transaction",
      icon: StickyNote,
      state: ok ? "pass" : "fail",
      value: memo ? short(memo, 8, 6) : "No memo",
      note: ok
        ? "The memo Stellar recorded is the request's fingerprint, so the request cannot be swapped."
        : "The memo on chain does not equal the request's fingerprint.",
    })
  }

  // 4. The signatures
  if (!tx) {
    if (line.kind === "control")
      steps.push({
        id: "signatures",
        title: "Two signatures",
        icon: KeyRound,
        state: "blocked",
        value: "Ahadi's key only",
        note: `One key alone was refused (${d.code ?? "tx_bad_auth"}). That refusal is the safeguard working.`,
      })
    else if (line.kind === "failed")
      steps.push({
        id: "signatures",
        title: "Two signatures",
        icon: KeyRound,
        state: "blocked",
        value: "Both keys",
        note: `Signed by both, but the network refused it (${d.code ?? "refused"}). Nothing moved.`,
      })
    else
      steps.push({
        id: "signatures",
        title: "Two signatures",
        icon: KeyRound,
        state: "skip",
        value: null,
        note: "Nothing was signed, so nothing could move.",
      })
  } else if (v?.found_on_chain) {
    const signers = v.signers ?? []
    const a = !!keys.agent && signers.includes(keys.agent)
    const o = !!keys.organiser && signers.includes(keys.organiser)
    if (
      line.kind === "received" ||
      (line.kind === "carried_in" && signers.length === 0)
    ) {
      steps.push({
        id: "signatures",
        title: "Two signatures",
        icon: KeyRound,
        state: "skip",
        value: signers.length ? `${signers.length} signer` : "Sender's key",
        note: "Money coming in is signed by its sender. Only money leaving a fund needs both keys.",
      })
    } else {
      steps.push({
        id: "signatures",
        title: "Two signatures",
        icon: KeyRound,
        state: a && o ? "pass" : "fail",
        value: a && o ? "Both keys" : a ? "Ahadi only" : o ? "Organiser only" : "Missing",
        note:
          a && o
            ? "Stellar recorded both Ahadi's and the organiser's signatures."
            : "Stellar does not show both required signatures.",
      })
    }
  } else {
    steps.push({
      id: "signatures",
      title: "Two signatures",
      icon: KeyRound,
      state: "fail",
      value: null,
      note: "Could not read the signatures from Stellar testnet.",
    })
  }

  // 5. The ledger line
  if (!tx) {
    steps.push({
      id: "line",
      title: `Ledger line ${line.seq}`,
      icon: NotebookText,
      state: "pass",
      value: KIND[line.kind]?.label ?? line.kind,
      note: "The ledger records what happened, including what did not go through.",
    })
  } else {
    const ok = !!v?.line && v.line.tx_hash === tx
    steps.push({
      id: "line",
      title: `Ledger line ${line.seq}`,
      icon: NotebookText,
      state: ok ? "pass" : "fail",
      value: KIND[line.kind]?.label ?? line.kind,
      note: ok
        ? `Ahadi's ledger points to this same transaction${line.amount_cents ? ` for ${usd(line.amount_cents)}` : ""}.`
        : "No ledger line points to this transaction.",
    })
  }
  return steps
}

const STATE_STYLE: Record<
  State,
  {
    ring: string
    chip: string
    label: string
    icon: React.ComponentType<{ className?: string }>
  }
> = {
  pass: {
    ring: "border-note/40 bg-note-soft/50",
    chip: "bg-note text-white",
    label: "Holds",
    icon: CircleCheck,
  },
  fail: {
    ring: "border-failed/40 bg-failed-soft/60",
    chip: "bg-failed text-white",
    label: "Broken",
    icon: CircleX,
  },
  blocked: {
    ring: "border-rejected/30 bg-rejected-soft/50",
    chip: "bg-rejected text-white",
    label: "Refused",
    icon: Ban,
  },
  skip: {
    ring: "border-dashed border-hair bg-paper/60",
    chip: "bg-paper-2 text-ink-2",
    label: "Not needed",
    icon: CircleDashed,
  },
}

type Phase =
  | { p: "idle" }
  | { p: "running" }
  | { p: "done"; steps: Step[]; at: Date }
  | { p: "error"; msg: string }

/**
 * The proof chain: request, fingerprint, memo, signatures, ledger line. Each link is
 * worked out in the browser against what Stellar testnet returns, and lights up in turn.
 */
export function ProofChain({
  line,
  request,
  keys,
  auto = true,
  initial,
  title = "The proof chain",
}: {
  line: Line
  request: Record<string, unknown> | null
  keys: ProofKeys
  auto?: boolean
  initial?: VerifyResult | null
  title?: string
}) {
  const [phase, setPhase] = useState<Phase>(
    auto ? { p: "running" } : { p: "idle" }
  )
  const [shown, setShown] = useState(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const run = useCallback(
    async (useInitial: boolean) => {
      timers.current.forEach(clearTimeout)
      setShown(0)
      setPhase({ p: "running" })
      try {
        const fp = request ? await sha256Hex(canonicalJson(request)) : null
        const v = line.tx_hash
          ? useInitial && initial
            ? initial
            : await verifyTx(line.tx_hash)
          : null
        const steps = evaluate(line, request, fp, v, keys)
        setPhase({ p: "done", steps, at: new Date() })
        steps.forEach((_, i) =>
          timers.current.push(setTimeout(() => setShown(i + 1), 280 + i * 380))
        )
      } catch (e) {
        setPhase({
          p: "error",
          msg:
            e instanceof ApiError
              ? e.message
              : "Could not reach Stellar testnet just now. Try again in a moment.",
        })
      }
    },
    [line, request, keys, initial]
  )

  useEffect(() => {
    if (!auto) return
    const pending = timers.current
    let live = true
    const t = setTimeout(() => live && run(true), 0)
    return () => {
      live = false
      clearTimeout(t)
      pending.forEach(clearTimeout)
    }
  }, [auto, run])

  const steps = phase.p === "done" ? phase.steps : null
  const finished = steps && shown >= steps.length
  const broken = steps?.filter((s) => s.state === "fail").length ?? 0
  const placeholder = [
    "The request",
    "SHA-256 fingerprint",
    "Memo on the transaction",
    "Two signatures",
    `Ledger line ${line.seq}`,
  ]

  return (
    <section className="@container" aria-labelledby="proof-title">
      <div className="mx-auto max-w-3xl text-center">
        <h2 id="proof-title" className="text-2xl font-semibold sm:text-3xl">
          {title}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl leading-relaxed text-ink-2">
          Five links, from what was asked to what was recorded. Your browser
          checks each one against Stellar testnet and lights it up in turn.
        </p>
        <button
          type="button"
          onClick={() => run(false)}
          disabled={phase.p === "running"}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-ink/15 bg-card px-3.5 py-2 text-sm font-medium transition-colors hover:border-ink/40 disabled:opacity-60"
        >
          {phase.p === "running" ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
          ) : (
            <RefreshCw className="size-4" aria-hidden />
          )}
          {phase.p === "idle" ? "Check against the chain" : "Check again"}
        </button>
      </div>

      <ol className="mt-6 grid gap-3 @3xl:grid-cols-5 @3xl:gap-0">
        {(steps ?? placeholder.map((): Step | null => null)).map((s, i) => {
          const visible = !!s && i < shown
          const st = visible ? STATE_STYLE[s!.state] : null
          const Icon =
            s?.icon ??
            [FileJson, Fingerprint, StickyNote, KeyRound, NotebookText][i]
          const StateIcon = st?.icon
          return (
            <li key={i} className="relative flex @3xl:pr-3">
              {i < 4 && (
                <ArrowRight
                  className={cn(
                    "absolute top-[2.15rem] -right-2 z-10 hidden size-4 transition-colors duration-500 @3xl:block",
                    visible ? "text-note" : "text-hair"
                  )}
                  aria-hidden
                />
              )}
              <div
                className={cn(
                  "flex w-full flex-col rounded-xl border p-4 transition-colors duration-500",
                  st ? st.ring : "border-hair bg-card"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "flex size-9 items-center justify-center rounded-full transition-colors duration-500",
                      visible
                        ? "bg-card text-ink shadow-xs"
                        : "bg-paper-2 text-muted-foreground"
                    )}
                  >
                    <Icon className="size-4" aria-hidden />
                  </span>
                  {st && StateIcon ? (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
                        st.chip
                      )}
                    >
                      <StateIcon className="size-3.5" aria-hidden />
                      {st.label}
                    </span>
                  ) : phase.p === "running" || (steps && i >= shown) ? (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <LoaderCircle
                        className="size-3.5 animate-spin"
                        aria-hidden
                      />{" "}
                      Checking
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Waiting
                    </span>
                  )}
                </div>
                <div className="mt-3 text-sm font-semibold">
                  {s?.title ?? placeholder[i]}
                </div>
                <div
                  className={cn(
                    "hash mt-1 min-h-5 truncate text-[0.8125rem]",
                    visible ? "text-ink" : "text-transparent"
                  )}
                >
                  {visible ? (s!.value ?? "None") : "."}
                </div>
                <p
                  className={cn(
                    "mt-2 text-[0.8125rem] leading-snug transition-opacity duration-500",
                    visible ? "text-ink-2 opacity-100" : "opacity-0"
                  )}
                >
                  {visible ? s!.note : "."}
                </p>
              </div>
            </li>
          )
        })}
      </ol>

      <div aria-live="polite" className="mt-4 min-h-6 text-center text-sm">
        {phase.p === "error" && (
          <p className="rounded-xl bg-failed-soft px-3.5 py-3 text-failed">
            {phase.msg}
          </p>
        )}
        {finished && phase.p === "done" && (
          <p
            className={cn(
              "flex flex-wrap items-center justify-center gap-x-2 font-medium",
              broken ? "text-failed" : "text-note-ink"
            )}
          >
            {broken ? (
              <CircleX className="size-4" aria-hidden />
            ) : (
              <CircleCheck className="size-4" aria-hidden />
            )}
            {broken
              ? `${broken} ${broken === 1 ? "link is" : "links are"} broken. Treat this line as unproven.`
              : "Every link that applies holds. The chain and the ledger agree."}
            <span className="font-normal text-muted-foreground">
              Read live from Stellar testnet at{" "}
              {phase.at.toLocaleTimeString("en-GB")}.
            </span>
          </p>
        )}
      </div>
    </section>
  )
}
