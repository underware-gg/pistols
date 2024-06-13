import {
  Chain, NativeCurrency,
  mainnet, sepolia,
} from '@starknet-react/chains'
import { PredeployedAccount } from '@rsodre/create-burner'
import {
  LOCAL_KATANA,
  LOCAL_TORII,
  LOCAL_RELAY,
  KATANA_PREFUNDED_ADDRESS,
  KATANA_PREFUNDED_PRIVATE_KEY,
  KATANA_CLASS_HASH,
} from '@dojoengine/core'
import { supportedConnetorIds } from './connectors'

//
// supported chain ids
//

export enum ChainId {
  SN_MAINNET = 'SN_MAINNET',
  SN_SEPOLIA = 'SN_SEPOLIA',
  KATANA_LOCAL = 'KATANA_LOCAL',
  PISTOLS_SLOT = 'WP_PISTOLS',
  PISTOLS_STAGING = 'WP_PISTOLS_STAGING',
  REALMS_WORLD = 'KATANA', // actually DOJO_REALMS_WORLD
}

//
// currencies
//
const ETH_KATANA: NativeCurrency = {
  address: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
  name: 'Ether',
  symbol: 'ETH',
  decimals: 18,
}
const LORDS_REALMS_L3: NativeCurrency = {
  address: '0x51205c5e6ac3ad5691c28c0c5ffcdd62c70bddb63612f75a4bac9b2a85b9449',
  name: 'Lords',
  symbol: 'LORDS',
  decimals: 18,
}

//
// explorers
//
type ChainExplorers = {
  [key: string]: string[]
}
const WORLD_EXPLORER: ChainExplorers = {
  worlds: ['https://worlds.dev'],
}

//
// chain config
//
export type DojoChainConfig = {
  chain: Chain
  chainId: ChainId
  name: string
  rpcUrl: string
  toriiUrl: string
  relayUrl: string
  masterAddress: string,
  masterPrivateKey: string
  accountClassHash: string
  lordsContractAddress: string
  lordsFaucetUrl: string
  predeployedAccounts: PredeployedAccount[]
  connectorIds: string[]
  // starknet Chain
  network?: string
  testnet?: boolean
  nativeCurrency?: NativeCurrency
  explorers?: ChainExplorers
}

// environment overrides, will be applied over default chain only
export const envChainConfig: DojoChainConfig = {
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
  predeployedAccounts: undefined,
  connectorIds: undefined,
}

//--------------------------------
// Chain definitions
//

const localKatanaConfig: DojoChainConfig = {
  chain: undefined, // derive from this
  chainId: ChainId.KATANA_LOCAL,
  name: 'Katana Local',
  rpcUrl: LOCAL_KATANA,
  toriiUrl: 'http://0.0.0.0:8080', //LOCAL_TORII,
  relayUrl: LOCAL_RELAY,
  // masterAddress: KATANA_PREFUNDED_ADDRESS,
  // masterPrivateKey: KATANA_PREFUNDED_PRIVATE_KEY,
  masterAddress: '0xb3ff441a68610b30fd5e2abbf3a1548eb6ba6f3559f2862bf2dc757e5828ca',
  masterPrivateKey: '0x2bbf4f9fd0bbb2e60b0316c1fe0b76cf7a4d0198bd493ced9b8df2a3a24d68a',
  accountClassHash: KATANA_CLASS_HASH,
  lordsContractAddress: undefined, // lords_mock
  lordsFaucetUrl: undefined,
  predeployedAccounts: [],
  connectorIds: [
    supportedConnetorIds.DOJO_PREDEPLOYED,
    // supportedConnetorIds.CONTROLLER,
  ],
  // starknet Chain
  nativeCurrency: ETH_KATANA,
  explorers: WORLD_EXPLORER,
} as const

const pistolsSlotConfig: DojoChainConfig = {
  chain: undefined, // derive from this
  chainId: ChainId.PISTOLS_SLOT,
  name: 'Slot Testnet',
  // rpcUrl: 'https://api.cartridge.gg/x/pistols/katana',
  rpcUrl: 'https://us-east.api.cartridge.gg/x/pistols/katana',
  toriiUrl: 'https://api.cartridge.gg/x/pistols/torii',
  relayUrl: undefined,
  masterAddress: '0x199df3260858b341a7985245c94361a320569635d0c405b1827ffa4d7ded985',
  masterPrivateKey: '0x680cf081e48a2c0651fe1a66b9f4b52203951a746e5d6c14aa65ed8e4245b88',
  accountClassHash: KATANA_CLASS_HASH,
  lordsContractAddress: undefined, // lords_mock
  lordsFaucetUrl: undefined,
  predeployedAccounts: [],
  connectorIds: [
    supportedConnetorIds.DOJO_PREDEPLOYED,
    // supportedConnetorIds.CONTROLLER,
  ],
  // starknet Chain
  nativeCurrency: ETH_KATANA,
  explorers: WORLD_EXPLORER,
} as const

const pistolsStagingConfig: DojoChainConfig = {
  chain: undefined, // derive from this
  chainId: ChainId.PISTOLS_STAGING,
  name: 'Slot Staging',
  rpcUrl: 'https://api.cartridge.gg/x/pistols-staging/katana',
  toriiUrl: 'https://api.cartridge.gg/x/pistols-staging/torii',
  relayUrl: undefined,
  masterAddress: '0x7947c7d3e02e85da3ba8c93024b006ab7f10dc6b8fb3cb151569c996869edba',
  masterPrivateKey: '0x329a6dea7e53dcd104ab13494a29c6ddb1e472afebddcbd3ae11f8fe76a9e53',
  accountClassHash: KATANA_CLASS_HASH,
  lordsContractAddress: undefined, // lords_mock
  lordsFaucetUrl: undefined,
  predeployedAccounts: [],
  connectorIds: [
    supportedConnetorIds.DOJO_PREDEPLOYED,
    // supportedConnetorIds.CONTROLLER,
  ],
  // starknet Chain
  nativeCurrency: ETH_KATANA,
  explorers: WORLD_EXPLORER,
} as const

// based on:
// https://dev.realms.world/browser-wallets
const realmsWorldConfig: DojoChainConfig = {
  chain: undefined, // derive from this
  chainId: ChainId.REALMS_WORLD,
  name: 'Realms World (Ranked)',
  rpcUrl: 'https://api.cartridge.gg/x/realms/katana',
  toriiUrl: 'https://api.cartridge.gg/x/realms/torii',
  relayUrl: undefined,
  masterAddress: undefined,
  masterPrivateKey: undefined,
  accountClassHash: '0x029927c8af6bccf3f6fda035981e765a7bdbf18a2dc0d630494f8758aa908e2b',
  lordsContractAddress: '0x51205c5e6ac3ad5691c28c0c5ffcdd62c70bddb63612f75a4bac9b2a85b9449',
  lordsFaucetUrl: 'https://internal-explorer.preview.cartridge.gg',
  predeployedAccounts: [],
  connectorIds: [
    supportedConnetorIds.DOJO_PREDEPLOYED,
    // supportedConnetorIds.CONTROLLER,
  ],
  // starknet Chain
  nativeCurrency: LORDS_REALMS_L3,
  explorers: WORLD_EXPLORER,
} as const


//-------------------------------
// Starknet
//

const snMainnetConfig: DojoChainConfig = {
  chain: mainnet,
  chainId: ChainId.SN_MAINNET,
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
  connectorIds: [
    // supportedConnetorIds.CONTROLLER,
    supportedConnetorIds.ARGENT,
    supportedConnetorIds.DOJO_PREDEPLOYED,
  ],
} as const

const snSepoliaConfig: DojoChainConfig = {
  chain: sepolia,
  chainId: ChainId.SN_SEPOLIA,
  name: 'Starknet Sepolia Testnet',
  rpcUrl: 'https://api.cartridge.gg/rpc/starknet-sepolia',
  toriiUrl: undefined,
  relayUrl: undefined,
  masterAddress: undefined,
  masterPrivateKey: undefined,
  accountClassHash: undefined,
  lordsContractAddress: '0x044e6bcc627e6201ce09f781d1aae44ea4c21c2fdef299e34fce55bef2d02210',
  lordsFaucetUrl: undefined,
  predeployedAccounts: [],
  connectorIds: [
    supportedConnetorIds.CONTROLLER,
    supportedConnetorIds.ARGENT,
    supportedConnetorIds.DOJO_PREDEPLOYED,
  ],
} as const


//--------------------------------
// Available chains
//

export const dojoContextConfig: Record<ChainId, DojoChainConfig> = {
  [ChainId.KATANA_LOCAL]: localKatanaConfig,
  [ChainId.PISTOLS_SLOT]: pistolsSlotConfig,
  [ChainId.PISTOLS_STAGING]: pistolsStagingConfig,
  [ChainId.REALMS_WORLD]: realmsWorldConfig,
  [ChainId.SN_SEPOLIA]: snSepoliaConfig,
  [ChainId.SN_MAINNET]: snMainnetConfig,
}
