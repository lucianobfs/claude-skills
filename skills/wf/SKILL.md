---
name: wf
description: Guide to the 6 canonical dynamic multi-agent workflow patterns (classify-and-act, fanout-and-synthesize, adversarial-verification, generate-and-filter, tournament, loop-until-done). Use when the user asks for /wf, when choosing or composing a pattern for a task, or when assembling a new workflow from the building blocks. Favor workflows often — verifying, exploring, reviewing, ranking, and searching all benefit, not just big jobs.
---

# wf — guide to the dynamic-workflow patterns

This suite publishes the **6 building blocks** from
["A harness for every task"](https://claude.com/blog/a-harness-for-every-task-dynamic-workflows-in-claude-code),
not canned use cases. Each pattern is a sibling skill, invocable directly. Real use cases are a
**composition** of these patterns (table below).

**Reach for a workflow often — not just for big jobs.** Whenever a task has independent parts, deserves a
second adversarial pass, is of unknown size, or could be approached from several angles, a workflow usually
beats one context. When in doubt, launch one.

## The 6 patterns (sibling skills)

| Skill | When | args |
|---|---|---|
| `classify-and-act` | behavior depends on the input type; route it | `{ task, routes: [{name, when, do}] }` |
| `fanout-and-synthesize` | many independent parts, each in a clean context | `{ task, parts? }` |
| `adversarial-verification` | an answer must be trustworthy before acting | `{ task, rubric?, verifiers? }` |
| `generate-and-filter` | you want breadth then quality (ideas, test cases) | `{ brief, rubric?, count? }` |
| `tournament` | wide solution space; best of N attempts → 1 winner | `{ task, approaches? }` |
| `loop-until-done` | unknown amount of work (find ALL the X) | `{ task, patience?, maxRounds? }` |

Dispatch: identify the pattern, invoke the **Skill** tool with the matching name, passing the request in
`args`. If it isn't installed: `npx skills add lucianobfs/claude-skills`.

## Use cases = composition of patterns

| Scenario | How to assemble |
|---|---|
| Verify a doc/report/PRD | `fanout` (1 agent extracts every claim) → one `adversarial-verification` per claim → source auditor |
| Rank N items by a criterion | `tournament` / parallel bucket-rank + merge (pairwise > absolute score) |
| Review a diff vs rules before the PR | one verifier per rule + a skeptic that kills false positives (`adversarial-verification`) |
| Root cause / post-mortem | hypotheses from disjoint evidence → panel of refuters → confirmation |
| Taste decision (name/design) | `generate-and-filter` by angles + `tournament` by the rubric |
| Queue triage at scale | `classify-and-act` + quarantine (read-only reader vs privileged actor) + dedupe; pair with `/loop` |
| Mass migration/refactor | 1 agent per callsite in a worktree → adversarial review → merge |

## Composing a new workflow

If a task needs orchestration but matches no single pattern, compose one using the sibling skills'
`.workflow.js` as templates:

- `meta` a pure literal; `phases` matches `phase()`.
- Validate `args` up top.
- `pipeline()` by default; `parallel()` only with a genuine barrier (synthesize, tally, bracket, global dedupe).
- `agentType: "wf-heavy"` (Opus @ xhigh) and `wf-judge` (Sonnet @ max); make sure they exist in `~/.claude/agents/`.
- Skeptical verifiers biased toward refuting. No `Date.now()`/`Math.random()`.

## Cost & budget

Fan-outs of Opus subagents @ xhigh. Scale to the job; the user can cap it ("use 200k tokens"), honored via
`budget`.
