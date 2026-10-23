"use client"

import {
  CircleAlert,
  CircleCheck,
  CircleHelp,
  LoaderCircle,
  SearchX,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useId, useRef, useState } from "react"

import { Hash } from "@/components/ahadi/hash"
import { KIND, KindChip } from "@/components/ahadi/status"
import { ApiError } from "@/lib/api"
import { EXPLORER_TX, usd } from "@/lib/format"
import {
  extractTx,
  fullTime,
  getLine,
  HORIZON_TX,
  stroops,
  TX_RE,
  verifyTx,
  type VerifyResult,
} from "@/lib/ledger-data"
import { cn } from "@/lib/utils"

import { KeyName, type KeyNames } from "./chain-check"
import { ProofChain, type ProofKeys } from "./proof-chain"

export type Example = { tx: string; label: string }

type State =
  | { s: "idle" }
  | { s: "busy"; tx: string }
  | { s: "done"; tx: string; r: VerifyResult }
  | { s: "error"; tx: string; msg: string }

async function lookup(tx: string): Promise<State> {
  try {
    return { s: "done", tx, r: await verifyTx(tx) }
  } catch (e) {
    if (e instanceof ApiError && e.status === 400)
      return { s: "error", tx, msg: e.message }
    return {
      s: "error",
      tx,
      msg: "Ahadi could not reach Stellar testnet just now. Try again in a moment, or open the hash on stellar.expert directly.",
    }
  }
}

export function VerifyTool({
  initialTx,
  examples,
  names,
  eventNames,
  keys,
}: {
  initialTx: string
  examples: Example[]
  names: KeyNames
  eventNames: Record<string, string>
  keys: ProofKeys
}) {
  const router = useRouter()
  const inputId = useId()
  const hintId = useId()
  const errId = useId()
  const resultRef = useRef<HTMLDivElement>(null)
  const initial = extractTx(initialTx)
  const [value, setValue] = useState(initialTx)
  const [fieldError, setFieldError] = useState<string | null>(
    initialTx && !TX_RE.test(initial) ? validate(initialTx) : null
  )
  const [st, setSt] = useState<State>(
    TX_RE.test(initial) ? { s: "busy", tx: initial } : { s: "idle" }
  )

  useEffect(() => {
    if (!TX_RE.test(initial)) return
    let live = true
    lookup(initial).then((next) => live && setSt(next))
    return () => {
      live = false
    }
    // Only on first load: later checks run from submit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function check(raw: string) {
    const err = validate(raw)
    setFieldError(err)
    if (err) return
    const tx = extractTx(raw)
    setValue(tx)
    setSt({ s: "busy", tx })
    router.replace(`/verify?tx=${tx}`, { scroll: false })
    const next = await lookup(tx)
    setSt(next)
    requestAnimationFrame(() =>
      resultRef.current?.focus({ preventScroll: false })
    )
  }

  return (
    <div>
      <div className="mx-auto max-w-3xl">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            check(value)
          }}
          noValidate
          className="rounded-2xl border bg-card p-4 shadow-xs sm:p-5"
        >
          <label htmlFor={inputId} className="text-sm font-medium">
            Stellar testnet transaction hash
          </label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              id={inputId}
              value={value}
              onChange={(e) => {
                setValue(e.target.value)
                if (fieldError) setFieldError(null)
              }}
              placeholder="ab4e8a838e9991733eb4610182bb68707d13c964121e0204b1571a4753f55a76"
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
              aria-invalid={!!fieldError}
              aria-describedby={fieldError ? errId : hintId}
              className={cn(
                "hash min-w-0 flex-1 rounded-lg border bg-paper/60 px-3.5 py-3 text-[0.875rem] outline-none placeholder:text-muted-foreground/60 focus:border-note focus:bg-card focus-visible:outline-2 focus-visible:outline-offset-0",
                fieldError && "border-failed"
              )}
            />
            <button
              type="submit"
              disabled={st.s === "busy"}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-note px-5 py-3 font-medium text-white transition-colors hover:bg-note-ink disabled:opacity-70"
            >
              {st.s === "busy" && (
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
              )}
              {st.s === "busy" ? "Checking" : "Check"}
            </button>
          </div>
          {fieldError ? (
            <p id={errId} className="mt-2 text-sm text-failed">
              {fieldError}
            </p>
          ) : (
            <p id={hintId} className="mt-2 text-sm text-muted-foreground">
              64 characters, digits and the letters a to f. A stellar.expert or
              Horizon link works too.
            </p>
          )}

          {examples.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
              <span className="text-sm text-muted-foreground">
                Try one from the October ledger:
              </span>
              {examples.map((ex) => (
                <button
                  key={ex.tx}
                  type="button"
                  onClick={() => {
                    setValue(ex.tx)
                    check(ex.tx)
                  }}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm transition-colors",
                    st.s !== "idle" && st.tx === ex.tx
                      ? "border-ink bg-ink text-paper"
                      : "border-hair bg-card text-ink-2 hover:border-ink/40"
                  )}
                >
                  {ex.label}
                </button>
              ))}
            </div>
          )}
        </form>
      </div>

      <div
        ref={resultRef}
        tabIndex={-1}
        aria-live="polite"
        className="mt-12 min-w-0 outline-none"
      >
        {st.s === "idle" && <IdleHint />}
        {st.s === "busy" && <Busy />}
        {st.s === "error" && (
          <Verdict
            tone="failed"
            icon={CircleAlert}
            title="That check did not run"
            text={st.msg}
          />
        )}
        {st.s === "done" && (
          <Result
            r={st.r}
            tx={st.tx}
            names={names}
            eventNames={eventNames}
            keys={keys}
          />
        )}
      </div>
    </div>
  )
}

function validate(raw: string): string | null {
  const s = raw.trim()
  if (!s) return "Paste a transaction hash first."
  const tx = extractTx(s)
  if (TX_RE.test(tx)) return null
  if (/^[0-9a-f]+$/i.test(s))
    return `That is ${s.length} characters long. A Stellar transaction hash is exactly 64.`
  if (/^G[A-Z2-7]{55}$/.test(s))
    return "That looks like a wallet address, not a transaction. Paste the hash of a transaction instead."
  return "That is not a transaction hash. It should be 64 characters using only 0 to 9 and a to f."
}

function IdleHint() {
  return (
    <div className="grid gap-6 rounded-2xl border border-dashed px-6 py-8 text-sm text-ink-2 sm:grid-cols-3">
      <Hint n={1} title="Read from the chain">
        Ahadi fetches the transaction from Stellar testnet itself: when it
        closed, its memo, and who signed it.
      </Hint>
      <Hint n={2} title="Matched to the ledger">
        The memo is the fingerprint of the request. Ahadi finds the ledger line
        with that fingerprint.
      </Hint>
      <Hint n={3} title="Compared, in the open">
        You see both sides next to each other, and each check that passes or
        fails.
      </Hint>
    </div>
  )
}

function Hint({
  n,
  title,
  children,
}: {
  n: number
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="tnum flex size-6 items-center justify-center rounded-full border border-note/30 text-xs font-semibold text-note">
          {n}
        </span>
        <span className="font-medium text-ink">{title}</span>
      </div>
      <p className="mt-2 leading-relaxed">{children}</p>
    </div>
  )
}

function Busy() {
  return (
    <div className="space-y-4" aria-label="Checking">
      <div className="h-16 animate-pulse rounded-2xl bg-paper-2" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-72 animate-pulse rounded-2xl bg-paper-2/70" />
        <div className="h-72 animate-pulse rounded-2xl bg-paper-2/70" />
      </div>
    </div>
  )
}

function Verdict({
  tone,
  icon: Icon,
  title,
  text,
  children,
}: {
  tone: "note" | "failed" | "organiser" | "quiet"
  icon: React.ComponentType<{ className?: string }>
  title: string
  text?: React.ReactNode
  children?: React.ReactNode
}) {
  const tones = {
    note: "bg-note-soft text-note-ink border-note/20",
    failed: "bg-failed-soft text-failed border-failed/20",
    organiser: "bg-organiser-soft text-organiser border-organiser/20",
    quiet: "bg-paper-2 text-ink border-hair",
  }
  return (
    <div className={cn("mx-auto max-w-3xl rounded-2xl border px-5 py-5 text-center", tones[tone])}>
      <div className="min-w-0">
        <h2 className="flex items-center justify-center gap-2 font-sans text-lg font-semibold tracking-normal">
          <Icon className="size-5 shrink-0" aria-hidden />
          {title}
        </h2>
        {text && <p className="mx-auto mt-1 max-w-2xl text-ink-2">{text}</p>}
        {children}
      </div>
    </div>
  )
}

function LineProof({ r, keys }: { r: VerifyResult; keys: ProofKeys }) {
  const line = r.line!
  const [req, setReq] = useState<{
    id: string
    request: Record<string, unknown> | null
  } | null>(null)
  useEffect(() => {
    let live = true
    getLine(line.id)
      .then(
        (l) =>
          live &&
          setReq({
            id: line.id,
            request:
              (l.proposal?.request as Record<string, unknown> | undefined) ??
              null,
          })
      )
      .catch(() => live && setReq({ id: line.id, request: null }))
    return () => {
      live = false
    }
  }, [line.id])
  if (!req || req.id !== line.id)
    return (
      <div
        className="h-64 animate-pulse rounded-2xl bg-paper-2/70"
        aria-label="Loading the proof chain"
      />
    )
  return (
    <ProofChain
      key={`${line.id}-${r.tx?.hash}`}
      line={line}
      request={line.kind === "control" ? null : req.request}
      keys={keys}
      initial={r}
      title="The proof chain"
    />
  )
}

function Result({
  r,
  tx,
  names,
  eventNames,
  keys,
}: {
  r: VerifyResult
  tx: string
  names: KeyNames
  eventNames: Record<string, string>
  keys: ProofKeys
}) {
  if (!r.found_on_chain || !r.tx) {
    return (
      <Verdict
        tone="failed"
        icon={SearchX}
        title="Not found on Stellar testnet"
        text={
          <>
            Stellar testnet has no transaction with this hash. Check that it was
            copied in full, and that it is from testnet, not the public network.
            Testnet is also reset from time to time, which removes old
            transactions.
          </>
        }
      />
    )
  }
  const checks = r.checks ?? []
  const failing = checks.filter((c) => !c.passed).length
  const line = r.line

  return (
    <div className="space-y-10">
      {!line ? (
        <Verdict
          tone="organiser"
          icon={CircleHelp}
          title="On Stellar testnet, but not an Ahadi line"
          text="This transaction exists, but no Ahadi ledger records it. It may be a setup transaction or someone else's payment. Only lines on a public ledger carry Ahadi's promise."
        />
      ) : failing === 0 ? (
        <Verdict
          tone="note"
          icon={CircleCheck}
          title={`The chain agrees with ledger line ${line.seq}`}
          text={`All ${checks.length} ${checks.length === 1 ? "check passes" : "checks pass"}. What Stellar recorded is what Ahadi's ledger says happened.`}
        />
      ) : (
        <Verdict
          tone="failed"
          icon={CircleAlert}
          title={`${failing} of ${checks.length} checks fail`}
          text="The chain and the ledger disagree. Treat this line as unproven."
        />
      )}

      {line && <LineProof r={r} keys={keys} />}

      <div className="grid gap-4 md:grid-cols-2">
        <Side
          title="What Stellar says"
          sub="Read live from Horizon, Stellar testnet's public API"
        >
          <Row k="Result">
            {r.tx.successful ? "Succeeded" : "Failed on chain"}
          </Row>
          <Row k="Closed at">{fullTime(r.tx.created_at)}</Row>
          <Row k="Ledger">
            <span className="tnum">{r.tx.ledger.toLocaleString("en-US")}</span>
          </Row>
          <Row k="Sent from">
            <KeyName value={r.tx.source_account} names={names} />
          </Row>
          <Row k="Memo">
            {r.tx.memo_hex ? (
              <Hash value={r.tx.memo_hex} head={10} tail={8} />
            ) : (
              <span className="text-muted-foreground">No memo</span>
            )}
          </Row>
          <Row k="Signed by">
            {(r.signers ?? []).length ? (
              <span className="flex flex-col gap-1">
                {r.signers!.map((s) => (
                  <KeyName key={s} value={s} names={names} />
                ))}
              </span>
            ) : (
              <span className="text-ink-2">The sender&apos;s own key</span>
            )}
          </Row>
          <Row k="Fee charged">
            <span className="tnum">{stroops(r.tx.fee_charged)}</span>
          </Row>
          <div className="flex flex-wrap gap-x-4 gap-y-1 pt-3 text-sm">
            <a
              href={r.receipt_url ?? EXPLORER_TX + tx}
              target="_blank"
              rel="noreferrer"
              className="rounded font-medium text-note underline-offset-4 hover:underline"
            >
              Open on stellar.expert
            </a>
            <a
              href={HORIZON_TX + tx}
              target="_blank"
              rel="noreferrer"
              className="rounded font-medium text-note underline-offset-4 hover:underline"
            >
              Raw Horizon JSON
            </a>
          </div>
        </Side>

        <Side
          title="What Ahadi's ledger says"
          sub={
            line
              ? `${eventNames[line.event_id] ?? line.event_id}, line ${line.seq}`
              : "No matching line"
          }
        >
          {line ? (
            <>
              <Row k="What happened">
                <KindChip kind={line.kind} />
              </Row>
              <Row k="Who">
                {line.kind === "carried_out"
                  ? (eventNames[line.party ?? ""] ?? line.party)
                  : (line.party ?? "Not recorded")}
              </Row>
              <Row k="Amount">
                <span className="tnum font-semibold">
                  {line.amount_cents
                    ? usd(line.amount_cents)
                    : "No money moved"}
                </span>
              </Row>
              <Row k="Recorded at">{fullTime(line.created_at)}</Row>
              <Row k="Request fingerprint">
                {line.request_id ? (
                  <Hash
                    value={line.request_id.replace(/^(rule|carry):/, "")}
                    head={10}
                    tail={8}
                  />
                ) : (
                  <span className="text-muted-foreground">None</span>
                )}
              </Row>
              <div className="pt-3">
                <p className="text-sm text-ink-2">{KIND[line.kind]?.help}</p>
                <Link
                  href={`/receipt/${line.id}`}
                  className="mt-3 inline-block rounded text-sm font-medium text-note underline-offset-4 hover:underline"
                >
                  Open the full receipt
                </Link>
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col justify-center py-6 text-ink-2">
              <p>No line on any Ahadi ledger points to this transaction.</p>
              <Link
                href="/funds"
                className="mt-3 rounded text-sm font-medium text-note underline-offset-4 hover:underline"
              >
                Browse the public ledgers
              </Link>
            </div>
          )}
        </Side>
      </div>
    </div>
  )
}

function Side({
  title,
  sub,
  children,
}: {
  title: string
  sub: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col rounded-2xl border bg-card p-5 sm:p-6">
      <h2 className="font-sans text-lg font-semibold tracking-normal">
        {title}
      </h2>
      <p className="text-sm text-muted-foreground">{sub}</p>
      <div className="mt-4 flex-1 divide-y">{children}</div>
    </section>
  )
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <dl className="grid grid-cols-[7.5rem_1fr] gap-3 py-2.5 text-[0.9375rem]">
      <dt className="text-sm text-muted-foreground">{k}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </dl>
  )
}
