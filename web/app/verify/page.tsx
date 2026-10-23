import type { Metadata } from "next"

import { PageIntro } from "@/components/ahadi/docs/page-parts"
import { VerifyTool, type Example } from "@/components/ahadi/ledger/verify-tool"
import { getEvents, getFund, tryServer } from "@/lib/api"
import { getAccounts, keyNames } from "@/lib/ledger-data"
import type { LineKind } from "@/lib/types"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Verify a receipt",
  description:
    "Paste a Stellar testnet transaction hash and compare what the chain recorded with what Ahadi's public ledger says.",
}

const EXAMPLE_LABELS: Partial<Record<LineKind, string>> = {
  paid: "First place payout",
  held: "Held prize",
  carried_out: "Reserve carried forward",
  rule: "Rule recorded",
  received: "Sponsor deposit",
}

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ tx?: string | string[] }>
}) {
  const sp = await searchParams
  const tx = (Array.isArray(sp.tx) ? sp.tx[0] : sp.tx) ?? ""
  // Sequential on purpose: the bridge mishandles concurrent reads.
  const fund = await tryServer(() => getFund("october-2026"))
  const events = (await tryServer(getEvents)) ?? []
  const accounts = await tryServer(getAccounts)

  const examples: Example[] = []
  for (const kind of Object.keys(EXAMPLE_LABELS) as LineKind[]) {
    const l = fund?.lines.find((x) => x.kind === kind && x.tx_hash)
    if (l?.tx_hash)
      examples.push({ tx: l.tx_hash, label: EXAMPLE_LABELS[kind]! })
  }
  const eventNames = Object.fromEntries(events.map((e) => [e.event_id, e.name]))

  return (
    <>
      <PageIntro title="Check any receipt against the chain">
        <p>
          Don&apos;t trust us; check the chain. Paste a Stellar testnet
          transaction hash and your browser reads it straight from the network,
          then walks the proof chain to the ledger line it is supposed to prove.
        </p>
      </PageIntro>
      <section className="ahadi-page pt-10 pb-24">
        <VerifyTool
          initialTx={tx}
          examples={examples}
          names={keyNames(accounts)}
          eventNames={eventNames}
          keys={{
            agent: accounts?.agent?.public,
            organiser: accounts?.organiser?.public,
          }}
        />
      </section>
    </>
  )
}
