import { Chain } from '@starknet-react/chains'
import { stringToFelt } from '@/lib/utils/starknet'

// based on:
// https://github.com/cartridge-gg/rollyourown/blob/market_packed/web/src/dojo/setup/chains.ts

export enum CHAIN_ID {
  SN_MAINNET = 'SN_MAINNET',
  SN_SEPOLIA = 'SN_SEPOLIA',
  LOCAL_KATANA = 'LOCAL_KATANA',
  PISTOLS_SLOT = 'PISTOLS_SLOT',
  DOJO_REALMS_WORLD = 'DOJO_REALMS_WORLD',
}

export const katanaLocalChain = {
  id: BigInt(stringToFelt(CHAIN_ID.LOCAL_KATANA)),
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
} as const satisfies Chain


export const pistolsSlotChain = {
  id: BigInt(stringToFelt(CHAIN_ID.PISTOLS_SLOT)),
  network: 'katana',
  name: 'Pistols Slot',
  nativeCurrency: {
    address: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  testnet: true,
  rpcUrls: {
    default: {
      http: ['https://api.cartridge.gg/x/pistols/katana',],
    },
    public: {
      http: ['https://api.cartridge.gg/x/pistols/katana',],
    },
  },
  explorers: {
    worlds: ['https://worlds.dev'],
  },
} as const satisfies Chain


export const realmsWorldChain = {
  id: BigInt(stringToFelt(CHAIN_ID.DOJO_REALMS_WORLD)),
  network: 'katana',
  name: 'Realms World L3',
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
} as const satisfies Chain
