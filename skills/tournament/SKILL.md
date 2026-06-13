---
name: tournament
description: Tournament — spawna N agentes que atacam a MESMA task com abordagens diferentes, e roda um bracket de eliminação com juízes pairwise frescos até sobrar 1 vencedor. Use quando o espaço de solução é amplo e você quer o melhor de várias tentativas numa task (design, estratégia de implementação, copy). args: { task, approaches? }
---

# tournament

Workflow dinâmico (padrão **Tournament** de
["A harness for every task"](https://claude.com/blog/a-harness-for-every-task-dynamic-workflows-in-claude-code)).
Script: `tournament.workflow.js` no base dir desta skill.

## Setup (1ª vez)

Agent types `wf-heavy`/`wf-judge` em `~/.claude/agents/` (copie de `agents/` desta skill se faltarem).

## Execução

1. Monte `args` (se faltar obrigatório, pergunte):
   - `task` (obrigatório): o que tentar.
   - `approaches` (opcional): lista de abordagens distintas. Se omitido, usa 4 genéricas.
2. Invoque **Workflow** com `{ scriptPath: "<base-dir-desta-skill>/tournament.workflow.js", args }`.
3. Resuma o `winner`.

## Retorno

`{ winner, totalAttempts }`.

## Custo

N tentativas (wf-heavy) + juízes pairwise (wf-judge) por rodada.
