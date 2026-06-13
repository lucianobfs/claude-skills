export const meta = {
  name: 'adversarial-verification',
  description: 'Adversarial verification: a worker produces output, then N independent verifier agents each try to REFUTE it against a rubric; the output survives only if the panel fails to refute it',
  whenToUse: 'When a single answer must be trusted before you ship or act on it. Pass args: { task: "what to produce", rubric?: "what correct looks like", verifiers?: 3 }. To verify every item of a fan-out, give each fan-out agent its own verifier (compose with fanout-and-synthesize).',
  phases: [
    { title: 'Work', detail: 'worker produces the output' },
    { title: 'Verify', detail: 'N skeptics each try to refute it' },
  ],
}

const A = (() => { if (typeof args === 'string') { try { return JSON.parse(args) } catch (e) { return {} } } return args || {} })()

const task = (A && A.task) || ''
const rubric = (A && A.rubric) || 'factually correct, complete, and free of unsupported claims'
const verifiers = (A && A.verifiers) || 3
if (!task) throw new Error('Pass args: { task: "...", rubric?: "...", verifiers?: 3 }')

const WORK_SCHEMA = {
  type: 'object',
  properties: { output: { type: 'string' } },
  required: ['output'],
}

const VERDICT_SCHEMA = {
  type: 'object',
  properties: {
    refuted: { type: 'boolean', description: 'true if the output fails the rubric on this lens' },
    objection: { type: 'string', description: 'the strongest concrete problem found, or empty if none' },
  },
  required: ['refuted'],
}

// Distinct lenses so the panel catches different failure modes, not the same one N times.
const LENSES = [
  'correctness -- find any factual error or wrong claim',
  'completeness -- find anything required but missing or only half-done',
  'rubric-fit -- find where it violates the stated rubric',
  'evidence -- find claims asserted without support',
]

// 1) Worker produces the output.
phase('Work')
const work = await agent(
  `Produce the output for this task. Be thorough; it will be adversarially reviewed.\n\nTASK:\n${task}\n\nRUBRIC: ${rubric}`,
  { label: 'worker', schema: WORK_SCHEMA, agentType: 'wf-heavy' }
)
const output = work ? work.output : ''

// 2) N independent skeptics each try to refute it. parallel() is a genuine
//    barrier here: we need every vote before we can tally the verdict.
phase('Verify')
const votes = await parallel(
  Array.from({ length: verifiers }, (_, i) => () =>
    agent(
      `Try to REFUTE this output. Lens: ${LENSES[i % LENSES.length]}.\nIf you are uncertain, default to refuted=true -- the burden is on the output to prove itself.\n\nTASK:\n${task}\n\nRUBRIC: ${rubric}\n\nOUTPUT:\n${output}`,
      { label: `verify:${i + 1}`, schema: VERDICT_SCHEMA, agentType: 'wf-judge' }
    )
  )
)

const cast = votes.filter(Boolean)
const refuteCount = cast.filter((v) => v.refuted).length
const objections = cast.filter((v) => v.refuted).map((v) => v.objection).filter(Boolean)
const survived = cast.length > 0 && refuteCount < Math.ceil(cast.length / 2)
log(`${refuteCount}/${cast.length} verifiers refuted -- ${survived ? 'SURVIVED' : 'REJECTED'}`)

return {
  output,
  survived,
  refutedBy: refuteCount,
  of: cast.length,
  objections,
}
