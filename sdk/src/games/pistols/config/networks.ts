import {
  Chain, NativeCurrency,
  mainnet, sepolia,
} from '@starknet-react/chains'
import {
  LOCAL_KATANA,
  LOCAL_TORII,
  KATANA_PREFUNDED_ADDRESS,
  KATANA_PREFUNDED_PRIVATE_KEY,
  KATANA_ETH_CONTRACT_ADDRESS,
} from '@dojoengine/core'
import { stringToFelt } from 'src/starknet/starknet'

//
// supported networks
//
export enum NetworkId {
  MAINNET = 'MAINNET',
  SEPOLIA = 'SEPOLIA',
  STAGING = 'STAGING',
  KATANA_SLOT = 'KATANA_SLOT',
  KATANA_LOCAL = 'KATANA_LOCAL',
}

//
// supported chain ids
//
export enum ChainId {
  SN_MAIN = 'SN_MAIN',
  SN_SEPOLIA = 'SN_SEPOLIA',
  KATANA_SLOT = 'WP_KATANA_SLOT',
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
// predeployed accounts
//
export type PredeployedAccount = {
  name?: string;
  address: string;
  privateKey: string;
  active?: boolean;
};

export const supportedConnetorIds = {
  CONTROLLER: 'controller',   // same as ControllerConnector.id
  PREDEPLOYED: 'predeployed', // same as PREDEPLOYED_ID
  // ARGENT: argent().id,
  // BRAAVOS: braavos().id,
}


//
// chain config
//
export type DojoNetworkConfig = {
  networkId: NetworkId
  chainId: ChainId
  chain: Chain
  name: string
  clientUrl: string
  assetsServerUrl: string
  slotName: string,
  rpcUrl: string
  toriiUrl: string
  graphqlUrl: string
  sqlUrl: string
  etherAddress: string
  lordsFaucet: boolean | string
  lordsAddress: string,
  vrfAddress: string,
  strkAddress: string
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
  networkId: undefined, // derive from NETWORKS
  chain: undefined,     // derive from this
  chainId: ChainId.KATANA_LOCAL,
  name: 'Katana Local',
  clientUrl: 'https://localhost:5173',
  assetsServerUrl: 'https://assets.underware.gg',
  rpcUrl: LOCAL_KATANA,
  slotName: undefined,
  // toriiUrl: LOCAL_TORII,
  // toriiUrl: 'http://127.0.0.1:8080',
  toriiUrl: 'http://0.0.0.0:8080',
  graphqlUrl: 'http://0.0.0.0:8080/graphql',
  sqlUrl: 'http://0.0.0.0:8080/sql',
  etherAddress: KATANA_ETH_CONTRACT_ADDRESS,
  lordsFaucet: true,
  lordsAddress: undefined,
  vrfAddress: undefined,
  strkAddress: undefined,
  predeployedAccounts: [
    {
      name: 'Local Katana Deployer',
      address: '0x127fd5f1fe78a71f8bcd1fec63e3fe2f0486b6ecd5c86a0466c3a21fa5cfcec',
      privateKey: '0xc5b2fcab997346f3ea1c00b002ecf6f382c5f9c9659a3894eb783c5320f912',
      active: false,
    },
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
const katanaSlotConfig: DojoNetworkConfig = {
  networkId: undefined, // derive from NETWORKS
  chain: undefined,     // derive from this
  chainId: ChainId.KATANA_SLOT,
  name: 'Katana Slot',
  clientUrl: undefined,
  assetsServerUrl: 'https://assets.underware.gg',
  slotName: 'pistols-slot',
  rpcUrl: 'https://api.cartridge.gg/x/pistols-slot/katana',
  toriiUrl: undefined,    // derive from slotName
  graphqlUrl: undefined,  // derive from slotName
  sqlUrl: undefined,      // derive from slotName
  etherAddress: KATANA_ETH_CONTRACT_ADDRESS,
  lordsFaucet: true,
  lordsAddress: undefined,
  vrfAddress: undefined,
  strkAddress: undefined,
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
  networkId: undefined, // derive from NETWORKS
  chain: { ...sepolia },
  chainId: ChainId.SN_SEPOLIA,
  name: 'Sepolia Staging',
  clientUrl: 'https://stage.pistols.gg',
  assetsServerUrl: 'https://assets.underware.gg',
  slotName: 'pistols-staging',
  rpcUrl: 'https://api.cartridge.gg/x/starknet/sepolia',
  toriiUrl: undefined,    // derive from slotName
  graphqlUrl: undefined,  // derive from slotName
  sqlUrl: undefined,      // derive from slotName
  etherAddress: sepolia.nativeCurrency.address,
  lordsFaucet: true,
  // lordsFaucet: 'https://sepolia.voyager.online/contract/0x044e6bcc627e6201ce09f781d1aae44ea4c21c2fdef299e34fce55bef2d02210#writeContract',
  lordsAddress: '0x044e6bcc627e6201ce09f781d1aae44ea4c21c2fdef299e34fce55bef2d02210',
  vrfAddress: '0x051fea4450da9d6aee758bdeba88b2f665bcbf549d2c61421aa724e9ac0ced8f',
  strkAddress: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
  predeployedAccounts: [],
  connectorIds: [
    supportedConnetorIds.CONTROLLER,
  ],
} as const

const snSepoliaConfig: DojoNetworkConfig = {
  networkId: undefined, // derive from NETWORKS
  chain: { ...sepolia },
  chainId: ChainId.SN_SEPOLIA,
  name: 'Sepolia Testnet',
  clientUrl: 'https://testnet.pistols.gg',
  assetsServerUrl: 'https://assets.underware.gg',
  slotName: 'pistols-sepolia',
  rpcUrl: 'https://api.cartridge.gg/x/starknet/sepolia',
  toriiUrl: undefined,    // derive from slotName
  graphqlUrl: undefined,  // derive from slotName
  sqlUrl: undefined,      // derive from slotName
  etherAddress: sepolia.nativeCurrency.address,
  lordsFaucet: true,
  // lordsFaucet: 'https://sepolia.voyager.online/contract/0x044e6bcc627e6201ce09f781d1aae44ea4c21c2fdef299e34fce55bef2d02210#writeContract',
  lordsAddress: '0x044e6bcc627e6201ce09f781d1aae44ea4c21c2fdef299e34fce55bef2d02210',
  vrfAddress: '0x051fea4450da9d6aee758bdeba88b2f665bcbf549d2c61421aa724e9ac0ced8f',
  strkAddress: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
  predeployedAccounts: [],
  connectorIds: [
    supportedConnetorIds.CONTROLLER,
  ],
} as const

const snMainnetConfig: DojoNetworkConfig = {
  networkId: undefined, // derive from NETWORKS
  chain: { ...mainnet },
  chainId: ChainId.SN_MAIN,
  name: 'Mainnet',
  clientUrl: 'https://play.pistols.gg',
  assetsServerUrl: 'https://assets.underware.gg',
  slotName: 'pistols-mainnet',
  rpcUrl: 'https://api.cartridge.gg/x/starknet/mainnet',
  toriiUrl: undefined,    // derive from slotName
  graphqlUrl: undefined,  // derive from slotName
  sqlUrl: undefined,      // derive from slotName
  etherAddress: mainnet.nativeCurrency.address,
  lordsFaucet: 'https://app.ekubo.org/?inputCurrency=ETH&outputCurrency=LORDS',
  lordsAddress: '0x124aeb495b947201f5fac96fd1138e326ad86195b98df6dec9009158a533b49',
  vrfAddress: '0x051fea4450da9d6aee758bdeba88b2f665bcbf549d2c61421aa724e9ac0ced8f',
  strkAddress: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
  predeployedAccounts: [],
  connectorIds: [
    supportedConnetorIds.CONTROLLER,
  ],
} as const


//--------------------------------
// Available chains
//

const NETWORKS: Record<NetworkId, DojoNetworkConfig> = {
  [NetworkId.MAINNET]: snMainnetConfig,
  [NetworkId.SEPOLIA]: snSepoliaConfig,
  [NetworkId.STAGING]: pistolsStagingConfig,
  [NetworkId.KATANA_SLOT]: katanaSlotConfig,
  [NetworkId.KATANA_LOCAL]: localKatanaConfig,
}

export interface DojoNetworkEnv {
  CLIENT_URL?: string,
  ASSETS_SERVER_URL?: string,
  SLOT_NAME?: string,
  RPC_URL?: string,
  TORII_URL?: string,
  TORII_GRAPHQL_URL?: string,
  TORII_SQL_URL?: string,
}
export const getNetworkConfig = (networkId: NetworkId, env?: DojoNetworkEnv): DojoNetworkConfig => {
  if (!NETWORKS[networkId]) return undefined
  // get base config
  let result: DojoNetworkConfig = {
    ...NETWORKS[networkId],
  }
  // set networkId
  result.networkId = networkId

  // resolve urls with ENV
  result.clientUrl = (env?.CLIENT_URL || result.clientUrl || '/');
  result.assetsServerUrl = (env?.ASSETS_SERVER_URL || result.assetsServerUrl || 'https://assets.underware.gg');
  result.slotName = (env?.SLOT_NAME || result.slotName);
  result.rpcUrl = (env?.RPC_URL || result.rpcUrl);
  result.toriiUrl = (env?.TORII_URL || result.toriiUrl || `https://api.cartridge.gg/x/${result.slotName}/torii`);
  result.graphqlUrl = (env?.TORII_GRAPHQL_URL || result.graphqlUrl || `https://api.cartridge.gg/x/${result.slotName}/torii/graphql`);
  result.sqlUrl = (env?.TORII_SQL_URL || result.sqlUrl || `https://api.cartridge.gg/x/${result.slotName}/torii/sql`);

  if (!result.rpcUrl) {
    throw new Error(`Network [${networkId}] and .env missing: RPC_URL`);
  }
  if (!result.slotName && !result.toriiUrl) {
    throw new Error(`Network [${networkId}] and .env missing: SLOT_NAME or TORII_URL`);
  }
  if (!result.slotName && !result.graphqlUrl) {
    throw new Error(`Network [${networkId}] and .env missing: SLOT_NAME or TORII_GRAPHQL_URL`);
  }
  if (!result.slotName && !result.sqlUrl) {
    throw new Error(`Network [${networkId}] and .env missing: SLOT_NAME or TORII_SQL_URL`);
  }

  // derive starknet Chain
  if (!result.chain) {
    result.chain = {
      id: BigInt(stringToFelt(result.chainId)),
      name: result.name,
      network: result.network ?? 'katana',
      testnet: result.testnet ?? true,
      nativeCurrency: result.nativeCurrency,
      rpcUrls: {
        default: { http: [] },
        public: { http: [] },
      },
      explorers: result.explorers,
    } as Chain
  }

  // use Cartridge RPCs
  if (result.rpcUrl) {
    result.chain.rpcUrls.default.http = [result.rpcUrl]
    result.chain.rpcUrls.public.http = [result.rpcUrl]
  }

  return result
}

export const getChains = (): Chain[] => {
  return Object.keys(NETWORKS)
    .map((networkId) => getNetworkConfig(networkId as NetworkId).chain)
    // remove duplicates
    .filter((value, index, array) => (array.findIndex(v => v.id === value.id) === index))
}
