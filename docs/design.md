# Design: Name, Brand, Domain, UI And Screens

> **Purpose.** Everything about how Ahadi looks, reads and feels: the name, the domain, the design principles, tokens, every screen and component, copy rules, accessibility, and how the UI must read on camera. The build spec ([build.md](build.md)) implements this. The user journeys behind it are in [user-journeys.md](user-journeys.md).
>
> **Last updated:** Friday 23 October 2026, about 14:00 EAT.

---

## 1. The Name: Ahadi

| | |
|---|---|
| **Name** | **Ahadi** |
| **Meaning** | Kiswahili for **"promise"** (also "pledge", "commitment"). Pronounced *ah-HAH-dee* |
| **Why** | The track's problem statement says prize funds are "a spreadsheet and **a promise**." Ahadi is the promise, kept in public. It continues our naming line (Mizani, "balance"; Sawa, "fair, agreed"), all Kiswahili and all short and pronounceable in Lisbon and Chennai |
| **Tagline (primary)** | **Every prize promise, kept in public.** |
| **Tagline (alternates)** | "A prize is a promise. Ahadi makes it one anyone can check." · "Every dollar has a receipt." · "The agent can't pay alone. Neither can the organiser." (use only once the 2-of-2 vault test passes) |
| **One-line description** | An Omega agent that applies a published prize-fund rule, co-signs only the payouts the rule allows, waits for the organiser's approval, pays on Stellar testnet, and keeps a public ledger where every line links to a receipt |
| **Collisions checked** | "Ahadi" is a common Kiswahili word used by several Kenyan organisations (for example NGOs and savings groups). We use it as a product name inside a hackathon, with no trademark claim. **UNVERIFIED** whether any payments company uses it as a registered mark; check before any commercial use |

---

## 1.1 The Logo (as built)

A banknote rosette seal holding a lowercase-weight "A". The A's two legs are **the two keys**: Ahadi's in indigo (`--agent`), the organiser's in amber (`--organiser`). The crossbar is a **green tick** (`--note`): a payout settles only where both signatures meet. The scalloped guilloché edge comes from security printing on banknotes, the visual language of a promise to pay. Files: `web/public/logo-mark.svg`, `web/public/icon.svg`; React component `Seal` in `web/components/ahadi/brand.tsx` (the rosette is generated from a polar curve, so it stays crisp at any size). It replaced a first sketch of two interlocking rings, which read too much like an existing payment-network mark.

## 2. Domain And Hosting

| Item | Value |
|---|---|
| **Product URL** | **https://ahadi.codewitheugene.top** |
| API (if the backend runs on a server) | https://ahadi-api.codewitheugene.top |
| DNS | `codewitheugene.top` is on Cloudflare with wildcard DNS (VERIFIED 23 Oct: `ahadi.codewitheugene.top` already resolves to Cloudflare and returns 525 because no origin is attached yet). Same pattern as `mizani.` and `sawa.codewitheugene.top`, which are served by Vercel behind Cloudflare (VERIFIED: `x-vercel-cache` header) |
| Web hosting | Vercel (Next.js), as for Mizani and Sawa. Add the domain in the Vercel project; Cloudflare CNAME to `cname.vercel-dns.com` if the wildcard is not enough |
| Agent hosting | Omega cannot run on Vercel (long-running Docker). Options in [build.md](build.md) §16 |

---

## 3. Design Principles

1. **Open books.** The public ledger is the product's face. A participant who never logs in sees everything: what came in, what went out, what it cost, what is held, what moved to the next event.
2. **Every number explains itself.** Any amount on screen can be clicked to see the rule that produced it, the agent's derivation, and the receipt.
3. **Show the separation of powers.** Agent proposes, organiser approves, Stellar enforces, the public verifies. Each role has its own colour and icon, used consistently everywhere.
4. **Failure is a first-class state.** Failed, duplicate, rejected and rerouted lines look as finished and deliberate as paid ones. Nothing is hidden.
5. **Testnet, always visible.** A permanent banner: "Stellar testnet · No real money". Simulated parts carry a "Simulated" chip.
6. **Calm, editorial, financial.** It should feel like a well-typeset statement of accounts, not a crypto dashboard. No gradients-for-the-sake-of-it, no coin icons, no neon.
7. **Readable on camera.** Base font 16 px, key numbers 32 to 56 px, high contrast, light mode for the video.

---

## 4. Design Tokens

Implemented as CSS variables in Tailwind v4 (`app/globals.css`), with shadcn/ui components, in the same setup as Mizani and Sawa.

### 4.1 Colour

| Token | Light | Dark | Use |
|---|---|---|---|
| `--background` | `#FAF8F4` (paper) | `#0E1116` | Page |
| `--foreground` | `#14181F` (ink) | `#ECEDEF` | Text |
| `--muted` | `#EFECE6` | `#1A1F27` | Table stripes, cards |
| `--border` | `#E2DED6` | `#2A303A` | Rules, cell borders |
| `--primary` | `#1F3A5F` (deep ledger blue) | `#8FB3E8` | Primary actions, links |
| `--paid` | `#1E7A4F` (green) | `#4CC38A` | Settled payouts, receipts, "balanced" |
| `--pending` | `#B26B00` (amber) | `#F2B24B` | Awaiting organiser approval |
| `--held` | `#5B5BD6` (indigo) | `#9B9BF5` | Claimable balance (waiting for recipient) |
| `--reserve` | `#4A5568` (slate) | `#A0AEC0` | Reserve, carry-forward |
| `--failed` | `#B42318` (red) | `#F97066` | Failed at network |
| `--rejected` | `#7A2E8C` (plum) | `#D18BE3` | Rejected by rule (never sent) |
| `--duplicate` | `#6B7280` (grey) | `#9CA3AF` | Duplicate (linked to original) |
| `--simulated` | `#0E7490` (teal) | `#5BC0D6` | Simulated cross-chain quote |
| `--testnet` | `#FFF4D6` bg / `#7A5200` text | `#2B2410` / `#F2C14B` | Testnet banner |

**Role colours** (one per actor, used for icons, avatars and timeline lanes):

| Role | Colour | Icon (lucide) |
|---|---|---|
| Agent (Omega) | `--primary` | `Bot` |
| Organiser | `--pending` (amber) | `ShieldCheck` |
| Stellar network | `--foreground` | `Network` |
| Public / participant | `--paid` | `Eye` |

Every colour is paired with an icon and a text label; colour is never the only signal.

### 4.2 Type

| Use | Font | Size / weight |
|---|---|---|
| UI text | Geist Sans | 16 / 400; labels 14 / 500 |
| Headings | Geist Sans | H1 40 / 650, H2 28 / 600, H3 20 / 600 |
| Big numbers (fund equation, totals) | Geist Sans, `tabular-nums` | 40 to 56 / 650 |
| Amounts in tables | Geist Mono, `tabular-nums`, right-aligned | 15 / 500 |
| Hashes, keys, XDR, MeTTa | Geist Mono | 13 / 400, truncated middle (`GABC…XY7Q`) with copy button |

Amounts always show currency and precision: `USD 170.00` in UI; the asset code (`USDB` on testnet) on receipts.

### 4.3 Space, radius, motion

- 4 px grid; cards `rounded-xl`; tables `rounded-lg` with 1 px borders.
- Motion only to show change: a ledger row slides in and its status chip cross-fades (150 ms); the fund equation bar animates its segments when a payout settles (400 ms ease-out). Respect `prefers-reduced-motion`.

---

## 5. Signature Components

| Component | What it shows | Notes |
|---|---|---|
| **Fund Equation** | `Received = Paid + Fees + Held + Reserved (+ Available)` as one horizontal stacked bar with big numbers under each segment; a "Balanced ✓" badge when the equation closes to the cent | The hero visual and the final shot of the video |
| **Rule Card** | The funding rule in plain language, its parameters (pool, target, eligible, cutoff, place splits), the SHA-256 rule hash, "Recorded on Stellar" link, organiser attestation, and a **Verify** button that recomputes the hash in the browser | Also renders the MeTTa atoms behind a "Show the rule as MeTTa" toggle |
| **Derivation Trail** | For any amount: the chain `rule → release = 20/50 = 40% → award pool = 1,700 × 40% = 680 → 1st place 25% → 170.00` as a vertical list of steps, each with the MeTTa rule name | Opens in a side sheet from any number |
| **Proposal Card** | Recipient (name, city, wallet), asset, amount, route (direct / claimable / cross-chain simulated), fees and quote, pre-flight checks (account exists, trustline, within budget, not paid before, rule version), the agent's signature status, the organiser's signature status, **Approve and sign** / **Reject** | The approval moment in the video |
| **Signature Meter** | Two slots: Agent (weight 1) and Organiser (weight 1) against threshold 2; fills as each signs; shows `tx_bad_auth` when the agent submits alone | Makes multisig understandable in two seconds |
| **Ledger Table** | Time, type chip, party, amount, fees, status chip, receipt link, verify | Filters by type; sticky totals footer; CSV and JSON export |
| **Status Chip** | Paid, Awaiting approval, Held (claimable), Reserved, Failed, Rejected by rule, Duplicate, Simulated, Expired | Icon + colour + label |
| **Receipt Panel** | Transaction hash, ledger number, time, memo (hash), fee charged, source and destination, links: stellar.expert and raw Horizon JSON; "Memo matches request ✓" check | One per ledger line at `/receipt/[id]` |
| **Agent Activity Stream** | Omega's actions in order: messages received (channel), skills called (name, arguments, result), memory written or recalled, MeTTa derivations, refusals | Lanes coloured by role; collapsible raw view of Omega's log line |
| **Checklist Strip** | The five Track 02 showcase items, each turning green with a link to its evidence | Top of the organiser console; drives the demo |
| **Testnet Banner** | "Stellar testnet · No real money · Cross-chain legs are simulated" | Always visible; cannot be dismissed |

---

## 6. Information Architecture

Two faces: **public** (no login, the participant's view) and **organiser console** (demo-gated). Derived from [user-journeys.md](user-journeys.md).

| Route | Audience | Purpose |
|---|---|---|
| `/` | Everyone | The promise in one screen; live snapshot of the current fund (Fund Equation); "See the ledger"; how it works in four steps; the five guarantees |
| `/funds/[eventId]` | Participants, public | **The public ledger** for one event: Rule Card, Fund Equation, Ledger Table, carry-forward in and out |
| `/funds` | Everyone | All events as a chain: event 1 → event 2 with the carry-forward link between them |
| `/rules/[eventId]` | Participants | The rule, its hash, when it was published (before registration), the attestation, and Verify |
| `/receipt/[lineId]` | Anyone with a link | One line with its full proof (Receipt Panel, Derivation Trail, request hash) |
| `/verify` | Sceptics, judges | Paste a transaction hash or a request; Ahadi fetches Horizon and shows what matches and what does not |
| `/claim/[code]` (P1) | A winner without a wallet | Explains the held payout, how to create a wallet and claim, and the expiry date. No secret is ever shown |
| `/console` | Organiser | Checklist Strip; proposals queue (Proposal Cards); approve and sign; failures and duplicates; chat with the agent |
| `/console/agent` | Organiser, judges | Full Agent Activity Stream, memory browser (what Ahadi remembers), Omega health (container, provider, version) |
| `/how-it-works` | Technical reviewers | Architecture diagram, the Omega skills, the MeTTa rules, the Stellar account design (vault thresholds), test evidence |
| `/trust` | Everyone | Safety model, what is simulated, data used, limitations, security notes |
| `/about` | Everyone | Team, buildathon, credits, AI disclosure, roadmap |

Global layout: Testnet Banner; top bar (Ahadi wordmark, Funds, Verify, How It Works, Trust, Console); footer (repo link, buildathon credit, "Built on Omega by SingularityNET · Stellar testnet").

---

## 7. Screens In Detail

### 7.1 `/` Home

- **Hero:** "Every prize promise, kept in public." Sub: "Ahadi is an Omega agent that pays hackathon winners from a published rule, only with the organiser's approval, and shows every dollar on a public ledger." Buttons: **See The Ledger**, **How It Works**.
- **Live Fund Equation** for the current event.
- **Four steps:** Publish the rule → The agent proposes → The organiser approves → Everyone can check.
- **Five guarantees** (each a card with an icon): The rule is public before anyone registers · No payout without two signatures · Every payout has a receipt · Failures and duplicates are recorded, not hidden · What is not spent moves to the next event, on the record.
- **Built on** strip in text only (Omega by SingularityNET, MeTTa, Stellar testnet). No logos (brief: use brands only as the track shows).

### 7.2 `/funds/[eventId]` Public Ledger (the participant's hero)

Top to bottom:
1. Event header: name, city list (Lisbon · Nairobi · Chennai), dates, status (Registration, Judging, Paying, Closed).
2. Rule Card (collapsed: one sentence and the hash with a green "Recorded before registration ✓").
3. Fund Equation.
4. Ledger Table with filters (All, Received, Paid, Held, Fees, Failed, Duplicate, Reserve).
5. "Carried forward to Event 2 →" card with the receipt.
6. Export (CSV, JSON) and "Verify everything" (runs the browser check over all lines).

### 7.3 `/console` Organiser Console (the demo's main screen)

Three-column layout on desktop (stacked on mobile):
- **Left:** Checklist Strip (vertical) and event selector.
- **Centre:** the queue: Proposal Cards awaiting approval at the top; then recent settled, failed and duplicate items.
- **Right:** Agent Activity Stream (live) and a chat box that talks to the same Omega agent as Telegram.

Primary actions: **Publish Rule**, **Attest Eligible Teams**, **Ask Ahadi To Propose Payouts**, **Approve And Sign**, **Reject**, **Carry Forward Reserve**. Each action asks for confirmation and states exactly what will be signed.

### 7.4 `/console/agent` What Ahadi Knows

- Memory browser: what the agent remembers, grouped (events, rules, requests, payouts, failures), each with the time it was written.
- Activity stream (full), with a "raw Omega log" toggle.
- Omega health: container up, Omega version, LLM provider and model, last cycle time, skills loaded.

### 7.5 `/verify`

- One input: "Paste a Stellar testnet transaction hash, or a ledger line ID."
- Result: what Horizon says (time, amount, accounts, memo, fee) and what Ahadi's ledger says, side by side, with ✓ or ✗ for: amount, recipient, memo equals request hash, rule hash at the time, signatures (agent and organiser both present).

---

## 8. Copy Rules

- Plain English; short sentences; no crypto jargon in the public views ("wallet", "receipt", "held for you" rather than "claimable balance entry").
- **No dashes in user-facing strings** (our house style from Sawa); Title Case for titles and buttons.
- Money: `USD 170.00`; never "$170" without the code on receipts; always say "testnet" next to Stellar.
- Statuses as verbs the participant understands: "Paid", "Waiting for organiser", "Held for you until 23 Nov", "Not sent: over the rule's budget", "Already paid: see the original receipt".
- The agent speaks in the first person in the activity stream ("I checked the rule. This request is over the remaining budget by USD 20.00, so I will not sign it.") and never claims to have moved money it has not.
- Kiswahili: winner notifications for Nairobi recipients in English and Kiswahili (P1). Eugene reviews every Kiswahili string.

---

## 9. Accessibility

- WCAG 2.2 AA contrast for all tokens above (check with the shadcn theme checker before recording).
- Keyboard-reachable everything; visible focus rings; `aria-live="polite"` on the activity stream and ledger updates.
- Hashes have accessible labels ("transaction hash, starts with A B 1 2").
- Tables have captions and header scopes; totals announced.

---

## 10. On Camera

- Record in light mode at 1440 × 900, browser zoom 110%.
- Hide the bookmarks bar and extensions; no `.env`, no terminal with keys. Terminal panes show only `docker compose ps` and Omega logs with secrets redacted.
- The Checklist Strip is visible in every console shot so viewers can track progress through the five items.
- Final frame: the Fund Equation reading "Balanced ✓" with the carry-forward receipt, and the URL `ahadi.codewitheugene.top`.
