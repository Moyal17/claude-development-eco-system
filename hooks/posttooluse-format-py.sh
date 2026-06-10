#!/usr/bin/env bash
# PostToolUse hook — format Python files after Edit/Write.
# Best-effort: silent no-op if tools or files are missing.

set -u

INPUT="$(cat || true)"

FILE="$(printf '%s' "$INPUT" | python3 -c '
import json, sys
try:
    d = json.load(sys.stdin)
except Exception:
    sys.exit(0)
for k in ("file_path","filePath","path"):
    v = d.get("tool_input",{}).get(k) or d.get(k)
    if v:
        print(v)
        break
' 2>/dev/null || true)"

[ -z "${FILE:-}" ] && exit 0
[ ! -f "$FILE" ] && exit 0

case "$FILE" in
  *.py|*.pyi) ;;
  *) exit 0 ;;
esac

# Prefer ruff format over black if both are available — ruff is faster and aligns with modern Python toolchains.
if command -v ruff >/dev/null 2>&1; then
  ruff format "$FILE" >/dev/null 2>&1 || true
  ruff check --fix --unsafe-fixes "$FILE" >/dev/null 2>&1 || true
elif command -v black >/dev/null 2>&1; then
  black --quiet "$FILE" >/dev/null 2>&1 || true
fi

exit 0
