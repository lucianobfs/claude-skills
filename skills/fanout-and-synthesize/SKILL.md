---
name: fanout-and-synthesize
description: Fan-out-and-synthesize — quebra a task em partes independentes, 1 agente por parte em contexto limpo, e um passo-barreira sintetiza todos os resultados num só. Use quando há muitas partes independentes que se beneficiam de contexto isolado (análise por arquivo, resumo por seção, coleta multi-fonte). args: { task, parts? }
---

# fanout-and-synthesize

Workflow dinâmico (padrão **Fan-out-and-synthesize** de
["A harness for every task"](https://claude.com/blog/a-harness-for-every-task-dynamic-workflows-in-claude-code)).
Script: `fanout-and-synthesize.workflow.js` no base dir desta skill.

## Setup (1ª vez)

Agent types `wf-heavy`/`wf-judge` em `~/.claude/agents/` (copie de `agents/` desta skill se faltarem).

## Execução

1. Monte `args` (se faltar obrigatório, pergunte):
   - `task` (obrigatório): o objetivo geral.
   - `parts` (opcional): lista de subtarefas. Se omitido, um planner quebra a task em 3-8 partes.
2. Invoque **Workflow** com `{ scriptPath: "<base-dir-desta-skill>/fanout-and-synthesize.workflow.js", args }`.
3. Resuma o retorno.

## Retorno

`{ parts[], synthesis }`.

## Custo

1 agente por parte (wf-heavy) + 1 síntese. Avise antes de muitas partes; limite com "use Nk tokens".
