export const meta = {
  name: 'generate-and-filter',
  description: 'Generate-and-filter: parallel generators brainstorm many options from different angles, then one filter agent dedupes near-duplicates and culls everything that fails the rubric, returning only the survivors',
  whenToUse: 'When you want breadth then quality: candidate ideas, approaches, test cases, edge cases. Pass args: { brief: "what we need + constraints", rubric?: "what good looks like", count?: 8 }. Pipe the kept set into the tournament template to also pick a single winner.',
  phases: [
    { title: 'Generate', detail: 'one generator per angle' },
    { title: 'Filter', detail: 'dedupe + cull against the rubric' },
  ],
}

const A = (() => { if (typeof args === 'string') { try { return JSON.parse(args) } catch (e) { return {} } } return args || {} })()

const brief = (A && A.brief) || ''
const rubric = (A && A.rubric) || 'high quality, clearly relevant, distinct from the others'
const count = (A && A.count) || 8
if (!brief) throw new Error('Pass args: { brief: "...", rubric?: "...", count?: 8 }')

const ANGLES = [
  'the obvious, safe, conventional options',
  'unconventional or contrarian options others would miss',
  'options borrowed by analogy from an unrelated domain',
  'options that optimize hardest for the stated constraints',
]

const IDEAS_SCHEMA = {
  type: 'object',
  properties: {
    ideas: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          option: { type: 'string' },
          pitch: { type: 'string', description: 'one sentence on why it could work' },
        },
        required: ['option', 'pitch'],
      },
    },
  },
  required: ['ideas'],
}

const FILTER_SCHEMA = {
  type: 'object',
  properties: {
    kept: { type: 'array', description: 'indices that pass the rubric, near-duplicates removed', items: { type: 'number' } },
    notes: { type: 'string', description: 'why the rest were cut' },
  },
  required: ['kept'],
}

// 1) Generate wide -- one generator per angle, in parallel.
phase('Generate')
const generated = await parallel(
  ANGLES.map((angle, i) => () =>
    agent(
      `Brief: ${brief}\nGenerate ${count} distinct options focused on: ${angle}. One-sentence pitch each. Favor quantity and variety -- weak ones get filtered next.`,
      { label: `gen:${i + 1}`, schema: IDEAS_SCHEMA, agentType: 'wf-heavy' }
    )
  )
)
const pool = generated.filter(Boolean).flatMap((g) => g.ideas)
log(`${pool.length} options generated`)
if (!pool.length) return { kept: [], discarded: [], totalGenerated: 0 }

// 2) Filter -- one agent dedupes and culls the whole pool against the rubric.
//    parallel() above is a genuine barrier: the filter must see EVERY option to dedupe across generators.
phase('Filter')
const verdict = await agent(
  `Brief: ${brief}\nRubric: ${rubric}\nFrom this list, remove duplicates and near-duplicates, drop anything that fails the rubric, and keep only the survivors. Return the kept indices.\n\n${pool
    .map((p, i) => `[${i}] ${p.option} -- ${p.pitch}`)
    .join('\n')}`,
  { label: 'filter', schema: FILTER_SCHEMA, agentType: 'wf-judge' }
)
const keptIdx = new Set((verdict && verdict.kept) || [])
const kept = pool.filter((_, i) => keptIdx.has(i))
const discarded = pool.filter((_, i) => !keptIdx.has(i))
log(`${kept.length} kept · ${discarded.length} discarded`)

return {
  kept,
  discarded,
  totalGenerated: pool.length,
  notes: verdict ? verdict.notes : '',
}
