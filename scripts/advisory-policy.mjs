const advisoryId = (advisory) => advisory.github_advisory_id ?? advisory.id?.toString()

export function evaluateAdvisories(advisories, accepted) {
  const unexpected = []
  const seen = new Set()
  const matched = []

  for (const advisory of advisories) {
    const id = advisoryId(advisory)
    if (id) seen.add(id)
    const acceptance = id ? accepted[id] : undefined
    if (!acceptance ||
        acceptance.module !== advisory.module_name ||
        acceptance.vulnerable !== advisory.vulnerable_versions ||
        acceptance.severity !== advisory.severity) {
      unexpected.push(advisory)
      continue
    }
    matched.push({ id, advisory, acceptance })
  }

  const stale = Object.keys(accepted).filter((id) => !seen.has(id))
  return { unexpected, stale, matched }
}

export const getAdvisoryId = advisoryId
