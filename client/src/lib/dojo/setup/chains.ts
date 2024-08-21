import {
  Chain, NativeCurrency,
  mainnet, sepolia,
} from '@starknet-react/chains'
import { PredeployedAccount } from '@dojoengine/create-burner'
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
  accountClassHash: undefined,
  etherAddress: undefined,
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
  etherAddress: KATANA_ETH_CONTRACT_ADDRESS,
  lordsContractAddress: undefined, // lords_mock
  lordsFaucetUrl: undefined,
  predeployedAccounts: [{
    address: '0xe29882a1fcba1e7e10cad46212257fea5c752a4f9b1b1ec683c503a2cf5c8a',
    privateKey: '0x14d6672dcb4b77ca36a887e9a11cd9d637d5012468175829e9c6e770c61642',
    active: false,
  }, {
    address: '0x6162896d1d7ab204c7ccac6dd5f8e9e7c25ecd5ae4fcb4ad32e57786bb46e03',
    privateKey: '0x1800000000300000180000000000030000000000003006001800006600',
    active: false,
  }],
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
  masterAddress: '0x2ec24cd4415a28e821c5b4b9dc3801340cb2e1a23f4289443d15fea60e2daab',
  masterPrivateKey: '0x1f3a9e4f7827167d6f7e93b8f2debc3129b06ceca19d02355434499592bf16c',
  accountClassHash: KATANA_CLASS_HASH,
  etherAddress: KATANA_ETH_CONTRACT_ADDRESS,
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
  masterAddress: '0xc8a78f24c762cd47889bb4ca3b81860c532972a17bac63b911f3e6785fad3c',
  masterPrivateKey: '0x58d9cbe874e10cc0282d7b8be204efc81955d5c11653c3a659d79538c1f2dcf',
  accountClassHash: KATANA_CLASS_HASH,
  etherAddress: KATANA_ETH_CONTRACT_ADDRESS,
  lordsContractAddress: undefined, // lords_mock
  lordsFaucetUrl: undefined,
  predeployedAccounts: [{
    address: '0x1d7b2ff5e73635ea01349a228ec68915feaa520810f22d57840f328077df2f8',
    privateKey: '0x5aaecdd5d38d95971c36cb47f56c59e2fd14c2ddc7fe39e62356bff262bf3f5',
    active: false,
  }],
  connectorIds: [
    supportedConnetorIds.DOJO_PREDEPLOYED,
    supportedConnetorIds.CONTROLLER,
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
  etherAddress: undefined,
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

const snSepoliaConfig: DojoChainConfig = {
  chain: { ...sepolia },
  chainId: ChainId.SN_SEPOLIA,
  name: 'Sepolia Testnet',
  // rpcUrl: 'https://api.cartridge.gg/x/starknet/sepolia/v0_6',
  // rpcUrl: 'https://api.cartridge.gg/rpc/starknet-sepolia',
  rpcUrl: 'https://api.cartridge.gg/x/starknet/sepolia',
  toriiUrl: 'https://api.cartridge.gg/x/pistols-sepolia/torii',
  relayUrl: undefined,
  masterAddress: undefined,
  masterPrivateKey: undefined,
  accountClassHash: KATANA_CLASS_HASH,
  etherAddress: sepolia.nativeCurrency.address,
  lordsContractAddress: '0x044e6bcc627e6201ce09f781d1aae44ea4c21c2fdef299e34fce55bef2d02210',
  lordsFaucetUrl: undefined, //'https://sepolia.voyager.online/contract/0x044e6bcc627e6201ce09f781d1aae44ea4c21c2fdef299e34fce55bef2d02210#writeContract',
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
  lordsContractAddress: '0x0124aeb495b947201f5fac96fd1138e326ad86195b98df6dec9009158a533b49',
  lordsFaucetUrl: 'https://app.avnu.fi/en?amount=100&tokenFrom=0x124aeb495b947201f5fac96fd1138e326ad86195b98df6dec9009158a533b49&tokenTo=0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
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
  [ChainId.REALMS_WORLD]: realmsWorldConfig,
  [ChainId.SN_SEPOLIA]: snSepoliaConfig,
  [ChainId.SN_MAINNET]: snMainnetConfig,
}
