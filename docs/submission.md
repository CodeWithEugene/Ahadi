# Submission: Paste-Ready Fields For BASIX.MARKET (Draft)

> Entry form: https://www.basix.market/lms/buildathon/4/submission. **Changes save automatically**, so paste final text only. Limits are from the form's HTML (see [info.md](info.md) §10.1). Numbers marked ⟨…⟩ are filled in from the real build and test run before submitting. Deadline **15:00 EAT, Saturday 24 October**; target 13:30 EAT.

---

## Project Title (max 80)

Ahadi

## Tagline (max 140)

An Omega agent that pays prize winners from a published rule, only with approval, and shows every dollar on a public Stellar ledger.

*(132 characters; limit 140.)*

## Live Demo

https://ahadi.codewitheugene.top

## Slide Deck (optional)

⟨link to a short deck, if made⟩

## GitHub Repository (pre-filled)

https://github.com/CodeWithEugene/AI-OMEGA-AGENT-DEV-BUILDATHON (**make public before submitting**). Also pushed to `BASIXmarket-io/omniversity-b4-technetians`.

## Demo Video

Upload `Ahadi-Demo.mp4` (≤ 3:00, 1080p, H.264). Start the upload by 14:00 EAT at the latest.

## Description (120 to 4,000 characters, Markdown)

**Track:** Global payouts and prize transparency · **Entry type:** New build · **Team:** Technetians (Eugene Mutembei, solo, Nairobi)

**The problem.** Prize funds are usually a spreadsheet and a promise. BASIX's first fund was USD 1,700 for 50 teams; fewer than half qualified, six teams earned prizes and USD 1,000 rolled forward. The headline was public; the rule behind it, each payout, its fees and its receipt were not provable by participants, and cross-border payouts can fail or duplicate without a trace.

**What Ahadi does.** Ahadi ("promise" in Kiswahili) is a SingularityNET Omega agent that coordinates a prize fund on Stellar testnet:
1. The organiser publishes the funding rule before registration; Ahadi records its hash on the fund account.
2. At cutoff, Ahadi derives every amount from the rule in MeTTa (20 of 50 eligible → 40% → USD 680 for six places, USD 1,020 reserved), with a visible trail.
3. It runs pre-flight checks, proposes each payout and signs its half. The fund needs two signatures (agent + organiser), so the agent alone gets `tx_bad_auth` from Stellar ⟨and, once the vault test passes: neither can pay alone⟩.
4. The organiser approves; payouts settle in seconds; every ledger line links to its testnet receipt, and its memo is the request's hash.
5. Failures and duplicates are handled: an unactivated wallet's prize is held as a 30-day claimable balance; a repeated request gets the original receipt (ledger check plus Ahadi's memory); an injected "ignore the rule" message is refused.
6. A winner who wants another chain gets a NEAR Intents dry quote (simulated, as the track requires).
7. The reserve moves to the next event's fund with a receipt, and in a fresh session Ahadi remembers where every dollar went. The public ledger balances: received = paid + held + carried.

**How it works.** Omega ⟨version⟩ runs in Docker with ⟨provider/model⟩ on its websocket channel; a bridge relays the web console and Telegram into it. Custom Omega skills are its only tools (`ahadi-*`: rule, derive, check, propose, reroute, ledger, near-quote, carry-forward); the funding rule and checks are MeTTa; Omega's long-term memory stores requests, payouts, failures and events. A ledger service stores proposals and signed transactions; a Next.js site shows the public ledger, the organiser console, the agent's activity and a verify page. The LLM reads and writes language only; it never chooses an amount or a signature.

**Evidence.** ⟨N⟩ tests pass (rule maths, idempotency, failure mapping, 2-of-2 approval, injection refusal, carry-forward). All five track checklist items run on testnet; hashes in `docs/evidence.md`. Raven (Stellar's MCP server) was used for Stellar development help.

**Simulated or mocked.** Stellar testnet and a demo USD asset; the NEAR Intents leg is a dry quote; all people, teams and wallets are fictional.

**What's next.** Real USDC on mainnet; organiser keys in a hardware or browser wallet; 2-of-3 approvals; cash-out to M-Pesa through Stellar anchors (to confirm per country); driving the Stellar Disbursement Platform for bulk payouts; running BASIX's next event on it.

**AI disclosure.** Built with Claude Code (Anthropic, Claude Opus 5.5) and subagents for research, planning, docs and code, as the brief allows; details in `AI_DISCLOSURE.md`.
