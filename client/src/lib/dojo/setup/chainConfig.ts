import { PredeployedAccount } from '@dojoengine/create-burner'
import { Chain, mainnet, sepolia } from '@starknet-react/chains'
import {
  LOCAL_KATANA,
  LOCAL_TORII,
  LOCAL_RELAY,
  KATANA_PREFUNDED_ADDRESS,
  KATANA_PREFUNDED_PRIVATE_KEY,
  KATANA_CLASS_HASH,
} from '@dojoengine/core'
import * as chains from './chains'

// based on:
// https://github.com/cartridge-gg/rollyourown/blob/market_packed/web/src/dojo/setup/config.ts

export type DojoContextConfig = typeof dojoContextConfig

export type DojoChainConfig = {
  name: string
  chain: Chain
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

const localKatanaConfig: DojoChainConfig = {
  name: chains.katanaLocalChain.name,
  chain: chains.katanaLocalChain,
  rpcUrl: process.env.NEXT_PUBLIC_NODE_URL ?? LOCAL_KATANA,
  toriiUrl: process.env.NEXT_PUBLIC_TORII ?? 'http://0.0.0.0:8080', //LOCAL_TORII,
  relayUrl: process.env.NEXT_PUBLIC_RELAY_URL ?? LOCAL_RELAY,
  masterAddress: process.env.NEXT_PUBLIC_MASTER_ADDRESS ?? KATANA_PREFUNDED_ADDRESS,
  masterPrivateKey: process.env.NEXT_PUBLIC_MASTER_PRIVATE_KEY ?? KATANA_PREFUNDED_PRIVATE_KEY,
  accountClassHash: KATANA_CLASS_HASH,
  lordsContractAddress: undefined, // lords_mock
  lordsFaucetUrl: undefined,
  predeployedAccounts: [],
}

const pistolsSlotConfig: DojoChainConfig = {
  name: chains.pistolsSlotChain.name,
  chain: chains.pistolsSlotChain,
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
  name: chains.realmsWorldChain.name,
  chain: chains.realmsWorldChain,
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

const snSepoliaConfig: DojoChainConfig = {
  name: 'Starknet Sepolia',
  chain: sepolia,
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

const snMainnetConfig: DojoChainConfig = {
  name: 'Starknet Mainnet',
  chain: mainnet,
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


export const dojoContextConfig: Record<chains.CHAIN_ID, DojoChainConfig> = {
  [chains.CHAIN_ID.KATANA]: localKatanaConfig,
  [chains.CHAIN_ID.PISTOLS_SLOT]: pistolsSlotConfig,
  [chains.CHAIN_ID.DOJO_REALMS_WORLD]: realmsWorldConfig,
  [chains.CHAIN_ID.SN_SEPOLIA]: snSepoliaConfig,
  [chains.CHAIN_ID.SN_MAINNET]: snMainnetConfig,
}

// export const getDojoChains = (): DojoChainConfig[] => {
//   return Object.values(dojoContextConfig)
// }

export const isChainIdSupported = (chainId: chains.CHAIN_ID): boolean => {
  return Object.keys(dojoContextConfig).includes(chainId)
}

export const getStarknetProviderChains = (supportedChainIds: chains.CHAIN_ID[]): Chain[] => {
  return Object.keys(dojoContextConfig).reduce((acc, chain_id) => {
    if (supportedChainIds.includes(chain_id as chains.CHAIN_ID)) {
      acc.push(dojoContextConfig[chain_id].chain)
    }
    return acc
  }, [])
}

export const getMasterPredeployedAccount = (chainId: chains.CHAIN_ID): PredeployedAccount[] => {
  const dojoChainConfig = dojoContextConfig[chainId]
  if (dojoChainConfig?.masterAddress && dojoChainConfig?.masterPrivateKey) {
    return [{
      name: 'Master Account',
      address: dojoChainConfig.masterAddress,
      privateKey: dojoChainConfig.masterPrivateKey,
      active: false,
    }]
  }
  return []
}