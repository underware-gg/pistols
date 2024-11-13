import {
  Chain, NativeCurrency,
  mainnet, sepolia,
} from '@starknet-react/chains'
import {
  LOCAL_KATANA,
  LOCAL_TORII,
  LOCAL_RELAY,
  KATANA_CLASS_HASH,
  KATANA_PREFUNDED_ADDRESS,
  KATANA_PREFUNDED_PRIVATE_KEY,
  KATANA_ETH_CONTRACT_ADDRESS,
} from '@dojoengine/core'
import { supportedConnetorIds } from './connectors'
import { PredeployedAccount } from '@/lib/utils/hooks/usePredeployedConnector'

//
// supported chain ids
//

export enum ChainId {
  SN_MAINNET = 'SN_MAINNET',
  SN_SEPOLIA = 'SN_SEPOLIA',
  KATANA_LOCAL = 'KATANA_LOCAL',
  PISTOLS_SLOT = 'WP_PISTOLS',
  PISTOLS_STAGING = 'WP_PISTOLS_STAGING',
}

//
// currencies
//
const ETH_KATANA: NativeCurrency = {
  address: KATANA_ETH_CONTRACT_ADDRESS,
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
  etherAddress: string
  lordsFaucet: boolean | string
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
  accountClassHash: undefined,
  etherAddress: undefined,
  lordsFaucet: undefined,
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
  masterAddress: '0x127fd5f1fe78a71f8bcd1fec63e3fe2f0486b6ecd5c86a0466c3a21fa5cfcec',
  masterPrivateKey: '0xc5b2fcab997346f3ea1c00b002ecf6f382c5f9c9659a3894eb783c5320f912',
  accountClassHash: KATANA_CLASS_HASH,
  etherAddress: KATANA_ETH_CONTRACT_ADDRESS,
  lordsFaucet: true,
  predeployedAccounts: [
    {
      name: 'Predeployed',
      address: '0x13d9ee239f33fea4f8785b9e3870ade909e20a9599ae7cd62c1c292b73af1b7',
      privateKey: '0x1c9053c053edf324aec366a34c6901b1095b07af69495bffec7d7fe21effb1b',
      active: true,
    }
  ],
  connectorIds: [
    supportedConnetorIds.PREDEPLOYED,
    supportedConnetorIds.CONTROLLER,
  ],
  // starknet Chain
  nativeCurrency: ETH_KATANA,
  explorers: WORLD_EXPLORER,
} as const

const pistolsSlotConfig: DojoChainConfig = {
  chain: undefined, // derive from this
  chainId: ChainId.PISTOLS_SLOT,
  name: 'Slot Testnet',
  rpcUrl: 'https://api.cartridge.gg/x/pistols/katana',
  toriiUrl: 'https://api.cartridge.gg/x/pistols/torii',
  relayUrl: undefined,
  masterAddress: undefined,
  masterPrivateKey: undefined,
  accountClassHash: KATANA_CLASS_HASH,
  etherAddress: KATANA_ETH_CONTRACT_ADDRESS,
  lordsFaucet: true,
  predeployedAccounts: [
    {
      name: 'Predeployed',
      address: '0xd9ab4d256e0d69e8cc4bcd584b91c11e2194003905112830d58af262b50fe',
      privateKey: '0x15a4a8a84df92998b5746a448bc889dd626b7cb593618efd6d12287d1eca239',
      active: true,
    }
  ],
  connectorIds: [
    supportedConnetorIds.PREDEPLOYED,
    supportedConnetorIds.CONTROLLER,
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
  masterAddress: undefined,
  masterPrivateKey: undefined,
  accountClassHash: KATANA_CLASS_HASH,
  etherAddress: KATANA_ETH_CONTRACT_ADDRESS,
  lordsFaucet: true,
  predeployedAccounts: [],
  connectorIds: [
    supportedConnetorIds.CONTROLLER,
  ],
  // starknet Chain
  nativeCurrency: ETH_KATANA,
  explorers: WORLD_EXPLORER,
} as const



//-------------------------------
// Starknet
//

const snSepoliaConfig: DojoChainConfig = {
  chain: { ...sepolia },
  chainId: ChainId.SN_SEPOLIA,
  name: 'Sepolia Testnet',
  // rpcUrl: 'https://api.cartridge.gg/x/starknet/sepolia/v0_6',
  // rpcUrl: 'https://api.cartridge.gg/rpc/starknet-sepolia',
  rpcUrl: 'https://api.cartridge.gg/x/starknet/sepolia',
  toriiUrl: 'https://api.cartridge.gg/x/pistols-sepolia-2/torii',
  relayUrl: undefined,
  masterAddress: undefined,
  masterPrivateKey: undefined,
  accountClassHash: KATANA_CLASS_HASH,
  etherAddress: sepolia.nativeCurrency.address,
  lordsFaucet: true,
  // lordsFaucet: 'https://sepolia.voyager.online/contract/0x044e6bcc627e6201ce09f781d1aae44ea4c21c2fdef299e34fce55bef2d02210#writeContract',
  predeployedAccounts: [],
  connectorIds: [
    supportedConnetorIds.CONTROLLER,
    // supportedConnetorIds.ARGENT,
    // supportedConnetorIds.BRAAVOS,
  ],
} as const

const snMainnetConfig: DojoChainConfig = {
  chain: { ...mainnet },
  chainId: ChainId.SN_MAINNET,
  name: 'Mainnet',
  // rpcUrl: 'https://api.cartridge.gg/rpc/starknet',
  rpcUrl: 'https://api.cartridge.gg/x/starknet/mainnet',
  toriiUrl: undefined,
  relayUrl: undefined,
  masterAddress: undefined,
  masterPrivateKey: undefined,
  accountClassHash: undefined,
  etherAddress: mainnet.nativeCurrency.address,
  lordsFaucet: false,
  predeployedAccounts: [],
  connectorIds: [
    supportedConnetorIds.CONTROLLER,
    // supportedConnetorIds.ARGENT,
    // supportedConnetorIds.BRAAVOS,
  ],
} as const


//--------------------------------
// Available chains
//

export const dojoContextConfig: Record<ChainId, DojoChainConfig> = {
  [ChainId.KATANA_LOCAL]: localKatanaConfig,
  [ChainId.PISTOLS_SLOT]: pistolsSlotConfig,
  [ChainId.PISTOLS_STAGING]: pistolsStagingConfig,
  [ChainId.SN_SEPOLIA]: snSepoliaConfig,
  [ChainId.SN_MAINNET]: snMainnetConfig,
}
