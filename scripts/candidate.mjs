#!/usr/bin/env node
// Gathers the evidence that docs/dependency-reviews/README.md requires BEFORE a
// candidate is allowed near a manifest. Read-only: touches no manifest, writes no
// lockfile, installs nothing.
//
// This exists because doing the review properly was roughly eight manual
// commands across `npm view` and `gh api`, and that friction is why it got
// skipped — ten transitive packages were installed here and audited afterwards.
// The correct order has to be the easy order.
//
// usage:
//   node scripts/candidate.mjs <pkg>@<version> [<pkg>@<version> ...]
//   node scripts/candidate.mjs --depth 2 <pkg>@<version>
//
// Reports, for the candidate and for every package it would newly bring in:
//   publish age against minimumReleaseAge · deprecation · install scripts
//   dependencies · peers split into required and optional · advisories, with the
//   target version checked against every advisory range for that package

import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const argv = process.argv.slice(2)
let depth = 3
const depthAt = argv.indexOf('--depth')
if (depthAt !== -1) { depth = Number(argv[depthAt + 1]); argv.splice(depthAt, 2) }
if (argv.length === 0) {
  console.error('usage: node scripts/candidate.mjs <pkg>@<version> [...]  [--depth N]')
  process.exit(2)
}

// --- policy: the age gate we must clear -----------------------------------
const workspace = readFileSync('pnpm-workspace.yaml', 'utf8')
const minAgeMinutes = Number(workspace.match(/^minimumReleaseAge:\s*(\d+)/m)?.[1] ?? 0)
const minAgeDays = minAgeMinutes / 1440

// --- what is already in our tree -----------------------------------------
const installed = new Map()
{
  let inPackages = false
  for (const line of readFileSync('pnpm-lock.yaml', 'utf8').split('\n')) {
    if (/^packages:\s*$/.test(line)) { inPackages = true; continue }
    if (inPackages && line.length > 0 && !/^\s/.test(line)) break
    if (!inPackages) continue
    const m = line.match(/^ {2}'?((?:@[^/]+\/)?[^@'\s]+)@([^'():\s]+)'?:/)
    if (m) {
      if (!installed.has(m[1])) installed.set(m[1], new Set())
      installed.get(m[1]).add(m[2])
    }
  }
}

// --- registry -------------------------------------------------------------
const metaCache = new Map()
async function meta(name) {
  if (metaCache.has(name)) return metaCache.get(name)
  const res = await fetch(`https://registry.npmjs.org/${name.replace('/', '%2F')}`)
  if (!res.ok) throw new Error(`registry ${res.status} for ${name}`)
  const json = await res.json()
  metaCache.set(name, json)
  return json
}

// --- advisories -----------------------------------------------------------
const advCache = new Map()
function advisories(name) {
  if (advCache.has(name)) return advCache.get(name)
  let out
  try {
    out = execFileSync('gh', ['api', `advisories?ecosystem=npm&affects=${name}&per_page=100`], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] })
  } catch {
    advCache.set(name, null)   // null = could not determine; fail closed
    return null
  }
  const list = JSON.parse(out).flatMap((a) =>
    (a.vulnerabilities ?? [])
      .filter((v) => v.package?.name === name)
      .map((v) => ({ ghsa: a.ghsa_id, severity: a.severity, summary: a.summary, range: v.vulnerable_version_range, patched: v.first_patched_version })))
  advCache.set(name, list)
  return list
}

// --- semver: enough to evaluate advisory ranges, honest when unsure -------
const parse = (v) => {
  const m = String(v).trim().match(/^v?(\d+)\.(\d+)\.(\d+)(?:-([\w.-]+))?/)
  return m ? { nums: [+m[1], +m[2], +m[3]], pre: m[4] ?? null } : null
}
const cmp = (a, b) => {
  for (let i = 0; i < 3; i++) if (a.nums[i] !== b.nums[i]) return a.nums[i] < b.nums[i] ? -1 : 1
  if (a.pre === b.pre) return 0
  if (a.pre === null) return 1        // release > prerelease
  if (b.pre === null) return -1
  return a.pre < b.pre ? -1 : 1
}
// Returns true / false / null (null = could not evaluate; treat as "check by hand")
function inRange(version, range) {
  const target = parse(version)
  if (!target || !range) return null
  for (const clause of String(range).split(',')) {
    const m = clause.trim().match(/^(>=|<=|>|<|=)?\s*v?([\w.+-]+)$/)
    if (!m) return null
    const bound = parse(m[2])
    if (!bound) return null
    const c = cmp(target, bound)
    const op = m[1] ?? '='
    const ok = op === '>=' ? c >= 0 : op === '<=' ? c <= 0 : op === '>' ? c > 0 : op === '<' ? c < 0 : c === 0
    if (!ok) return false
  }
  return true
}

// Does an installed version satisfy a declared range? Returns true / false /
// null, where null means "could not evaluate" and is treated as NOT satisfied,
// because assuming satisfaction is how an unreviewed version slips through.
function satisfies(version, range) {
  const v = parse(version)
  if (!v) return null
  const r = String(range).trim()
  let m
  if ((m = r.match(/^\^(\d+)\.(\d+)\.(\d+)$/))) {
    const b = { nums: [+m[1], +m[2], +m[3]], pre: null }
    if (cmp(v, b) < 0) return false
    // Caret pins the leftmost non-zero component.
    if (b.nums[0] !== 0) return v.nums[0] === b.nums[0]
    if (b.nums[1] !== 0) return v.nums[0] === 0 && v.nums[1] === b.nums[1]
    return v.nums[0] === 0 && v.nums[1] === 0 && v.nums[2] === b.nums[2]
  }
  if ((m = r.match(/^~(\d+)\.(\d+)\.(\d+)$/))) {
    const b = { nums: [+m[1], +m[2], +m[3]], pre: null }
    if (cmp(v, b) < 0) return false
    return v.nums[0] === b.nums[0] && v.nums[1] === b.nums[1]
  }
  if (/^\d/.test(r)) { const b = parse(r); return b ? cmp(v, b) === 0 : null }
  return null
}

// --- report ---------------------------------------------------------------
let problems = 0, uncertain = 0
const seen = new Set()
const queue = argv.map((spec) => {
  const at = spec.lastIndexOf('@')
  if (at <= 0) { console.error(`candidate: "${spec}" must be name@version`); process.exit(2) }
  return { name: spec.slice(0, at), version: spec.slice(at + 1), level: 0, via: '(requested)' }
})

while (queue.length > 0) {
  const { name, version, level, via } = queue.shift()
  const key = `${name}@${version}`
  if (seen.has(key)) continue
  seen.add(key)

  const already = installed.get(name)?.has(version)
  const indent = '  '.repeat(level)
  console.log(`\n${indent}${'='.repeat(60 - level * 2)}`)
  console.log(`${indent}${key}${already ? '   [already in tree at this version]' : ''}`)
  if (level > 0) console.log(`${indent}  brought in by: ${via}`)

  let m
  try { m = await meta(name) } catch (e) { console.log(`${indent}  REGISTRY ERROR: ${e.message} — failing closed`); problems++; continue }
  const v = m.versions?.[version]
  if (!v) { console.log(`${indent}  NOT PUBLISHED: no such version`); problems++; continue }

  // age
  const published = m.time?.[version]
  if (!published) {
    console.log(`${indent}  publish time: MISSING from registry metadata — this is what minimumReleaseAgeIgnoreMissingTime:false exists to block`)
    problems++
  } else {
    const days = (Date.now() - Date.parse(published)) / 86400000
    const pass = days >= minAgeDays
    console.log(`${indent}  published: ${published.slice(0, 10)} (${Math.floor(days)}d) — age gate ${minAgeDays}d: ${pass ? 'PASS' : 'FAIL'}`)
    if (!pass) problems++
  }

  if (m.versions[version].deprecated) { console.log(`${indent}  DEPRECATED: ${v.deprecated}`); problems++ }

  const scripts = Object.entries(v.scripts ?? {}).filter(([k]) => ['preinstall', 'install', 'postinstall'].includes(k))
  console.log(`${indent}  install scripts: ${scripts.length === 0 ? 'none' : scripts.map(([k, s]) => `${k}: ${s}`).join(' | ') + '  <-- needs an allowBuilds decision'}`)
  if (scripts.length > 0) problems++

  // peers, split — the distinction that matters under autoInstallPeers:false
  const peers = Object.entries(v.peerDependencies ?? {})
  if (peers.length > 0) {
    const optional = new Set(Object.entries(v.peerDependenciesMeta ?? {}).filter(([, x]) => x?.optional).map(([k]) => k))
    const required = peers.filter(([p]) => !optional.has(p))
    console.log(`${indent}  peers REQUIRED (must be declared by us): ${required.length === 0 ? 'none' : required.map(([p, r]) => `${p}@${r}`).join(', ')}`)
    console.log(`${indent}  peers optional (never installed under autoInstallPeers:false): ${optional.size === 0 ? 'none' : [...optional].join(', ')}`)
  }

  // advisories for this package, every range checked against this version
  const advs = advisories(name)
  if (advs === null) {
    console.log(`${indent}  advisories: COULD NOT DETERMINE (gh unavailable) — failing closed`)
    problems++
  } else if (advs.length === 0) {
    console.log(`${indent}  advisories: none`)
  } else {
    const hits = [], unsure = []
    for (const a of advs) {
      const r = inRange(version, a.range)
      if (r === true) hits.push(a)
      else if (r === null) unsure.push(a)
    }
    console.log(`${indent}  advisories: ${advs.length} for this package; ${hits.length} affect ${version}${unsure.length ? `, ${unsure.length} unevaluable` : ''}`)
    for (const a of hits) {
      console.log(`${indent}    AFFECTED  ${a.severity}  ${a.range}  patched: ${a.patched ?? 'none'}  ${a.ghsa}`)
      console.log(`${indent}              ${a.summary}`)
      problems++
    }
    for (const a of unsure) {
      console.log(`${indent}    CHECK BY HAND  ${a.severity}  range "${a.range}"  ${a.ghsa}`)
      uncertain++
    }
  }

  // recurse into what this would newly bring in
  if (level < depth) {
    for (const [dep, range] of Object.entries(v.dependencies ?? {})) {
      let dm
      try { dm = await meta(dep) } catch { console.log(`${indent}  (could not resolve ${dep})`); problems++; continue }
      // An exact range is resolved exactly. Anything else is SUBSTITUTED with the
      // latest published version, which is not necessarily what pnpm would pick
      // and is often newer than the age gate admits. Say so, so a reader can see
      // the substitution rather than trusting a row that may not be reachable.
      const exact = parse(range) && /^\d/.test(range) ? range : null
      const target = exact ?? dm['dist-tags']?.latest
      // Presence of the NAME in our tree is not satisfaction of the RANGE. A
      // declared ^6.0.0 against an installed 7.0.0 means pnpm fetches a new 6.x
      // that nothing has reviewed. Checking the name alone hid exactly that.
      const present = [...(installed.get(dep) ?? [])]
      const satisfied = present.filter((pv) => satisfies(pv, range) === true)
      if (satisfied.length > 0) {
        console.log(`${indent}  dep ${dep}@${range} — satisfied by ${satisfied.join(', ')} already in tree`)
      } else {
        const why = present.length > 0
          ? ` [in tree at ${present.join(', ')}, which does NOT satisfy "${range}"]`
          : ''
        const sub = exact ? '' : ` [SUBSTITUTED: declared "${range}", examining dist-tags.latest; pnpm may resolve otherwise]`
        queue.push({ name: dep, version: target, level: level + 1, via: `${key} -> ${dep}@${range}${why}${sub}` })
      }
    }
  }
}

console.log(`\n${'='.repeat(60)}`)
console.log(`candidate: ${seen.size} package(s) examined, ${problems} item(s) needing a decision, ${uncertain} needing manual range checks`)
console.log('Nothing was installed. Record the review before changing any manifest.')
if (problems > 0) process.exit(1)
