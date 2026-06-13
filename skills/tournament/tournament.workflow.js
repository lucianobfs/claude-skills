export const meta = {
  name: 'tournament',
  description: 'Tournament: spawn N agents that each attempt the same task with a different approach, then run a single-elimination bracket of fresh pairwise judges until one winner remains',
  whenToUse: 'When the solution space is wide and you want the best of several attempts at ONE task (a design, an implementation strategy, a piece of copy). Pass args: { task: "what to attempt", approaches?: ["approach A", "approach B", ...] }. If approaches is omitted, 4 generic distinct approaches are used.',
  phases: [
    { title: 'Attempt', detail: 'N agents attempt the task differently' },
    { title: 'Tournament', detail: 'fresh judge per pairwise comparison' },
  ],
}

const A = (() => { if (typeof args === 'string') { try { return JSON.parse(args) } catch (e) { return {} } } return args || {} })()

const task = (A && A.task) || ''
const approaches = (A && Array.isArray(A.approaches) && A.approaches.length >= 2)
  ? A.approaches
  : [
      'the simplest thing that could possibly work',
      'the most robust, production-grade approach',
      'an unconventional approach that trades a norm for an advantage',
      'the approach that best fits the stated constraints',
    ]
if (!task) throw new Error('Pass args: { task: "...", approaches?: ["...", "..."] }')

const ATTEMPT_SCHEMA = {
  type: 'object',
  properties: {
    solution: { type: 'string', description: 'the attempt' },
    summary: { type: 'string', description: 'one line describing the approach taken' },
  },
  required: ['solution', 'summary'],
}

const PAIR_SCHEMA = {
  type: 'object',
  properties: {
    winner: { type: 'string', enum: ['A', 'B'] },
    reason: { type: 'string' },
  },
  required: ['winner', 'reason'],
}

// 1) Each agent attempts the SAME task with a different approach.
phase('Attempt')
const attempts = (await parallel(
  approaches.map((ap, i) => () =>
    agent(
      `Attempt this task using a specific approach: ${ap}\n\nTASK:\n${task}\n\nReturn your solution and a one-line summary of the approach.`,
      { label: `attempt:${i + 1}`, schema: ATTEMPT_SCHEMA, agentType: 'wf-heavy' }
    )
  )
)).filter(Boolean)
log(`${attempts.length} attempts`)
if (attempts.length < 2) return { winner: attempts[0] || null, totalAttempts: attempts.length }

// 2) Single-elimination bracket; each pairwise comparison is a fresh judge.
//    The deterministic loop holds the bracket -- only the running pair is in context.
phase('Tournament')
let bracket = attempts
let round = 0
while (bracket.length > 1) {
  round += 1
  const pairs = []
  const bye = []
  for (let i = 0; i + 1 < bracket.length; i += 2) pairs.push([bracket[i], bracket[i + 1]])
  if (bracket.length % 2 === 1) bye.push(bracket[bracket.length - 1])
  const winners = await parallel(
    pairs.map(([a, b], i) => () =>
      agent(
        `Task: ${task}\nWhich attempt is better? Pick strictly one.\nA (${a.summary}):\n${a.solution}\n\nB (${b.summary}):\n${b.solution}`,
        { label: `judge:r${round}-${i + 1}`, schema: PAIR_SCHEMA, agentType: 'wf-judge' }
      ).then((v) => (v && v.winner === 'B' ? b : a))
    )
  )
  bracket = [...winners.filter(Boolean), ...bye]
  log(`round ${round} -> ${bracket.length} remain`)
}

return {
  winner: bracket[0] || null,
  totalAttempts: attempts.length,
}
