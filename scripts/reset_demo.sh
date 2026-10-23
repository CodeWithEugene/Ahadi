#!/usr/bin/env bash
# Fresh testnet accounts and a fresh ledger, stopped at a chosen step of the October story.
#   scripts/reset_demo.sh [step]   step: one of deposit rule attest propose control approve ... (default: propose)
set -euo pipefail
cd "$(dirname "$0")/.."
STEP="${1:-propose}"
uv run --project bridge python scripts/setup_testnet.py --fresh
AHADI_DEMO_ORGANISER_SIGNER=1 uv run --project bridge python scripts/run_scenario.py --stop-before "$STEP"
rm -rf .data/omega-memory
echo "reset done (stopped before $STEP). Restart the bridge and Omega."
