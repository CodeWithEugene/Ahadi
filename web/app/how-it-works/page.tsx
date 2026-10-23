import { CircleCheck, FlaskConical } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { KindChip } from "@/components/ahadi/status"
import { CodeBlock } from "@/components/ahadi/docs/code-block"
import {
  ArchitectureDiagram,
  LifecycleDiagram,
  LifecycleList,
  ScrollFigure,
} from "@/components/ahadi/docs/diagrams"
import { DocNav, type NavGroup } from "@/components/ahadi/docs/doc-nav"
import {
  Callout,
  DataTable,
  DocSection,
  InlineCode,
  PageIntro,
  Prose,
  SubHeading,
} from "@/components/ahadi/docs/page-parts"
import { getFund, tryServer } from "@/lib/api"
import { METTA_DECIDE, METTA_NEXT_STEP, PY_AGREE } from "@/lib/docs-snippets"
import { fingerprintOf } from "@/lib/docs-live"
import { short, usd } from "@/lib/format"

export const metadata: Metadata = {
  title: "How it works",
  description:
    "Ahadi's architecture: an Omega agent whose MeTTa rules decide every amount, a bridge that re-checks before signing, and a 2 of 2 vault on Stellar testnet.",
}

export const dynamic = "force-dynamic"

const NAV: NavGroup[] = [
  {
    title: "How it works",
    items: [
      { id: "architecture", label: "The system at a glance" },
      { id: "who-does-what", label: "Who does what" },
      { id: "money-gate", label: "The money gate" },
      { id: "two-keys", label: "Two keys, one vault" },
      { id: "lifecycle", label: "A request's lifecycle" },
      { id: "idempotency", label: "Paying exactly once" },
      { id: "failures", label: "When the network says no" },
      { id: "memory", label: "What Omega remembers" },
    ],
  },
]

const CHECKS: [string, string][] = [
  ["rule-published", "The rule's hash is recorded on chain."],
  ["rule-version", "The request names that exact rule."],
  ["eligibility-attested", "The organiser has said how many teams qualified."],
  [
    "place-exists",
    "The place is in the rule, and the wallet is the one registered for it.",
  ],
  ["place-amount", "The amount is exactly what the rule gives that place."],
  ["asset", "It pays in the rule's asset."],
  ["budget", "It fits in what is left of the award pool."],
  ["not-duplicate", "This exact request has not been seen before."],
  ["place-unpaid", "Nobody has been paid for this place yet."],
]

const TESTS: { name: string; proves: string; result: string }[] = [
  {
    name: "test_vault_is_two_of_two",
    proves:
      "Read back from Horizon: thresholds 2, 2, 2; the fund's own key weight 0; agent 1; organiser 1.",
    result: "Configured",
  },
  {
    name: "test_agent_alone_cannot_pay",
    proves:
      "A payment signed only by Ahadi is refused, and the vault's sequence number does not move.",
    result: "tx_bad_auth",
  },
  {
    name: "test_organiser_alone_cannot_pay",
    proves: "A payment signed only by the organiser is refused.",
    result: "tx_bad_auth",
  },
  {
    name: "test_disabled_master_cannot_pay",
    proves: "The fund's own key, switched off, cannot pay either.",
    result: "tx_bad_auth",
  },
  {
    name: "test_both_signatures_pay",
    proves:
      "With both signatures the payment settles, both signers are on the envelope, the memo is a hash, and exactly USD 2.50 arrives.",
    result: "Settled",
  },
  {
    name: "test_resubmitting_same_envelope_does_not_double_pay",
    proves:
      "Sending the same signed envelope twice returns the same hash and moves the money once.",
    result: "Paid once",
  },
  {
    name: "test_unactivated_destination_fails_then_claimable_works",
    proves:
      "Paying a wallet that was never activated fails; a claimable balance to the same wallet succeeds.",
    result: "op_no_destination, then held",
  },
]

export default async function HowItWorksPage() {
  const fund = await tryServer(() => getFund("october-2026"))
  const der = fund?.derivation
  const live = fingerprintOf(fund)
  const fp = live
    ? {
        live: true,
        team: live.line.party ?? "a winner",
        json: live.json,
        sha: live.sha,
        requestId: live.line.request_id!,
        tx: live.line.tx_hash!,
      }
    : {
        live: false,
        team: "Team Mvua",
        json: `{"amount_cents":17000,"asset":"USDB","event_id":"october-2026","place":1,"recipient":"GATT7DEYRM2GYSCKBUY4U22GKMS2I7EKWK3F4R356SS2CTXDNWQF4PHR","rule_hash":"4ea80d7c415bf35a0a9e4baa8647e15351bb85e56dece2cbf9273aec20bd9333","team":"Team Mvua"}`,
        sha: "d720ddf847393d19620c790ee822c5be93afb4abf37ae032549f974723516494",
        requestId:
          "d720ddf847393d19620c790ee822c5be93afb4abf37ae032549f974723516494",
        tx: "ab4e8a838e9991733eb4610182bb68707d13c964121e0204b1571a4753f55a76",
      }

  return (
    <>
      <PageIntro title="How Ahadi works">
        <p>
          A language model talks. A rule decides. Two keys sign. This page shows
          each part, where it runs, and the evidence that it behaves the way we
          say it does.
        </p>
      </PageIntro>

      <div className="ahadi-page pb-24 lg:grid lg:grid-cols-[13.5rem_minmax(0,1fr)] lg:gap-12 lg:pt-12 2xl:grid-cols-[15rem_minmax(0,1fr)] 2xl:gap-16">
        <DocNav groups={NAV} />

        <div className="min-w-0 space-y-20 pt-10 lg:pt-0">
          {/* Architecture */}
          <DocSection
            id="architecture"
            title="The system at a glance"
            lede="Four parts, each with one job. The web app shows things. The bridge keeps the ledger and the agent's key. Omega, in its own container, reasons and talks. Stellar testnet holds the money and enforces the signatures."
          >
            <ScrollFigure
              caption="Arrows show who calls whom. The organiser's key never leaves the organiser's browser; the agent's key never leaves the bridge; the Omega container holds no keys."
              minWidth={940}
            >
              <ArchitectureDiagram />
            </ScrollFigure>
            <div className="mt-10 grid max-w-6xl gap-8 md:grid-cols-3">
              <Part title="Omega agent">
                SingularityNET Omega v0.1.20 image with the main branch source
                at commit <InlineCode>63a7826</InlineCode>, running in Docker.
                It talks over Omega&apos;s websocket channel to the bridge. The
                Ahadi plugin adds ten skills and the MeTTa funding rules.
              </Part>
              <Part title="Bridge">
                A FastAPI service. It serves the public API and live stream,
                gives Omega its skill tools, re-checks every decision with a
                Python mirror of the rule, signs with the agent&apos;s key, and
                relays Telegram.
              </Part>
              <Part title="Stellar testnet">
                Each event&apos;s fund is a 2 of 2 vault. Payouts are payments,
                prizes for wallets that cannot receive yet are claimable
                balances, and the rule&apos;s hash sits on the fund as a
                manageData entry.
              </Part>
            </div>
          </DocSection>

          {/* Roles */}
          <DocSection
            id="who-does-what"
            title="Who does what"
            lede="The split that keeps the money safe: language on one side, decisions and signatures on the other."
          >
            <DataTable
              className="mt-6 max-w-6xl"
              minWidth={720}
              head={["Part", "Does", "Never"]}
              colClassName={["w-48 font-medium"]}
              rows={[
                [
                  "The language model, through Omega's provider",
                  "Reads messages, chooses which skill to call next, writes replies and explanations.",
                  "Picks an amount, decides eligibility, or signs.",
                ],
                [
                  "MeTTa rules, in Omega",
                  "Derives every amount, runs the nine checks, chooses the route, decides the next step after a failure.",
                  "Talks to people.",
                ],
                [
                  "Omega memory",
                  "Remembers requests, payouts and failures across sessions and events.",
                  "Overrides the rule or the ledger.",
                ],
                [
                  "Omega skills",
                  "The only way the agent acts: ten ahadi skills that call the bridge.",
                  "Reach a shell, write files or search the web. Those skills are removed.",
                ],
                [
                  "Bridge",
                  "Supplies facts, re-runs the rule in Python, signs with the agent's key only when both agree, submits, keeps the ledger.",
                  "Proposes anything MeTTa refused, or that the two disagree on.",
                ],
                [
                  "Stellar testnet",
                  "Enforces two signatures, records receipts, holds the rule's hash.",
                  "Knows the rule itself. It only sees the hash.",
                ],
                [
                  "Organiser",
                  "Attests who qualified, approves or rejects each payout, signs in the browser.",
                  "Pays alone.",
                ],
              ]}
            />
          </DocSection>

          {/* Money gate */}
          <DocSection
            id="money-gate"
            title="The money gate"
            lede={
              <>
                Every payout, whether Ahadi proposes it or a participant asks
                for it, becomes a set of facts and passes through{" "}
                <InlineCode>ahadi-decide</InlineCode> in MeTTa. Nine checks must
                all pass. Then the bridge runs the same rule in Python and
                compares.
              </>
            }
          >
            <div className="mt-8 grid gap-8 2xl:grid-cols-2 2xl:gap-10">
              <div className="min-w-0">
                <SubHeading>1. MeTTa decides</SubHeading>
                <p className="mt-2 max-w-2xl text-ink-2">
                  The facts arrive from the bridge as one expression. The
                  decision goes back with every check named.
                </p>
                <CodeBlock
                  className="mt-4"
                  code={METTA_DECIDE}
                  lang="metta"
                  title="omega/plugins/ahadi/ahadi.metta"
                />
              </div>
              <div className="min-w-0">
                <SubHeading>2. The bridge must agree</SubHeading>
                <p className="mt-2 max-w-2xl text-ink-2">
                  Same facts, Python mirror of the same rule. A proposal is
                  created only when MeTTa allows it and the two decisions match,
                  route included.
                </p>
                <CodeBlock
                  className="mt-4"
                  code={PY_AGREE}
                  lang="py"
                  title="bridge/ahadi_bridge/main.py, abridged"
                />
                <p className="mt-4 max-w-2xl text-sm text-ink-2">
                  Agreement is not the last word. When the organiser opens a
                  proposal to sign, <InlineCode>prepare</InlineCode> runs the
                  rule again against the facts at that moment and refuses if
                  anything changed.
                </p>
              </div>
            </div>

            <SubHeading className="mt-12">The nine checks</SubHeading>
            <ul className="mt-4 grid max-w-6xl gap-x-8 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
              {CHECKS.map(([name, text]) => (
                <li key={name} className="flex gap-3 border-t pt-3">
                  <CircleCheck
                    className="mt-0.5 size-4 shrink-0 text-note"
                    aria-hidden
                  />
                  <div>
                    <code className="font-mono text-[0.8125rem] font-medium">
                      {name}
                    </code>
                    <p className="text-sm text-ink-2">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-6 max-w-2xl text-ink-2">
              If all pass, the route is{" "}
              <strong className="font-semibold text-ink">direct</strong>, or{" "}
              <strong className="font-semibold text-ink">claimable</strong> when
              the wallet cannot receive yet, or a{" "}
              <strong className="font-semibold text-ink">
                simulated cross-chain
              </strong>{" "}
              leg when the winner asked for another chain.
            </p>

            {der && fund && (
              <div className="mt-10 max-w-6xl overflow-hidden rounded-2xl border bg-card">
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b px-5 py-4">
                  <h3 className="font-sans text-base font-semibold tracking-normal">
                    The October derivation, live from the ledger
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    {der.eligible} of {fund.rule.target_teams} target teams
                    qualified, pool {usd(fund.rule.pool_cents)}
                  </span>
                </div>
                <ol className="divide-y">
                  {der.steps.map((s) => (
                    <li
                      key={s.rule}
                      className="grid gap-1 px-5 py-2.5 sm:grid-cols-[9rem_1fr_auto] sm:items-baseline sm:gap-4"
                    >
                      <code className="font-mono text-xs text-muted-foreground">
                        {s.rule}
                      </code>
                      <span className="text-sm text-ink-2">{s.text}</span>
                      {s.value !== null && s.rule !== "release" && (
                        <span className="tnum text-sm font-semibold sm:text-right">
                          {usd(s.value)}
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <div className="mt-6 max-w-6xl">
              <Callout tone="note" title="Checked in our build today">
                <ul className="list-disc space-y-1 pl-5">
                  <li>
                    The MeTTa derivation of the October award pool, reserve and
                    six prizes matched the bridge.
                  </li>
                  <li>
                    All six MeTTa payout decisions agreed with the bridge.
                  </li>
                  <li>
                    The full scenario ledger balances against the fund&apos;s
                    balance on chain, to the cent.
                  </li>
                </ul>
              </Callout>
            </div>
          </DocSection>

          {/* Two keys */}
          <section
            id="two-keys"
            aria-labelledby="two-keys-title"
            className="scroll-mt-32 lg:scroll-mt-24"
          >
            <div className="overflow-hidden rounded-3xl bg-ink text-paper">
              <div className="grid gap-12 p-6 sm:p-10 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] xl:gap-14 2xl:p-14">
                <div>
                  <h2
                    id="two-keys-title"
                    className="text-2xl font-semibold text-white sm:text-3xl"
                  >
                    Two keys, one vault
                  </h2>
                  <p className="mt-4 max-w-xl leading-relaxed text-white/75">
                    Each event&apos;s fund is a Stellar account set up by{" "}
                    <InlineDark>scripts/setup_testnet.py</InlineDark> in one
                    transaction signed by its own key: add Ahadi and the
                    organiser as signers, then switch the account&apos;s own key
                    off. The script reads the configuration back from Horizon
                    before the fund is used.
                  </p>
                  <VaultCard />
                  <p className="mt-6 max-w-xl text-sm leading-relaxed text-white/60">
                    With every threshold at 2, nothing can happen on the fund,
                    not even changing its signers, without both keys. The
                    October ledger shows it live: a single key line is Ahadi
                    trying to pay with its key alone, refused with{" "}
                    <InlineDark>tx_bad_auth</InlineDark>, no fee charged.
                  </p>
                </div>
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="flex items-center gap-2 font-sans text-lg font-semibold tracking-normal text-white">
                      <FlaskConical
                        className="size-5 text-white/60"
                        aria-hidden
                      />
                      Tested on the live testnet
                    </h3>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#4cc38a]/15 px-3 py-1 text-sm font-medium text-[#7fe0b0]">
                      <CircleCheck className="size-4" aria-hidden /> 7 of 7
                      passed
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-white/60">
                    Each run builds a throwaway vault with Friendbot, configured
                    exactly like the real funds. Source:{" "}
                    <InlineDark>bridge/tests/test_chain_vault.py</InlineDark>,
                    run with <InlineDark>uv run pytest -m chain</InlineDark>.
                  </p>
                  <ol className="mt-5 divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                    {TESTS.map((t) => (
                      <li
                        key={t.name}
                        className="grid gap-1.5 px-4 py-3.5 sm:grid-cols-[1fr_auto] sm:gap-4"
                      >
                        <div className="min-w-0">
                          <code className="font-mono text-xs break-all text-white/85">
                            {t.name}
                          </code>
                          <p className="mt-1 text-sm leading-relaxed text-white/65">
                            {t.proves}
                          </p>
                        </div>
                        <span className="self-start rounded-md bg-white/[0.06] px-2 py-1 font-mono text-[0.6875rem] whitespace-nowrap text-white/80">
                          {t.result}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          </section>

          {/* Lifecycle */}
          <DocSection
            id="lifecycle"
            title="A request's lifecycle"
            lede="Every request ends on the ledger, whether it was paid, held, refused, rejected or recognised as a duplicate. The transaction is built and signed only when the organiser is ready, so a waiting proposal never expires."
          >
            <div className="hidden md:block">
              <ScrollFigure
                caption="Coloured states end as ledger lines. A rerouted prize goes through the same two signatures as any payout."
                minWidth={900}
              >
                <LifecycleDiagram />
              </ScrollFigure>
            </div>
            <div className="md:hidden">
              <LifecycleList />
            </div>
          </DocSection>

          {/* Idempotency */}
          <DocSection
            id="idempotency"
            title="Paying exactly once"
            lede="A payment system's worst bug is paying twice. Ahadi closes that door four times."
          >
            <div className="mt-8 grid gap-10 2xl:grid-cols-2 2xl:gap-10">
              <ol className="max-w-2xl space-y-6">
                <Point n={1} title="A fingerprint for every request">
                  The request (event, rule hash, place, team, recipient, asset,
                  amount in cents) is written as canonical JSON, keys sorted, no
                  spaces, and hashed with SHA-256. Same request, same id.
                </Point>
                <Point n={2} title="The fingerprint travels with the money">
                  It is the transaction&apos;s hash memo, so the chain itself
                  can be searched for it, and anyone can match a receipt to its
                  ledger line.
                </Point>
                <Point n={3} title="The rule refuses repeats">
                  <InlineCode>not-duplicate</InlineCode> fails when the id
                  already has a ledger line or a live proposal. A repeat becomes
                  a duplicate line that points to the original receipt.
                </Point>
                <Point
                  n={4}
                  title="The signed transaction is stored before it is sent"
                >
                  If the answer is lost, the bridge looks the hash up on Horizon
                  instead of signing something new. Resubmitting the same
                  envelope is safe: Horizon returns the original result, and the
                  money moves once. A testnet test proves it.
                </Point>
              </ol>
              <div className="min-w-0 space-y-4">
                <CodeBlock
                  code={fp.json}
                  lang="json"
                  title={
                    fp.live
                      ? `Canonical request for ${fp.team}, rebuilt from the public ledger`
                      : "Canonical request, October place 1 (captured 23 October)"
                  }
                  wrap
                />
                <CodeBlock
                  code={`sha256 of the request, computed for this page\n${fp.sha}\n\nrequest id in the ledger, and memo on transaction ${short(fp.tx, 8, 4)}\n${fp.requestId}`}
                  lang="text"
                  title={
                    fp.sha === fp.requestId
                      ? "They match"
                      : "Request id and the memo on chain"
                  }
                  wrap
                  footer={
                    <>
                      Check the memo on chain yourself:{" "}
                      <Link
                        href={`/verify?tx=${fp.tx}`}
                        className="text-white/80 underline underline-offset-4 hover:text-white"
                      >
                        verify the transaction
                      </Link>
                    </>
                  }
                />
              </div>
            </div>
          </DocSection>

          {/* Failures */}
          <DocSection
            id="failures"
            title="When the network says no"
            lede="A refusal from Stellar is never an error to hide. It becomes a failed line in plain words, nothing moves, and MeTTa decides the next step."
          >
            <DataTable
              className="mt-6 max-w-6xl"
              minWidth={760}
              head={["Result code", "In plain words", "What Ahadi does"]}
              colClassName={["w-44"]}
              rows={[
                [
                  <code key="c" className="font-mono text-[0.8125rem]">
                    op_no_destination
                  </code>,
                  "This wallet has never been activated on the network.",
                  <Response key="r" kinds={["failed", "held"]}>
                    Records the failure, then proposes holding the prize as a
                    claimable balance for 30 days. It returns to the fund if
                    unclaimed.
                  </Response>,
                ],
                [
                  <code key="c" className="font-mono text-[0.8125rem]">
                    op_no_trust
                  </code>,
                  "This wallet cannot hold the prize asset yet.",
                  <Response key="r" kinds={["failed", "held"]}>
                    Same as above: the prize is held until the winner can
                    receive it.
                  </Response>,
                ],
                [
                  <code key="c" className="font-mono text-[0.8125rem]">
                    tx_bad_auth
                  </code>,
                  "Only one of the two required signatures was present.",
                  <Response key="r" kinds={["control"]}>
                    Expected in the single key demonstration. Nothing moves and
                    no fee is charged. The approve step also refuses to submit
                    without both signatures.
                  </Response>,
                ],
                [
                  <code key="c" className="font-mono text-[0.8125rem]">
                    tx_too_late
                  </code>,
                  "The approval came after the time limit on this transaction.",
                  <Response key="r" kinds={["failed"]}>
                    MeTTa&apos;s next step is to propose again. Transactions
                    carry a 15 minute time bound and are built only when the
                    organiser prepares to sign.
                  </Response>,
                ],
                [
                  <code key="c" className="font-mono text-[0.8125rem]">
                    tx_bad_seq
                  </code>,
                  "The fund's transaction sequence moved on; this transaction is out of date.",
                  <Response key="r" kinds={["failed"]}>
                    Propose again. Building at prepare time keeps waiting
                    proposals from colliding on the sequence number.
                  </Response>,
                ],
              ]}
            />
            <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:items-start">
              <Prose>
                <p>
                  The next step after a failure is a MeTTa rule too.{" "}
                  <InlineCode>ahadi-reroute</InlineCode> reads the
                  proposal&apos;s result code and asks{" "}
                  <InlineCode>ahadi-next-step</InlineCode>; only an answer of{" "}
                  <InlineCode>claimable</InlineCode> leads to a held prize. The
                  bridge enforces the same table before it builds anything.
                </p>
                <p>
                  In the October run, Arjun&apos;s wallet in Chennai had never
                  been activated. His USD 108.80 failed with{" "}
                  <InlineCode>op_no_destination</InlineCode>, then settled as a
                  held prize. Both lines are on the public ledger.
                </p>
              </Prose>
              <CodeBlock
                code={METTA_NEXT_STEP}
                lang="metta"
                title="omega/plugins/ahadi/ahadi.metta"
              />
            </div>
          </DocSection>

          {/* Memory */}
          <DocSection
            id="memory"
            title="What Omega remembers"
            lede="Memory is for recall and explanation. The ledger and the chain are the truth, and the rule checks them, not memory."
          >
            <div className="mt-8 grid max-w-6xl gap-px overflow-hidden rounded-2xl border bg-hair md:grid-cols-3">
              <MemoryCell
                title="Long-term memory"
                where="Omega's remember and query skills, stored in ChromaDB on the memory volume"
              >
                After each money action the agent stores a one line fact, such
                as{" "}
                <span className="font-mono text-[0.8125rem] text-ink">
                  PAID october-2026 place 2 Team Alfama USD 136.00 receipt …
                </span>
              </MemoryCell>
              <MemoryCell
                title="Episodic history"
                where="history.metta on the same volume"
              >
                A timestamped trail of every message the agent received and
                every skill it called. The console&apos;s agent view reads it.
              </MemoryCell>
              <MemoryCell
                title="Money state"
                where="The bridge's SQLite ledger and Stellar testnet"
              >
                What was paid, held, refused and carried forward. Duplicate
                checks run here, deterministically.
              </MemoryCell>
            </div>
            <Prose className="mt-8">
              <p>
                <strong>A fresh session still remembers.</strong> Restarting the
                Omega container clears the conversation, but the memory volume
                persists. The bridge does not replay old conversations to a
                fresh Omega process, so anything the agent recalls about an
                earlier event comes from its own long-term memory, confirmed
                against the ledger with <InlineCode>ahadi-status</InlineCode>.
              </p>
              <p>
                You can read exactly what Ahadi remembers at any time:{" "}
                <Link
                  href="/console/agent"
                  className="font-medium text-note underline-offset-4 hover:underline"
                >
                  What Ahadi knows
                </Link>
                , or{" "}
                <Link
                  href="/developers#memory"
                  className="font-medium text-note underline-offset-4 hover:underline"
                >
                  GET /api/agent/memory
                </Link>
                .
              </p>
            </Prose>
          </DocSection>
        </div>
      </div>
    </>
  )
}

function Part({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="border-t-2 border-ink/80 pt-4">
      <h3 className="font-sans text-lg font-semibold tracking-normal">
        {title}
      </h3>
      <p className="mt-2 leading-relaxed text-ink-2">{children}</p>
    </div>
  )
}

function Point({
  n,
  title,
  children,
}: {
  n: number
  title: string
  children: React.ReactNode
}) {
  return (
    <li className="flex gap-4">
      <span className="tnum flex size-8 shrink-0 items-center justify-center rounded-full border border-note/30 font-display text-sm font-semibold text-note">
        {n}
      </span>
      <div>
        <h3 className="font-sans text-base font-semibold tracking-normal">
          {title}
        </h3>
        <p className="mt-1 leading-relaxed text-ink-2">{children}</p>
      </div>
    </li>
  )
}

function Response({
  kinds,
  children,
}: {
  kinds: ("failed" | "held" | "control")[]
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {kinds.map((k) => (
          <KindChip key={k} kind={k} />
        ))}
      </div>
      <p>{children}</p>
    </div>
  )
}

function MemoryCell({
  title,
  where,
  children,
}: {
  title: string
  where: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-card p-5">
      <h3 className="font-sans text-base font-semibold tracking-normal">
        {title}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">{where}</p>
      <p className="mt-3 text-sm leading-relaxed text-ink-2">{children}</p>
    </div>
  )
}

function InlineDark({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[0.8125em] whitespace-nowrap text-white/90">
      {children}
    </code>
  )
}

function VaultCard() {
  const signers = [
    {
      name: "Ahadi's key",
      note: "Lives in the bridge. Signs only what the rule allows.",
      weight: 1,
      color: "var(--agent)",
    },
    {
      name: "Organiser's key",
      note: "Lives in the organiser's browser.",
      weight: 1,
      color: "#e0a35c",
    },
    {
      name: "The fund's own key",
      note: "Switched off at setup.",
      weight: 0,
      color: "rgb(255 255 255 / 0.35)",
    },
  ]
  return (
    <div
      className="mt-7 rounded-2xl border border-white/10 bg-white/[0.03] p-5"
      role="group"
      aria-label="Vault configuration"
    >
      <div className="text-sm text-white/60">Signers and weights</div>
      <ul className="mt-3 space-y-2">
        {signers.map((s) => (
          <li
            key={s.name}
            className="flex items-center justify-between gap-4 rounded-xl bg-white/[0.04] px-4 py-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="size-3 shrink-0 rounded-full"
                style={{ background: s.color }}
                aria-hidden
              />
              <div className="min-w-0">
                <div className="font-medium text-white">{s.name}</div>
                <div className="text-sm text-white/55">{s.note}</div>
              </div>
            </div>
            <span className="tnum shrink-0 text-white/80">
              weight {s.weight}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-5 text-sm text-white/60">
        Thresholds: weight needed for each kind of operation
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          ["Low", "e.g. bump sequence"],
          ["Medium", "payments, claimable balances, data"],
          ["High", "signers and thresholds"],
        ].map(([l, n]) => (
          <div key={l} className="rounded-xl bg-white/[0.04] px-3 py-3">
            <div className="tnum font-display text-xl font-semibold text-white">
              2
            </div>
            <div className="text-sm text-white/80">{l}</div>
            <div className="mt-1 text-xs leading-snug text-white/50">{n}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
