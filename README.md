# claude-skills

Skills compartilháveis para Claude Code (e outros agentes compatíveis com [Agent Skills](https://skills.sh)).

## Instalação

```bash
npx skills add lucianobfs/claude-skills
```

## Skills

### `wf` — suite de workflows dinâmicos multi-agente

Seis workflows prontos baseados nos padrões de
["A harness for every task"](https://claude.com/blog/a-harness-for-every-task-dynamic-workflows-in-claude-code)
(Thariq Shihipar & Sid Bidasaria):

| Workflow | O que faz |
|---|---|
| `deep-verify` | Extrai toda afirmação factual de um doc/relatório e verifica cada uma com um subagent próprio + auditoria cética das fontes |
| `tournament-rank` | Ranqueia muitos itens por critério qualitativo: buckets em paralelo → playoff pairwise → double-check adversarial do top N |
| `rules-review` | Revisa o `git diff` com um verificador por regra do projeto (minera CLAUDE.md) + cético que mata falsos positivos |
| `root-cause` | Investigação de causa raiz: hipóteses de evidências disjuntas → painel de refutadores → confirmação reproduzida em worktree |
| `brainstorm-tournament` | Geradores em ângulos criativos distintos → filtro por rubrica → torneio pairwise até o top 3 |
| `triage-backlog` | Triagem em escala com padrão quarentena: leitores read-only resumem conteúdo não-confiável, ator privilegiado nunca vê o texto cru |

**Uso:** `/wf <descrição da tarefa>` — o dispatcher escolhe o workflow, monta os `args` e roda.
Ou descreva a tarefa normalmente ("verifica esse relatório", "por que esse teste tá flaky?") que a skill dispara sozinha.

**Roteamento de modelo/effort** (incluso em `skills/wf/agents/`):

- Orquestrador: o modelo da sessão (ideal: Fable)
- `wf-heavy`: Opus @ effort **xhigh** — investigação, verificação, geração, ação em worktree
- `wf-judge`: Sonnet @ effort **max** — juízes pairwise, classificadores, auditores

Na primeira execução, a skill copia os dois agent types para `~/.claude/agents/` (pode pedir um restart de sessão).

#### ⚠️ Custo

Cada item/claim/regra/hipótese vira **um ou mais subagents Opus em effort xhigh**. Um `deep-verify`
num doc com 40 claims dispara 40+ agentes. Para limitar, declare um teto no pedido
("use 200k tokens") — os workflows respeitam via `budget`.

#### Opcional: slash commands individuais

O Claude Code expõe workflows salvos em `~/.claude/workflows/` como slash commands próprios
(`/deep-verify`, `/root-cause`, ...). Se preferir isso ao dispatcher:

```bash
cp ~/.claude/skills/wf/workflows/*.workflow.js ~/.claude/workflows/
```

## Licença

MIT
