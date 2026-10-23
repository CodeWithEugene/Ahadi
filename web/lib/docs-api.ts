import { EXAMPLES, EXAMPLE_NOTES } from "./docs-examples"

export type Access = "public" | "console" | "tool"

export interface Param {
  name: string
  in: "path" | "query" | "header" | "body"
  type: string
  required?: boolean
  text: string
}

export interface Endpoint {
  id: string
  method: "GET" | "POST" | "SSE"
  path: string
  title: string
  text: string
  access: Access
  params?: Param[]
  curl: string
  example: string
  exampleLang?: "json" | "csv" | "sse" | "text"
  exampleLabel?: string
  note?: string
  tryPath?: string
}

export interface EndpointGroup {
  id: string
  title: string
  lede: string
  endpoints: Endpoint[]
}

const B = "$AHADI"

const passcode: Param = {
  name: "x-ahadi-passcode",
  in: "header",
  type: "string",
  required: true,
  text: "The console passcode. Required on every write.",
}
const pid: Param = {
  name: "pid",
  in: "path",
  type: "string",
  required: true,
  text: "Proposal id, for example p_f90ec389dc.",
}
const eventId: Param = {
  name: "event_id",
  in: "path",
  type: "string",
  required: true,
  text: "Event id: october-2026 or december-2026.",
}

const ex = (k: string) => EXAMPLES[k]
const nt = (k: string) => EXAMPLE_NOTES[k]

export const GROUPS: EndpointGroup[] = [
  {
    id: "funds",
    title: "Funds and ledger",
    lede: "Each event has a fund: a 2 of 2 vault account on Stellar testnet, a published rule, and an append only ledger. These reads are public.",
    endpoints: [
      {
        id: "list-events",
        method: "GET",
        path: "/api/events",
        title: "List events",
        text: "Every event with its status, rule fingerprint, prize pool and live totals. Totals include the fund's balance read from Horizon and whether the ledger balances against it.",
        access: "public",
        curl: `curl ${B}/api/events`,
        example: ex("events"),
        tryPath: "/api/events",
      },
      {
        id: "get-fund",
        method: "GET",
        path: "/api/funds/{event_id}",
        title: "Get a fund",
        text: "The full public view of one fund: the event, the canonical rule and its hash, the derivation with every step, the placements, the totals and every ledger line in order.",
        access: "public",
        params: [eventId],
        curl: `curl ${B}/api/funds/october-2026`,
        example: ex("fund"),
        note: nt("fund"),
        tryPath: "/api/funds/october-2026",
      },
      {
        id: "ledger-json",
        method: "GET",
        path: "/api/funds/{event_id}/ledger.json",
        title: "Export the ledger as JSON",
        text: "The event, rule, totals and lines, without the derivation or placements. Use it as a feed.",
        access: "public",
        params: [eventId],
        curl: `curl ${B}/api/funds/october-2026/ledger.json`,
        example: ex("ledger_json"),
        note: nt("ledger_json"),
        tryPath: "/api/funds/october-2026/ledger.json",
      },
      {
        id: "ledger-csv",
        method: "GET",
        path: "/api/funds/{event_id}/ledger.csv",
        title: "Export the ledger as CSV",
        text: "One row per ledger line with the receipt link, for spreadsheets and sponsors' reports.",
        access: "public",
        params: [eventId],
        curl: `curl ${B}/api/funds/october-2026/ledger.csv`,
        example: ex("ledger_csv"),
        exampleLang: "csv",
        note: nt("ledger_csv"),
        tryPath: "/api/funds/october-2026/ledger.csv",
      },
      {
        id: "accounts",
        method: "GET",
        path: "/api/accounts",
        title: "List the testnet accounts",
        text: "Public keys only: the agent and organiser co-signers, both fund vaults, the demo USD issuer, the sponsor, and each sample winner with the state of their wallet.",
        access: "public",
        curl: `curl ${B}/api/accounts`,
        example: ex("accounts"),
        note: nt("accounts"),
        tryPath: "/api/accounts",
      },
    ],
  },
  {
    id: "receipts",
    title: "Receipts and verification",
    lede: "Every money line carries a Stellar transaction hash. The memo on that transaction is the request's fingerprint, so anyone can match the chain to the ledger.",
    endpoints: [
      {
        id: "get-line",
        method: "GET",
        path: "/api/lines/{line_id}",
        title: "Get one ledger line",
        text: "A line with everything needed to check it: the proposal and the rule decision behind it, the related line (for example the failure a held prize replaced), and the derivation for its event.",
        access: "public",
        params: [
          {
            name: "line_id",
            in: "path",
            type: "string",
            required: true,
            text: "Ledger line id, for example l_64f1409ef6.",
          },
        ],
        curl: `curl ${B}/api/lines/l_64f1409ef6`,
        example: ex("line"),
        note: nt("line"),
        tryPath: "/api/lines/l_64f1409ef6",
      },
      {
        id: "verify",
        method: "GET",
        path: "/api/verify/{tx_hash}",
        title: "Verify a transaction",
        text: "Looks the hash up on Horizon, finds the matching ledger line and checks two things: the memo equals the request fingerprint, and both the agent and the organiser signed. A hash that is not on testnet returns found_on_chain false.",
        access: "public",
        params: [
          {
            name: "tx_hash",
            in: "path",
            type: "string",
            required: true,
            text: "A Stellar transaction hash: 64 hexadecimal characters.",
          },
        ],
        curl: `curl ${B}/api/verify/ab4e8a838e9991733eb4610182bb68707d13c964121e0204b1571a4753f55a76`,
        example: ex("verify"),
        tryPath:
          "/api/verify/ab4e8a838e9991733eb4610182bb68707d13c964121e0204b1571a4753f55a76",
      },
    ],
  },
  {
    id: "proposals",
    title: "Proposals and approval",
    lede: "Ahadi never pays on its own. It creates a proposal; the organiser prepares it, signs the transaction in their browser, and approves.",
    endpoints: [
      {
        id: "list-proposals",
        method: "GET",
        path: "/api/proposals",
        title: "List proposals",
        text: "Proposals for rule recording, payouts, held prizes and carry forward, with the rule decision and its nine checks.",
        access: "public",
        params: [
          {
            name: "event_id",
            in: "query",
            type: "string",
            text: "Only this event's proposals.",
          },
          {
            name: "status",
            in: "query",
            type: "string",
            text: "proposed, submitted, settled, failed, expired or rejected.",
          },
        ],
        curl: `curl "${B}/api/proposals?event_id=october-2026"`,
        example: ex("proposals"),
        note: nt("proposals"),
        tryPath: "/api/proposals?event_id=october-2026",
      },
      {
        id: "get-proposal",
        method: "GET",
        path: "/api/proposals/{pid}",
        title: "Get a proposal",
        text: "One proposal. A failed payout keeps the network's result codes and the hash it attempted.",
        access: "public",
        params: [pid],
        curl: `curl ${B}/api/proposals/p_f6fbc8299a`,
        example: ex("proposal"),
        note: nt("proposal"),
        tryPath: "/api/proposals/p_f6fbc8299a",
      },
      {
        id: "organiser-key",
        method: "GET",
        path: "/api/organiser-key/public",
        title: "Get the organiser's public key",
        text: "The browser checks that the key the organiser imports matches this one before it signs anything.",
        access: "public",
        curl: `curl ${B}/api/organiser-key/public`,
        example: ex("organiser_key"),
        tryPath: "/api/organiser-key/public",
      },
      {
        id: "prepare",
        method: "POST",
        path: "/api/proposals/{pid}/prepare",
        title: "Prepare: the agent signs",
        text: "Builds a fresh transaction for the proposal, re-runs the rule against current facts, and signs it with the agent's key. Returns the XDR for the organiser to sign. Transactions are built at this step, not when the proposal was made, so a waiting proposal never expires or collides on the fund's sequence number.",
        access: "console",
        params: [pid, passcode],
        curl: `curl -X POST ${B}/api/proposals/p_f90ec389dc/prepare \\\n  -H "x-ahadi-passcode: $PASSCODE"`,
        example: `{
  "proposal_id": "p_f90ec389dc",
  "xdr": "AAAAAgAAAABN/bXmrbVd5ouXu/yhyMBU3NRzmWhES1SC…",
  "tx_hash": "ab4e8a838e9991733eb4610182bb68707d13c964121e0204b1571a4753f55a76",
  "network_passphrase": "Test SDF Network ; September 2015",
  "signed_by": ["agent"],
  "needs": ["organiser"],
  "ev": "october-2026"
}`,
        note: "Response shape from the bridge, with values from the settled October payout to Team Mvua. The XDR is shortened.",
      },
      {
        id: "approve",
        method: "POST",
        path: "/api/proposals/{pid}/approve",
        title: "Approve: submit both signatures",
        text: "Send the XDR after the organiser has added their signature in the browser. The bridge checks it is the same transaction the agent prepared (by hash), that both signatures are present, stores the signed XDR, then submits it to Stellar and writes the ledger line.",
        access: "console",
        params: [
          pid,
          passcode,
          {
            name: "signed_xdr",
            in: "body",
            type: "string",
            required: true,
            text: "The prepared XDR with the organiser's signature added.",
          },
        ],
        curl: `curl -X POST ${B}/api/proposals/p_f90ec389dc/approve \\\n  -H "x-ahadi-passcode: $PASSCODE" \\\n  -H "content-type: application/json" \\\n  -d '{"signed_xdr": "AAAAAgAAAABN…"}'`,
        example: `{
  "ok": true,
  "tx_hash": "ab4e8a838e9991733eb4610182bb68707d13c964121e0204b1571a4753f55a76",
  "receipt_url": "https://stellar.expert/explorer/testnet/tx/ab4e8a838e9991733eb4610182bb68707d13c964121e0204b1571a4753f55a76",
  "line": { "id": "l_64f1409ef6", "seq": 6, "kind": "paid", "amount_cents": 17000, "party": "Team Mvua" },
  "proposal": { "id": "p_f90ec389dc", "status": "settled" }
}`,
        note: "Response shape from the bridge, with values from the October run; line and proposal are shortened. A network failure returns ok false with code, text and next.",
      },
      {
        id: "reject",
        method: "POST",
        path: "/api/proposals/{pid}/reject",
        title: "Reject a proposal",
        text: "The organiser declines. The refusal and its reason go on the ledger.",
        access: "console",
        params: [
          pid,
          passcode,
          {
            name: "reason",
            in: "body",
            type: "string",
            text: "Up to 300 characters. Defaults to “Rejected by the organiser”.",
          },
        ],
        curl: `curl -X POST ${B}/api/proposals/p_f90ec389dc/reject \\\n  -H "x-ahadi-passcode: $PASSCODE" \\\n  -H "content-type: application/json" \\\n  -d '{"reason": "Team withdrew"}'`,
        example: `{"error":"bad_state","detail":"proposal is settled"}`,
        exampleLabel: "Captured response",
        note: "Captured from the bridge: a settled proposal cannot be rejected (HTTP 409).",
      },
      {
        id: "try-alone",
        method: "POST",
        path: "/api/proposals/{pid}/try-alone",
        title: "Try with the agent's key alone",
        text: "The control demonstration. Prepares the proposal and submits it with only the agent's signature. Stellar refuses with tx_bad_auth, no fee is charged, and a control line is recorded.",
        access: "console",
        params: [pid, passcode],
        curl: `curl -X POST ${B}/api/proposals/p_f90ec389dc/try-alone \\\n  -H "x-ahadi-passcode: $PASSCODE"`,
        example: `{
  "ok": false,
  "code": "tx_bad_auth",
  "text": "Only one of the two required signatures was present.",
  "attempted_tx": "a44f0ef14fc3131de8c7b3629eeb2b9d21497ea4a638fee06c21afbc6761b58e",
  "line": { "id": "l_7a9846b309", "seq": 5, "kind": "control" }
}`,
        note: "Values from the single key line of the October run captured on 23 October; line is shortened.",
      },
      {
        id: "reroute",
        method: "POST",
        path: "/api/proposals/{pid}/reroute",
        title: "Reroute a failed payout",
        text: "After op_no_destination, op_no_trust or op_not_authorized, proposes holding the prize as a claimable balance for 30 days. Any other failure is refused.",
        access: "console",
        params: [pid, passcode],
        curl: `curl -X POST ${B}/api/proposals/p_f6fbc8299a/reroute \\\n  -H "x-ahadi-passcode: $PASSCODE"`,
        example: `{"error":"bad_state","detail":"only a failed payout can be rerouted"}`,
        exampleLabel: "Captured response",
        note: "Captured from the bridge for a settled payout (HTTP 409). On success it returns the new claimable proposal.",
      },
    ],
  },
  {
    id: "setup",
    title: "Fund setup",
    lede: "Organiser actions that set an event up and close it. All need the console passcode, and every money movement still needs both signatures.",
    endpoints: [
      {
        id: "propose-rule",
        method: "POST",
        path: "/api/funds/{event_id}/rule",
        title: "Propose recording the rule",
        text: "Creates a proposal to write the rule's SHA-256 hash to the fund with manageData. Do this before registration opens.",
        access: "console",
        params: [eventId, passcode],
        curl: `curl -X POST ${B}/api/funds/october-2026/rule \\\n  -H "x-ahadi-passcode: $PASSCODE"`,
        example: `{"error":"duplicate","detail":"the rule for this event is already recorded on chain"}`,
        exampleLabel: "Captured response",
        note: "Captured from the bridge: October's rule is already on chain (HTTP 400). On success it returns the new proposal.",
      },
      {
        id: "deposit",
        method: "POST",
        path: "/api/funds/{event_id}/deposit",
        title: "Record the sponsor's deposit",
        text: "The sample sponsor pays the prize pool into the fund. The sponsor signs alone because it is the sponsor's money. Recorded once per event.",
        access: "console",
        params: [eventId, passcode],
        curl: `curl -X POST ${B}/api/funds/october-2026/deposit \\\n  -H "x-ahadi-passcode: $PASSCODE"`,
        example: `{"error":"duplicate","detail":"this event's sponsor deposit is already recorded"}`,
        exampleLabel: "Captured response",
        note: "Captured from the bridge (HTTP 400). On success it returns the received line.",
      },
      {
        id: "attest",
        method: "POST",
        path: "/api/funds/{event_id}/attest",
        title: "Attest eligible teams",
        text: "The organiser states how many teams qualified. This fixes the release percentage, the award pool and the reserve. Allowed once, and only after the rule is on chain.",
        access: "console",
        params: [
          eventId,
          passcode,
          {
            name: "eligible",
            in: "body",
            type: "integer",
            required: true,
            text: "Between 0 and 10,000.",
          },
        ],
        curl: `curl -X POST ${B}/api/funds/october-2026/attest \\\n  -H "x-ahadi-passcode: $PASSCODE" \\\n  -H "content-type: application/json" \\\n  -d '{"eligible": 20}'`,
        example: `{"error":"duplicate","detail":"eligibility for this event is already attested"}`,
        exampleLabel: "Captured response",
        note: "Captured from the bridge (HTTP 400). On success it returns eligible, the derivation and the attested line.",
      },
      {
        id: "carry",
        method: "POST",
        path: "/api/funds/{event_id}/carry/{to_event}",
        title: "Propose carrying the reserve forward",
        text: "After every payout is settled, held or rejected, proposes moving what is left to the next event's fund. The memo is the first event's rule hash.",
        access: "console",
        params: [
          eventId,
          {
            name: "to_event",
            in: "path",
            type: "string",
            required: true,
            text: "The receiving event, for example december-2026.",
          },
          passcode,
        ],
        curl: `curl -X POST ${B}/api/funds/october-2026/carry/december-2026 \\\n  -H "x-ahadi-passcode: $PASSCODE"`,
        example: `{"error":"duplicate","detail":"this event's reserve was already carried forward"}`,
        exampleLabel: "Captured response",
        note: "Captured from the bridge (HTTP 400). On success it returns the carry proposal.",
      },
    ],
  },
  {
    id: "agent",
    title: "Agent and activity",
    lede: "Ahadi is a SingularityNET Omega agent. These endpoints show its state, what it has done, and what it remembers, and let the organiser talk to it.",
    endpoints: [
      {
        id: "health",
        method: "GET",
        path: "/api/health",
        title: "Health",
        text: "The network, the demo asset and its issuer, whether Omega is connected on the websocket channel, its provider, model, loop cycles and token counts, the skills it loaded, and whether the Telegram relay is on.",
        access: "public",
        curl: `curl ${B}/api/health`,
        example: ex("health"),
        note: "Captured during a development run that used Omega's OpenAI compatible provider with a scripted stand in model, which is why model reads fake.",
        tryPath: "/api/health",
      },
      {
        id: "chat",
        method: "POST",
        path: "/api/chat",
        title: "Send the agent a message",
        text: "Delivers a message to Omega as a user_message on its websocket channel. If Omega is not connected, the message is queued and delivered on reconnect. Replies arrive on the stream as agent_message.",
        access: "console",
        params: [
          passcode,
          {
            name: "text",
            in: "body",
            type: "string",
            required: true,
            text: "1 to 2,000 characters.",
          },
          {
            name: "source",
            in: "body",
            type: "string",
            text: "console (default) or telegram.",
          },
          {
            name: "author",
            in: "body",
            type: "string",
            text: "Shown to the agent as [telegram @author].",
          },
        ],
        curl: `curl -X POST ${B}/api/chat \\\n  -H "x-ahadi-passcode: $PASSCODE" \\\n  -H "content-type: application/json" \\\n  -d '{"text": "What does the December fund start with?"}'`,
        example: `{"delivered": true, "seq": 4}`,
        note: 'Response shape from the bridge. When Omega is offline: {"delivered": false, "seq": 4, "queued": true}.',
      },
      {
        id: "activity",
        method: "GET",
        path: "/api/activity",
        title: "Recent activity",
        text: "The last 2,000 events the bridge has seen, the same events the stream sends. Use after to page from an event id.",
        access: "public",
        params: [
          {
            name: "after",
            in: "query",
            type: "integer",
            text: "Only events with a larger id. Defaults to 0.",
          },
        ],
        curl: `curl "${B}/api/activity?after=0"`,
        example: ex("activity"),
        note: nt("activity"),
        tryPath: "/api/activity",
      },
      {
        id: "memory",
        method: "GET",
        path: "/api/agent/memory",
        title: "What the agent remembers",
        text: "Omega's long term memories (read only from its ChromaDB store) and the tail of its episodic history, history.metta.",
        access: "public",
        curl: `curl ${B}/api/agent/memory`,
        example: ex("memory"),
        note: nt("memory"),
        tryPath: "/api/agent/memory",
      },
    ],
  },
]

export const STREAM: Endpoint = {
  id: "stream",
  method: "SSE",
  path: "/api/stream",
  title: "Subscribe to everything",
  text: "Server sent events. On connect the bridge replays recent events after the given id, then sends each new one as it happens. A ping event arrives every 15 seconds when nothing else does. Each data payload is JSON with id, kind and at.",
  access: "public",
  params: [
    {
      name: "after",
      in: "query",
      type: "integer",
      text: "Replay events with a larger id. Use the last id you saw to resume.",
    },
  ],
  curl: `curl -N "${B}/api/stream?after=459"`,
  example: `id: 460
event: message
data: {"id": 460, "kind": "omega_log", "at": "2026-10-23T10:44:41.958+00:00", "ts": "2026-10-23 10:43:05", "level": "INFO", "module": "loop", "category": "cycle", "n": 362}

id: 461
event: message
data: {"id": 461, "kind": "omega_log", "at": "2026-10-23T10:44:41.958+00:00", "ts": "2026-10-23 10:43:06", "level": "INFO", "module": "loop", "category": "cycle", "n": 363}`,
  exampleLang: "sse",
  exampleLabel: "Captured stream",
  tryPath: "/api/stream",
}

export const STREAM_KINDS: { kind: string; fields: string; text: string }[] = [
  {
    kind: "ledger",
    fields: "event_id, line",
    text: "A line was added to a ledger: paid, held, failed, rejected, duplicate and the rest.",
  },
  {
    kind: "proposal",
    fields: "event_id, proposal",
    text: "Ahadi or the console created a proposal.",
  },
  {
    kind: "signature",
    fields: "proposal_id, signer, tx_hash",
    text: "A key signed: signer is agent at prepare, organiser at approve.",
  },
  {
    kind: "decision",
    fields: "event_id, request, metta, bridge, agree, source, message",
    text: "The MeTTa decision for a request, the bridge's own decision, and whether they agree. Nothing is proposed unless both allow it.",
  },
  {
    kind: "derivation",
    fields:
      "event_id, source, eligible, award_cents, reserve_cents, places, agrees_with_bridge, steps",
    text: "Amounts Omega derived in MeTTa, checked against the Python mirror.",
  },
  {
    kind: "facts",
    fields: "event_id, request, flags, sexpr",
    text: "The facts the bridge handed to MeTTa, as the ahadi-facts expression.",
  },
  {
    kind: "tool",
    fields: "tool, args, summary or result",
    text: "A skill call or a simulated NEAR dry quote.",
  },
  {
    kind: "omega_log",
    fields: "ts, level, module, category, ...",
    text: "Omega's own log, classified. category is cycle (n), decision (calls), result (skill, ok, text), usage (provider, model, tokens) or skill (a skill was loaded).",
  },
  {
    kind: "agent_message",
    fields: "text",
    text: "Omega sent a message on its channel.",
  },
  {
    kind: "user_message",
    fields: "text, source, author, seq",
    text: "A message was delivered to Omega from the console or Telegram.",
  },
  {
    kind: "telegram_in",
    fields: "author, text",
    text: "A Telegram message reached the bridge's relay.",
  },
  {
    kind: "telegram_out",
    fields: "text",
    text: "The relay posted Omega's reply to Telegram.",
  },
  {
    kind: "omega",
    fields: "status",
    text: "Omega's websocket connected or disconnected.",
  },
]

export const TOOLS: {
  path: string
  skill: string
  body: string
  returns: string
}[] = [
  {
    path: "/tools/status",
    skill: "ahadi-status",
    body: "event_id",
    returns: "text",
  },
  {
    path: "/tools/publish-rule",
    skill: "ahadi-publish-rule",
    body: "event_id",
    returns: "text",
  },
  {
    path: "/tools/params",
    skill: "ahadi-derive",
    body: "event_id",
    returns: "sexpr (ahadi-params …)",
  },
  {
    path: "/tools/derivation",
    skill: "ahadi-derive",
    body: "event_id, eligible, award_cents, reserve_cents, places",
    returns: "text",
  },
  {
    path: "/tools/facts",
    skill: "ahadi-propose, ahadi-request",
    body: "event_id, place or team, amount_usd, wallet",
    returns: "sexpr (ahadi-facts …)",
  },
  {
    path: "/tools/propose",
    skill: "ahadi-propose",
    body: "event_id, place, metta_decision",
    returns: "text",
  },
  {
    path: "/tools/request",
    skill: "ahadi-request",
    body: "event_id, team, amount_usd, wallet, message, metta_decision",
    returns: "text",
  },
  {
    path: "/tools/try-alone",
    skill: "ahadi-try-alone",
    body: "proposal_id",
    returns: "text",
  },
  {
    path: "/tools/failure-code",
    skill: "ahadi-reroute",
    body: "proposal_id",
    returns: "sexpr (result code)",
  },
  {
    path: "/tools/reroute",
    skill: "ahadi-reroute",
    body: "proposal_id, metta_route",
    returns: "text",
  },
  {
    path: "/tools/carry-forward",
    skill: "ahadi-carry-forward",
    body: "from_event, to_event",
    returns: "text",
  },
  {
    path: "/tools/quote",
    skill: "ahadi-quote",
    body: "amount_usd, to_chain",
    returns: "text",
  },
  {
    path: "/tools/verify",
    skill: "ahadi-verify",
    body: "tx_hash",
    returns: "text",
  },
]

export const TOOL_CURL = `curl -X POST http://bridge:8000/tools/facts \\
  -H "x-ahadi-tool-secret: $AHADI_TOOL_SECRET" \\
  -H "content-type: application/json" \\
  -d '{"event_id": "october-2026", "place": "2"}'`

export const TOOL_EXAMPLE = `{"sexpr":"(ahadi-facts 1 1 1 1 13600 13600 1 0 1 0 1 1 0)"}`

export const SKILLS: { name: string; args: string; text: string }[] = [
  {
    name: "ahadi-status",
    args: "event_id",
    text: "Shows an event's fund: the published rule, eligibility, totals, recent ledger lines and open proposals. The agent calls it first for any fund question.",
  },
  {
    name: "ahadi-publish-rule",
    args: "event_id",
    text: "Proposes recording the rule's SHA-256 hash on Stellar testnet. The organiser must approve.",
  },
  {
    name: "ahadi-derive",
    args: "event_id",
    text: "Derives the award pool, the reserve and every place's amount in MeTTa from the rule's parameters, then reports them to the bridge, which checks them against its Python mirror.",
  },
  {
    name: "ahadi-propose",
    args: "event_id place",
    text: "Fetches the facts for one place, runs ahadi-decide in MeTTa, and only if the rule allows it creates a proposal for the organiser.",
  },
  {
    name: "ahadi-request",
    args: "event_id team amount_usd wallet message",
    text: "Checks a request that arrived in a message. Proposes only if the rule allows; otherwise records a duplicate or a refusal with reasons.",
  },
  {
    name: "ahadi-try-alone",
    args: "proposal_id",
    text: "Submits a prepared proposal with only the agent's signature to show the two key control. Stellar must answer tx_bad_auth.",
  },
  {
    name: "ahadi-reroute",
    args: "proposal_id",
    text: "Reads a failed payout's result code, asks MeTTa for the next step (ahadi-next-step), and proposes a 30 day held prize when the answer is claimable.",
  },
  {
    name: "ahadi-carry-forward",
    args: "from_event to_event",
    text: "Proposes moving the remaining reserve to the next event's fund. Only after every payout is settled.",
  },
  {
    name: "ahadi-quote",
    args: "amount_usd to_chain",
    text: "Gets a simulated NEAR Intents dry quote for paying a prize on another chain. No funds move.",
  },
  {
    name: "ahadi-verify",
    args: "tx_hash",
    text: "Checks a Stellar testnet transaction against the ledger: the memo fingerprint and both signatures.",
  },
]

/** Point the read examples' live requests at ids that exist in the ledger right now. */
export function withLiveIds(
  groups: EndpointGroup[],
  live: { lineId?: string; txHash?: string; proposalId?: string }
): EndpointGroup[] {
  const swaps: [string, string | undefined][] = [
    ["l_64f1409ef6", live.lineId],
    [
      "ab4e8a838e9991733eb4610182bb68707d13c964121e0204b1571a4753f55a76",
      live.txHash,
    ],
    ["p_f6fbc8299a", live.proposalId],
  ]
  const fix = (s: string) =>
    swaps.reduce((acc, [from, to]) => (to ? acc.split(from).join(to) : acc), s)
  return groups.map((g) => ({
    ...g,
    endpoints: g.endpoints.map((e) =>
      e.method === "GET" && e.tryPath
        ? { ...e, curl: fix(e.curl), tryPath: fix(e.tryPath) }
        : e
    ),
  }))
}
