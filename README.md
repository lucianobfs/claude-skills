# claude-skills

Shareable skills for Claude Code (and other agents compatible with [Agent Skills](https://skills.sh)).

## Install

```bash
npx skills add lucianobfs/claude-skills
```

## The 6 dynamic-workflow patterns

The six **building blocks** from
["A harness for every task"](https://claude.com/blog/a-harness-for-every-task-dynamic-workflows-in-claude-code)
(Thariq Shihipar & Sid Bidasaria), each as its own slash-invocable skill, plus the `wf` guide:

| Skill | Pattern | args |
|---|---|---|
| `classify-and-act` | a classifier routes the task to 1 of N handlers | `{ task, routes }` |
| `fanout-and-synthesize` | 1 agent per part (clean context) → a barrier synthesizes | `{ task, parts? }` |
| `adversarial-verification` | a worker produces, N skeptics try to refute it | `{ task, rubric?, verifiers? }` |
| `generate-and-filter` | parallel generators → filter dedupes + applies the rubric | `{ brief, rubric?, count? }` |
| `tournament` | N approaches compete → pairwise bracket → 1 winner | `{ task, approaches? }` |
| `loop-until-done` | keep spawning until a stop condition | `{ task, patience?, maxRounds? }` |
| `wf` | guide: when to use each pattern + how to compose use cases | — |

**Reach for these often — not just for big jobs.** A workflow beats a single context whenever a task has
independent parts, deserves a second adversarial pass, is of unknown size, or could be approached from
several angles: verifying an answer before you trust it, exploring a design, reviewing a diff, ranking
options, hunting a root cause. Default to launching one.

**Philosophy:** we publish the **patterns** (building blocks), not canned use cases. A use case is a fixed
point in task-space — it limits you. The patterns compose and cover the long tail. The `wf` skill carries a
table of common use cases (doc verification, ranking, triage, root cause, …) and which patterns to combine
for each.

**Usage:** after installing, invoke directly by slash (`/tournament ...`) or just describe the task.

**Model/effort routing** (agent types bundled in each skill, under `agents/`):

- Orchestrator: the session model (ideal: Fable)
- `wf-heavy`: Opus @ effort **xhigh** — heavy work (investigation, verification, generation, action)
- `wf-judge`: Sonnet @ effort **max** — pairwise judges, classifiers, auditors

On first run, copy the two agent types into `~/.claude/agents/` (may require a session restart).

## Cost & budget

Each part/claim/item becomes **one or more Opus subagents at xhigh effort**. Scale the fan-out to the job:
a few agents for a quick check, a larger pool when you ask for thoroughness. To cap it, state a ceiling in
your request ("use 200k tokens") — honored via `budget`.

## License

MIT
