#!/usr/bin/env node
// Regenerates scripts/reviewed-packages.json from the current lockfile.
//
// Run this ONLY after the packages entering the tree have actually been reviewed
// (scripts/candidate.mjs) and a record written. Running it to make a failing
// install pass converts the gate into a rubber stamp, which is the one way this
// mechanism can fail silently.
//
// usage: node scripts/generate-reviewed-set.mjs --record docs/dependency-reviews/<file>.md

import { readFileSync, writeFileSync } from 'node:fs'

const argv = process.argv.slice(2)
const record = argv[argv.indexOf('--record') + 1]
if (!argv.includes('--record') || !record) {
  console.error('usage: node scripts/generate-reviewed-set.mjs --record docs/dependency-reviews/<file>.md')
  process.exit(2)
}

const existing = JSON.parse(readFileSync('scripts/reviewed-packages.json', 'utf8'))
const packages = {}
let inPackages = false
for (const line of readFileSync('pnpm-lock.yaml', 'utf8').split('\n')) {
  if (/^packages:\s*$/.test(line)) { inPackages = true; continue }
  if (inPackages && line.length > 0 && !/^\s/.test(line)) break
  if (!inPackages) continue
  const m = line.match(/^ {2}'?((?:@[^/]+\/)?[^@'\s]+)@([^'():\s]+)'?:/)
  if (m) (packages[m[1]] ??= []).push(m[2])
}
for (const name of Object.keys(packages)) packages[name] = [...new Set(packages[name])].sort()

const before = Object.values(existing.packages ?? {}).flat().length
const after = Object.values(packages).flat().length
writeFileSync('scripts/reviewed-packages.json', JSON.stringify({ ...existing, packages }, null, 2) + '\n')
console.log(`generate-reviewed-set: ${Object.keys(packages).length} packages, ${after} name@version pairs (was ${before})`)
console.log(`record: ${record}`)
