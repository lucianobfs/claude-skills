---
name: deep-verify
description: Verificação profunda de fatos: extrai toda afirmação factual de um relatório/doc/PRD e verifica cada uma com um subagent próprio + auditoria cética das fontes. Use quando o usuário pedir para verificar/checar um documento, perguntar se há afirmações erradas, ou precisar que um relatório saia sem nenhum claim incorreto. args: { source, context? }
---

# deep-verify

Workflow dinâmico multi-agente. Script: `deep-verify.workflow.js` no base directory desta skill.
Padrões de ["A harness for every task"](https://claude.com/blog/a-harness-for-every-task-dynamic-workflows-in-claude-code).

## Setup (primeira execução nesta máquina)

O workflow usa os agent types `wf-heavy` (Opus @ effort xhigh) e `wf-judge` (Sonnet @ effort max).
Verifique se `~/.claude/agents/wf-heavy.md` e `~/.claude/agents/wf-judge.md` existem; se não,
copie-os de `agents/` (desta skill) para `~/.claude/agents/`. Se acabou de copiá-los e o harness
não reconhecer o agentType, avise o usuário que precisa reiniciar a sessão uma vez.

## Execução

1. Monte os `args` a partir do pedido do usuário. Se faltar um obrigatório, pergunte — não invente.

   - `source` (obrigatório): path do arquivo ou texto inline a verificar.
   - `context` (opcional): onde verificar — dir do código, URLs. Default: codebase local e web.

2. Invoque a tool **Workflow** com `{ scriptPath: "<base-dir-desta-skill>/deep-verify.workflow.js", args: {...} }`.
3. Ao terminar, traduza o objeto retornado num resumo legível — não despeje JSON cru.

## Notas

Retorna `{ totalClaims, verified, falseClaims[], unverifiable[] }`. Destaque os `falseClaims` com o `suggestedFix` de cada um.

## Custo

Cada item/claim/regra/hipótese vira ≥1 subagent Opus @ xhigh. Avise o usuário antes de rodar em
listas grandes; ele pode limitar declarando um teto ("use 200k tokens"), respeitado via `budget`.
