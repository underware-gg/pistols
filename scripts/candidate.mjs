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
import {
  resolveDependencyAlias,
  resolvePublishedVersion,
  satisfiesVersion,
} from './package-ranges.mjs'
import { parseResolvedPackages } from './lockfile-packages.mjs'
import {
  candidateReviewFailed,
  parseCandidateArgs,
  readMinimumReleaseAgeMinutes,
  runtimeDependencies,
} from './candidate-policy.mjs'

let parsedArgs
try {
  parsedArgs = parseCandidateArgs(process.argv.slice(2))
} catch (error) {
  console.error(`candidate: ${error.message}`)
  console.error('usage: node scripts/candidate.mjs <pkg>@<version> [...]  [--depth N]')
  process.exit(2)
}
const { candidates, depth, bounded } = parsedArgs

// --- policy: the age gate we must clear -----------------------------------
const workspace = readFileSync('pnpm-workspace.yaml', 'utf8')
let minAgeMinutes
try {
  minAgeMinutes = readMinimumReleaseAgeMinutes(workspace)
} catch (error) {
  console.error(`candidate: ${error.message} — failing closed`)
  process.exit(2)
}
const minAgeDays = minAgeMinutes / 1440

// --- what is already in our tree -----------------------------------------
let installed
try {
  installed = parseResolvedPackages(readFileSync('pnpm-lock.yaml', 'utf8'))
} catch (error) {
  console.error(`candidate: ${error.message} — failing closed`)
  process.exit(2)
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

// --- report ---------------------------------------------------------------
let problems = 0, uncertain = 0, truncated = 0
const seen = new Set()
const queue = candidates.map((spec) => {
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
  console.log(`\n${indent}${'='.repeat(Math.max(1, 60 - level * 2))}`)
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
      const r = satisfiesVersion(version, a.range)
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

  // Recurse into every runtime arrival. A bounded review is a diagnostic preview,
  // not an approval: if it hides children, the command exits non-zero below.
  const dependencies = runtimeDependencies(v)
  if (level >= depth) {
    if (bounded && dependencies.length > 0) {
      console.log(`${indent}  INCOMPLETE: depth ${depth} hides ${dependencies.length} runtime dependenc${dependencies.length === 1 ? 'y' : 'ies'}`)
      truncated += dependencies.length
    }
  } else {
    for (const { name: declaredName, range: declaredRange, optional } of dependencies) {
      // An npm alias - "react-is-18": "npm:react-is@^18.3.1" - names the local
      // key, not the package. Reading the key as a package name fetched a
      // DIFFERENT, squatted package called react-is-18 whose preinstall is
      // `echo This package is not installable && exit 1`, and reported that as a
      // finding against our tree. The alias target is the real dependency.
      const { name: dep, range } = resolveDependencyAlias(declaredName, declaredRange)
      let dm
      try { dm = await meta(dep) } catch { console.log(`${indent}  (could not resolve ${dep})`); problems++; continue }
      const resolution = resolvePublishedVersion(dm, range)
      if (!resolution) {
        console.log(`${indent}  (could not resolve ${dep}@${range} to a published version — failing closed)`)
        problems++
        continue
      }
      const target = resolution.version
      // Presence of the NAME in our tree is not satisfaction of the RANGE. A
      // declared ^6.0.0 against an installed 7.0.0 means pnpm fetches a new 6.x
      // that nothing has reviewed. Checking the name alone hid exactly that.
      const present = [...(installed.get(dep) ?? [])]
      const verdicts = present.map((pv) => (
        resolution.kind === 'tag' ? pv === target : satisfiesVersion(pv, range)
      ))
      const satisfied = present.filter((pv, i) => verdicts[i] === true)
      if (satisfied.length > 0) {
        console.log(`${indent}  ${optional ? 'optional dep' : 'dep'} ${dep}@${range}${dep === declaredName ? '' : ` (alias ${declaredName})`} — satisfied by ${satisfied.join(', ')} already in tree`)
      } else {
        // "cannot evaluate" is not "does not satisfy". Both are still treated as
        // unsatisfied, because assuming satisfaction is how something unreviewed
        // gets through — but the report must not claim more than it knows.
        const unevaluable = present.length > 0 && verdicts.every((x) => x === null)
        const why = present.length === 0
          ? ''
          : unevaluable
            ? ` [in tree at ${present.join(', ')}; could NOT evaluate against "${range}" — check by hand]`
            : ` [in tree at ${present.join(', ')}, which does NOT satisfy "${range}"]`
        const resolved = resolution.kind === 'exact'
          ? ''
          : ` [RESOLVED ${resolution.kind}: declared "${range}", examining ${target}]`
        queue.push({ name: dep, version: target, level: level + 1, via: `${key} -> ${dep}@${range}${why}${resolved}` })
      }
    }
  }
}

console.log(`\n${'='.repeat(60)}`)
console.log(`candidate: ${seen.size} package(s) examined, ${problems} item(s) needing a decision, ${uncertain} needing manual range checks, ${truncated} hidden by a depth limit`)
console.log('Nothing was installed. Record the review before changing any manifest.')
if (candidateReviewFailed({ problems, uncertain, truncated })) process.exit(1)
