import { DojoAppConfig, DojoManifest } from '@/lib/dojo/Dojo'
import { ChainId, defaultChainId } from '@/lib/dojo/setup/chainConfig'
import pistols_manifest_dev from './generated/dev/manifest.json'
import pistols_manifest_slot from './generated/slot/manifest.json'
import pistols_manifest_staging from './generated/staging/manifest.json'
import pistols_manifest_sepolia from './generated/sepolia/manifest.json'

// TODO: move this here!
// import { defineContractConstants } from './generated/constants'
// import { defineContractComponents } from './generated/contractComponents'
// import { createSystemCalls } from './createSystemCalls'

const supportedChainIds: ChainId[] = [
  ChainId.PISTOLS_SLOT,
  // ChainId.PISTOLS_STAGING,
  ChainId.SN_SEPOLIA,
  ChainId.KATANA_LOCAL,
  // ChainId.SN_MAINNET,
  // ChainId.REALMS_WORLD,
]

const manifests: Record<ChainId, DojoManifest> = {
  [ChainId.KATANA_LOCAL]: pistols_manifest_dev as DojoManifest,
  [ChainId.PISTOLS_SLOT]: pistols_manifest_slot as DojoManifest,
  [ChainId.PISTOLS_STAGING]: pistols_manifest_staging as DojoManifest,
  [ChainId.SN_SEPOLIA]: pistols_manifest_sepolia as DojoManifest,
  [ChainId.SN_MAINNET]: null,
  [ChainId.REALMS_WORLD]: null,
}

export const makeDojoAppConfig = (): DojoAppConfig => {
  return {
    nameSpace: 'pistols',
    mainSystemName: 'actions',
    supportedChainIds,
    initialChainId: defaultChainId,
    manifests,
  }
}
