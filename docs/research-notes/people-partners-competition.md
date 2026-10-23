# People And Context: AI Omega Agent Dev Buildathon (Lisbon, Oct 2026)

Researched 23 Oct 2026 (day 1 of session 1). All URLs accessed 23 Oct 2026 unless stated.

Labels:
- **VERIFIED**: read directly on a primary source (the official page, the GitHub API, or a source file).
- **REPORTED**: from secondary coverage, or a primary page summarised through a fetch tool.
- **UNVERIFIED**: inferred, or found nowhere.

This report does not repeat the judge biographies in `Sawa/docs/research.md` §5 or `Basix-Hackathon/docs/info.md` §16–18. It adds only what is new.

---

## 0. Top findings

1. **Omega already ships ASI:One and ASI Cloud providers** (VERIFIED, `singnet/Omega` README and `config/config.yaml`, HEAD 63a7826, 22 Oct 2026):
   - `-p ASIOne` reads `ASIONE_API_KEY` and uses `asi1-ultra` at `https://api.asi1.ai/v1`.
   - `-p ASICloud` reads `ASI_API_KEY` and uses `minimax/minimax-m3` at `inference.asicloud.cudos.org`.
   - The repo has a dedicated `memory/prompt_ASICloud.txt`, and ASICloud is also an embedding provider.
   - The default provider is still `Anthropic` (`claude-opus-4-8`).
   - Running Omega on ASI:One or ASI Cloud is one flag and costs no code. It is the cheapest "Omega integration" and goodwill signal on offer.
2. **The Luma page and the official page disagree** (VERIFIED, https://luma.com/1s715pz4):

   | | Luma | Official page |
   |---|---|---|
   | Session 2 venue | Fintech House by Unicorn Factory Lisboa | HealthHub |
   | Seats per session | 25 | 20 |
   | Pitch audience | "founders of BASIX.MARKET and the CEO of the ASI Alliance" | CEO of Superintelligence |
   | Tracks | Not named | Named |

3. **Session 1 timing in our time zone** (VERIFIED, https://www.basix.market):
   - basix.market lists it as "kicks off 23 Oct 2026 12:30 GMT+3 – 24 Oct 19:00 GMT+3", location "online, TBD". That is 10:30 to 17:00 Lisbon time, in Nairobi time.
   - Luma gives 10:30 AM to 5:00 PM on both days. Day 1 is for building; day 2 is the showcase.
4. **"Raven" is Stellar's MCP gateway, not a wallet or payments rail** (VERIFIED, https://raven.stellar.org):
   - Endpoint: `https://raven.stellar.org/mcp`.
   - Two tools: `search` and `execute`. `execute` runs JavaScript in a sandbox with no network access.
   - Sign-in is a one-time browser OAuth. No service API keys are needed.
   - **NEAR Intents has no testnet** (REPORTED, https://skills.stellar.org/skills/cross-chain/SKILL.md). That is why the track says "simulated".
   - The 1Click API returns a quote and a deposit address. Stellar deposits need a memo.
5. **Ben Goertzel's newest Omega framing** (VERIFIED, his Substack, Oct 2026):
   - The LLM is the slow, expensive part.
   - The symbolic layer (AtomSpace and MeTTa) holds inspectable, editable knowledge and durable task state ("Context Frames", `petta-memory`).
   - Self-improvement comes through code and knowledge, not weights.
   - "A plain LLM harness tends to lose the thread on a hard problem"; Omega "kept the investigation coherent".
   - Purplebots stop agents from "grading its own homework".

---

## 1. Luma event page (VERIFIED, https://luma.com/1s715pz4)

**Title and hosts**
- Title: "AI OMEGA Developer Buildathon - Lisbon".
- Organiser/host: **Beyond The Code**, Luma profile usr-hV7CntIcKjvjzWb. The profile joined May 2024 and shows 14 events hosted.
- Billing: "Presented by BASIX.MARKET, featuring AI OMEGA agents from BASIX.MARKET and the ASI Alliance". "Powered by BASIX.MARKET and the Artificial Superintelligence Alliance".
- Support: "Live online guidance from iCog Labs developers".

**Sessions**

| Session | Dates | Venue | Status |
|---|---|---|---|
| Week 1 | 23–24 Oct | HealthHub by Unicorn Factory Lisboa | Ticket sales ended |
| Week 2 | 29–30 Oct | **Fintech House** by Unicorn Factory Lisboa | Registration open |

- Hours: 10:30–17:00 on all days. The exact address is shown only after approval; the map pin is roughly 38.714, -9.137 (central Lisbon).

**Agenda**
- Day 1 is for building. Day 2 is the showcase.
- Teams can make a "showreel to pitch to the founders of BASIX.MARKET and the CEO of the ASI Alliance".
- Beyond The Code films the day-2 showcases. Selected videos go on beyondthecode.ai and BASIX.MARKET.

**Other details**
- 25 developer seats per session; registration needs approval.
- Breakfast, lunch and snacks are included.
- **No prizes listed. No updates posted.** Tracks are not named on Luma.

---

## 2. iCog Labs: who is working on Omega now

### 2.1 Organisation
- iCog Labs is an AI R&D company in Addis Ababa and contributes to OpenCog (REPORTED, https://icog-labs.com/about-us/).
- No iCog blog post about Omega was found for 2026 (UNVERIFIED).

### 2.2 Recent Omega contributors (VERIFIED, GitHub API on `singnet/Omega`, 23 Oct)

Repo state: 162 stars; latest release **v0.1.20** (6 Oct 2026); work is tracked as OMEGA-### tickets.

| GitHub | Name | Affiliation (profile) | Recent Omega work |
|---|---|---|---|
| amxson | Amar Asfaw | iCog Labs, Addis | #406 hide MeTTa prompt rules when a skill is removed (22 Oct); #393 opt-in background RAG knowledge indexing |
| Bereket-Eshete | Bereket Eshete | iCogLabs, Addis | #400 import-kb 0.2.5, memory-export filename collisions (19 Oct); 39 commits |
| blackhammer116 | Nebiyu Samuel | – | #397 memory transfer to Docker volumes; 144 commits |
| surafelfikru | Surafel Fikru (judge in Hackathon 1) | Profile: "Building aisdk.rs" | #394 and #379 parser hardening: "stop escape tokens in relayed text from injecting commands" |
| Leul-Negash | Leul Negash Anteneh | – | 24 commits |
| Biruktie | Biruktawit Asebelign Wolde | – | #386 plugin module identity and cache |
| Wube2106 | – | – | #392 parenthesis balancing |
| TossSky, vsbogd, paul-v-snet, timur-ashkenov, glicerico | SingularityNET core | – | Live-reload workflow skills (#398); embedding provider via launcher (#387); memory copy |
| patham9 | Patrick Hammer | – | Original author |
| HWLowy | Haley Lowy | – | 7 commits |

**Language to echo** (VERIFIED from PR titles and README):
- skills
- plugins via `loadOmegaPlugin`
- memory export/import
- RAG knowledge indexing
- "verified diagnostics" (a test asserts that the ASICloud prompt "requires verified diagnostics")
- prompt-injection hardening of relayed text
- embedding provider
- workflow skills

**What this means for us:** the iCog reviewers care about memory, skills and plugins, and safety against prompt injection. A safety point that would register with them: show that untrusted text (patient notes, club messages) cannot inject Omega commands.

---

## 3. Ben Goertzel: public messaging, Sep–Oct 2026

### 3.1 Recent Substack posts (VERIFIED, https://bengoertzel.substack.com/archive)
- 30 Sep: "Averting the Cybersecurity Apocalypse"
- 1 Oct: "Distinction-Calculus"
- 2 Oct: "Finding the Beneficial-Superintelligence Attractor" (proposes **OmegaHive** experiments)
- 5 Oct: "AGI, RSI and Superintelligence"
- 5 Oct: "How We Could Actually Get a Near-Term (Beneficial) Intelligence Explosion"
- 6 Oct: "Beneficial AGI in 20 Steps"
- 12, 19 and 20 Oct: "Basic AI Drives" series
- 15 Oct: "Pwn.ai experiments with Omega, finds critical Linux kernel flaw"

### 3.2 "Intelligence Explosion" post (REPORTED, fetch summary; https://bengoertzel.substack.com/p/how-we-could-actually-get-a-near)

**How he describes Omega**
- Omega = LLM + symbolic layer. Knowledge sits in the AtomSpace as individually readable and editable items. Reasoning runs in MeTTa, which can rewrite itself.
- Agents form hives, linked by **OmegaBuzz**.
- Improvements are tested on a **ProtoAGI** suite of ten environments, then promoted.
- Task state is durable: **Context Frames**, and `petta-memory` carried across sessions.

**What he values**
- Verifiable testing
- Cheap, recorded iteration
- Transparency
- Decentralisation (SingularityNET, ASI:Chain)
- Stable goals under self-modification (MetaMo)

**What he criticises**
- Pure LLM loops: weak feedback, slow retraining, ever-bigger spend.
- He concedes that judge-based tests can be gamed.

### 3.3 Pwn.ai post (REPORTED; https://bengoertzel.substack.com/p/pwnai-experiments-with-omega-finds)
- Omega keeps "hypotheses and dead ends" across sessions.
- Division of labour: humans set scope and judge evidence; an LLM does the heavy reading; Omega keeps the work coherent.
- He wants "formally-verifiable, correct-by-construction" foundations.
- Background (REPORTED): "PwnEscape" was found in Vercel's Sandbox challenge using Omega-Pwn (https://gbhackers.com/ai-linux-kernel-vm-escape-flaw/amp/).

### 3.4 Other messaging (REPORTED)
- June 2026 press: Omega(Claw) is the first product of an "AI Agent Economy" on a decentralised backend, with the blockchain hidden from users. Source: https://www.kucoin.com/news/flash/ben-goertzel-advocates-for-decentralized-agi-to-challenge-openai-and-anthropic
- He predicts AGI around 2027–2030.

### 3.5 Not found
- No 2026 quote from Goertzel using the phrase "LLM wrapper" (UNVERIFIED).
- His position against bare LLM loops is clear (above), but do not attribute that phrase to him.
- X posts were not reviewed (not fetchable).

---

## 4. ASI Alliance, ASI:One, ASI Cloud

### 4.1 The Alliance (REPORTED, secondary)
- Members: Fetch.ai, SingularityNET and CUDOS. Ocean reportedly stepped back in Oct 2025; sources conflict on this.
- **ASI:Chain** DevNet is live and uses MeTTa. Mainnet is expected late 2026 or early 2027.
- Sources: https://www.datawallet.com/fr/crypto/artificial-superintelligence-alliance-asi-explained ; https://blockeden.xyz/blog/2026/03/10/asi-alliance-chain-launch-decentralized-ai-mega-merger/

### 4.2 ASI:One (VERIFIED docs; https://innovationlab.fetch.ai/resources/docs/asione/asi1-api-reference)
- OpenAI-compatible Chat Completions API.
- Base URL: `https://api.asi1.ai/v1`. Auth: `Bearer` token.
- Keys: create them at asi1.ai/dashboard/api-keys after signing in.
- Rate limits depend on account tier. **Pricing and free tier were not found** (UNVERIFIED; asi1.ai/pricing returns 404).
- Omega's own default model for ASIOne is `asi1-ultra`.

### 4.3 ASI Cloud (REPORTED, Dec 2025 press release)
- Built by SingularityNET and CUDOS. Serves OpenAI-compatible open-source models.
- Pricing "from $0.07 per million input tokens".
- Sign-in with a Web3 wallet, no KYC. Paid in FET or stablecoins.
- "Free credits for early adopters" (Oct 2025); current terms are unknown.
- Sources: https://www.barchart.com/story/news/36670231/asicloud-exits-beta-and-starts-delivering-enterprise-grade-ai-workloads ; https://9o1hbtdj3x.depinhub.io/news/asi-cloud-revolutionizing-ai-infrastructure-with-cudos-partnership-24386
- The asicloud.cudos.org site returned 403 to our fetch; docs returned 429.

### 4.4 Would it earn goodwill?
- Likely yes, at low cost. The event is "Powered by ... the ASI Alliance". The pitch is to the CEO of the ASI Alliance. Omega maintains first-class ASIOne and ASICloud providers and an ASICloud-specific prompt.
- Risks:
  - Model quality and latency. An Omega test notes "ASICloud latency 60s/60s".
  - Unknown free tier.
- Suggested hedge: run the demo on ASIOne or ASICloud, keep Anthropic or OpenRouter as a fallback, and state which provider produced the recorded run.

---

## 5. Partners: who they are and what each would want to see

| Partner | Who they are | What they would want to see |
|---|---|---|
| **Rejuve.bio** | Building **Mozi**, an "AI co-scientist" that structures biomedical knowledge into a knowledge graph, generates testable hypotheses and validates them against **Methuselah fly** outcomes. Focus: ageing, Alzheimer's, cardiovascular decline. "Beta Testing Coming Soon". Team: Kennedy Schaal (Founder/CEO), **Ben Goertzel (Chief AI Officer)**, Michael Duncan (CSO), Yusuf (CTO), Yisehak Abraham (PM), Abdulrahman S. Omar (Lead ML). Source: https://rejuve.bio (REPORTED). Separate from Rejuve.AI, the longevity data app with RJV token (https://longevity.technology/news/rejuve-ai-launches-longevity-athlete-challenge-at-infinite-games/). | Hypotheses with provenance and confidence. Knowledge graph atoms. A path from literature to a testable fly experiment. Explainability. |
| **WorldTennis.app** | "Tennis 2.0 for everyone". Player matching, court booking, coach discovery, an "All-Rating Translator", live scoring and verified results, AI coaching and video, leagues, direct payments, talent sponsorship. Clubs fill unused court hours. FOUNDERS500 programme (406 spots left). Operated by **XR-AGENCY PTE. LTD., Singapore**. Not affiliated with the ITF. Source: https://worldtennis.app (REPORTED). Yeabesera Derese is its CTO (info.md §17). | Matchmaking that respects cross-country ratings. Filling idle court slots. Verified results. Payments to clubs or coaches. |
| **XR Agency** (Nefertiti Strong, Saskia Betz) | A "distributed collective" that builds systems: automation, private AI on own data, apps, developer programmes, events, documentary media, security. Values: "Secure first: the security half is done before the demo"; "On the ground. On chain. On camera."; client owns the output. Source: https://xragency.org (REPORTED). | Security and privacy shown before the demo. Owned IP. Filmable outcomes. |
| **Beyond The Code** | AI documentary series following Ben Goertzel. NFT-funded tiers of $100–$1,000. "Powered by XR Agency". Narrator Macy Gray. Luma organiser of this event. Source: https://www.beyondthecode.ai (REPORTED). | A tight 3-minute story with a human stake that can be filmed and screened at a Web Summit booth. |
| **Unicorn Factory Lisboa: HealthHub** | Launched Nov 2025 at SITIO, Rossio. Partners: AstraZeneca, CUF, Linde, European Longevity Hub, the national pharmacies association. About 20 startups, aiming for 50+. 56 desks. Unicorn Factory is backed by Lisbon City Council (REPORTED). Sources: https://www.essential-business.pt/2025/11/14/lisbons-unicorns-factory-launches-health-hub-with-astrazeneca-cuf-linde-and-european-longevity-hub/ ; https://eco.sapo.pt/entrevista/novo-hub-de-saude-da-unicorn-factory-arranca-com-20-startups-num-ano-quer-escalar-a-mais-de-50/ | Health and longevity relevance. A fit for its pharma, clinic and longevity partners. |
| **Unicorn Factory Lisboa: Fintech House** | Saldanha district, per a 2023 report (REPORTED, https://www.essential-business.pt/2023/11/15/unicorn-factory-to-open-more-hubs-in-lisbon/). | Fits the payouts track. |

---

## 6. Web Summit 2026

- **Dates:** 9–12 Nov 2026, Lisbon, at MEO Arena and FIL (REPORTED).
  - https://websummit.com/speakers/ gives 9–12 Nov.
  - A Lusa report says 8–12 Nov.
- **Ben Goertzel in 2025:** opened the last day of Web Summit 2025 (REPORTED, https://centraldovarejo.com.br/?p=33734).
- **2026 presence:** no SingularityNET, ASI, BASIX or XR Agency entry was found in the visible 2026 speaker list. The list is paged, so this check is incomplete (UNVERIFIED).
- The "Web Summit booth" screening comes only from the official buildathon page.

---

## 7. HackMeridian (Stellar), 25–26 Oct 2026, Lisbon

**Event (VERIFIED, https://meridian.stellar.org/hackmeridian)**
- Organised under Stellar's Meridian brand.
- Two paths:
  - **Genesis**: new builders with an idea or early prototype.
  - **Scale**: teams with an existing product or advanced prototype.
- Prior Stellar experience is not required. Stellar engineers mentor, and there are workshops and team formation.

**Prizes and scale (REPORTED)**
- Prize pool: **$50,000** per the "HackMeridian Winners Circle" session page (https://meridian.stellar.org/sessions/hackmeridian-winners-circle).
- A London feeder event cited roughly 500 builders and $30,000 (https://luma.com/5flc7dsp).
- Travel grants were offered.

**Related events**
- Meridian 2026 conference: 28–29 Oct, Convento do Beato (REPORTED, https://cryptoast.fr/evenements-crypto-web3-blockchain-nft/meridian-2026-stellar-28-10-2026/).

**Stellar's agent-payments context (REPORTED)**
- x402 and MPP are live on Stellar mainnet (developers.stellar.org meeting notes, Apr 2026).
- Raven is described as the "unified Stellar-ecosystem MCP gateway" (Jul 2026).

**Why it matters for us**
- Stellar will have many Lisbon builders and judges the same week.
- An Omega payout on Stellar testnet that also uses Raven correctly is unusual for an AGI-ecosystem team.

---

## 8. Competition

### 8.1 What we checked (VERIFIED, `gh`, 23 Oct)

**`gh repo list BASIXmarket-io`** (73 visible repos)
- 2025 archive forks: MeTTa Kenya 2025, HackIndia 2025 and others, all created 21 Oct.
- `hackathon-starter` (16 Oct): agent brief for the separate **"State of the Art Hackathon 2026"**:
  - $560 pool across 28 teams
  - Tracks: Creators, Builders (MeTTa Omega), Open
  - Entries locked 21 Oct
  - Scoring: 25% Innovation, 25% Technical execution, 20% Impact and usefulness, 15% Meets the track's hard requirements, 15% Presentation and demo
  - Ships `AGENTS.md`/`CLAUDE.md` for AI coding agents
- `omniversity-h4-test-black-hats` (21 Oct): an "Email Test Hackathon".
- **No `omniversity-b4-*` repos are visible to us.** They are private as expected, or not created yet.

**GitHub searches**
- Searches since 10–14 Oct for "omega basix", "buildathon omega" and "lisbon omega" found only **CodeWithEugene/AI-OMEGA-AGENT-DEV-BUILDATHON**. It is private (created 23 Oct 09:09 UTC) and is most likely our own.
- **No public competitor repos yet.**

**BASIX job board** (https://www.basix.market/jobs)
- No public teammate listings found.

### 8.2 Hackathon 1 winners (VERIFIED, https://www.basix.market "Our Winners")

| Place | Project | Team | What it does | Public repo |
|---|---|---|---|---|
| 1 | **Mizani** | Technetians | Two Omega agents reconcile a maternal referral; output in Swahili | – |
| 2 | **HelixMind** | HelixClaw | "Turns scientific questions into evidence-backed research intelligence" | Not found (UNVERIFIED) |
| 3 | **TrustDeal Agent** | true north | Omega commerce agent with auditable discount decisions: rules, evidence, audit trail | https://github.com/nithishvarshanproject-code/TrustDeal |
| 4 | **Venture Route** | ThisisAnfield, Nairobi (Njuguna Njenga, Anthony Onyango, Naomi Wangui) | "AI explains. MeTTa decides." 7 named MeTTa rules (Hyperon 0.2.10) route a founder brief to the smallest credible team, with "no, and here is why" | https://github.com/simpleHacker0893/basix-venture-route |
| 5 | **AgriGuide** | Nexora AI | – | Not identified |
| 6 | **ActionDesk** | Mind Matrix | – | Possibly https://github.com/Aditya-coder-ai/ActionDesk (UNVERIFIED) |

Venture Route detail:
- Deployed on Vercel and Render.
- 3 videos, a Canva deck and a HANDOFF doc.
- Clerk sign-in and Neon Postgres.
- It has kept shipping after the event (sprints 000–005a).

**HelixMind matters most:** it is a research-intelligence agent in the 2nd-place slot, and the Rejuve track is its natural home. Expect the HelixMind team, or similar teams, on the Rejuve track.

### 8.3 Other Omega sprints (VERIFIED, https://bgicommons.org/hackathons/hypersprint-2-omega)

HyperSprint #2 is complete, with 6 teams. Winners:
- **JasonParser Security**: whitehat multi-agent operations.
- **StickerBook**: Omega runtime + Jev typed decisions.
- **BioCentric Autonomy Lab**: autonomy metrics for Omega agents.

### 8.4 What other builders will likely do (UNVERIFIED, inference)
- Rejuve: research summarisers built on an LLM with a thin Omega shell.
- Payouts: Stellar SDK scripts with an LLM choosing amounts.
- WorldTennis: chatbot matchmaking.
- Most teams: a polished UI and video in the Venture Route style.

### 8.5 How to stand out against the 30/25/25/20 weights
- **Run real Omega** (v0.1.20, pinned) with the **ASIOne or ASICloud provider**, and say so.
- **Show memory across sessions.** Memory export/import is supported.
- **Use Omega's own NAL/PLN for the decision.** The LLM handles language only.
- **Add a test proving relayed text cannot inject commands.** This echoes Surafel's #379 and #394.
- **Payouts track:**
  - A real Stellar **testnet** transaction hash.
  - Raven used through MCP for the docs and playbooks.
  - NEAR Intents as a **dry quote** only, labelled simulated (no testnet exists).
  - Human approval before any payout.
- **Rejuve track:**
  - A hypothesis atom with `(stv f c)` and provenance.
  - A proposed Methuselah-fly test.
  - Echo the Mozi language: "structure knowledge, generate testable hypotheses, validate".
- **Video:** 3 minutes that are filmable for Beyond The Code. Make the security-first point that XR Agency asks for.

---

## 9. Gaps
- ASI:One and ASI Cloud pricing and free tier are unconfirmed.
- Web Summit 2026 exhibitor list not checked.
- No Goertzel X posts reviewed.
- No HelixMind repo found.
- The `omniversity-b4-*` repos cannot be seen.
- HackMeridian track and prize split are unknown.
