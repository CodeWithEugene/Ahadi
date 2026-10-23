#!/usr/bin/env bash
# Refuse to commit secrets: Stellar secret seeds, API keys, bot tokens.
#   scripts/secret_scan.sh            # scan staged changes (pre-commit)
#   scripts/secret_scan.sh --all      # scan every tracked file
set -euo pipefail
cd "$(dirname "$0")/.."
PATTERN='(^|[^A-Z2-7])S[A-Z2-7]{55}([^A-Z2-7]|$)|sk-ant-[A-Za-z0-9_-]{20,}|sk-[A-Za-z0-9]{32,}|xox[baprs]-[A-Za-z0-9-]{10,}|[0-9]{8,10}:[A-Za-z0-9_-]{35}'
if [ "${1:-}" = "--all" ]; then
  files=$(git ls-files)
else
  files=$(git diff --cached --name-only --diff-filter=ACM)
fi
hits=0
for f in $files; do
  [ -f "$f" ] || continue
  if grep -EnI "$PATTERN" "$f" >/dev/null 2>&1; then
    echo "secret-like value in $f:"; grep -EnI "$PATTERN" "$f" | cut -c1-120; hits=1
  fi
done
[ $hits -eq 0 ] && echo "secret scan: clean" || { echo "secret scan: FAILED"; exit 1; }
