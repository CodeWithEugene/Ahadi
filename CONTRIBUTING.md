# Contributing To Ahadi

Thank you for helping. Ahadi is a prototype that coordinates prize-fund payouts with a SingularityNET Omega agent on Stellar testnet. Because it is shaped like a payments system, contributions follow a few extra rules.

## Ground Rules

1. **Testnet and synthetic data only.** Never add real wallets, real payment details or real people. Use the scenario in `data/scenario.json` or add invented people, labelled as sample data.
2. **The rule decides; the language model talks.** Amounts, eligibility, duplicate checks and routes belong in the MeTTa rules (`omega/plugins/ahadi/rules.metta`) with a Python mirror in `bridge/ahadi_bridge/rules.py`. A language model must never produce an amount, choose a recipient or decide to sign. Any change to one side of the rules needs the same change on the other, and the agreement test must pass.
3. **Two signatures, always.** No code path may move funds with a single signature. Changes to vault setup need the on-chain configuration test to pass.
4. **Every money state is a ledger line.** New outcomes (for example a new failure code) get a status, a plain-language reason and a test.
5. **Secrets stay out.** See [SECURITY.md](SECURITY.md). Run `scripts/secret_scan.sh` before committing.
6. **Omega stays Omega.** We use the published image with a pinned source commit and add behaviour only through our plugin (`add-skill`, prompt extensions). Do not patch Omega's core files.
7. **Copy rules for the UI.** Title Case for page titles, headings, card titles and buttons; sentence case for body text; no em or en dashes in user-facing text; money always shows its currency code; every status has an icon, a colour and a label.
8. **Design system.** shadcn/ui components, Tailwind tokens and lucide icons. Generated components in `web/components/ui/` are not hand-edited; product components live in `web/components/ahadi/`.

## Development Setup

Prerequisites: Docker Desktop, Python 3.12 with `uv`, Node 20+ with `pnpm`.

```bash
git clone <repo-url>
cd <repo>
cp .env.example .env          # add your LLM key and, optionally, a Telegram bot token
make setup                    # creates and funds Stellar testnet accounts, writes local keys
make up                       # starts Omega and the bridge with Docker Compose
make web                      # starts the web app on http://localhost:3000
```

Package managers: **uv** for Python and **pnpm** for JavaScript. Do not commit `package-lock.json` or `yarn.lock`.

## Tests

```bash
make test        # fast tests: rules, hashing, checks, injection, ledger
make test-chain  # slower tests against Stellar testnet
```

- Rule changes need tests that pin amounts in cents.
- Money-path changes need a testnet test.
- The ledger must balance after the full scenario (`make scenario`).

## Commits And Pull Requests

- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`, `perf:`, `ci:`.
- One logical change per pull request, with what changed, why, and how it was tested.

## Reporting Problems

- Bugs and ideas: open a GitHub issue with steps to reproduce.
- Integrity concerns (anything that could pay outside the rule, pay twice, or hide a failure): see [SECURITY.md](SECURITY.md) and report privately.
- Conduct: see [CODE-OF-CONDUCT.md](CODE-OF-CONDUCT.md).

## License

By contributing you agree that your contributions are licensed under the [MIT License](LICENSE.md).
