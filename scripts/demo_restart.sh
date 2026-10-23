#!/usr/bin/env bash
# Fresh testnet fund (stopped before the agent proposes), then restart the local bridge and Omega.
#   scripts/demo_restart.sh [provider] [model]     default: OpenRouter z-ai/glm-5.3
set -euo pipefail
cd "$(dirname "$0")/.."
docker rm -f ahadi-omega >/dev/null 2>&1 || true
scripts/reset_demo.sh propose | tail -1
lsof -ti tcp:8000 -sTCP:LISTEN | xargs kill 2>/dev/null || true
sleep 1
(cd bridge && nohup uv run uvicorn ahadi_bridge.main:app --host 0.0.0.0 --port 8000 > ../.data/bridge.log 2>&1 &)
sleep 4
scripts/dev_omega.sh "${1:-OpenRouter}" "${2:-z-ai/glm-5.3}" >/dev/null
for i in $(seq 1 40); do
  if curl -s localhost:8000/api/health | grep -q '"connected":true'; then echo "ready: Omega connected"; exit 0; fi
  sleep 2
done
echo "Omega did not connect in time"; exit 1
