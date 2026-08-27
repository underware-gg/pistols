#!/usr/bin/env node
// Every range in the `peers` catalog must include the version pinned in the
// default catalog.
//
// Splitting our resolution (exact) from the published peer contract (ranged)
// buys the right semantics but costs a guarantee: while both fields read
// `catalog:`, divergence was impossible. Now the peer range can drift to exclude
// the version we actually build and test against, and we would publish a
// contract that excludes our own tree. pnpm does not catch this — a deliberately
// drifted peers range installed cleanly with strictPeerDependencies on.

import { readFileSync } from 'node:fs'

// --- minimal YAML reading for the two catalog blocks ----------------------
const text = readFileSync('pnpm-workspace.yaml', 'utf8').split('\n')

function readFlatBlock(startPattern, indent) {
  const entries = new Map()
  let inside = false
  for (const line of text) {
    if (startPattern.test(line)) { inside = true; continue }
    if (inside) {
      if (line.trim() === '' || line.trim().startsWith('#')) continue
      const depth = line.length - line.trimStart().length
      if (line.length > 0 && depth < indent) break
      if (depth !== indent) continue
      const m = line.trim().match(/^"?([@\w./-]+)"?:\s*(?:"([^"]+)"|([^#\s]+))/)
      if (m) entries.set(m[1], m[2] ?? m[3])
    }
  }
  return entries
}

const defaults = readFlatBlock(/^catalog:\s*$/, 2)
const peers = readFlatBlock(/^ {2}peers:\s*$/, 4)

if (defaults.size === 0) { console.error('check-catalog-drift: parsed zero default catalog entries — failing closed'); process.exit(1) }
if (peers.size === 0) { console.error('check-catalog-drift: parsed zero peers catalog entries — failing closed'); process.exit(1) }

// This check runs before install in CI, so it deliberately has no package
// imports. Peer ranges are repository-controlled and restricted to these forms.
const parse = (version) => {
  const match = String(version).trim().match(/^v?(\d+)\.(\d+)\.(\d+)(?:-([\w.-]+))?$/)
  return match ? { nums: [+match[1], +match[2], +match[3]], pre: match[4] ?? null } : null
}
const compare = (a, b) => {
  for (let i = 0; i < 3; i++) {
    if (a.nums[i] !== b.nums[i]) return a.nums[i] < b.nums[i] ? -1 : 1
  }
  if (a.pre === b.pre) return 0
  if (a.pre === null) return 1
  if (b.pre === null) return -1
  return a.pre < b.pre ? -1 : 1
}
function satisfiesSimplePeerRange(version, range) {
  const target = parse(version)
  if (!target) return null
  const requested = String(range).trim()
  let match
  if ((match = requested.match(/^\^(\d+)\.(\d+)\.(\d+)(?:-[\w.-]+)?$/))) {
    const lower = { nums: [+match[1], +match[2], +match[3]], pre: null }
    if (compare(target, lower) < 0) return false
    if (lower.nums[0] !== 0) return target.nums[0] === lower.nums[0]
    if (lower.nums[1] !== 0) return target.nums[0] === 0 && target.nums[1] === lower.nums[1]
    return target.nums[0] === 0 && target.nums[1] === 0 && target.nums[2] === lower.nums[2]
  }
  if ((match = requested.match(/^~(\d+)\.(\d+)\.(\d+)(?:-[\w.-]+)?$/))) {
    const lower = { nums: [+match[1], +match[2], +match[3]], pre: null }
    return compare(target, lower) >= 0 && target.nums[0] === lower.nums[0] && target.nums[1] === lower.nums[1]
  }
  const exact = parse(requested)
  return exact ? compare(target, exact) === 0 : null
}

function satisfiesPeerRange(version, range) {
  const results = String(range).split('||').map((part) => satisfiesSimplePeerRange(version, part.trim()))
  if (results.some((result) => result === true)) return true
  return results.some((result) => result === null) ? null : false
}

const failures = []
for (const [name, range] of peers) {
  const pinned = defaults.get(name)
  if (!pinned) {
    failures.push(`peers catalog declares "${name}" but the default catalog does not pin it — nothing to check the range against`)
    continue
  }
  const ok = satisfiesPeerRange(pinned, range)
  if (ok === null) failures.push(`${name}: cannot evaluate peer range "${range}" against pinned ${pinned} — express each union member as a caret, tilde or exact version`)
  else if (ok === false) failures.push(`${name}: peer range "${range}" EXCLUDES the pinned ${pinned}. Publishing this advertises a contract that excludes the version we build and test against.`)
}

// A peer contract naming something we do not pin cannot be validated.
const sdkPeers = Object.keys(JSON.parse(readFileSync('sdk/package.json', 'utf8')).peerDependencies ?? {})
for (const name of sdkPeers) {
  if (!peers.has(name)) failures.push(`sdk/package.json declares peer "${name}" but the peers catalog has no entry for it`)
}
for (const name of peers.keys()) {
  if (!sdkPeers.includes(name)) failures.push(`peers catalog has "${name}" but no package declares it as a peer — delete it`)
}

if (failures.length > 0) {
  console.error(`check-catalog-drift: FAILED with ${failures.length} problem(s)\n`)
  for (const f of failures) console.error(`  ${f}`)
  process.exit(1)
}
console.log(`check-catalog-drift: OK — ${peers.size} peer ranges all include their pinned version`)
