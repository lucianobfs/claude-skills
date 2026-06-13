# claude-skills

Skills compartilháveis para Claude Code (e outros agentes compatíveis com [Agent Skills](https://skills.sh)).

## Instalação

```bash
npx skills add lucianobfs/claude-skills
```

## Os 6 padrões de workflow dinâmico

Os seis **blocos de montar** de
["A harness for every task"](https://claude.com/blog/a-harness-for-every-task-dynamic-workflows-in-claude-code)
(Thariq Shihipar & Sid Bidasaria), cada um como skill própria (invocável por slash) + o guia `wf`:

| Skill | Padrão | args |
|---|---|---|
| `classify-and-act` | classificador roteia a task pra 1 de N handlers | `{ task, routes }` |
| `fanout-and-synthesize` | 1 agente por parte (contexto limpo) → barreira sintetiza | `{ task, parts? }` |
| `adversarial-verification` | worker produz, N céticos tentam refutar | `{ task, rubric?, verifiers? }` |
| `generate-and-filter` | geradores em paralelo → filtro dedupe + rubrica | `{ brief, rubric?, count? }` |
| `tournament` | N abordagens competem → bracket pairwise → 1 vencedor | `{ task, approaches? }` |
| `loop-until-done` | repete spawn até stop condition | `{ task, patience?, maxRounds? }` |
| `wf` | guia: quando usar cada padrão + como compor casos de uso | — |

**Filosofia:** publicamos os **padrões** (blocos de montar), não casos de uso prontos. Um caso de uso é
um ponto fixo no espaço de tarefas — limita. Os padrões compõem e cobrem a cauda longa. A skill `wf` traz
a tabela de casos de uso comuns (verificação de doc, ranqueamento, triagem, causa raiz, etc.) e quais
padrões combinar pra cada um.

**Uso:** depois de instalar, invoque direto pelo slash (`/tournament ...`) ou descreva a tarefa.

**Roteamento de modelo/effort** (agent types inclusos em cada skill, em `agents/`):

- Orquestrador: o modelo da sessão (ideal: Fable)
- `wf-heavy`: Opus @ effort **xhigh** — trabalho pesado (investigação, verificação, geração, ação)
- `wf-judge`: Sonnet @ effort **max** — juízes pairwise, classificadores, auditores

Na primeira execução, copie os dois agent types pra `~/.claude/agents/` (pode pedir restart de sessão).

#### ⚠️ Custo

Cada parte/claim/item vira **um ou mais subagents Opus em effort xhigh**. Para limitar, declare um teto
no pedido ("use 200k tokens") — respeitado via `budget`.

## Licença

MIT
