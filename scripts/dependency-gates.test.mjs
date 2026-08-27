import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import test from 'node:test'
import { evaluateAdvisories } from './advisory-policy.mjs'
import {
  candidateReviewFailed,
  parseCandidateArgs,
  readMinimumReleaseAgeMinutes,
  runtimeDependencies,
} from './candidate-policy.mjs'
import { packagePairs, parseResolvedPackages } from './lockfile-packages.mjs'
import { REQUIRED_REVIEW_SECTIONS, validateReviewRecord } from './review-record.mjs'

const require = createRequire(import.meta.url)
const { parseWorkspacePackageDirs, readWorkspacePackages } = require('./workspace-manifests.cjs')
const { hooks } = require('../.pnpmfile.cjs')

test('lockfile parsing has one fail-closed interpretation of resolved package keys', () => {
  const parsed = parseResolvedPackages(`lockfileVersion: '9.0'\npackages:\n  '@scope/pkg@1.2.3(peer@4.0.0)': {}\n  plain@2.0.0: {}\nsnapshots:\n`)
  assert.deepEqual(packagePairs(parsed), ['@scope/pkg@1.2.3', 'plain@2.0.0'])
  assert.throws(() => parseResolvedPackages('packages:\n'), /parsed zero packages/)
})

test('candidate policy rejects invalid bounds and fails every incomplete outcome', () => {
  assert.deepEqual(parseCandidateArgs(['pkg@1.0.0']), {
    candidates: ['pkg@1.0.0'],
    depth: Infinity,
    bounded: false,
  })
  assert.deepEqual(parseCandidateArgs(['--depth', '0', 'pkg@1.0.0']), {
    candidates: ['pkg@1.0.0'],
    depth: 0,
    bounded: true,
  })
  for (const args of [
    ['--depth', 'nope', 'pkg@1.0.0'],
    ['--depth', '-1', 'pkg@1.0.0'],
    ['--depth'],
  ]) assert.throws(() => parseCandidateArgs(args), /non-negative integer/)

  assert.equal(readMinimumReleaseAgeMinutes('minimumReleaseAge: 10080'), 10080)
  assert.throws(() => readMinimumReleaseAgeMinutes('minimumReleaseAge: nope'), /non-negative integer/)
  assert.equal(candidateReviewFailed({ problems: 0, uncertain: 1, truncated: 0 }), true)
  assert.equal(candidateReviewFailed({ problems: 0, uncertain: 0, truncated: 1 }), true)
  assert.equal(candidateReviewFailed({ problems: 0, uncertain: 0, truncated: 0 }), false)
})

test('candidate traversal includes optional runtime dependencies without duplicates', () => {
  assert.deepEqual(runtimeDependencies({
    dependencies: { required: '^1', shared: '^2' },
    optionalDependencies: { optional: '^3', shared: '^2' },
  }), [
    { name: 'required', range: '^1', optional: false },
    { name: 'shared', range: '^2', optional: false },
    { name: 'optional', range: '^3', optional: true },
  ])
})

test('advisory acceptances bind exact identity and reviewed metadata', () => {
  const advisory = {
    github_advisory_id: 'GHSA-known',
    module_name: 'elliptic',
    vulnerable_versions: '<=6.6.1',
    severity: 'low',
  }
  const accepted = {
    'GHSA-known': { module: 'elliptic', vulnerable: '<=6.6.1', severity: 'low' },
  }
  assert.equal(evaluateAdvisories([advisory], accepted).matched.length, 1)
  assert.equal(evaluateAdvisories([{ ...advisory, github_advisory_id: 'GHSA-new' }], accepted).unexpected.length, 1)
  const changed = evaluateAdvisories([{ ...advisory, severity: 'critical' }], accepted)
  assert.equal(changed.unexpected.length, 1)
  assert.equal(changed.stale.length, 0)
})

test('workspace discovery is canonical and registry sources cannot use the workspace exemption', () => {
  assert.deepEqual(parseWorkspacePackageDirs('packages:\n  - "sdk"\n  - client\ncatalog:\n'), ['sdk', 'client'])
  assert.throws(() => parseWorkspacePackageDirs('packages:\n  - "packages/*"\n'), /globs are not supported/)
  assert.doesNotThrow(() => hooks.readPackage({ name: '@underware/pistols-sdk', version: '1.3.12' }))
  assert.throws(
    () => hooks.readPackage({ name: '@underware/pistols-sdk', version: '999.0.0' }),
    /BLOCKED/,
  )
  assert.throws(
    () => hooks.afterAllResolved({ packages: { '@underware/pistols-sdk@1.3.12': {} } }),
    /BLOCKED resolved registry package/,
  )

  const root = mkdtempSync(join(tmpdir(), 'pistols-workspaces-'))
  writeFileSync(join(root, 'pnpm-workspace.yaml'), 'packages:\n  - "sdk"\n')
  writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'root', version: '1.0.0' }))
  mkdirSync(join(root, 'sdk'))
  writeFileSync(join(root, 'sdk/package.json'), JSON.stringify({ name: 'sdk', version: '2.0.0' }))
  assert.deepEqual(readWorkspacePackages(root).map(({ name, version }) => `${name}@${version}`), ['root@1.0.0', 'sdk@2.0.0'])
})

test('review records must exist under the review directory and contain the contract', () => {
  const root = mkdtempSync(join(tmpdir(), 'pistols-review-'))
  const recordsDir = join(root, 'docs/dependency-reviews')
  mkdirSync(recordsDir, { recursive: true })
  const record = REQUIRED_REVIEW_SECTIONS.map((section) => `## ${section}\n\nRecorded.`).join('\n\n')
  writeFileSync(join(recordsDir, 'complete.md'), record)
  writeFileSync(join(recordsDir, 'incomplete.md'), '## Summary\n')

  assert.equal(validateReviewRecord('docs/dependency-reviews/complete.md', root), 'docs/dependency-reviews/complete.md')
  assert.throws(() => validateReviewRecord('docs/dependency-reviews/incomplete.md', root), /missing sections/)
  assert.throws(() => validateReviewRecord('../outside.md', root), /under docs\/dependency-reviews/)
})
