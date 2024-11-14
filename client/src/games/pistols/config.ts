import { DojoAppConfig, DojoManifest } from '@/lib/dojo/Dojo'
import { ChainId, defaultChainId } from '@/lib/dojo/setup/chainConfig'
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

const NAMESPACE = 'pistols'

const CONTRACT_INTERFACES = {
  game: ['IGame'],
  duel_token: ['IDuelTokenPublic'],
  duelist_token: ['IDuelistTokenPublic'],
  lords_mock: [
    'ILordsMockFaucet',
    // 'IERC20Allowance',
  ],
  // admin: ['IAdmin'],
}

//------------------------ 
// TODO: REMOVE THIS!
//
import { makeControllerConnector } from '@/lib/dojo/hooks/useController'
import { dojoContextConfig } from '@/lib/dojo/setup/chains'
const CONTROLLER = makeControllerConnector(
  manifests[defaultChainId],
  dojoContextConfig[defaultChainId].rpcUrl,
  NAMESPACE,
  CONTRACT_INTERFACES
);
//------------------------

export const makeDojoAppConfig = (): DojoAppConfig => {
  return {
    manifests,
    supportedChainIds,
    initialChainId: defaultChainId,
    nameSpace: NAMESPACE,
    contractInterfaces: CONTRACT_INTERFACES,
    starknetDomain: {
      name: TYPED_DATA.NAME,
      version: TYPED_DATA.VERSION,
      chainId: defaultChainId,
      revision: '1',
    },
    controllerConnector: CONTROLLER,
  }
}
