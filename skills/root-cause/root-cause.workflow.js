export const meta = {
  name: 'root-cause',
  description: 'Root-cause investigation: independent agents form hypotheses from disjoint evidence, each hypothesis faces a panel of refuters, loop until one survives',
  whenToUse: 'Debugging a hard bug, flaky test, pipeline failure or any post-mortem (why did sales drop?). Structurally avoids self-preferential bias. Pass args: { problem: "...", evidence: ["logs at /var/log/x", "the billing/ module", "the dataset at ..."] }',
  phases: [
    { title: 'Hypothesize', detail: 'one agent per evidence source, blind to the others' },
    { title: 'Refute', detail: 'panel of refuters attacks each hypothesis' },
    { title: 'Confirm', detail: 'survivor is reproduced/proven' },
  ],
}

const A = (() => { if (typeof args === 'string') { try { return JSON.parse(args) } catch (e) { return {} } } return args || {} })()

const problem = (A && A.problem) || ''
const evidence = (A && A.evidence) || []
if (!problem || evidence.length < 2) {
  throw new Error('Pass args: { problem: "...", evidence: ["source 1", "source 2", ...] } — at least 2 disjoint evidence sources')
}

const HYPO_SCHEMA = {
  type: 'object',
  properties: {
    hypotheses: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          theory: { type: 'string' },
          supportingEvidence: { type: 'string' },
          testToConfirm: { type: 'string', description: 'a concrete experiment that would prove or kill this theory' },
        },
        required: ['theory', 'supportingEvidence', 'testToConfirm'],
      },
    },
  },
  required: ['hypotheses'],
}

const REFUTE_SCHEMA = {
  type: 'object',
  properties: {
    refuted: { type: 'boolean' },
    argument: { type: 'string' },
  },
  required: ['refuted', 'argument'],
}

const CONFIRM_SCHEMA = {
  type: 'object',
  properties: {
    confirmed: { type: 'boolean' },
    proof: { type: 'string' },
  },
  required: ['confirmed', 'proof'],
}

// Each hypothesizer sees ONE evidence source and nothing else — disjoint
// evidence is what produces genuinely independent theories.
phase('Hypothesize')
const hypoSets = await parallel(
  evidence.map((src, i) => () =>
    agent(
      `Problem: "${problem}". Investigate ONLY this evidence source: ${src}. Form up to 3 hypotheses for the root cause based strictly on what you find there. For each, state a concrete test that would confirm or kill it.`,
      { label: `evidence-${i + 1}`, schema: HYPO_SCHEMA, agentType: 'wf-heavy' }
    )
  )
)
let theories = hypoSets.filter(Boolean).flatMap((h) => h.hypotheses)
log(`${theories.length} hypotheses from ${evidence.length} evidence sources`)

phase('Refute')
const LENSES = [
  'timeline — does the evidence timing actually fit this theory?',
  'mechanism — walk the causal chain step by step; does it hold technically?',
  'alternative — find a simpler explanation that fits the same evidence',
]
const judged = await pipeline(
  theories,
  (t, _o, i) =>
    parallel(
      LENSES.map((lens) => () =>
        agent(
          `Problem: "${problem}". Try to REFUTE this root-cause theory via the lens of ${lens}\nTheory: ${t.theory}\nClaimed support: ${t.supportingEvidence}\nInvestigate the actual code/logs/data. Default to refuted=true if the theory does not clearly hold.`,
          { label: `refute:${i + 1}`, phase: 'Refute', schema: REFUTE_SCHEMA, agentType: 'wf-heavy' }
        )
      )
    ).then((votes) => {
      const v = votes.filter(Boolean)
      return { ...t, survived: v.filter((x) => !x.refuted).length >= 2, attacks: v.map((x) => x.argument) }
    })
)
const survivors = judged.filter(Boolean).filter((t) => t.survived)
log(`${survivors.length}/${theories.length} hypotheses survived the panel`)

phase('Confirm')
const confirmed = []
for (const t of survivors) {
  const result = await agent(
    `Problem: "${problem}". This theory survived adversarial review: "${t.theory}". Run its confirmation test for real: ${t.testToConfirm}. Use a worktree if you need to modify code to reproduce. Only report confirmed=true with concrete proof (command output, reproduced failure, matching data).`,
    { label: 'confirm', schema: CONFIRM_SCHEMA, isolation: 'worktree', agentType: 'wf-heavy' }
  )
  if (result && result.confirmed) {
    confirmed.push({ theory: t.theory, proof: result.proof })
    break
  }
}

return {
  rootCause: confirmed[0] || null,
  survivingTheories: survivors.map((t) => t.theory),
  rejectedTheories: judged.filter(Boolean).filter((t) => !t.survived).map((t) => ({ theory: t.theory, killedBy: t.attacks })),
}
