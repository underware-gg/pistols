#!/usr/bin/env node
// Enforces the exact-pinning rule from docs/dependency-reviews/README.md.
//
// Exact pinning is not a style preference. It is the control that makes every
// other dependency gate meaningful: a range lets an unreviewed version enter the
// tree on any install, which defeats advisory review, the release-age gate and
// the override set at once. This script exists so the rule cannot quietly become
// optional again.
//
// Fails on:
//   - any ranged specifier in dependencies/devDependencies/optionalDependencies
//     of any workspace manifest
//   - any ranged catalog entry that is not enumerated in scripts/pin-waivers.json
//   - any waiver that has gone stale (its specifier is now exact, or the entry no
//     longer exists), so the waiver list cannot rot
//   - any waiver whose reason is not defined
//
// peerDependencies are deliberately out of scope: a peer range is a contract with
// consumers about what they may supply, not a resolution we control.

import { readFileSync } from 'node:fs'

const MANIFESTS = ['package.json', 'sdk/package.json', 'client/package.json', 'verifier/package.json']
const PINNED_SECTIONS = ['dependencies', 'devDependencies', 'optionalDependencies']
const PASSTHROUGH = /^(catalog:|workspace:|link:|file:)/
// Allowlist, not a blocklist. A blocklist of range syntaxes lets anything it did
// not anticipate through — `0.180.x` and `latest` are both ranges and both slip
// past a "starts with ^ or ~" test. Only a strict semver literal is exact.
const EXACT = /^\d+\.\d+\.\d+(?:-[\w.-]+)?(?:\+[\w.-]+)?$/
const isRange = (spec) => !EXACT.test(spec)

const waivers = JSON.parse(readFileSync('scripts/pin-waivers.json', 'utf8'))
const failures = []
const staleWaivers = []

// --- workspace manifests: no waivers permitted, ever ------------------------
for (const file of MANIFESTS) {
  const pkg = JSON.parse(readFileSync(file, 'utf8'))
  for (const section of PINNED_SECTIONS) {
    for (const [name, spec] of Object.entries(pkg[section] ?? {})) {
      if (PASSTHROUGH.test(spec)) continue
      if (isRange(spec)) {
        failures.push(`${file} [${section}] ${name}: "${spec}" is not an exact version; pin it to the resolved version`)
      }
    }
  }
}

// --- catalog: waivers permitted, but enumerated and self-invalidating ------
const catalogEntries = new Map()
{
  const lines = readFileSync('pnpm-workspace.yaml', 'utf8').split('\n')
  let inCatalog = false
  for (const line of lines) {
    if (/^catalog:\s*$/.test(line)) { inCatalog = true; continue }
    if (inCatalog && line.length > 0 && !/^\s/.test(line)) break
    if (!inCatalog) continue
    const trimmed = line.trim()
    if (trimmed === '' || trimmed.startsWith('#')) continue
    const match = trimmed.match(/^"?([@\w./-]+)"?:\s*"?([^"#\s]+)"?/)
    if (match) catalogEntries.set(match[1], match[2])
  }
}
if (catalogEntries.size === 0) failures.push('pnpm-workspace.yaml: parsed zero catalog entries — the parser or the file shape changed')

const catalogWaivers = waivers.catalog ?? {}
for (const [name, spec] of catalogEntries) {
  const waived = Object.hasOwn(catalogWaivers, name)
  const ranged = isRange(spec)
  if (ranged && !waived) {
    failures.push(`catalog ${name}: "${spec}" is not an exact version and has no waiver in scripts/pin-waivers.json`)
  }
  if (!ranged && waived) {
    staleWaivers.push(`catalog ${name}: pinned at "${spec}" but still waived — delete the waiver`)
  }
}
for (const name of Object.keys(catalogWaivers)) {
  if (!catalogEntries.has(name)) staleWaivers.push(`catalog ${name}: waived but no longer in the catalog — delete the waiver`)
  const reason = catalogWaivers[name]
  if (!waivers.reasons?.[reason]) failures.push(`catalog ${name}: waiver reason "${reason}" is not defined in scripts/pin-waivers.json`)
}

// --- report ----------------------------------------------------------------
const waivedNames = Object.keys(catalogWaivers)
if (waivedNames.length > 0) {
  // Printed on every run, passing or failing: waived debt must stay visible.
  console.log(`check-pins: ${waivedNames.length} catalog entries are waived from exact pinning:`)
  for (const reason of new Set(Object.values(catalogWaivers))) {
    const names = waivedNames.filter((n) => catalogWaivers[n] === reason)
    console.log(`  ${reason} (${names.length}): ${names.join(', ')}`)
    console.log(`    blocked on: ${waivers.reasons[reason]?.blocked_on ?? '(undefined)'}`)
  }
  console.log('')
}

const all = [...failures, ...staleWaivers]
if (all.length > 0) {
  console.error(`check-pins: FAILED with ${all.length} violation(s)\n`)
  for (const f of all) console.error(`  ${f}`)
  console.error('\nExact pinning is part of the dependency defence model. See docs/dependency-reviews/README.md.')
  process.exit(1)
}

const pinnedCount = MANIFESTS.reduce((acc, file) => {
  const pkg = JSON.parse(readFileSync(file, 'utf8'))
  return acc + PINNED_SECTIONS.reduce((n, s) => n + Object.values(pkg[s] ?? {}).filter((v) => !PASSTHROUGH.test(v)).length, 0)
}, 0)
console.log(`check-pins: OK — ${pinnedCount} manifest specifiers and ${catalogEntries.size - waivedNames.length} catalog entries exactly pinned`)
