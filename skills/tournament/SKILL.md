---
name: tournament
description: Tournament — spawn N agents that attack the SAME task with different approaches, and run an elimination bracket with fresh pairwise judges until one winner remains. Use when the solution space is wide and you want the best of several attempts at one task (design, implementation strategy, copy). args: { task, approaches? }
---

# tournament

Dynamic workflow (the **Tournament** pattern from
["A harness for every task"](https://claude.com/blog/a-harness-for-every-task-dynamic-workflows-in-claude-code)).
Script: `tournament.workflow.js` in this skill's base dir.

## Setup (first time)

Agent types `wf-heavy`/`wf-judge` in `~/.claude/agents/` (copy from this skill's `agents/` if missing).

## Run

1. Build `args` (if a required field is missing, ask):
   - `task` (required): what to attempt.
   - `approaches` (optional): list of distinct approaches. If omitted, 4 generic ones are used.
2. Invoke **Workflow** with `{ scriptPath: "<this-skill's-base-dir>/tournament.workflow.js", args }`.
3. Summarize the `winner`.

## Returns

`{ winner, totalAttempts }`.

## Cost

N attempts (wf-heavy) + pairwise judges (wf-judge) per round.
