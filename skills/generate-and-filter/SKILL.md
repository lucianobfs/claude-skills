---
name: generate-and-filter
description: Generate-and-filter — geradores em paralelo brainstormam muitas opções por ângulos diferentes, e um filtro dedupe near-duplicates e corta tudo que falha a rubrica, devolvendo só os sobreviventes. Use quando quer amplitude e depois qualidade (ideias, abordagens, casos de teste, edge cases). args: { brief, rubric?, count? }
---

# generate-and-filter

Workflow dinâmico (padrão **Generate-and-filter** de
["A harness for every task"](https://claude.com/blog/a-harness-for-every-task-dynamic-workflows-in-claude-code)).
Script: `generate-and-filter.workflow.js` no base dir desta skill.

## Setup (1ª vez)

Agent types `wf-heavy`/`wf-judge` em `~/.claude/agents/` (copie de `agents/` desta skill se faltarem).

## Execução

1. Monte `args` (se faltar obrigatório, pergunte):
   - `brief` (obrigatório): o que precisa + restrições.
   - `rubric` (opcional): o que é "bom".
   - `count` (opcional): opções por ângulo. Default 8.
2. Invoque **Workflow** com `{ scriptPath: "<base-dir-desta-skill>/generate-and-filter.workflow.js", args }`.
3. Resuma os `kept`. Pra escolher 1 vencedor, encadeie no `tournament`.

## Retorno

`{ kept[], discarded[], totalGenerated, notes }`.

## Custo

N geradores (wf-heavy) + 1 filtro (wf-judge).
