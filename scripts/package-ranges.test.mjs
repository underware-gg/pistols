import assert from 'node:assert/strict'
import test from 'node:test'
import {
  isExactVersion,
  resolveDependencyAlias,
  resolvePublishedVersion,
  satisfiesVersion,
} from './package-ranges.mjs'

test('satisfiesVersion handles npm ranges without turning uncertainty into false', () => {
  const cases = [
    ['3.25.76', '^3.25.0 || ^4.0.0', true],
    ['2.5.0', '^3.0.0 || ^2', true],
    ['2.5.0', '^2 || workspace:*', true],
    ['2.5.0', '^3 || workspace:*', null],
    ['2.5.0', '^3 || ^4', false],
    ['22.18.8', '>=20.0.0', true],
    ['5.0.0', '>=4.8.4 <6.1.0', true],
    ['0.2.4', '^0.2.3', true],
    ['2.0.0', '~1.9.0', false],
    ['2.0.0', 'latest', null],
    ['2.0.0', 'workspace:*', null],
  ]
  for (const [version, range, expected] of cases) {
    assert.equal(satisfiesVersion(version, range), expected, `${version} against ${range}`)
  }
})

test('advisory comparator ranges accept comma separators', () => {
  assert.equal(satisfiesVersion('1.5.0', '>=1.0.0, <2.0.0'), true)
  assert.equal(satisfiesVersion('2.0.0', '>=1.0.0, <2.0.0'), false)
})

test('exact-version recognition is anchored to the entire spec', () => {
  assert.equal(isExactVersion('1.2.3'), true)
  assert.equal(isExactVersion('1.2.3 || 2.0.0'), false)
  assert.equal(isExactVersion('1.2.3 - 2.0.0'), false)
})

test('published versions resolve tags separately from semver ranges', () => {
  const metadata = {
    'dist-tags': { latest: '3.0.0' },
    versions: { '1.0.0': {}, '2.4.0': {}, '2.5.0': {}, '3.0.0': {} },
  }
  assert.deepEqual(resolvePublishedVersion(metadata, 'latest'), { version: '3.0.0', kind: 'tag' })
  assert.deepEqual(resolvePublishedVersion(metadata, '^2.0.0'), { version: '2.5.0', kind: 'range' })
  assert.deepEqual(resolvePublishedVersion(metadata, '1.0.0'), { version: '1.0.0', kind: 'exact' })
})

test('npm aliases resolve to their real scoped and unscoped packages', () => {
  assert.deepEqual(resolveDependencyAlias('react-is-18', 'npm:react-is@^18.3.1'), {
    name: 'react-is',
    range: '^18.3.1',
  })
  assert.deepEqual(resolveDependencyAlias('local', 'npm:@scope/package@~2.0.0'), {
    name: '@scope/package',
    range: '~2.0.0',
  })
})
