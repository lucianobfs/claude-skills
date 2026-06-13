export const meta = {
  name: 'classify-and-act',
  description: 'Classify-and-act: a classifier agent routes the task to exactly one of N defined handlers, then the chosen handler executes it',
  whenToUse: 'When the right behavior depends on the type of input — route a request, ticket, file, or question to the matching handler. Pass args: { task: "the thing to handle", routes: [{ name: "bug", when: "describes a defect", do: "reproduce and propose a fix" }, { name: "question", when: "asks how something works", do: "answer with citations" }] }. To handle many items, wrap the body in pipeline(items, ...).',
  phases: [
    { title: 'Classify', detail: 'one judge picks the route' },
    { title: 'Act', detail: 'the chosen handler runs the task' },
  ],
}

const A = (() => { if (typeof args === 'string') { try { return JSON.parse(args) } catch (e) { return {} } } return args || {} })()

const task = (A && A.task) || ''
const routes = (A && A.routes) || []
if (!task || !Array.isArray(routes) || routes.length < 2) {
  throw new Error('Pass args: { task: "...", routes: [{ name, when, do }, ...] } (>= 2 routes)')
}

const names = routes.map((r) => r.name)

const ROUTE_SCHEMA = {
  type: 'object',
  properties: {
    route: { type: 'string', enum: names },
    reason: { type: 'string', description: 'one sentence on why this route fits' },
  },
  required: ['route', 'reason'],
}

const ACT_SCHEMA = {
  type: 'object',
  properties: { result: { type: 'string', description: 'the handler output' } },
  required: ['result'],
}

// 1) Classifier decides the route (a judgment call -> wf-judge).
phase('Classify')
const decision = await agent(
  `Classify this task into exactly one route.\n\nTASK:\n${task}\n\nROUTES:\n${routes
    .map((r) => `- ${r.name}: ${r.when}`)
    .join('\n')}\n\nReturn the single best-fitting route name and a one-sentence reason.`,
  { label: 'classifier', schema: ROUTE_SCHEMA, agentType: 'wf-judge' }
)
const chosen = routes.find((r) => r.name === (decision && decision.route)) || routes[0]
log(`route -> ${chosen.name}${decision ? ` (${decision.reason})` : ''}`)

// 2) The matching handler acts (real work -> wf-heavy).
phase('Act')
const acted = await agent(
  `You are the "${chosen.name}" handler. Do exactly this with the task: ${chosen.do}\n\nTASK:\n${task}`,
  { label: `act:${chosen.name}`, schema: ACT_SCHEMA, agentType: 'wf-heavy' }
)

return {
  route: chosen.name,
  reason: decision ? decision.reason : '',
  result: acted ? acted.result : '',
}
