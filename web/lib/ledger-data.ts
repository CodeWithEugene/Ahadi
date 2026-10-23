import { api } from "./api"
import { pct, usd } from "./format"
import type { Derivation, FundView, Line, LineKind, Proposal, Step } from "./types"

/* ---------- API shapes used by the public ledger pages ---------- */

export interface LineDetail extends Line {
  proposal?: Proposal | null
  derivation?: Derivation | null
  event_name?: string | null
}

export interface VerifyCheck {
  name: string
  passed: boolean
  text: string
}

export interface VerifyResult {
  found_on_chain: boolean
  tx?: {
    hash: string
    ledger: number
    created_at: string
    source_account: string
    fee_charged: string
    memo_type: string
    successful: boolean
    operation_count: number
    memo_hex: string | null
  }
  signers?: string[]
  line: Line | null
  checks?: VerifyCheck[]
  receipt_url?: string
}

export interface AccountsView {
  agent?: { label: string; public: string }
  organiser?: { label: string; public: string }
  sponsor?: { label: string; public: string }
  issuer?: { label: string; public: string }
  [k: string]: unknown
}

export const getLine = (id: string) => api<LineDetail>(`/api/lines/${encodeURIComponent(id)}`)
export const verifyTx = (tx: string) => api<VerifyResult>(`/api/verify/${tx}`)
export const getAccounts = () => api<AccountsView>("/api/accounts")

export const HORIZON_TX = "https://horizon-testnet.stellar.org/transactions/"

/* ---------- Plain-language helpers ---------- */

export const TX_RE = /^[0-9a-f]{64}$/

/** Pull a 64 hex transaction hash out of whatever the person pasted (a bare hash, or an explorer URL). */
export function extractTx(input: string): string {
  const s = input.trim().toLowerCase()
  if (TX_RE.test(s)) return s
  const m = s.match(/(?:^|[^0-9a-f])([0-9a-f]{64})(?:$|[^0-9a-f])/)
  return m ? m[1] : s
}

export function statusWords(status: string): { label: string; tone: string } {
  switch (status) {
    case "registration":
      return { label: "Registration open", tone: "bg-organiser-soft text-organiser" }
    case "judging":
      return { label: "Judging", tone: "bg-agent-soft text-agent" }
    case "paying":
      return { label: "Paying winners", tone: "bg-note-soft text-note-ink" }
    case "closed":
      return { label: "Closed", tone: "bg-paper-2 text-ink-2" }
    default:
      return { label: status.charAt(0).toUpperCase() + status.slice(1), tone: "bg-paper-2 text-ink-2" }
  }
}

export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"]
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

export function longDate(iso: string | null | undefined): string {
  if (!iso) return ""
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

export function fullTime(iso: string | null | undefined): string {
  if (!iso) return ""
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  })
}

export function stroops(n: number | string | null | undefined): string {
  if (n === null || n === undefined || n === "") return ""
  const v = Number(n)
  const xlm = (v / 1e7).toFixed(7).replace(/0+$/, "").replace(/\.$/, "")
  return `${xlm} XLM (${v.toLocaleString("en-US")} stroops)`
}

/** The newest payout outcome for each place, from the ledger lines. */
export function placeOutcomes(lines: Line[]): Map<number, { line: Line; history: Line[] }> {
  const out = new Map<number, { line: Line; history: Line[] }>()
  const rank: Partial<Record<LineKind, number>> = { paid: 3, held: 2, returned: 2, failed: 1 }
  for (const l of lines) {
    const place = l.detail?.place
    if (typeof place !== "number" || !(l.kind in rank)) continue
    const cur = out.get(place)
    if (!cur) {
      out.set(place, { line: l, history: [l] })
      continue
    }
    cur.history.push(l)
    if ((rank[l.kind] ?? 0) >= (rank[cur.line.kind] ?? 0)) cur.line = l
  }
  return out
}

/** Split a derivation step like "Award pool = USD 1,700.00 x 40.00% = USD 680.00" into readable parts. */
export function readStep(step: Step): { label: string; formula: string; result: string; note: string | null } {
  const parts = step.text.split(" = ")
  const label = parts[0] ?? step.rule
  const last = parts[parts.length - 1] ?? ""
  const comma = last.indexOf(", ")
  const note = comma >= 0 ? last.slice(comma + 2) : null
  const formula = parts
    .slice(1, -1)
    .join(" = ")
    .replace(/ x /g, " × ")
    .replace(/ - /g, " − ")
    .replace(/ \/ /g, " ÷ ")
  const result = step.value === null ? last : step.rule === "release" ? pct(step.value) : usd(step.value)
  return { label, formula, result, note: note ? note.charAt(0).toUpperCase() + note.slice(1) + "." : null }
}

export function headline(l: Line, eventName?: string | null): string {
  const amt = usd(l.amount_cents)
  const who = l.party ?? "someone"
  const d = l.detail ?? {}
  switch (l.kind) {
    case "rule":
      return "The funding rule was recorded on Stellar"
    case "received":
      return `${amt} received from ${who}`
    case "attested":
      return `${who} confirmed ${d.eligible} eligible teams`
    case "paid":
      return `${amt} paid to ${who}`
    case "held":
      return `${amt} held for ${who}`
    case "failed":
      return `A ${amt} payout to ${who} did not go through`
    case "rejected":
      return `A request for ${d.requested_cents ? usd(d.requested_cents) : "money"} was refused by the rule`
    case "duplicate":
      return `A repeat request from ${who} was not paid twice`
    case "control":
      return "Ahadi tried to pay with only its own key, and Stellar refused"
    case "carried_out":
      return `${amt} carried forward to the next event`
    case "carried_in":
      return `${amt} carried in from ${who}`
    case "returned":
      return `${amt} returned to the fund`
    default:
      return eventName ?? "Ledger line"
  }
}

/* ---------- Canonical rule fingerprint ---------- */

function sortKeys(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeys)
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>
    return Object.fromEntries(
      Object.keys(o)
        .sort()
        .map((k) => [k, sortKeys(o[k])]),
    )
  }
  return v
}

/** The exact text that was hashed: the rule without its hash, keys sorted, no whitespace. */
export function canonicalRule(rule: FundView["rule"]): string {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { hash, ...rest } = rule
  return JSON.stringify(sortKeys(rest))
}

export async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

/** Human names for the keys and accounts Ahadi knows, for labelling signers and sources. */
export function keyNames(a: AccountsView | null): Record<string, string> {
  const out: Record<string, string> = {}
  if (!a) return out
  const fixed: Record<string, string> = { agent: "Ahadi's key", organiser: "Organiser's key", sponsor: "Sponsor", issuer: "Demo USD issuer" }
  for (const [k, v] of Object.entries(a)) {
    if (Array.isArray(v)) {
      for (const w of v as { team?: string; public?: string }[]) if (w.public && w.team) out[w.public] = w.team
    } else if (v && typeof v === "object" && "public" in v) {
      const acct = v as { label: string; public: string }
      out[acct.public] = fixed[k] ?? acct.label.replace(/\s*\(.*\)$/, "")
    }
  }
  return out
}

/**
 * Server-safe copy of lineNote from components/ahadi/ledger-table (a client module, whose exports
 * cannot be called from server components).
 */
export function noteFor(l: Line): string | null {
  const d = l.detail ?? {}
  if (l.kind === "failed") return `${d.text ?? ""}${d.next === "claimable" ? " Rerouted to a held prize." : ""}`
  if (l.kind === "rejected") return d.reason ?? null
  if (l.kind === "duplicate") return d.reason ?? "Already handled."
  if (l.kind === "control") return d.text ?? null
  if (l.kind === "attested") return `${d.eligible} of ${d.target} target teams qualified, releasing ${(d.release_bp / 100).toFixed(0)}% for awards.`
  if (l.kind === "paid" && d.quote) return `Winner asked for USDC on ${d.quote.to_chain}: simulated dry quote ${d.quote.amount_out} out.`
  return null
}

/** Canonical JSON as the bridge hashes it: keys sorted recursively, no whitespace, UTF-8. */
export function canonicalJson(v: unknown): string {
  return JSON.stringify(sortKeys(v))
}

/** A carry line names the other event by ID or by name, depending on the bridge version. Resolve either to an ID. */
export function eventIdFor(party: string | null | undefined, events: { event_id: string; name: string }[]): string | null {
  if (!party) return null
  return events.find((e) => e.event_id === party || e.name === party)?.event_id ?? null
}
