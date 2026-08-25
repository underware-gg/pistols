#!/usr/bin/env node
// Asserts the pnpm actually running is the version package.json pins.
//
// This replaces `packageManagerStrictVersion`, which was carried in
// pnpm-workspace.yaml as if it were a control and could not be shown to be one:
// absent from pnpm's settings reference, zero hits in a code search of
// pnpm/pnpm, no behavioural difference across four configurations with it both
// true and false, and indistinguishable from a fabricated key by every test
// available — `pnpm config get` echoes any key in the file, and pnpm exports any
// key as an npm_config_* env var, including `totallyFakeSettingXyz`.
//
// It was also redundant. pnpm's own launcher honours the packageManager field:
// in a directory pinning 10.20.0, `pnpm --version` reports 10.20.0, and a pin
// that cannot be satisfied exits non-zero. The guarantee comes from there. This
// script turns that implicit behaviour into an assertion we own and can test,
// which is what the setting was pretending to be.

import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const pinned = JSON.parse(readFileSync('package.json', 'utf8')).packageManager
if (!pinned) {
  console.error('check-package-manager: package.json has no packageManager field — failing closed')
  process.exit(1)
}
const match = pinned.match(/^pnpm@(\d+\.\d+\.\d+)$/)
if (!match) {
  console.error(`check-package-manager: packageManager "${pinned}" is not an exact pnpm@x.y.z pin`)
  process.exit(1)
}
const want = match[1]

let running
try {
  running = execFileSync('pnpm', ['--version'], { encoding: 'utf8' }).trim()
} catch (error) {
  console.error(`check-package-manager: could not run pnpm --version (${error.message}) — failing closed`)
  process.exit(1)
}

if (running !== want) {
  console.error(`check-package-manager: FAILED — package.json pins pnpm@${want} but pnpm ${running} is running.`)
  console.error('Let pnpm honour the packageManager field (run pnpm from the repo root), or update the pin deliberately.')
  process.exit(1)
}
console.log(`check-package-manager: OK — pnpm ${running} matches the pinned pnpm@${want}`)
