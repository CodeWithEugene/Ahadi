export type LineKind =
  | "rule"
  | "received"
  | "attested"
  | "paid"
  | "held"
  | "failed"
  | "rejected"
  | "duplicate"
  | "control"
  | "carried_out"
  | "carried_in"
  | "returned"

export interface Line {
  id: string
  seq: number
  event_id: string
  kind: LineKind
  amount_cents: number
  party: string | null
  party_public: string | null
  request_id: string | null
  tx_hash: string | null
  fee_stroops: number | null
  proposal_id: string | null
  related_line: string | null
  detail: Record<string, any> | null
  created_at: string
  receipt_url?: string
  horizon_url?: string
}

export interface Totals {
  received_cents: number
  carried_in_cents: number
  paid_cents: number
  held_cents: number
  carried_out_cents: number
  returned_cents: number
  available_cents: number
  network_fee_stroops: number
  chain_balance_cents: number | null
  balanced: boolean
}

export interface Step {
  rule: string
  text: string
  value: number | null
}

export interface Derivation {
  eligible: number
  release_bp: number
  award_cents: number
  reserve_cents: number
  place_cents: number[]
  steps: Step[]
}

export interface Placement {
  place: number
  team: string
  person: string
  city: string
  public: string
  wants_other_chain?: string
}

export interface FundView {
  event: {
    event_id: string
    name: string
    status: string
    eligible: number | null
    rule_hash: string | null
    rule_published_tx: string | null
    cities: string[]
    short: string | null
    registered: number | null
    fund: string
    asset: string
    issuer: string
  }
  rule: {
    event_id: string
    name: string
    asset: string
    pool_cents: number
    target_teams: number
    release: string
    place_shares_bp: number[]
    rounding: string
    claim_window_days: number
    carry_forward: string
    version: number
    hash: string
  }
  derivation: Derivation | null
  placements: Placement[] | null
  totals: Totals
  lines: Line[]
}

export interface EventSummary {
  event_id: string
  name: string
  short: string | null
  status: string
  cities: string[]
  rule_hash: string | null
  pool_cents: number
  totals: Totals
  fund: string
}

export interface Check {
  name: string
  passed: boolean
  reason: string
}

export interface Proposal {
  id: string
  event_id: string
  kind: "rule" | "payout" | "claimable" | "carry"
  request: Record<string, any> | null
  request_id: string | null
  decision: { allowed: boolean; route: string | null; checks: Check[]; expected_cents?: number } | null
  xdr: string | null
  tx_hash: string | null
  status: "proposed" | "submitted" | "settled" | "failed" | "expired" | "rejected"
  result: Record<string, any> | null
  extra: Record<string, any> | null
  parent_id: string | null
  created_at: string
  updated_at: string
}

export interface ActivityEvent {
  id: number
  kind: string
  at: string
  [k: string]: any
}

export interface Health {
  ok: boolean
  network: string
  asset: string
  issuer: string | null
  accounts_created: string | null
  omega: {
    connected: boolean
    connected_at: string | null
    log_present: boolean
    last_cycle: number | null
    provider: string | null
    model: string | null
    version: string | null
    cycles: number
    tokens_in: number
    tokens_out: number
    skills: string[]
  }
  telegram: { enabled: boolean; bot: string | null }
}
