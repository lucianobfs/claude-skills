export const meta = {
  name: 'tournament-rank',
  description: 'Rank a list of items by a qualitative criterion using pairwise-comparison agents (tournament + merge), then double-check the top picks',
  whenToUse: 'When you need to sort/rank many items by something subjective Claude judges well (severity, quality, fit). Pass args: { items: ["..."], criterion: "...", topN: 5 }. Items can be strings or file paths.',
  phases: [
    { title: 'Group rank', detail: 'parallel agents rank small buckets' },
    { title: 'Playoff', detail: 'pairwise comparisons merge bucket winners' },
    { title: 'Double-check', detail: 'adversarial review of the top N' },
  ],
}

const A = (() => { if (typeof args === 'string') { try { return JSON.parse(args) } catch (e) { return {} } } return args || {} })()

const items = (A && A.items) || []
const criterion = (A && A.criterion) || ''
const topN = (A && A.topN) || 5
if (!items.length || !criterion) throw new Error('Pass args: { items: [...], criterion: "..." }')

const BUCKET_SCHEMA = {
  type: 'object',
  properties: {
    ranked: {
      type: 'array',
      description: 'item indices, best first',
      items: { type: 'number' },
    },
  },
  required: ['ranked'],
}

const PAIR_SCHEMA = {
  type: 'object',
  properties: {
    winner: { type: 'string', enum: ['A', 'B'] },
    reason: { type: 'string' },
  },
  required: ['winner', 'reason'],
}

const CHECK_SCHEMA = {
  type: 'object',
  properties: {
    deservesRank: { type: 'boolean' },
    concern: { type: 'string' },
  },
  required: ['deservesRank', 'concern'],
}

// Bucket-rank in parallel: comparative judgment within small groups is reliable;
// 1000 items in one prompt is not.
const BUCKET_SIZE = 8
const buckets = []
for (let i = 0; i < items.length; i += BUCKET_SIZE) {
  buckets.push(items.slice(i, i + BUCKET_SIZE).map((item, j) => ({ item, idx: i + j })))
}

phase('Group rank')
log(`${items.length} items in ${buckets.length} buckets of up to ${BUCKET_SIZE}`)
const bucketResults = await parallel(
  buckets.map((bucket, b) => () =>
    agent(
      `Rank these items by: "${criterion}". Best first. If an entry is a file path, read it. Return the indices in ranked order.\n\n${bucket
        .map((e) => `[${e.idx}] ${e.item}`)
        .join('\n')}`,
      { label: `bucket-${b}`, schema: BUCKET_SCHEMA, agentType: 'wf-heavy' }
    ).then((r) => (r ? r.ranked : bucket.map((e) => e.idx)))
  )
)

// Merge bucket heads via pairwise playoff — each comparison is a fresh agent,
// only the running order lives in this deterministic loop.
phase('Playoff')
const queues = bucketResults.filter(Boolean).map((r) => [...r])
const finalOrder = []
while (queues.some((q) => q.length)) {
  const heads = queues.filter((q) => q.length)
  if (heads.length === 1) {
    finalOrder.push(...heads[0])
    break
  }
  let bestQ = heads[0]
  for (let i = 1; i < heads.length; i++) {
    const a = items[bestQ[0]]
    const b = items[heads[i][0]]
    const v = await agent(
      `Which is better by "${criterion}"?\nA: ${a}\nB: ${b}\nIf these are file paths, read both. Pick strictly one.`,
      { label: `pair:${bestQ[0]}v${heads[i][0]}`, schema: PAIR_SCHEMA, agentType: 'wf-judge' }
    )
    if (v && v.winner === 'B') bestQ = heads[i]
  }
  finalOrder.push(bestQ.shift())
  if (finalOrder.length % 10 === 0) log(`${finalOrder.length}/${items.length} placed`)
}

phase('Double-check')
const top = finalOrder.slice(0, topN)
const checks = await parallel(
  top.map((idx, rank) => () =>
    agent(
      `Adversarially review: does this item really deserve rank #${rank + 1} of ${items.length} by "${criterion}"? Look for reasons it should NOT be in the top ${topN}.\nItem: ${items[idx]}`,
      { label: `check:#${rank + 1}`, schema: CHECK_SCHEMA, agentType: 'wf-heavy' }
    ).then((v) => ({ rank: rank + 1, idx, item: items[idx], confirmed: v ? v.deservesRank : true, concern: v ? v.concern : '' }))
  )
)

return {
  ranking: finalOrder.map((idx, i) => ({ rank: i + 1, item: items[idx] })),
  topChecked: checks.filter(Boolean),
}
