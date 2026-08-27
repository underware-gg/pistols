const PACKAGE_KEY = /^'?((?:@[^/]+\/)?[^@'\s]+)@([^'():\s]+)(?:\(.*\))*'?$/

function parsePackageKey(key) {
  const match = key.match(PACKAGE_KEY)
  return match ? { name: match[1], version: match[2] } : null
}

function parseResolvedPackages(text) {
  const versions = new Map()
  let inPackages = false

  for (const line of text.split('\n')) {
    if (/^packages:\s*$/.test(line)) {
      inPackages = true
      continue
    }
    if (inPackages && line.length > 0 && !/^\s/.test(line)) break
    if (!inPackages) continue

    const lineMatch = line.match(/^ {2}(\S.*):(?:\s.*)?$/)
    const parsed = lineMatch ? parsePackageKey(lineMatch[1]) : null
    if (!parsed) continue
    if (!versions.has(parsed.name)) versions.set(parsed.name, new Set())
    versions.get(parsed.name).add(parsed.version)
  }

  if (versions.size === 0) {
    throw new Error('parsed zero packages from pnpm-lock.yaml; the lockfile shape changed')
  }
  return versions
}

const packagePair = (name, version) => `${name}@${version}`

function packagePairs(packages) {
  return [...packages.entries()]
    .flatMap(([name, versions]) => [...versions].map((version) => packagePair(name, version)))
    .sort()
}

module.exports = { packagePair, packagePairs, parsePackageKey, parseResolvedPackages }
