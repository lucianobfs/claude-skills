---
name: root-cause
description: Investigação de causa raiz: agentes independentes formam hipóteses a partir de fontes de evidência disjuntas, painel de refutadores ataca cada hipótese, a sobrevivente é confirmada com reprodução real em worktree. Use para bug difícil, teste flaky, falha de pipeline ou post-mortem (inclusive não-técnico). args: { problem, evidence[] }
---

# root-cause

Workflow dinâmico multi-agente. Script: `root-cause.workflow.js` no base directory desta skill.
Padrões de ["A harness for every task"](https://claude.com/blog/a-harness-for-every-task-dynamic-workflows-in-claude-code).

## Setup (primeira execução nesta máquina)

O workflow usa os agent types `wf-heavy` (Opus @ effort xhigh) e `wf-judge` (Sonnet @ effort max).
Verifique se `~/.claude/agents/wf-heavy.md` e `~/.claude/agents/wf-judge.md` existem; se não,
copie-os de `agents/` (desta skill) para `~/.claude/agents/`. Se acabou de copiá-los e o harness
não reconhecer o agentType, avise o usuário que precisa reiniciar a sessão uma vez.

## Execução

1. Monte os `args` a partir do pedido do usuário. Se faltar um obrigatório, pergunte — não invente.

   - `problem` (obrigatório): descrição do problema.
   - `evidence[]` (obrigatório, ≥2): fontes DISJUNTAS (ex.: "logs do CI", "o módulo billing/", "o dataset X") — é a disjunção que gera hipóteses independentes.

2. Invoque a tool **Workflow** com `{ scriptPath: "<base-dir-desta-skill>/root-cause.workflow.js", args: {...} }`.
3. Ao terminar, traduza o objeto retornado num resumo legível — não despeje JSON cru.

## Notas

Retorna `rootCause` (teoria confirmada + prova), `survivingTheories` e `rejectedTheories` com os argumentos que as mataram. A confirmação roda em worktree isolado.

## Custo

Cada item/claim/regra/hipótese vira ≥1 subagent Opus @ xhigh. Avise o usuário antes de rodar em
listas grandes; ele pode limitar declarando um teto ("use 200k tokens"), respeitado via `budget`.
