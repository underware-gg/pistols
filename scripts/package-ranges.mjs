import semver from 'semver'

const normalizeRange = (range) => String(range).replaceAll(',', ' ').trim()

export function satisfiesVersion(version, range) {
  if (!semver.valid(version)) return null
  const normalized = normalizeRange(range)
  if (normalized.includes('||')) {
    const results = normalized.split('||').map((branch) => satisfiesVersion(version, branch))
    if (results.some((result) => result === true)) return true
    if (results.every((result) => result === false)) return false
    return null
  }
  if (!semver.validRange(normalized)) return null
  return semver.satisfies(version, normalized)
}

export function isExactVersion(spec) {
  return semver.valid(String(spec).trim()) !== null
}

export function resolvePublishedVersion(metadata, spec) {
  const requested = String(spec).trim()
  const tagged = metadata['dist-tags']?.[requested]
  if (tagged) return { version: tagged, kind: 'tag' }

  const exact = semver.valid(requested)
  if (exact) return { version: exact, kind: 'exact' }

  const range = normalizeRange(requested)
  if (!semver.validRange(range)) return null
  const version = semver.maxSatisfying(Object.keys(metadata.versions ?? {}), range)
  return version ? { version, kind: 'range' } : null
}

export function resolveDependencyAlias(declaredName, declaredRange) {
  if (typeof declaredRange !== 'string' || !declaredRange.startsWith('npm:')) {
    return { name: declaredName, range: declaredRange }
  }

  const target = declaredRange.slice(4)
  const at = target.lastIndexOf('@')
  return at > 0
    ? { name: target.slice(0, at), range: target.slice(at + 1) }
    : { name: target, range: '*' }
}
