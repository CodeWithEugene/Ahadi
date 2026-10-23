# AI Disclosure

The buildathon brief says: "Yes, use AI. Claude Code, Cursor and other coding assistants are welcome. Credit them in your README." This file lists every AI tool used to make Ahadi and what each did. It is updated as the work continues.

## Tools used to build Ahadi

| Tool | Provider | Used for |
|---|---|---|
| **Claude Code** (model Claude Opus 5.5) | Anthropic | Reading the official buildathon pages; running parallel research subagents (Omega, Stellar and Raven, NEAR Intents, partners and competition, problem evidence); writing the planning docs in `docs/` and the root markdown files; writing and testing the code (bridge, Omega plugin and MeTTa rules, scripts, web app) after Eugene approved the plan; designing the logo; reviewing the docs for accuracy |
| **Claude Code subagents** (same model) | Anthropic | Parallel research streams, an independent accuracy review of the docs, building individual web pages (public ledger, receipt, verify, developers, how it works, trust, about) against the shared design system; the lead session reviewed and integrated every page |
| **Raven** (Stellar Development Foundation MCP server) | SDF | Stellar development help, as the track asks (to be connected by Eugene; usage recorded in the README once used) |
| **KittenTTS 2** (`KittenML/kitten-tts-2`), run locally | KittenML | Narration of the demo video in the builder's own cloned voice, from a reference recording Eugene made of himself for this purpose (planned) |

## AI inside the product

| Component | What it does | What it never does |
|---|---|---|
| The LLM behind the Omega agent (provider and model named in the README and on `/console/agent`) | Reads messages from the organiser and participants, chooses which Omega skill to call, and writes replies | Choose an amount, a recipient, or whether to sign. Those are decided by the MeTTa rules in `omega/plugins/ahadi/ahadi.metta`, re-checked by the bridge's Python mirror |

## What AI did not do

- No real person's data, wallet or payment details were given to any AI tool. All people in the product are fictional.
- No AI system holds or uses the organiser's key; it never leaves the organiser's browser.

## Human responsibility

Eugene Mutembei (Team Technetians) chose the track, reviewed and approved the plan before any code was written, directed the product and design, holds the keys, and is accountable for everything submitted.

## Prior work

Patterns (Omega plugin with `add-skill`, rules as MeTTa atoms, the docs structure) come from our earlier BASIX entries, Mizani (https://github.com/CodeWithEugene/Basix-Hackathon) and Sawa, also built with Claude Code and disclosed there. No code was copied into this repository from them except the web app's shadcn/ui component scaffolding (`web/components/ui/`), which is generated shadcn code.
