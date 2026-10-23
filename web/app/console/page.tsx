"use client"

import { Check, CircleDashed, Hourglass, Loader2, Lock, OctagonAlert } from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { AgentPanel } from "@/components/ahadi/console/agent-panel"
import { OrganiserKeyCard, OrganiserKeyProvider } from "@/components/ahadi/console/organiser-key"
import { PasscodeBar } from "@/components/ahadi/console/passcode"
import { approveProposal, ProposalCard } from "@/components/ahadi/console/proposal-card"
import { useOrganiserKey } from "@/components/ahadi/console/organiser-key"
import { FundEquation } from "@/components/ahadi/fund-equation"
import { Hash } from "@/components/ahadi/hash"
import { LedgerTable } from "@/components/ahadi/ledger-table"
import { useStream } from "@/hooks/use-stream"
import { api, ApiError, getFund, getHealth, getProposals } from "@/lib/api"
import { EXPLORER_TX, usd } from "@/lib/format"
import type { FundView, Health, Line, Proposal } from "@/lib/types"
import { cn } from "@/lib/utils"

const EVENTS = [
  { id: "october-2026", label: "October fund" },
  { id: "december-2026", label: "December fund" },
]

export default function ConsolePage() {
  return (
    <OrganiserKeyProvider>
      <Console />
    </OrganiserKeyProvider>
  )
}

function Console() {
  const [eventId, setEventId] = useState("october-2026")
  const [fund, setFund] = useState<FundView | null>(null)
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [health, setHealth] = useState<Health | null>(null)
  const [orgPublic, setOrgPublic] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { events, connected } = useStream()

  const refresh = useCallback(async () => {
    try {
      const [f, p, h] = await Promise.all([getFund(eventId), getProposals(eventId), getHealth()])
      setFund(f)
      setProposals(p)
      setHealth(h)
      setError(null)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Ahadi's service is not reachable.")
    }
  }, [eventId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial load; state is set after the fetch resolves
    refresh()
    api<{ public: string }>("/api/organiser-key/public").then((r) => setOrgPublic(r.public)).catch(() => {})
  }, [refresh])

  // Refresh when money or proposals change.
  const lastChange = useMemo(() => [...events].reverse().find((e) => ["ledger", "proposal", "omega"].includes(e.kind))?.id ?? 0, [events])
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- refetch after a live ledger or proposal event
    if (lastChange) refresh()
  }, [lastChange, refresh])

  const open = proposals.filter((p) => p.status === "proposed")
  const confirming = proposals.filter((p) => p.status === "submitted")
  const failed = proposals.filter((p) => p.status === "failed" && p.kind === "payout" && !proposals.some((q) => q.parent_id === p.id))
  const placementOf = (p: Proposal) => fund?.placements?.find((x) => x.place === p.request?.place) ?? null
  const shareOf = (p: Proposal) => {
    const place = p.request?.place
    if (!place || !fund?.derivation) return null
    return `${(fund.rule.place_shares_bp[place - 1] / 100).toFixed(0)}% of ${usd(fund.derivation.award_cents)} award pool`
  }

  return (
    <div className="ahadi-page py-8">
      <div className="flex flex-col items-center gap-5 text-center">
        <div>
          <h1 className="text-3xl font-semibold sm:text-5xl">Organiser console</h1>
          <p className="mt-2 text-lg text-ink-2">Run the fund with Ahadi. Nothing moves until you sign.</p>
        </div>
        <div className="flex rounded-xl bg-paper-2 p-1" role="tablist" aria-label="Choose fund">
          {EVENTS.map((e) => (
            <button key={e.id} role="tab" aria-selected={eventId === e.id} onClick={() => setEventId(e.id)} className={cn("rounded-lg px-4 py-2 text-sm", eventId === e.id ? "bg-card font-medium shadow-xs" : "text-ink-2 hover:text-ink")}>
              {e.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-failed/30 bg-failed-soft px-4 py-3 text-sm text-failed" role="alert">
          {error} The public ledger and receipts on Stellar are unaffected.
        </div>
      )}

      <div className="mt-6">
        <PasscodeBar />
      </div>

      {fund && <Checklist lines={fund.lines} />}

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_26rem]">
        <div className="min-w-0 space-y-6">
          <OrganiserKeyCard expectedPublic={orgPublic} />

          <section aria-labelledby="waiting">
            <div className="flex items-baseline justify-between">
              <h2 id="waiting" className="font-sans text-lg font-semibold tracking-normal">
                Waiting for your approval
              </h2>
              <div className="flex items-center gap-3">
                <span className="text-sm text-ink-2">{open.length === 0 ? "Nothing waiting" : `${open.length} waiting`}</span>
                {open.length > 1 && <ApproveAll proposals={open} onDone={refresh} />}
              </div>
            </div>
            <div className="mt-3 space-y-4">
              {open.length === 0 && (
                <div className="rounded-2xl border border-dashed bg-card px-5 py-10 text-center text-sm text-ink-2">
                  When Ahadi proposes a payout, it appears here with the rule&apos;s checks. Ask Ahadi in the panel to propose the payouts.
                </div>
              )}
              {open.map((p, i) => (
                <ProposalCard key={p.id} p={p} placement={placementOf(p)} onDone={refresh} open={open.length === 1 && i === 0} share={shareOf(p)} />
              ))}
            </div>
          </section>

          {confirming.length > 0 && (
            <div className="flex items-start gap-3 rounded-2xl border border-carried/30 bg-carried-soft px-5 py-4 text-sm" role="status">
              <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-carried" />
              <div>
                <div className="font-medium text-carried">Waiting for Stellar to confirm {confirming.length === 1 ? "one signed transaction" : `${confirming.length} signed transactions`}</div>
                <p className="mt-0.5 text-ink-2">The network did not answer in time. Each signed transaction is saved; Ahadi checks it by its hash and resends the identical envelope only if Stellar never saw it, so nothing can be paid twice.</p>
              </div>
            </div>
          )}

          {failed.length > 0 && (
            <section aria-labelledby="failed">
              <h2 id="failed" className="font-sans text-lg font-semibold tracking-normal">
                Payouts that did not go through
              </h2>
              <div className="mt-3 space-y-3">
                {failed.map((p) => (
                  <FailedCard key={p.id} p={p} onDone={refresh} />
                ))}
              </div>
            </section>
          )}

          {fund && <RunTheEvent fund={fund} onDone={refresh} />}

          {fund && (
            <section aria-labelledby="money" className="rounded-2xl border bg-card p-5">
              <div className="flex items-baseline justify-between">
                <h2 id="money" className="font-sans text-lg font-semibold tracking-normal">
                  {fund.event.name}
                </h2>
                <Link href={`/funds/${fund.event.event_id}`} className="text-sm font-medium text-note hover:underline">
                  Public view
                </Link>
              </div>
              <FundEquation totals={fund.totals} className="mt-4" />
            </section>
          )}

          {fund && (
            <section aria-labelledby="recent">
              <h2 id="recent" className="mb-3 font-sans text-lg font-semibold tracking-normal">
                Ledger
              </h2>
              <LedgerTable lines={fund.lines} />
            </section>
          )}
        </div>

        <div className="min-w-0 xl:sticky xl:top-20 xl:self-start">
          <AgentPanel events={events} connected={connected} omegaOnline={!!health?.omega.connected} />
          <p className="mt-2 px-1 text-xs text-muted-foreground">
            {health?.omega.provider ? `Running on ${health.omega.provider}${health.omega.model ? `, ${health.omega.model}` : ""}. ` : ""}
            <Link href="/console/agent" className="underline-offset-4 hover:underline">
              What Ahadi knows
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

const ITEMS = [
  { id: "rule", label: "Funding rule published and recorded" },
  { id: "approval", label: "Approval before any transfer" },
  { id: "receipts", label: "Every payout linked to a receipt" },
  { id: "failures", label: "Failed and duplicate requests handled" },
  { id: "carry", label: "Carry-forward to the next event traceable" },
]

function Checklist({ lines }: { lines: Line[] }) {
  const has = (k: string) => lines.some((l) => l.kind === k)
  const money = lines.filter((l) => l.kind === "paid" || l.kind === "held")
  const done: Record<string, boolean> = {
    rule: has("rule"),
    approval: has("control") || money.length > 0,
    receipts: money.length > 0 && money.every((l) => !!l.tx_hash),
    failures: (has("failed") || has("held")) && has("duplicate"),
    carry: has("carried_out") || has("carried_in"),
  }
  const n = Object.values(done).filter(Boolean).length
  return (
    <section className="mt-6 rounded-2xl border bg-card px-5 py-4" aria-label="Track checklist">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-medium">Showcase checklist</div>
        <div className="tnum text-sm text-ink-2">{n} of 5 done</div>
      </div>
      <ol className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {ITEMS.map((it, i) => (
          <li key={it.id} className={cn("flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm transition-colors", done[it.id] ? "bg-note-soft text-note-ink" : "bg-paper text-ink-2")}>
            {done[it.id] ? <Check className="mt-0.5 size-4 shrink-0" aria-label="done" /> : <CircleDashed className="mt-0.5 size-4 shrink-0" aria-label="not yet" />}
            <span>
              <span className="tnum mr-1 opacity-60">{i + 1}.</span>
              {it.label}
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}

function FailedCard({ p, onDone }: { p: Proposal; onDone: () => void }) {
  const [busy, setBusy] = useState(false)
  const r = p.request ?? {}
  const code = p.result?.code
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-failed/25 bg-failed-soft/60 px-5 py-4">
      <div className="flex items-start gap-3">
        <OctagonAlert className="mt-0.5 size-5 text-failed" aria-hidden />
        <div>
          <div className="font-medium">
            {r.team}: {usd(r.amount_cents)} did not settle
          </div>
          <p className="text-sm text-ink-2">
            {code === "op_no_destination" ? "The winner's wallet has never been activated on the network." : code === "op_no_trust" ? "The winner's wallet cannot hold the prize asset yet." : `The network answered ${code}.`} Nothing moved.
          </p>
        </div>
      </div>
      {(code === "op_no_destination" || code === "op_no_trust") && (
        <button
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            try {
              await api(`/api/proposals/${p.id}/reroute`, { method: "POST" })
              toast("Ahadi proposed holding the prize for the winner. Approve it above.")
            } catch (e) {
              toast.error(e instanceof ApiError ? e.message : "Could not propose the hold.")
            } finally {
              setBusy(false)
              onDone()
            }
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-held px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Hourglass className="size-4" />} Hold the prize for the winner
        </button>
      )}
    </div>
  )
}

function RunTheEvent({ fund, onDone }: { fund: FundView; onDone: () => void }) {
  const [eligible, setEligible] = useState(20)
  const [busy, setBusy] = useState<string | null>(null)
  const lines = fund.lines
  const has = (k: string) => lines.some((l) => l.kind === k)
  const ruleLine = lines.find((l) => l.kind === "rule")
  const isFirst = fund.event.event_id === "october-2026"

  async function act(id: string, path: string, body?: object, ok?: string) {
    setBusy(id)
    try {
      await api(path, { method: "POST", body: body ? JSON.stringify(body) : undefined })
      if (ok) toast(ok)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "That did not work.")
    } finally {
      setBusy(null)
      onDone()
    }
  }

  const steps = [
    {
      id: "rule",
      title: "Record the funding rule",
      done: has("rule"),
      body: ruleLine ? (
        <span>
          Recorded <Hash value={ruleLine.tx_hash!} href={EXPLORER_TX + ruleLine.tx_hash} />
        </span>
      ) : (
        "Before registration opens. Ahadi prepares it; you sign."
      ),
      action: !has("rule") && (
        <button onClick={() => act("rule", `/api/funds/${fund.event.event_id}/rule`, undefined, "Ahadi prepared the rule record. Approve it above.")} className={btn} disabled={!!busy}>
          Prepare rule record
        </button>
      ),
    },
    ...(isFirst
      ? [
          {
            id: "deposit",
            title: "Sponsor funds the event",
            done: has("received"),
            body: has("received") ? `${usd(fund.totals.received_cents)} received` : "Sample sponsor sends the pool to the fund.",
            action: !has("received") && has("rule") && (
              <button onClick={() => act("deposit", `/api/funds/${fund.event.event_id}/deposit`, undefined, "Sponsor deposit recorded.")} className={btn} disabled={!!busy}>
                Record sponsor deposit
              </button>
            ),
          },
          {
            id: "attest",
            title: "Attest who qualified",
            done: has("attested"),
            body: fund.event.eligible !== null ? `${fund.event.eligible} of ${fund.rule.target_teams} target teams qualified` : `How many of the ${fund.rule.target_teams} target teams met every requirement?`,
            action: !has("attested") && has("rule") && (
              <div className="flex items-center gap-2">
                <label className="sr-only" htmlFor="eligible">
                  Eligible teams
                </label>
                <input id="eligible" type="number" min={0} max={1000} value={eligible} onChange={(e) => setEligible(+e.target.value)} className="tnum w-20 rounded-lg border bg-paper px-2 py-1.5 text-sm" />
                <button onClick={() => act("attest", `/api/funds/${fund.event.event_id}/attest`, { eligible }, "Eligibility attested.")} className={btn} disabled={!!busy}>
                  Attest
                </button>
              </div>
            ),
          },
          { id: "pay", title: "Pay the winners", done: has("paid"), body: has("paid") ? `${usd(fund.totals.paid_cents)} paid, ${usd(fund.totals.held_cents)} held` : "Ask Ahadi to propose payouts, then approve each one.", action: null },
          { id: "carry", title: "Close and carry the reserve forward", done: has("carried_out"), body: has("carried_out") ? `${usd(fund.totals.carried_out_cents)} moved to the December fund` : "Ask Ahadi once every place is settled or held.", action: null },
        ]
      : [
          { id: "carried_in", title: "Reserve carried in from October", done: has("carried_in"), body: has("carried_in") ? `${usd(fund.totals.carried_in_cents)} received from the October fund` : "Arrives when October closes.", action: null },
        ]),
  ]

  return (
    <section aria-labelledby="run" className="rounded-2xl border bg-card p-5">
      <h2 id="run" className="font-sans text-lg font-semibold tracking-normal">
        Run the event
      </h2>
      <ol className="mt-4 space-y-3">
        {steps.map((s, i) => (
          <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-paper px-4 py-3">
            <div className="flex items-start gap-3">
              <span className={cn("tnum mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold", s.done ? "bg-note text-white" : "border border-ink/20 text-ink-2")}>{s.done ? <Check className="size-3.5" /> : i + 1}</span>
              <div>
                <div className="text-sm font-medium">{s.title}</div>
                <div className="text-sm text-ink-2">{s.body}</div>
              </div>
            </div>
            {s.action}
          </li>
        ))}
      </ol>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="size-3.5" /> Every money movement needs Ahadi&apos;s and your signature.
      </p>
    </section>
  )
}

const btn = "rounded-lg border border-ink/15 bg-card px-3 py-1.5 text-sm font-medium hover:border-ink/40 disabled:opacity-50"

function ApproveAll({ proposals, onDone }: { proposals: Proposal[]; onDone: () => void }) {
  const { key } = useOrganiserKey()
  const [progress, setProgress] = useState<number | null>(null)
  async function run() {
    if (!key) {
      toast.error("Load your organiser key first. Approving means adding your signature.")
      return
    }
    let ok = 0
    for (let i = 0; i < proposals.length; i++) {
      setProgress(i + 1)
      try {
        const res = await approveProposal(proposals[i].id, key.secret)
        if (res.ok) ok++
        else toast.warning(`${proposals[i].request?.team ?? "A payout"} failed: ${res.text ?? res.code}`)
      } catch (e) {
        toast.error(e instanceof ApiError ? e.message : "An approval failed.")
      }
      onDone()
    }
    setProgress(null)
    toast.success(`${ok} of ${proposals.length} signed and settled on Stellar testnet.`)
  }
  return (
    <button onClick={run} disabled={progress !== null} className="inline-flex items-center gap-2 rounded-lg border border-note/40 bg-note-soft px-3 py-1.5 text-sm font-medium text-note-ink hover:border-note disabled:opacity-70">
      {progress !== null ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
      {progress !== null ? `Signing ${progress} of ${proposals.length}` : `Approve all ${proposals.length}`}
    </button>
  )
}
