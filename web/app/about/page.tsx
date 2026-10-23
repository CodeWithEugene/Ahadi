import { existsSync } from "node:fs"
import path from "node:path"

import { ArrowUpRight, MapPin, Trophy } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { Lettering, Seal } from "@/components/ahadi/brand"
import { Guilloche } from "@/components/ahadi/guilloche"
import { ExternalLink } from "@/components/ahadi/docs/page-parts"
import { SectionHead } from "@/components/ahadi/home/sections"
import { HERO_PHOTO } from "@/lib/home-hero"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "About",
  description:
    "Ahadi means promise in Kiswahili. Built in Nairobi by Technetians for the BASIX.MARKET AI Omega Agent Dev Buildathon, Track 02: global payouts and prize transparency.",
}

const REPO = "https://github.com/CodeWithEugene/AI-OMEGA-AGENT-DEV-BUILDATHON"

const BUILD: { when: string; title: string; text: string; tone: string }[] = [
  {
    when: "Friday, about 12:30",
    title: "Research",
    text: "Read the brief, chose Track 02, and ran the real Omega loop in Docker to learn its channel, skills and memory.",
    tone: "bg-ink",
  },
  {
    when: "Friday afternoon",
    title: "The vault, proven",
    text: "A 2 of 2 Stellar testnet vault with its own key switched off. One key alone refused; both keys settle.",
    tone: "bg-organiser",
  },
  {
    when: "Friday evening",
    title: "The money gate in Omega",
    text: "The funding rule and the nine checks written in MeTTa as an Omega plugin, with a Python mirror that must agree.",
    tone: "bg-agent",
  },
  {
    when: "Overnight",
    title: "The web app",
    text: "Public ledger, receipts, verification, the organiser console with in-browser signing, and these docs.",
    tone: "bg-note",
  },
  {
    when: "Saturday morning",
    title: "A real language model",
    text: "Omega talking through OpenRouter to GLM 5.3, with every amount still decided by MeTTa.",
    tone: "bg-carried",
  },
  {
    when: "Saturday 15:00",
    title: "The deadline",
    text: "Source, evidence and a live testnet demo, submitted for judging.",
    tone: "bg-held",
  },
]

const ROADMAP: { when: string; items: string[] }[] = [
  {
    when: "Next week",
    items: [
      "The organiser's key in Freighter, the Stellar browser wallet",
      "Notifications to winners in their own language: Kiswahili, Portuguese, Tamil",
    ],
  },
  {
    when: "Next month",
    items: [
      "Real USDC on Stellar mainnet",
      "Refunds with the memo returned",
      "Sponsor specific earmarks",
      "Multi organiser approval, 2 of 3",
    ],
  },
  {
    when: "Next quarter",
    items: [
      "Cash out through a Stellar anchor, Kenya first",
      "Bulk payouts through the Stellar Disbursement Platform",
      "An on chain rule registry on Soroban",
    ],
  },
  {
    when: "Research",
    items: [
      "Rule disputes: a participant contests an eligibility decision and the agent re-derives the outcome with the contested evidence, the pattern Mizani was built on",
    ],
  },
]

const CREDITS: { name: string; what: string; href: string }[] = [
  {
    name: "SingularityNET Omega",
    what: "The agent: loop, MeTTa reasoning, memory and skills. Apache 2.0.",
    href: "https://github.com/singnet/Omega",
  },
  {
    name: "Stellar SDKs",
    what: "stellar-sdk for Python in the bridge; @stellar/stellar-sdk in the organiser's browser.",
    href: "https://developers.stellar.org",
  },
  {
    name: "NEAR Intents",
    what: "The 1Click API, for dry quotes only.",
    href: "https://docs.near-intents.org",
  },
  {
    name: "shadcn/ui",
    what: "Accessible interface primitives.",
    href: "https://ui.shadcn.com",
  },
  {
    name: "Familjen Grotesk, Hanken Grotesk, JetBrains Mono",
    what: "Headings, text and code, through Google Fonts.",
    href: "https://fonts.google.com",
  },
]

export default function AboutPage() {
  const photo =
    HERO_PHOTO && existsSync(path.join(process.cwd(), "public", HERO_PHOTO.src))
      ? HERO_PHOTO
      : null

  return (
    <>
      {/* The name */}
      <section className="relative isolate overflow-hidden border-b bg-card">
        <Guilloche className="pointer-events-none absolute -top-64 left-1/2 -z-10 size-[44rem] -translate-x-1/2 [mask-image:radial-gradient(circle,black_20%,transparent_62%)] opacity-30" />
        <div className="ahadi-page flex flex-col items-center pt-16 pb-16 text-center lg:pt-24 lg:pb-20">
          <div className="flex items-center gap-4 text-ink" aria-label="Ahadi">
            <Seal className="size-16 sm:size-20" />
            <Lettering className="h-10 sm:h-12" />
          </div>
          <h1 className="mt-10 max-w-4xl text-[2.5rem] leading-[1.04] font-semibold sm:text-6xl">
            Ahadi means <span className="text-note">promise</span> in Kiswahili.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-2">
            A prize is a promise made before anyone writes a line of code. Ahadi
            keeps it in public: the rule is published first, every amount
            follows from it, and every dollar leaves a receipt.
          </p>

          <figure className="mt-12 w-full max-w-2xl rounded-2xl border bg-paper/70 px-6 py-6 text-left sm:px-8">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-display text-3xl font-semibold">ahadi</span>
              <span className="text-sm text-muted-foreground">
                Kiswahili, noun
              </span>
            </div>
            <p className="mt-2 text-ink-2">
              A promise; a pledge given to someone.
            </p>
            <blockquote className="mt-5 border-l-2 border-note pl-4">
              <p className="font-display text-xl font-semibold">
                Ahadi ni deni.
              </p>
              <p className="mt-0.5 text-ink-2">
                A promise is a debt. A Swahili proverb, and the whole idea of
                this product.
              </p>
            </blockquote>
          </figure>
        </div>
      </section>

      {/* The builder and the buildathon */}
      <section className="ahadi-page py-20 lg:py-24">
        <SectionHead title="Built in Nairobi, for a user we have been">
          One builder, a two day buildathon, and the problem every multi city
          hackathon meets when it pays its winners.
        </SectionHead>
        <div className="mx-auto mt-14 grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <article className="rounded-2xl border bg-card p-6 sm:p-8">
            <div className="flex items-center gap-4">
              <span
                className="flex size-16 shrink-0 items-center justify-center rounded-full bg-note-soft font-display text-2xl font-semibold text-note-ink"
                aria-hidden
              >
                EM
              </span>
              <div>
                <h3 className="font-display text-2xl font-semibold">
                  Eugene Mutembei
                </h3>
                <div className="text-ink-2">Technetians, a team of one</div>
                <div className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="size-4" aria-hidden /> Nairobi, Kenya
                </div>
              </div>
            </div>
            <div className="mt-6 flex items-start gap-3 rounded-xl bg-organiser-soft/70 p-4">
              <Trophy
                className="mt-0.5 size-5 shrink-0 text-organiser"
                aria-hidden
              />
              <p className="leading-relaxed text-ink-2">
                <strong className="font-semibold text-ink">
                  Mizani, 1st place in BASIX hackathon 1.
                </strong>{" "}
                That event had a USD 1,700 pool sized for 50 teams. Fewer than
                half qualified, six teams won prizes, and USD 1,000 carried
                forward. The October fund in this demo uses exactly those
                numbers.
              </p>
            </div>
            <p className="mt-6 leading-relaxed text-ink-2">
              Mizani was about contestable, rule based decisions with an audit
              trail. Ahadi takes the same habit to money: a rule anyone can
              read, a derivation anyone can follow, and receipts anyone can
              check.
            </p>
          </article>

          <dl className="divide-y self-start rounded-2xl border bg-card">
            <Fact term="Event">BASIX.MARKET AI Omega Agent Dev Buildathon</Fact>
            <Fact term="Dates">23 to 24 October 2026</Fact>
            <Fact term="Track">
              Track 02, global payouts and prize transparency
            </Fact>
            <Fact term="Entry">
              A new build, from idea to working prototype
            </Fact>
            <Fact term="Network">Stellar testnet. No real money moves.</Fact>
            <Fact term="Source">
              <ExternalLink
                href={REPO}
                className="inline-flex items-center gap-1"
              >
                The repository on GitHub
                <ArrowUpRight className="size-4 shrink-0" aria-hidden />
              </ExternalLink>
            </Fact>
          </dl>
        </div>
      </section>

      {/* The build */}
      <section className="border-y bg-card">
        <div className="ahadi-page py-20 lg:py-24">
          <SectionHead title="26 hours, from brief to receipts">
            How the build went, in the order it happened. Times are approximate,
            in Nairobi time.
          </SectionHead>
          <ol className="mx-auto mt-14 grid max-w-6xl gap-0 lg:grid-cols-6">
            {BUILD.map((b, i) => (
              <li
                key={b.title}
                className="relative pb-8 pl-9 last:pb-0 lg:pr-5 lg:pb-0 lg:pl-0"
              >
                {/* track */}
                <span
                  className={cn(
                    "absolute top-1.5 bottom-0 left-[0.5625rem] w-px bg-hair lg:top-[0.5625rem] lg:right-0 lg:bottom-auto lg:left-5 lg:h-px lg:w-auto",
                    i === BUILD.length - 1 && "hidden lg:hidden"
                  )}
                  aria-hidden
                />
                <span
                  className={cn(
                    "absolute top-0.5 left-0 flex size-5 items-center justify-center rounded-full ring-4 ring-card lg:static",
                    b.tone
                  )}
                  aria-hidden
                >
                  <span className="size-1.5 rounded-full bg-white" />
                </span>
                <div className="tnum text-sm text-muted-foreground lg:mt-4">
                  {b.when}
                </div>
                <h3 className="mt-1 font-sans text-base font-semibold tracking-normal">
                  {b.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-2">
                  {b.text}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Roadmap */}
      <section className="ahadi-page py-20 lg:py-24">
        <SectionHead title="What comes next">
          From a testnet prototype to a fund an organiser can run for real.
        </SectionHead>
        <div className="mx-auto mt-14 grid max-w-6xl gap-px overflow-hidden rounded-2xl border bg-hair md:grid-cols-2 xl:grid-cols-4">
          {ROADMAP.map((r, i) => (
            <div key={r.when} className="bg-card p-6">
              <div className="flex items-center gap-2">
                <span
                  className="h-1.5 rounded-full bg-note"
                  style={{
                    width: `${(i + 1) * 0.75}rem`,
                    opacity: r.when === "Research" ? 0.45 : 1,
                  }}
                  aria-hidden
                />
                <h3 className="font-sans text-lg font-semibold tracking-normal">
                  {r.when}
                </h3>
              </div>
              <ul className="mt-4 space-y-2.5">
                {r.items.map((it) => (
                  <li
                    key={it}
                    className="flex gap-2.5 text-[0.9375rem] leading-relaxed text-ink-2"
                  >
                    <span
                      className="mt-2.5 size-1.5 shrink-0 rounded-full bg-ink/30"
                      aria-hidden
                    />
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Credits and AI */}
      <section className="border-t bg-card">
        <div className="ahadi-page py-20 lg:py-24">
          <SectionHead title="Credits and disclosure" />
          <div className="mx-auto mt-12 grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-14">
            <ul className="divide-y self-start rounded-2xl border">
              {CREDITS.map((c) => (
                <li key={c.name}>
                  <a
                    href={c.href}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-start justify-between gap-4 px-5 py-4 transition-colors hover:bg-paper/70"
                  >
                    <div>
                      <div className="font-medium">{c.name}</div>
                      <p className="mt-0.5 text-sm leading-relaxed text-ink-2">
                        {c.what}
                      </p>
                    </div>
                    <ArrowUpRight
                      className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-note"
                      aria-label="Opens in a new tab"
                    />
                  </a>
                </li>
              ))}
              {photo && (
                <li>
                  <a
                    href={photo.href}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-start justify-between gap-4 px-5 py-4 transition-colors hover:bg-paper/70"
                  >
                    <div>
                      <div className="font-medium">Home page photograph</div>
                      <p className="mt-0.5 text-sm leading-relaxed text-ink-2">
                        {photo.credit}, under the Unsplash License.
                      </p>
                    </div>
                    <ArrowUpRight
                      className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-note"
                      aria-label="Opens in a new tab"
                    />
                  </a>
                </li>
              )}
            </ul>
            <div className="space-y-5 leading-relaxed text-ink-2">
              <div>
                <h3 className="font-sans text-lg font-semibold tracking-normal text-ink">
                  Built with AI, and said so
                </h3>
                <p className="mt-2">
                  Ahadi was built with{" "}
                  <strong className="font-semibold text-ink">
                    Claude Code
                  </strong>{" "}
                  by Anthropic, using Claude Opus 5.5, as the buildathon brief
                  allows.
                </p>
              </div>
              <div>
                <h3 className="font-sans text-lg font-semibold tracking-normal text-ink">
                  Sample people only
                </h3>
                <p className="mt-2">
                  Every person, team and sponsor in the demo is fictional. The
                  totals mirror BASIX.MARKET&apos;s public figures for its first
                  hackathon and the track&apos;s example rule.
                </p>
              </div>
              <div>
                <h3 className="font-sans text-lg font-semibold tracking-normal text-ink">
                  Open, and open to scrutiny
                </h3>
                <p className="mt-2">
                  Read the code, run it, and{" "}
                  <ExternalLink href={`${REPO}/blob/main/SECURITY.md`}>
                    tell us privately
                  </ExternalLink>{" "}
                  if you can make it pay without the rule. Start with{" "}
                  <Link
                    href="/trust"
                    className="font-medium text-note underline-offset-4 hover:underline"
                  >
                    Trust and safety
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

function Fact({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 px-5 py-4 sm:grid-cols-[6.5rem_1fr] sm:gap-4">
      <dt className="text-sm text-muted-foreground">{term}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  )
}
