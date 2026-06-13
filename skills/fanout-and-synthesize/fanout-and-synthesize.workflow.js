export const meta = {
  name: 'fanout-and-synthesize',
  description: 'Fan-out-and-synthesize: split a task into independent parts, run one agent per part in its own clean context, then a single barrier step merges all structured outputs into one result',
  whenToUse: 'When a task has many independent parts that each benefit from a clean context window (per-file analysis, per-section summary, multi-source gather). Pass args: { task: "the overall goal", parts?: ["subtask 1", "subtask 2", ...] }. If parts is omitted, a planner agent splits the task first.',
  phases: [
    { title: 'Split', detail: 'planner breaks the task into parts' },
    { title: 'Fan out', detail: 'one agent per part, isolated context' },
    { title: 'Synthesize', detail: 'barrier: merge all part results into one' },
  ],
}

const A = (() => { if (typeof args === 'string') { try { return JSON.parse(args) } catch (e) { return {} } } return args || {} })()

const task = (A && A.task) || ''
const givenParts = (A && Array.isArray(A.parts)) ? A.parts : null
if (!task) throw new Error('Pass args: { task: "...", parts?: ["...", ...] }')

const PLAN_SCHEMA = {
  type: 'object',
  properties: {
    parts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          instruction: { type: 'string', description: 'self-contained instruction for one agent' },
        },
        required: ['title', 'instruction'],
      },
    },
  },
  required: ['parts'],
}

const PART_SCHEMA = {
  type: 'object',
  properties: { finding: { type: 'string', description: 'the structured result of this part' } },
  required: ['finding'],
}

const SYNTH_SCHEMA = {
  type: 'object',
  properties: { synthesis: { type: 'string', description: 'one coherent result merged from all parts' } },
  required: ['synthesis'],
}

// 1) If the caller didn't supply parts, a planner decomposes the task.
phase('Split')
let plan
if (givenParts) {
  plan = givenParts.map((p, i) => ({ title: `part ${i + 1}`, instruction: typeof p === 'string' ? p : JSON.stringify(p) }))
} else {
  const planned = await agent(
    `Break this task into 3-8 INDEPENDENT parts that can each be done in isolation without seeing the others. Each part needs a self-contained instruction.\n\nTASK:\n${task}`,
    { label: 'planner', schema: PLAN_SCHEMA, agentType: 'wf-heavy' }
  )
  plan = (planned && planned.parts) || []
}
if (!plan.length) throw new Error('No parts to fan out over')
log(`${plan.length} parts`)

// 2) Fan out -- one agent per part, each in a clean context.
//    The await on parallel() IS the synthesize barrier the article describes:
//    nothing merges until every fan-out agent has returned.
phase('Fan out')
const partResults = (await parallel(
  plan.map((p, i) => () =>
    agent(
      `Overall goal (for context only): ${task}\n\nDo ONLY your part and return its result.\nPART: ${p.title}\n${p.instruction}`,
      { label: `part:${i + 1}`, schema: PART_SCHEMA, agentType: 'wf-heavy' }
    ).then((r) => ({ title: p.title, finding: r ? r.finding : '(no result)' }))
  )
)).filter(Boolean)
if (!partResults.length) throw new Error('All fan-out parts failed')

// 3) Synthesize -- a single agent merges every structured output into one result.
phase('Synthesize')
const merged = await agent(
  `Merge these independent part-results into one coherent result for the overall goal.\n\nGOAL:\n${task}\n\nPARTS:\n${partResults
    .map((r) => `### ${r.title}\n${r.finding}`)
    .join('\n\n')}`,
  { label: 'synthesize', schema: SYNTH_SCHEMA, agentType: 'wf-heavy' }
)

return {
  parts: partResults,
  synthesis: merged ? merged.synthesis : '',
}
