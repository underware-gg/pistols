#!/usr/bin/env node
// Verifies every package version in pnpm-lock.yaml is in the reviewed set.
//
// .pnpmfile.cjs blocks unreviewed packages during resolution, but pnpm skips
// resolution entirely when the lockfile is already satisfied — verified: removing
// an entry from the reviewed set and running `pnpm install --force` still exits 0,
// because readPackage is never called. So the pnpmfile cannot police a lockfile
// that someone else resolved and committed. This is the static counterpart.

import { readFileSync } from 'node:fs'
import { packagePair, parseResolvedPackages } from './lockfile-packages.mjs'
import { validateReviewRecord } from './review-record.mjs'

const reviewedFile = JSON.parse(readFileSync('scripts/reviewed-packages.json', 'utf8'))
const reviewed = reviewedFile.packages ?? {}
const provenance = reviewedFile.provenance ?? {}
if (Object.keys(reviewed).length === 0) {
  console.error('check-lockfile-reviewed: reviewed set is empty — failing closed')
  process.exit(1)
}

let resolved
try {
  resolved = parseResolvedPackages(readFileSync('pnpm-lock.yaml', 'utf8'))
} catch (error) {
  console.error(`check-lockfile-reviewed: ${error.message} — failing closed`)
  process.exit(1)
}

const unreviewed = []
for (const [name, versions] of resolved) {
  for (const version of versions) {
    if (!reviewed[name]?.includes(version)) unreviewed.push(`${name}@${version}`)
  }
}

// A stale entry — reviewed, but no longer resolved — is a failure, not a note.
// Left in place it silently re-permits that exact version if the package ever
// returns to the tree, which defeats the ratchet: the whole point is that a
// version cannot come back without someone reviewing it again. A package leaving
// the tree is legitimate; leaving its permission behind is not. Regenerating
// prunes them, because the set is rebuilt from the lockfile wholesale.
const stale = Object.entries(reviewed)
  .flatMap(([name, versions]) => versions.filter((v) => !resolved.get(name)?.has(v)).map((v) => `${name}@${v}`))

const missingProvenance = []
const staleProvenance = []
const invalidRecords = []
for (const [name, versions] of resolved) {
  for (const version of versions) {
    if (!provenance[name]?.[version]) missingProvenance.push(packagePair(name, version))
  }
}
for (const [name, versions] of Object.entries(provenance)) {
  for (const [version, record] of Object.entries(versions)) {
    if (!resolved.get(name)?.has(version)) {
      staleProvenance.push(packagePair(name, version))
    } else if (typeof record !== 'string') {
      invalidRecords.push(`${packagePair(name, version)}: provenance must be a string`)
    } else if (!record.startsWith('legacy:')) {
      try {
        validateReviewRecord(record)
      } catch (error) {
        invalidRecords.push(`${packagePair(name, version)}: ${error.message}`)
      }
    }
  }
}

if (unreviewed.length > 0) {
  console.error(`check-lockfile-reviewed: FAILED — ${unreviewed.length} package version(s) in the lockfile are not in the reviewed set:\n`)
  for (const p of unreviewed.slice(0, 40)) console.error(`  ${p}`)
  if (unreviewed.length > 40) console.error(`  ... and ${unreviewed.length - 40} more`)
  console.error('\nReview them (node scripts/candidate.mjs <pkg>@<version>), write a record,')
  console.error('then run node scripts/generate-reviewed-set.mjs --record <file>.')
  process.exit(1)
}

if (stale.length > 0) {
  console.error(`check-lockfile-reviewed: FAILED — ${stale.length} reviewed entr${stale.length === 1 ? 'y is' : 'ies are'} no longer resolved:\n`)
  for (const p of stale.slice(0, 40)) console.error(`  ${p}`)
  if (stale.length > 40) console.error(`  ... and ${stale.length - 40} more`)
  console.error('\nEach one is standing permission for a version that is not in the tree, so it')
  console.error('would return without review. Regenerate to prune them:')
  console.error('  node scripts/generate-reviewed-set.mjs --record <file>')
  process.exit(1)
}

if (missingProvenance.length > 0 || staleProvenance.length > 0 || invalidRecords.length > 0) {
  console.error('\ncheck-lockfile-reviewed: FAILED — reviewed-set provenance is incomplete or invalid:')
  for (const pair of missingProvenance.slice(0, 40)) console.error(`  missing: ${pair}`)
  for (const pair of staleProvenance.slice(0, 40)) console.error(`  stale: ${pair}`)
  for (const problem of invalidRecords.slice(0, 40)) console.error(`  invalid: ${problem}`)
  console.error('\nRegenerate with an existing, complete review record:')
  console.error('  node scripts/generate-reviewed-set.mjs --record docs/dependency-reviews/<file>')
  process.exit(1)
}

console.log(`check-lockfile-reviewed: OK — ${[...resolved.values()].reduce((n, s) => n + s.size, 0)} resolved package versions, all reviewed with provenance, no stale permissions`)
