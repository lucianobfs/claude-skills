---
name: wf
description: Suite de workflows dinâmicos multi-agente (deep-verify, tournament-rank, rules-review, root-cause, brainstorm-tournament, triage-backlog). Use quando o usuário pedir /wf, pedir um desses workflows pelo nome, ou descrever tarefa que casa com um deles - verificar relatório/doc, ranquear/priorizar itens, revisar diff contra regras do projeto, achar causa raiz de bug, brainstorm com torneio, triagem de backlog/tickets.
---

# Workflows suite

Workflows dinâmicos autocontidos nesta skill, em `workflows/*.workflow.js` (relativo ao
base directory desta skill). Baseados nos padrões de
["A harness for every task"](https://claude.com/blog/a-harness-for-every-task-dynamic-workflows-in-claude-code).

Roteamento de modelo+effort: o orquestrador é o modelo da sessão (ideal: Fable);
`agentType: "wf-heavy"` = Opus @ effort xhigh para trabalho pesado;
`agentType: "wf-judge"` = Sonnet @ effort max para juízes/classificadores.
O campo `effort` no frontmatter do agente sobrepõe o effort da sessão.

## Setup (primeira execução nesta máquina)

Os workflows dependem dos agent types `wf-heavy` e `wf-judge`. Verifique se
`~/.claude/agents/wf-heavy.md` e `~/.claude/agents/wf-judge.md` existem; se não,
copie-os de `agents/` (desta skill) para `~/.claude/agents/` antes de rodar qualquer
workflow. Se acabou de copiá-los e o harness não reconhecer o agentType, avise o
usuário que precisa reiniciar a sessão uma vez.

## Como despachar

1. Identifique qual workflow casa com o pedido (tabela abaixo). Se o usuário nomeou um, use esse.
2. Monte os `args` a partir do pedido. Se faltar um arg obrigatório, pergunte — não invente.
3. Invoque a tool **Workflow** com `{ scriptPath: "<base-dir-desta-skill>/workflows/<nome>.workflow.js", args: {...} }`.
4. Ao terminar, traduza o objeto retornado num resumo legível — não despeje JSON cru no usuário.

Se o pedido não casa com nenhum dos seis mas pede orquestração multi-agente, componha um
workflow novo na hora usando estes arquivos como template (mesmas convenções:
`meta` literal puro, validação de `args` no topo, `pipeline()` por padrão, céticos com viés
para falso-positivo, agentTypes `wf-heavy`/`wf-judge`, sem `Date.now()`/`Math.random()`).

## Tabela de roteamento

| Pedido parece com... | Workflow | args obrigatórios | args opcionais |
|---|---|---|---|
| "verifica esse relatório/doc/PRD", "tem alguma afirmação errada aqui?" | `deep-verify` | `source` (path ou texto) | `context` (onde verificar: dir do código, URLs) |
| "ranqueia/prioriza esses N itens por X" | `tournament-rank` | `items[]`, `criterion` | `topN` (default 5) |
| "revisa o diff antes do PR", "isso viola as regras do projeto?" | `rules-review` | — (minera CLAUDE.md se faltar) | `rules[]`, `diffCmd` (default `git diff HEAD`) |
| "por que esse bug/teste flaky/queda acontece?", post-mortem | `root-cause` | `problem`, `evidence[]` (≥2 fontes disjuntas) | — |
| "me dá ideias de nome/design/abordagem e escolhe as melhores" | `brainstorm-tournament` | `brief` | `rubric`, `perAngle` (default 8) |
| "triagem desses tickets/reports/feedbacks" | `triage-backlog` | `items[]` | `tracked`, `actionPolicy` |

## Notas por workflow

- **deep-verify**: retorna `{ totalClaims, verified, falseClaims[], unverifiable[] }`. Destaque os `falseClaims` com o `suggestedFix` de cada um.
- **tournament-rank**: itens podem ser strings ou paths de arquivo. Retorna ranking completo + top N adversarialmente checado.
- **rules-review**: rode dentro do repo alvo. Só violações confirmadas pelo cético sobrevivem.
- **root-cause**: as fontes de evidência devem ser DISJUNTAS (logs vs módulo vs dataset) — é isso que gera hipóteses independentes. Confirmação roda em worktree.
- **brainstorm-tournament**: retorna top 3 com pitch. Bom para decisões de gosto.
- **triage-backlog**: padrão quarentena — leitores read-only nunca passam texto cru ao ator. Cite os índices `suspicious` se houver. Combina com `/loop` para rodar contínuo.

## Custo

Avise o usuário antes de rodar em listas grandes: cada item/claim/regra vira ≥1 subagent Opus @ xhigh.
Para limitar, o usuário pode declarar teto de tokens no pedido (ex.: "use 200k tokens") — o workflow
enxerga isso via `budget`.
