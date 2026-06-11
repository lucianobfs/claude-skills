---
name: wf
description: Dispatcher da suite de workflows dinâmicos multi-agente (deep-verify, tournament-rank, rules-review, root-cause, brainstorm-tournament, triage-backlog). Use quando o usuário pedir /wf com uma descrição de tarefa e for preciso escolher qual workflow se encaixa, ou quando pedir um workflow multi-agente novo que não casa com nenhum dos seis.
---

# wf — dispatcher da suite de workflows

Cada workflow desta suite é uma skill própria, instalada como irmã desta
(`deep-verify`, `tournament-rank`, `rules-review`, `root-cause`, `brainstorm-tournament`,
`triage-backlog`) — todas invocáveis diretamente por slash command. Esta skill só roteia.

## Como despachar

1. Identifique qual workflow casa com o pedido (tabela abaixo).
2. Invoque a tool **Skill** com o nome da skill correspondente, passando o pedido do usuário em `args`.
   A skill do workflow cuida de montar os args, rodar e resumir.
3. Se a skill não estiver instalada, oriente: `npx skills add lucianobfs/claude-skills`.

| Pedido parece com... | Skill |
|---|---|
| "verifica esse relatório/doc/PRD", "tem alguma afirmação errada aqui?" | `deep-verify` |
| "ranqueia/prioriza esses N itens por X" | `tournament-rank` |
| "revisa o diff antes do PR", "isso viola as regras do projeto?" | `rules-review` |
| "por que esse bug/teste flaky/queda acontece?", post-mortem | `root-cause` |
| "me dá ideias de nome/design/abordagem e escolhe as melhores" | `brainstorm-tournament` |
| "triagem desses tickets/reports/feedbacks" | `triage-backlog` |

## Compondo um workflow novo

Se o pedido exige orquestração multi-agente mas não casa com nenhum dos seis, componha um
workflow na hora usando os das skills irmãs como template. Convenções:

- `meta` é literal puro; `phases` casa com as chamadas `phase()`.
- Validação de `args` no topo — falhe cedo com a assinatura esperada.
- `pipeline()` por padrão; `parallel()` só onde há barreira genuína (dedupe global, bracket).
- Verificadores céticos com viés para falso-positivo/refuted — é isso que segura a precisão.
- Roteamento de modelo/effort via `agentType: "wf-heavy"` (Opus @ xhigh, trabalho pesado) e
  `agentType: "wf-judge"` (Sonnet @ max, juízes/classificadores). Os agent types estão em
  `agents/` desta skill — garanta que existem em `~/.claude/agents/` (copie se preciso; pode
  exigir restart de sessão).
- Sem `Date.now()`/`Math.random()` — quebraria o resume.

## Custo

Estes workflows disparam fan-outs de subagents Opus @ xhigh. Avise o usuário antes de rodar em
listas grandes; ele pode limitar com um teto de tokens no pedido ("use 200k tokens"), que os
workflows respeitam via `budget`.
