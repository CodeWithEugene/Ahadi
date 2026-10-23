# BASIX AI Omega Agent Dev Buildathon: research on Tracks 01, 03 and 04

Prepared 23 Oct 2026, Lisbon build day 1. Track 02 (Stellar payouts) is out of scope.

**Labels:**
- **VERIFIED** means I fetched the page, called the API, or read the repository myself on 23 Oct 2026.
- **REPORTED** means a secondary source or summary says it, or it comes from my background knowledge and was not re-checked today.
- **UNVERIFIED** means I could not confirm it.

---

## 0. Event facts that affect every track

All of these are VERIFIED from https://basix.market/lms/buildathon/4 on 23 Oct 2026.

- **Venue and times:** HealthHub (Unicorn Factory Lisboa) plus online. The event runs 23–24 Oct, 10:30–17:00 Lisbon time.
  - The **submission deadline is 13:00 Saturday 24 Oct**.
  - Filmed showcases of **3 minutes per team** start at 14:15.
  - The day-1 progress check at 16:30 asks each team to "show what runs".
  - Teams may switch tracks until 13:00 on day 1.
- **Prizes:** There is no cash. Selected teams pitch to the "CEO of Superintelligence", and strong builds may get follow-up work with the track organisation.
- **Real problems from one portfolio:** The page says each track is a real problem from the **XRAGENCY portfolio**. WorldTennis.app's operator is **XR-AGENCY PTE. LTD., Singapore** (VERIFIED, worldtennis.app footer), so the track owners and the organiser are closely linked. Track fit (25%) will likely be judged by people who own these products.
- **Omega requirements:**
  - Every build must show the agent's role, what it remembers or reasons about, and the tools it calls.
  - Rule 2: "Omega must do real work. A chatbot wrapper does not qualify."
  - The required setup is Omega in Docker, an LLM key (Anthropic, OpenAI, ASI Cloud, ASI:One or OpenRouter) and a messaging channel (Telegram, Slack, Mattermost or IRC).
- **README must cover:** track, entry type, problem, setup, dependencies, contributors, and new work since the baseline. "A project that someone else cannot run from its README is not considered finished." The submission also needs test results, data sources, AI tools used (credit Claude Code) and known limitations.
- **Track 01 name:** The page labels it "Rejuve.io", but the company site is rejuve.bio.

### Omega framework facts relevant to design

VERIFIED from https://github.com/singnet/Omega README and docs, read 23 Oct 2026. The latest release is v0.1.20 (6 Oct 2026); the repo has 162 stars.

- **Architecture:** Omega is a neural-symbolic agent of about 200 lines of MeTTa core, running on PeTTa (MeTTa on SWI-Prolog).
  - It runs as a continuous loop and talks over IRC, Telegram, Slack or Mattermost. It has **no web UI**, which is REPORTED by mindstudio.ai and consistent with the README.
  - It has an LLM provider table (Anthropic is the default).
- **Memory skills** (`docs/reference-skills-memory.md`):
  - `(remember "string")` stores a (timestamp, atom, embedding) triple in ChromaDB.
  - `(query "string")` returns up to 20 nearest items.
  - `(episodes "YYYY-MM-DD HH:MM:SS")` gives time-based recall.
  - Memory persists in a Docker volume. Export and import go through `scripts/omega`, and **import only works through Docker**.
- **Custom skills** (`docs/tutorial-03-writing-a-custom-skill.md`):
  - A skill is added in three steps: a line in the `getSkills` catalogue in `src/skills.metta`, a MeTTa definition, and optional Python glue via `py-call`.
  - Arguments must be quoted string literals.
  - **This is how you add tools** such as PubMed, a badge verifier or a court finder.
- **Orchestration** (`docs/reference-orchestration.md`):
  - Engines: NAL `|-` and PLN `|~`, plus memory recall. The LLM picks the engine by heuristic triage.
  - Stopping rules: halt at confidence c < 0.3; c ≥ 0.6 counts as actionable; at most 5 commands per cycle.
  - Action tiers: ACT (f ≥ 0.6 and c ≥ 0.5), HYPOTHESIZE, IGNORE.
  - Conflict resolution uses revision.
  - This vocabulary maps directly onto "conflicting evidence" and "insufficient evidence" in Track 01, even though the user's brief says PLN and numerical scoring are not required.

---

## 1. Track 01: Rejuve.bio, Biomedical research assistance

### 1.1 Who Rejuve is

- **Rejuve Biotech (rejuve.bio):** VERIFIED from https://www.rejuve.bio, 23 Oct 2026.
  - **Positioning:** "AI co-scientist for translational medicine". The platform is called **Mozi**, and its beta is described as "coming soon", with access by application.
  - **Pipeline:**
    1. Data ingestion into a structured knowledge graph (genetic, clinical, preclinical).
    2. **Neural-symbolic hypothesis generation** linking pathways to treatments.
    3. Predictive modelling against the hallmarks of aging.
    4. Validation in **Methuselah flies** and with human data from the "Rejuve Network".
  - **People:** Kennedy Schaal (Founder & CEO), Ben Goertzel (Chief AI Officer), Michael Duncan (CSO), Hedra Yusuf (CTO; the page markup is garbled, so this is inferred), Yisehak Abraham (PM), Abdulrahman S. Omar (Lead ML Engineer).
- **Background:** REPORTED from search results (lifeboat.com, vktr.com, SingularityNET Telegram).
  - Schaal is also Lab Director at Genescient, which bred the long-lived Methuselah flies.
  - **Rejuve.AI** is a SingularityNET spin-off: a longevity data network/DAO with the RJV token.
  - Rejuve Biotech ran a Netcapital crowdfund.
- **GitHub org `rejuve-bio`:** VERIFIED via `gh`, 23 Oct 2026.
  - **`rejuve-bio/BioClaw`** is the most relevant. Its README calls it "a biology-domain OmegaClaw system for grounded BioKG curation, lookup, and evidence reasoning".
    - It has three OmegaClaw agents (Conductor, AssistantOC, ReasonerOC) over a **MORK/MeTTa BioKG Atomspace**, plus a PLN/STV evidence merge.
    - A `symbolic` branch holds "evidence-audit" work and an evaluation paper on where PLN/NAL did and did not add value.
    - **This is Rejuve's own internal precedent. Read it before building Track 01.**
  - `rejuve-bio/biocypher-kg` (active, pushed 22 Oct 2026) builds BioCypher knowledge graphs with **MeTTa**/Neo4j/Prolog writers. Human support is production-ready, as is *Drosophila*. This is the successor to "biocypher-metta"; that repo name returned 404 under both rejuve-bio and iCog-Labs-Dev.
  - Other repos: `hypothesis-generation-demo` (variant to phenotype hypotheses via enrichment and an LLM, with Prolog), `AI-Assistant` (backend for the "RejuveBio Platform AI Assistant"), `annotation-query-backend` (active), `custom-atomspace-builder` and `MORK-atomspace-builder` (tabular data to MeTTa/MORK), and `metta-motto-biochatter` (MeTTa plus LLM prompt chaining with BioChatter).
  - `singnet/das` (Distributed AtomSpace) is active.
- **Takeaway:** Rejuve's own stack is KG plus MeTTa plus OmegaClaw, aimed at hypotheses. The track asks for something simpler and complementary: **traceable literature evidence for human studies**. An entry that emits its evidence as MeTTa atoms (paper, intervention, outcome, direction, design, mechanism status), in a shape that could later join `biocypher-kg` and BioClaw, has a credible "benefit for the organisation" story.

### 1.2 Public literature APIs usable in 24 hours

Each was live-tested from this machine on 23 Oct 2026 without any key.

| API | Status today | Limits | Useful endpoints | Verdict |
|---|---|---|---|---|
| **PubMed E-utilities** | **VERIFIED working**. An esearch for "metformin insulin sensitivity" returned 6,522 hits. | 3 req/s without a key and 10 req/s with a free NCBI key. This is REPORTED: the NCBI docs page sits behind a captcha for the fetcher, but these are long-standing documented limits. Send `tool` and `email` parameters. | `esearch.fcgi` (db=pubmed, term, retmode=json, retmax); `esummary.fcgi`; `efetch.fcgi?rettype=abstract&retmode=xml` for abstracts and MeSH/publication types; `elink.fcgi` for related articles and PMC links | Core discovery tool. Filter with `AND (randomized controlled trial[pt] OR clinical trial[pt]) AND humans[mh]`. Note that literal `[` `]` must be URL-encoded. |
| **Europe PMC REST** | **VERIFIED working**. A search for `"insulin sensitivity" AND metformin AND PUB_TYPE:"Randomized Controlled Trial"` returned 1,535 hits. The Annotations API returned ontology-tagged spans. | No key needed. Fair use applies; no hard published limit was found (REPORTED). | `/webservices/rest/search?query=&format=json&resultType=core` (abstract, pubType, isOpenAccess, pmcid); `/webservices/rest/{PMCID}/fullTextXML` (open-access full text, so supporting quotes can come from Results sections); `/annotations_api/annotationsByArticleIds?articleIds=MED:{pmid}` (text-mined genes, diseases, chemicals with exact `prefix/exact/postfix` spans) | **Best single source.** It gives full text for quotes and pre-made entity spans, and the query syntax supports `PUB_TYPE`, `HAS_FT:Y` and `OPEN_ACCESS:Y`. |
| **ClinicalTrials.gov v2** | **VERIFIED working**. `/api/v2/studies?query.term=...&fields=NCTId,BriefTitle,OverallStatus,HasResults` returned JSON with `nextPageToken`. | No key. About 50 req/min per IP is REPORTED. | `/api/v2/studies` (query.term, query.cond, query.intr, filter.overallStatus, fields); `/api/v2/studies/{NCT}` for `resultsSection` (outcome measures, adverse events) | Good for comparator, participants, outcomes and **harms (adverse events)**. Also useful to flag "registered but no results posted", a missing-information signal. |
| **OpenAlex** | **VERIFIED working, but keyless use is tightly metered**. Response headers showed `x-ratelimit-limit: 1000` credits per day, and one search cost 10 credits (`x-ratelimit-cost-usd: 0.001`, daily budget `$0.10`). That is roughly **100 keyless searches per day**. | Docs (help.openalex.org, "Last updated October 15, 2026"): 10 req/s without a key and 30 with a free key; a free key gives "10x the keyless budget"; cursor paging needs a key. | `/works?search=&filter=type:article,is_oa:true` | Optional. Get the free key if used. Useful for citation counts and deduplication by DOI. |
| **Semantic Scholar** | **VERIFIED returning HTTP 429 on the first keyless call** today. | 1000 req/s shared across all unauthenticated users; a free key gives 1 req/s (VERIFIED from the product page). | `/graph/v1/paper/search`, `/paper/batch`, fields such as `tldr`, `openAccessPdf`, `publicationTypes` | **Do not depend on it without a key.** If used, put a cache and fallback in front of it. |

**Recommended stack:** Europe PMC search and full text, plus PubMed esearch/efetch as a cross-check, plus ClinicalTrials.gov for harms and registered outcomes.

- Cache every response to disk (JSON keyed by query) so the demo is reproducible offline and the tests are deterministic.
- Record the tool call in Omega memory: query string, timestamp, PMIDs returned.

### 1.3 The insulin-signalling evidence landscape

This section is for judging what a great answer to the example question looks like. Studies marked "PMID verified" had their PMID and title confirmed through E-utilities esummary on 23 Oct 2026. Findings are my summary of well-known results (REPORTED); a demo should quote abstracts directly rather than rely on these lines.

| Intervention | Key human studies | What they found | Mechanism tested or hypothesis? | Known conflicts and caveats |
|---|---|---|---|---|
| **Metformin** | DPP, Knowler 2002 NEJM, **PMID 11832527** (verified) | Reduced type 2 diabetes incidence by 31% vs placebo in people with impaired glucose tolerance. Lifestyle reduced it by 58%. | Clinical outcome only. Insulin-sensitivity mechanism was not directly tested (no clamp). Mechanism is debated: hepatic gluconeogenesis or AMPK vs gut effects. | **Classic conflict with exercise.** Konopka 2019 Aging Cell, **PMID 30548390** (verified): metformin blunted the exercise-induced gain in whole-body insulin sensitivity and mitochondrial adaptations in older adults (MASTERS-related). Walton 2019 Aging Cell, **PMID 31557380** (verified): metformin blunted hypertrophy from resistance training. This is a great "interaction harm" example. |
| **Exercise** (aerobic and resistance) | Many randomised trials; clamp-measured improvements | Improves insulin sensitivity, mainly in muscle (GLUT4 translocation, partly insulin-independent) | Mechanism often tested via biopsies | **Antioxidant conflict.** Ristow 2009 PNAS, **PMID 19433800** (verified): vitamins C and E abolished exercise-induced insulin-sensitivity gains in young men (n=40). Later trials such as Yfanti 2011/2012 (e.g. **PMID 22207723**, verified) did not find impairment. A textbook unresolved conflict. |
| **Caloric restriction** | CALERIE 2, Kraus 2019 Lancet Diabetes Endocrinol, **PMID 31303390** (verified) | About 12% sustained calorie restriction over 2 years in non-obese adults improved cardiometabolic risk factors, including insulin sensitivity (HOMA-IR) | Outcome surrogate; mechanism hypothesised (weight loss vs CR per se) | Adherence was far below the 25% target. Non-obese, mostly white participants limit generalisability. |
| **Time-restricted eating** | Sutton 2018 Cell Metab, **PMID 29754952** (verified): early TRF improved insulin sensitivity without weight loss in 8 men with prediabetes (crossover, isocaloric). Lowe 2020 TREAT, JAMA Intern Med, **PMID 32986097** (verified): 16:8 TRE gave no significant weight or metabolic benefit vs control (n=116). Liu 2022 NEJM, **PMID 35443107** (verified): TRE plus CR was not better than CR alone over 12 months (n=139). | Mixed | Sutton tested mechanism (OGTT insulin, beta-cell responsiveness). The others measured outcomes only. | **The best "conflict" demo.** Tiny controlled-feeding studies are positive; larger free-living RCTs are null. Timing (early vs late eating) and isocaloric vs ad libitum design explain much of it. |
| **SGLT2 inhibitors** | Merovci 2014 JCI, **PMID 24463448** (verified): dapagliflozin improved muscle insulin sensitivity but raised endogenous glucose production. Ferrannini 2014 JCI, **PMID 24463454** (verified): empagliflozin shifted substrate use, with a similar paradoxical rise in EGP and glucagon. | Improved insulin sensitivity is secondary to lowering glucotoxicity | Mechanism tested (clamp, tracers) | Paradoxical hepatic effect. Harms are well known: genital infections and euglycaemic DKA (REPORTED). |
| **GLP-1 receptor agonists and dual agonists** (semaglutide, tirzepatide) | STEP 1, Wilding 2021 NEJM, **PMID 33567185** (verified): about 15% weight loss on semaglutide 2.4 mg | HOMA-IR and glycaemia improve | Insulin-sensitivity gain is **largely mediated by weight loss**, a hypothesis partly tested. Tirzepatide clamp data exist, e.g. a small open-label Japanese study in Diabetologia 2025, **PMID 40694059** (verified; single-arm, so weak design). | Harms: GI events, discontinuation, lean-mass loss. Weight regain after stopping (REPORTED). |
| **Berberine** | Yin 2008 Metabolism, **PMID 18442638** (verified) | Reported HbA1c and HOMA-IR reductions comparable to metformin | AMPK mechanism is hypothesised, mostly from animal and cell data | **Insufficient-evidence showcase.** Small, mostly Chinese single-centre trials with high risk of bias. Meta-analyses flag heterogeneity and publication bias (REPORTED). Supplement quality varies. |
| **Resveratrol** | Timmers 2011 Cell Metab, **PMID 22055504** (verified): improved HOMA in 11 obese men. Yoshino 2012 Cell Metab, **PMID 23102619** (verified): no effect on insulin sensitivity in non-obese women. | Conflicting | Mechanism (SIRT1/AMPK) hypothesised; muscle biopsies in Timmers | Population difference (obese men vs lean normoglycaemic women) explains part of it. **Good for "what would change the conclusion".** |
| **Vitamin D** | D2d, Pittas 2019 NEJM, **PMID 31173679** (verified) | No significant reduction in diabetes risk (n=2,423) | Not tested | A strong null from a large trial, useful for showing a negative finding. |

**What a great Track 01 answer looks like:**

1. **Restate the question in scope.** Pathway: insulin signalling. Population: humans. Interventions: drugs and lifestyle.
2. **Show the tool trail.** For example: "europepmc.search(q=…) returned 1,535 hits; filtered to RCTs in humans; kept 8."
3. **Give up to 10 papers.** Each row has:
   - intervention
   - design and n
   - participants
   - comparator
   - outcome measured (clamp, HOMA-IR, OGTT, incidence)
   - direction of effect
   - an exact supporting quote from the abstract or Results, with a PMID/PMCID link
   - mechanism status: tested (clamp, biopsy, tracer) or only hypothesised
4. **Report conflicts explicitly**, as pairs:
   - TRE: Sutton vs TREAT and Liu
   - resveratrol: Timmers vs Yoshino
   - antioxidants and exercise: Ristow vs Yfanti
   - metformin plus exercise as an interaction
5. **List harms and missing information.** Examples: "no clamp measurement", "registered on ClinicalTrials.gov with no posted results", "n<20".
6. **Give a conclusion with graded certainty.** State what would change it, e.g. "a free-living early-TRE RCT with clamp endpoints, n>100".
7. **Show memory reuse.** In a new session, ask a related question, e.g. "and in older adults?". The agent should recall prior PMIDs and extractions from Omega memory instead of re-fetching, and say so.
8. **Show an insufficient-evidence case.** For example "berberine in people over 70" or a made-up supplement. The agent should decline to conclude and say what is missing.

### 1.4 HelixMind (past BASIX winner)

- **What BASIX says:** VERIFIED from basix.market, 23 Oct 2026. "Hackathon 2nd: HelixMind, a research intelligence tool", team **HelixClaw**. The buildathon page says it "Turns questions into evidence-backed research answers." The hackathon was "BASIX Omniversity: Hackathon", 30 Sep – 3 Oct 2026 (https://basix.market/lms/hackathon/1).
  - Its challenge list includes "The Glass Box Agent", "Two Agents, One Truth" (likely Mizani) and "The Agent That Grows Up".
  - $1,000 was awarded. Fewer than half of the planned 50 teams submitted qualifying entries.
- **Repository:** **UNVERIFIED; not found.** I searched GitHub for "HelixMind", "HelixClaw" and recently created Omega/helix repos, plus the web.
  - `devdanielvaldez/helixmind` (created 21 Oct 2026) is a large biomedical research autopilot with PubMed, Europe PMC, ClinicalTrials.gov, FDA FAERS and ClinVar clients. **It contains no Omega, MeTTa or BASIX references.** It is either an unrelated namesake or possibly someone preparing for this Track 01. Worth a glance as competitive context: https://github.com/devdanielvaldez/helixmind
  - `aarifa-shikkandar/helixmind` (Sep 2026) is an unrelated DNA risk app.
- **Inference (UNVERIFIED):** The team name "HelixClaw" suggests an OmegaClaw-based agent. It most likely did literature search and synthesis with citations. **The "bar" for Track 01 is therefore at least a cited, evidence-backed Omega research answer.** You beat it with structured extraction, explicit conflict and insufficiency handling, and demonstrable memory reuse.

### 1.5 Assessment for a solo builder in about 24 hours

- **Difficulty: medium-high.** The API plumbing is easy. The hard parts are:
  - reliable extraction (participants, comparator, outcomes, quotes) from abstracts with an LLM, with every quote **string-checked against the source text** so none is hallucinated
  - getting Omega skills to call Python cleanly
- **Wow potential: high.** Judges can click every claim back to PubMed. A conflict table and a "memory reused" moment in a fresh session are visually convincing. The Rejuve, BioClaw and Goertzel connection gives strong track fit.
- **Risks:**
  - medical-advice framing (add a disclaimer)
  - LLM quote hallucination (mitigate with exact-substring verification)
  - API flakiness (mitigate by caching; Semantic Scholar already 429s)
  - Omega memory behaviour being opaque
  - token cost and latency for 10 papers
- **A top entry has these parts:**
  1. Omega skills: `search-literature`, `fetch-abstract`, `extract-evidence`, `check-trials`.
  2. Each extraction becomes MeTTa atoms, e.g. `(effect pmid:29754952 eTRF insulin-sensitivity improved)`, `(design pmid:29754952 crossover 8)`, `(mechanism-tested pmid:29754952 true)`.
  3. Small MeTTa rules flag `conflict` (same intervention and outcome, opposite direction) and `insufficient` (fewer than 2 RCTs, or all n<30).
  4. Persistent memory of the evidence trail.
  5. A pytest suite on cached fixtures. Golden tests: the TRE conflict is detected; berberine is flagged as low certainty; every quote is a verbatim substring of its source.
  6. Stretch goal: an exported JSON/CSV evidence trail.

---

## 2. Track 03: BASIX.MARKET, Builder and marketplace workflows

### 2.1 What BASIX.MARKET is

VERIFIED from https://basix.market and https://www.basix.market, 23 Oct 2026. Both serve the same content.

- **What it is:** The "BASIX Omniversity Incubator", a Web3 and AGI incubator, "the learn-and-earn engine of BASIX". It offers:
  - a Dev LMS: MeTTa and Web3 courses, an **18-challenge MeTTa track** submitted on GitHub and mentor-reviewed, auto-graded assessments
  - weekly live classes
  - an **IP marketplace** where students register builds as owned, licensable assets
  - university co-branded tracks
  - two live cohorts, at **SJIT (Chennai)** and **ESU KU**
- **Credentials:** Passing a course earns an **"Open Badges v2"** badge plus a verifiable certificate. The site also says "Verifiable Credentials Issuing" and on-chain credentials.
- **DICE model:** **D**evelopers learn MeTTa and Hyperon, verify labour on-chain and co-own what they build. **I**nvestors get fractional IP, transparent ROI and DAO-like treasury voting. **C**reators mint IP and earn royalties. **E**ntrepreneurs launch verticals, aggregate IP and white-label marketplaces. The stated loop is learn, then verify labour, then build, then earn, then co-own and govern.
- **How builders and entrepreneurs meet:**
  - Entrepreneurs "bring an idea; the verified builder pool ships it" (email entrepreneur@basix.market).
  - Mentors and builders apply by emailing a CV to develop@basix.market.
  - **No public job board exists.** That gap is exactly what Track 03 targets.
- **Site navigation:** /lms, /curriculum, /ecosystem, /partners, /join, /channels, /ops. The parent brand is basixmarket.io. Partners listed: XR Agency, BeyondTheCode.AI, Cardano Foundation, SingularityNET, ASI Alliance, Fetch.ai, SJIT.
- **Past-winner ranking** (hackathon 30 Sep – 3 Oct 2026):
  1. Mizani (team Technetians)
  2. HelixMind (HelixClaw)
  3. TrustDeal Agent (true north)
  4. **Venture Route** (team name shown as Venture Route; the repo says team "ThisisAnfield")
  5. AgriGuide (Nexora AI)
  6. ActionDesk (Mind Matrix)
- **Judges listed:** Dr. Patric Hammer (Patrick Hammer is a NARS/ONA author, REPORTED, hence the NAL in Omega), Yeabsera Derese, Kedist Shegute, Prateek Choudary, Surafel Fikru, Samuel Wondimagegnehu.

### 2.2 Venture Route in depth

Cloned to `/private/tmp/claude-501/-Users-eugenius-Life-BASIX-Hackathons/c582f5eb-ac10-4e7d-b230-766af9a1c54c/scratchpad/venture-route`. VERIFIED by reading the repo on 23 Oct 2026.

- **Scale:**
  - **321 commits from 22 Sep to 3 Oct 2026, about 11 days.** Authors: simpleN (211), antoniodemax (43), simpleHacker0893 (39), Claude (17), Njuguna Njenga (11).
  - Team "ThisisAnfield": Njuguna Njenga, Anthony Onyango, Naomi Wangui.
  - **It is not a 24-hour build.** It was entered in the "MeTTa" track.
- **What it does:**
  1. A founder's plain-language MVP brief arrives by form or by "Chloe" voice intake.
  2. It becomes editable chips (skills, vertical, mode, location, date window, hourly budget, IP preference).
  3. The output is a **route**: the cheapest verified team within the hourly budget, reusable IP, cohort and university, a partner, the hourly cost, and **named gaps** (skill, availability, mode, location, budget) with next actions.
  4. "Why this route?" shows the rule name and the exact source facts.
  5. Surrounding marketplace: Clerk roles (founder, builder, admin), builder profiles, credentials and projects, **admin verification**, a public Showcase, requests and bids (per hour), and interview bookings.
- **How MeTTa is used:**
  - Hyperon 0.2.10 runs in-process inside FastAPI. The graph has 181 facts (14 builders, 10 credentials, 5 projects, 3 IP assets, 3 cohorts, 4 partners, 9 skills).
  - `services/engine/seed/rules.metta` (122 lines) holds **7 named rules**: `verified-for-skill`, `mode-compatible`, `available-for-brief`, `eligible-builder`, `reuse-fit`, `partner-fit` (a four-hop chain from vertical to partner, university, cohort, builder) and `route-gap`.
  - Rules return witnesses that **embed the matched facts**, which become the reasoning path in the UI.
  - A skill counts only when `(earned b c)(proves c s)(confirmed admin c)` or `(built b p)(demonstrates p s)(confirmed admin p)` holds. Self-described skills are ignored.
  - The only Python-grounded atom is `overlap-days`.
  - Team assembly and budget fit happen in a **deterministic Python assembler**, not in MeTTa.
  - Postgres rows are projected into the space by a full rebuild.
  - The LLM (Anthropic or OpenRouter, optional) only extracts the brief and phrases explanations. "AI explains. MeTTa decides."
- **Tests and CI** (README, last recorded run 2 Oct 2026):
  - 671 engine pytest (real Hyperon, no mocks)
  - 364 web Vitest
  - 46 contracts tests
  - 28 + 21 Playwright tests
  - ruff, mypy strict, TypeScript strict, Zod and Pydantic parity
- **Docs quality: excellent.**
  - A README of about 40 KB with a problem statement, worked example table, "For MeTTa judges" section with verbatim rules, a 2-minute curl check, screenshots, 5 pinned demo scenarios (feasible, feasible, partial, budget-gap, infeasible), a limitations section and three demo videos.
  - 9 ADRs, a PRD, API docs, a DOMAIN spec and SUBMISSION.md mirroring the form.
- **Live status today:** the web app https://basix-venture-route.vercel.app/ returned HTTP 200. The engine at `venture-route-engine.onrender.com/health` **did not respond within 40 s** (Render cold start or asleep).

**Weaknesses you can beat in this buildathon:**

1. **No Omega at all.** The repo has zero "omega" references. There is no agent loop, no long-term memory, no messaging channel and no tool calls by an agent; it is a web app with a rules engine. **This buildathon gives 25% for Omega integration, and Venture Route would score poorly there.**
2. **No memory or learning.** It cannot remember a founder's earlier briefs, a builder's declined requests, or outcomes of past matches.
3. **Trust anchor is a manual admin flag** (`confirmed admin-basix …`). There is **no Open Badges verification**, even though BASIX actually issues OB v2 badges. A real cryptographic or hosted badge check is the obvious upgrade, and it is a named stretch goal.
4. **No auditable match score.** The output is a binary eligible/ineligible, then cheapest-first assembly. There is no ranked score with per-factor contributions (another named stretch goal).
5. **Founder-side only.** It routes founders to builders; it does not help a **builder** find suitable projects ("project discovery") or check an **incomplete profile and ask for what is missing**. The Track 03 brief explicitly asks for incomplete-profile handling and decline-with-reason.
6. **All data is fictional and Kenya-flavoured.** There is no real BASIX data and no LMS course or challenge data.
7. **Heavy infrastructure** (Clerk, Neon, Render, Vercel). Impressive, but a judge cannot run it quickly, and the hosted engine sleeps.

### 2.3 Open Badges verification

**OB 2.0:** VERIFIED from the 1EdTech spec https://www.imsglobal.org/sites/default/files/Badges/OBv2p0Final/index.html and the implementation guide https://www.imsglobal.org/spec/ob/v2p0/impl/, 23 Oct 2026.

- **Objects:** An **Assertion** links to a **BadgeClass**, which links to an **Issuer Profile**. Each is JSON-LD with `@context https://w3id.org/openbadges/v2`.
- **`verification.type`** is `HostedBadge` (alias `hosted`) or `SignedBadge` (alias `signed`).
- **Hosted verification:**
  1. GET the Assertion `id` URL. The hosted copy is the source of truth; redirects are OK if the final response is JSON or JSON-LD.
  2. Check that the `id` is in the issuer's allowed scope (by default, the same origin as the Issuer `id`).
  3. Fetch and validate the BadgeClass and Issuer.
  4. **Revoked** if the response is HTTP **410 Gone**, or the body has `"revoked": true`.
- **Signed verification:**
  1. The badge is a JWS (RS256 recommended) whose payload is the Assertion.
  2. Get the key via Issuer `publicKey` (optionally narrowed by `creator`) and verify the signature.
  3. Check that the Assertion `id` is not in the issuer's `revocationList`.
- **Recipient:** `recipient.identity` is either plaintext or `sha256$<hex>`, with an optional `salt`. To match a claimed email, compute `"sha256$" + sha256(email + salt)`. md5 is also allowed.
- **Expiry:** Treat the badge as invalid after `expires`.
- **Tools** (REPORTED): 1EdTech/IMS OBv2 validator `badgecheck` (Python, open source: `openbadges-validator-core`). Badges are often baked into PNG (iTXt chunk `openbadges`) or SVG.

**OB 3.0** (REPORTED from background knowledge; not re-fetched today):

- OB 3.0 re-bases on the **W3C Verifiable Credentials Data Model**. The credential type is `OpenBadgeCredential`.
- Proofs are VC-JWT or Data Integrity (`eddsa-rdfc-2022`, Ed25519). The issuer is identified by a DID or URL.
- Revocation uses `credentialStatus` (1EdTech Revocation List or Bitstring Status List).
- To verify: check the proof, the issuer key resolution, validity dates and status.

**For the demo:**

- Build a `verify-badge` Omega skill that takes an assertion URL or JSON. It returns `valid` / `revoked` / `expired` / `recipient-mismatch` / `unverifiable`, with the reason and the fetched evidence.
- Host 3–4 **sample assertions** yourself (a GitHub Pages or static JSON server): valid, revoked (returns 410), expired, wrong recipient hash. This gives deterministic tests and a real "badge failed" moment.
- **UNVERIFIED:** whether BASIX's real badges are hosted or signed, and where they live. Ask the organisers on day 1; if a real public assertion URL exists, verifying it live is a strong track-fit moment.

### 2.4 Assessment for a solo builder in about 24 hours

- **Difficulty: medium.** The domain is simple, there is no external API dependency beyond your own sample badges, and MeTTa rules for matching are straightforward (Venture Route's rules are a public reference, MIT licence; credit it if you reuse patterns).
- **Wow potential: medium.** It is a judged-against-the-winner track, so judges will directly compare you with Venture Route. To win you must be visibly *different*, not a smaller copy. Choose one of two angles:
  - **(a) Builder-side project discovery or onboarding agent:** "your verified badges qualify you for these 3 open briefs; this one needs a Rust credential you don't have; finish MeTTa challenge 12 to unlock it". It handles incomplete profiles by asking.
  - **(b) Submission-review agent for BASIX hackathons:** check a repo for README, tests and Omega use against the published rubric. This is very meta and directly useful to BASIX, given that "fewer than half submitted qualifying projects".
- **Risks:**
  - looking derivative of Venture Route
  - no real BASIX data (label mocks)
  - Omega's chat-only interface making the "evidence" view less visual (mitigate with a tiny static report page or Telegram-formatted cards)
- **A top entry has these parts:**
  1. An Omega agent on Telegram.
  2. Skills: `verify-badge` (real OB 2.0 hosted and signed checks), `load-profile`, `list-briefs`, `match`.
  3. MeTTa rules that produce an **auditable score**: per-factor atoms (verified skill +w, badge recency, availability overlap, rate fit) with the matching facts as witnesses.
  4. Explicit `missing-field` atoms that trigger questions for incomplete profiles.
  5. `decline` with a named reason for unsuitable ones.
  6. Memory: it remembers the builder's answers across sessions and which briefs were declined and why.
  7. A pytest suite covering 4 sample badges and 5 profile and brief scenarios.

---

## 3. Track 04: WorldTennis.app, Player and club coordination

### 3.1 WorldTennis.app

VERIFIED from https://www.worldtennis.app, 23 Oct 2026. The site rendered in German.

- **Operator:** **XR-AGENCY PTE. LTD.**, Vision Exchange, 2 Venture Drive #19-21, Singapore 608526; office@worldtennis.app. No founders are named on the site.
  - This is the same XRAGENCY whose portfolio supplies the buildathon problems, and BASIX lists xragency.org as a partner. So **the track owner is effectively the host**. High follow-up potential.
- **Positioning:** An "All-in-App" for players, clubs and court operators, trainers and referees. Headline themes are **"your tennis, your data"**, a **verified identity profile** (eIDAS 2.0 and GDPR/DSGVO compliance claimed), and **verified results**.
- **Features claimed:**
  - one-click matchmaking for opponents, doubles partners and coaches at your level
  - an **"All-Rating Translator"** to compare ratings across countries
  - free rating assessment ("Kostenlos einstufen lassen")
  - references to an official "Tennis-Handicap" and the **WTN**, with the disclaimer "not affiliated with the ITF"; federation integration is planned, subject to authorisation
  - court booking and payment for free slots (daily or weekly); **court operators can fill empty hours**
  - live scoring, AI coaching and video, leagues and tournaments, in-app payments via a regulated PSP, and talent sponsorship
  - trainer and referee profiles "coming in Q3"
- **Status:** **The apps are not yet in the stores**; iOS and Android are "coming". There is a FOUNDERS500 programme (406 of 500 spots left at the snapshot).
- **Takeaway:** The track's stretch goals (doubles, rating translation, filling empty court hours) are **literally the product's advertised features**. An entry that prototypes the "All-Rating Translator" honestly (with uncertainty) plus matchmaking would hit track fit directly.

### 3.2 Rating systems and conversion

| System | Scale and mechanics | Status |
|---|---|---|
| **ITF World Tennis Number (WTN)** | **40 (beginner) down to 1 (elite)**, separate singles and doubles numbers, results-based. The algorithm predicts the expected result from both ratings and moves ratings by the surprise; it scores each **set** separately. Recent and sanctioned results weigh more, and older results decay. A **confidence tick** shows reliability. Updated weekly from federation-supplied results back to 2016. A Sept 2024 revision reduced the penalty for losing to a stronger player. | REPORTED from search-result summaries of worldtennisnumber.com, the LTA, Tennis Canada and Tennis Ireland (Oct 2026). Sources: https://worldtennisnumber.com/eng/how-wtn-works/ and https://www.lta.org.uk/compete/wtn-rankings/world-tennis-number/ |
| **UTR (Universal Tennis Rating)** | **1.00–16.50**, higher is better. Uses the last 30 eligible matches in 12 months, games-won share adjusted for opponent rating. | REPORTED (utrsports.net blog via search) |
| **NTRP (USTA)** | **1.5–7.0 in 0.5 steps.** Self-rated or league-computed; "Dynamic NTRP" is a 3-decimal computed value used for year-end ratings. | REPORTED |
| **Portugal (FPT, Federação Portuguesa de Ténis)** | National ranking is points-based from FPT tournaments (REPORTED, background). I found **no Portuguese announcement** of WTN-based acceptance, though WTN is used for ITF Juniors, Masters and World Tennis Tour acceptance. | **UNVERIFIED.** Check fpt.pt on day 1 if you use it. |
| **India (AITA)** | AITA ranking awards points by round (examples: champion 15–25 points at regional events), on a 52-week rollover. **AITA partnered with WTN in July 2026**; its platform will publish national rankings alongside WTN weekly, with phase 1 due 15 Aug 2026. | REPORTED: ITF news https://www.itftennis.com/en/news-and-media/articles/all-india-tennis-association-partners-with-world-tennis-number/ and indiantennisdaily.com, 28 Jul 2026 |
| **Kenya (Tennis Kenya)** | Nothing found on its national ranking method or WTN adoption. | **UNVERIFIED** |

**Conversion approaches:**

- **There is no official cross-system table.** Every source says conversions are approximate.
- **UTR and WTN:** A published study formula gives **WTN ≈ 39.18 − 2.397 × UTR** and **UTR ≈ 15.36 − 0.354 × WTN**. The authors call these estimates. This is REPORTED via matchtennisapp.com; I did not locate the primary paper.
- **NTRP and UTR:** A USTA-linked rule of thumb is **UTR ≈ 2 × NTRP − 3**. A USTA range table gives men's NTRP 4.0 ≈ UTR 6–8, 4.5 ≈ 8–10, 5.0 ≈ 10–12; women's ranges run lower. REPORTED via https://playtennis.usta.com/NETXCTA/SocialLeagues/RankingsLinks.
- **Tables disagree.** One maps NTRP 3.5–4.0 ≈ UTR 4–6 ≈ WTN 20–30; another maps UTR 4–7 to NTRP 3.5–4.5. REPORTED: bounce.game converter, tennisnerd.net.
- **Honest design:** Convert to a **range with a confidence label**. Prefer a native rating in the target system. Widen the band when the source is self-rated or has few matches. Treat cross-gender and junior conversions as low-confidence. Mark every translated rating "approximate, not federation-endorsed". This mirrors WTN's own confidence tick.

### 3.3 Court booking norms in Lisbon

- **Playtomic dominance:** REPORTED. **Playtomic acquired AirCourts (Portugal)** in May–June 2023. AirCourts served more than 350 clubs and 500k players; coverage put the combined share at **about 87% of Portuguese (padel) clubs**. That figure is a company-side 2023 number, and it is unclear whether it applies to Playtomic or AirCourts. Sources: https://www.eu-startups.com/2023/05/madrid-based-playtomic-hits-the-ace-by-acquiring-portuguese-competitor-aircourts/ and https://padelalto.com/2023/06/15/playtomic-acquires-portuguese-competitor-raised-millions-in-latest-funding-round. Playtomic's 2025 report lists Portugal as a high-growth market.
- **Padel vs tennis:** REPORTED, background, not re-verified. Padel has boomed in Lisbon, and many clubs convert tennis courts to padel. Tennis courts are mostly at clubs (e.g. CIF, Clube de Ténis do Estoril, the Jamor national centre) and municipal courts. Bookings are typically 60–90 minute slots, with evenings and weekends as peak times. TieSports/TiePlayer is a smaller rival.
- **Implication for the demo:** Real Lisbon availability is locked inside Playtomic and club systems. **Use sample court data (labelled)** with realistic Lisbon venues and coordinates, 60/90-minute slots and peak pricing. Do not scrape Playtomic. "Fill empty court hours" is a real operator pain point: the off-peak 10:00–16:00 weekday slots.

### 3.4 What makes matchmaking fair

These are design principles, drawn from the rating literature summarised above and general practice.

1. **Level proximity with uncertainty.** Match on rating difference relative to the combined confidence. With Elo-style systems (WTN is one), a predicted win probability of about 35–65% makes a competitive match. Low-confidence or newly translated ratings get wider tolerance and a flag.
2. **Symmetric constraints.** Both players' availability, travel distance or time (not just the requester's), and surface or indoor preference. Neither player should bear all the travel.
3. **Explainability.** State why this opponent, this court and this time, as named factors. Show the factors that were relaxed ("distance widened from 5 to 8 km because no level match within 5 km").
4. **Rotation and anti-starvation.** Do not always pair the same top candidate. Remember past pairings and declined matches, and give fairness credit to players who were bumped.
5. **Consent and safety.** Both parties confirm before any booking. Verified identity (WorldTennis's eIDAS angle) and an honest rating source label reduce sandbagging. Junior and adult pairings follow safeguarding rules.
6. **Doubles:** balance team sums (or combined win probability), not just individual levels.

### 3.5 Assessment for a solo builder in about 24 hours

- **Difficulty: low-medium.** It is entirely synthetic data and has no external APIs. Constraint matching is a natural fit for MeTTa: level band, overlapping availability, distance and court-free facts give a match with witnesses. The conflict and re-plan flow is also natural for an agent loop with memory.
- **Wow potential: medium-high.** It is a relatable, visual story: two players on Telegram, the agent proposes, one has a conflict, the agent re-plans, both confirm, and a "SIMULATED BOOKING #…" appears. The rating translator with confidence bands is a strong stretch goal because it is an advertised WorldTennis feature.
  - **Weakness:** less intellectual depth than Track 01; judges may see it as scheduling.
- **Risks:**
  - Omega's single-owner chat model. Two-party confirmation needs two users or channels; check how Omega authenticates multiple users (`auth <secret>` makes one owner, per the README).
  - Simulating two players credibly in a 3-minute demo.
  - Overbuilding the UI.
- **A top entry has these parts:**
  1. **Facts:** MeTTa facts for 8–12 sample players (rating, system, confidence, home location, availability) and 4–5 Lisbon courts (sample slots).
  2. **Rules:** level-compatible (via translated range), availability-overlap, distance-ok, court-free, give `proposal` with witness facts.
  3. **Conflict flow:** a conflict is injected (one player cancels or the court is taken) and gets a re-plan, which is remembered.
  4. **Booking:** a confirmation from both, then a labelled simulated booking receipt.
  5. **Stretch:** doubles balancing, plus "fill the empty 14:00 Tuesday slot" by reverse-matching players to an empty court.
  6. **Tests:** pytest scenarios for match, no match (decline with reason), conflict and re-plan, and rating translation bounds.

---

## 4. Comparison across the three tracks

| | Track 01 Rejuve | Track 03 BASIX | Track 04 WorldTennis |
|---|---|---|---|
| Solo 24 h difficulty | Medium-high (extraction quality, API plumbing) | Medium | Low-medium |
| External dependencies | Europe PMC, PubMed, CT.gov (all keyless and working today) | Your own hosted sample badges; optionally real BASIX badge URLs | None |
| Demo wow | **High**: clickable quotes, conflict table, memory reuse | Medium: must differentiate from Venture Route | Medium-high: relatable, conversational flow |
| Omega fit (25%) | Strong: native memory plus tool calls and multi-step orchestration are what the brief asks for | Strong if memory and badge-verify tools are used; Venture Route had none | Good: re-planning and memory of preferences |
| Track-fit story | Rejuve's own BioClaw and biocypher-kg (MeTTa) stack can consume the evidence atoms | BASIX issues OB v2 badges but has no job board; the agent closes that gap | Organiser-owned product; the stretch goals mirror advertised features |
| Main risk | Hallucinated quotes; medical-advice framing; latency | Looking derivative; thin data | Multi-user confirmation in Omega; perceived as "just scheduling" |
| Bar to beat | HelixMind (2nd place; repo not found) | Venture Route (4th place; 11 days, 3 people, no Omega) | None named |

**Overall:**

- **Track 01 has the highest ceiling** and aligns with the domain strengths of the team behind Mizani (health, evidence). It is the riskiest on quality.
- **Track 04 is the safest** route to a fully working, well-tested flow by 13:00 Saturday.
- **Track 03 is winnable** only with a clearly different workflow (builder-side discovery/onboarding or submission review) plus real OB 2.0 verification and memory, the two things Venture Route lacks.

---

## Sources

All accessed 23 Oct 2026.

- https://basix.market/lms/buildathon/4 (VERIFIED)
- https://basix.market and https://www.basix.market (VERIFIED)
- https://basix.market/lms/hackathons and https://basix.market/lms/hackathon/1 (VERIFIED)
- https://github.com/singnet/Omega, including docs/reference-orchestration.md, docs/reference-skills-memory.md and docs/tutorial-03-writing-a-custom-skill.md (VERIFIED)
- https://github.com/simpleHacker0893/basix-venture-route (VERIFIED, cloned); live app https://basix-venture-route.vercel.app/ (HTTP 200)
- https://www.rejuve.bio (VERIFIED)
- GitHub org https://github.com/rejuve-bio: BioClaw, biocypher-kg, hypothesis-generation-demo, AI-Assistant, custom-atomspace-builder, metta-motto-biochatter (VERIFIED)
- Rejuve background (REPORTED): https://lifeboat.com/bios.kennedy.matsagas.schaal.shtml, https://www.vktr.com/the-wire/rejuvebio-launches-groundbreaking-crowd-fund-on-netcapital-to-pioneer-the-future-of-artificial-general-intelligence-and-longevity/, https://netcapital.com/companies/rejuvebiotech
- APIs, live-tested (VERIFIED):
  - https://eutils.ncbi.nlm.nih.gov/entrez/eutils/
  - https://www.ebi.ac.uk/europepmc/webservices/rest/
  - https://www.ebi.ac.uk/europepmc/annotations_api/
  - https://clinicaltrials.gov/api/v2/studies
  - https://api.openalex.org/works
  - https://api.semanticscholar.org/graph/v1/
- API documentation:
  - https://help.openalex.org/how-to-use-the-api/rate-limits-and-authentication (VERIFIED, page updated 15 Oct 2026)
  - https://www.semanticscholar.org/product/api (VERIFIED)
  - NCBI E-utilities docs https://www.ncbi.nlm.nih.gov/books/NBK25497/ (captcha-blocked; limits REPORTED)
- PubMed PMIDs, verified via esummary: 11832527, 30548390, 31557380, 19433800, 22207723, 31303390, 29754952, 32986097, 35443107, 24463448, 24463454, 33567185, 40694059, 18442638, 22055504, 23102619, 31173679
- HelixMind candidates (not the winner, as far as I can tell): https://github.com/devdanielvaldez/helixmind and https://github.com/aarifa-shikkandar/helixmind
- Open Badges:
  - https://www.imsglobal.org/sites/default/files/Badges/OBv2p0Final/index.html (VERIFIED)
  - https://www.imsglobal.org/spec/ob/v2p0/impl/ (VERIFIED)
- https://www.worldtennis.app (VERIFIED)
- Tennis ratings (REPORTED):
  - https://worldtennisnumber.com/eng/how-wtn-works/
  - https://www.lta.org.uk/compete/wtn-rankings/world-tennis-number/
  - https://ustasocal.com/wp-content/uploads/2025/02/WTN-Algorithm-Changes.pdf
  - https://www.utrsports.net/blogs/news/tennis-ratings-utr-rating-vs-ntrp-vs-wtn
  - https://playtennis.usta.com/NETXCTA/SocialLeagues/RankingsLinks
  - https://web.matchtennisapp.com/?p=3608
  - https://www.bounce.game/tennis-rating-converter
  - https://www.itftennis.com/en/news-and-media/articles/all-india-tennis-association-partners-with-world-tennis-number/
  - https://indiantennisdaily.com/2026/07/28/all-india-tennis-association-partners-with-world-tennis-number/
- Lisbon and Playtomic (REPORTED):
  - https://www.eu-startups.com/2023/05/madrid-based-playtomic-hits-the-ace-by-acquiring-portuguese-competitor-aircourts/
  - https://padelalto.com/2023/06/15/playtomic-acquires-portuguese-competitor-raised-millions-in-latest-funding-round
- OmegaClaw background (REPORTED):
  - https://www.mindstudio.ai/blog/omegaclaw-symbolic-ai-agent
  - https://innovationlab.fetch.ai/resources/docs/examples/openclaw/omegaclaw-agentverse-skills
