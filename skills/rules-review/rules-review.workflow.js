export const meta = {
  name: 'rules-review',
  description: 'Review the current git diff with one verifier agent per project rule, then a skeptic kills false positives — only confirmed violations survive',
  whenToUse: 'Before opening a PR, when the project has hard rules Claude tends to miss (CLAUDE.md conventions, money-as-integer, UTC timestamps, etc). Pass args: { rules: ["..."], diffCmd: "git diff main...HEAD" }. If rules is omitted, they are mined from CLAUDE.md.',
  phases: [
    { title: 'Prepare', detail: 'collect diff and rules' },
    { title: 'Verify', detail: 'one verifier agent per rule, clean context each' },
    { title: 'Skeptic', detail: 're-reads each flag — real violation or false positive?' },
  ],
}

const A = (() => { if (typeof args === 'string') { try { return JSON.parse(args) } catch (e) { return {} } } return args || {} })()

const diffCmd = (A && A.diffCmd) || 'git diff HEAD'
let rules = (A && A.rules) || []

const RULES_SCHEMA = {
  type: 'object',
  properties: { rules: { type: 'array', items: { type: 'string' } } },
  required: ['rules'],
}

const FLAGS_SCHEMA = {
  type: 'object',
  properties: {
    violations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          file: { type: 'string' },
          line: { type: 'string' },
          excerpt: { type: 'string' },
          why: { type: 'string' },
        },
        required: ['file', 'line', 'why'],
      },
    },
  },
  required: ['violations'],
}

const SKEPTIC_SCHEMA = {
  type: 'object',
  properties: {
    isReal: { type: 'boolean' },
    reason: { type: 'string' },
  },
  required: ['isReal', 'reason'],
}

phase('Prepare')
if (!rules.length) {
  const mined = await agent(
    'Read every CLAUDE.md that applies to this repo (project root, parent dirs, ~/.claude/CLAUDE.md) and extract the concrete, checkable rules — things a diff could violate (naming, error handling, money/time conventions, forbidden patterns). Skip vague advice. Return each rule as one self-contained sentence.',
    { label: 'mine-rules', schema: RULES_SCHEMA, agentType: 'wf-heavy' }
  )
  rules = mined ? mined.rules : []
}
if (!rules.length) throw new Error('No rules found — pass args: { rules: ["..."] }')
log(`${rules.length} rules · diff via: ${diffCmd}`)

// One verifier per rule, clean context each — a single reviewer holding all
// rules at once is exactly what misses violations.
const confirmed = await pipeline(
  rules,
  (rule, _orig, i) =>
    agent(
      `Run \`${diffCmd}\` and check the changed code against EXACTLY ONE rule: "${rule}". Read surrounding context of changed lines when needed. Flag every violation with file, line and excerpt. If clean, return an empty violations array. Do not check anything besides this rule.`,
      { label: `rule-${i + 1}`, phase: 'Verify', schema: FLAGS_SCHEMA, agentType: 'wf-heavy' }
    ),
  async (flags, rule) => {
    if (!flags || !flags.violations.length) return { rule, violations: [] }
    const judged = await parallel(
      flags.violations.map((v) => () =>
        agent(
          `A reviewer flagged this as violating "${rule}":\n${v.file}:${v.line} — ${v.excerpt || ''}\nReason given: ${v.why}\nRe-run \`${diffCmd}\` to locate the file (paths are relative to the repo that command targets — use the same -C/working dir) and re-read the flagged location. Is this a REAL violation, or a false positive (test fixture, generated code, pre-existing line not touched by the diff, rule misread)? Default to false positive when uncertain.`,
          { label: `skeptic:${v.file}`, phase: 'Skeptic', schema: SKEPTIC_SCHEMA, agentType: 'wf-heavy' }
        ).then((j) => (j && j.isReal ? { ...v, confirmedBy: j.reason } : null))
      )
    )
    return { rule, violations: judged.filter(Boolean) }
  }
)

const report = confirmed.filter(Boolean)
const total = report.reduce((n, r) => n + r.violations.length, 0)
log(`${total} confirmed violations across ${report.filter((r) => r.violations.length).length} rules`)

return {
  rulesChecked: rules.length,
  confirmedViolations: report.filter((r) => r.violations.length),
  clean: report.filter((r) => !r.violations.length).map((r) => r.rule),
}
