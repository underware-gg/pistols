import { StarknetDomain } from 'starknet'
import { SessionPolicies, Tokens } from '@cartridge/controller'
import { getContractByName } from '@dojoengine/core'
import { DojoAppConfig, DojoManifest, ContractPolicyDescriptions, SignedMessagePolicyDescriptions } from 'src/dojo/contexts/Dojo'
import { ChainId, dojoContextConfig } from 'src/dojo/setup/chains'
import { DEFAULT_CHAIN_ID } from 'src/dojo/setup/chainConfig'
import { makeControllerConnector, makeControllerPolicies } from 'src/dojo/setup/controller'
import {
  make_typed_data_PlayerBookmark,
  make_typed_data_PlayerOnline,
} from './signed_messages'
import * as constants from '../generated/constants'
import pistols_manifest_dev from '../manifests/manifest_dev.json'
import pistols_manifest_katana from '../manifests/manifest_katana.json'
import pistols_manifest_staging from '../manifests/manifest_staging.json'
import pistols_manifest_sepolia from '../manifests/manifest_sepolia.json'
import pistols_manifest_mainnet from '../manifests/manifest_mainnet.json'

// TODO: move this here!
// import { defineContractComponents } from './generated/contractComponents'
// import { createSystemCalls } from './createSystemCalls'

const supportedChainIds: ChainId[] = [
  // ChainId.SN_MAIN,
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
  [ChainId.SN_MAIN]: pistols_manifest_mainnet as DojoManifest,
}

export const NAMESPACE = 'pistols'

const contractPolicyDescriptions_pistols: ContractPolicyDescriptions = {
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
  pack_token: {
    name: 'Pack token',
    description: 'Packs ERC721 contract',
    interfaces: ['IPackTokenPublic'],
  },
  duel_token: {
    name: 'Duel token',
    description: 'Duel ERC721 contract',
    interfaces: ['IDuelTokenPublic'],
  },
  // duelist_token: {
  //   name: 'Duelist token',
  //   description: 'Duelist ERC721 contract',
  //   interfaces: ['IDuelistTokenPublic'],
  // },
}
const contractPolicyDescriptions_mock: ContractPolicyDescriptions = {
  lords_mock: {
    name: 'Fake Lords',
    description: 'Fake Lords ERC20 contract',
    interfaces: [
      'ILordsMockPublic',
      // 'IERC20Allowance',
    ],
  },
}
const contractPolicyDescriptions_admin: ContractPolicyDescriptions = {
  admin: {
    name: 'Admin',
    description: 'Admin',
    interfaces: ['IAdmin'],
  },
}
export const makePistolsPolicies = (chainId: ChainId, mock: boolean, admin: boolean): SessionPolicies => {
  return makeControllerPolicies(
    NAMESPACE,
    manifests[chainId],
    {
      ...contractPolicyDescriptions_pistols,
      ...(mock ? contractPolicyDescriptions_mock : {}),
      ...(admin ? contractPolicyDescriptions_admin : {}),
    },
    signedMessagePolicyDescriptions,
  );
};

// starknet domain
export const makeStarknetDomain = (chainId: ChainId): StarknetDomain => ({
  name: constants.TYPED_DATA.NAME,
  version: constants.TYPED_DATA.VERSION,
  chainId,
  revision: '1',
})

// contract addresses
// erc-20
export const getLordsAddress = (chainId: ChainId): string => (dojoContextConfig[chainId].lordsAddress || (getContractByName(manifests[chainId], NAMESPACE, 'lords_mock')?.address ?? '0x0'))
export const getFameAddress = (chainId: ChainId): string => (getContractByName(manifests[chainId], NAMESPACE, 'fame_coin')?.address ?? '0x0')
// export const getFoolsAddress = (chainId: ChainId): string => (getContractByName(manifests[chainId], NAMESPACE, 'fools_coin')?.address ?? '0x0')
// erc-721
export const getDuelistTokenAddress = (chainId: ChainId): string => (getContractByName(manifests[chainId], NAMESPACE, 'duelist_token')?.address ?? '0x0')
export const getDuelTokenAddress = (chainId: ChainId): string => (getContractByName(manifests[chainId], NAMESPACE, 'duel_token')?.address ?? '0x0')
export const getPackTokenAddress = (chainId: ChainId): string => (getContractByName(manifests[chainId], NAMESPACE, 'pack_token')?.address ?? '0x0')
// contracts
export const getBankAddress = (chainId: ChainId): string => (getContractByName(manifests[chainId], NAMESPACE, 'bank')?.address ?? '0x0')


//------------------------------------------
// config Controller for default chain only!
//
// tokens to display
const tokens: Tokens = {
  erc20: [
    getLordsAddress(DEFAULT_CHAIN_ID),
    getFameAddress(DEFAULT_CHAIN_ID),
    // getFoolsAddress(DEFAULT_CHAIN_ID),
  ],
  //@ts-ignore
  erc721: [
    getDuelistTokenAddress(DEFAULT_CHAIN_ID),
    getDuelTokenAddress(DEFAULT_CHAIN_ID),
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
const policies = (DEFAULT_CHAIN_ID === ChainId.SN_MAIN ? undefined
  : makePistolsPolicies(DEFAULT_CHAIN_ID, !Boolean(dojoContextConfig[DEFAULT_CHAIN_ID].lordsAddress), false)
)
const controllerConnector = makeControllerConnector(
  'pistols', // theme
  NAMESPACE,
  DEFAULT_CHAIN_ID,
  dojoContextConfig[DEFAULT_CHAIN_ID].rpcUrl,
  dojoContextConfig[DEFAULT_CHAIN_ID].toriiUrl,
  policies,
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
    mainContractName: Object.keys(contractPolicyDescriptions_pistols)[0],
    controllerConnector: (selectedChainId == DEFAULT_CHAIN_ID ? controllerConnector : undefined),
  }
}
