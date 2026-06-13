---
name: loop-until-done
description: Loop-until-done — fica spawnando agentes pra fazer mais de uma task aberta até uma stop condition (nenhuma descoberta nova por N rodadas), em vez de um número fixo de passes. Use quando a quantidade de trabalho é desconhecida (achar TODOS os bugs, TODOS os links quebrados, todo TODO). args: { task, patience?, maxRounds? }
---

# loop-until-done

Workflow dinâmico (padrão **Loop until done** de
["A harness for every task"](https://claude.com/blog/a-harness-for-every-task-dynamic-workflows-in-claude-code)).
Script: `loop-until-done.workflow.js` no base dir desta skill.

## Setup (1ª vez)

Agent types `wf-heavy`/`wf-judge` em `~/.claude/agents/` (copie de `agents/` desta skill se faltarem).

## Execução

1. Monte `args` (se faltar obrigatório, pergunte):
   - `task` (obrigatório): o que ficar achando/fazendo.
   - `patience` (opcional): rodadas vazias seguidas antes de parar. Default 1.
   - `maxRounds` (opcional): backstop de segurança. Default 12.
2. Invoque **Workflow** com `{ scriptPath: "<base-dir-desta-skill>/loop-until-done.workflow.js", args }`.
3. Resuma `findings` e `stoppedReason`.

## Retorno

`{ findings[], rounds, stoppedReason }`.

## Custo

1 agente (wf-heavy) por rodada até a stop condition. Pareie com `/loop` pra rodar contínuo.
