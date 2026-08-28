import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { init } from '@dojoengine/sdk'
import { DojoProvider } from '@dojoengine/core'
import { Account, RpcProvider, Signer } from 'starknet'
import { contracts } from '../dist/pistols_gen.js'
import { PistolsQueryBuilder } from '../dist/pistols_sdk.js'

const RPC_URL = process.env.KATANA_RPC_URL ?? 'http://127.0.0.1:5050'
const TORII_URL = process.env.TORII_URL ?? 'http://127.0.0.1:8080'
const ACCOUNT_ADDRESS = '0x127fd5f1fe78a71f8bcd1fec63e3fe2f0486b6ecd5c86a0466c3a21fa5cfcec'
const PRIVATE_KEY = '0xc5b2fcab997346f3ea1c00b002ecf6f382c5f9c9659a3894eb783c5320f912'

const manifestUrl = new URL('../src/games/pistols/config/manifests/manifest_dev.json', import.meta.url)
const manifest = JSON.parse(await readFile(manifestUrl, 'utf8'))
const worldAddress = manifest.world?.address
assert.match(worldAddress ?? '', /^0x[0-9a-f]+$/i, 'local manifest must contain a world address')

const query = () => new PistolsQueryBuilder()
  .withEntityModels(['pistols-Config'])
  .withLimit(10)
  .includeHashedKeys()

const configFrom = (entities) => entities
  .map((entity) => entity?.models?.pistols?.Config)
  .find(Boolean)

const withTimeout = (promise, milliseconds, label) => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(
    () => reject(new Error(`${label} timed out after ${milliseconds}ms`)),
    milliseconds,
  )),
])

const rpcProvider = new RpcProvider({ nodeUrl: RPC_URL })
const account = new Account({
  provider: rpcProvider,
  address: ACCOUNT_ADDRESS,
  signer: new Signer(PRIVATE_KEY),
})
const dojoProvider = new DojoProvider(manifest, RPC_URL)
const world = contracts.setupWorld(dojoProvider)
const sdk = await init({
  client: { toriiUrl: TORII_URL, worldAddress },
  domain: {
    name: 'Underware_gg',
    version: '1.0.0',
    chainId: 'KATANA_LOCAL',
    revision: '1',
  },
})

const initialResponse = await sdk.getEntities({ query: query() })
const initialConfig = configFrom(initialResponse.getItems())
assert.ok(initialConfig, 'Dojo.js 2 must decode the indexed pistols-Config model')

const targetPaused = !initialConfig.is_paused
let subscription
let wroteTarget = false

try {
  let resolveUpdate
  let rejectUpdate
  const updateObserved = new Promise((resolve, reject) => {
    resolveUpdate = resolve
    rejectUpdate = reject
  })

  const [, activeSubscription] = await sdk.subscribeEntityQuery({
    query: query().withLimit(1),
    callback: ({ data, error }) => {
      if (error) {
        rejectUpdate(error)
        return
      }
      const config = configFrom(data ?? [])
      if (config?.is_paused === targetPaused) resolveUpdate(config)
    },
  })
  subscription = activeSubscription

  const transaction = await world.admin.setPaused(account, targetPaused)
  await rpcProvider.waitForTransaction(transaction.transaction_hash, {
    retryInterval: 200,
    successStates: ['PRE_CONFIRMED', 'ACCEPTED_ON_L2', 'ACCEPTED_ON_L1'],
  })
  wroteTarget = true
  await withTimeout(updateObserved, 30_000, 'Torii subscription update')

  console.log(
    `Dojo.js 2 local integration: OK — queried Config, observed subscription, ` +
    `and executed ${transaction.transaction_hash}`,
  )
} finally {
  await subscription?.cancel()
  if (wroteTarget) {
    const restore = await world.admin.setPaused(account, initialConfig.is_paused)
    await rpcProvider.waitForTransaction(restore.transaction_hash, {
      retryInterval: 200,
      successStates: ['PRE_CONFIRMED', 'ACCEPTED_ON_L2', 'ACCEPTED_ON_L1'],
    })
  }
}

// The Torii WASM transport retains an internal handle after subscription
// cancellation. This is a finite CLI smoke test, so terminate after teardown.
process.exit(0)
