import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const lockfilePackages = require('./lockfile-packages.cjs')

export const {
  packagePair,
  packagePairs,
  parsePackageKey,
  parseResolvedPackages,
} = lockfilePackages
