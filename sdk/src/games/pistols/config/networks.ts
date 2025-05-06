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
import { supportedConnetorIds } from 'src/dojo/setup/connectors'
import { PredeployedAccount } from 'src/utils/starknet/predeployed'
import { stringToFelt } from 'src/utils/starknet/starknet'

//
// supported networks
//
export enum NetworkId {
  MAINNET = 'MAINNET',
  SEPOLIA = 'SEPOLIA',
  ACADEMY = 'ACADEMY',
  STAGING = 'STAGING',
  KATANA_LOCAL = 'KATANA_LOCAL',
}

//
// supported chain ids
//
export enum ChainId {
  SN_MAIN = 'SN_MAIN',
  SN_SEPOLIA = 'SN_SEPOLIA',
  PISTOLS_ACADEMY = 'WP_PISTOLS_ACADEMY',
  PISTOLS_STAGING = 'WP_PISTOLS_STAGING',
  KATANA_LOCAL = 'KATANA_LOCAL',
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
export type DojoNetworkConfig = {
  networkId: NetworkId
  chainId: ChainId
  chain: Chain
  name: string
  rpcUrl: string
  toriiUrl: string
  graphqlUrl: string
  relayUrl: string
  accountClassHash: string
  etherAddress: string
  lordsFaucet: boolean | string
  lordsAddress: string,
  vrfAddress: string,
  predeployedAccounts: PredeployedAccount[]
  connectorIds: string[]
  // starknet Chain
  network?: string
  testnet?: boolean
  nativeCurrency?: NativeCurrency
  explorers?: ChainExplorers
}

//--------------------------------
// Local Katana
//
const localKatanaConfig: DojoNetworkConfig = {
  networkId: undefined, // derive from this
  chain: undefined, // derive from this
  chainId: ChainId.KATANA_LOCAL,
  name: 'Katana Local',
  rpcUrl: LOCAL_KATANA,
  // toriiUrl: LOCAL_TORII,
  // toriiUrl: 'http://127.0.0.1:8080',
  toriiUrl: 'http://0.0.0.0:8080',
  graphqlUrl: 'http://0.0.0.0:8080/graphql',
  relayUrl: '/ip4/127.0.0.1/tcp/9090',
  // relayUrl: '/ip4/127.0.0.1/tcp/9090/tcp/80',
  accountClassHash: KATANA_CLASS_HASH,
  etherAddress: KATANA_ETH_CONTRACT_ADDRESS,
  lordsFaucet: true,
  lordsAddress: undefined,
  vrfAddress: undefined,
  predeployedAccounts: [
    {
      name: 'Local Katana 1',
      address: '0x13d9ee239f33fea4f8785b9e3870ade909e20a9599ae7cd62c1c292b73af1b7',
      privateKey: '0x1c9053c053edf324aec366a34c6901b1095b07af69495bffec7d7fe21effb1b',
      active: true,
    },
    {
      name: 'Local Katana 2',
      address: '0x17cc6ca902ed4e8baa8463a7009ff18cc294fa85a94b4ce6ac30a9ebd6057c7',
      privateKey: '0x14d6672dcb4b77ca36a887e9a11cd9d637d5012468175829e9c6e770c61642',
      active: true,
    },
    {
      name: 'Local Katana 3',
      address: '0x2af9427c5a277474c079a1283c880ee8a6f0f8fbf73ce969c08d88befec1bba',
      privateKey: '0x1800000000300000180000000000030000000000003006001800006600',
      active: true,
    },
    {
      name: 'Local Katana 4',
      address: '0x359b9068eadcaaa449c08b79a367c6fdfba9448c29e96934e3552dab0fdd950',
      privateKey: '0x2bbf4f9fd0bbb2e60b0316c1fe0b76cf7a4d0198bd493ced9b8df2a3a24d68a',
      active: true,
    },
    {
      name: 'Local Katana 5',
      address: '0x4184158a64a82eb982ff702e4041a49db16fa3a18229aac4ce88c832baf56e4',
      privateKey: '0x6bf3604bcb41fed6c42bcca5436eeb65083a982ff65db0dc123f65358008b51',
      active: true,
    },
    {
      name: 'Local Katana 6',
      address: '0x42b249d1633812d903f303d640a4261f58fead5aa24925a9efc1dd9d76fb555',
      privateKey: '0x283d1e73776cd4ac1ac5f0b879f561bded25eceb2cc589c674af0cec41df441',
      active: true,
    },
    {
      name: 'Local Katana 7',
      address: '0x4e0b838810cb1a355beb7b3d894ca0e98ee524309c3f8b7cccb15a48e6270e2',
      privateKey: '0x736adbbcdac7cc600f89051db1abbc16b9996b46f6b58a9752a11c1028a8ec8',
      active: true,
    },
    {
      name: 'Local Katana 8',
      address: '0x5b6b8189bb580f0df1e6d6bec509ff0d6c9be7365d10627e0cf222ec1b47a71',
      privateKey: '0x33003003001800009900180300d206308b0070db00121318d17b5e6262150b',
      active: true,
    },
    {
      name: 'Local Katana 9',
      address: '0x6677fe62ee39c7b07401f754138502bab7fac99d2d3c5d37df7d1c6fab10819',
      privateKey: '0x3e3979c1ed728490308054fe357a9f49cf67f80f9721f44cc57235129e090f4',
      active: true,
    },
  ],
  connectorIds: [
    supportedConnetorIds.PREDEPLOYED,
    supportedConnetorIds.CONTROLLER,
  ],
  // starknet Chain
  nativeCurrency: ETH_KATANA,
  explorers: WORLD_EXPLORER,
} as const


//--------------------------------
// Slot Katana
//
const academySlotConfig: DojoNetworkConfig = {
  networkId: undefined, // derive from this
  chain: undefined, // derive from this
  chainId: ChainId.PISTOLS_ACADEMY,
  name: 'Katana Academy',
  rpcUrl: 'https://api.cartridge.gg/x/pistols-academy/katana',
  toriiUrl: 'https://api.cartridge.gg/x/pistols-academy/torii',
  graphqlUrl: 'https://api.cartridge.gg/x/pistols-academy/torii/graphql',
  relayUrl: '/dns4/api.cartridge.gg/tcp/443/x-parity-wss/%2Fx%2Fpistols-academy%2Ftorii%2Fwss',
  accountClassHash: KATANA_CLASS_HASH,
  etherAddress: KATANA_ETH_CONTRACT_ADDRESS,
  lordsFaucet: true,
  lordsAddress: undefined,
  vrfAddress: undefined,
  predeployedAccounts: [
    {
      name: 'Katana 1',
      address: '0x13d9ee239f33fea4f8785b9e3870ade909e20a9599ae7cd62c1c292b73af1b7',
      privateKey: '0x1c9053c053edf324aec366a34c6901b1095b07af69495bffec7d7fe21effb1b',
      // active: true,
    },
    {
      name: 'Katana 2',
      address: '0x17cc6ca902ed4e8baa8463a7009ff18cc294fa85a94b4ce6ac30a9ebd6057c7',
      privateKey: '0x14d6672dcb4b77ca36a887e9a11cd9d637d5012468175829e9c6e770c61642',
      // active: true,
    },
    {
      name: 'Katana 3',
      address: '0x2af9427c5a277474c079a1283c880ee8a6f0f8fbf73ce969c08d88befec1bba',
      privateKey: '0x1800000000300000180000000000030000000000003006001800006600',
      active: true,
    },
    {
      name: 'Katana 9',
      address: '0x6677fe62ee39c7b07401f754138502bab7fac99d2d3c5d37df7d1c6fab10819',
      privateKey: '0x3e3979c1ed728490308054fe357a9f49cf67f80f9721f44cc57235129e090f4',
      active: true,
    },
  ],
  connectorIds: [
    supportedConnetorIds.PREDEPLOYED,
  ],
  // starknet Chain
  nativeCurrency: ETH_KATANA,
  explorers: WORLD_EXPLORER,
} as const


//-------------------------------
// Starknet
//

const pistolsStagingConfig: DojoNetworkConfig = {
  networkId: undefined, // derive from this
  chain: { ...sepolia },
  chainId: ChainId.SN_SEPOLIA,
  name: 'Sepolia Staging',
  rpcUrl: 'https://api.cartridge.gg/x/starknet/sepolia',
  toriiUrl: 'https://api.cartridge.gg/x/pistols-staging/torii',
  graphqlUrl: 'https://api.cartridge.gg/x/pistols-staging/torii/graphql',
  relayUrl: '/dns4/api.cartridge.gg/tcp/443/x-parity-wss/%2Fx%2Fpistols-staging%2Ftorii%2Fwss',
  accountClassHash: KATANA_CLASS_HASH,
  etherAddress: sepolia.nativeCurrency.address,
  lordsFaucet: true,
  // lordsFaucet: 'https://sepolia.voyager.online/contract/0x044e6bcc627e6201ce09f781d1aae44ea4c21c2fdef299e34fce55bef2d02210#writeContract',
  lordsAddress: '0x044e6bcc627e6201ce09f781d1aae44ea4c21c2fdef299e34fce55bef2d02210',
  vrfAddress: '0x051fea4450da9d6aee758bdeba88b2f665bcbf549d2c61421aa724e9ac0ced8f',
  predeployedAccounts: [],
  connectorIds: [
    supportedConnetorIds.CONTROLLER,
  ],
} as const

const snSepoliaConfig: DojoNetworkConfig = {
  networkId: undefined, // derive from this
  chain: { ...sepolia },
  chainId: ChainId.SN_SEPOLIA,
  name: 'Sepolia Testnet',
  rpcUrl: 'https://api.cartridge.gg/x/starknet/sepolia',
  toriiUrl: 'https://api.cartridge.gg/x/pistols-sepolia/torii',
  graphqlUrl: 'https://api.cartridge.gg/x/pistols-sepolia/torii/graphql',
  relayUrl: '/dns4/api.cartridge.gg/tcp/443/x-parity-wss/%2Fx%2Fpistols-sepolia%2Ftorii%2Fwss',
  accountClassHash: KATANA_CLASS_HASH,
  etherAddress: sepolia.nativeCurrency.address,
  lordsFaucet: true,
  // lordsFaucet: 'https://sepolia.voyager.online/contract/0x044e6bcc627e6201ce09f781d1aae44ea4c21c2fdef299e34fce55bef2d02210#writeContract',
  lordsAddress: '0x044e6bcc627e6201ce09f781d1aae44ea4c21c2fdef299e34fce55bef2d02210',
  vrfAddress: '0x051fea4450da9d6aee758bdeba88b2f665bcbf549d2c61421aa724e9ac0ced8f',
  predeployedAccounts: [],
  connectorIds: [
    supportedConnetorIds.CONTROLLER,
  ],
} as const

const snMainnetConfig: DojoNetworkConfig = {
  networkId: undefined, // derive from this
  chain: { ...mainnet },
  chainId: ChainId.SN_MAIN,
  name: 'Mainnet',
  // rpcUrl: 'https://api.cartridge.gg/rpc/starknet',
  rpcUrl: 'https://api.cartridge.gg/x/starknet/mainnet',
  toriiUrl: undefined,
  graphqlUrl: undefined,
  relayUrl: undefined,
  accountClassHash: undefined,
  etherAddress: mainnet.nativeCurrency.address,
  lordsFaucet: false,
  lordsAddress: '0x124aeb495b947201f5fac96fd1138e326ad86195b98df6dec9009158a533b49',
  vrfAddress: '0x051fea4450da9d6aee758bdeba88b2f665bcbf549d2c61421aa724e9ac0ced8f',
  predeployedAccounts: [],
  connectorIds: [
    supportedConnetorIds.CONTROLLER,
  ],
} as const


//--------------------------------
// Available chains
//

const makeDojoNetworkConfig = (networkId: NetworkId, config: DojoNetworkConfig): DojoNetworkConfig => {
  let network = { ...config }
  //
  // set networkId
  network.networkId = networkId
  //
  // derive starknet Chain
  if (!network.chain) {
    network.chain = {
      id: BigInt(stringToFelt(network.chainId)),
      name: network.name,
      network: network.network ?? 'katana',
      testnet: network.testnet ?? true,
      nativeCurrency: network.nativeCurrency,
      rpcUrls: {
        default: { http: [] },
        public: { http: [] },
      },
      explorers: network.explorers,
    } as Chain
  }
  //
  // use Cartridge RPCs
  if (network.rpcUrl) {
    network.chain.rpcUrls.default.http = [network.rpcUrl]
    network.chain.rpcUrls.public.http = [network.rpcUrl]
  }
  // console.log(networkConfig)

  return network
}

export const NETWORKS: Record<NetworkId, DojoNetworkConfig> = {
  [NetworkId.MAINNET]: makeDojoNetworkConfig(NetworkId.MAINNET, snMainnetConfig),
  [NetworkId.SEPOLIA]: makeDojoNetworkConfig(NetworkId.SEPOLIA, snSepoliaConfig),
  [NetworkId.ACADEMY]: makeDojoNetworkConfig(NetworkId.ACADEMY, academySlotConfig),
  [NetworkId.STAGING]: makeDojoNetworkConfig(NetworkId.STAGING, pistolsStagingConfig),
  [NetworkId.KATANA_LOCAL]: makeDojoNetworkConfig(NetworkId.KATANA_LOCAL, localKatanaConfig),
}
