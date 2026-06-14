---
name: classify-and-act
description: Classify-and-act — a classifier routes the task to 1 of N defined handlers, then the chosen handler executes. Use when the right behavior depends on the input type (route a request, ticket, file, or question to the matching handler). args: { task, routes: [{name, when, do}] }
---

# classify-and-act

Dynamic workflow (the **Classify-and-act** pattern from
["A harness for every task"](https://claude.com/blog/a-harness-for-every-task-dynamic-workflows-in-claude-code)).
Script: `classify-and-act.workflow.js` in this skill's base dir.

## Setup (first time on this machine)

Uses the agent types `wf-heavy` (Opus @ xhigh) and `wf-judge` (Sonnet @ max). If `~/.claude/agents/wf-heavy.md`
and `wf-judge.md` don't exist, copy them from this skill's `agents/` (may require a session restart).

## Run

1. Build `args` from the request (if a required field is missing, ask — don't invent):
   - `task` (required): what to route/handle.
   - `routes` (required): `[{ name, when, do }]`, ≥2 routes.
2. Invoke the **Workflow** tool with `{ scriptPath: "<this-skill's-base-dir>/classify-and-act.workflow.js", args }`.
3. Summarize the return in readable prose — don't dump raw JSON.

## Returns

`{ route, reason, result }`.

## Cost

1 classifier (wf-judge) + 1 handler (wf-heavy). Cheap. For many items, run the body in `pipeline`.
