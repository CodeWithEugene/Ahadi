import { createHash } from "node:crypto"

import type { FundView, Line } from "./types"

/** Same as the bridge's canonical_json: sorted keys, no whitespace, UTF-8. */
export function canonicalJson(obj: Record<string, unknown>): string {
  const sorted = Object.keys(obj)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${JSON.stringify(obj[k])}`)
  return `{${sorted.join(",")}}`
}

export interface Fingerprint {
  line: Line
  json: string
  sha: string
  matches: boolean
}

/**
 * Rebuild a settled payout's request from the public ledger, hash it, and compare with the
 * request id the bridge stored (which is also the transaction's memo). Server only.
 */
export function fingerprintOf(
  fund: FundView | null,
  kinds: Line["kind"][] = ["paid", "held"]
): Fingerprint | null {
  if (!fund?.event.rule_hash) return null
  const line = fund.lines.find(
    (l) =>
      kinds.includes(l.kind) &&
      l.tx_hash &&
      l.request_id &&
      l.party_public &&
      l.detail?.place
  )
  if (!line) return null
  const json = canonicalJson({
    event_id: fund.event.event_id,
    rule_hash: fund.event.rule_hash,
    place: line.detail!.place,
    team: line.party,
    recipient: line.party_public,
    asset: fund.rule.asset,
    amount_cents: line.amount_cents,
  })
  const sha = createHash("sha256").update(json, "utf8").digest("hex")
  return { line, json, sha, matches: sha === line.request_id }
}
