# Track 02 (Omega payouts): Stellar, Raven, NEAR Intents, HackMeridian research

Researched 23 Oct 2026, ~09:00–10:00 UTC (build window opens today).

**How claims are labelled**
- **VERIFIED**: read on the official page or repo, or observed live on that date by calling a public API.
- **REPORTED**: from a secondary source, a search summary or a third-party page.
- **UNVERIFIED**: inference or memory that I could not confirm in this session.

---

## 0. TL;DR

- **Raven is a remote MCP server.** It is not a CLI and not a chat bot. SDF runs it as a "Stellar MCP server for AI agents". Connect it to Claude Code with:
  `claude mcp add --transport http stellar-raven "https://raven.stellar.buzz/mcp"`
  Then run `/mcp`, choose Authenticate, and sign in through the browser (OAuth via WorkOS). The repo README gives the canonical host as `https://raven.stellar.org/mcp`. Both hosts answered `/health` with `{"status":"ok","service":"stellar-raven-codemode"}` on 23 Oct 2026. It exposes two tools:
  - `search`, over the Stellar Docs, Lumenloop and Stellar Light/Scout catalog plus pinned ecosystem skills.
  - `execute`, which runs agent-written JS in a sandbox with no network access. Host adapters make the calls.
  Raven is a *dev-help/knowledge* tool. It does not send transactions. (VERIFIED)
- **The "organiser approval before any transfer" requirement can be enforced by the network, not only by the UI.** Make the prize-fund account a multisig "co-signed vault": the agent key has weight 1 and the payment (medium) threshold is 2. The agent's proposal is rejected with `tx_bad_auth`, with no fee charged and no sequence consumed, until the organiser signs. SDF documents this exact agent pattern. (VERIFIED)
- **The NEAR Intents dry quote works with no API key, and Stellar USDC and XLM are supported assets.** A live dry quote on 23 Oct 2026 returned amounts, fees, an ETA and an ed25519 signature. Catch: quote validation runs against **Stellar pubnet** (it checks trustlines), so testnet G-addresses cannot be used in the quote. The simulator has to use a fixed pubnet placeholder recipient or a recorded fixture. (VERIFIED)
- **Recommended stack:** Node/TS with `@stellar/stellar-sdk@17.3.0`, Horizon testnet for classic payments, history and paths, and a simple JSON/SQLite ledger store. Use classic payments plus claimable balances, and skip Soroban for the 24h build. A static public ledger page links every line to `stellar.expert/explorer/testnet/tx/<hash>`.

---

## 1. Raven: what it is and how to connect

| Item | Detail | Label |
|---|---|---|
| What | "Stellar MCP server for AI agents: one authenticated gateway to official docs, live ecosystem data, community intel, and tested playbooks." It is a remote MCP server running on Cloudflare Workers. | VERIFIED (GitHub repo description, 23 Oct 2026) |
| Owner | Stellar Development Foundation, Apache-2.0, © 2026. The repo is `stellar-experimental/stellar-raven`. It was created 2026-07-31 and last pushed 2026-10-15. | VERIFIED (GitHub API) |
| Tools | `search` finds service operations and skills in a generated catalog. `execute` runs model-written JavaScript in a Dynamic Worker isolate with `globalOutbound: null` (no network). Host-side adapters make every service call and hold every secret. | VERIFIED (README, ARCHITECTURE.md) |
| Data sources | Lumenloop (`lumenloop.*`, API key held by Raven). Stellar Light/Scout (`scout.*`, a read-only public API). Stellar Docs (`stellarDocs.*`, the Algolia index of developers.stellar.org). Pinned ecosystem skills from Lumen Loop, OpenZeppelin, SDF, Stellar Light and Trustless Work. | VERIFIED |
| Endpoint | The official docs page says `https://raven.stellar.buzz/mcp`. The repo README says `https://raven.stellar.org/mcp`. Both return 401 without a token, and `/health` on both returns OK. | VERIFIED (both probed 23 Oct 2026) |
| Auth | OAuth. Raven is its own OAuth authorization server, and WorkOS AuthKit handles sign-in. An access token lasts 1 h and clients refresh it automatically for 90 days. | VERIFIED |
| Other pages | Playground: `https://raven.stellar.org/playground` (sign-in required). Docs: `/docs`. Terms: `/terms`. Health: `/health`. Support: `#raven` channel on discord.gg/stellardev. | VERIFIED |
| Does it sign or submit transactions? | No evidence that it does. It is read and knowledge oriented, and `execute` has no network access. | VERIFIED (architecture); "never" is UNVERIFIED |

**Connection commands** (VERIFIED from https://developers.stellar.org/docs/tools/developer-tools/building-with-ai):
- **Claude Code**
  ```
  claude mcp add --transport http stellar-raven "https://raven.stellar.buzz/mcp"
  ```
  Then run `/mcp`, choose Authenticate, and complete the browser sign-in.
- **Codex**
  ```
  codex mcp add stellar-raven --url "https://raven.stellar.buzz/mcp"
  codex mcp login stellar-raven
  ```
- **Cursor:** add a `stellar-raven` entry to `.cursor/mcp.json`.
- **VS Code:** use `code --add-mcp`.
- **Claude desktop:** Settings → Connectors → Add custom connector.
- **Other clients:**
  ```
  npx -y mcp-remote@latest https://raven.stellar.buzz/mcp --transport http-only
  ```

**Related AI dev aids on the same page** (VERIFIED):
- Stellar Skills (https://skills.stellar.org, repo `stellar/stellar-dev-skill`). Install in Claude Code with `/plugin marketplace add stellar/stellar-dev-skill`, then `/plugin install stellar-dev@stellar-dev`.
- `https://developers.stellar.org/llms.txt`.
- **Stellar CLI for Agents** (https://developers.stellar.org/docs/tools/cli/agent-cli/index.md) is the *transacting* counterpart. Stellar CLI v28.1.0 was released 2026-09-26 (VERIFIED, GitHub releases).

**How to use Raven in the demo:** show it once as the "Stellar dev help" the brief asks for. For example, ask it about the `op_no_trust` remediation, or have it look up the testnet USDC issuer. Keep it out of the payout runtime path.

Sources:
- https://developers.stellar.org/docs/tools/developer-tools/building-with-ai
- https://github.com/stellar-experimental/stellar-raven
- https://raw.githubusercontent.com/stellar-experimental/stellar-raven/main/ARCHITECTURE.md

---

## 2. Stellar testnet mechanics for a 24h payout system

### 2.1 Network facts (VERIFIED live, 23 Oct 2026)

| Item | Value |
|---|---|
| Horizon testnet | `https://horizon-testnet.stellar.org`. horizon 30.0.0, stellar-core 30.0.0, `current_protocol_version: 29`. |
| Stellar RPC testnet | `https://soroban-testnet.stellar.org`. `getNetwork` returns `friendbotUrl https://friendbot.stellar.org/` and protocol 29. RPC 30.0.0. |
| Passphrase | `Test SDF Network ; September 2015` |
| Friendbot | `https://friendbot.stellar.org?addr=G...`. Gives 10,000 test XLM per new account and is rate limited. The docs recommend funding one account and then using `createAccount` for the rest. |
| Next testnet reset | **16 Dec 2026, 17:00 UTC.** This is outside the build window, so testnet receipts made today stay live for judging. HackMeridian (25–26 Oct) is also before the reset. |
| Ops/ledger (testnet) | 200 classic operations per ledger (values as of July 2026). Ledgers close about every 5 s. |

Source: https://developers.stellar.org/docs/networks/index.md

### 2.2 SDKs (VERIFIED from npm and PyPI, 23 Oct 2026)

- **JS:** `@stellar/stellar-sdk` **17.3.0**, published 2026-10-21. The `lts-16` tag is 16.4.1. It provides both `Horizon.Server` and `rpc.Server`.
- **Python:** `stellar-sdk` **16.1.1**, uploaded 2026-10-22.
- **Stellar CLI:** v28.1.0.

These are fresh releases, so pin exact versions in `package.json`.

### 2.3 Horizon vs Stellar RPC in 2026

- **VERIFIED** (https://developers.stellar.org/docs/data/apis, no date on the page): "Horizon is nearing end-of-life and will eventually be deprecated in favor of Stellar RPC". It "won't receive new feature development" but still gets protocol-compatibility updates. RPC "is the recommended API for accessing and interacting with Stellar network data in real-time".
- **VERIFIED:** I found no published shutdown date. SDF still hosts Horizon testnet, and it was at v30 today.
- **VERIFIED:** RPC `getTransaction` keeps a bounded history (default 120,960 ledgers, about 7 days). Older history needs Horizon, an indexer or Hubble.
- **Recommendation for 24h:** use Horizon testnet for classic payments, account history, `paths/strict-send` and `fee_stats`. Mention RPC `sendTransaction` and `getTransaction` as the forward path. The ledger store must persist its own records anyway, because RPC retention is about 7 days. Pitch it as: "the ledger is ours; the chain is the receipt."

### 2.4 Assets: testnet USDC vs a custom asset

- **Circle testnet USDC on Stellar**, issuer `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`.
  - VERIFIED: Circle's contract-address page lists it, and Horizon testnet shows `USDC` with SAC `CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA` and 124,500 authorised accounts.
  - The mainnet issuer is `GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN`.
- **Faucet:** https://faucet.circle.com lists Stellar Testnet. It gives **20 USDC per request, one request per address+network every 2 h**. (VERIFIED)
  - Getting $1,700 of test USDC that way is impractical (85 requests).
- **Testnet DEX:** there is USDC/XLM liquidity. `paths/strict-send` for 100 XLM → USDC returned 87.7 USDC (VERIFIED live). Thin book, demo only.
- **Recommendation:** use a **custom demo asset** for the full $1,700 pool.
  - Issue `USDB` (or reuse `USDC` as the code under your own issuer, clearly labelled "demo USD") from an issuer account you control.
  - Optionally show one real Circle-testnet-USDC payout using faucet funds, to prove the code is asset-agnostic.
  - A custom issuer also lets you demo `op_no_trust` and claimable balances deterministically.

### 2.5 Operations you need (classic, no Soroban)

| Need | Operation | Notes |
|---|---|---|
| Create recipient demo accounts | `createAccount` (min 1 XLM; base reserve 0.5 XLM × (2 + subentries)). | UNVERIFIED: the 0.5 XLM reserve figure is from memory; the fees page I read does not state it. |
| Recipient accepts asset | `changeTrust` (signed by the recipient). | |
| Payout | `payment` (medium threshold). | VERIFIED (multisig page) |
| Batch payouts | Up to 100 ops per transaction; atomic, all-or-nothing. | VERIFIED: "entire transaction will fail if any operation fails". The 100-op max is UNVERIFIED (memory). |
| Payout in another asset | `pathPaymentStrictReceive` / `pathPaymentStrictSend`. | Optional; testnet DEX is thin. |
| Recipient without wallet or trustline | `createClaimableBalance` with claimants = [recipient (UNCONDITIONAL or BEFORE_ABSOLUTE_TIME), **fund account (NOT(BEFORE_ABSOLUTE_TIME) → reclaim after expiry)**]. | VERIFIED: docs recommend adding your own account as claimant to reclaim. Claim needs the trustline first, else `op_no_trust`. Each claimant adds one base reserve to the sponsor. The balance ID is in the op result and can be predicted (SHA-256 of the op ID). |
| Receipt identifier | Memo. `MEMO_TEXT` ≤ 28 bytes, `MEMO_ID` u64, `MEMO_HASH` 32 bytes, `MEMO_RETURN` 32 bytes (refunds). | VERIFIED |
| Refund (stretch) | Payment back with `MEMO_RETURN` = hash of the original tx. | VERIFIED: semantics of MEMO_RETURN |
| Expiry | Time bounds. "Highly encouraged", and essential before any resubmit. | VERIFIED |

**Memo strategy (recommended):**
- `MEMO_HASH` = SHA-256 of the canonical payout request `{event_id, rule_version, recipient, asset, amount, request_id}`.
- This lets anyone recompute the hash from the public ledger line and match it to the on-chain memo. It gives you idempotency and the receipt link in one field.
- If the transaction batches several payouts, the memo is per transaction. Use the hash of the *batch manifest*, and keep per-line hashes in the ledger. Alternatively, send one payout per transaction, which is simpler and gives clearer receipts.

Sources:
- https://developers.stellar.org/docs/learn/fundamentals/transactions/operations-and-transactions
- https://developers.stellar.org/docs/build/guides/transactions/claimable-balances

### 2.6 Fees (VERIFIED)

- The minimum inclusion fee is 100 stroops per operation (1 stroop = 1e-7 XLM). Surge pricing applies only when ledgers are full, and every included transaction pays the lowest winning bid.
- A fee-bump must bid at least 10× the original fee to replace a transaction in the queue.
- Live testnet `fee_stats` on 23 Oct 2026:
  - `last_ledger_base_fee: 100`, `ledger_capacity_usage: 0.1`, `fee_charged.mode: 100`.
  - Higher percentiles (p50 about 10,460) reflect Soroban resource fees from other users, not classic congestion.
- **For the ledger:** record `fee_charged` from the transaction result as a "network fee" line. 100 stroops is 0.00001 XLM, which is effectively $0. That makes for a strong transparency talking point against wire and remittance fees.
- Model "fees" in the rule separately: NEAR Intents spread, withdrawFee and appFee from the dry quote, plus any anchor fee.

Source: https://developers.stellar.org/docs/learn/fundamentals/fees-resource-limits-metering

### 2.7 Receipts / explorer links

- Use `https://stellar.expert/explorer/testnet/tx/<hash>`. The page returns 200; VERIFIED that StellarExpert is listed in the official explorer docs for mainnet and testnet.
- Alternatives: `https://stellar.expert/explorer/testnet/account/<G...>` and `.../claimable-balance/<id>`. The claimable-balance path is UNVERIFIED.
- Other explorers: StellarChain, steexp.com, Soroscan.
- Also link the raw Horizon JSON: `https://horizon-testnet.stellar.org/transactions/<hash>`. It is machine-checkable and anyone can verify the memo against it.

Source: https://developers.stellar.org/docs/tools/developer-tools/block-explorers.md

### 2.8 Approval before transfer: patterns ranked for 24h

1. **Co-signed vault (recommended).** VERIFIED, from https://developers.stellar.org/docs/tools/cli/agent-cli/guides/delegate-spending.md.
   - Set the fund account to master/organiser weight 2, agent signer weight 1, and low/med/high thresholds = 2.
   - The agent builds and signs (proposal XDR). The organiser signs the *same* XDR and submits.
   - Agent-only submission fails with `TxBadAuth`. Measured by SDF on testnet: "no fee was charged and the vault's sequence number was unchanged".
   - **Set low threshold = 2.** At 1, a weight-1 agent can bump the sequence and claim claimable balances alone.
   - Gotcha: the master key does not appear in the `signers` array. Its weight is the first byte of `thresholds`, and a correct vault reads `02020202`.
   - This is "not two of two": the organiser alone can still move funds.
   - **Variant worth pitching: true 2-of-2.** Organiser weight 1, agent weight 1, thresholds 2. Then *neither* party can pay alone. The organiser cannot bypass the published rule, because the agent only co-signs payouts that match the rule. This is the transparency story (UNVERIFIED as tested; follows from the threshold semantics on the multisig page).
   - For the demo, keep the organiser key on a separate "approver" page or signer (Freighter or a local key), never on screen.
2. **App-level approval only** (DB flag). Weakest; fine as a fallback.
3. **Pre-authorised transaction signer.** Add `sha256(tx)` as a signer. It is removed automatically when that transaction applies. Elegant for "organiser pre-approves this exact batch", but adds set-options round-trips. (VERIFIED semantics)
4. **Soroban allowance (SAC `approve` / `transfer_from`).** The network enforces the cap and expiry. This is delegation, *not* per-payout approval, so it does not meet "approval before any transfer". (VERIFIED)

Source: https://developers.stellar.org/docs/learn/fundamentals/transactions/signatures-multisig

### 2.9 Soroban escrow contract: worth it in 24h?

**No** for the core build (my judgement).
- Classic multisig, memos and claimable balances cover approval, receipts and no-wallet payouts with zero contract code.
- A contract adds Rust toolchain, deploy and simulate steps, and debugging risk.
- If you want "rule on-chain", the cheapest credible stretch is a tiny contract that stores `{rule_hash, target, eligible, cutoff, attestation}`. Then the published rule is anchored on-chain.
- Cheaper alternative with no contract: a `manageData` entry on the fund account (`rule_v1` = 64-byte hash), or a 0-amount self-payment with `MEMO_HASH` = rule hash. **Recommended:** it is "Funding rule published and recorded" in one transaction.
- Off-the-shelf escrow: **Trustless Work** (Soroban escrow-as-a-service). It has single and multi-release escrows, milestone approve/release endpoints, and a testnet API at `dev.api.trustlesswork.com` that returns unsigned XDR. It is also a HackMeridian partner. (REPORTED, search summary of docs.trustlesswork.com)

### 2.10 Anchors and ramps (context for "what's next"; not for the demo)

- **SEP-24** is interactive deposit/withdraw via an anchor. **SEP-31** is cross-border payments between anchors. The Anchor Platform is SDF's reference implementation. (VERIFIED existence via docs index; directory at https://anchors.stellar.org)
- **MoneyGram Ramps:** cash-in and cash-out of USDC on Stellar through third-party wallets. (VERIFIED: https://developers.stellar.org/docs/tools/ramps/moneygram.md)
  - Kenya was a 2022 launch market for MoneyGram's Stellar cash-out. (REPORTED: theblock, crowdfundinsider)
  - Later reports say 170+ countries for cash-out and that Ramps expanded to Solana. (REPORTED)
  - Honeycoin enabled USDC→cash at MoneyGram in Kenya in 2023. (REPORTED)
  - MoneyGram launched its own MGUSD stablecoin around June 2026. (REPORTED, eco.com)
- **Kenya, M-Pesa:** the Stellar Anchor Directory mentions "mobile money in Kenya". I did not confirm a live SEP-24 anchor that pays to M-Pesa. (UNVERIFIED; check anchors.stellar.org)
- **India:** I found no source confirming a Stellar anchor or MoneyGram USDC cash-out to INR. Treat it as a regulatory gap (crypto-to-INR off-ramp) and say so honestly in the pitch. (UNVERIFIED)
- **Portugal/EU:** SEPA anchors exist per the directory. (REPORTED)

### 2.11 Passkeys / smart wallets (stretch: "payouts to people without a wallet")

- **passkey-kit** (kalepail): Soroban smart wallet with secp256r1 passkey signers and a relayer for fees. Its README warns it is unaudited. A sibling `smart-account-kit` is built on audited OpenZeppelin stellar-contracts accounts. (REPORTED, npm/jsdelivr README v0.14.0)
- **Launchtube is discontinued.** Use OpenZeppelin Relayer or Stellar Channels for fee sponsorship. Testnet key from `channels.openzeppelin.com/testnet/gen`. (VERIFIED: https://developers.stellar.org/docs/tools/openzeppelin-relayer.md)
- **For 24h use claimable balances, not passkeys.** Pay a claimable balance to a fresh keypair generated for the winner, and hand over a claim link (secret delivered out-of-band, never in the repo or on screen). SDP's SMS/WhatsApp invite → wallet-registration flow is the production analogue.

---

## 3. NEAR Intents (1Click): faithful dry-quote simulation

**What it is** (VERIFIED, docs.near-intents.org): 1Click Swap is "a REST API for cross-chain swaps powered by NEAR Intents".
- It gets quotes from market makers. Funds go to a quote-specific deposit address and settle on-chain, and 1Click does not take custody.
- There is no testnet. Solvers are real market makers. (REPORTED by skills.stellar.org cross-chain skill; consistent with the brief.)

**Base URL:** `https://1click.chaindefuser.com`. OpenAPI spec at `https://1click.chaindefuser.com/docs/v0/openapi.yaml`. (VERIFIED)

| Endpoint | Purpose |
|---|---|
| `GET /v0/tokens` | Supported assets. Returned 205 tokens on 23 Oct 2026. |
| `POST /v0/quote` | Quote. `dry: true` means no deposit address. |
| `POST /v0/deposit/submit` | `{depositAddress, txHash}`. Optional speed-up. |
| `GET /v0/status?depositAddress=...` (`&depositMemo=` for memo chains) | `PENDING_DEPOSIT`, `KNOWN_DEPOSIT_TX`, `PROCESSING`, `SUCCESS`, `INCOMPLETE_DEPOSIT`, `REFUNDED`, `FAILED` |

**Auth:** JWT is optional. Without it, quotes carry an extra 0.25% fee. (VERIFIED, "Making a Request")

**Dry flag** (VERIFIED, OpenAPI): "If `true`, the response will **NOT** contain the following fields: `depositAddress`, `timeWhenInactive`, `deadline`".

**Stellar specifics:**
- Asset IDs (VERIFIED live, `/v0/tokens`, 7 decimals both):
  - XLM: `nep245:v2_1.omni.hot.tg:1100_111bzQBB5v7AhLyPMDwS8uJgQV24KaAPXtwyVWu2KXbbfQU6NXRCz`
  - USDC: `nep245:v2_1.omni.hot.tg:1100_111bzQBB65GxAPAVoxqmMcgYo5oS3txhqs1Uh1cgahKQUeTUq1TJu`. Its `contractAddress` is the *mainnet* Circle issuer `GA5Z…KZVN`.
- `depositMode`: "most chain supports only `SIMPLE` and some (for example `stellar`) only `MEMO`". With MEMO, the response carries `depositMemo`, which must be included in the deposit. (VERIFIED, OpenAPI)
- **Quote validation hits Stellar pubnet.** (VERIFIED live) A Stellar address in the quote that lacks a USDC trustline returned:
  > "Destination address does not have a trustline for this asset. Blockchain: stellar:pubnet …"

  An invalid EVM refund address returned `"refundTo is not valid"`. **So testnet G-addresses will fail.** Simulate with a fixed, real pubnet placeholder that holds a USDC trustline (read-only). Or replay a recorded response fixture and label it "dry quote, recorded 2026-10-23".

**Live dry quote A** (Base USDC → Stellar USDC, sponsor tops up the pool; 23 Oct 2026, abridged, VERIFIED):

```json
// request
{"dry":true,"swapType":"EXACT_INPUT","slippageTolerance":100,
 "originAsset":"nep141:base-0x833589fcd6edb6e08f4c7c32d4f71b54bda02913.omft.near",
 "depositType":"ORIGIN_CHAIN",
 "destinationAsset":"nep245:v2_1.omni.hot.tg:1100_111bzQBB65GxAPAVoxqmMcgYo5oS3txhqs1Uh1cgahKQUeTUq1TJu",
 "amount":"170000000","recipient":"G…(pubnet acct w/ USDC trustline)","recipientType":"DESTINATION_CHAIN",
 "refundTo":"0x…","refundType":"ORIGIN_CHAIN","deadline":"<ISO now+10m>"}
// response
{"quote":{"amountIn":"170000000","amountInFormatted":"170.0","amountInUsd":"169.92469",
  "minAmountIn":"170000000","amountOut":"1699475869","amountOutFormatted":"169.9475869",
  "amountOutUsd":"169.872300119003","minAmountOut":"1682481110","timeEstimate":50,
  "refundFee":"2400","withdrawFee":"180751"},
 "quoteRequest":{ "...echo...", "depositMode":"SIMPLE","confidentiality":"public","insured":false,
  "appFees":[{"recipient":"5880ad2b…47dd","fee":1}]},
 "signature":"ed25519:4z5beW…","timestamp":"2026-10-23T09:27:41.408Z","correlationId":"c3695eeb-…"}
```

**Live dry quote B** (Stellar USDC → Solana USDC, a winner who wants Solana payout): `depositMode:"MEMO"` was required. Result for 170 USDC:
- `amountOutFormatted: "169.955617"`
- `timeEstimate: 22` s
- `withdrawFee: "10046"`
- `refundFee: "180851"`

(VERIFIED)

**Where the cross-chain leg fits the story:**
- **(a) Inbound:** sponsor funds arrive from another chain (Base/Ethereum USDC) into the Stellar prize fund.
- **(b) Outbound:** a winner prefers USDC on another chain.

The agent shows the dry quote (amount out, fees, ETA, signature) in the proposal. The ledger records it as "simulated cross-chain leg, dry quote `correlationId`". It never sends real funds.

Quote signatures can be verified (docs page "Verify Quote Signatures"), which is a nice audit touch. I did not read that page, so the exact method is UNVERIFIED.

Sources:
- https://docs.near-intents.org/integration/distribution-channels/1click-api/quickstart/making-a-request.md
- https://1click.chaindefuser.com/docs/v0/openapi.yaml
- https://skills.stellar.org/skills/cross-chain/SKILL.md

---

## 4. HackMeridian (Lisbon, 25–26 Oct 2026)

**From the official site, VERIFIED** (https://hackmeridian.com, https://hackmeridian.com/build, https://meridian.stellar.org/hackmeridian):
- **What it is:** Stellar's builder hackathon ahead of the **Meridian 2026** conference (28–29 Oct, Lisbon).
  - The official page says it "brings together builders from around the world to turn ambitious ideas into working products on Stellar".
  - Venue: ONE16, Lisbon.
  - Organiser: the contact is at growwithguava.com (Guava), and SDF staff are mentors and speakers. The exact organising entity is not stated (REPORTED inference: Guava for SDF).
- **Schedule:**
  - Check-in Sun 25 Oct 09:00. Hacking Sun 09:00 → **Mon 26 Oct 12:00, "No late submissions."**
  - Finalists pitch live at Meridian Wed 28 Oct.
- **Prizes:** "$30,000 across 6 winners", in USD "paid in the equivalent value of XLM". No per-place breakdown.
  - A Meridian session page mentions $50,000. It is unclear which year; treat as stale. (REPORTED)
  - A luma listing mentions 500 builders. (REPORTED)
- **Paths and tracks:**
  - **Genesis** (Idea → MVP) has two tracks:
    - **Stellar Unlocked**: native protocol features such as asset issuance, the DEX and contract features.
    - **Stellar Composed**: "Pick two or more [ecosystem tools] and build what none of them could do alone".
  - **Scale** (Prototype → Product): "Yes. Scale is designed for teams pushing an existing concept further." Scale needs no track and is judged on milestones set at pre-event intake, SCF eligibility, production readiness and ecosystem impact.
- **Judging weights:**

  | Criterion | Weight |
  |---|---|
  | Track/Ecosystem Alignment | 20% |
  | User Value & Problem | 20% |
  | Technical Execution | 15% |
  | Innovation | 15% |
  | Hackathon Progress | 10% |
  | Market & Ecosystem Potential | 10% |
  | Product Design & UX | 10% |

  Priority order: "Adoption → Discovery → Continuation".
- **Submission:** demo video, pitch deck, GitHub repo, answers. A README with specs is recommended.
- **Partners:** Guava, Drips, OpenZeppelin, Stellar Passport, The Aha Company, Grant Fox, DeFindex, 57 Blocks, **Trustless Work**, XOXNO. The community list includes The Nest by NEAR.
- **Not stated on the pages I read:** rules on pre-existing code, AI use and team size are in the Terms (submissions and IP), which I did not read.

**Doubling as a baseline:**
- **Scale path:** the BASIX build *is* an existing prototype by 25 Oct. Document today's baseline (commit hash, feature list, tests, demo video), then set Scale milestones such as:
  - (1) true 2-of-2 rule-enforcing co-sign
  - (2) Trustless Work or Soroban escrow for the reserve
  - (3) a real SEP-24 anchor cash-out path for Nairobi
  - (4) SDP-style SMS claim flow
- **Genesis "Stellar Composed":** multisig + claimable balances + NEAR Intents + Trustless Work/OpenZeppelin Relayer also fits. But Genesis implies a new idea or MVP.
- **Check before choosing:** whether a project submitted to another event (BASIX) is allowed. Read the HackMeridian Terms "submissions and IP" section.
- Note the deadlines: BASIX submission is 24 Oct 13:00 Lisbon, and HackMeridian starts 25 Oct 09:00.

---

## 5. Prior art, and what is new

| Prior art | What it does | Gap vs this build | Label |
|---|---|---|---|
| **Stellar Disbursement Platform (SDP)**, SDF, open source (Go backend + React dashboard + Helm). Latest backend release 7.0.0 (2026-08-19). | Bulk payments. Org funds a distribution account → admin uploads a **CSV** → SMS/WhatsApp invite to first-time recipients → wallet signup → SEP-10/SEP-24 registration with OTP + DOB/PIN/National ID → automatic payment. Optional **Approval Flow** requiring two users (Financial Controller role). State machines: disbursement Draft→Ready→Started⇄Paused→Completed; payment Draft→Ready→Pending→Success/Failed, with Failed→Pending retry. Native SEP-10/24 built in. | No *rule reasoning* (CSV is the source of truth). No public participant-facing ledger with fees and carry-forward. No duplicate detection across requests beyond its own records. Heavy to deploy in 24h (Postgres, Kafka optional, Twilio). **Cite it as the production rail the agent could drive**, and borrow its state machine and approval vocabulary. | VERIFIED (README, admin guide, OpenAPI, GitHub API) |
| **Gitcoin Allo** | On-chain pool manager + allocation/distribution strategy contracts + registry. | EVM-only and in **maintenance mode since the Gitcoin Labs/Grants Stack wind-down (May 2025)**. | REPORTED |
| **Drips Wave** (Stellar, SDF-run) | Points-as-shares of a reward pool; withdraw to a Stellar address after KYC. | Rule is points-based; no public fee or carry-forward ledger. | REPORTED |
| **Devpost** | Collects winner forms; payouts can take "up to 60 days", batched, and blocked by one incomplete form. | This is exactly the "spreadsheet and a promise" problem. | REPORTED (forum anecdotes) |
| **Trustless Work** | Soroban escrow-as-a-service; milestone approve/release; testnet API. | Escrow primitive, not a prize ledger or rule engine. | REPORTED |
| **SCF (Stellar Community Fund)** | Tranche-based award payouts. | Didn't research specifics. | UNVERIFIED |

**What is genuinely new** (pitch framing, my analysis):
1. **Rule-as-code with a published, hashed rule.** Target, eligible count, cutoff and attestation are recorded on-chain *before* payouts (manageData or memo). The agent's proposal is derivable from the rule, so anyone can recompute it.
2. **Agent as co-signer, not just a script.** With a 2-of-2 vault the agent refuses to co-sign anything that violates the rule, and the organiser must approve every transfer. Two-party control is enforced by Stellar thresholds.
3. **Memory across events.** The agent remembers request hashes (duplicate detection), failure history (safe retry), and **carry-forward lineage**: Event 1 reserve → Event 2 opening balance, linked by transaction hash.
4. **A public ledger that reconciles to chain.** Each line covers received, paid, fees, reserve, failed or duplicate, and links to a receipt. A "verify" button re-fetches Horizon and checks the memo hash.

---

## 6. Failure modes to demo, and how to handle them

| Failure | How to trigger on testnet | Detection | Handling / ledger line | Label |
|---|---|---|---|---|
| `op_no_destination` | Pay a valid but **unfunded** G-address (fresh `Keypair.random()`). | Horizon 400 `extras.result_codes.operations: ["op_no_destination"]`; RPC FAILED + result XDR. | Do not retry blindly. Agent proposes a **claimable balance** (or `createAccount` if XLM). Ledger shows FAILED → REROUTED. | VERIFIED code meaning |
| `op_no_trust` | Pay the custom asset to a funded account with no trustline. | `op_no_trust` | Claimable balance fallback, or notify the recipient to add a trustline then retry. | VERIFIED |
| `op_underfunded` | Propose a payout larger than the fund balance (e.g. a "failing request" for $5,000). | `op_underfunded` | **Better:** the agent rejects pre-flight by checking the balance and rule budget before proposing. Show both "rejected by rule" and "rejected by network". | VERIFIED |
| `tx_bad_auth` | Agent tries to submit without organiser co-sign. | `tx_bad_auth`; no fee, sequence unchanged. | Proves the "approval before transfer" control. | VERIFIED (SDF measured) |
| `tx_bad_seq` | Two transactions built from the same loaded sequence; submit the second after the first. | `tx_bad_seq` | Reload the account, **re-derive** the transaction, re-request approval if the envelope changed. Never auto-resend a re-signed different transaction without checking the first landed. | VERIFIED code exists |
| Timeout / 504 | Simulate by killing the network call after sending. | Horizon 504: "make sure you are sending exactly the same transaction (with the same sequence number)". RPC `sendTransaction` returns `PENDING`, `DUPLICATE`, `TRY_AGAIN_LATER` or `ERROR`; `getTransaction` returns `SUCCESS`, `NOT_FOUND` or `FAILED`. | **Store the signed XDR + hash before submit.** On timeout, poll `getTransaction(hash)` or `GET /transactions/<hash>`. If NOT_FOUND and before `maxTime`, resubmit the *same* XDR (safe: same hash and sequence, can apply at most once). After `maxTime`, mark EXPIRED and re-propose. | VERIFIED |
| `tx_too_late` | Organiser approves after the time bound expires (e.g. 5-minute timeout). | `tx_too_late` | Re-propose with a fresh time bound; ledger records "approval expired". | VERIFIED code exists |
| **Duplicate request** | Submit the same payout request twice. | (1) Request hash already in the store, status PAID. (2) Belt and braces: search the fund account's payments for `memo_hash` = request hash (`GET /accounts/<fund>/transactions?order=desc`). | Return the original receipt; ledger line "DUPLICATE → original tx <hash>". | Design (UNVERIFIED as tested) |
| Agent JSON parse error → false "failed" | — | SDF warns that merging stderr into stdout makes a successful send look failed, and a retry becomes "a confirmed double-spend". | Always confirm on-chain by hash before any retry. | VERIFIED |
| Cross-chain quote failure | Dry quote with a recipient lacking a trustline, or a bad refund address. | 1Click 4xx `"Destination address does not have a trustline…"` / `"refundTo is not valid"`. | Ledger line "cross-chain leg not quotable"; fall back to a Stellar-native payout. | VERIFIED live |

**Idempotency rule set**
- `request_id = sha256(canonical_json(request))`.
- Unique index on `request_id`.
- State machine: PROPOSED → APPROVED → SUBMITTED(hash, xdr) → SETTLED | FAILED(code) | EXPIRED, plus DUPLICATE and REJECTED_BY_RULE.
- The memo carries `request_id`, or the batch hash.
- Before any (re)submit, check by hash on-chain.

---

## 7. Recommended minimal 24h architecture

```
[Published rule JSON] --sha256--> rule_hash --(manageData "rule:<event>" or MEMO_HASH tx)--> Stellar testnet
        |
[Omega agent: payout coordinator]
   memory: ledger store (SQLite/JSON) — requests, proposals, approvals, tx, failures, carry-forward
   tools:  stellar.balance / stellar.buildPayment / stellar.buildClaimable / stellar.submit / stellar.lookup
           ledger.append / ledger.find(request_hash)
           nearIntents.dryQuote (live call with pubnet placeholder, or recorded fixture)
   reasoning: apply rule -> award budget & reserve; detect duplicates; preflight (exists? trustline? balance?)
        |
   proposal (XDR signed by agent key, weight 1)
        |
[Organiser approval page] -- organiser signs same XDR (weight 1-2) --> submit (Horizon testnet)
        |
[Public ledger page] received / paid / fees / failed / duplicate / reserve-carried; each line -> stellar.expert link + Horizon JSON + memo-hash verify
```

**Accounts** (all testnet; secrets in `.env`, gitignored; show only public keys):
- `ISSUER`: the demo USD asset.
- `FUND_E1`: the event-1 prize fund, configured as a multisig vault.
- `FUND_E2`: the next-event fund.
- `AGENT`: signer key.
- `ORGANISER`: master / co-signer.
- 6 winner accounts: some with trustline, one with no trustline, one unfunded.
- `SPONSOR`: the source of the "received" lines.

**Funding rule (event 1, matches the brief):**
- Pool $1,700, target 50, eligible 20, cutoff timestamp, organiser attestation.
- `release = min(1, eligible/target) = 0.40` → awards $680, reserve $1,020 before fees.
- Real BASIX history reported: 6 winners, $1,000 carried forward. Next event paid $560 (170/140/110/70/70).
- **Demo carry-forward:**
  - The reserve transfer `FUND_E1 → FUND_E2` carries a memo referencing `rule_hash_E1`.
  - The E2 ledger opens with "carried forward from E1 (tx …)".
  - Then E2 payouts of 170/140/110/70/70 are shown.

### Exact calls (JS, `@stellar/stellar-sdk@17.3.0`)

```js
import { Horizon, Keypair, Asset, Operation, TransactionBuilder, Networks, Memo, Claimant, BASE_FEE } from "@stellar/stellar-sdk";
const server = new Horizon.Server("https://horizon-testnet.stellar.org");

// fund: GET https://friendbot.stellar.org?addr=<G...>   (then createAccount for others)
const USD = new Asset("USDB", ISSUER_PUB);

// 1) vault multisig (organiser signs)
Operation.setOptions({ signer: { ed25519PublicKey: AGENT_PUB, weight: 1 } })
Operation.setOptions({ masterWeight: 1, lowThreshold: 2, medThreshold: 2, highThreshold: 2 }) // true 2-of-2

// 2) publish rule
Operation.manageData({ name: "rule:basix-e1", value: Buffer.from(ruleHashHex, "hex") }) // ≤64 bytes

// 3) proposal (agent builds + signs)
const acct = await server.loadAccount(FUND_E1);
const tx = new TransactionBuilder(acct, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
  .addOperation(Operation.payment({ destination: W1, asset: USD, amount: "170.0000000" }))
  .addMemo(Memo.hash(requestIdHex))
  .setTimeout(900) // 15-min approval window -> tx_too_late after
  .build();
tx.sign(agentKp); const proposalXdr = tx.toXDR();  // store with request_id

// 4) organiser approves: TransactionBuilder.fromXDR(proposalXdr, Networks.TESTNET).sign(orgKp)
// 5) submit + persist hash first: const hash = tx.hash().toString("hex"); await server.submitTransaction(tx)
//    on error: e.response.data.extras.result_codes  -> {transaction, operations[]}
// 6) receipts: https://stellar.expert/explorer/testnet/tx/<hash> ; GET /transactions/<hash> (memo, fee_charged)

// no-wallet / no-trustline fallback
Operation.createClaimableBalance({ asset: USD, amount: "70", claimants: [
  new Claimant(W6, Claimant.predicateBeforeAbsoluteTime(String(expiry))),
  new Claimant(FUND_E1, Claimant.predicateNot(Claimant.predicateBeforeAbsoluteTime(String(expiry))))
]})
```

**Other calls:**
- `GET /fee_stats` for live fees.
- `GET /accounts/<fund>/payments` and `/transactions` for reconciliation.
- The NEAR dry quote: `POST https://1click.chaindefuser.com/v0/quote` with `dry:true`. Stellar origin needs `depositMode:"MEMO"`.

### 24h build order

1. **Hour 0–3:** testnet accounts script (idempotent), demo asset, vault multisig, rule hash on-chain.
2. **Hour 3–9:** ledger store + agent tools + proposal / approve / submit with persisted XDR and hash.
3. **Hour 9–13:** failure paths: no_trust → claimable, no_destination, underfunded pre-flight, duplicate, timeout re-check.
4. **Hour 13–17:** public ledger page with receipts, verify-memo button, carry-forward E1→E2.
5. **Hour 17–20:** NEAR dry-quote tool and fixture.
6. **Hour 20–24:** record demo, README with architecture, tests and baseline (for HackMeridian).

**Boundaries:**
- Keep secrets in `.env` only, add a gitignore plus a pre-commit grep for `^S[A-Z2-7]{55}$`, and never print secrets.
- NEAR leg is dry only.

---

## Key source URLs

- **Raven:**
  - https://developers.stellar.org/docs/tools/developer-tools/building-with-ai
  - https://github.com/stellar-experimental/stellar-raven
  - https://raven.stellar.org/docs
- **Networks:** https://developers.stellar.org/docs/networks/index.md
- **APIs, Horizon status:** https://developers.stellar.org/docs/data/apis
- **Fees:** https://developers.stellar.org/docs/learn/fundamentals/fees-resource-limits-metering
- **Multisig:** https://developers.stellar.org/docs/learn/fundamentals/transactions/signatures-multisig
- **Agent approval patterns:** https://developers.stellar.org/docs/tools/cli/agent-cli/guides/delegate-spending.md
- **Agent CLI troubleshooting (double-spend warning):** https://developers.stellar.org/docs/tools/cli/agent-cli/reference/troubleshooting.md
- **Claimable balances:** https://developers.stellar.org/docs/build/guides/transactions/claimable-balances
- **Memos:**
  - https://developers.stellar.org/docs/learn/fundamentals/transactions/operations-and-transactions
  - https://developers.stellar.org/docs/build/guides/transactions/pooled-accounts-muxed-accounts-memos
- **Errors and statuses:**
  - Payment result codes: https://developers.stellar.org/docs/data/apis/horizon/api-reference/errors/result-codes/operation-specific/payment
  - Horizon timeout: https://developers.stellar.org/docs/data/apis/horizon/api-reference/errors/http-status-codes/horizon-specific/timeout
  - RPC sendTransaction: https://developers.stellar.org/docs/data/apis/rpc/api-reference/methods/sendTransaction
  - RPC getTransaction: https://developers.stellar.org/docs/data/apis/rpc/api-reference/methods/getTransaction
- **USDC:**
  - https://developers.circle.com/stablecoins/usdc-contract-addresses
  - https://faucet.circle.com
- **SDP:**
  - https://github.com/stellar/stellar-disbursement-platform-backend
  - https://developers.stellar.org/docs/platforms/stellar-disbursement-platform/admin-guide/overview
- **Ramps:**
  - https://developers.stellar.org/docs/tools/ramps/moneygram.md
  - https://anchors.stellar.org
- **Relayer:** https://developers.stellar.org/docs/tools/openzeppelin-relayer.md
- **NEAR Intents:**
  - https://docs.near-intents.org/integration/distribution-channels/1click-api/quickstart/making-a-request.md
  - https://1click.chaindefuser.com/docs/v0/openapi.yaml
  - https://skills.stellar.org/skills/cross-chain/SKILL.md
- **HackMeridian:**
  - https://hackmeridian.com
  - https://hackmeridian.com/build
  - https://meridian.stellar.org/hackmeridian
- **Omega context:** a BASIX SJIT Chennai deck describes Omega as an optional tool alongside SingularityNET MeTTa/Hyperon. Only REPORTED; Omega itself was not researched here. https://docs.google.com/presentation/d/1I6ZGw4iQT873Z-TEIkCSs70He-CXkobB/htmlpresent
