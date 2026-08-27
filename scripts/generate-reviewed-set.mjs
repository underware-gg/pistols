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
import { parseResolvedPackages } from './lockfile-packages.mjs'
import { validateReviewRecord } from './review-record.mjs'

const argv = process.argv.slice(2)
const record = argv[argv.indexOf('--record') + 1]
if (!argv.includes('--record') || !record) {
  console.error('usage: node scripts/generate-reviewed-set.mjs --record docs/dependency-reviews/<file>.md')
  process.exit(2)
}
let validatedRecord
try {
  validatedRecord = validateReviewRecord(record)
} catch (error) {
  console.error(`generate-reviewed-set: ${error.message}`)
  process.exit(2)
}

const existing = JSON.parse(readFileSync('scripts/reviewed-packages.json', 'utf8'))
const resolved = parseResolvedPackages(readFileSync('pnpm-lock.yaml', 'utf8'))
const packages = Object.fromEntries(
  [...resolved.entries()].sort(([a], [b]) => a.localeCompare(b))
    .map(([name, versions]) => [name, [...versions].sort()]),
)
const existingPackages = existing.packages ?? {}
const existingProvenance = existing.provenance ?? {}
const provenance = {}
for (const [name, versions] of Object.entries(packages)) {
  provenance[name] = {}
  for (const version of versions) {
    const previous = existingProvenance[name]?.[version]
    const existedBeforeProvenance = existingPackages[name]?.includes(version)
    provenance[name][version] = previous ?? (
      existedBeforeProvenance
        ? 'legacy:pre-provenance-2026-08-28'
        : validatedRecord
    )
  }
}

const before = Object.values(existing.packages ?? {}).flat().length
const after = Object.values(packages).flat().length
writeFileSync('scripts/reviewed-packages.json', JSON.stringify({
  ...existing,
  provenanceComment: 'Every permitted name@version has provenance. legacy:* entries predate per-version provenance; new admissions name their validated review record.',
  packages,
  provenance,
}, null, 2) + '\n')
console.log(`generate-reviewed-set: ${Object.keys(packages).length} packages, ${after} name@version pairs (was ${before})`)
console.log(`record: ${validatedRecord}`)
