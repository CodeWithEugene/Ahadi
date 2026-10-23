.PHONY: setup omega-config up down web test test-metta test-chain scenario reset evidence

setup:            ## create and fund Stellar testnet accounts (writes .keys/)
	uv run --project bridge python scripts/setup_testnet.py

omega-config:     ## write the plugin's bridge address and tool secret for Docker Compose
	@mkdir -p .data/omega-memory/chroma_db
	@for p in prompt prompt_Anthropic prompt_ASIOne prompt_ASICloud prompt_OpenRouter prompt_OpenAI prompt_OpenAIAPI; do cp omega/memory/prompt.txt .data/omega-memory/$$p.txt; done
	@chmod -R 777 .data/omega-memory
	@. ./.env 2>/dev/null; printf '{"bridge_url":"http://bridge:8000","tool_secret":"%s"}' "$${AHADI_TOOL_SECRET:-dev-tool-secret}" > omega/plugins/ahadi/ahadi.json

up: omega-config  ## start the bridge and the Omega agent
	docker compose up -d --build

down:
	docker compose down

web:              ## run the web app on http://localhost:3000
	pnpm --dir web install && pnpm --dir web dev

test:             ## fast tests (rules, hashing, money gate, injection)
	cd bridge && uv run pytest -q

test-metta:       ## MeTTa rules vs Python mirror, run on PeTTa in the Omega image
	cd bridge && uv run pytest -q -m metta

test-chain:       ## two-key vault and failure handling on Stellar testnet
	cd bridge && uv run pytest -q -m chain

scenario:         ## the whole October story on testnet through the engine (no LLM)
	AHADI_DEMO_ORGANISER_SIGNER=1 uv run --project bridge python scripts/run_scenario.py

reset:            ## fresh accounts, stopped just before the agent proposes payouts
	scripts/reset_demo.sh propose

evidence:         ## write docs/evidence.md (tests + every receipt); bridge must be running
	uv run --project bridge python scripts/evidence.py
