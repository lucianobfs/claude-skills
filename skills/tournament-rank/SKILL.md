---
name: tournament-rank
description: Ranqueia/prioriza muitos itens por um critério qualitativo (severidade, qualidade, fit) via buckets paralelos + playoff pairwise + double-check adversarial do top N. Use quando o usuário pedir para ranquear, ordenar ou priorizar uma lista por algo subjetivo. args: { items[], criterion, topN? }
---

# tournament-rank

Workflow dinâmico multi-agente. Script: `tournament-rank.workflow.js` no base directory desta skill.
Padrões de ["A harness for every task"](https://claude.com/blog/a-harness-for-every-task-dynamic-workflows-in-claude-code).

## Setup (primeira execução nesta máquina)

O workflow usa os agent types `wf-heavy` (Opus @ effort xhigh) e `wf-judge` (Sonnet @ effort max).
Verifique se `~/.claude/agents/wf-heavy.md` e `~/.claude/agents/wf-judge.md` existem; se não,
copie-os de `agents/` (desta skill) para `~/.claude/agents/`. Se acabou de copiá-los e o harness
não reconhecer o agentType, avise o usuário que precisa reiniciar a sessão uma vez.

## Execução

1. Monte os `args` a partir do pedido do usuário. Se faltar um obrigatório, pergunte — não invente.

   - `items[]` (obrigatório): strings ou paths de arquivo.
   - `criterion` (obrigatório): o critério de ranqueamento.
   - `topN` (opcional, default 5): quantos do topo recebem checagem adversarial.

2. Invoque a tool **Workflow** com `{ scriptPath: "<base-dir-desta-skill>/tournament-rank.workflow.js", args: {...} }`.
3. Ao terminar, traduza o objeto retornado num resumo legível — não despeje JSON cru.

## Notas

Retorna o ranking completo + top N adversarialmente checado (`topChecked` traz `confirmed` e `concern` por item).

## Custo

Cada item/claim/regra/hipótese vira ≥1 subagent Opus @ xhigh. Avise o usuário antes de rodar em
listas grandes; ele pode limitar declarando um teto ("use 200k tokens"), respeitado via `budget`.
