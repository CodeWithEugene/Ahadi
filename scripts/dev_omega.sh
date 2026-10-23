#!/usr/bin/env bash
# Run Ahadi's Omega container against a bridge on this machine (development).
#   scripts/dev_omega.sh fake                 # scripted stand-in LLM on :8765 (no key)
#   scripts/dev_omega.sh Anthropic [model]    # real provider; key read from .env
set -euo pipefail
cd "$(dirname "$0")/.."
PROVIDER="${1:-fake}"; MODEL="${2:-}"
set -a; [ -f .env ] && . ./.env; set +a
M="$PWD/.data/omega-memory"
mkdir -p "$M/chroma_db" .data/run
for p in prompt prompt_Anthropic prompt_ASIOne prompt_ASICloud prompt_OpenRouter prompt_OpenAI prompt_OpenAIAPI; do cp omega/memory/prompt.txt "$M/$p.txt"; done
chmod -R 777 "$M"
printf '{"bridge_url":"http://host.docker.internal:8000","tool_secret":"%s"}' "${AHADI_TOOL_SECRET:-dev-tool-secret}" > omega/plugins/ahadi/ahadi.json
chmod 644 omega/plugins/ahadi/ahadi.json
docker rm -f ahadi-omega >/dev/null 2>&1 || true
ARGS=(commchannel=websocket "WS_URL=ws://host.docker.internal:8000/omega" securityPolicyPath=/PeTTa/repos/Omega/profile/policy.yaml)
ENVS=()
case "$PROVIDER" in
  fake) ARGS+=(provider=OpenAIAPI openaiapi_url=http://host.docker.internal:8765/v1/ model=fake); ENVS+=(-e OPENAIAPI_API_KEY=fake) ;;
  Anthropic) ARGS+=(provider=Anthropic); ENVS+=(-e "ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY:?set ANTHROPIC_API_KEY in .env}") ;;
  ASIOne) ARGS+=(provider=ASIOne); ENVS+=(-e "ASIONE_API_KEY=${ASIONE_API_KEY:?set ASIONE_API_KEY in .env}") ;;
  ASICloud) ARGS+=(provider=ASICloud); ENVS+=(-e "ASI_API_KEY=${ASI_API_KEY:?set ASI_API_KEY in .env}") ;;
  OpenRouter) ARGS+=(provider=OpenRouter); ENVS+=(-e "OPENROUTER_API_KEY=${OPENROUTER_API_KEY:?set OPENROUTER_API_KEY in .env}") ;;
  *) echo "unknown provider $PROVIDER"; exit 1 ;;
esac
[ -n "$MODEL" ] && ARGS+=("model=$MODEL")
[ -n "${WS_TOKEN:-}" ] && ARGS+=("WS_TOKEN=$WS_TOKEN")
docker run -dit --name ahadi-omega --init --security-opt no-new-privileges:true \
  --add-host=host.docker.internal:host-gateway \
  --tmpfs /tmp:size=64m,mode=1777 --tmpfs /var/tmp:size=64m,mode=1777 --tmpfs /run:size=16m,mode=755 \
  -v "$M:/PeTTa/repos/Omega/memory" \
  -v "$PWD/omega/plugins/ahadi:/PeTTa/repos/Omega/plugins/ahadi:ro" \
  "${ENVS[@]}" ahadi-omega:dev "${ARGS[@]}"
echo "omega started with provider $PROVIDER"
