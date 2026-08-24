#!/usr/bin/env node
// Verifies every package version in pnpm-lock.yaml is in the reviewed set.
//
// .pnpmfile.cjs blocks unreviewed packages during resolution, but pnpm skips
// resolution entirely when the lockfile is already satisfied — verified: removing
// an entry from the reviewed set and running `pnpm install --force` still exits 0,
// because readPackage is never called. So the pnpmfile cannot police a lockfile
// that someone else resolved and committed. This is the static counterpart.

import { readFileSync } from 'node:fs'

const reviewed = JSON.parse(readFileSync('scripts/reviewed-packages.json', 'utf8')).packages ?? {}
if (Object.keys(reviewed).length === 0) {
  console.error('check-lockfile-reviewed: reviewed set is empty — failing closed')
  process.exit(1)
}

const resolved = new Map()
let inPackages = false
for (const line of readFileSync('pnpm-lock.yaml', 'utf8').split('\n')) {
  if (/^packages:\s*$/.test(line)) { inPackages = true; continue }
  if (inPackages && line.length > 0 && !/^\s/.test(line)) break
  if (!inPackages) continue
  const m = line.match(/^ {2}'?((?:@[^/]+\/)?[^@'\s]+)@([^'():\s]+)'?:/)
  if (m) {
    if (!resolved.has(m[1])) resolved.set(m[1], new Set())
    resolved.get(m[1]).add(m[2])
  }
}
if (resolved.size === 0) {
  console.error('check-lockfile-reviewed: parsed zero packages from the lockfile — failing closed')
  process.exit(1)
}

const unreviewed = []
for (const [name, versions] of resolved) {
  for (const version of versions) {
    if (!reviewed[name]?.includes(version)) unreviewed.push(`${name}@${version}`)
  }
}

// Entries in the reviewed set that no longer resolve are not a failure — a
// package can leave the tree legitimately — but they should not accumulate
// unnoticed, because a stale allowlist silently re-permits anything that returns.
const stale = Object.entries(reviewed)
  .flatMap(([name, versions]) => versions.filter((v) => !resolved.get(name)?.has(v)).map((v) => `${name}@${v}`))

if (unreviewed.length > 0) {
  console.error(`check-lockfile-reviewed: FAILED — ${unreviewed.length} package version(s) in the lockfile are not in the reviewed set:\n`)
  for (const p of unreviewed.slice(0, 40)) console.error(`  ${p}`)
  if (unreviewed.length > 40) console.error(`  ... and ${unreviewed.length - 40} more`)
  console.error('\nReview them (node scripts/candidate.mjs <pkg>@<version>), write a record,')
  console.error('then run node scripts/generate-reviewed-set.mjs --record <file>.')
  process.exit(1)
}

console.log(`check-lockfile-reviewed: OK — ${[...resolved.values()].reduce((n, s) => n + s.size, 0)} resolved package versions, all reviewed${stale.length ? `; ${stale.length} stale entr${stale.length === 1 ? 'y' : 'ies'} in the reviewed set` : ''}`)
