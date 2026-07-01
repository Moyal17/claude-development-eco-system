# Installing claude-development-eco-system

## Prerequisites

- Claude Code CLI installed (`claude` on PATH).
- `~/.claude/` exists (Claude Code creates it on first run).
- Git, bash, and standard Unix tools.

## One-time install

```bash
git clone <this-repo> ~/sourceControl/claude-development-eco-system
cd ~/sourceControl/claude-development-eco-system
./install.sh
```

`install.sh` will:

1. Symlink every folder under `skills/` into `~/.claude/skills/`.
2. Symlink every file under `agents/` into `~/.claude/agents/`.
3. Print the settings fragments under `settings/` for you to merge into `~/.claude/settings.json` (it does **not** overwrite your settings — review and merge by hand).
4. Print the hook registrations needed if you opt in to hooks.

Re-running the script is safe; it skips symlinks that already point to the right target.

## Per-target-repo opt-in

In any repo where the team wants the ecosystem conventions to apply:

1. Copy `templates/target-repo-CLAUDE.md` to the repo's root as `CLAUDE.md` (or merge into an existing one).
2. Create the artifact folders:
   ```bash
   mkdir -p docs/{adr,research,plans,plans/archive,metrics}
   cp ~/sourceControl/claude-development-eco-system/templates/docs/research/INDEX.md docs/research/INDEX.md
   ```
3. **(Optional but recommended) Install the GHA workflows** for Claude PR review + Jira-on-merge:
   ```bash
   mkdir -p .github/workflows
   cp ~/sourceControl/claude-development-eco-system/templates/.github/workflows/claude-pr-review.yml .github/workflows/
   cp ~/sourceControl/claude-development-eco-system/templates/.github/workflows/jira-on-merge.yml .github/workflows/
   ```
   Then set the repo secrets (Settings → Secrets and variables → Actions) referenced by those workflow files: `ANTHROPIC_API_KEY`, `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`.
4. Commit the result. The repo is now opted in.

## Updating

```bash
cd ~/sourceControl/claude-development-eco-system
git pull
./install.sh   # re-runs to pick up any new skills/agents
```

## Uninstalling

`install.sh --uninstall` removes the symlinks it created. It leaves your `~/.claude/settings.json` and any per-repo `CLAUDE.md` files alone.

## Troubleshooting

- **A skill doesn't show up in Claude Code.** Run `ls -la ~/.claude/skills/` and confirm the symlink exists and points at the ecosystem folder. Restart `claude` if the slash command list is cached.
- **Symlink creation fails.** Make sure `~/.claude/skills/` and `~/.claude/agents/` exist; create them if not.
- **Hooks don't fire.** Hooks must be registered in `~/.claude/settings.json` — they're opt-in, not auto-installed. See `settings/hooks.json` for the registration block.
