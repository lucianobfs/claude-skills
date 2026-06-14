---
name: generate-and-filter
description: Generate-and-filter — parallel generators brainstorm many options from different angles, and one filter dedupes near-duplicates and culls everything that fails the rubric, returning only the survivors. Use when you want breadth then quality (ideas, approaches, test cases, edge cases). args: { brief, rubric?, count? }
---

# generate-and-filter

Dynamic workflow (the **Generate-and-filter** pattern from
["A harness for every task"](https://claude.com/blog/a-harness-for-every-task-dynamic-workflows-in-claude-code)).
Script: `generate-and-filter.workflow.js` in this skill's base dir.

## Setup (first time)

Agent types `wf-heavy`/`wf-judge` in `~/.claude/agents/` (copy from this skill's `agents/` if missing).

## Run

1. Build `args` (if a required field is missing, ask):
   - `brief` (required): what you need + constraints.
   - `rubric` (optional): what "good" means.
   - `count` (optional): options per angle. Default 8.
2. Invoke **Workflow** with `{ scriptPath: "<this-skill's-base-dir>/generate-and-filter.workflow.js", args }`.
3. Summarize the `kept` set. To pick a single winner, chain into `tournament`.

## Returns

`{ kept[], discarded[], totalGenerated, notes }`.

## Cost

N generators (wf-heavy) + 1 filter (wf-judge).
