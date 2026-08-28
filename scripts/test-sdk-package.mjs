import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sdkRoot = join(repoRoot, 'sdk')
const fixtureRoot = mkdtempSync(join(tmpdir(), 'pistols-sdk-consumer-'))

const run = (command, args, cwd = repoRoot) => execFileSync(command, args, {
  cwd,
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
})

const readCatalog = () => {
  const lines = readFileSync(join(repoRoot, 'pnpm-workspace.yaml'), 'utf8').split('\n')
  const catalog = new Map()
  let inCatalog = false

  for (const line of lines) {
    if (line === 'catalog:') {
      inCatalog = true
      continue
    }
    if (inCatalog && /^\S/.test(line)) break
    if (!inCatalog) continue

    const match = line.match(/^  ("[^"]+"|[^:#][^:]*):\s*(\S.*)$/)
    if (!match) continue
    const name = match[1].replace(/^"|"$/g, '')
    const version = match[2].replace(/^"|"$/g, '')
    catalog.set(name, version)
  }

  return catalog
}

const collectVersions = (node, packageName, versions = new Set()) => {
  if (!node || typeof node !== 'object') return versions
  for (const [name, dependency] of Object.entries(node.dependencies ?? {})) {
    if (name === packageName && dependency?.version) versions.add(dependency.version)
    collectVersions(dependency, packageName, versions)
  }
  return versions
}

try {
  run('pnpm', ['build'], sdkRoot)
  run('pnpm', ['pack', '--pack-destination', fixtureRoot], sdkRoot)

  const tarball = readdirSync(fixtureRoot).find((name) => name.endsWith('.tgz'))
  if (!tarball) throw new Error('pnpm pack did not create an SDK tarball')

  const sdkPackage = JSON.parse(readFileSync(join(sdkRoot, 'package.json'), 'utf8'))
  const catalog = readCatalog()
  const peerDependencies = Object.fromEntries(
    Object.keys(sdkPackage.peerDependencies).map((name) => {
      const version = catalog.get(name)
      if (!version) throw new Error(`No exact catalog pin for SDK peer ${name}`)
      return [name, version]
    }),
  )

  const fixturePackage = {
    name: 'pistols-sdk-consumer-smoke',
    private: true,
    type: 'module',
    dependencies: {
      '@underware/pistols-sdk': pathToFileURL(join(fixtureRoot, tarball)).href,
      ...peerDependencies,
    },
    devDependencies: {
      typescript: catalog.get('typescript'),
    },
    pnpm: {
      overrides: {
        '@starknet-start/providers>starknet': '10.0.2',
      },
      peerDependencyRules: {
        allowedVersions: {
          '@starknet-start/query>starknet': '10.0.2',
        },
      },
    },
  }

  writeFileSync(join(fixtureRoot, 'package.json'), `${JSON.stringify(fixturePackage, null, 2)}\n`)
  writeFileSync(join(fixtureRoot, 'tsconfig.json'), `${JSON.stringify({
    compilerOptions: {
      module: 'esnext',
      moduleResolution: 'bundler',
      target: 'esnext',
      strict: true,
      skipLibCheck: true,
      jsx: 'react-jsx',
    },
    include: ['smoke.ts'],
  }, null, 2)}\n`)
  writeFileSync(join(fixtureRoot, 'smoke.ts'), `
import { getVersion } from '@underware/pistols-sdk'
import { getConnectorId, type Connector } from '@underware/pistols-sdk/pistols/dojo'
import { useAccount } from '@underware/pistols-sdk/utils/hooks'
import { StarknetConfig } from '@starknet-start/react'

const version: string = getVersion()
const connector: Connector | undefined = undefined
const connectorId: string | undefined = getConnectorId(connector)
void [version, connectorId, useAccount, StarknetConfig]
`)
  writeFileSync(join(fixtureRoot, 'smoke.mjs'), `
import { getVersion } from '@underware/pistols-sdk'
import { getConnectorId } from '@underware/pistols-sdk/pistols/dojo'

if (getVersion() !== '2.0.0') throw new Error('packed SDK has the wrong version')
if (getConnectorId(undefined) !== undefined) throw new Error('connector helper smoke failed')
`)

  run('pnpm', ['install', '--prefer-offline', '--ignore-scripts', '--strict-peer-dependencies'], fixtureRoot)
  run('pnpm', ['exec', 'tsc', '--noEmit'], fixtureRoot)
  run('node', ['smoke.mjs'], fixtureRoot)

  const list = JSON.parse(run(
    'pnpm',
    ['list', 'react', 'starknet', '@dojoengine/sdk', '--depth', 'Infinity', '--json'],
    fixtureRoot,
  ))
  for (const name of ['react', 'starknet', '@dojoengine/sdk']) {
    const versions = collectVersions(list[0], name)
    if (versions.size !== 1) {
      throw new Error(`${name} resolved to ${[...versions].join(', ') || 'no versions'}`)
    }
  }

  console.log(`SDK consumer fixture: OK — ${sdkPackage.name}@${sdkPackage.version}, isolated install and smoke checks passed`)
} catch (error) {
  if (error?.stderr) process.stderr.write(error.stderr)
  throw error
} finally {
  rmSync(fixtureRoot, { recursive: true, force: true })
}
