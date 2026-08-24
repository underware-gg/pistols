#!/usr/bin/env node
// Fails when pnpm-workspace.yaml declares a top-level key that is not in
// scripts/known-settings.json.
//
// pnpm silently ignores keys it does not recognise. A fabricated setting sits in
// the file looking like enforcement and reads back cleanly from `pnpm config
// get`, which echoes any key present in the file — verified with a control
// (`totallyFakeSettingXyz`). So neither the file nor pnpm's own config reader can
// tell a control from a comment. This gate is the substitute: a key may only
// appear if someone has recorded how they verified it.

import { readFileSync } from 'node:fs'

const registry = JSON.parse(readFileSync('scripts/known-settings.json', 'utf8'))
const known = registry.settings ?? {}

const declared = readFileSync('pnpm-workspace.yaml', 'utf8')
  .split('\n')
  .map((line) => line.match(/^([a-zA-Z][\w-]*):/))
  .filter(Boolean)
  .map((m) => m[1])

const failures = []
const unknown = declared.filter((key) => !Object.hasOwn(known, key))
for (const key of unknown) {
  failures.push(`pnpm-workspace.yaml declares "${key}", which is not in scripts/known-settings.json. Verify it against the pnpm settings reference (or a behavioural test), record the evidence, then add it.`)
}

const stale = Object.keys(known).filter((key) => !declared.includes(key))
for (const key of stale) {
  failures.push(`scripts/known-settings.json records "${key}", which pnpm-workspace.yaml no longer declares. Delete the entry so the registry cannot drift.`)
}

const unverified = declared.filter((key) => known[key]?.evidence === 'unverified')
if (unverified.length > 0) {
  // Loud on every run. An unverified setting is not a control, and the whole
  // point of this file is that the difference stays visible.
  console.log(`check-settings: ${unverified.length} declared setting(s) are UNVERIFIED and must not be counted as controls:`)
  for (const key of unverified) {
    console.log(`  ${key}`)
    console.log(`    ${known[key].note}`)
    if (known[key].action) console.log(`    action: ${known[key].action}`)
  }
  console.log('')
}

if (failures.length > 0) {
  console.error(`check-settings: FAILED with ${failures.length} problem(s)\n`)
  for (const f of failures) console.error(`  ${f}`)
  process.exit(1)
}

const counts = declared.reduce((acc, key) => {
  const e = known[key]?.evidence ?? 'unknown'
  acc[e] = (acc[e] ?? 0) + 1
  return acc
}, {})
console.log(`check-settings: OK — ${declared.length} settings declared (${Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(', ')})`)
