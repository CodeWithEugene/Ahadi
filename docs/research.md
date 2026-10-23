# Research Log And Evidence Library: Ahadi

> **Purpose.** What we researched, how, when, what we found, and where the detail lives. Every planning doc cites this file or a note under [research-notes/](research-notes/). Labels throughout: **VERIFIED** (read on a primary source, or run by us), **REPORTED** (secondary source or summary), **UNVERIFIED** (inference or not found).
>
> **When:** Friday 23 October 2026, 12:10 to 13:15 EAT (Lisbon 10:10 to 11:15), the first hour of the build window.

---

## 1. Method

| Workstream | How | Output |
|---|---|---|
| The event, end to end | Logged-in BASIX.MARKET session in the in-app browser: event page, brief, all four track pages, team page, submission form, events page, hackathons history, LMS Omega course, teammate board; read via page text and same-origin fetches (no form typed except the approved registration update) | [source/basix-platform-snapshot-2026-10-23.md](source/basix-platform-snapshot-2026-10-23.md) (verbatim) |
| Omega framework | Fresh clone of `singnet/Omega` (main `63a7826`), source reading, `docker pull` of `singularitynet/omega:latest`, **real loop run in Docker** with a stand-in LLM, a websocket channel server and a custom plugin; restart test for memory | [research-notes/omega-framework.md](research-notes/omega-framework.md); harness in [research-notes/omega-harness/](research-notes/omega-harness/) |
| Track 02 technology | Official Stellar docs, live Horizon testnet calls, npm/PyPI versions, Raven repo and health checks, **two live NEAR Intents dry quotes**, HackMeridian pages | [research-notes/stellar-raven-near-hackmeridian.md](research-notes/stellar-raven-near-hackmeridian.md) |
| People, partners, competition | Luma page, GitHub API (Omega contributors, BASIX org repos), Ben Goertzel's Substack, ASI docs, partner sites, BASIX "Our Winners" | [research-notes/people-partners-competition.md](research-notes/people-partners-competition.md) |
| The other three tracks | Partner sites, literature APIs tested live, Venture Route repo cloned and read, rating systems, booking market | [research-notes/other-tracks-and-past-winners.md](research-notes/other-tracks-and-past-winners.md) |
| Problem evidence | World Bank Remittance Prices Worldwide (read in a browser), bank and PayPal fee pages, Devpost/DoraHacks/Superteam terms, LexisNexis and APQC studies, Kenya/India/EU regulation | [research-notes/problem-evidence.md](research-notes/problem-evidence.md) |
| Our own history | Read `../../Basix-Hackathon/docs` (Mizani) and `../../Sawa/docs` | Lessons in [info.md](info.md) §17 |

Tools: Claude Code (Opus 5.5) with four research subagents running in parallel, the in-app browser (logged in as Eugene), `gh`, `docker`, `curl`, `dig`.

---

## 2. Research Questions And Answers

| # | Question | Answer | Label | Where |
|---|---|---|---|---|
| Q1 | What exactly must we submit, by when? | Working prototype (mocked parts labelled), README (track, entry type, problem, setup, deps, contributors, new work), 3-minute demo, evidence and disclosures; **13:00 Lisbon = 15:00 EAT Sat 24 Oct**; form needs title (80), tagline (140), description (120 to 4,000), **video file upload** | VERIFIED | info §10 |
| Q2 | How is it judged? | 30% working execution with test evidence; 25% track fit; 25% Omega integration; 20% demo and docs | VERIFIED | info §11 |
| Q3 | Which track? | Track 02, saved 12:35 EAT; scored 8.95 vs 7.25 next best | VERIFIED (save); scoring ours | problem §5 |
| Q4 | Who owns Track 02's problem? | BASIX.MARKET; its own hackathon 1 fund is the example rule | VERIFIED | info §7 |
| Q5 | Does Omega really run here, and how do we integrate a web UI? | Yes: ran in Docker with a websocket channel to our server, custom plugin skills, memory surviving restart. No HTTP API; bridge pattern | VERIFIED | omega notes §3, §4 |
| Q6 | What changed in Omega since our last two entries? | Native LLM tool calling on `main` (14 Oct) not yet in the published image; workflows with live reload; memory export/import; docs partly stale | VERIFIED | omega notes §1 |
| Q7 | What is Raven? | SDF's remote MCP server for AI agents: `search` + sandboxed `execute`; dev help only, does not transact | VERIFIED | stellar notes §1 |
| Q8 | Can approval be enforced by the network? | Yes: multisig thresholds; agent-alone submit gets `tx_bad_auth`, no fee | VERIFIED (SDF docs measured) | stellar notes §2.8 |
| Q9 | Can we simulate NEAR Intents faithfully? | Yes: `dry: true` quotes, no key; but validation runs on Stellar mainnet, so use a placeholder or fixture | VERIFIED (live quotes) | stellar notes §3 |
| Q10 | Will testnet receipts survive judging? | Yes: next testnet reset 16 Dec 2026 | VERIFIED | stellar notes §2.1 |
| Q11 | Is the problem real? | Sending USD 200: 6.36% global, 8.46% Sub-Saharan Africa; bank wires USD 35 to 45 flat; Devpost "up to 60 days"; duplicate payments 0.8% to 2% of disbursements | VERIFIED | problem §7 |
| Q12 | Who are we up against? | No competitor repos visible; past winners Venture Route, TrustDeal, HelixMind set the bar | VERIFIED (visibility); inference on likely entries | people notes §8 |
| Q13 | What does the pitch audience value? | Ben Goertzel: inspectable symbolic layer, durable memory, agents not "grading [their] own homework"; iCog: skills, memory, injection safety; XRAgency: "secure first", "on chain, on camera" | REPORTED / VERIFIED | people notes §2, §3, §5 |
| Q14 | Is HackMeridian a follow-on opportunity? | Scale path accepts existing projects; 25 to 26 Oct, Lisbon; prize pool stated as USD 30,000 (site) or 50,000 (session page); terms on prior entries unread | VERIFIED / REPORTED | stellar notes §4 |

---

## 3. Key Facts By Topic (Condensed)

### 3.1 The event
See [info.md](info.md). Highlights: no cash; selected teams pitch to Ben Goertzel; videos may screen at Web Summit (9 to 12 Nov); remote teams present live and keep a recorded backup; "If someone else cannot run it from your README, it is not finished."

### 3.2 Omega (VERIFIED unless noted)
- Image `singularitynet/omega:latest` = v0.1.20, 7.39 GB; pull took 7 min 11 s here; container to first loop ~4 s; ~460 MiB RAM idle.
- Must run with a TTY; numeric settings in `config.yaml`, not CLI.
- Skills: `remember, query, episodes, pin, shell (5 s limit), read-file, write-file, …, send, websearch, version, nop, metta`; plugins add skills with `add-skill`; all tool arguments are strings.
- Memory: ChromaDB long-term + `history.metta` episodic; persists in the volume; atoms added at runtime do **not** persist (`&persistent` is referenced in a skill text but undefined).
- Logs: `REQUEST`, `RESPONSE … LLMToolCall`, `COMMAND_RETURN`, `[LLM_USAGE]` lines, parseable.
- Default LLM loop budget: 50 turns per new message, plus a burst at boot; set 6 to 10 for demos.
- ASI providers built in: `ASIOne` (`asi1-ultra`), `ASICloud` (`minimax/minimax-m3`); the launcher's default provider is ASICloud.
- UNVERIFIED: behaviour with real Anthropic/OpenAI tool calling (no keys used in research).

### 3.3 Stellar, Raven, NEAR (VERIFIED unless noted)
- Horizon testnet v30, protocol 29; JS SDK 17.3.0; Python SDK 16.1.1; base fee 100 stroops; ~5 s ledgers.
- Testnet USDC faucet: 20 per 2 hours per address, so we issue our own demo asset.
- Claimable balances for unactivated or trustline-less recipients, with fund reclaim after expiry.
- Memo hash (32 bytes) = request hash: idempotency and receipt link in one field.
- Stellar Disbursement Platform is the production prior art (CSV, SMS invites, wallet registration, optional two-user approval); no rule reasoning or public carry-forward ledger.

### 3.4 People and context
- Omega's current contributors include iCog developers (Amar Asfaw, Bereket Eshete, Biruktawit Wolde) and Surafel Fikru (past judge, parser hardening against injected commands).
- Luma lists Beyond The Code as host; differs from the brief on seats and session-2 venue.
- Hackathon 1 winners: Mizani, HelixMind, TrustDeal Agent, Venture Route, AgriGuide, ActionDesk.

### 3.5 Problem evidence
See [problem.md](problem.md) §7.

---

## 4. What We Reuse From Our Earlier Wins

| From | What | How it carries over |
|---|---|---|
| Mizani (1st, hackathon 1) | Omega plugin pattern (`loadOmegaPlugin`, `add-skill` for assess / why / update-rule); rule packs as atoms; proof and audit trail; shadcn design discipline; docs structure | Same plugin API, now exposed as native tools; the derivation trail is the payments version of Mizani's proof |
| Sawa (hackathon 2) | Product-site structure (public pages + trust + developers); copy rules (no dashes, Title Case); evidence labelling; video workflow | `design.md` IA and copy rules |
| Both | Winning process: literal fit, visible reasoning, deployed product, tight video, complete disclosure | `win-strategy.md` |

Prior work will be named in the README's credits; no prior code is copied into this New build without being listed.

---

## 5. Gaps And Limits

1. **No real-LLM Omega run yet** (no keys during research). First build task: timed test with Anthropic and ASI:One.
2. Anthropic's OpenAI-compatible endpoint with `strict` tools and `tool_choice: required` is untested.
3. The review panel is not published.
4. How BASIX actually paid hackathon 1 prizes is unknown to us; only Eugene can say.
5. HackMeridian terms on projects entered elsewhere not read.
6. A live Stellar-USDC to M-Pesa cash-out route in Kenya today is unconfirmed; India has no confirmed Stellar off-ramp.
7. The BASIX-shared repo is not visible until Eugene connects GitHub.
8. The HelixMind repo was not found (irrelevant to Track 02).

---

## 6. Source Index (Primary)

- BASIX platform: https://www.basix.market/lms/buildathon/4 (and `/tracks/*`, `/team`, `/submission`), `/lms/hackathons`, `/lms/events`
- Luma: https://luma.com/1s715pz4
- Omega: https://github.com/singnet/Omega (main `63a7826`; release v0.1.20)
- Stellar: https://developers.stellar.org/docs/networks · /docs/learn/fundamentals/transactions/signatures-multisig · /docs/tools/cli/agent-cli/guides/delegate-spending.md · /docs/build/guides/transactions/claimable-balances · /docs/tools/developer-tools/building-with-ai
- Raven: https://github.com/stellar-experimental/stellar-raven
- NEAR Intents 1Click: https://1click.chaindefuser.com/docs/v0/openapi.yaml
- SDP: https://github.com/stellar/stellar-disbursement-platform-backend
- HackMeridian: https://hackmeridian.com · https://meridian.stellar.org/hackmeridian
- World Bank RPW: https://remittanceprices.worldbank.org
- Full URL lists are at the end of each research note.
