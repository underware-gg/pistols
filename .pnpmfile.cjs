// Fail-closed resolution gate.
//
// pnpm calls readPackage for every package it resolves. Throwing here aborts the
// install during resolveDependency — before the tarball is fetched — so an
// unreviewed package never reaches this machine's store, let alone node_modules.
// That is the difference between a policy that documents review and one that
// enforces it: every other gate in scripts/ runs after the fact.
//
// The permitted set is scripts/reviewed-packages.json. See that file for the
// honest status of its bootstrap.
//
// Escape hatch, for recovery only:
//   PISTOLS_ALLOW_UNREVIEWED=1 pnpm install
// Using it means unreviewed code may be fetched. Record the reason.

const { readFileSync } = require('node:fs')
const { join } = require('node:path')

const BYPASS = process.env.PISTOLS_ALLOW_UNREVIEWED === '1'
let reviewed = null
let loadError = null
let workspaceNames = null

// Our own workspace packages have a name and version but no registry identity,
// so there is nothing to review and they must not be blocked. Read them from the
// workspace file rather than hardcoding, so adding a member cannot break installs.
function isWorkspacePackage(name) {
  if (!workspaceNames) {
    workspaceNames = new Set()
    const readName = (dir) => {
      try {
        workspaceNames.add(JSON.parse(readFileSync(join(__dirname, dir, 'package.json'), 'utf8')).name)
      } catch {
        /* a listed member without a manifest is not our concern here */
      }
    }
    readName('.')
    const yaml = readFileSync(join(__dirname, 'pnpm-workspace.yaml'), 'utf8')
    const block = yaml.match(/^packages:\n([\s\S]*?)(?=^\S)/m)
    if (block) {
      for (const line of block[1].split('\n')) {
        const m = line.match(/^\s*-\s*["']?([^"'#\s]+)["']?/)
        if (m) readName(m[1])
      }
    }
  }
  return workspaceNames.has(name)
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
  // Workspace packages have no registry identity to review.
  if (!pkg.name || !pkg.version) return pkg
  if (isWorkspacePackage(pkg.name)) return pkg

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

module.exports = { hooks: { readPackage } }
