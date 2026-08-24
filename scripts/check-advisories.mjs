#!/usr/bin/env node
// Fails when the resolved tree contains any advisory that is not explicitly
// accepted in scripts/accepted-advisories.json.
//
// This exists because `pnpm audit` exits non-zero for accepted findings too, so
// the honest options are to subtract the accepted set explicitly or to stop
// running audit in CI. The first is the only one that keeps the gate meaningful.

import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const accepted = JSON.parse(readFileSync('scripts/accepted-advisories.json', 'utf8')).accepted ?? {}

let report
try {
  report = execFileSync('pnpm', ['audit', '--json'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
} catch (error) {
  // pnpm audit exits non-zero whenever it finds anything; the JSON is still on stdout.
  report = error.stdout
}
if (!report) {
  console.error('check-advisories: pnpm audit produced no output — failing closed')
  process.exit(1)
}

const advisories = Object.values(JSON.parse(report).advisories ?? {})
const unexpected = advisories.filter((a) => !Object.hasOwn(accepted, a.module_name))
const seen = new Set(advisories.map((a) => a.module_name))
const staleAcceptances = Object.keys(accepted).filter((name) => !seen.has(name))

for (const name of Object.keys(accepted)) {
  if (seen.has(name)) console.log(`check-advisories: accepted — ${accepted[name].severity} ${name} ${accepted[name].vulnerable}`)
}

if (staleAcceptances.length > 0) {
  console.error(`\ncheck-advisories: FAILED — ${staleAcceptances.length} acceptance(s) no longer apply; delete them:`)
  for (const name of staleAcceptances) console.error(`  ${name}`)
  process.exit(1)
}

if (unexpected.length > 0) {
  console.error(`\ncheck-advisories: FAILED — ${unexpected.length} unaccepted advisory finding(s):`)
  for (const a of unexpected) console.error(`  ${a.severity} ${a.module_name} ${a.vulnerable_versions} — ${a.title ?? ''}`)
  console.error('\nFix it, or add a reviewed acceptance to scripts/accepted-advisories.json.')
  process.exit(1)
}

console.log(`check-advisories: OK — ${advisories.length} finding(s), all accepted`)
