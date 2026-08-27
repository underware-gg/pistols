import { readFileSync } from 'node:fs'
import { relative, resolve, sep } from 'node:path'

export const REQUIRED_REVIEW_SECTIONS = [
  'Summary',
  'Classification',
  'Targets',
  'Release Age',
  'Advisory Review',
  'Source / Upstream Review',
  'Lifecycle Scripts',
  'Commands Run',
  'Outcome',
  'Follow-ups',
]

export function validateReviewRecord(record, repoRoot = process.cwd()) {
  if (!record) throw new Error('a review record path is required')
  const root = resolve(repoRoot)
  const recordsRoot = resolve(root, 'docs/dependency-reviews')
  const recordPath = resolve(root, record)
  const insideRecords = recordPath.startsWith(`${recordsRoot}${sep}`)
  if (!insideRecords || !recordPath.endsWith('.md')) {
    throw new Error('review record must be a Markdown file under docs/dependency-reviews')
  }

  const text = readFileSync(recordPath, 'utf8')
  const missing = REQUIRED_REVIEW_SECTIONS.filter((section) => (
    !new RegExp(`^## ${section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'm').test(text)
  ))
  if (missing.length > 0) throw new Error(`review record is missing sections: ${missing.join(', ')}`)
  return relative(root, recordPath).split(sep).join('/')
}
