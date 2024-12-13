import { DojoAppConfig, ContractPolicyDecriptions, DojoManifest } from '@/lib/dojo/Dojo'
import { StarknetDomain } from 'starknet'
import { ChainId, defaultChainId } from '@/lib/dojo/setup/chainConfig'
import { makeControllerConnector } from '@/lib/dojo/hooks/useController'
import { dojoContextConfig } from '@/lib/dojo/setup/chains'
import { TYPED_DATA } from './generated/constants'
import pistols_manifest_dev from './manifests/manifest_dev.json'
import pistols_manifest_slot from './manifests/manifest_slot.json'
import pistols_manifest_staging from './manifests/manifest_staging.json'
import pistols_manifest_sepolia from './manifests/manifest_sepolia.json'

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

const namespace = 'pistols'

const contractPolicyDescriptions: ContractPolicyDecriptions = {
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

const starknetDomain: StarknetDomain = {
  name: TYPED_DATA.NAME,
  version: TYPED_DATA.VERSION,
  chainId: defaultChainId,
  revision: '1',
}

const controllerConnector = makeControllerConnector(
  manifests[defaultChainId],
  dojoContextConfig[defaultChainId].rpcUrl,
  namespace,
  contractPolicyDescriptions,
);
//------------------------

export const makeDojoAppConfig = (): DojoAppConfig => {
  return {
    manifests,
    supportedChainIds,
    defaultChainId,
    namespace,
    contractPolicyDescriptions,
    starknetDomain,
    controllerConnector,
  }
}
