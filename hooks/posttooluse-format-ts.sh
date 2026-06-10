#!/usr/bin/env bash
# PostToolUse hook — format TS/JS files after Edit/Write.
# Reads tool input from stdin (JSON). Exits 0 quietly if no formatter, no file, or non-TS/JS file.
# This hook is best-effort — it never blocks the model.

set -u

# Read the hook input JSON from stdin
INPUT="$(cat || true)"

# Extract the file path the tool just touched. Hook payloads vary by tool; try a few common keys.
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
  *.ts|*.tsx|*.js|*.jsx|*.mjs|*.cjs|*.json|*.md|*.css|*.scss|*.html|*.yaml|*.yml) ;;
  *) exit 0 ;;
esac

# Find a prettier — prefer repo-local, fall back to global
PRETTIER=""
DIR="$(dirname "$FILE")"
while [ "$DIR" != "/" ] && [ "$DIR" != "." ]; do
  if [ -x "$DIR/node_modules/.bin/prettier" ]; then
    PRETTIER="$DIR/node_modules/.bin/prettier"
    break
  fi
  DIR="$(dirname "$DIR")"
done
[ -z "$PRETTIER" ] && PRETTIER="$(command -v prettier || true)"
[ -z "$PRETTIER" ] && exit 0

"$PRETTIER" --write "$FILE" >/dev/null 2>&1 || true
exit 0
