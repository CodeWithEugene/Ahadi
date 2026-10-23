import type { Metadata } from "next"
import Link from "next/link"

import { CodeBlock } from "@/components/ahadi/docs/code-block"
import {
  DocNav,
  MethodTag,
  type NavGroup,
} from "@/components/ahadi/docs/doc-nav"
import { AccessChip, EndpointBlock } from "@/components/ahadi/docs/endpoint"
import { EndpointExample } from "@/components/ahadi/docs/endpoint-example"
import {
  Callout,
  DataTable,
  DocSection,
  InlineCode,
  PageIntro,
  Prose,
  SubHeading,
} from "@/components/ahadi/docs/page-parts"
import { getFund, getProposals, tryServer } from "@/lib/api"
import {
  GROUPS as BASE_GROUPS,
  withLiveIds,
  SKILLS,
  STREAM,
  STREAM_KINDS,
  TOOL_CURL,
  TOOL_EXAMPLE,
  TOOLS,
} from "@/lib/docs-api"
import { METTA_DECIDE, TS_STREAM, TS_VERIFY } from "@/lib/docs-snippets"

export const metadata: Metadata = {
  title: "Developers",
  description:
    "The Ahadi API: public reads for funds, ledgers and receipts, the organiser's approval flow, a live event stream, and the Omega skills behind them.",
}

const ERRORS = `// An engine error: a stable code plus a plain sentence
HTTP 404  {"error": "not_found", "detail": "unknown event nope"}
HTTP 409  {"error": "bad_state", "detail": "proposal is settled"}
HTTP 400  {"error": "duplicate", "detail": "eligibility for this event is already attested"}

// A request the framework rejects before it reaches the engine: detail only
HTTP 400  {"detail": "a Stellar transaction hash is 64 hexadecimal characters"}
HTTP 401  {"detail": "console passcode required"}
HTTP 422  {"detail": [{"type": "greater_than_equal", "loc": ["body", "eligible"], ...}]}`

const NAV: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { id: "introduction", label: "Introduction" },
      { id: "authentication", label: "Access and authentication" },
      { id: "errors", label: "Errors" },
    ],
  },
  ...BASE_GROUPS.map((g) => ({
    title: g.title,
    items: g.endpoints.map((e) => ({
      id: e.id,
      label: e.title,
      method: e.method,
    })),
  })),
  {
    title: "Live stream",
    items: [
      { id: "stream", label: "Subscribe to everything", method: "SSE" },
      { id: "event-kinds", label: "Event kinds" },
    ],
  },
  {
    title: "Omega",
    items: [
      { id: "tools", label: "Skill tools" },
      { id: "skills", label: "The Omega skills" },
    ],
  },
  {
    title: "Guides",
    items: [{ id: "integrate", label: "Integrate in an afternoon" }],
  },
]

export const dynamic = "force-dynamic"

export default async function DevelopersPage() {
  const [fund, proposals] = await Promise.all([
    tryServer(() => getFund("october-2026")),
    tryServer(() => getProposals("october-2026")),
  ])
  const paid = fund?.lines.find((l) => l.kind === "paid" && l.tx_hash)
  const prop =
    proposals?.find((p) => p.status === "failed") ??
    proposals?.find((p) => p.kind === "payout") ??
    proposals?.[0]
  const GROUPS = withLiveIds(BASE_GROUPS, {
    lineId: paid?.id,
    txHash: paid?.tx_hash ?? undefined,
    proposalId: prop?.id,
  })
  return (
    <>
      <PageIntro title="Build on Ahadi">
        <p>
          A small, public REST API for prize funds on Stellar testnet: every
          fund, ledger line and receipt, the organiser&apos;s two signature
          approval flow, and a live stream of everything the Omega agent does.
        </p>
      </PageIntro>

      <div className="ahadi-page pb-24 lg:grid lg:grid-cols-[13.5rem_minmax(0,1fr)] lg:gap-12 lg:pt-12 2xl:grid-cols-[15rem_minmax(0,1fr)] 2xl:gap-16">
        <DocNav groups={NAV} />

        <div className="min-w-0 space-y-16 pt-10 lg:pt-0">
          <DocSection id="introduction" title="Introduction">
            <Prose className="mt-4">
              <p>
                The API is served by the Ahadi bridge, a FastAPI service. This
                site proxies it at <InlineCode>/api</InlineCode>, so every
                example below works from the browser on this origin. Locally the
                bridge runs at <InlineCode>http://127.0.0.1:8000</InlineCode>,
                with an OpenAPI description at{" "}
                <InlineCode>/api/openapi.json</InlineCode> and interactive docs
                at <InlineCode>/api/docs</InlineCode>.
              </p>
            </Prose>
            <dl className="mt-6 grid max-w-4xl gap-px overflow-hidden rounded-xl border bg-hair sm:grid-cols-2">
              <Fact
                term="Base URL"
                desc={
                  <>
                    <InlineCode>/api</InlineCode> on this site. The examples use{" "}
                    <InlineCode>$AHADI</InlineCode> for your origin.
                  </>
                }
              />
              <Fact
                term="Format"
                desc="JSON in and out. The ledger is also exported as CSV."
              />
              <Fact
                term="Money"
                desc={
                  <>
                    Integer cents of the demo asset USDB, for example{" "}
                    <InlineCode>17000</InlineCode> is USD 170.00. Never floats.
                  </>
                }
              />
              <Fact
                term="Network"
                desc="Stellar testnet only. The bridge refuses to start against any other Horizon. No real money moves."
              />
            </dl>
          </DocSection>

          <DocSection
            id="authentication"
            title="Access and authentication"
            lede="There are no user accounts. Access depends on what an endpoint can change."
          >
            <DataTable
              className="mt-6 max-w-5xl"
              minWidth={560}
              head={["Access", "Who", "How"]}
              rows={[
                [
                  <AccessChip key="p" access="public" />,
                  "Anyone: participants, sponsors, judges, your app",
                  "Nothing to send. Every read under /api is public.",
                ],
                [
                  <AccessChip key="c" access="console" />,
                  "The organiser's console",
                  <>
                    Writes send an <InlineCode>x-ahadi-passcode</InlineCode>{" "}
                    header. A demo passcode stands in for real accounts. Any
                    money movement still needs the organiser&apos;s own
                    signature, made in their browser.
                  </>,
                ],
                [
                  <AccessChip key="t" access="tool" />,
                  "The Omega agent's skills",
                  <>
                    <InlineCode>/tools/*</InlineCode> on the internal Docker
                    network, with an{" "}
                    <InlineCode>x-ahadi-tool-secret</InlineCode> header.
                  </>,
                ],
              ]}
            />
          </DocSection>

          <DocSection
            id="errors"
            title="Errors"
            lede={
              <>
                Errors from Ahadi&apos;s engine carry a stable{" "}
                <InlineCode>error</InlineCode> code and a plain sentence in{" "}
                <InlineCode>detail</InlineCode>. Validation and access errors
                raised before the engine carry <InlineCode>detail</InlineCode>{" "}
                only, so read <InlineCode>detail</InlineCode> first.
              </>
            }
          >
            <CodeBlock
              className="mt-6 max-w-5xl"
              code={ERRORS}
              lang="ts"
              title="Captured from the bridge"
            />
            <DataTable
              className="mt-6 max-w-5xl"
              minWidth={520}
              head={["Status", "Meaning"]}
              colClassName={["w-28 tnum"]}
              rows={[
                [
                  "400",
                  "The request is malformed, or it repeats something already done (error duplicate).",
                ],
                [
                  "401",
                  "The console passcode or the tool secret is missing or wrong.",
                ],
                ["404", "Unknown event, line or proposal."],
                [
                  "409",
                  "The action does not fit the current state, for example approving a proposal that was never prepared, or the rule no longer allows the payout.",
                ],
                ["422", "A body field failed validation."],
                [
                  "502",
                  "Stellar refused a deposit. Payout failures are not errors: they return ok false and go on the ledger.",
                ],
              ]}
            />
          </DocSection>

          {GROUPS.map((g) => (
            <DocSection key={g.id} id={g.id} title={g.title} lede={g.lede}>
              {g.id === "proposals" && <ApprovalFlow />}
              <div className="mt-8 space-y-12">
                {g.endpoints.map((e) => (
                  <EndpointBlock key={e.id} e={e} />
                ))}
              </div>
            </DocSection>
          ))}

          <DocSection
            id="live-stream"
            title="Live stream"
            lede="One connection gives you every ledger line, proposal, signature, rule decision and Omega log event the moment it happens."
          >
            <div className="mt-8 space-y-12">
              <EndpointBlock e={STREAM} />
              <div
                id="event-kinds"
                className="scroll-mt-32 border-t pt-10 lg:scroll-mt-24"
              >
                <SubHeading>Event kinds</SubHeading>
                <p className="mt-3 max-w-2xl leading-relaxed text-ink-2">
                  Every event has <InlineCode>id</InlineCode>,{" "}
                  <InlineCode>kind</InlineCode> and <InlineCode>at</InlineCode>{" "}
                  (UTC, ISO 8601). The other fields depend on the kind.
                </p>
                <DataTable
                  className="mt-5 max-w-6xl"
                  minWidth={640}
                  head={["Kind", "Fields", "When it fires"]}
                  colClassName={["w-36", "w-56"]}
                  rows={STREAM_KINDS.map((k) => [
                    <code
                      key="k"
                      className="font-mono text-[0.8125rem] font-medium"
                    >
                      {k.kind}
                    </code>,
                    <span key="f" className="font-mono text-xs leading-relaxed">
                      {k.fields}
                    </span>,
                    k.text,
                  ])}
                />
              </div>
            </div>
          </DocSection>

          <DocSection
            id="tools"
            title="Omega skill tools"
            lede={
              <>
                The Omega agent reaches the world only through these endpoints.
                Its Python glue calls them with MeTTa&apos;s inputs and outputs.
                They are internal: not proxied by this site, and refused without
                the shared secret. They are documented here so you can see
                exactly what the agent can and cannot do.
              </>
            }
          >
            <div className="mt-6 grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] 2xl:items-start [&>*]:min-w-0">
              <DataTable
                minWidth={640}
                head={["Endpoint", "Called by", "Body", "Returns"]}
                rows={TOOLS.map((t) => [
                  <span
                    key="p"
                    className="inline-flex items-center gap-2 whitespace-nowrap"
                  >
                    <MethodTag method="POST" small />
                    <code className="font-mono text-[0.8125rem]">{t.path}</code>
                  </span>,
                  <code key="s" className="font-mono text-xs">
                    {t.skill}
                  </code>,
                  <span key="b" className="text-[0.8125rem]">
                    {t.body}
                  </span>,
                  <span key="r" className="text-[0.8125rem]">
                    {t.returns}
                  </span>,
                ])}
              />
              <div className="2xl:sticky 2xl:top-24">
                <EndpointExample
                  curl={TOOL_CURL}
                  example={TOOL_EXAMPLE}
                  exampleLabel="Captured response"
                  note="The facts for place 2 after it was paid: the ninth value, seen, is 1, so ahadi-decide refuses a second payout."
                />
              </div>
            </div>
          </DocSection>

          <DocSection
            id="skills"
            title="The Omega skills"
            lede="Ahadi adds ten skills to Omega and removes the ones a payout agent should not have (shell, file writing, web search). The language model chooses which skill to call; the skill's MeTTa decides."
          >
            <div className="mt-6 grid gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] xl:gap-10 2xl:gap-14">
              <ul className="divide-y self-start rounded-xl border bg-card">
                {SKILLS.map((s) => (
                  <li
                    key={s.name}
                    className="grid gap-1.5 px-4 py-4 sm:grid-cols-[13rem_1fr] sm:gap-6 sm:px-5 xl:grid-cols-1 xl:gap-1.5 2xl:grid-cols-[13rem_1fr] 2xl:gap-6"
                  >
                    <div className="min-w-0">
                      <code className="font-mono text-[0.8125rem] font-semibold text-ink">
                        {s.name}
                      </code>
                      <div className="mt-0.5 font-mono text-xs break-words text-muted-foreground">
                        {s.args}
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed text-ink-2">
                      {s.text}
                    </p>
                  </li>
                ))}
              </ul>
              <div className="min-w-0 xl:sticky xl:top-24 xl:self-start">
                <SubHeading>The money gate, in MeTTa</SubHeading>
                <p className="mt-3 max-w-2xl leading-relaxed text-ink-2">
                  Every payout request becomes a fact expression and goes
                  through <InlineCode>ahadi-decide</InlineCode>. Nine checks
                  must all pass. Only then is a route chosen. The bridge runs a
                  Python mirror of the same rule and proposes nothing unless
                  both agree.{" "}
                  <Link
                    href="/how-it-works#money-gate"
                    className="font-medium text-note underline-offset-4 hover:underline"
                  >
                    How the agreement check works
                  </Link>
                </p>
                <CodeBlock
                  className="mt-5"
                  code={METTA_DECIDE}
                  lang="metta"
                  title="omega/plugins/ahadi/ahadi.metta"
                />
              </div>
            </div>
          </DocSection>

          <DocSection
            id="integrate"
            title="Integrate in an afternoon"
            lede="Two small pieces cover most integrations: show the ledger live, and check a receipt."
          >
            <div className="mt-8 grid gap-10 xl:grid-cols-2 xl:gap-10 2xl:gap-14">
              <div className="min-w-0">
                <SubHeading>Show ledger lines as they happen</SubHeading>
                <p className="mt-2 max-w-2xl leading-relaxed text-ink-2">
                  Subscribe once, keep the last id you saw, and resume from it
                  after a reload. The bridge replays anything you missed.
                </p>
                <CodeBlock
                  className="mt-4"
                  code={TS_STREAM}
                  lang="ts"
                  title="ledger-feed.ts"
                />
              </div>
              <div className="min-w-0">
                <SubHeading>Verify a receipt</SubHeading>
                <p className="mt-2 max-w-2xl leading-relaxed text-ink-2">
                  A receipt is good when the transaction is on testnet, its memo
                  equals the request fingerprint in the ledger, and both keys
                  signed it.
                </p>
                <CodeBlock
                  className="mt-4"
                  code={TS_VERIFY}
                  lang="ts"
                  title="verify-receipt.ts"
                />
              </div>
            </div>
            <div className="mt-8 max-w-3xl">
              <Callout tone="quiet" title="Prefer to look by hand?">
                Paste any transaction hash into{" "}
                <Link
                  href="/verify"
                  className="font-medium text-note underline-offset-4 hover:underline"
                >
                  Verify a receipt
                </Link>
                , or open it on stellar.expert. The same checks run in both
                places.
              </Callout>
            </div>
          </DocSection>
        </div>
      </div>
    </>
  )
}

function Fact({ term, desc }: { term: string; desc: React.ReactNode }) {
  return (
    <div className="bg-card px-5 py-4">
      <dt className="text-sm font-semibold">{term}</dt>
      <dd className="mt-1 text-sm leading-relaxed text-ink-2">{desc}</dd>
    </div>
  )
}

function ApprovalFlow() {
  const steps = [
    {
      who: "Ahadi",
      tone: "text-agent",
      title: "Proposes",
      text: "A skill call creates a proposal only if MeTTa and the bridge both allow it.",
    },
    {
      who: "Agent key",
      tone: "text-agent",
      title: "prepare",
      text: "The bridge re-checks the rule, builds the transaction and signs it with the agent's key.",
    },
    {
      who: "Organiser key",
      tone: "text-organiser",
      title: "Signs in the browser",
      text: "The organiser's key adds the second signature locally. It never reaches a server.",
    },
    {
      who: "Bridge",
      tone: "text-note",
      title: "approve",
      text: "Same transaction, both signatures: the signed XDR is stored, then submitted to Stellar.",
    },
  ]
  return (
    <ol className="mt-6 grid gap-px overflow-hidden rounded-xl border bg-hair sm:grid-cols-2 xl:grid-cols-4">
      {steps.map((s, i) => (
        <li key={s.title} className="bg-card px-5 py-4">
          <div className="flex items-center gap-2 text-xs">
            <span className="tnum flex size-5 items-center justify-center rounded-full border border-note/30 font-semibold text-note">
              {i + 1}
            </span>
            <span className={`font-medium ${s.tone}`}>{s.who}</span>
          </div>
          <div className="mt-2 font-semibold">
            {s.title === "prepare" || s.title === "approve" ? (
              <code className="font-mono text-[0.875rem]">{s.title}</code>
            ) : (
              s.title
            )}
          </div>
          <p className="mt-1 text-sm leading-relaxed text-ink-2">{s.text}</p>
        </li>
      ))}
    </ol>
  )
}
