export const meta = {
  name: 'deep-verify',
  description: 'Extract every factual claim from a report/document and verify each one with its own subagent, plus a source-quality audit',
  whenToUse: 'When a report, blog post, PRD or doc must ship with zero wrong claims. Pass args: { source: "<path or inline text>", context: "<optional: codebase dir, URLs, or where to verify against>" }',
  phases: [
    { title: 'Extract', detail: 'one agent identifies every factual claim' },
    { title: 'Verify', detail: 'one agent per claim, checked against sources' },
    { title: 'Audit', detail: 'skeptic re-checks sources of failed/uncertain claims' },
    { title: 'Synthesize', detail: 'final verified report' },
  ],
}

const A = (() => { if (typeof args === 'string') { try { return JSON.parse(args) } catch (e) { return {} } } return args || {} })()

const source = (A && A.source) || ''
const context = (A && A.context) || 'the local codebase and the web'
if (!source) throw new Error('Pass args: { source: "<file path or inline text>" }')

const CLAIMS_SCHEMA = {
  type: 'object',
  properties: {
    claims: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          claim: { type: 'string' },
          location: { type: 'string', description: 'where in the doc (section/line)' },
        },
        required: ['id', 'claim', 'location'],
      },
    },
  },
  required: ['claims'],
}

const VERDICT_SCHEMA = {
  type: 'object',
  properties: {
    verdict: { type: 'string', enum: ['verified', 'false', 'unverifiable'] },
    evidence: { type: 'string', description: 'what was checked and what was found' },
    source: { type: 'string', description: 'file:line, URL, or command output used as proof' },
    suggestedFix: { type: 'string', description: 'corrected wording if verdict is false, else empty' },
  },
  required: ['verdict', 'evidence', 'source'],
}

const AUDIT_SCHEMA = {
  type: 'object',
  properties: {
    sourceIsSolid: { type: 'boolean' },
    reason: { type: 'string' },
  },
  required: ['sourceIsSolid', 'reason'],
}

phase('Extract')
const extracted = await agent(
  `Read this document and extract EVERY factual claim — anything that could be true or false: numbers, behaviors, API signatures, dates, performance assertions, "X does Y" statements. Do not extract opinions or style. Document: ${source}`,
  { label: 'claim-extractor', schema: CLAIMS_SCHEMA, agentType: 'wf-heavy' }
)
log(`${extracted.claims.length} claims extracted`)

const results = await pipeline(
  extracted.claims,
  (c) =>
    agent(
      `Verify this single claim against ${context}. Claim: "${c.claim}" (from: ${c.location}). Actively try to DISPROVE it — read the actual code/source, run commands if needed, do not take the document's word for it. Cite concrete proof.`,
      { label: `verify:#${c.id}`, phase: 'Verify', schema: VERDICT_SCHEMA, agentType: 'wf-heavy' }
    ),
  async (verdict, c) => {
    if (!verdict) return null
    if (verdict.verdict === 'verified') {
      const audit = await agent(
        `A claim was marked verified with this source: "${verdict.source}". Evidence: "${verdict.evidence}". Is this source actually solid proof for the claim "${c.claim}", or is it weak/circular/outdated? Be skeptical.`,
        { label: `audit:#${c.id}`, phase: 'Audit', schema: AUDIT_SCHEMA, agentType: 'wf-judge' }
      )
      if (audit && !audit.sourceIsSolid) {
        return { ...c, ...verdict, verdict: 'unverifiable', evidence: `${verdict.evidence} | AUDIT REJECTED SOURCE: ${audit.reason}` }
      }
    }
    return { ...c, ...verdict }
  }
)

phase('Synthesize')
const checked = results.filter(Boolean)
const failed = checked.filter((r) => r.verdict === 'false')
const shaky = checked.filter((r) => r.verdict === 'unverifiable')
log(`${checked.length} checked · ${failed.length} false · ${shaky.length} unverifiable`)

return {
  totalClaims: extracted.claims.length,
  verified: checked.filter((r) => r.verdict === 'verified').length,
  falseClaims: failed,
  unverifiable: shaky,
}
