import { Chain } from '@starknet-react/chains'
import { stringToFelt } from '@/lib/utils/starknet'

export enum CHAIN_ID {
  SN_MAINNET = 'SN_MAINNET',
  SN_SEPOLIA = 'SN_SEPOLIA',
  KATANA_LOCAL = 'KATANA_LOCAL',
  WP_PISTOLS_SLOT = 'WP_PISTOLS_SLOT',
  KATANA = 'KATANA', // actually DOJO_REALMS_WORLD
}

export const katanaLocalChain: Chain = {
  id: BigInt(stringToFelt(CHAIN_ID.KATANA_LOCAL)),
  network: 'katana',
  name: 'Katana Local',
  nativeCurrency: {
    address: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  testnet: true,
  rpcUrls: {
    default: {
      http: ['http://localhost:5050',],
    },
    public: {
      http: ['http://localhost:5050',],
    },
  },
  explorers: {
    worlds: ['https://worlds.dev'],
  },
} as const


export const pistolsSlotChain: Chain = {
  id: BigInt(stringToFelt(CHAIN_ID.WP_PISTOLS_SLOT)),
  network: 'katana',
  name: 'Slot Testnet (Free)',
  nativeCurrency: {
    address: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  testnet: true,
  rpcUrls: {
    default: {
      http: ['https://api.cartridge.gg/x/pistols-slot/katana',],
    },
    public: {
      http: ['https://api.cartridge.gg/x/pistols-slot/katana',],
    },
  },
  explorers: {
    worlds: ['https://worlds.dev'],
  },
} as const


export const realmsWorldChain: Chain = {
  id: BigInt(stringToFelt(CHAIN_ID.KATANA)),
  network: 'katana',
  name: 'Realms World (Ranked)',
  nativeCurrency: {
    address: '0x51205c5e6ac3ad5691c28c0c5ffcdd62c70bddb63612f75a4bac9b2a85b9449',
    name: 'Lords',
    symbol: 'LORDS',
    decimals: 18,
  },
  testnet: true,
  rpcUrls: {
    default: {
      http: ['https://api.cartridge.gg/x/realms/katana',],
    },
    public: {
      http: ['https://api.cartridge.gg/x/realms/katana',],
    },
  },
  explorers: {
    worlds: ['https://worlds.dev'],
  },
} as const
