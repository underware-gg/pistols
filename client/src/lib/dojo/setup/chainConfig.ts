import { PredeployedAccount } from '@dojoengine/create-burner'
import { Chain, mainnet, sepolia } from '@starknet-react/chains'
import { feltToString } from '@/lib/utils/starknet'
import { assert } from '@/lib/utils/math'
import {
  LOCAL_KATANA,
  LOCAL_TORII,
  LOCAL_RELAY,
  KATANA_PREFUNDED_ADDRESS,
  KATANA_PREFUNDED_PRIVATE_KEY,
  KATANA_CLASS_HASH,
} from '@dojoengine/core'
import {
  CHAIN_ID,
  katanaLocalChain,
  pistolsSlotChain,
  realmsWorldChain,
} from './chains'

export { CHAIN_ID }

export const defaultChainId = (process.env.NEXT_PUBLIC_CHAIN_ID || undefined) as CHAIN_ID

export type DojoContextConfig = typeof dojoContextConfig

export type DojoChainConfig = {
  chain: Chain
  chainId: CHAIN_ID
  name: string
  rpcUrl: string
  toriiUrl: string,
  relayUrl: string,
  masterAddress: string,
  masterPrivateKey: string,
  accountClassHash: string,
  lordsContractAddress: string,
  lordsFaucetUrl: string,
  predeployedAccounts: PredeployedAccount[],
}

const envChainConfig: DojoChainConfig = {
  chain: undefined,
  chainId: undefined,
  name: undefined,
  rpcUrl: process.env.NEXT_PUBLIC_NODE_URL || undefined,
  toriiUrl: process.env.NEXT_PUBLIC_TORII || undefined,
  relayUrl: process.env.NEXT_PUBLIC_RELAY_URL || undefined,
  masterAddress: process.env.NEXT_PUBLIC_MASTER_ADDRESS || undefined,
  masterPrivateKey: process.env.NEXT_PUBLIC_MASTER_PRIVATE_KEY || undefined,
  accountClassHash: KATANA_CLASS_HASH,
  lordsContractAddress: undefined,
  lordsFaucetUrl: undefined,
  predeployedAccounts: [],
}

const localKatanaConfig: DojoChainConfig = {
  chain: katanaLocalChain,
  chainId: undefined, // derived from chain
  name: undefined,    // derived from chain
  rpcUrl: LOCAL_KATANA,
  toriiUrl: 'http://0.0.0.0:8080', //LOCAL_TORII,
  relayUrl: LOCAL_RELAY,
  masterAddress: KATANA_PREFUNDED_ADDRESS,
  masterPrivateKey: KATANA_PREFUNDED_PRIVATE_KEY,
  accountClassHash: KATANA_CLASS_HASH,
  lordsContractAddress: undefined, // lords_mock
  lordsFaucetUrl: undefined,
  predeployedAccounts: [],
}

const pistolsSlotConfig: DojoChainConfig = {
  chain: pistolsSlotChain,
  chainId: undefined, // derived from chain
  name: undefined,    // derived from chain
  rpcUrl: 'https://api.cartridge.gg/x/pistols-slot/katana',
  toriiUrl: 'https://api.cartridge.gg/x/pistols-slot/torii',
  relayUrl: undefined,
  masterAddress: '0x23ce913a39de30f729aee781b8dea86281b9a25d897e5d9fb61e3e95cae8cd',
  masterPrivateKey: '0x22372b22b591f4db22860a70e6f831c4eadb80e42669f54ccc7fe2420befea9',
  accountClassHash: KATANA_CLASS_HASH,
  lordsContractAddress: undefined, // lords_mock
  lordsFaucetUrl: undefined,
  predeployedAccounts: [],
}

// based on:
// https://dev.realms.world/browser-wallets
const realmsWorldConfig: DojoChainConfig = {
  chain: realmsWorldChain,
  chainId: undefined, // derived from chain
  name: undefined,    // derived from chain
  rpcUrl: 'https://api.cartridge.gg/x/realms/katana',
  toriiUrl: 'https://api.cartridge.gg/x/realms/torii',
  relayUrl: undefined,
  masterAddress: undefined,
  masterPrivateKey: undefined,
  accountClassHash: '0x029927c8af6bccf3f6fda035981e765a7bdbf18a2dc0d630494f8758aa908e2b',
  lordsContractAddress: '0x51205c5e6ac3ad5691c28c0c5ffcdd62c70bddb63612f75a4bac9b2a85b9449',
  lordsFaucetUrl: 'https://internal-explorer.preview.cartridge.gg',
  predeployedAccounts: [],
}

const snMainnetConfig: DojoChainConfig = {
  chain: mainnet,
  chainId: CHAIN_ID.SN_MAINNET,
  name: 'Starknet Mainnet',
  rpcUrl: 'https://api.cartridge.gg/rpc/starknet',
  toriiUrl: undefined,
  relayUrl: undefined,
  masterAddress: undefined,
  masterPrivateKey: undefined,
  accountClassHash: undefined,
  lordsContractAddress: '0x0124aeb495b947201f5fac96fd1138e326ad86195b98df6dec9009158a533b49',
  lordsFaucetUrl: 'https://app.avnu.fi/en?amount=100&tokenFrom=0x124aeb495b947201f5fac96fd1138e326ad86195b98df6dec9009158a533b49&tokenTo=0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
  predeployedAccounts: [],
}

const snSepoliaConfig: DojoChainConfig = {
  chain: sepolia,
  chainId: CHAIN_ID.SN_SEPOLIA,
  name: 'Starknet Sepolia',
  rpcUrl: 'https://api.cartridge.gg/rpc/starknet-sepolia',
  toriiUrl: undefined,
  relayUrl: undefined,
  masterAddress: undefined,
  masterPrivateKey: undefined,
  accountClassHash: undefined,
  lordsContractAddress: '0x044e6bcc627e6201ce09f781d1aae44ea4c21c2fdef299e34fce55bef2d02210',
  lordsFaucetUrl: undefined,
  predeployedAccounts: [],
}


const dojoContextConfig: Record<CHAIN_ID, DojoChainConfig> = {
  [CHAIN_ID.KATANA_LOCAL]: localKatanaConfig,
  [CHAIN_ID.PISTOLS_SLOT]: pistolsSlotConfig,
  [CHAIN_ID.KATANA]: realmsWorldConfig,
  [CHAIN_ID.SN_SEPOLIA]: snSepoliaConfig,
  [CHAIN_ID.SN_MAINNET]: snMainnetConfig,
}


export const isChainIdSupported = (chainId: CHAIN_ID): boolean => {
  return Object.keys(dojoContextConfig).includes(chainId)
}

export const getStarknetProviderChains = (supportedChainIds: CHAIN_ID[]): Chain[] => {
  return supportedChainIds.reduce((acc, chainId) => {
    const dojoChainConfig = dojoContextConfig[chainId]
    if (dojoChainConfig) {
      acc.push(dojoChainConfig.chain)
    }
    return acc
  }, [])
}

export const getDojoChainConfig = (chainId: CHAIN_ID): DojoChainConfig => {
  if (!isChainIdSupported(chainId)) {
    return null
  }
  let result = { ...dojoContextConfig[chainId] }
  const chain = result.chain
  // assert ids are in sync
  const id = feltToString(chain.id) as CHAIN_ID
  assert(id == chainId, `getDojoChainConfig(${chainId}) id does not match chain [${id}]`)
  // assert custom urls are in sync
  if (!id.startsWith('SN_')) {
    chain.rpcUrls.default.http.forEach(url => assert(url == result.rpcUrl, `getDojoChainConfig(${chainId}) chain.rpcUrls.default.http does not match`));
    chain.rpcUrls.public.http.forEach(url => assert(url == result.rpcUrl, `getDojoChainConfig(${chainId}) chain.rpcUrls.public.http does not match`));
  }
  // derive data from chain
  if (!result.chainId) result.chainId = id
  if (!result.name) result.name = chain.name
  // replace config from env
  if (chainId == defaultChainId) {
    result = Object.keys(result).reduce((a, k) => {
      if (envChainConfig[k]) {
        a[k] = envChainConfig[k]
      }
      return a
    }, result)
  }
  return result
}

export const getChainMasterAccount = (chainId: CHAIN_ID): PredeployedAccount => {
  const dojoChainConfig = dojoContextConfig[chainId]
  if (dojoChainConfig?.masterAddress && dojoChainConfig?.masterPrivateKey) {
    return {
      name: 'Master Account',
      address: dojoChainConfig.masterAddress,
      privateKey: dojoChainConfig.masterPrivateKey,
      active: false,
    }
  }
  return null
}