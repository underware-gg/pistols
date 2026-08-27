// Fail-closed resolution gate.
//
// pnpm calls readPackage for every package it resolves. Throwing there aborts
// during resolveDependency. afterAllResolved then validates the source-aware
// registry package list, closing readPackage's inability to distinguish linked
// workspaces from a registry package with the same manifest identity.
//
// The permitted set is scripts/reviewed-packages.json. See that file for the
// honest status of its bootstrap.
//
// Escape hatch, for recovery only:
//   PISTOLS_ALLOW_UNREVIEWED=1 pnpm install
// Using it means unreviewed code may be fetched. Record the reason.

const { readFileSync } = require('node:fs')
const { join } = require('node:path')
const { parsePackageKey } = require('./scripts/lockfile-packages.cjs')
const { readWorkspacePackages } = require('./scripts/workspace-manifests.cjs')

const BYPASS = process.env.PISTOLS_ALLOW_UNREVIEWED === '1'
let reviewed = null
let loadError = null
let workspaceVersions = null

function isWorkspacePackage(name, version) {
  if (!workspaceVersions) {
    workspaceVersions = new Map(
      readWorkspacePackages(__dirname).map((pkg) => [pkg.name, pkg.version]),
    )
  }
  return workspaceVersions.get(name) === version
}

function permitted() {
  if (reviewed || loadError) return reviewed
  try {
    const raw = readFileSync(join(__dirname, 'scripts', 'reviewed-packages.json'), 'utf8')
    const parsed = JSON.parse(raw).packages || {}
    if (Object.keys(parsed).length === 0) throw new Error('reviewed set is empty')
    reviewed = parsed
  } catch (error) {
    loadError = error
    // Fail closed: an unreadable or empty allowlist must not read as "allow all".
    throw new Error(
      `[pistols] cannot read scripts/reviewed-packages.json (${error.message}). ` +
      'Resolution is blocked rather than allowed. Restore the file, or set ' +
      'PISTOLS_ALLOW_UNREVIEWED=1 to bypass and record why.'
    )
  }
  return reviewed
}

function readPackage(pkg, context) {
  if (BYPASS) return pkg
  if (!pkg.name || !pkg.version) return pkg
  // readPackage exposes no source path, so this identity match alone cannot
  // distinguish a linked workspace manifest from a registry spoof. The
  // source-aware afterAllResolved hook below is the mandatory backstop.
  if (isWorkspacePackage(pkg.name, pkg.version)) return pkg

  const allowed = permitted()[pkg.name]
  if (allowed && allowed.includes(pkg.version)) return pkg

  const known = allowed ? ` Reviewed versions of ${pkg.name}: ${allowed.join(', ')}.` : ` ${pkg.name} has never been reviewed at any version.`
  const message =
    `[pistols] BLOCKED: ${pkg.name}@${pkg.version} is not in the reviewed set.${known}\n` +
    '  Nothing has been fetched. Review it first:\n' +
    `    node scripts/candidate.mjs ${pkg.name}@${pkg.version}\n` +
    '  Then write a record under docs/dependency-reviews/ and regenerate:\n' +
    '    node scripts/generate-reviewed-set.mjs --record docs/dependency-reviews/<file>.md\n' +
    '  See docs/dependency-reviews/README.md, "Order of operations".'
  if (context && typeof context.log === 'function') context.log(message)
  throw new Error(message)
}

function afterAllResolved(lockfile) {
  if (BYPASS) return lockfile
  const packageKeys = Object.keys(lockfile.packages ?? {})
  if (packageKeys.length === 0) {
    throw new Error('[pistols] resolved lockfile contains no registry packages; failing closed because its shape may have changed')
  }

  for (const key of packageKeys) {
    const parsed = parsePackageKey(key)
    if (!parsed) throw new Error(`[pistols] cannot parse resolved registry package key "${key}"; failing closed`)
    const allowed = permitted()[parsed.name]
    if (!allowed?.includes(parsed.version)) {
      throw new Error(
        `[pistols] BLOCKED resolved registry package: ${parsed.name}@${parsed.version} is not in the reviewed set. ` +
        'Linked workspaces do not appear in lockfile.packages, so no workspace-name exemption applies here.'
      )
    }
  }
  return lockfile
}

module.exports = { hooks: { afterAllResolved, readPackage } }
