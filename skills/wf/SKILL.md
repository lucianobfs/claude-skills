---
name: wf
description: Guia dos 6 padrões canônicos de workflow dinâmico multi-agente (classify-and-act, fanout-and-synthesize, adversarial-verification, generate-and-filter, tournament, loop-until-done). Use quando o usuário pedir /wf, quando precisar escolher/compor um padrão pra uma tarefa grande/paralela/adversarial, ou pra montar um workflow novo a partir dos blocos.
---

# wf — guia dos padrões de workflow dinâmico

Esta suite publica os **6 blocos de montar** de
["A harness for every task"](https://claude.com/blog/a-harness-for-every-task-dynamic-workflows-in-claude-code),
não casos de uso prontos. Cada padrão é uma skill irmã, invocável direto. Casos de uso reais são
**composição** desses padrões (tabela abaixo).

## Os 6 padrões (skills irmãs)

| Skill | Quando | args |
|---|---|---|
| `classify-and-act` | o comportamento depende do tipo do input; rotear | `{ task, routes: [{name, when, do}] }` |
| `fanout-and-synthesize` | muitas partes independentes, cada uma em contexto limpo | `{ task, parts? }` |
| `adversarial-verification` | uma resposta precisa ser confiável antes de agir | `{ task, rubric?, verifiers? }` |
| `generate-and-filter` | quer amplitude e depois qualidade (ideias, casos de teste) | `{ brief, rubric?, count? }` |
| `tournament` | espaço de solução amplo; melhor de N tentativas → 1 vencedor | `{ task, approaches? }` |
| `loop-until-done` | quantidade de trabalho desconhecida (achar TODOS os X) | `{ task, patience?, maxRounds? }` |

Despacho: identifique o padrão, invoque a tool **Skill** com o nome correspondente passando o pedido em
`args`. Se não estiver instalada: `npx skills add lucianobfs/claude-skills`.

## Casos de uso = composição de padrões

| Cenário | Como montar |
|---|---|
| Verificar doc/relatório/PRD | `fanout` (1 agente extrai todo claim) → um `adversarial-verification` por claim → auditor de fonte |
| Ranquear N itens por critério | `tournament` / bucket-rank paralelo + merge (pairwise > nota absoluta) |
| Revisar diff vs regras antes do PR | um verificador por regra + cético que mata falso-positivo (`adversarial-verification`) |
| Causa raiz / post-mortem | hipóteses de evidências disjuntas → painel de refutadores → confirmação |
| Decisão de gosto (nome/design) | `generate-and-filter` por ângulos + `tournament` pela rubrica |
| Triagem de fila em escala | `classify-and-act` + quarentena (leitor read-only vs ator privilegiado) + dedupe; parear com `/loop` |
| Migração/refactor em massa | 1 agente por callsite em worktree → review adversarial → merge |

## Compondo um workflow novo

Se a tarefa exige orquestração mas não casa com um padrão só, componha usando os `.workflow.js` das skills
irmãs como template:

- `meta` literal puro; `phases` casa com `phase()`.
- Validação de `args` no topo.
- `pipeline()` por padrão; `parallel()` só com barreira genuína (sintetizar, tally, bracket, dedupe global).
- `agentType: "wf-heavy"` (Opus @ xhigh) e `wf-judge` (Sonnet @ max); garanta que existem em `~/.claude/agents/`.
- Verificadores céticos com viés pra refutar. Sem `Date.now()`/`Math.random()`.

## Custo

Fan-outs de subagents Opus @ xhigh. Avise antes de listas grandes; o usuário pode limitar
("use 200k tokens"), respeitado via `budget`.
