export function parseCandidateArgs(argv) {
  const candidates = []
  let depth = Infinity
  let depthWasSet = false

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index]
    if (arg === '--depth') {
      if (depthWasSet) throw new Error('--depth may be specified only once')
      const value = argv[++index]
      if (value == null || !/^\d+$/.test(value)) {
        throw new Error('--depth requires a non-negative integer')
      }
      depth = Number(value)
      if (!Number.isSafeInteger(depth)) throw new Error('--depth is too large')
      depthWasSet = true
    } else if (arg.startsWith('--')) {
      throw new Error(`unknown option: ${arg}`)
    } else {
      candidates.push(arg)
    }
  }

  if (candidates.length === 0) throw new Error('at least one name@version candidate is required')
  return { candidates, depth, bounded: depthWasSet }
}

export function readMinimumReleaseAgeMinutes(workspaceText) {
  const match = workspaceText.match(/^minimumReleaseAge:\s*([^#\s]+)\s*(?:#.*)?$/m)
  if (!match || !/^\d+$/.test(match[1])) {
    throw new Error('minimumReleaseAge must be declared as a non-negative integer')
  }
  const minutes = Number(match[1])
  if (!Number.isSafeInteger(minutes)) throw new Error('minimumReleaseAge is too large')
  return minutes
}

export function runtimeDependencies(versionMetadata) {
  const required = Object.entries(versionMetadata.dependencies ?? {})
    .map(([name, range]) => ({ name, range, optional: false }))
  const requiredNames = new Set(required.map(({ name }) => name))
  const optional = Object.entries(versionMetadata.optionalDependencies ?? {})
    .filter(([name]) => !requiredNames.has(name))
    .map(([name, range]) => ({ name, range, optional: true }))
  return [...required, ...optional]
}

export const candidateReviewFailed = ({ problems, uncertain, truncated }) => (
  problems > 0 || uncertain > 0 || truncated > 0
)
