# HeyGen API Key Setup Guide (macOS)

## Step 1: Get Your API Key

1. Go to [HeyGen Settings](https://app.heygen.com/settings) and log in
2. Click **API** in the left sidebar
3. Copy your API key

---

## Step 2: Add the Key to Claude Code Settings

Open `~/.claude/settings.json` and replace the placeholder in the `env` section:

```json
"env": {
  "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1",
  "HEYGEN_API_KEY": "paste-your-key-here"
}
```

This keeps the key scoped to Claude Code only — it won't leak into your general shell environment.

Then restart Claude Code so it picks up the new env var.

### Alternative: Shell-wide (if you also need the key in terminal)

```bash
echo 'export HEYGEN_API_KEY="paste-your-key-here"' >> ~/.zshrc
source ~/.zshrc
```

---

## Step 3: Verify It Works

Run this in your terminal (requires the shell-wide approach, or run from within Claude Code):

```bash
curl -s https://api.heygen.com/v2/user/remaining_quota \
  -H "X-Api-Key: $HEYGEN_API_KEY" | python3 -m json.tool
```

You should see a JSON response with your remaining quota. If you see `"error": null` and a `data` object, you're good.

---

## Step 4: Claude Code MCP (Already Done)

The HeyGen MCP server is already configured in `~/.claude/settings.json`:

```json
"heygen": {
  "url": "https://mcp.heygen.com/mcp/v1/"
}
```

The MCP server reads `HEYGEN_API_KEY` from the `env` section automatically. No extra config needed.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Claude Code MCP tools don't work | Restart Claude Code after adding the key. The env is only read at startup. |
| Curl returns `401 Unauthorized` | Your key is wrong or expired. Go back to HeyGen settings and regenerate it. |
| Key has quotes/spaces in it | Make sure there are no extra spaces inside the quotes in `settings.json`. |
