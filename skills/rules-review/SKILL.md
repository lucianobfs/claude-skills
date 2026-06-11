---
name: rules-review
description: Revisa o git diff atual com um verificador por regra do projeto, e um cético mata os falsos positivos — só violações confirmadas sobrevivem. Use antes de abrir PR, ou quando o usuário perguntar se o diff viola as convenções/regras do projeto (CLAUDE.md). args: { rules?, diffCmd? }
---

# rules-review

Workflow dinâmico multi-agente. Script: `rules-review.workflow.js` no base directory desta skill.
Padrões de ["A harness for every task"](https://claude.com/blog/a-harness-for-every-task-dynamic-workflows-in-claude-code).

## Setup (primeira execução nesta máquina)

O workflow usa os agent types `wf-heavy` (Opus @ effort xhigh) e `wf-judge` (Sonnet @ effort max).
Verifique se `~/.claude/agents/wf-heavy.md` e `~/.claude/agents/wf-judge.md` existem; se não,
copie-os de `agents/` (desta skill) para `~/.claude/agents/`. Se acabou de copiá-los e o harness
não reconhecer o agentType, avise o usuário que precisa reiniciar a sessão uma vez.

## Execução

1. Monte os `args` a partir do pedido do usuário. Se faltar um obrigatório, pergunte — não invente.

   - `rules[]` (opcional): regras explícitas. Se omitido, minera dos CLAUDE.md aplicáveis ao repo.
   - `diffCmd` (opcional, default `git diff HEAD`): ex. `git diff main...HEAD`.

2. Invoque a tool **Workflow** com `{ scriptPath: "<base-dir-desta-skill>/rules-review.workflow.js", args: {...} }`.
3. Ao terminar, traduza o objeto retornado num resumo legível — não despeje JSON cru.

## Notas

Rode dentro do repo alvo. Retorna `confirmedViolations` (por regra, com file/line/excerpt) e `clean` (regras sem violação).

## Custo

Cada item/claim/regra/hipótese vira ≥1 subagent Opus @ xhigh. Avise o usuário antes de rodar em
listas grandes; ele pode limitar declarando um teto ("use 200k tokens"), respeitado via `budget`.
