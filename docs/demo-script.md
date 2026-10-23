# Demo Script: The 3-Minute Video And The Live Showcase

> **Purpose.** The exact story, shots, words and timings for (1) the uploaded demo video (required file on the entry form) and (2) the live filmed showcase at **16:15 EAT on Saturday 24 October** (3 minutes per team, filmed by beyondthecode.ai). The brief asks the showcase to cover "**the problem, a working demonstration, your contribution, your next step**", and the submission video to cover "**the user flow, what Omega contributes, the result.**" This script covers all six.
>
> **Last updated:** Friday 23 October 2026. Final wording is set after the build, against what really runs.

---

## 1. Rules For The Video

1. **Hard cap 3:00; target 2:50.**
2. One story: **the October fund** ([solution.md](solution.md) §4). One organiser, six winners in three cities, two events.
3. The five Track 02 checklist items appear **in the track's own order**, each with the Checklist Strip ticking green.
4. Every number on screen changes for a visible reason (rule, approval, failure, memory).
5. Real testnet: open at least two receipts on stellar.expert on camera.
6. Omega visible: the container running, a skill call, a memory recall in a fresh session, a MeTTa derivation, a refusal.
7. No secrets on screen. Public keys only. Terminal shows redacted logs.
8. Captions burned in; narration in Eugene's voice (live) or Eugene's recorded voice; calm music bed at low volume.
9. "Testnet · No real money" visible throughout.
10. **Nothing in the hook that Eugene has not confirmed.** The personal story is used only in the words Eugene approves.

---

## 2. The Video, Shot By Shot (2:50)

| Time | Section | On screen | Narration (draft) |
|---|---|---|---|
| 0:00–0:18 | **Problem** | Black title: "A prize is a promise." Then the BASIX hackathon 1 page: "$1,700 … 50 teams … $1,000 rolling into the next hackathon" | "BASIX's first hackathon had a USD 1,700 prize fund for fifty teams. Fewer than half qualified, six earned prizes, and a thousand dollars rolled forward. [Optional line, only in Eugene's own confirmed words, e.g. 'My team won that hackathon from Nairobi.'] Today, a prize fund is a spreadsheet and a promise. Ahadi makes it a promise anyone can check." |
| 0:18–0:40 | **1. Rule published** | Console → Publish Rule; Ahadi restates the rule; "Show as MeTTa"; hash; stellar.expert shows the `manageData` entry; Checklist item 1 ✓ | "Before anyone registers, the organiser publishes the rule. Ahadi, our Omega agent, turns it into MeTTa and records its fingerprint on Stellar testnet. Change the rule later, and everyone sees it." |
| 0:40–1:02 | **Proposals + 2. approval** | Attest 20 eligible → Derivation Trail (40% → 680 → 170.00); six Proposal Cards with checks and fees; the agent submits alone → **`tx_bad_auth`** on the Signature Meter; Checklist item 2 ✓ | "Twenty of fifty teams qualified, so the rule releases forty percent: six hundred and eighty dollars for six places, one thousand and twenty held for the next event. Ahadi checks every winner, signs its half, and stops. It is one of two keys on the fund: try to pay alone, and Stellar refuses." |
| 1:02–1:18 | **3. Receipts** | Inês clicks Approve And Sign; ledger line slides in, Paid; open receipt on stellar.expert; memo = request hash ✓; Checklist item 3 ✓ | "The organiser signs. Five seconds later it is settled, and the ledger line links to its receipt. The memo is the request's fingerprint, so anyone can match them." |
| 1:18–1:52 | **4. Failure and duplicate** | Arjun's payout fails `op_no_destination` → Ahadi explains and proposes Held for 30 days → approved → Held line. Telegram: Tomás "please send it again" → Ahadi replies with the original receipt → Duplicate line. Injected message → Rejected by rule. Checklist item 4 ✓ | "Arjun's wallet in Chennai was never activated, so the payment fails. Ahadi doesn't retry blindly: it holds his prize on the ledger for thirty days. Tomás asks to be paid again; Ahadi remembers he already was and sends him his receipt. And a message that tries to rewrite the rule is treated as data, and refused." |
| 1:52–2:05 | **Simulated cross-chain** | Amani's Proposal Card with a NEAR Intents dry quote: amount out, fees, ETA, "Simulated" chip | "When a winner wants another chain, Ahadi gets a real NEAR Intents dry quote, clearly simulated, and pays on Stellar testnet." |
| 2:05–2:28 | **5. Carry-forward + memory** | Close event 1 → reserve moves to event 2 fund → receipt. New session: "What does the next event start with?" Ahadi answers from memory with the receipt. Public ledger: **Balanced ✓**. Checklist item 5 ✓ | "At close, the reserve moves to the next event's fund, with a receipt. In a fresh session Ahadi still remembers where every dollar went. Received equals paid, plus held, plus carried. Balanced." |
| 2:28–2:42 | **What Omega contributes** | Split screen: the Omega container and activity stream (skill calls, memory, MeTTa) | "The language model reads and writes messages. MeTTa decides every amount. Omega's memory remembers every request across events. And the money cannot move without the organiser's second signature." |
| 2:42–2:50 | **Contribution + next step** | Home page; URL ahadi.codewitheugene.top; "Built solo in 26 hours by Technetians" | "Built in twenty-six hours from Nairobi. Next: real USDC, cash-out to M-Pesa through Stellar anchors, and BASIX's next event. A prize is a promise. Ahadi keeps it in public." |

---

## 3. The Live Showcase (3 minutes, filmed)

The live version follows the same order but runs on the deployed product and real Omega:

- **Prepare before 16:00 EAT:** two browser windows (console, public ledger), the Telegram chat, the Omega container running and warmed (one throwaway message 2 minutes before), a fresh event 1 already published with proposals waiting (so live time is spent on approve, fail, duplicate and carry-forward, not on setup).
- **Live path:** approve one payout → open its receipt → trigger the duplicate on Telegram → show the held failure → carry forward → ask the memory question → close on Balanced.
- **If the LLM is slow:** keep talking over the Derivation Trail while it answers; if more than 20 seconds, switch to the recorded video (open in a third tab, cued to 1:18).
- **If the network is slow:** show the already-settled receipts; explain the 5-second finality from the recorded video.
- **If anything fails:** say so plainly and show the recorded run. Honesty about failure is on brand for this product.

Camera: webcam on for the opening line and the closing line; screen share for the rest. Mic tested at 15:45 EAT.

---

## 4. Lines To Have Ready For Q&A

| Likely question | Answer |
|---|---|
| "What does Omega do that a script can't?" | It holds the rule in MeTTa and derives every amount with a trail; it remembers every request across sessions and events; it talks to organisers and winners in plain language on Telegram; and it refuses requests outside the rule, including injected ones. A script does one of those, badly |
| "Couldn't the organiser just pay directly?" | Not from this fund. The master key is disabled; the account needs both the agent's and the organiser's signatures. The organiser can refuse to approve; they cannot pay outside the rule |
| "What if the agent is wrong?" | It can only propose; a human approves; the rule and every derivation are public; and the rule's hash was fixed before registration, so a wrong rule is visible to everyone |
| "Why Stellar?" | The track asks for it, and it fits: five-second settlement, fees of a fraction of a cent, native multisig, memos, claimable balances, public receipts, and anchors for local cash-out |
| "How would BASIX use this next week?" | Publish the next event's rule now; run the ledger in public alongside the current payout process; switch approvals to Ahadi when comfortable |
| "What's simulated?" | The cross-chain leg (NEAR Intents dry quote), the demo USD asset, the people and wallets. Everything else really runs on testnet |
| "Is it secure?" | Testnet only; Omega only in Docker; the organiser key never in the container; secrets never in Git or on screen; injection tests in the suite |
