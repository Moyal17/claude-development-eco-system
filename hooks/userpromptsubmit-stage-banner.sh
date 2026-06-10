#!/usr/bin/env bash
# UserPromptSubmit hook — print a one-line banner showing the current plan stage if a plan file is detected.
# Output goes to stderr by convention (Claude Code surfaces it as system context).
# Informational only — never blocks the prompt.

set -u

# Look for the most recently modified plan file in the current repo's docs/plans/.
# We use the working directory rather than a configured path so it works in any opted-in repo.
PWD_DIR="$(pwd)"
PLANS_DIR=""

# Walk up from PWD looking for docs/plans
DIR="$PWD_DIR"
while [ "$DIR" != "/" ] && [ "$DIR" != "" ]; do
  if [ -d "$DIR/docs/plans" ]; then
    PLANS_DIR="$DIR/docs/plans"
    break
  fi
  DIR="$(dirname "$DIR")"
done

[ -z "$PLANS_DIR" ] && exit 0

LATEST="$(ls -t "$PLANS_DIR"/*.md 2>/dev/null | head -n 1 || true)"
[ -z "$LATEST" ] && exit 0

# Skip the template
case "$LATEST" in *template.md) exit 0 ;; esac

# Extract stage and status from frontmatter (first 20 lines)
STAGE="$(head -n 20 "$LATEST" | grep -E '^stage:' | head -n 1 | sed -E 's/stage:[[:space:]]*//')"
STATUS="$(head -n 20 "$LATEST" | grep -E '^status:' | head -n 1 | sed -E 's/status:[[:space:]]*//')"
SLUG="$(basename "$LATEST" .md)"

if [ -n "$STAGE" ] || [ -n "$STATUS" ]; then
  printf '[plan: %s | stage: %s | status: %s]\n' "$SLUG" "${STAGE:-?}" "${STATUS:-?}" >&2
fi

exit 0
