---
name: adversarial-verification
description: Adversarial verification — um worker produz a saída e N verificadores independentes tentam REFUTÁ-la contra uma rubrica; só sobrevive se o painel não derrubar. Use quando uma resposta precisa ser confiável antes de você publicar/agir. args: { task, rubric?, verifiers? }
---

# adversarial-verification

Workflow dinâmico (padrão **Adversarial verification** de
["A harness for every task"](https://claude.com/blog/a-harness-for-every-task-dynamic-workflows-in-claude-code)).
Script: `adversarial-verification.workflow.js` no base dir desta skill.

## Setup (1ª vez)

Agent types `wf-heavy`/`wf-judge` em `~/.claude/agents/` (copie de `agents/` desta skill se faltarem).

## Execução

1. Monte `args` (se faltar obrigatório, pergunte):
   - `task` (obrigatório): o que produzir.
   - `rubric` (opcional): o que é "correto". Default: factualmente correto, completo, sem claim sem suporte.
   - `verifiers` (opcional): nº de céticos. Default 3.
2. Invoque **Workflow** com `{ scriptPath: "<base-dir-desta-skill>/adversarial-verification.workflow.js", args }`.
3. Resuma; destaque `objections` quando `survived=false`.

## Retorno

`{ output, survived, refutedBy, of, objections[] }`.

## Custo

1 worker (wf-heavy) + N verificadores (wf-judge).
