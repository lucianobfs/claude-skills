---
name: classify-and-act
description: Classify-and-act — um classificador roteia a task pra 1 de N handlers definidos, e o handler escolhido executa. Use quando o comportamento certo depende do tipo do input (rotear pedido, ticket, arquivo, pergunta pro handler que casa). args: { task, routes: [{name, when, do}] }
---

# classify-and-act

Workflow dinâmico (padrão **Classify-and-act** de
["A harness for every task"](https://claude.com/blog/a-harness-for-every-task-dynamic-workflows-in-claude-code)).
Script: `classify-and-act.workflow.js` no base dir desta skill.

## Setup (1ª vez nesta máquina)

Usa os agent types `wf-heavy` (Opus @ xhigh) e `wf-judge` (Sonnet @ max). Se `~/.claude/agents/wf-heavy.md`
e `wf-judge.md` não existirem, copie-os de `agents/` desta skill (pode pedir restart de sessão).

## Execução

1. Monte `args` a partir do pedido (se faltar obrigatório, pergunte — não invente):
   - `task` (obrigatório): o que rotear/tratar.
   - `routes` (obrigatório): `[{ name, when, do }]`, ≥2 rotas.
2. Invoque a tool **Workflow** com `{ scriptPath: "<base-dir-desta-skill>/classify-and-act.workflow.js", args }`.
3. Resuma o retorno num texto legível — não despeje JSON cru.

## Retorno

`{ route, reason, result }`.

## Custo

1 classificador (wf-judge) + 1 handler (wf-heavy). Barato. Pra muitos itens, rode o corpo em `pipeline`.
