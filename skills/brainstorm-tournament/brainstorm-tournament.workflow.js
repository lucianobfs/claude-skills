export const meta = {
  name: 'brainstorm-tournament',
  description: 'Generate-and-filter + tournament: parallel generators brainstorm options from different angles, a rubric filter dedupes and culls, pairwise judges pick the top 3',
  whenToUse: 'Taste-based exploration: naming a CLI/product, choosing a design direction, picking an approach. Pass args: { brief: "what we need and constraints", rubric: "what good looks like", perAngle: 8 }',
  phases: [
    { title: 'Generate', detail: 'one generator per creative angle' },
    { title: 'Filter', detail: 'dedupe + cull against the rubric' },
    { title: 'Tournament', detail: 'pairwise judging until top 3' },
  ],
}

const A = (() => { if (typeof args === 'string') { try { return JSON.parse(args) } catch (e) { return {} } } return args || {} })()

const brief = (A && A.brief) || ''
const rubric = (A && A.rubric) || 'memorable, clear, no negative connotations, easy to say out loud'
const perAngle = (A && A.perAngle) || 8
if (!brief) throw new Error('Pass args: { brief: "...", rubric: "..." }')

const ANGLES = [
  'literal and descriptive — say exactly what it does',
  'metaphor from an unrelated domain (nature, music, navigation, craft)',
  'short invented/compound words that sound like established tools',
  'playful or irreverent — would stand out on a conference slide',
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
          pitch: { type: 'string', description: 'one sentence selling it' },
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
    kept: {
      type: 'array',
      description: 'indices of options that pass the rubric, duplicates and near-duplicates removed',
      items: { type: 'number' },
    },
    cullNotes: { type: 'string' },
  },
  required: ['kept'],
}

const PAIR_SCHEMA = {
  type: 'object',
  properties: {
    winner: { type: 'string', enum: ['A', 'B'] },
    reason: { type: 'string' },
  },
  required: ['winner', 'reason'],
}

phase('Generate')
const generated = await parallel(
  ANGLES.map((angle, i) => () =>
    agent(
      `Brief: ${brief}\nGenerate ${perAngle} distinct options using this creative angle: ${angle}. For each, give a one-sentence pitch. Quantity and variety over polish — the weak ones get filtered later.`,
      { label: `gen:${i + 1}`, schema: IDEAS_SCHEMA, agentType: 'wf-heavy' }
    )
  )
)
const pool = generated.filter(Boolean).flatMap((g) => g.ideas)
log(`${pool.length} options generated across ${ANGLES.length} angles`)

phase('Filter')
const filtered = await agent(
  `Brief: ${brief}\nRubric: ${rubric}\nCull this list: remove duplicates and near-duplicates, and drop anything that clearly fails the rubric. Keep the strongest ~half.\n\n${pool
    .map((p, i) => `[${i}] ${p.option} — ${p.pitch}`)
    .join('\n')}`,
  { label: 'filter', schema: FILTER_SCHEMA, agentType: 'wf-heavy' }
)
let bracket = (filtered ? filtered.kept : pool.map((_, i) => i)).map((i) => pool[i]).filter(Boolean)
log(`${bracket.length} options survived the filter`)

// Single-elimination bracket; each pairwise comparison is a fresh judge agent.
phase('Tournament')
while (bracket.length > 3) {
  const next = []
  const pairs = []
  for (let i = 0; i + 1 < bracket.length; i += 2) pairs.push([bracket[i], bracket[i + 1]])
  if (bracket.length % 2 === 1) next.push(bracket[bracket.length - 1])
  const winners = await parallel(
    pairs.map(([a, b], i) => () =>
      agent(
        `Brief: ${brief}\nRubric: ${rubric}\nWhich option is better?\nA: ${a.option} — ${a.pitch}\nB: ${b.option} — ${b.pitch}\nPick strictly one.`,
        { label: `judge:r${bracket.length}-${i}`, schema: PAIR_SCHEMA, agentType: 'wf-judge' }
      ).then((v) => (v && v.winner === 'B' ? b : a))
    )
  )
  bracket = [...winners.filter(Boolean), ...next]
  log(`round done — ${bracket.length} remain`)
}

return {
  top3: bracket.map((b) => ({ option: b.option, pitch: b.pitch })),
  totalGenerated: pool.length,
}
