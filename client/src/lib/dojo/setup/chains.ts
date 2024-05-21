import {
  Chain, NativeCurrency,
  mainnet, sepolia,
} from '@starknet-react/chains'
import { PredeployedAccount } from '@dojoengine/create-burner'
import {
  LOCAL_KATANA,
  LOCAL_TORII,
  LOCAL_RELAY,
  KATANA_PREFUNDED_ADDRESS,
  KATANA_PREFUNDED_PRIVATE_KEY,
  KATANA_CLASS_HASH,
} from '@dojoengine/core'

//
// supported chain ids
//

export enum CHAIN_ID {
  SN_MAINNET = 'SN_MAINNET',
  SN_SEPOLIA = 'SN_SEPOLIA',
  KATANA_LOCAL = 'KATANA_LOCAL',
  WP_PISTOLS_SLOT = 'WP_PISTOLS_SLOT',
  KATANA = 'KATANA', // actually DOJO_REALMS_WORLD
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
  chainId: CHAIN_ID
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
  predeployedAccounts: [],
}

//--------------------------------
// Chain definitions
//

const localKatanaConfig: DojoChainConfig = {
  chain: undefined, // derive from this
  chainId: CHAIN_ID.KATANA_LOCAL,
  name: 'Katana Local',
  rpcUrl: LOCAL_KATANA,
  toriiUrl: 'http://0.0.0.0:8080', //LOCAL_TORII,
  relayUrl: LOCAL_RELAY,
  masterAddress: KATANA_PREFUNDED_ADDRESS,
  masterPrivateKey: KATANA_PREFUNDED_PRIVATE_KEY,
  accountClassHash: KATANA_CLASS_HASH,
  lordsContractAddress: undefined, // lords_mock
  lordsFaucetUrl: undefined,
  predeployedAccounts: [],
  // starknet Chain
  nativeCurrency: ETH_KATANA,
  explorers: WORLD_EXPLORER,
} as const

const pistolsSlotConfig: DojoChainConfig = {
  chain: undefined, // derive from this
  chainId: CHAIN_ID.WP_PISTOLS_SLOT,
  name: 'Slot Testnet (Free)',
  rpcUrl: 'https://api.cartridge.gg/x/pistols-slot/katana',
  toriiUrl: 'https://api.cartridge.gg/x/pistols-slot/torii',
  relayUrl: undefined,
  masterAddress: '0x61702bc93bd47c05ee13b994394aafd51c8b707bbea6d37bf87decd14c5cf0',
  masterPrivateKey: '0x25e53c73c1e13c4214ffb048609ac69fd4d9671b4061c0e813a07bc4fe33743',
  accountClassHash: KATANA_CLASS_HASH,
  lordsContractAddress: undefined, // lords_mock
  lordsFaucetUrl: undefined,
  predeployedAccounts: [],
  // starknet Chain
  nativeCurrency: ETH_KATANA,
  explorers: WORLD_EXPLORER,
} as const

// based on:
// https://dev.realms.world/browser-wallets
const realmsWorldConfig: DojoChainConfig = {
  chain: undefined, // derive from this
  chainId: CHAIN_ID.KATANA,
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
  // starknet Chain
  nativeCurrency: LORDS_REALMS_L3,
  explorers: WORLD_EXPLORER,
} as const

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
} as const

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
} as const


//--------------------------------
// Available chains
//

export const dojoContextConfig: Record<CHAIN_ID, DojoChainConfig> = {
  [CHAIN_ID.KATANA_LOCAL]: localKatanaConfig,
  [CHAIN_ID.WP_PISTOLS_SLOT]: pistolsSlotConfig,
  [CHAIN_ID.KATANA]: realmsWorldConfig,
  [CHAIN_ID.SN_SEPOLIA]: snSepoliaConfig,
  [CHAIN_ID.SN_MAINNET]: snMainnetConfig,
}
