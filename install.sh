#!/usr/bin/env bash
# install.sh — link claude-development-eco-system assets into ~/.claude/
# Usage: ./install.sh                # install (symlink skills + agents + knowledge)
#        ./install.sh --uninstall    # remove symlinks created by this script
#        ./install.sh --dry-run      # show what would happen, no changes

set -euo pipefail

ECO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_DIR="${HOME}/.claude"
SKILLS_DIR="${CLAUDE_DIR}/skills"
AGENTS_DIR="${CLAUDE_DIR}/agents"
PERSONAL_CLAUDE_MD="${CLAUDE_DIR}/CLAUDE.md"
PERSONAL_CLAUDE_TEMPLATE="${ECO_ROOT}/templates/personal-claude-md.template"

DRY_RUN=0
UNINSTALL=0
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    --uninstall) UNINSTALL=1 ;;
    *) echo "Unknown flag: $arg" >&2; exit 2 ;;
  esac
done

run() {
  if [ "$DRY_RUN" -eq 1 ]; then
    echo "DRY-RUN: $*"
  else
    "$@"
  fi
}

ensure_dir() {
  if [ ! -d "$1" ]; then
    run mkdir -p "$1"
  fi
}

link_one() {
  local src="$1"
  local dest="$2"
  if [ -L "$dest" ]; then
    local current
    current="$(readlink "$dest")"
    if [ "$current" = "$src" ]; then
      echo "  ok    $(basename "$dest") (already linked)"
      return
    fi
    # Stale symlink that still points into our eco-system: replace it.
    case "$current" in
      "$ECO_ROOT"/*)
        run rm "$dest"
        run ln -s "$src" "$dest"
        echo "  fix   $(basename "$dest") (was -> $current, now -> $src)"
        return
        ;;
      *)
        echo "  warn  $(basename "$dest") is a symlink to $current — skipping. Remove it manually if you want this script to manage it."
        return
        ;;
    esac
  fi
  if [ -e "$dest" ]; then
    echo "  warn  $(basename "$dest") exists and is not a symlink — skipping. Move it aside if you want this script to manage it."
    return
  fi
  run ln -s "$src" "$dest"
  echo "  link  $(basename "$dest") -> $src"
}

unlink_one() {
  local src="$1"
  local dest="$2"
  if [ -L "$dest" ]; then
    local current
    current="$(readlink "$dest")"
    if [ "$current" = "$src" ]; then
      run rm "$dest"
      echo "  rm    $(basename "$dest")"
      return
    fi
  fi
  echo "  skip  $(basename "$dest") (not managed by this script)"
}

ensure_dir "$SKILLS_DIR"
ensure_dir "$AGENTS_DIR"

if [ "$UNINSTALL" -eq 1 ]; then
  echo "Uninstalling claude-development-eco-system symlinks..."
  echo "Active skills:"
  for src in "$ECO_ROOT"/skills/*/; do
    [ -d "$src" ] || continue
    src="${src%/}"
    name="$(basename "$src")"
    [ "$name" = "knowledge" ] && continue
    unlink_one "$src" "$SKILLS_DIR/$name"
  done
  echo "Knowledge skills:"
  for src in "$ECO_ROOT"/skills/knowledge/*/; do
    [ -d "$src" ] || continue
    src="${src%/}"
    name="$(basename "$src")"
    unlink_one "$src" "$SKILLS_DIR/$name"
  done
  echo "Agents:"
  for src in "$ECO_ROOT"/agents/*.md; do
    [ -f "$src" ] || continue
    name="$(basename "$src")"
    unlink_one "$src" "$AGENTS_DIR/$name"
  done
  echo "Done. settings.json and ~/.claude/CLAUDE.md are untouched."
  exit 0
fi

echo "Installing claude-development-eco-system from $ECO_ROOT"
echo

echo "Active skills -> $SKILLS_DIR"
for src in "$ECO_ROOT"/skills/*/; do
  [ -d "$src" ] || continue
  src="${src%/}"
  name="$(basename "$src")"
  # Skip the knowledge namespace folder — its sub-skills are linked individually below.
  [ "$name" = "knowledge" ] && continue
  link_one "$src" "$SKILLS_DIR/$name"
done
echo

echo "Knowledge skills (auto-activating) -> $SKILLS_DIR"
for src in "$ECO_ROOT"/skills/knowledge/*/; do
  [ -d "$src" ] || continue
  src="${src%/}"
  name="$(basename "$src")"
  link_one "$src" "$SKILLS_DIR/$name"
done
echo

echo "Agents -> $AGENTS_DIR"
for src in "$ECO_ROOT"/agents/*.md; do
  [ -f "$src" ] || continue
  name="$(basename "$src")"
  link_one "$src" "$AGENTS_DIR/$name"
done
echo

# Agent teams — role prompts, team configs. Vendored at $ECO_ROOT/teams.
# Skills and project CLAUDE.md files hardcode ~/sourceControl/claude-teams,
# so keep that path alive as a symlink into this repo.
TEAMS_LINK="$HOME/sourceControl/claude-teams"
echo "Agent teams -> $TEAMS_LINK"
link_one "$ECO_ROOT/teams" "$TEAMS_LINK"
echo

# Legacy code-review path — the binding code_reviewer.md role prompt reads
# ~/sourceControl/claude-skills/code-review/SKILL.md. Keep it a symlink to the
# eco-system copy so the two can't drift. Only replace a real file if it is
# byte-identical; otherwise warn and leave it for manual reconciliation.
LEGACY_CODE_REVIEW="$HOME/sourceControl/claude-skills/code-review/SKILL.md"
ECO_CODE_REVIEW="$ECO_ROOT/skills/code-review/SKILL.md"
ensure_dir "$(dirname "$LEGACY_CODE_REVIEW")"
echo "Legacy code-review path -> $LEGACY_CODE_REVIEW"
if [ ! -L "$LEGACY_CODE_REVIEW" ] && [ -f "$LEGACY_CODE_REVIEW" ]; then
  if cmp -s "$LEGACY_CODE_REVIEW" "$ECO_CODE_REVIEW"; then
    run rm "$LEGACY_CODE_REVIEW"
  else
    echo "  warn  $LEGACY_CODE_REVIEW differs from eco-system copy — not replacing. Reconcile manually."
  fi
fi
link_one "$ECO_CODE_REVIEW" "$LEGACY_CODE_REVIEW"
echo

# Personal CLAUDE.md — install only if missing. Never overwrite an existing one.
echo "Personal CLAUDE.md -> $PERSONAL_CLAUDE_MD"
if [ -e "$PERSONAL_CLAUDE_MD" ]; then
  echo "  ok    $PERSONAL_CLAUDE_MD already exists — leaving as-is."
  echo "        (Template at $PERSONAL_CLAUDE_TEMPLATE if you want to compare.)"
else
  if [ -f "$PERSONAL_CLAUDE_TEMPLATE" ]; then
    run cp "$PERSONAL_CLAUDE_TEMPLATE" "$PERSONAL_CLAUDE_MD"
    echo "  copy  installed from template"
  else
    echo "  warn  template missing at $PERSONAL_CLAUDE_TEMPLATE"
  fi
fi
echo

echo "Done."
echo
echo "Settings (manual merge required):"
echo "  Permissions fragment: $ECO_ROOT/settings/permissions.json"
echo "  Hooks fragment:       $ECO_ROOT/settings/hooks.json"
echo "Open ~/.claude/settings.json and merge the relevant fragments by hand."
echo
echo "Per-target-repo opt-in:"
echo "  cp $ECO_ROOT/templates/target-repo-CLAUDE.md <repo>/CLAUDE.md"
echo "  mkdir -p <repo>/docs/{adr,research,plans,plans/archive,onboarding,metrics}"
echo "  cp $ECO_ROOT/templates/docs/research/INDEX.md <repo>/docs/research/INDEX.md"
