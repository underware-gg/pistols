import { PredeployedAccount } from '@dojoengine/create-burner'
import { Chain, mainnet, sepolia } from '@starknet-react/chains'
import { KATANA_CLASS_HASH } from '@dojoengine/core'
import manifest from '../../../manifest.json'
import * as chains from './chains'
import { feltToString } from '@/lib/utils/starknet'

// based on:
// https://github.com/cartridge-gg/rollyourown/blob/market_packed/web/src/dojo/setup/config.ts

export type DojoContextConfig = typeof dojoContextConfig

export type DojoChainConfig = {
  name: string
  chainConfig: Chain
  rpcUrl: string
  toriiUrl: string,
  toriiWsUrl: string,
  masterAddress: string,
  masterPrivateKey: string,
  accountClassHash: string,
  manifest: any,
  predeployedAccounts: PredeployedAccount[],
  lordsContractAddress: string,
  lordsFaucetUrl: string,
}

const localKatanaConfig: DojoChainConfig = {
  name: chains.katanaLocalChain.name,
  chainConfig: chains.katanaLocalChain,
  rpcUrl: process.env.NEXT_PUBLIC_RPC_ENDPOINT ?? 'http://localhost:5050',
  toriiUrl: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ?? 'http://0.0.0.0:8080',
  toriiWsUrl: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT_WS ?? 'ws://0.0.0.0:8080/ws',
  masterAddress: process.env.NEXT_PUBLIC_MASTER_ADDRESS ?? '0xb3ff441a68610b30fd5e2abbf3a1548eb6ba6f3559f2862bf2dc757e5828ca',
  masterPrivateKey: process.env.NEXT_PUBLIC_MASTER_PRIVATE_KEY ?? '0x2bbf4f9fd0bbb2e60b0316c1fe0b76cf7a4d0198bd493ced9b8df2a3a24d68a',
  accountClassHash: KATANA_CLASS_HASH,
  manifest,
  predeployedAccounts: [],
  lordsContractAddress: undefined, // lords_mock
  lordsFaucetUrl: undefined,
}

const pistolsSlotConfig: DojoChainConfig = {
  name: chains.pistolsSlotChain.name,
  chainConfig: chains.pistolsSlotChain,
  rpcUrl: 'https://api.cartridge.gg/x/pistols/katana',
  toriiUrl: 'https://api.cartridge.gg/x/pistols/torii',
  toriiWsUrl: 'wss://api.cartridge.gg/x/pistols/torii/ws',
  masterAddress: '0x5b7d6d0110aba636b7df1d41858c036aefb8bee9dd4052c51fbf5cd9e2d614',
  masterPrivateKey: '0x534363549dc5f54179835979add2d508b4a0cb315d9648977aa5f9e363da67a',
  accountClassHash: KATANA_CLASS_HASH,
  manifest,
  predeployedAccounts: [],
  lordsContractAddress: undefined, // lords_mock
  lordsFaucetUrl: undefined,
}

// based on:
// https://dev.realms.world/browser-wallets
const realmsWorldConfig: DojoChainConfig = {
  name: chains.realmsWorldChain.name,
  chainConfig: chains.realmsWorldChain,
  rpcUrl: 'https://api.cartridge.gg/x/realms/katana',
  toriiUrl: 'https://api.cartridge.gg/x/realms/torii',
  toriiWsUrl: 'wss://api.cartridge.gg/x/realms/torii/ws',
  masterAddress: undefined,
  masterPrivateKey: undefined,
  accountClassHash: '0x029927c8af6bccf3f6fda035981e765a7bdbf18a2dc0d630494f8758aa908e2b',
  manifest,
  predeployedAccounts: [],
  lordsContractAddress: '0x51205c5e6ac3ad5691c28c0c5ffcdd62c70bddb63612f75a4bac9b2a85b9449',
  lordsFaucetUrl: 'https://internal-explorer.preview.cartridge.gg',
}

const snSepoliaConfig: DojoChainConfig = {
  name: 'Starknet Sepolia',
  chainConfig: sepolia,
  rpcUrl: 'https://api.cartridge.gg/rpc/starknet-sepolia',
  toriiUrl: undefined,
  toriiWsUrl: undefined,
  masterAddress: undefined,
  masterPrivateKey: undefined,
  accountClassHash: undefined,
  manifest,
  predeployedAccounts: [],
  lordsContractAddress: '0x044e6bcc627e6201ce09f781d1aae44ea4c21c2fdef299e34fce55bef2d02210',
  lordsFaucetUrl: undefined,
}

const snMainnetConfig: DojoChainConfig = {
  name: 'Starknet Mainnet',
  chainConfig: mainnet,
  rpcUrl: 'https://api.cartridge.gg/rpc/starknet',
  toriiUrl: undefined,
  toriiWsUrl: undefined,
  masterAddress: undefined,
  masterPrivateKey: undefined,
  accountClassHash: undefined,
  manifest,
  predeployedAccounts: [],
  lordsContractAddress: '0x0124aeb495b947201f5fac96fd1138e326ad86195b98df6dec9009158a533b49',
  lordsFaucetUrl: 'https://app.avnu.fi/en?amount=100&tokenFrom=0x124aeb495b947201f5fac96fd1138e326ad86195b98df6dec9009158a533b49&tokenTo=0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
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
      acc.push(dojoContextConfig[chain_id].chainConfig)
    }
    return acc
  }, [])
}
