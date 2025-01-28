import { StarknetDomain } from 'starknet'
import { Tokens } from '@cartridge/controller'
import { getContractByName } from '@dojoengine/core'
import { DojoAppConfig, DojoManifest, ContractPolicyDescriptions, SignedMessagePolicyDescriptions } from 'src/dojo/contexts/Dojo'
import { ChainId, dojoContextConfig } from 'src/dojo/setup/chains'
import { DEFAULT_CHAIN_ID } from 'src/dojo/setup/chainConfig'
import { makeControllerConnector } from 'src/dojo/setup/controller'
import {
  make_typed_data_PlayerBookmark,
  make_typed_data_PlayerOnline,
} from './signed_messages'
import * as constants from '../generated/constants'
import pistols_manifest_dev from '../manifests/manifest_dev.json'
import pistols_manifest_katana from '../manifests/manifest_katana.json'
import pistols_manifest_staging from '../manifests/manifest_staging.json'
import pistols_manifest_sepolia from '../manifests/manifest_sepolia.json'


// TODO: move this here!
// import { defineContractComponents } from './generated/contractComponents'
// import { createSystemCalls } from './createSystemCalls'

const supportedChainIds: ChainId[] = [
  // ChainId.SN_MAINNET,
  ChainId.SN_SEPOLIA,
  ChainId.PISTOLS_STAGING,
  ChainId.KATANA_SLOT,
  ChainId.KATANA_LOCAL,
]

const manifests: Record<ChainId, DojoManifest> = {
  [ChainId.KATANA_LOCAL]: pistols_manifest_dev as DojoManifest,
  [ChainId.KATANA_SLOT]: pistols_manifest_katana as DojoManifest,
  [ChainId.PISTOLS_STAGING]: pistols_manifest_staging as DojoManifest,
  [ChainId.SN_SEPOLIA]: pistols_manifest_sepolia as DojoManifest,
  [ChainId.SN_MAINNET]: null,
}

export const NAMESPACE = 'pistols'

const contractPolicyDescriptions: ContractPolicyDescriptions = {
  game: {
    name: 'Game',
    description: 'Game loop contract',
    interfaces: ['IGame'],
  },
  tutorial: {
    name: 'Tutorial',
    description: 'Tutorial game contract',
    interfaces: ['ITutorial'],
  },
  duel_token: {
    name: 'Duel Token',
    description: 'Duel Token',
    interfaces: ['IDuelTokenPublic'],
  },
  // duelist_token: {
  //   name: 'Duelist Token',
  //   description: 'Duelist Token',
  //   interfaces: ['IDuelistTokenPublic'],
  // },
  pack_token: {
    name: 'Pack Token',
    description: 'Packs Token',
    interfaces: ['IPackTokenPublic'],
  },
  lords_mock: {
    name: 'Fake Lords',
    description: 'Fake Lords',
    interfaces: [
      'ILordsMockFaucet',
      // 'IERC20Allowance',
    ],
  },
  // admin: {
  //   name: 'Admin',
  //   description: 'Admin',
  //   interfaces: ['IAdmin'],
  // },
}

// starknet domain
export const makeStarknetDomain = (chainId: ChainId): StarknetDomain => ({
  name: constants.TYPED_DATA.NAME,
  version: constants.TYPED_DATA.VERSION,
  chainId,
  revision: '1',
})

// contract addresses
export const getLordsAddress = (chainId: ChainId) => (dojoContextConfig[chainId].lordsAddress || getContractByName(manifests[chainId], NAMESPACE, 'lords_mock').address)
export const getFameAddress = (chainId: ChainId) => (getContractByName(manifests[chainId], NAMESPACE, 'fame_coin').address)
export const getDuelistTokenAddress = (chainId: ChainId) => (getContractByName(manifests[chainId], NAMESPACE, 'duelist_token').address)
export const getDuelTokenAddress = (chainId: ChainId) => (getContractByName(manifests[chainId], NAMESPACE, 'duel_token').address)
export const getBankAddress = (chainId: ChainId) => (getContractByName(manifests[chainId], NAMESPACE, 'bank').address)


//------------------------------------------
// config Controller for default chain only!
//
// tokens to display
const tokens: Tokens = {
  erc20: [
    getLordsAddress(DEFAULT_CHAIN_ID),
    getFameAddress(DEFAULT_CHAIN_ID),
  ],
  //@ts-ignore
  erc721: [
    getDuelistTokenAddress(DEFAULT_CHAIN_ID),
    getDuelTokenAddress(DEFAULT_CHAIN_ID),
  ],
}
//
// Signed messages
const signedMessagePolicyDescriptions: SignedMessagePolicyDescriptions = [
  {
    description: 'Notify the server that a player is online',
    typedData: make_typed_data_PlayerOnline({
      chainId: DEFAULT_CHAIN_ID,
      identity: '0x0',
      timestamp: 0,
    }),
  },
  {
    description: 'Notify the server that a player follows another player or token',
    typedData: make_typed_data_PlayerBookmark({
      chainId: DEFAULT_CHAIN_ID,
      identity: '0x0',
      target_address: '0x0',
      target_id: '0x0',
      enabled: false,
    })
  },
]
//
// controller connector
const controllerConnector = makeControllerConnector(
  NAMESPACE,
  DEFAULT_CHAIN_ID,
  manifests[DEFAULT_CHAIN_ID],
  dojoContextConfig[DEFAULT_CHAIN_ID].rpcUrl,
  dojoContextConfig[DEFAULT_CHAIN_ID].toriiUrl,
  contractPolicyDescriptions,
  signedMessagePolicyDescriptions,
  tokens,
);
//
// END: Controller config
//--------------------------------


export const makeDojoAppConfig = (chainId?: ChainId): DojoAppConfig => {
  const selectedChainId = chainId ?? DEFAULT_CHAIN_ID
  return {
    selectedChainId,
    supportedChainIds,
    namespace: NAMESPACE,
    starknetDomain: makeStarknetDomain(selectedChainId),
    manifest: manifests[selectedChainId],
    contractPolicyDescriptions,
    controllerConnector: (selectedChainId == DEFAULT_CHAIN_ID ? controllerConnector : undefined),
  }
}
