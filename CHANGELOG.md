# Changelog

## 0.9.0 — 2026-05-18

### UI / UX

- **Bottom toolbar** — removed the top bar entirely; model, mode, gear, and new-session controls now live in a responsive row at the bottom of the composer, next to the send button. The row shrinks gracefully to icon-only when the sidebar is narrow (labels disappear, icons stay).
- **Mode selector redesign** — each mode now has a distinct icon and a one-line description (Claude Code-style popover). Agent uses a shield icon, Plan uses a list-tree icon, YOLO uses a lightning bolt.
- **Collapsible user messages** — messages taller than ~3 lines collapse automatically with a gradient fade. "Show more" appears on hover; "Show less" collapses back.
- **Tool call display** — single tool calls render as a flat row with a human-readable label ("Read sidebar.ts", "Edit package.json", "Run npm test"). Multiple calls from one agent step collapse into a grouped header ("Read, Edit +2") that expands on click.
- **Welcome screen** — xAI Grok mark logo (white), "Grok Build" title, "by Pawel Huryn (The Product Compass)" byline.

### Features

- **Reasoning effort** — configurable from the gear popover (CLI default | Low | Medium | High | XHigh | Max). Changing effort restarts the session so the new flag takes effect. Also exposed as `grok.defaultEffort` VS Code setting.
- **YOLO mode** — auto-approves all permission requests in the extension without any CLI restart. Session and memory are fully preserved; switching back to Agent or Plan mode re-enables approval cards immediately.
- **Gear / settings popover** — single gear icon opens a panel with three sections:
  - *Session*: Reasoning Effort picker, Compact conversation shortcut
  - *Config*: Open global config (`~/.grok/config.toml`), Open project config (`.grok/config.toml`), List MCP servers in a terminal
  - *Debug*: Show extension logs
- **MCP server support** — fixed: the extension was passing `mcpServers: []` in `session/new`, which blocked all MCP servers configured in the CLI. Removed; the CLI now picks up its own MCP configuration.

### Fixes

- Removed `--reasoning-effort high` default that was causing 403 errors on free/SuperGrok accounts (the flag is unsupported in stdio mode on some subscription tiers).
- Removed stale `hint` element references that caused silent JS errors in the webview.
- Popovers now position themselves above their trigger button (correct for a bottom toolbar) and clamp to stay within the panel width.

---

## 0.1.0 — unreleased

Initial preview. ACP client for `grok agent stdio`.

### Implemented

- Sidebar chat webview driven by `grok agent stdio` over ACP
- Streaming agent messages + separate thinking trace (collapsible, shows elapsed time)
- Permission-request cards with diff-editor preview (allow always / allow once / reject)
- Plan-mode toggle (`session/set_mode`) + plan-approval cards (`x.ai/exit_plan_mode`)
- Model picker (live `session/set_model`)
- Slash-command autocomplete sourced from `available_commands_update`
- Context-usage donut from prompt result `_meta.totalTokens`
- File chips with hide-toggle, Explorer drag-and-drop (Shift = embed inline)
- Right-click "Grok: Send File / Selection" in Explorer + editor
- `Ctrl+;` opens sidebar; `Alt+G` inserts @-mention for active file
- Required server→client handlers: `fs/read_text_file`, `fs/write_text_file`, `terminal/{create,output,wait_for_exit,kill,release}`
