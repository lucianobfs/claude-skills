export const meta = {
  name: 'loop-until-done',
  description: 'Loop-until-done: keep spawning agents to do more of an open-ended task until a stop condition is met (no new findings for N consecutive rounds), instead of a fixed number of passes',
  whenToUse: 'When the amount of work is unknown up front -- find ALL the bugs, ALL the broken links, every TODO. Pass args: { task: "what to keep finding/doing", patience?: 1, maxRounds?: 12 }. patience = consecutive empty rounds before declaring done; maxRounds is a safety backstop.',
  phases: [
    { title: 'Loop', detail: 'spawn until no new findings' },
  ],
}

const A = (() => { if (typeof args === 'string') { try { return JSON.parse(args) } catch (e) { return {} } } return args || {} })()

const task = (A && A.task) || ''
const patience = (A && A.patience) || 1
const maxRounds = (A && A.maxRounds) || 12
if (!task) throw new Error('Pass args: { task: "...", patience?: 1, maxRounds?: 12 }')

const ROUND_SCHEMA = {
  type: 'object',
  properties: {
    newFindings: {
      type: 'array',
      description: 'findings NOT already in the seen list; empty if nothing new remains',
      items: {
        type: 'object',
        properties: {
          key: { type: 'string', description: 'short stable identifier, for dedupe' },
          detail: { type: 'string' },
        },
        required: ['key', 'detail'],
      },
    },
  },
  required: ['newFindings'],
}

const seen = new Set()
const findings = []
let dry = 0
let round = 0
let stoppedReason = 'maxRounds'

// Spawn a fresh agent each round; stop when `patience` consecutive rounds find nothing new.
// Dedup is plain JS against `seen` -- the deterministic loop is what holds the stop condition.
phase('Loop')
while (round < maxRounds) {
  round += 1
  const already = [...seen]
  const res = await agent(
    `Task: ${task}\n\nYou already have ${already.length} findings (do NOT repeat these): ${already.join(' | ') || '(none yet)'}\n\nFind only what is genuinely NEW. If nothing new remains, return an empty list.`,
    { label: `round:${round}`, schema: ROUND_SCHEMA, agentType: 'wf-heavy' }
  )
  const fresh = ((res && res.newFindings) || []).filter((f) => f && f.key && !seen.has(f.key))
  fresh.forEach((f) => { seen.add(f.key); findings.push(f) })
  log(`round ${round}: +${fresh.length} new (${findings.length} total)`)
  if (fresh.length === 0) {
    dry += 1
    if (dry >= patience) { stoppedReason = 'no-new-findings'; break }
  } else {
    dry = 0
  }
}
if (round >= maxRounds && stoppedReason !== 'no-new-findings') log(`stopped at maxRounds=${maxRounds} backstop`)

return {
  findings,
  rounds: round,
  stoppedReason,
}
