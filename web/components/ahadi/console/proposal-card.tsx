"use client"

import { Keypair, Networks, TransactionBuilder } from "@stellar/stellar-sdk"
import { ArrowRightLeft, Bot, Check, CircleCheck, FileCheck2, Globe2, Hourglass, KeyRound, Loader2, Send, X } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { useOrganiserKey } from "@/components/ahadi/console/organiser-key"
import { Hash } from "@/components/ahadi/hash"
import { api, ApiError } from "@/lib/api"
import { EXPLORER_TX, usd } from "@/lib/format"
import type { Proposal } from "@/lib/types"
import { cn } from "@/lib/utils"

const ROUTE: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  direct: { label: "Straight to the winner's wallet", icon: Send, tone: "text-note" },
  claimable: { label: "Held for the winner for 30 days", icon: Hourglass, tone: "text-held" },
  "cross-chain-sim": { label: "Stellar payout, cross-chain leg simulated", icon: Globe2, tone: "text-carried" },
  "manage-data": { label: "Written to the fund on chain", icon: FileCheck2, tone: "text-ink" },
  "carry-forward": { label: "Moved to the next event's fund", icon: ArrowRightLeft, tone: "text-carried" },
}

const CHECK_LABEL: Record<string, string> = {
  "rule-published": "Rule is on record",
  "rule-version": "Matches the published rule",
  "eligibility-attested": "Eligibility attested",
  "place-exists": "Place exists",
  "place-amount": "Amount is exactly the rule's",
  asset: "Right asset",
  budget: "Within the award budget",
  "not-duplicate": "Not a repeat",
  "place-unpaid": "Place not yet paid",
  "rule-valid": "Rule is well formed",
  "all-awards-settled": "All awards settled",
  reserve: "Reserve calculated",
}

function title(p: Proposal): string {
  const r = p.request ?? {}
  if (p.kind === "rule") return `Record the ${r.name ?? "event"} rule`
  if (p.kind === "carry") return `Carry the reserve to ${r.to_event === "december-2026" ? "the December fund" : r.to_event}`
  if (p.kind === "claimable") return `Hold ${r.team}'s prize`
  return `Pay ${r.team}`
}

export function signXdr(xdr: string, secret: string): string {
  const tx = TransactionBuilder.fromXDR(xdr, Networks.TESTNET)
  tx.sign(Keypair.fromSecret(secret))
  return tx.toXDR()
}

export async function approveProposal(id: string, secret: string) {
  const prep = await api<{ xdr: string; tx_hash: string }>(`/api/proposals/${id}/prepare`, { method: "POST" })
  const signed = signXdr(prep.xdr, secret)
  return api<{ ok: boolean; receipt_url?: string; code?: string; text?: string; next?: string }>(`/api/proposals/${id}/approve`, {
    method: "POST",
    body: JSON.stringify({ signed_xdr: signed }),
  })
}

function SignatureMeter({ state }: { state: "waiting" | "agent" | "both" }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={state === "both" ? "Both signatures present" : "Waiting for your signature"}>
      <span className={cn("flex size-7 items-center justify-center rounded-full border-2", state !== "waiting" ? "border-agent bg-agent text-white" : "border-agent/40 text-agent")} title="Ahadi's key: signs only what the rule allows">
        <Bot className="size-3.5" />
      </span>
      <span className="h-0.5 w-3 rounded bg-hair" aria-hidden />
      <span className={cn("flex size-7 items-center justify-center rounded-full border-2", state === "both" ? "border-organiser bg-organiser text-white" : "border-dashed border-organiser/60 text-organiser")} title="Your key: signs in this browser">
        <KeyRound className="size-3.5" />
      </span>
    </div>
  )
}

export function ProposalCard({ p, placement, onDone, share, open: openDefault = false }: { p: Proposal; placement?: { person: string; city: string } | null; onDone: () => void; share?: string | null; open?: boolean }) {
  const { key } = useOrganiserKey()
  const [busy, setBusy] = useState<null | "approve" | "reject" | "alone">(null)
  const [open, setOpen] = useState(openDefault)
  const r = p.request ?? {}
  const amount = r.amount_cents as number | undefined
  const route = p.decision?.route ?? (p.kind === "claimable" ? "claimable" : "direct")
  const R = ROUTE[route] ?? ROUTE.direct
  const metta = p.extra?.metta
  const quote = p.extra?.quote

  async function approve() {
    if (!key) {
      toast.error("Load your organiser key first. Approving means adding your signature.")
      return
    }
    setBusy("approve")
    try {
      const res = await approveProposal(p.id, key.secret)
      if ((res as { pending?: boolean }).pending) toast(`${title(p)}: Stellar did not answer yet. The signed transaction is saved and will be confirmed by its hash.`)
      else if (res.ok) toast.success(`${title(p)}: settled on Stellar testnet.`, { action: res.receipt_url ? { label: "Receipt", onClick: () => window.open(res.receipt_url, "_blank") } : undefined })
      else toast.warning(`${title(p)} failed: ${res.text ?? res.code}${res.next === "claimable" ? " You can hold the prize for the winner instead." : ""}`)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not approve. Check the connection to Ahadi.")
    } finally {
      setBusy(null)
      onDone()
    }
  }

  async function reject() {
    setBusy("reject")
    try {
      await api(`/api/proposals/${p.id}/reject`, { method: "POST", body: JSON.stringify({ reason: "Rejected by the organiser in the console" }) })
      toast(`${title(p)}: rejected and recorded.`)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not reject.")
    } finally {
      setBusy(null)
      onDone()
    }
  }

  async function alone() {
    setBusy("alone")
    try {
      const res = await api<{ ok: boolean; code: string; text: string }>(`/api/proposals/${p.id}/try-alone`, { method: "POST" })
      if (res.ok) toast.error("Unexpected: the network accepted a single signature.")
      else toast(`Stellar refused Ahadi's key on its own (${res.code}). Nothing moved and no fee was charged.`)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not run the check.")
    } finally {
      setBusy(null)
      onDone()
    }
  }

  return (
    <article className="rounded-2xl border bg-card shadow-xs transition-shadow hover:shadow-sm">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 px-5 py-4">
        <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl bg-paper", R.tone)}>
          <R.icon className="size-5" />
        </span>
        <div className="min-w-[12rem] flex-1">
          <h3 className="font-sans text-base font-semibold tracking-normal">{title(p)}</h3>
          <p className="mt-0.5 text-sm text-ink-2">
            {p.kind === "payout" || p.kind === "claimable"
              ? [placement?.person, placement?.city, r.place ? `place ${r.place}` : null].filter(Boolean).join(", ")
              : p.kind === "rule"
                ? "Fingerprint of the funding rule, before registration opens"
                : "Memo is the October rule's fingerprint"}
          </p>
        </div>
        <div className="text-right">
          {amount !== undefined && <div className="tnum font-display text-xl font-semibold">{usd(amount)}</div>}
          <div className="text-xs text-ink-2">{share ?? R.label}</div>
        </div>
        <SignatureMeter state={busy === "approve" ? "agent" : "waiting"} />
        <div className="flex items-center gap-1.5">
          <button onClick={() => setOpen(!open)} aria-expanded={open} className="rounded-lg px-2.5 py-2 text-sm text-ink-2 hover:bg-paper-2 hover:text-ink">
            {open ? "Hide checks" : "Why yes"}
          </button>
          <button onClick={reject} disabled={!!busy} className="rounded-lg border border-ink/15 bg-card px-3 py-2 text-sm font-medium hover:border-ink/40 disabled:opacity-50">
            {busy === "reject" ? "Rejecting…" : "Reject"}
          </button>
          <button onClick={approve} disabled={!!busy} className="inline-flex items-center gap-2 rounded-lg bg-note px-4 py-2 text-sm font-medium text-white hover:bg-note-ink disabled:opacity-60">
            {busy === "approve" && <Loader2 className="size-4 animate-spin" />}
            {busy === "approve" ? "Signing…" : "Approve and sign"}
          </button>
        </div>
      </div>
      {open && (
        <div className="grid gap-5 border-t bg-paper/50 px-5 py-4 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-3 text-sm">
            <div className={cn("flex items-center gap-2 font-medium", R.tone)}>
              <R.icon className="size-4" />
              {R.label}
            </div>
            {r.recipient && (
              <div className="text-ink-2">
                To <Hash value={r.recipient} href={`https://stellar.expert/explorer/testnet/account/${r.recipient}`} />
              </div>
            )}
            {quote && (
              <div className="rounded-lg bg-carried-soft px-3 py-2.5 text-carried">
                <div className="font-medium">Simulated NEAR Intents dry quote</div>
                <div className="mt-0.5 text-ink-2">
                  {quote.amount_in} USDC on Stellar becomes {quote.amount_out} USDC on {quote.to_chain} in about {quote.eta_seconds} s. No funds move.
                </div>
              </div>
            )}
            {metta && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-agent-soft px-2.5 py-1 text-xs font-medium text-agent">
                <CircleCheck className="size-3.5" /> Decided in MeTTa by Ahadi, confirmed by the bridge
              </div>
            )}
            <button onClick={alone} disabled={!!busy} className="flex items-center gap-1.5 text-sm text-ink-2 underline-offset-4 hover:text-ink hover:underline disabled:opacity-50" title="Submit with only Ahadi's signature to show that Stellar refuses it">
              {busy === "alone" ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />} Show that Ahadi cannot pay alone
            </button>
          </div>
          <ul className="grid grid-cols-1 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-2" aria-label="Checks the rule ran">
            {(p.decision?.checks ?? []).map((c) => (
              <li key={c.name} className="flex items-start gap-1.5" title={c.reason}>
                {c.passed ? <Check className="mt-0.5 size-4 shrink-0 text-note" aria-label="passed" /> : <X className="mt-0.5 size-4 shrink-0 text-failed" aria-label="failed" />}
                <span className="text-ink-2">{CHECK_LABEL[c.name] ?? c.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  )
}
