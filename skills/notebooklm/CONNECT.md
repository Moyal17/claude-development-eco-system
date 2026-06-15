# Connect NotebookLM to Claude Code

How the `notebooklm` MCP server was installed and authenticated in this environment, so the `/nlm-*` skills and `mcp__notebooklm__*` tools work end to end.

- **Project:** [jacob-bd/notebooklm-mcp-cli](https://github.com/jacob-bd/notebooklm-mcp-cli)
- **PyPI package:** `notebooklm-mcp-cli`
- **Verified version here:** `0.6.13`
- **What you get:** the `nlm` CLI and the `notebooklm-mcp` server binary
- **Auth model:** browser cookies from your real Google account (no API key)

---

## 1. Install the package

Installed as a `uv` tool (isolated venv, binaries on `PATH`):

```bash
uv tool install notebooklm-mcp-cli
```

This puts two binaries in `~/.local/bin/`:

- `nlm` — the CLI (login, notebook/source/studio commands)
- `notebooklm-mcp` — the MCP server Claude connects to

Confirm:

```bash
which nlm notebooklm-mcp
nlm --version          # -> nlm version 0.6.13
```

> No `uv`? Install it first (`curl -LsSf https://astral.sh/uv/install.sh | sh`), or use `pipx install notebooklm-mcp-cli`. The Claude Desktop one-click `.mcpb` extension is on the repo's [latest release](https://github.com/jacob-bd/notebooklm-mcp-cli/releases/latest).

---

## 2. Authenticate against your Google / NotebookLM account

Auth is cookie-based. `nlm login` opens a browser, you sign into Google, and it saves the session to a local default profile.

```bash
nlm login
```

Then verify the session is valid:

```bash
nlm login --check
```

Useful auth commands:

| Command | Purpose |
|---|---|
| `nlm login` | Log in, save cookies to the default profile |
| `nlm login --check` | Check current auth is still valid |
| `nlm login --clear` | Wipe local Chrome profile data to switch Google accounts |
| `nlm login switch <profile>` | Switch the active default profile |
| `nlm login profile list` | List saved profiles |

If the MCP server later reports auth errors, re-run `nlm login` — it refreshes the cookies the server reads.

---

## 3. Register the MCP server with Claude Code

Add the server at user scope so it's available in every project:

```bash
claude mcp add --scope user notebooklm "$HOME/.local/bin/notebooklm-mcp"
```

This writes an entry into `~/.claude.json`:

```json
"notebooklm": {
  "type": "stdio",
  "command": "/Users/user/.local/bin/notebooklm-mcp",
  "args": [],
  "env": {}
}
```

Verify the connection:

```bash
claude mcp list | grep notebooklm
# notebooklm: /Users/user/.local/bin/notebooklm-mcp  - ✔ Connected
```

---

## 4. Use it

Once connected, Claude has the `mcp__notebooklm__*` tools (e.g. `notebook_create`, `source_add`, `studio_create`, `download_artifact`, `research_start`). The presentation skills wrap them:

| Skill | Output |
|---|---|
| `/nlm-source-prep` | Curate + ingest sources into a notebook (run this first) |
| `/nlm-deck` | Slide deck (Presenter Slides) |
| `/nlm-video` | Narrated Video Overview |
| `/nlm-infographic` | Single at-a-glance infographic PNG |

Studio artifacts (audio/video/infographic/slides) generate async — Claude polls `studio_status` until done.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Authentication error` from a tool | `nlm login` again, then `nlm login --check` |
| Server shows `✘ Failed to connect` | Confirm `which notebooklm-mcp`; re-run the `claude mcp add` command with the full path |
| Wrong Google account | `nlm login --clear` then `nlm login`, or `nlm login switch <profile>` |
| Upgrade | `uv tool upgrade notebooklm-mcp-cli` |
