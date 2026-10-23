<p align="center"><img src="web/public/logo.svg" alt="Ahadi" width="320"></p>

<p align="center"><b>Every prize promise, kept in public.</b></p>

| | |
|---|---|
| **Track** | **Global payouts and prize transparency** (Track 02, Omega payouts) |
| **Entry type** | **New build** (repository started 23 October 2026; everything here is new work from 23 to 24 October) |
| **User problem** | Prize funds are usually a spreadsheet and a promise. Participants cannot see the rule behind the payouts, what each winner got, what it cost or what rolled into the next event, and cross-border payouts fail, duplicate or get stuck with no trace |
| **Live product** | https://ahadi.codewitheugene.top |
| **Event** | BASIX.MARKET AI Omega Agent Dev Buildathon, session 01, 23 to 24 October 2026 (online from Nairobi) |
| **Team** | Technetians: Eugene Mutembei (solo) |

> **Stellar testnet only. No real money moves.** Payments use a demo dollar asset on testnet; the cross-chain leg is a NEAR Intents dry quote (simulated). Every person, team and wallet is fictional sample data.

---

## What Ahadi does

Ahadi ("promise" in Kiswahili) is a **SingularityNET Omega agent** that coordinates a hackathon prize fund for an organiser such as BASIX.MARKET, whose builders are in Lisbon, Nairobi and Chennai.

1. **The rule goes on record before registration.** The funding rule (pool, target teams, release in proportion to eligible teams, place shares, claim window, carry-forward) is hashed with SHA-256 and the hash is written to the fund's Stellar account (`manageData`).
2. **Ahadi derives every amount in MeTTa.** For the October fund: 20 of 50 target teams qualified, so 40% is released: USD 680.00 for six places (170.00, 136.00, 108.80, 95.20, 88.40, 81.60) and USD 1,020.00 reserved for the next event.
3. **Two keys sign.** Each event fund is a 2-of-2 Stellar vault: the fund's own key is switched off, and Ahadi's key and the organiser's key each carry weight 1 against a threshold of 2. Ahadi only adds its signature to payouts its MeTTa rules allow; the organiser approves in the browser, where their key stays.
4. **Every payout has a receipt.** Each ledger line links to its testnet transaction, whose memo is the SHA-256 fingerprint of the payout request.
5. **Failures and duplicates are handled and recorded.** A winner whose wallet was never activated gets the prize held as a 30-day claimable balance; a repeated request gets the original receipt; a message that tries to override the rule is refused on the rule's own checks.
6. **The reserve is carried to the next event** with a receipt, and Ahadi recalls it from long-term memory in a fresh session.

### The five track checklist items

| Checklist item (track page) | Where to see it |
|---|---|
| Funding rule published and recorded | `/funds/october-2026` rule card (fingerprint recomputed in your browser); the `rule` ledger line and its transaction |
| Approval before any transfer | `/how-it-works#two-keys`; the "Single key refused" ledger line (`tx_bad_auth`, nothing moved); `bridge/tests/test_chain_vault.py` |
| Every payout linked to a receipt on the ledger | Every `paid` and `held` line on `/funds/october-2026`; `/receipt/<line>` "Check it against the chain"; `/verify` |
| Failed and duplicate requests handled | `held` line (wallet never activated), `duplicate` line (Tomás asks again), `rejected` line (injected request) |
| Carry-forward to the next event traceable | `carried_out` line on October, `carried_in` line on `/funds/december-2026`, linked by one receipt |

## What Omega does (and what it does not)

| Part | Does | Never does |
|---|---|---|
| **Omega agent** (SingularityNET Omega, Docker) | Runs the agent loop, talks to the organiser through its websocket channel (the web console and a Telegram relay both feed it), decides which skill to call, remembers facts in long-term memory | |
| **MeTTa rules** (`omega/plugins/ahadi/ahadi.metta`) | Derive the award pool, reserve and every prize; decide allowed or refused with nine named checks; choose the route (direct, held, cross-chain simulated); choose the next step after a network failure | |
| **The language model** (via Omega's provider: OpenRouter, GLM 5.3 or Kimi K3) | Reads messages, picks skills, writes replies | Choose an amount, a recipient, or whether to sign |
| **Bridge** (`bridge/`, FastAPI) | Serves the web app and the event stream; executes skills; re-checks every MeTTa decision with a Python mirror and refuses to sign unless both agree; holds Ahadi's testnet key; talks to Stellar and NEAR | Hold the organiser's key |
| **Organiser** (browser) | Loads their key file into the tab and signs approved transactions | |

**Omega skills** added by the plugin: `ahadi-status`, `ahadi-publish-rule`, `ahadi-derive`, `ahadi-propose`, `ahadi-request`, `ahadi-try-alone`, `ahadi-reroute`, `ahadi-carry-forward`, `ahadi-quote`, `ahadi-verify`. Omega's own `remember`, `query`, `episodes`, `send` and `metta` stay on; `shell`, file writing and `websearch` are removed for this agent.

## Evidence

| Test | What it proves | Result |
|---|---|---|
| `make test` (36 tests) | Rule maths to the cent, money conservation over 300 random rules, rule validation, canonical hashing, all nine money-gate checks, the injected request failing three ways, routes, failure routing | **36 passed** |
| `make test-metta` (2 tests, 60 decision vectors + 20 derivations) | The MeTTa rules, run on PeTTa inside the Omega image, agree with the Python mirror on every decision, every failed check and every amount. This test caught and fixed one real disagreement during the build | **2 passed** |
| `make test-chain` (7 tests, live testnet) | Vault is 2-of-2; Ahadi alone, the organiser alone and the disabled master key each get `tx_bad_auth` with nothing consumed; both together pay; resubmitting a signed envelope cannot pay twice; an unactivated wallet fails with `op_no_destination` and a claimable balance works | **7 passed** |
| `make scenario` | The whole October story through the engine on testnet; both event ledgers balance against the chain to the cent | **passes** |
| Browser end-to-end (Playwright, real Omega on GLM 5.3) | Organiser loads key, asks Ahadi to propose, approves six payouts with in-browser signing, relays a duplicate and an injected message, carries the reserve forward | see `docs/evidence.md` |

Full results, transaction hashes and limitations: [docs/evidence.md](docs/evidence.md).

## Run it yourself

Prerequisites: Docker Desktop, Python 3.12 with [uv](https://docs.astral.sh/uv/), Node 20+ with pnpm, and an LLM key (OpenRouter, Anthropic, ASI:One or ASI Cloud).

```bash
git clone https://github.com/CodeWithEugene/Ahadi.git && cd Ahadi
cp .env.example .env              # add OPENROUTER_API_KEY (or another provider's key)
make setup                        # creates and funds Stellar testnet accounts; writes .keys/ (git-ignored)
make scenario                     # optional: runs the full October story on testnet without the LLM
make up                           # builds and starts the bridge and the Omega agent (Docker Compose)
make web                          # web app on http://localhost:3000
```

Then open http://localhost:3000/console, load `.keys/organiser.key` with **Choose key file**, and ask Ahadi to propose the payouts. Reset to a fresh fund at any time with `make reset`.

The first `make up` builds Ahadi's Omega image on top of `singularitynet/omega:v0.1.20` (about 7.4 GB; the pull takes several minutes).

### Dependencies (pinned)

| Component | Version |
|---|---|
| SingularityNET Omega | image `singularitynet/omega:v0.1.20` with Omega `main` source at commit `63a78265be9b8efc6e47cc39f3b4bc7a13e06ed5` (native LLM tool calling) |
| MeTTa runtime | PeTTa v1.0.4 (inside the image) |
| Bridge | Python 3.12, FastAPI 0.120, `stellar-sdk` 16.1.1, httpx, sse-starlette |
| Web | Next.js 16.3, React 19.2, Tailwind CSS 4, shadcn/ui, `@stellar/stellar-sdk` 17.3.0 |
| Network | Stellar testnet (Horizon `https://horizon-testnet.stellar.org`), NEAR Intents 1Click API (dry quotes only) |

### Mocked or simulated (labelled everywhere in the product)

| Component | Status |
|---|---|
| Money | Stellar **testnet**; demo dollar asset `USDB` from our own testnet issuer |
| Cross-chain payout leg | NEAR Intents **dry quote** (live API call, `dry: true`, no deposit address; recorded fixture as fallback). NEAR Intents has no testnet |
| People, teams, wallets, sponsor | Fictional sample data (`data/scenario.json`) |
| Organiser accounts and login | A demo console passcode and a key file instead of real accounts |
| Telegram | Relayed by the bridge into Omega's single channel (optional, needs a bot token) |
| BASIX.MARKET services | Not called. Fund totals mirror BASIX's public hackathon 1 figures and the track's example rule |

## Repository map

| Path | What |
|---|---|
| `omega/` | Ahadi's Omega image: `Dockerfile`, config, prompt, and the plugin `plugins/ahadi/` (MeTTa rules + skills + Python glue) |
| `bridge/` | FastAPI bridge: engine, ledger store, Stellar operations, NEAR dry quotes, Omega websocket channel, log reader, tests |
| `web/` | Next.js product: landing, public ledger, receipts, verify, organiser console, agent view, developers, how it works, trust, about |
| `scripts/` | Testnet setup, scenario runner, reset, development helpers, secret scan |
| `data/` | Sample scenario and the recorded NEAR quote fixture |
| `docs/` | Planning and research (info, problem, solution, build, design, win strategy, demo script, evidence) |

## Contributors

- **Eugene Mutembei** (Team Technetians, Nairobi): product, direction, review, keys, demo.

## Credits and prior work

- SingularityNET **Omega** (Apache-2.0), **PeTTa**, the Stellar Development Foundation's SDKs, Horizon, StellarExpert and **Raven** (dev help), NEAR Intents 1Click API, shadcn/ui, Familjen Grotesk, Hanken Grotesk and JetBrains Mono.
- Patterns from our earlier BASIX entries **Mizani** (1st place, hackathon 1) and **Sawa**: an Omega plugin with `add-skill`, rules as MeTTa atoms, the docs structure. No code from them was copied except generated shadcn/ui component scaffolding in `web/components/ui/`.
- **AI use:** built with Claude Code (Anthropic, Claude Opus 5.5), as the brief invites. Details in [AI_DISCLOSURE.md](AI_DISCLOSURE.md).

## Licence

MIT, see [LICENSE.md](LICENSE.md). Security: [SECURITY.md](SECURITY.md). Contributing: [CONTRIBUTING.md](CONTRIBUTING.md).
