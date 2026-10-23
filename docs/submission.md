# Submission: Fields For The BASIX.MARKET Entry Form

> Entry form: https://www.basix.market/lms/buildathon/4/submission. Limits from the form: title 80, tagline 140, description 120 to 4,000 characters, video file upload.

## Project Title

Ahadi

## Tagline

An Omega agent that pays prize winners from a published rule, only with approval, and shows every dollar on a public Stellar ledger.

## Live Demo

https://ahadi.codewitheugene.top

## GitHub Repository

https://github.com/CodeWithEugene/Ahadi

## Demo Video

`Ahadi-Demo.mp4` (2:32, 1080p, narrated in the builder's cloned voice, captioned)

## Description

**Track:** Global payouts and prize transparency · **Entry type:** New build · **Team:** Technetians (Eugene Mutembei, solo, Nairobi)

**The problem.** Prize funds are usually a spreadsheet and a promise. BASIX's first fund was USD 1,700 sized for 50 teams; six teams won and USD 1,000 rolled forward. Participants see the headline, but not the rule behind it, each payout, its cost or its receipt, and small cross-border payouts are slow and expensive.

**What Ahadi does.** Ahadi ("promise" in Kiswahili) is a SingularityNET Omega agent that coordinates a prize fund on Stellar testnet:
1. The funding rule is published before registration; its SHA-256 hash is recorded on the fund account, and anyone can recompute it in the browser.
2. At cutoff Ahadi derives every amount in MeTTa (20 of 50 eligible → 40% → USD 680 across six places, USD 1,020 reserved).
3. Each payout needs two signatures. Every fund is a 2-of-2 vault (fund key disabled; Ahadi and the organiser weight 1, thresholds 2). Ahadi signs only what its MeTTa rules allow; alone, Stellar refuses it (tx_bad_auth). The organiser signs in the browser; the key never leaves it.
4. Every ledger line links to its testnet receipt; the memo is the request's fingerprint.
5. Failures and duplicates are handled: a wallet that was never activated gets its prize held as a 30-day claimable balance; "please pay again" gets the original receipt; a message that tries to override the rule is refused on three checks and recorded.
6. The reserve moves to the next event's fund with a receipt, and the ledger matches the chain to the cent.
7. A winner who wants another chain gets a NEAR Intents dry quote (simulated, as the track asks).

**How Omega does the work.** Omega v0.1.20 with main source at commit 63a7826 runs in Docker on OpenRouter (Kimi K3; GLM 5.3 tested). Our Omega plugin adds ten skills (ahadi-derive, ahadi-propose, ahadi-request, ahadi-carry-forward and others) and the funding rules in MeTTa: nine named checks decide allowed or refused, the route, and the next step after a network failure. The language model only reads messages, picks skills and writes replies; it never chooses an amount or a signature. A FastAPI bridge is Omega's websocket channel (web console and Telegram relay), re-checks every MeTTa decision with a Python mirror and signs only if both agree. Omega's long-term memory recalls past requests and events.

**Evidence.** 36 fast tests; 60 decisions and 20 derivations where MeTTa (run on PeTTa in the Omega image) agrees with Python; 7 live testnet tests (each key alone refused, both settle, resent envelope pays once, unactivated wallet held). The whole flow passes end to end in the browser on the real model. Network drops are recovered by transaction hash without paying twice. Details: docs/evidence.md.

**Simulated or mocked.** Stellar testnet with a demo USD asset; the NEAR leg is a dry quote; all people, teams and wallets are fictional; the console uses a demo passcode.

**What's next.** Real USDC on mainnet, 2-of-3 approvals, cash-out to M-Pesa through Stellar anchors, driving the Stellar Disbursement Platform for bulk payouts, and running BASIX's next event on it.

**AI disclosure.** Built with Claude Code (Anthropic, Claude Opus 5.5) as the brief allows; narration in the builder's own cloned voice (KittenTTS 2). Details in AI_DISCLOSURE.md.
