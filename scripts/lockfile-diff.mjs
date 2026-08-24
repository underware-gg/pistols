#!/usr/bin/env node
// Reports what actually entered, left, or moved in the resolved dependency graph,
// comparing pnpm-lock.yaml against a git ref (default HEAD).
//
// This exists because "the pin didn't move anything" is a claim that needs
// evidence. Pinning direct specifiers to their already-resolved versions still
// triggers transitive re-resolution: doing exactly that in this repository
// floated roughly fifteen packages to unreviewed versions (@babel/* 7.28 to
// 7.29, hasown, ufo, a newly-deprecated eslint) on a change whose entire premise
// was zero movement. Nothing surfaced it; it had to be noticed.
//
// usage:
//   node scripts/lockfile-diff.mjs [ref] [--strict]
//     ref       git ref to compare against (default HEAD)
//     --strict  exit 1 if anything entered, left or moved. Use when the change is
//               meant to be resolution-neutral.

import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const args = process.argv.slice(2)
const strict = args.includes('--strict')
const ref = args.find((a) => !a.startsWith('--')) ?? 'HEAD'

// Keys in the `packages:` section are the resolved graph: `'name@version':` or
// `name@version:`, two spaces of indent. Peer-suffixed snapshot keys live in
// `snapshots:` and are deliberately not counted — they restate the same versions.
function parse(text) {
  const versions = new Map()
  let inPackages = false
  for (const line of text.split('\n')) {
    if (/^packages:\s*$/.test(line)) { inPackages = true; continue }
    if (inPackages && line.length > 0 && !/^\s/.test(line)) break
    if (!inPackages) continue
    const m = line.match(/^ {2}'?((?:@[^/]+\/)?[^@'\s]+)@([^'():\s]+)'?:/)
    if (m) {
      const [, name, version] = m
      if (!versions.has(name)) versions.set(name, new Set())
      versions.get(name).add(version)
    }
  }
  return versions
}

let baseText
try {
  baseText = execFileSync('git', ['show', `${ref}:pnpm-lock.yaml`], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 })
} catch {
  console.error(`lockfile-diff: cannot read pnpm-lock.yaml at ${ref}`)
  process.exit(1)
}

const base = parse(baseText)
const head = parse(readFileSync('pnpm-lock.yaml', 'utf8'))
if (base.size === 0 || head.size === 0) {
  console.error('lockfile-diff: parsed zero packages from one side — the lockfile shape changed and this parser needs updating')
  process.exit(1)
}

const names = [...new Set([...base.keys(), ...head.keys()])].sort()
const added = [], removed = [], moved = []
for (const name of names) {
  const b = base.get(name) ?? new Set()
  const h = head.get(name) ?? new Set()
  if (b.size === 0) { added.push(`${name}@${[...h].join(', ')}`); continue }
  if (h.size === 0) { removed.push(`${name}@${[...b].join(', ')}`); continue }
  const gained = [...h].filter((v) => !b.has(v))
  const lost = [...b].filter((v) => !h.has(v))
  if (gained.length || lost.length) moved.push(`${name}: ${[...b].join(',')} -> ${[...h].join(',')}`)
}

const show = (label, list) => {
  if (list.length === 0) return
  console.log(`\n${label} (${list.length}):`)
  for (const line of list) console.log(`  ${line}`)
}
show('ENTERED the graph', added)
show('LEFT the graph', removed)
show('MOVED version', moved)

const total = added.length + removed.length + moved.length
console.log(`\nlockfile-diff: vs ${ref} — ${added.length} entered, ${removed.length} left, ${moved.length} moved (${head.size} packages resolved)`)
if (added.length > 0 || moved.length > 0) {
  console.log('Everything listed under ENTERED or MOVED is a version this repository has not reviewed at that version.')
}
if (strict && total > 0) {
  console.error('\nlockfile-diff: FAILED — --strict was requested and the resolved graph changed')
  process.exit(1)
}
