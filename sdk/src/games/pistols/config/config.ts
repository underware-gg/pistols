import { StarknetDomain } from 'starknet'
import { Tokens } from '@cartridge/controller'
import { getContractByName } from '@dojoengine/core'
import {
  DojoAppConfig, ContractPolicyDescriptions, DojoManifest, SignedMessagePolicyDescriptions,
  ChainId, defaultChainId,
  makeControllerConnector,
  dojoContextConfig,
 } from '../../../dojo'
import {
  make_typed_data_PPlayerBookmark,
  make_typed_data_PPlayerOnline,
  make_typed_data_PPlayerTutorialProgress,
} from './signed_messages'
import {
  constants, models, contracts, convert_duel_progress,
} from '../../../games/pistols'
import pistols_manifest_dev from '../manifests/manifest_dev.json'
import pistols_manifest_slot from '../manifests/manifest_slot.json'
import pistols_manifest_staging from '../manifests/manifest_staging.json'
import pistols_manifest_sepolia from '../manifests/manifest_sepolia.json'

console.log(`CONSTANTS........1`, constants)

// TODO: move this here!
// import { defineContractComponents } from './generated/contractComponents'
// import { createSystemCalls } from './createSystemCalls'

const supportedChainIds: ChainId[] = [
  ChainId.PISTOLS_SLOT,
  ChainId.PISTOLS_STAGING,
  ChainId.SN_SEPOLIA,
  ChainId.KATANA_LOCAL,
  // ChainId.SN_MAINNET,
]

const manifests: Record<ChainId, DojoManifest> = {
  [ChainId.KATANA_LOCAL]: pistols_manifest_dev as DojoManifest,
  [ChainId.PISTOLS_SLOT]: pistols_manifest_slot as DojoManifest,
  [ChainId.PISTOLS_STAGING]: pistols_manifest_staging as DojoManifest,
  [ChainId.SN_SEPOLIA]: pistols_manifest_sepolia as DojoManifest,
  [ChainId.SN_MAINNET]: null,
}

export const NAMESPACE = 'pistols'

export const STARKNET_DOMAIN: StarknetDomain = {
  name: constants.TYPED_DATA.NAME,
  version: constants.TYPED_DATA.VERSION,
  chainId: defaultChainId,
  revision: '1',
}

const contractPolicyDescriptions: ContractPolicyDescriptions = {
  game: {
    name: 'Pistols Game Loop',
    description: 'Pistols Game Loop',
    interfaces: ['IGame'],
  },
  duel_token: {
    name: 'Duel Token',
    description: 'Duel Token',
    interfaces: ['IDuelTokenPublic'],
  },
  duelist_token: {
    name: 'Duelist Token',
    description: 'Duelist Token',
    interfaces: ['IDuelistTokenPublic'],
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

const signedMessagePolicyDescriptions: SignedMessagePolicyDescriptions = [
  {
    description: 'Notify the server that a player is online',
    typedData: make_typed_data_PPlayerOnline({
        identity: '0x0',
        timestamp: 0,
      }),
  },
  {
    description: 'Notify the server of a player tutorial progress',
    typedData: make_typed_data_PPlayerTutorialProgress({
        identity: '0x0',
        progress: constants.TutorialProgress.None,
      }),
  },
  {
    description: 'Notify the server that a player follows another player or token',
    typedData: make_typed_data_PPlayerBookmark({
        identity: '0x0',
        target_address: '0x0',
        target_id: '0x0',
        enabled: false,
      })
  },
]

export const getLordsAddress = () => (dojoContextConfig[defaultChainId].lordsAddress || getContractByName(manifests[defaultChainId], NAMESPACE, 'lords_mock').address)
export const getFameAddress = () => (getContractByName(manifests[defaultChainId], NAMESPACE, 'fame_coin').address)
export const getDuelistTokenAddress = () => (getContractByName(manifests[defaultChainId], NAMESPACE, 'duelist_token').address)
export const getDuelTokenAddress = () => (getContractByName(manifests[defaultChainId], NAMESPACE, 'duel_token').address)
export const getBankAddress = () => (getContractByName(manifests[defaultChainId], NAMESPACE, 'bank').address)

// tokens to display
const tokens: Tokens = {
  erc20: [
    getLordsAddress(),
    getFameAddress(),
  ],
  //@ts-ignore
  erc721: [
    getDuelistTokenAddress(),
    getDuelTokenAddress(),
  ],
}

const controllerConnector = makeControllerConnector(
  NAMESPACE,
  manifests[defaultChainId],
  dojoContextConfig[defaultChainId].rpcUrl,
  dojoContextConfig[defaultChainId].toriiUrl,
  contractPolicyDescriptions,
  signedMessagePolicyDescriptions,
  tokens,
);

export const makeDojoAppConfig = (): DojoAppConfig => {
  return {
    namespace: NAMESPACE,
    supportedChainIds,
    defaultChainId,
    starknetDomain: STARKNET_DOMAIN,
    manifests,
    contractPolicyDescriptions,
    controllerConnector,
  }
}
