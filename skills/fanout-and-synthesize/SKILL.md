---
name: fanout-and-synthesize
description: Fan-out-and-synthesize — split a task into independent parts, 1 agent per part in a clean context, and a barrier step synthesizes all results into one. Use when there are many independent parts that benefit from isolated context (per-file analysis, per-section summary, multi-source gather). args: { task, parts? }
---

# fanout-and-synthesize

Dynamic workflow (the **Fan-out-and-synthesize** pattern from
["A harness for every task"](https://claude.com/blog/a-harness-for-every-task-dynamic-workflows-in-claude-code)).
Script: `fanout-and-synthesize.workflow.js` in this skill's base dir.

## Setup (first time)

Agent types `wf-heavy`/`wf-judge` in `~/.claude/agents/` (copy from this skill's `agents/` if missing).

## Run

1. Build `args` (if a required field is missing, ask):
   - `task` (required): the overall goal.
   - `parts` (optional): list of subtasks. If omitted, a planner splits the task into 3–8 parts.
2. Invoke **Workflow** with `{ scriptPath: "<this-skill's-base-dir>/fanout-and-synthesize.workflow.js", args }`.
3. Summarize the return.

## Returns

`{ parts[], synthesis }`.

## Cost

1 agent per part (wf-heavy) + 1 synthesis. For many parts, scale to the job; cap with "use Nk tokens".
