import { DojoAppConfig, ContractPolicyDescriptions, DojoManifest, SignedMessagePolicyDescriptions } from '@/lib/dojo/Dojo'
import { StarknetDomain, TypedData } from 'starknet'
import { ChainId, defaultChainId } from '@/lib/dojo/setup/chainConfig'
import { makeControllerConnector } from '@/lib/dojo/setup/controller'
import { dojoContextConfig } from '@/lib/dojo/setup/chains'
import { TutorialProgress, TYPED_DATA } from './generated/constants'
import pistols_manifest_dev from './manifests/manifest_dev.json'
import pistols_manifest_slot from './manifests/manifest_slot.json'
import pistols_manifest_staging from './manifests/manifest_staging.json'
import pistols_manifest_sepolia from './manifests/manifest_sepolia.json'
import { make_typed_data_PPlayerBookmark, make_typed_data_PPlayerOnline, make_typed_data_PPlayerTutorialProgress } from './signed_messages'

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
  name: TYPED_DATA.NAME,
  version: TYPED_DATA.VERSION,
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
        progress: TutorialProgress.None,
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

const controllerConnector = makeControllerConnector(
  NAMESPACE,
  manifests[defaultChainId],
  dojoContextConfig[defaultChainId].rpcUrl,
  contractPolicyDescriptions,
  signedMessagePolicyDescriptions,
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
