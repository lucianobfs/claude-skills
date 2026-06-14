---
name: adversarial-verification
description: Adversarial verification — a worker produces the output and N independent verifiers try to REFUTE it against a rubric; it survives only if the panel can't take it down. Use when an answer must be trustworthy before you ship or act on it. args: { task, rubric?, verifiers? }
---

# adversarial-verification

Dynamic workflow (the **Adversarial verification** pattern from
["A harness for every task"](https://claude.com/blog/a-harness-for-every-task-dynamic-workflows-in-claude-code)).
Script: `adversarial-verification.workflow.js` in this skill's base dir.

## Setup (first time)

Agent types `wf-heavy`/`wf-judge` in `~/.claude/agents/` (copy from this skill's `agents/` if missing).

## Run

1. Build `args` (if a required field is missing, ask):
   - `task` (required): what to produce.
   - `rubric` (optional): what "correct" means. Default: factually correct, complete, no unsupported claims.
   - `verifiers` (optional): number of skeptics. Default 3.
2. Invoke **Workflow** with `{ scriptPath: "<this-skill's-base-dir>/adversarial-verification.workflow.js", args }`.
3. Summarize; highlight `objections` when `survived=false`.

## Returns

`{ output, survived, refutedBy, of, objections[] }`.

## Cost

1 worker (wf-heavy) + N verifiers (wf-judge).
