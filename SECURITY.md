# Security Policy

Ahadi is a hackathon prototype that coordinates prize-fund payouts with a SingularityNET Omega agent on **Stellar testnet**. It moves **no real money** and uses **synthetic people and wallets only**. Because it is a payments system in shape, we hold it to payments-grade habits anyway.

## Supported Versions

| Version | Supported |
|---|---|
| `main` (buildathon prototype, October 2026) | Yes |
| Anything else | No |

## Reporting A Vulnerability

Please **do not open a public issue** for security problems.

1. Use GitHub's private vulnerability reporting on this repository (**Security** tab, then **Report a vulnerability**).
2. Include what you found, how to reproduce it, the impact you expect, and any suggested fix.
3. You will get an acknowledgement within 72 hours and a status update within 7 days.

**Integrity issues are treated as security issues.** Examples: a way to make the agent co-sign a payout the published rule does not allow; a way to settle a payout with one signature; a way to make the public ledger disagree with the chain without it being flagged; a way to pay the same request twice.

## What We Protect And How

### Keys and secrets

| Secret | Where it lives | Never |
|---|---|---|
| LLM provider key (Anthropic, ASI:One, ASI Cloud, OpenRouter) | `.env` on the host; injected into the Omega container's internal proxy, which keeps it away from the agent process | In Git, in the browser, in logs, on screen |
| Agent's testnet signing key | The bridge service's environment only | In the Omega container, the browser, Git, logs |
| Organiser's testnet signing key | A local key file imported into the organiser's browser session, held in memory | On any server, in Git, on screen |
| Telegram bot token | `.env`, bridge only | In Git, logs |
| Bridge-to-Omega `WS_TOKEN` and tool secret | `.env`, internal Docker network only | Exposed publicly |

- `.env.example` holds names only. A pre-commit scan rejects Stellar secret seeds (`S` followed by 55 base-32 characters), common API key prefixes and bot tokens.
- A committed secret is treated as exposed: rotate it (for testnet keys, regenerate the accounts), then remove it from history.

### Money integrity

- **Testnet only.** The bridge refuses to start unless the network passphrase is `Test SDF Network ; September 2015`, and refuses mainnet Horizon URLs.
- **Two signatures for every movement.** Each event fund is a Stellar account with its master key disabled and two signers (agent and organiser, weight 1 each, all thresholds 2). A test checks this configuration on chain.
- **The rule decides, not the language model.** Amounts and eligibility come from MeTTa rules over the published rule; the bridge re-checks the same rules before signing, and refuses if the rule hash differs from the one recorded on chain.
- **Idempotency.** Each request has a SHA-256 identity used as its Stellar memo and as a unique key; signed transactions are stored before submission; outcomes are confirmed on chain by hash before any retry.

### Agent isolation

- Omega runs only in Docker (`no-new-privileges`, unprivileged user, Landlock filesystem policy), as the buildathon rules require. Its own skills for shell, file writing and web search are disabled in this deployment.
- Untrusted text (messages from participants) is treated as data. A test suite of injection attempts must produce no proposal and no signature.
- Skill calls from Omega reach the bridge only on the internal Docker network, authenticated with a shared secret.

### Data

- No real people, wallets, payment details or partner data. Names in the demo are fictional and labelled.
- The public ledger shows only public keys, amounts, statuses and receipts.

## Scope

In scope: this repository's code and configuration. Out of scope: vulnerabilities in upstream projects (report those to SingularityNET Omega, the Stellar Development Foundation, NEAR, or the relevant package), Stellar testnet itself, and social engineering.
