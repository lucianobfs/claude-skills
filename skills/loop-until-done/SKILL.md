---
name: loop-until-done
description: Loop-until-done — keep spawning agents to do more of an open-ended task until a stop condition (no new findings for N rounds), instead of a fixed number of passes. Use when the amount of work is unknown (find ALL the bugs, ALL the broken links, every TODO). args: { task, patience?, maxRounds? }
---

# loop-until-done

Dynamic workflow (the **Loop until done** pattern from
["A harness for every task"](https://claude.com/blog/a-harness-for-every-task-dynamic-workflows-in-claude-code)).
Script: `loop-until-done.workflow.js` in this skill's base dir.

## Setup (first time)

Agent types `wf-heavy`/`wf-judge` in `~/.claude/agents/` (copy from this skill's `agents/` if missing).

## Run

1. Build `args` (if a required field is missing, ask):
   - `task` (required): what to keep finding/doing.
   - `patience` (optional): consecutive empty rounds before stopping. Default 1.
   - `maxRounds` (optional): safety backstop. Default 12.
2. Invoke **Workflow** with `{ scriptPath: "<this-skill's-base-dir>/loop-until-done.workflow.js", args }`.
3. Summarize `findings` and `stoppedReason`.

## Returns

`{ findings[], rounds, stoppedReason }`.

## Cost

1 agent (wf-heavy) per round until the stop condition. Pair with `/loop` to run continuously.
