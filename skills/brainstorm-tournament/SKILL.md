---
name: brainstorm-tournament
description: Brainstorm com torneio: geradores em ângulos criativos distintos produzem opções, um filtro por rubrica deduplica e corta, juízes pairwise decidem o top 3. Use para decisões de gosto — nomes de produto/CLI, direções de design, escolha de abordagem. args: { brief, rubric?, perAngle? }
---

# brainstorm-tournament

Workflow dinâmico multi-agente. Script: `brainstorm-tournament.workflow.js` no base directory desta skill.
Padrões de ["A harness for every task"](https://claude.com/blog/a-harness-for-every-task-dynamic-workflows-in-claude-code).

## Setup (primeira execução nesta máquina)

O workflow usa os agent types `wf-heavy` (Opus @ effort xhigh) e `wf-judge` (Sonnet @ effort max).
Verifique se `~/.claude/agents/wf-heavy.md` e `~/.claude/agents/wf-judge.md` existem; se não,
copie-os de `agents/` (desta skill) para `~/.claude/agents/`. Se acabou de copiá-los e o harness
não reconhecer o agentType, avise o usuário que precisa reiniciar a sessão uma vez.

## Execução

1. Monte os `args` a partir do pedido do usuário. Se faltar um obrigatório, pergunte — não invente.

   - `brief` (obrigatório): o que precisamos e restrições.
   - `rubric` (opcional): o que é "bom". Default: memorável, claro, sem conotação negativa, fácil de falar.
   - `perAngle` (opcional, default 8): opções geradas por ângulo criativo.

2. Invoque a tool **Workflow** com `{ scriptPath: "<base-dir-desta-skill>/brainstorm-tournament.workflow.js", args: {...} }`.
3. Ao terminar, traduza o objeto retornado num resumo legível — não despeje JSON cru.

## Notas

Retorna `top3` com pitch de cada opção e `totalGenerated`.

## Custo

Cada item/claim/regra/hipótese vira ≥1 subagent Opus @ xhigh. Avise o usuário antes de rodar em
listas grandes; ele pode limitar declarando um teto ("use 200k tokens"), respeitado via `budget`.
