# Problem evidence: cross-border prize payouts and prize transparency

Prepared for the BASIX.MARKET buildathon entry (Track "Global payouts and prize transparency").
Research date: 23 October 2026. All URLs accessed on that date unless stated otherwise.

**Labels**
- **VERIFIED**: the claim was read on the primary source (the issuer's own page or document).
- **REPORTED**: the claim comes from secondary coverage (press, law firm, blog, aggregator) or a search-result summary of a primary document. The primary document itself was not read.
- **UNVERIFIED**: plausible or commonly stated, but no source was confirmed. Do not quote it as fact.

---

## 1. Cost and speed of cross-border payments (Kenya, India, EU/Portugal, US)

### 1.1 World Bank Remittance Prices Worldwide (RPW), Issue 54, September 2025 (Q3 2025 data, the latest release)
Source: https://remittanceprices.worldbank.org/sites/default/files/2026-04/RPW_main_report_and_annex_Q325.pdf (linked from https://remittanceprices.worldbank.org/, "Last update: August 18, 2025"). The full PDF text was read.

| Metric (cost of sending USD 200, % of amount sent) | Q3 2025 | Label |
|---|---|---|
| Global average | **6.36%** (down from 6.49% in Q1 2025) | VERIFIED |
| Sub-Saharan Africa (receiving region) | **8.46%**, the most expensive region (8.78% in Q1 2025) | VERIFIED |
| South Asia (receiving region) | **5.30%** (up from 4.80% in Q1 2025) | VERIFIED |
| Cost to send to India (G20 receiving table) | **5.30%** | VERIFIED |
| Banks (provider type) | **14.99%**, the most expensive provider type | VERIFIED |
| Money transfer operators | 4.72% | VERIFIED |
| Digital remittances / non-digital | 4.59% / 7.30% | VERIFIED |
| Global weighted average | 5.04% | VERIFIED |
| SmaRT (3 cheapest qualifying services per corridor) | 3.29% | VERIFIED |
| Sending from the USA / UK / Germany / France / Italy | 5.04% / 4.61% / 4.49% / 5.23% / 7.44% | VERIFIED |
| Funded from a bank account | 8.69% | VERIFIED |
| Paid into a bank account (any bank) / mobile wallet | 7.86% / 3.92% | VERIFIED |
| Corridors costing more than 20% | 13, of which 9 originate in Sub-Saharan Africa | VERIFIED |

- **SDG 10.c target** (VERIFIED, RPW p.6 and FSB 2021 targets report): global average cost of sending USD 200 to be **no more than 3% by 2030**, with **no corridor above 5%**. At 6.36%, the global average is still more than twice the target.
- **Speed** (VERIFIED, RPW p.15): "Bank services are much slower than money transfer operator and mobile operator services." The report gives speed only as charts, with no single headline number.

### 1.2 Corridor-level RPW data (Q3 2025, USD 200 send amount)
Source: RPW corridor pages, e.g. https://remittanceprices.worldbank.org/corridor/United-States/Kenya. Values were read from the live corridor pages (data collected August 2025). Label: VERIFIED. They come from page text, so spot-check the screen before quoting a single provider.

| Corridor | Corridor average total cost | Notable data points |
|---|---|---|
| USA → Kenya | **4.26% (USD 8.52 on USD 200)** | Cheapest is about 0.7% (WorldRemit, online). Most expensive is 11.26% (USD 22.52) at an agent. Wise: USD 4.87 fee (2.44%). |
| UK → Kenya | **3.43%** | One Western Union service costs 12.21%. |
| USA → India | **3.68% (USD 7.35)** | **Citibank: flat USD 35 fee = 17.50% of USD 200** (7.00% of USD 500). |
| UK → India | **1.91%** | |
| Germany → India | **6.53%** | **Deutsche Bank: 27.33% of a USD 200-equivalent transfer** (11.12% at USD 500). |
| France → India | **6.33%** | **Banque Populaire: 29.92%** at USD 200-equivalent (12.22% at USD 500). |
| Italy → India | 3.97% | |
| Portugal → Kenya, Portugal → India | **Not tracked by RPW.** RPW's Portugal corridors include Brazil (5.30%) and Mozambique (4.33%). | |

**Takeaway for small prizes (USD 70–170):** a bank's flat fee is a large share of a small payout. A USD 35 Citibank fee is 17.5% of USD 200 and would be about 50% of a USD 70 prize. The 50% figure is our arithmetic on the verified flat fee.

### 1.3 Bank wire and wallet fees on small amounts
- **Bank of America** (VERIFIED, https://info.bankofamerica.com/en/digital-banking/wire-transfers): outgoing international wire in USD costs **USD 45**. A wire in foreign currency has "no wire transfer fee, but exchange rate markups apply". Incoming wires "may incur a $15 fee". The page adds that "other fees … including those charged by recipient's financial institution" may apply. Delivery: "funds typically arrive in 1 to 5 business days."
- **Chase** (REPORTED, https://wise.com/us/blog/chase-international-wire-transfer and https://www.nerdwallet.com/blog/banking/wire-transfers-what-banks-charge/): about USD 40 online and USD 50 with a banker for USD wires. Intermediary and recipient banks may deduct further charges. Chase's own fee page could not be fetched.
- **Intermediary or correspondent fees on SWIFT wires** (REPORTED): typically USD 15–30 per intermediary. No primary source was found, so treat the range as UNVERIFIED.
- **PayPal Kenya** (VERIFIED, https://www.paypal.com/ke/webapps/mpp/paypal-fees, "Last Updated: 28 September 2026"):
  - Currency conversion on received payments is **3.0% above the base rate**.
  - Withdrawal to a Kenyan bank costs **KES 105 for amounts of KES 20,000 or less**.
  - Withdrawal via a third-party provider costs **2.0% + USD 1.50**.
  - Personal transactions are "limited in availability and may not be available in some markets."
- **PayPal → M-Pesa** (REPORTED): Safaricom moved PayPal withdrawals into the M-PESA app in July 2025 and shut down the old web service on 16 August 2025 (https://techcabal.com/2025/07/23/safaricom-adds-paypal-to-m-pesa-app/, https://hapakenya.com/2025/07/28/thunes-powered-m-pesa-paypal-web-service-is-being-discontinued-on-august-16). The approximately 3% conversion fee comes from a blog (https://nashthuo.com/paypal-mpesa-charges/), so it is REPORTED only. **Answer to "can PayPal receive in Kenya?": yes. Kenya is a supported PayPal market with receive and withdraw options (VERIFIED from the fee page).**
- **PayPal India** (VERIFIED, https://www.paypal.com/in/webapps/mpp/paypal-fees):
  - The page states "For India users, we only support international payments."
  - Conversion costs a 3.0–4.0% markup.
  - A failed withdrawal costs INR 250.
  - Personal (friends-and-family) payments are not available to Indian accounts (REPORTED: dates to an RBI-driven change in 2010; https://www.medianama.com/2010/02/223-paypal-to-resume-india-payments-by-3rd-march-export-code-needed/). Indian users must supply a purpose code with each transaction (REPORTED, https://www.medianama.com/2011/05/223-paypal-now-requires-purpose-code-pan-bank-account-details-from-indian-users/).
- **Wise and Payoneer:** Wise's USD→KES fee is captured above from RPW (USD 4.87 on USD 200). Payoneer's fee page could not be fetched, so no figure is given.

### 1.4 Speed targets and status
- **G20/FSB targets** (VERIFIED, FSB, 13 October 2021, https://www.fsb.org/uploads/P131021-2.pdf, Table 1):
  - Remittances: "75% of cross-border remittance payments in every corridor to provide availability of funds for the recipient within one hour … and for the remainder … within one business day, by end-2027."
  - Transparency: all providers should disclose total cost "including those of any intermediaries", the expected delivery time and tracking of payment status, by end-2027.
  - Retail cost: global average no more than 1% by end-2027.
- **FSB progress, 9 October 2025** (VERIFIED, https://www.fsb.org/2025/10/fsb-calls-for-enhanced-policy-implementation-to-achieve-tangible-improvements-in-cross-border-payments/): "It is unlikely that satisfactory improvements at the global level will be achieved in line with the 2027 Roadmap timetable." Remittance speed has improved, but average costs remain high.
- **Swift gpi** (REPORTED, Swift pages via search): about 92% of gpi payments are credited within 24 hours and about 38–40% within 30 minutes. Swift's own documents differ slightly on the 30-minute figure.

---

## 2. Hackathon and bounty prize payout pain

### 2.1 Platform processes (primary sources)
- **Devpost** (VERIFIED, https://help.devpost.com/article/114-how-to-claim-your-hackathon-cash-prize-winners-only):
  - Claiming requires a 3-page claim form, a tax form (W-9 for US residents, **W-8BEN** for international individuals, W-8BEN-E for organisations) and a signed affidavit.
  - The signature "must be your real signature, it cannot be typed out."
  - Payment options are PayPal, Payoneer or Wise. Paper cheques are for US residents only. "Payment method options vary based on the country of residence of the winner."
  - **"The prize fulfillment process can take up to 60 days from receipt of paperwork."**
  - Payoneer registration email "may come weeks after your paperwork."
  - If a prize is undeliverable, "you may incur fees that will be deducted from your prize, or be delaying or forfeiting receipt of the prize."
  - **Team prizes go to one representative**, who "is responsible for distributing it to the other members". The platform does not see the split inside the team.
- **US withholding on prizes paid to non-residents** (REPORTED, IRS Publication 515 via search, https://www.irs.gov/publications/p515): prizes are FDAP income, generally subject to **30% withholding** unless a treaty or exemption applies. This is why W-8BEN forms are required. Whether a specific hackathon prize is withheld depends on the payer.
- **ETHGlobal** (VERIFIED, https://ethglobal.com/plus): the paid "Plus" membership advertises "Receive your prize and stakes within 10 days of hackathon end". Finalist prizes are paid in USDC to "verified wallets" (REPORTED from event prize pages, e.g. https://ethglobal.com/events/taipei/prizes). Sponsor prizes are paid at the sponsor's discretion (REPORTED, https://ethglobal.com/events/mumbai/prizes).
- **ETHDenver** (REPORTED, https://ethdenver.com/buidl/kyc-tax-payouts, page now returns 404): KYC and tax forms had a hard deadline, and missing it meant forfeiting the prize. Payout was in Polygon USDC. Some sponsor bounties were paid directly by sponsors on their own timelines.
- **Superteam Earn** (VERIFIED, https://superteamdao.notion.site/Superteam-Earn-FAQ-aedaa039b25741b1861167d68aa880b1):
  - "All sponsors have their own payout processes."
  - Superteam/Solana-sponsored winners must complete KYC and should "expect to receive the reward within 7 days of submitting the form."
  - Sponsors are urged to announce winners "within 7 days after the deadline".
  - Sponsors can pay outside the platform by copying winners' wallet addresses. In that case the platform has no record of the payment.
- **DoraHacks / TRON HackaTRON** (VERIFIED on the forum, https://forum.trondao.org/t/almost-at-the-end-of-the-season/19129): on 17 May 2023 a participant noted the DoraHacks terms put prize payment at "a period of 60 days after form submissions". Prizes were paid in milestone tranches of 30% and 70%.
- **Drips Wave (Stellar)** (REPORTED, https://docs.drips.network/wave/points-and-rewards): contributors must complete KYC to withdraw. Rewards are split by each contributor's share of points.

### 2.2 Documented delays and complaints
- **monday.com apps hackathon, paid via Devpost** (VERIFIED, https://developer-community.monday.com/api-apps-framework-4/hackathon-prizes-838):
  - 14 November 2020: a winner had not been paid.
  - 15 November 2020: a poster said "The delay is on devpost's side" and that payouts "can take up to 60 days (and sometimes even more)", because Devpost pays everyone at once, so one incomplete form holds up all payments.
  - The prize was paid by 27 November 2020.
- **HackaTRON Season 4** (VERIFIED, https://forum.trondao.org/t/hackatron-s4-2023-winners-announcements/19094?page=10): on 6 June 2023 a team wrote "we haven't received any of the prizes". Staff replied that "The remaining payments are in motion."
- **Vercel hackathon, Mendoza, Argentina, May 2026** (VERIFIED, https://community.vercel.com/t/vercel-hackathon-05-2026-awards-they-havent-arrived-yet-mendoza-argentina/45333): posted 7 July 2026. The 3rd-place family had received "ninguna noticia" (no news) from Vercel about the prize. Replies on 8 July offered help but gave no date.
- **ETHGlobal Prague project "HackerPayoutsBuddy"** (VERIFIED, https://ethglobal.com/showcase/hackerpayoutsbuddy-ipy5d): this was a hackathon entry built to track prize payouts. Its problem statement: "No more broken promises, delayed payouts, or embezzled funds." This shows builders themselves see the problem. It is not independent evidence of how often it happens.
- **Not found:** no systematic data (surveys or rates) on how often hackathon prizes are delayed or unpaid. We should say "documented cases", not "X% of hackathons".

### 2.3 Transparency gaps in what platforms show
These observations come from the pages above (VERIFIED as described):
- Devpost pays a team representative. Superteam Earn sponsors can pay off-platform. ETHGlobal sponsors pay "at their discretion".
- None of the pages reviewed publishes a per-event ledger of **funds received vs paid vs fees vs remainder carried forward**.

---

## 3. Payment failure, duplicates and idempotency

- **Failed payments** (VERIFIED, LexisNexis Risk Solutions/Accuity press release, 14 July 2021, https://risk.lexisnexis.com/about-us/press-room/press-release/20210714-true-cost-of-failed-payments):
  - Failed payments cost "$118.5 billion in fees, labor and lost business in 2020": EMEA $41.1bn, Americas $33.7bn, APAC $43.7bn.
  - "60% of organizations reported losing customers as a result of failed payments."
  - Average cost per organisation: banks about $360,000 and corporates just over $200,000 in 2020.
  - The study surveyed more than 200 payments professionals. **It gives no cross-border failure rate.**
- **Duplicate or erroneous payments** (VERIFIED, APQC CFO Perry Wiggins in CFO.com, 3 March 2020, https://www.cfo.com/news/metric-of-the-month-detect-and-prevent-duplicate-or-erroneous-payments/656852/):
  - Top performers: 0.8% of annual disbursements are duplicate or erroneous.
  - Bottom performers: 2%.
  - APQC's median is 1.5% (REPORTED, https://www.apqc.org/resource-library/resource-listing/percentage-duplicate-disbursements-processed; the full data is behind a paywall).
  - Note: the metric counts the **number** of disbursements, not their value.
- **Idempotency, general practice** (VERIFIED, Stripe, https://docs.stripe.com/api/idempotent_requests): idempotency allows "safely retrying requests without accidentally performing the same operation twice … if a connection error occurs, you can safely repeat the request without risk of creating a second object."
- **Idempotency on Stellar** (REPORTED from Stellar docs via search, https://developers.stellar.org/docs/data/apis/horizon/api-reference/errors/error-handling):
  - On a timeout, resubmit the **same signed transaction** (same sequence number) until it is included or its time bounds expire.
  - A given sequence number can be used only once, so the network applies a signed transaction at most once.
  - Rebuilding a new transaction on retry risks a double payment. Our agent should keep the signed envelope and payout ID together.
- **Stellar fees** (VERIFIED, https://developers.stellar.org/docs/learn/fundamentals/fees-resource-limits-metering): the minimum fee is **100 stroops (0.00001 XLM) per operation**, and ledger close time is "constrained to a few seconds".

---

## 4. Regulatory and practical context (for "what's next" and honest limits)

### Kenya
- **Virtual Asset Service Providers Act, 2025:**
  - EY gives commencement as 21 October 2025 (VERIFIED on EY, https://globaltaxnews.ey.com/news/2025-2314-kenya-enacts-virtual-asset-service-providers-act-2025-a-new-regulatory-era). Vellum gives 4 November 2025 (REPORTED, https://vellum.co.ke/kenyas-virtual-asset-regime-enters-compliance-phase-as-vasps-face-november-deadline/, 10 October 2026). **The sources disagree.**
  - Regulators: the CBK covers wallets, payment processors and stablecoin issuers. The CMA covers exchanges and brokers.
  - Licences are for companies only. Existing providers have one year to obtain a licence.
- **VASP Regulations, 2026** (REPORTED): gazetted 22 July 2026 as Legal Notice 134 of 2026 (https://new.kenyalaw.org/akn/ke/act/ln/2026/134/eng@2026-07-22, which blocked fetching; https://www.oraro.co.ke/virtual-asset-service-providers-regulations-2026/).
  - The deadline for existing operators is about 4 November 2026.
  - The rules reach foreign platforms that target Kenyan users.
  - We did not confirm any licence actually issued as of 23 October 2026.
  - **Honest limit:** any production off-ramp in Kenya must use a VASP licensed under this regime. On testnet this is a disclosure, not a blocker.
- **M-Pesa dominance** (REPORTED):
  - 40 million monthly active M-PESA customers in Kenya (March 2026; https://khusoko.com/2026/03/06/m-pesa-turns-19-with-40-million-customers-as-mobile-money-reshapes-kenya/).
  - About 89% share of mobile money subscriptions (Communications Authority data via https://techtrendske.co.ke/2025/12/11/airtel-money-hits-10-percent-as-mpesa-drops-below-90-kenya/).
  - 54.0 million active mobile money subscriptions at 30 June 2026 (https://tech-ish.com/2026/09/25/kenya-has-54-million-active-mobile-money-accounts-more-than-it-has-people/).
- **Stellar USDC off-ramps in Kenya:**
  - MoneyGram's USDC-on-Stellar cash-out launched 10 June 2022, with Kenya in the first wave alongside Canada, the Philippines and the US (VERIFIED, https://stellar.org/press/moneygram-launches-pioneering-global-crypto-to-cash-service-on-the-stellar-network).
  - Stellar's MoneyGram page says "170+ Countries with USDC cash-out" but does not list Kenya (VERIFIED, https://stellar.org/products-and-tools/moneygram).
  - **Current Kenya availability: UNVERIFIED.**
  - HoneyCoin has used MoneyGram for cash-out in Kenya (REPORTED, https://www.mariblock.com/honeycoin-taps-moneygram-for-crypto-to-fiat-transactions-amid-increased-push-for-crypto-remittances-in/).
  - Kotani Pay is a live B2B stablecoin-to-mobile-money provider with a Tether investment in October 2025 (REPORTED, https://allafrica.com/stories/202511030002.html). **Stellar USDC → M-Pesa via Kotani is UNVERIFIED.**
  - Yellow Card on Stellar in Kenya: **UNVERIFIED** (not researched to a primary source).

### India
- **Crypto tax** (REPORTED, https://decrypt.co/356601/no-relief-for-crypto-investors-as-india-retains-current-crypto-tax-in-budget-2026): Budget 2026 kept the **30% flat tax on virtual digital asset income** (s.115BBH) and the **1% TDS** (s.194S). Losses cannot be set off.
  - Note: the new Income-tax Act, 2025 renumbers sections from April 2026. This is UNVERIFIED and needs checking before we quote section numbers.
- **Receiving foreign prize money:**
  - Every inward remittance needs an RBI purpose code (REPORTED).
  - No specific "prize" purpose code was confirmed (UNVERIFIED). P1302 is "personal gifts and donations" and must not be misused for prize income (REPORTED, https://www.skydo.com/rbi-purpose-codes/P1302-personal-gifts-and-donations).
  - Tax treatment of a hackathon prize (s.115BB "winnings" at 30%, or other income) is **UNVERIFIED** and needs a tax adviser.
  - GST on prize money: **UNVERIFIED**.
- **Honest limit:** paying an Indian winner in USDC creates a VDA tax event for them. A real deployment would need an INR off-ramp or bank rail with a correct purpose code.

### EU / Portugal
- **MiCA** (VERIFIED, ESMA statement of 17 April 2026, ESMA75-113276571-1679, https://www.esma.europa.eu/sites/default/files/2026-04/ESMA75-113276571-1679_Statement_on_the_end_of_transitional_periods_under_MiCA.pdf): "The MiCA transitional period will officially expire across the EU on 1 July 2026. After this date, any entity providing crypto-asset services to EU clients without a MiCA licence will be in breach of EU law."
- **USDC under MiCA** (VERIFIED, Circle, 1 July 2024, https://www.circle.com/pressroom/circle-is-first-global-stablecoin-issuer-to-comply-with-mica-eus-landmark-crypto-law): Circle received an EMI licence from the French ACPR, and USDC and EURC are issued in the EU under MiCA.
- **Portugal-specific CASP status and transitional period:** not confirmed (UNVERIFIED).
- **Honest limit:** an organiser paying EU winners in stablecoins at scale should use a MiCA-authorised CASP and a MiCA-compliant EMT such as USDC or EURC.

---

## 5. Prize and grant transparency precedents

| Precedent | What it shows publicly | What it does not show / gaps | Label and source |
|---|---|---|---|
| **Open Collective** | Transparent budgets: "everyone … can see where money is coming from – and how it's being spent". An append-only ledger: "transactions on the ledger cannot be modified". Payment-processor fees and host fees are separate ledger transactions (since 2024). | Off-platform payments "will NOT be reflected unless you intentionally add them". No prize-rule engine; budgets, not rules. | VERIFIED, https://documentation.opencollective.com/llms-full.txt |
| **Stellar Community Fund** | Headline totals: "42M" awarded in XLM, 656 awarded submissions. Up to USD 150,000 in XLM per Build award, with the XLM/USD rate set at payment date (CF Benchmarks). Votes via Neural Quorum Governance. | The landing page shows no per-award payout transactions, fees or carry-forward. Round details are in blog recaps. | VERIFIED, https://communityfund.stellar.org/ |
| **Optimism Retro Funding** | Round sizes are published: Round 3 30M OP to 501 projects, Round 4 10M OP, Round 5 8M OP, Round 6 2.4M OP. Round 4 rules were published to badgeholders (500k OP cap, 1k OP minimum, median allocation with excess redistributed). | KYC is required for recipients. Delivery and fees are not shown on the round pages. | REPORTED, https://community.optimism.io/docs/citizen-house/retropgf-4, https://gov.optimism.io/t/retro-funding-4-badgeholder-manual/8239 |
| **Gitcoin Grants** | Results are posted to the governance forum, ratified by Snapshot vote, then paid out. A data dashboard and spreadsheet are provided. | No public payout-transaction explorer found. Payouts for featured rounds are run by round operators. | REPORTED, https://gitcoin.co/blog/gitcoin-grants-round-18-results-and-recap (502 on fetch) |
| **Superteam Earn** | Winners are published per listing, with on-platform pay through a wallet popup. | Sponsors may pay off-platform. No fees or remainder shown. | VERIFIED, FAQ above |
| **Devpost** | Winners are listed per hackathon. | Payout status, date and fees are not public. Team splits are handled privately by the representative. | VERIFIED, help article above |

**Gap our entry targets** (our synthesis, not a sourced claim): none of these precedents combines all of the following on one page:
1. A prize rule published **before** judging.
2. A machine-applied allocation from that rule.
3. Organiser approval recorded.
4. Per-payout on-chain transaction links.
5. Fees per payout.
6. A reserve or remainder **carried forward** to the next event.

---

## Coverage notes and gaps
- The World Bank RPW site blocks automated fetching, so the PDF and corridor pages were read in a browser session. Q3 2025 is the latest published data as of this date.
- Not found: a cross-border payment failure **rate** (LexisNexis gives costs only), systematic hackathon non-payment statistics, Payoneer fees, Chase's primary fee page, current MoneyGram-Kenya availability, and Portugal CASP or MiCA transitional specifics.
