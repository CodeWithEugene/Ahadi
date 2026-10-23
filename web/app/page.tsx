import { existsSync } from "node:fs"
import path from "node:path"

import Image from "next/image"
import Link from "next/link"

import { GuillocheOrbit } from "@/components/ahadi/guilloche"

import { PayoutFlow } from "@/components/ahadi/home/payout-flow"
import {
  ArchitectureStrip,
  AudienceSection,
  CasesSection,
  LedgerSection,
  MoneyGateSection,
  ProblemSection,
  ProofBand,
  VaultSection,
} from "@/components/ahadi/home/sections"
import { getFund, tryServer } from "@/lib/api"
import { fingerprintOf } from "@/lib/docs-live"
import { HERO_PHOTO } from "@/lib/home-hero"
import { homeData } from "@/lib/home-data"

export const dynamic = "force-dynamic"

export default async function Home() {
  const fund = await tryServer(() => getFund("october-2026"))
  const data = homeData(fund)
  const fp = fingerprintOf(fund)
  const photo =
    HERO_PHOTO && existsSync(path.join(process.cwd(), "public", HERO_PHOTO.src))
      ? HERO_PHOTO
      : null

  return (
    <>
      {/* Hero: the promise, then one real payout followed end to end */}
      <section className="relative isolate overflow-hidden border-b bg-paper">
        {photo ? (
          <>
            <Image
              src={`/${photo.src}`}
              alt=""
              fill
              priority
              sizes="100vw"
              className="-z-20 object-cover"
            />
            <div
              className="absolute inset-0 -z-10 bg-gradient-to-b from-paper/85 via-paper/90 to-paper"
              aria-hidden
            />
          </>
        ) : null}
        <div className="ahadi-page relative isolate pt-16 pb-12 text-center lg:pt-24">
          <GuillocheOrbit className="pointer-events-none absolute top-1/2 left-1/2 -z-10 size-[30rem] -translate-x-1/2 -translate-y-1/2 [mask-image:radial-gradient(circle,transparent_18%,black_42%,black_58%,transparent_72%)] opacity-50 sm:size-[44rem] lg:size-[52rem]" />
          <h1 className="mx-auto max-w-4xl text-[2.75rem] leading-[1.02] font-semibold sm:text-6xl lg:text-[4.5rem]">
            Every prize promise, kept in public.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-2">
            Ahadi is a SingularityNET Omega agent that pays hackathon winners
            from a rule published before anyone registers. MeTTa decides every
            amount, the organiser co-signs every payout, and every dollar lands
            on a ledger anyone can check.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/funds/october-2026"
              className="rounded-lg bg-note px-5 py-3 font-medium text-white transition-colors hover:bg-note-ink"
            >
              See the October fund
            </Link>
            <Link
              href="/verify"
              className="rounded-lg border border-ink/15 bg-card px-5 py-3 font-medium transition-colors hover:border-ink/40"
            >
              Verify a receipt
            </Link>
            <Link
              href="/how-it-works"
              className="rounded-lg px-5 py-3 font-medium text-ink-2 transition-colors hover:text-ink"
            >
              How it works
            </Link>
          </div>
        </div>
        <div className="ahadi-page pb-16 lg:pb-20">
          <div className="mx-auto max-w-[88rem]">
            <PayoutFlow data={data} fp={fp} />
          </div>
        </div>
        {photo && (
          <p className="absolute right-4 bottom-2 text-[0.6875rem] text-ink-2/80">
            Photo:{" "}
            <a
              href={photo.href}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-ink"
            >
              {photo.credit}
            </a>
          </p>
        )}
      </section>

      <ProblemSection />
      <MoneyGateSection data={data} />
      <VaultSection data={data} />
      <LedgerSection data={data} />
      <CasesSection data={data} />
      <ArchitectureStrip />
      <ProofBand data={data} />
      <AudienceSection />
    </>
  )
}
