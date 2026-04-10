'use strict'
const fs   = require('fs')
const path = require('path')
const CONTENT = path.join(__dirname, '..', 'content')
let errors = 0, warnings = 0
function err(msg)  { console.error(`  ✗ ${msg}`); errors++ }
function warn(msg) { console.warn(`  ⚠ ${msg}`); warnings++ }
function ok(msg)   { console.log(`  ✓ ${msg}`) }
function loadJSON(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')) }
  catch(e) { err(`Invalid JSON: ${p} — ${e.message}`); return null }
}
console.log('\n🔍 Synaptic Content Validator\n')
const nodesFile = path.join(CONTENT, 'graph/nodes.json')
const edgesFile = path.join(CONTENT, 'graph/edges.json')
if (!fs.existsSync(nodesFile) || !fs.existsSync(edgesFile)) {
  console.error('❌ Fatal: cannot load graph files'); process.exit(1)
}
const nodes = loadJSON(nodesFile)
const edges = loadJSON(edgesFile)
if (!nodes || !edges) { process.exit(1) }
const inDeg = new Map(nodes.map(n => [n.id, 0]))
for (const e of edges) {
  if (e.strength === 'hard') { inDeg.set(e.to, (inDeg.get(e.to) || 0) + 1) }
}
const queue = nodes.filter(n => (inDeg.get(n.id) || 0) === 0)
let sorted = 0
while (queue.length > 0) {
  const n = queue.shift(); sorted++
  for (const e of edges.filter(e2 => e2.from === n.id && e2.strength === 'hard')) {
    const d = (inDeg.get(e.to) || 1) - 1; inDeg.set(e.to, d)
    if (d === 0) { const found = nodes.find(x => x.id === e.to); if (found) { queue.push(found) } }
  }
}
console.log('Nodes & Edges')
ok(`${nodes.length} nodes loaded`)
ok(`${edges.length} edges valid`)
if (sorted !== nodes.length) {
  err('Cycle detected in prerequisite graph!')
} else {
  ok('No cycles detected')
}
console.log('\nQuestion Files')
let qChecked = 0, qMissing = 0
for (const node of nodes) {
  if (!node.question_ids || node.question_ids.length === 0) { continue }
  const qFile = path.join(CONTENT, 'questions/by-skill', `${node.id}.json`)
  if (!fs.existsSync(qFile)) { warn(`Missing question file: ${node.id}.json`); qMissing++; continue }
  const qs = loadJSON(qFile)
  if (!qs) { continue }
  const fileIds = new Set(qs.map(q => q.id))
  for (const qid of node.question_ids) {
    if (!fileIds.has(qid)) { warn(`Node ${node.id} declares "${qid}" not found in file`) }
  }
  qChecked++
}
ok(`${qChecked} question files validated`)
if (qMissing) { warn(`${qMissing} question files missing`) }
console.log('\nExplanation Files')
let expChecked = 0
for (const node of nodes) {
  const qFile = path.join(CONTENT, 'questions/by-skill', `${node.id}.json`)
  if (!fs.existsSync(qFile)) { continue }
  const expDir = path.join(CONTENT, 'explanations', node.id)
  if (!fs.existsSync(expDir)) { warn(`Active skill ${node.id} missing explanation directory`); continue }
  for (const depth of ['beginner', 'mid', 'advanced']) {
    const f = path.join(expDir, `${depth}.json`)
    if (!fs.existsSync(f)) { warn(`Missing ${depth}.json for: ${node.id}`); continue }
    const exp = loadJSON(f)
    if (exp && !exp.body) { warn(`${node.id}/${depth}.json missing 'body'`) }
    if (exp && !exp.key_insight) { warn(`${node.id}/${depth}.json missing 'key_insight'`) }
  }
  expChecked++
}
ok(`${expChecked} explanation directories validated`)
console.log('\nDiagnostic Questions')
const diagFile = path.join(CONTENT, 'questions/diagnostic/questions.json')
if (fs.existsSync(diagFile)) {
  const diag = loadJSON(diagFile)
  if (diag) { ok(`${diag.length} diagnostic questions`) }
} else {
  warn('Missing diagnostic/questions.json')
}
console.log('\n' + '─'.repeat(50) + '\n')
if (errors === 0 && warnings === 0) {
  console.log('✅ All checks passed — 0 errors, 0 warnings\n')
} else {
  if (errors > 0) { console.error(`❌ ${errors} error(s) found`) }
  if (warnings > 0) { console.warn(`⚠  ${warnings} warning(s) found`) }
  console.log()
  if (errors > 0) { process.exit(1) }
}
