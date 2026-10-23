# Problem: What We Could Build, What We Chose, And Why

> **Purpose.** Lay out the four tracks as options, score them against the event's own selection criteria, explain the choice of Track 02, and state the chosen problem precisely, with evidence. Evidence labels: **VERIFIED** (primary source read), **REPORTED** (secondary source), **UNVERIFIED**.
>
> **Last updated:** Friday 23 October 2026.

---

## Table Of Contents

1. [The Problem In One Paragraph](#1-the-problem-in-one-paragraph)
2. [How We Chose](#2-how-we-chose)
3. [What The Organisers Asked For](#3-what-the-organisers-asked-for)
4. [The Four Options](#4-the-four-options)
5. [Scoring And Decision](#5-scoring-and-decision)
6. [The Chosen Problem In Depth](#6-the-chosen-problem-in-depth)
7. [Evidence: Why Prize Payouts Are Hard](#7-evidence-why-prize-payouts-are-hard)
8. [Why Existing Solutions Do Not Solve It](#8-why-existing-solutions-do-not-solve-it)
9. [Why This Problem Wins This Buildathon](#9-why-this-problem-wins-this-buildathon)
10. [The Hard Questions (And Our Answers)](#10-the-hard-questions-and-our-answers)
11. [What We Are Deliberately Not Solving](#11-what-we-are-deliberately-not-solving)

---

## 1. The Problem In One Paragraph

BASIX.MARKET runs hackathons for builders in Lisbon, Nairobi and Chennai and pays the winners from prize funds that grow, shrink and roll over. Its first fund was USD 1,700 sized for 50 teams; fewer than half qualified, six teams earned prizes and USD 1,000 rolled forward (VERIFIED, BASIX platform). The headline was public. What a participant could not do was check it: see the rule before registering, match each payout and its fees to a receipt, or trace the carried-forward money into the next fund (our reading; we have no inside knowledge of how BASIX paid). The track states it plainly: "Prize funds are usually a spreadsheet and a promise … Cross-border payouts fail, duplicate, or get stuck, and nobody can trace why." The organiser needs a way to **publish the rule before registration, pay winners on three continents only with approval, handle failures and duplicates, and show every dollar**, and the participants need a way to **check it without trusting anyone**.

---

## 2. How We Chose

### 2.1 The goal

Be selected to pitch to Ben Goertzel, and build something the track's organisation would adopt ([win-strategy.md](win-strategy.md) §1).

### 2.2 Criteria (weighted by the event's own selection criteria, plus feasibility)

| Criterion | Weight | Source |
|---|---|---|
| Working execution achievable solo in about 26 hours, with test evidence | 30% | Brief: "Working execution — a useful flow that works, backed by test evidence" |
| Track fit: a clear user problem and credible benefit for that organisation | 25% | Brief |
| Omega integration: a meaningful agent role we can explain | 25% | Brief |
| Demo and docs: a clear, filmable story | 20% | Brief |
| Adjustments | ± | Competition in the track; relevance to judges; our prior strengths; risk |

### 2.3 Method

1. Read all four track pages verbatim (snapshot §3 to §6).
2. Researched each track's organisation, data sources, prior art and the past winners (research notes).
3. Scored each track 1 to 10 per criterion, weighted, and adjusted for competition and risk.
4. **Time constraint:** the team page locked at kickoff (12:30 EAT). The event page's registration form still accepted an update; with Eugene's approval we saved Track 02 at 12:35 EAT, on an early read that this analysis confirms below.

---

## 3. What The Organisers Asked For

Three signals run through the brief and all four tracks:

1. **"A real problem for a real organisation … so your work has a user from day one."** Track fit is judged by people close to those organisations; the tracks come from the "XRAGENCY portfolio".
2. **"Omega must do real work … A chatbot wrapper does not count."** Show role, memory or reasoning, and tools.
3. **Evidence and honesty:** "backed by test evidence"; "Label every mocked component"; "Evidence and disclosures — test results, data sources, AI tools used, known limitations"; "If someone else cannot run it from your README, it is not finished."

And one signal unique to Track 02: **the user is BASIX itself, and the example rule is BASIX's own history.**

---

## 4. The Four Options

| # | Track | The problem in their words | What a top entry looks like | Main risk for us |
|---|---|---|---|---|
| 01 | Biomedical research assistance (Rejuve.bio) | "Research findings are scattered across papers … Researchers need an assistant that preserves these differences and explains what the evidence actually supports." | Omega plans literature searches (Europe PMC, PubMed), extracts interventions, populations, comparators, outcomes with verbatim quotes; flags conflicts (e.g. time-restricted eating trials disagreeing) and insufficient evidence; reuses memory in a new session | HelixMind (2nd in hackathon 1, team "HelixClaw") and Rejuve's own `BioClaw` are natural rivals here; quote accuracy must be perfect; a pure-literature task makes MeTTa reasoning optional ("PLN and numerical scoring are not required") |
| **02** | **Global payouts and prize transparency (BASIX)** | "Prize funds are usually a spreadsheet and a promise … Cross-border payouts fail, duplicate, or get stuck, and nobody can trace why." | A rule hashed on chain before registration; an agent that derives, remembers and co-signs; network-enforced approval; receipts; failures and duplicates handled; carry-forward traced | Stellar-native teams may be stronger on chain mechanics; Omega needs a bridge to a web UI |
| 03 | Builder and marketplace workflows (BASIX) | "Builders earn badges and finish challenges, then wait … Nobody can see why a builder was matched to a project." | One workflow (e.g. submission review against a brief, or builder-side discovery) with Open Badges checks and memory | "Bar to beat: Venture Route" (4th; 321 commits by three people over about 11 days, 1,000+ tests). Hard to look new |
| 04 | Player and club coordination (WorldTennis.app) | "A match takes a dozen messages … Players coming from different countries use different rating systems. Courts sit empty." | Match proposal with reasons, conflict re-plan, two-party confirmation before a labelled simulated booking; rating translation | Lower stakes; Omega authenticates one owner, so two-player confirmation is awkward; less to explain about memory |

Track research detail: [research-notes/other-tracks-and-past-winners.md](research-notes/other-tracks-and-past-winners.md). Track 02 detail: [research-notes/stellar-raven-near-hackmeridian.md](research-notes/stellar-raven-near-hackmeridian.md).

---

## 5. Scoring And Decision

### 5.1 Scores (1 to 10)

| Criterion (weight) | 01 Research | **02 Payouts** | 03 Marketplace | 04 Tennis |
|---|---|---|---|---|
| Working execution in 26 h, testable (30%) | 6 | **8** | 7 | 8 |
| Track fit: user problem and benefit (25%) | 8 | **10** | 8 | 7 |
| Omega integration: meaningful role (25%) | 7 | **9** | 7 | 6 |
| Demo and docs: filmable story (20%) | 7 | **9** | 6 | 8 |
| **Weighted total** | **6.95** | **8.95** | **7.05** | **7.25** |
| Competition adjustment | −0.5 (HelixMind, BioClaw) | 0 | −0.5 (Venture Route) | 0 |
| **Adjusted** | **6.45** | **8.95** | **6.55** | **7.25** |

### 5.2 Why the scores

- **Execution (02 = 8):** every checklist item maps to a well-documented Stellar primitive (multisig, memo, claimable balance, `manageData`) documented by SDF (Horizon testnet itself was checked live on 23 Oct; the operations are tested in the build). Tests are natural (rule maths, idempotency, failure mapping). The risk is the Omega bridge, which we reduce by design ([build.md](build.md) §3).
- **Track fit (02 = 10):** the judges own the problem; the example rule reproduces their own fund; the users (Lisbon, Nairobi, Chennai builders) include us.
- **Omega (02 = 9):** the track literally specifies an agent with a role (coordinator), memory ("remembers every request and payout") and reasoning ("reasons over the funding rule; detects duplicates and failures"). That is Omega's design brief. Our differentiator: the agent is a **co-signer** whose MeTTa rules decide whether it signs.
- **Story (02 = 9):** money moving, a refusal, a failure rescued, a duplicate caught, a ledger that balances: concrete and filmable in 3 minutes.

### 5.3 Decision

**Track 02, Global payouts and prize transparency, New build.** Saved on the platform at 12:35 EAT (platform: "Your registration is up to date").

---

## 6. The Chosen Problem In Depth

### 6.1 Problem statement

> An organiser paying prize winners on several continents has no way to commit to the payout rule in advance, prove that each payout followed it, prevent a payout without a second approval, handle failed and duplicate payouts without losing track, or show participants and sponsors where every dollar went, including what rolled into the next event.

### 6.2 Who suffers, and who acts

| Who | How they suffer today | What they need |
|---|---|---|
| **Organiser** (BASIX events team) | Manual spreadsheets; one person with the bank login; repeated "did you pay me?" messages; failed transfers that must be chased; no clean way to prove carry-forward | A coordinator that derives, proposes, remembers and records; approvals that are fast but deliberate |
| **Winners** in Nairobi, Chennai, Lisbon | Slow, costly cross-border transfers on small amounts; no status; no proof; some lack a ready wallet or account | A receipt, a status, and a way to receive even without a wallet today |
| **Non-winning participants and next-event registrants** | Cannot see the pool, the rule or the rollover | A public ledger and a rule published before they register |
| **Sponsors** | Cannot see whether their money was used as promised | Received and paid lines they can check |

### 6.3 What "solved" looks like (measurable, for a pilot at a real BASIX event)

| Measure | Target |
|---|---|
| Rule published before registration opens | 100% of events |
| Payouts with organiser approval and agent co-signature | 100% |
| Ledger lines with a verifiable receipt | 100% of money movements |
| Duplicate payouts | 0 |
| Failed payouts left unresolved after 7 days | 0 (each held, rerouted or returned) |
| Time from approval to settlement | < 1 minute on Stellar |
| Fee per payout (network) | < USD 0.01 |
| Carry-forward traceable from one event's ledger to the next | 100% |

---

## 7. Evidence: Why Prize Payouts Are Hard

> Evidence collected on 23 October 2026. Full notes, with sources: [research-notes/problem-evidence.md](research-notes/problem-evidence.md).

### 7.1 Sending small prizes across borders is expensive

| Fact | Figure | Label |
|---|---|---|
| Global average cost of sending USD 200 (World Bank Remittance Prices Worldwide, Issue 54, Sept 2025) | **6.36%**, against the SDG 10.c target of 3% by 2030 | VERIFIED |
| Sub-Saharan Africa, the most expensive region | **8.46%** | VERIFIED |
| South Asia (and India as a receiving country) | **5.30%** | VERIFIED |
| Banks, the most expensive provider type | **14.99%** | VERIFIED |
| Corridor averages: USA→Kenya / USA→India / Germany→India | **4.26%** / **3.68%** / **6.53%** | VERIFIED |
| A single bank wire USA→India (Citibank flat fee) | **USD 35 = 17.5% of USD 200**; on a USD 70 prize that is **50%** (our arithmetic) | VERIFIED fee; arithmetic ours |
| Outgoing international wire (Bank of America) | **USD 45**, "1 to 5 business days" | VERIFIED |
| PayPal Kenya | receives; **3.0%** conversion markup; withdrawal **2.0% + USD 1.50** | VERIFIED (page updated 28 Sept 2026) |
| Portugal→Kenya and Portugal→India corridors | **not tracked** by the World Bank | VERIFIED |
| Speed target: 75% of remittances available within 1 hour by end-2027 (G20/FSB) | FSB, 9 Oct 2025: the 2027 timetable is "unlikely" to be met | VERIFIED |

**For a USD 70 to 170 prize to Nairobi or Chennai, fixed fees alone can take 20% to 50%.** On Stellar testnet the network fee is 100 stroops (0.00001 XLM), and settlement takes about 5 seconds.

### 7.2 Hackathon prizes are slow and opaque

| Fact | Label |
|---|---|
| Devpost: payouts "can take **up to 60 days** from receipt of paperwork"; W-8BEN with a real signature required; team prizes go to one representative; undeliverable prizes risk "fees… delaying or forfeiting" | VERIFIED |
| DoraHacks / TRON terms: paid "60 days after form submissions" | VERIFIED (May 2023) |
| Superteam Earn: paid within 7 days after KYC, but external sponsors may pay off-platform | VERIFIED |
| Documented delayed or unpaid cases: Devpost/monday.com (2020), HackaTRON (June 2023), a Vercel hackathon (May 2026) | REPORTED |
| A statistic on how often hackathon prizes go unpaid | **Not found.** We cite cases, not a rate |

### 7.3 Payments fail and duplicate

| Fact | Label |
|---|---|
| Failed payments cost **USD 118.5bn** in 2020; **60%** of organisations lost customers over them (LexisNexis Risk Solutions / Accuity, 2021) | VERIFIED |
| Duplicate or erroneous payments: **0.8% to 2%** of disbursements, median 1.5% (APQC; by count, not value) | VERIFIED |

### 7.4 Transparency precedents fall short

Open Collective, the Stellar Community Fund, Optimism Retro Funding, Gitcoin, Superteam Earn and Devpost each publish part of the picture. **None of them shows a rule published before registration together with per-payout fees and a reserve carried forward to the next event** (research note §5).

### 7.5 Honest limits for "what's next"

- **Kenya:** the VASP Act took effect in late 2025 (sources disagree: 21 Oct or 4 Nov); regulations were gazetted 22 July 2026; existing operators must be licensed by about 4 Nov 2026 (REPORTED). A live Stellar-USDC to M-Pesa cash-out today is **UNVERIFIED**.
- **India:** 30% tax on crypto gains and 1% TDS kept in Budget 2026 (REPORTED); the tax treatment of a crypto-paid prize is unconfirmed.
- **EU / Portugal:** MiCA transition ended 1 July 2026 (ESMA, VERIFIED); USDC is MiCA-compliant (Circle, VERIFIED).


---

## 8. Why Existing Solutions Do Not Solve It

| Option | What it does well | What it misses for this problem |
|---|---|---|
| Spreadsheet + bank wire / PayPal / Wise | Familiar; real cash-out | No published rule, no proof, single point of trust, costly and slow on small cross-border amounts, failures chased by hand |
| Devpost-style platform payouts | Collect winner forms at scale | Reported payout timelines of weeks; one missing form blocks a batch; nothing public (REPORTED) |
| **Stellar Disbursement Platform (SDF)** | Production bulk payouts from a CSV; SMS or WhatsApp invites; wallet registration; optional two-user approval; retries | No rule reasoning (the CSV is the truth); no participant-facing ledger with fees and carry-forward; heavy to deploy (VERIFIED from its repo and docs). **Ahadi could drive it in production** |
| Gitcoin Allo, Drips, bounty platforms | Public allocation for grants and bounties | Points or round mechanics, not a prize rule with eligibility ratio and carry-forward; Allo is in maintenance mode since the Grants Stack wind-down (REPORTED) |
| An LLM agent with a payment tool | Conversational | Unverifiable, inconsistent and injectable decisions about money: the problem, automated |

---

## 9. Why This Problem Wins This Buildathon

1. **The judges own it.** BASIX wrote the track about its own fund; its founders are the likely reviewers.
2. **It answers every line of the brief.** Role, memory, reasoning and tools are exactly what the track lists, and the checklist gives five unambiguous acceptance tests.
3. **It is verifiable by the panel.** Every claim is a testnet transaction anyone can open.
4. **It shows Omega as more than a wrapper.** The agent's MeTTa rules decide whether it signs; its memory matters across sessions and events.
5. **It is personal and true.** Eugene won hackathon 1 (Mizani) from Nairobi and builds for the next winners (anything about how he was paid only if he confirms it).
6. **It continues our winning pattern** (rules as atoms, a contestable trail, separation of roles) in a new domain.

---

## 10. The Hard Questions (And Our Answers)

| Question | Answer |
|---|---|
| "Isn't this just a Stellar script?" | No: the decision layer is Omega (MeTTa rules + memory), the agent is a co-signer, and conversation with organisers and winners runs through Omega's channel. The script parts are Omega skills |
| "Why should the agent hold a key at all?" | So that a payout outside the published rule cannot be signed even by the organiser. Two keys, two different checks: the rule (agent) and judgment (organiser) |
| "What if the agent's key is compromised?" | It cannot pay alone (threshold 2). Rotate it with the organiser's signature plus a recovery signer in production |
| "Real winners need cash, not testnet tokens." | Agreed; that is the next step (anchors and MoneyGram ramps for Kenya; India needs a regulated route, to confirm). The track asks for testnet |
| "Is the 'rule before registration' real?" | The rule hash is written on chain with a ledger timestamp; the registration-open time is a ledger line after it; anyone can compare |
| "What about tax, KYC, sanctions?" | Out of scope for the prototype and stated in Limitations. In production, an anchor or SDP's registration flow handles KYC |

---

## 11. What We Are Deliberately Not Solving

- Real-money movement, fiat cash-out, KYC, tax forms, sanctions screening.
- Judging itself (we take placements and eligibility as attested inputs).
- Multi-organiser governance beyond one approver (2-of-3 is in What's Next).
- Smart-contract escrow (Soroban); classic Stellar features are enough for every checklist item.
- A wallet product; we use claimable balances and point winners to existing wallets.
