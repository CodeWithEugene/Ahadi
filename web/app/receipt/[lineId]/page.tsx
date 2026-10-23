import { ExternalLink, Hourglass, MessageSquareQuote } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { Hash } from "@/components/ahadi/hash"
import { Crumbs, LedgerSection, Panel } from "@/components/ahadi/ledger/bits"
import {
  CheckList,
  KeyName,
  type KeyNames,
} from "@/components/ahadi/ledger/chain-check"
import { ProofChain } from "@/components/ahadi/ledger/proof-chain"
import { ReceiptCard } from "@/components/ahadi/ledger/receipt-card"
import { CodeBlock } from "@/components/ahadi/docs/code-block"
import { DerivationTrail } from "@/components/ahadi/ledger/derivation-trail"
import { OfflineState } from "@/components/ahadi/ledger/offline"
import { KIND, KindChip } from "@/components/ahadi/status"
import { ApiError, getEvents, getFund, tryServer } from "@/lib/api"
import { EXPLORER_TX, usd } from "@/lib/format"
import {
  eventIdFor,
  getAccounts,
  getLine,
  headline,
  HORIZON_TX,
  keyNames,
  longDate,
  noteFor,
  type LineDetail,
  type VerifyCheck,
} from "@/lib/ledger-data"
import type { FundView, Line } from "@/lib/types"

export const dynamic = "force-dynamic"

type Props = { params: Promise<{ lineId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lineId } = await params
  const line = await tryServer(() => getLine(lineId))
  return {
    title: line
      ? `Line ${line.seq}: ${KIND[line.kind]?.label ?? line.kind}`
      : "Receipt",
  }
}

export default async function ReceiptPage({ params }: Props) {
  const { lineId } = await params
  let line: LineDetail
  try {
    line = await getLine(lineId)
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound()
    return (
      <div className="ahadi-page py-16">
        <Crumbs
          items={[
            { label: "Public ledger", href: "/funds" },
            { label: "Receipt" },
          ]}
        />
        <OfflineState className="mt-8" />
      </div>
    )
  }
  // Sequential on purpose: the bridge mishandles concurrent reads.
  const fund = await tryServer(() => getFund(line.event_id))
  const accounts = await tryServer(getAccounts)
  const events = (await tryServer(getEvents)) ?? []
  const names = keyNames(accounts)
  const eventName = line.event_name ?? fund?.event.name ?? line.event_id
  const k = KIND[line.kind]
  const note = noteFor(line)
  const partyLabel =
    (line.party && events.find((e) => e.event_id === line.party || e.name === line.party)?.name) ??
    line.party ??
    "Not recorded"
  const request =
    (line.proposal?.request as Record<string, unknown> | undefined) ?? null
  const showRequest = request && line.kind !== "control"
  const keys = {
    agent: accounts?.agent?.public,
    organiser: accounts?.organiser?.public,
  }

  return (
    <>
      <header className="border-b bg-card">
        <div className="ahadi-page pt-8 pb-10 lg:pt-10">
          <Crumbs
            items={[
              { label: "Public ledger", href: "/funds" },
              { label: eventName, href: `/funds/${line.event_id}` },
              { label: `Line ${line.seq}` },
            ]}
          />
          <div className="mx-auto mt-6 flex max-w-4xl flex-col items-center gap-6 text-center">
            <div className="max-w-3xl">
              <h1 className="text-[2.25rem] leading-[1.06] font-semibold sm:text-5xl">
                {headline(line)}
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-ink-2">
                {k?.help}
                {note && line.kind === "attested" ? ` ${note}` : ""}
              </p>
            </div>
            {line.tx_hash && (
              <div className="flex flex-wrap justify-center gap-2 text-sm">
                <a
                  href={EXPLORER_TX + line.tx_hash}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-ink/15 bg-card px-3 py-2 font-medium hover:border-ink/40"
                >
                  stellar.expert{" "}
                  <ExternalLink className="size-3.5" aria-hidden />
                </a>
                <a
                  href={line.horizon_url ?? HORIZON_TX + line.tx_hash}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-ink/15 bg-card px-3 py-2 font-medium hover:border-ink/40"
                >
                  Horizon JSON <ExternalLink className="size-3.5" aria-hidden />
                </a>
                <Link
                  href={`/verify?tx=${line.tx_hash}`}
                  className="inline-flex items-center rounded-lg border border-ink/15 bg-card px-3 py-2 font-medium hover:border-ink/40"
                >
                  Open in Verify
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="ahadi-page grid items-start gap-10 py-10 sm:py-14 xl:grid-cols-[minmax(0,27rem)_minmax(0,1fr)] 2xl:grid-cols-[minmax(0,31rem)_minmax(0,1fr)] 2xl:gap-14">
        <div className="min-w-0 xl:sticky xl:top-24">
          <ReceiptCard
            line={line}
            eventName={eventName}
            partyLabel={partyLabel}
          />
        </div>

        <div className="min-w-0 space-y-14">
          <ProofChain line={line} request={request} keys={keys} />

          <LedgerSection id="context" title="What happened">
            <div className="mt-8 grid items-start gap-6 2xl:grid-cols-2 [&>*:only-child]:2xl:col-span-2">
              <Context line={line} fund={fund} names={names} events={events} />
            </div>
          </LedgerSection>

          {showRequest && (
            <LedgerSection
              id="request"
              title="The request, exactly as signed"
              lede="Sorted keys, no spaces, UTF-8. Its SHA-256 is the request fingerprint, and that fingerprint is the memo on the transaction. Change one character and the chain above breaks."
            >
              <div className="mt-8 grid items-start gap-6 2xl:grid-cols-2">
                <CodeBlock
                  code={JSON.stringify(sortedCopy(request), null, 2)}
                  lang="json"
                  title="request.json"
                  maxHeight="24rem"
                />
                {line.proposal?.decision?.checks &&
                  ["paid", "held", "failed"].includes(line.kind) && (
                    <div className="rounded-2xl border bg-card p-5 sm:p-6">
                      <h3 className="font-sans text-lg font-semibold tracking-normal">
                        Checked before signing
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        The rule&apos;s {line.proposal.decision.checks.length}{" "}
                        checks, run by Ahadi before it added its signature.
                      </p>
                      <CheckList
                        checks={ruleChecks(line.proposal.decision.checks)}
                        className="mt-4"
                      />
                    </div>
                  )}
              </div>
            </LedgerSection>
          )}

          <div className="text-center">
            <Link
              href={`/funds/${line.event_id}#ledger`}
              className="inline-block rounded text-sm font-medium text-note underline-offset-4 hover:underline"
            >
              Back to the {eventName} ledger
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

function sortedCopy(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortedCopy)
  if (v && typeof v === "object")
    return Object.fromEntries(
      Object.keys(v as object)
        .sort()
        .map((k) => [k, sortedCopy((v as Record<string, unknown>)[k])])
    )
  return v
}

function ruleChecks(
  cs: { name: string; passed: boolean; reason: string }[]
): VerifyCheck[] {
  return cs.map((c) => ({
    name: c.name,
    passed: c.passed,
    text: c.reason.charAt(0).toUpperCase() + c.reason.slice(1) + ".",
  }))
}

function Context({
  line,
  fund,
  names,
  events,
}: {
  line: LineDetail
  fund: FundView | null
  names: KeyNames
  events: { event_id: string; name: string }[]
}) {
  const d = line.detail ?? {}
  const derivation = line.derivation ?? fund?.derivation ?? null
  const lines = fund?.lines ?? []
  const byId = (id: string | null | undefined) =>
    id ? lines.find((l) => l.id === id) : undefined

  if (
    (line.kind === "paid" || line.kind === "held" || line.kind === "failed") &&
    derivation
  ) {
    const step =
      (line.proposal?.extra?.derivation_step as string | undefined) ??
      (typeof d.place === "number" ? `place-${d.place}` : null)
    return (
      <>
        {line.kind === "held" && (
          <HeldBox line={line} failed={byId(line.related_line)} />
        )}
        {line.kind === "failed" && (
          <FailedBox
            line={line}
            reroute={lines.find((l) => l.related_line === line.id)}
          />
        )}
        {line.kind === "paid" && d.quote && (
          <Panel className="p-5 sm:p-6">
            <h2 className="font-sans text-lg font-semibold tracking-normal">
              Cross-chain request (simulated)
            </h2>
            <p className="mt-2 text-ink-2">
              The winner asked to receive USDC on {d.quote.to_chain}. Ahadi
              fetched a live dry quote from {d.quote.provider}:{" "}
              {d.quote.amount_in} in, {d.quote.amount_out} out, about{" "}
              {d.quote.eta_seconds} seconds. No funds moved on that leg; the
              prize itself settled on Stellar testnet.
            </p>
          </Panel>
        )}
        <Panel className="p-5 sm:p-6">
          <h2 className="font-sans text-lg font-semibold tracking-normal">
            Where {usd(line.amount_cents)} came from
          </h2>
          <p className="mt-1 mb-5 text-sm text-muted-foreground">
            The amount is the highlighted step of the derivation, worked out in
            MeTTa from the published rule.
          </p>
          <DerivationTrail steps={derivation.steps} highlight={step} />
        </Panel>
      </>
    )
  }

  if (line.kind === "duplicate" || line.kind === "rejected") {
    const original = byId(line.related_line)
    return (
      <Panel className="p-5 sm:p-6">
        <h2 className="font-sans text-lg font-semibold tracking-normal">
          {line.kind === "duplicate"
            ? "Why it was not paid again"
            : "Why the rule refused it"}
        </h2>
        {d.message && (
          <figure className="mt-4 rounded-xl bg-paper-2/70 p-4">
            <MessageSquareQuote
              className="size-4 text-muted-foreground"
              aria-hidden
            />
            <blockquote className="mt-2 text-ink">
              &ldquo;{d.message}&rdquo;
            </blockquote>
            <figcaption className="mt-2 text-sm text-muted-foreground">
              Message received
              {d.source
                ? ` on ${d.source.charAt(0).toUpperCase() + d.source.slice(1)}`
                : ""}
              , treated as data, not as an instruction.
            </figcaption>
          </figure>
        )}
        {line.kind === "duplicate" && original && (
          <div className="mt-4 rounded-xl border p-4">
            <div className="text-sm text-muted-foreground">
              The original payout
            </div>
            <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
              <span className="font-medium">
                Line {original.seq}: {usd(original.amount_cents)} paid to{" "}
                {original.party}
              </span>
              <Link
                href={`/receipt/${original.id}`}
                className="rounded text-sm font-medium text-note underline-offset-4 hover:underline"
              >
                Open the original receipt
              </Link>
            </div>
            {original.tx_hash && (
              <Hash
                value={original.tx_hash}
                href={EXPLORER_TX + original.tx_hash}
                className="mt-2"
              />
            )}
          </div>
        )}
        {Array.isArray(d.checks) && (
          <>
            <h3 className="mt-6 mb-3 font-sans text-sm font-semibold tracking-normal">
              The rule&apos;s checks
            </h3>
            <CheckList checks={ruleChecks(d.checks)} />
          </>
        )}
      </Panel>
    )
  }

  if (line.kind === "control") {
    return (
      <Panel className="p-5 sm:p-6">
        <h2 className="font-sans text-lg font-semibold tracking-normal">
          A deliberate test of the two keys
        </h2>
        <p className="mt-2 leading-relaxed text-ink-2">
          The fund only accepts a payment signed by both Ahadi and the
          organiser. To prove it on the live network, Ahadi submitted a payout
          with its own signature alone. Stellar rejected it with{" "}
          <span className="hash">{d.code ?? "tx_bad_auth"}</span>, no fee was
          charged, and nothing moved.
        </p>
        <p className="mt-3 leading-relaxed text-ink-2">
          The same payout settled moments later, once the organiser had signed
          too.
        </p>
      </Panel>
    )
  }

  if (line.kind === "carried_out" || line.kind === "carried_in") {
    const otherId = line.kind === "carried_out" ? eventIdFor(line.party, events) : d.from_event
    const counterpart = byId(line.related_line)
    return (
      <Panel className="border-carried/25 bg-carried-soft/60 p-5 sm:p-6">
        <h2 className="font-sans text-lg font-semibold tracking-normal">
          {line.kind === "carried_out"
            ? "Where the reserve went"
            : "Where this money came from"}
        </h2>
        <p className="mt-2 leading-relaxed text-ink-2">
          {line.kind === "carried_out"
            ? "The rule says whatever is not awarded moves to the next event. This one transaction moved the whole reserve, signed by both keys, so the next fund starts with it on the record."
            : "This is the reserve the previous event's rule did not award. It arrived in one transaction signed by both keys, and the same receipt appears on both ledgers."}
        </p>
        {d.from_rule_hash && (
          <div className="mt-4 text-sm">
            <div className="text-muted-foreground">
              Rule it was released under
            </div>
            <Hash value={d.from_rule_hash} head={8} tail={6} className="mt-1" />
          </div>
        )}
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {otherId && (
            <Link
              href={`/funds/${otherId}`}
              className="rounded font-medium text-note underline-offset-4 hover:underline"
            >
              Open the {line.kind === "carried_out" ? "next" : "previous"}{" "}
              ledger
            </Link>
          )}
          {counterpart && (
            <Link
              href={`/receipt/${counterpart.id}`}
              className="rounded font-medium text-note underline-offset-4 hover:underline"
            >
              See the matching line
            </Link>
          )}
        </div>
      </Panel>
    )
  }

  if (line.kind === "rule") {
    return (
      <Panel className="p-5 sm:p-6">
        <h2 className="font-sans text-lg font-semibold tracking-normal">
          What was recorded
        </h2>
        <p className="mt-2 leading-relaxed text-ink-2">
          The SHA-256 fingerprint of the funding rule was written to the fund
          account as a data entry
          {d.data_key ? (
            <>
              {" "}
              named <span className="hash">{d.data_key}</span>
            </>
          ) : null}
          , before registration opened. If the rule changed later, its
          fingerprint would no longer match.
        </p>
        {d.rule_hash && (
          <Hash value={d.rule_hash} head={12} tail={10} className="mt-4" />
        )}
        <Link
          href={`/funds/${line.event_id}#rule`}
          className="mt-5 block rounded text-sm font-medium text-note underline-offset-4 hover:underline"
        >
          Read the rule and verify the fingerprint
        </Link>
      </Panel>
    )
  }

  if (line.kind === "attested" && derivation) {
    return (
      <Panel className="p-5 sm:p-6">
        <h2 className="font-sans text-lg font-semibold tracking-normal">
          What the attestation produced
        </h2>
        <p className="mt-1 mb-5 text-sm text-muted-foreground">
          {d.eligible} of {d.target} target teams qualified. Ahadi derived every
          prize from that number.
        </p>
        <DerivationTrail steps={derivation.steps} />
      </Panel>
    )
  }

  if (line.kind === "received") {
    return (
      <Panel className="p-5 sm:p-6">
        <h2 className="font-sans text-lg font-semibold tracking-normal">
          Money into the fund
        </h2>
        <p className="mt-2 leading-relaxed text-ink-2">
          {line.party ?? "A sponsor"} sent {usd(line.amount_cents)} to the fund
          account. From here it can only leave with both signatures.
        </p>
        {line.party_public && (
          <div className="mt-4 text-sm">
            <div className="text-muted-foreground">Sent from</div>
            <div className="mt-1">
              <KeyName value={line.party_public} names={names} />
            </div>
          </div>
        )}
      </Panel>
    )
  }

  return null
}

function HeldBox({ line, failed }: { line: Line; failed?: Line }) {
  const d = line.detail ?? {}
  const expiry = d.claim_expiry
    ? new Date(d.claim_expiry * 1000).toISOString()
    : null
  return (
    <Panel className="border-held/25 bg-held-soft/60 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <Hourglass className="mt-1 size-5 shrink-0 text-held" aria-hidden />
        <div className="min-w-0">
          <h2 className="font-sans text-lg font-semibold tracking-normal">
            {expiry
              ? `Held for ${line.party} until ${longDate(expiry)}`
              : `Held for ${line.party}`}
          </h2>
          <p className="mt-2 leading-relaxed text-ink-2">
            The winner&apos;s wallet could not receive a direct payment, so the
            prize waits on Stellar as a claimable balance only that wallet can
            collect. If it is not claimed in time, it returns to the fund and
            the return goes on this ledger.
          </p>
          {d.balance_id && (
            <div className="mt-4 text-sm">
              <div className="text-muted-foreground">Claimable balance ID</div>
              <Hash value={d.balance_id} head={10} tail={8} className="mt-1" />
            </div>
          )}
          {failed && (
            <Link
              href={`/receipt/${failed.id}`}
              className="mt-4 block rounded text-sm font-medium text-note underline-offset-4 hover:underline"
            >
              See the failed first attempt (line {failed.seq})
            </Link>
          )}
        </div>
      </div>
    </Panel>
  )
}

function FailedBox({ line, reroute }: { line: Line; reroute?: Line }) {
  const d = line.detail ?? {}
  return (
    <Panel className="border-failed/25 bg-failed-soft/60 p-5 sm:p-6">
      <h2 className="font-sans text-lg font-semibold tracking-normal">
        Why it failed
      </h2>
      <p className="mt-2 leading-relaxed text-ink-2">
        {d.text ?? "The network refused the payment."} Stellar answered{" "}
        <span className="hash">{d.code}</span>. Nothing left the fund.
      </p>
      {reroute && (
        <div className="mt-4 rounded-xl border bg-card p-4">
          <div className="text-sm text-muted-foreground">
            What happened next
          </div>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
            <span className="flex items-center gap-2 font-medium">
              <KindChip kind={reroute.kind} /> {usd(reroute.amount_cents)} for{" "}
              {reroute.party}
            </span>
            <Link
              href={`/receipt/${reroute.id}`}
              className="rounded text-sm font-medium text-note underline-offset-4 hover:underline"
            >
              Open line {reroute.seq}
            </Link>
          </div>
        </div>
      )}
    </Panel>
  )
}
