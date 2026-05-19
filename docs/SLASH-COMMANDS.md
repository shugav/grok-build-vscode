# Slash commands

Slash commands are sourced live from the running CLI via the ACP `available_commands_update` notification — the list reflects exactly what your installed `grok` version supports. Type `/` in the composer to open autocomplete.

This page is a snapshot for reference; the autocomplete list is the source of truth.

## Session & context

| Command | Effect |
|---|---|
| `/compact` | Compress conversation history to free context |
| `/context` | Show context window usage and session stats |
| `/session-info` | Show current model, turns, and context usage |
| `/flush` | Flush conversation memory to disk |
| `/new` | Start a fresh session |

## Modes & behaviour

| Command | Effect |
|---|---|
| `/plan` | Enter plan mode (draft plan before acting) |
| `/yolo` | Enable auto-approval for the session |
| `/always-approve` | Toggle always-approve (skip all permission prompts) |

## Memory

| Command | Effect |
|---|---|
| `/memory` | Browse, view, and manage memories |
| `/dream` | Memory consolidation (merge session logs into organised topics) |

## Agents & coding

| Command | Effect |
|---|---|
| `/implement` | Full implement → review → fix loop with subagent reviewers |
| `/review` | Review uncommitted changes, a branch, or a GitHub PR |
| `/pr-babysit` | Monitor PRs, fix CI failures, address review comments |
| `/check` | Verify changes with a subagent self-verification loop |
| `/design` | Design-doc writer + reviewer loop until consensus |
| `/best-of-n` | Run N parallel implementations and pick the best |
| `/loop` | Run a prompt on a recurring interval |

## Document & media skills

| Command | Effect |
|---|---|
| `/docx` | Create, read, or edit Word documents |
| `/pptx` | Create or edit PowerPoint presentations |
| `/xlsx` | Work with spreadsheets (.xlsx / .csv) |
| `/imagine` | Generate an image from a text description |
| `/imagine-video` | Generate a video from a text description |

## System

| Command | Effect |
|---|---|
| `/help` | Grok docs (config, MCP, auth, skills) |
| `/plugins` | List, reload, trust, add, or remove plugins |
| `/create-skill` | Create a new Grok skill |
| `/feedback` | Send feedback about the current session |
