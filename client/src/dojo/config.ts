import { DojoAppConfig } from '@/lib/dojo/Dojo'
import { ChainId, defaultChainId } from '@/lib/dojo/setup/chainConfig'
import pistols_manifest_dev from '@/generated/pistols/dev/manifest.json'
import pistols_manifest_slot from '@/generated/pistols/slot/manifest.json'

export const makeDojoAppConfig = (): DojoAppConfig => {

  const mainSystemName = 'actions'

  const supportedChainIds = [
    // ChainId.KATANA, // Realms L3
    ChainId.KATANA_LOCAL,
    ChainId.WP_PISTOLS_SLOT,
    ChainId.SN_SEPOLIA,
    // ChainId.SN_MAINNET,
  ]

  const manifests = {
    [ChainId.KATANA_LOCAL]: pistols_manifest_dev,
    [ChainId.WP_PISTOLS_SLOT]: pistols_manifest_slot,
    [ChainId.KATANA]: null, // Realms
  }

  const initialChainId = (defaultChainId || (
    process.env.NODE_ENV === 'development' ? ChainId.KATANA_LOCAL
      : process.env.NODE_ENV === 'production' ? ChainId.KATANA
        : process.env.NODE_ENV === 'test' ? ChainId.WP_PISTOLS_SLOT
          : supportedChainIds[0]
  )) as ChainId

  return {
    mainSystemName,
    supportedChainIds,
    initialChainId,
    manifests,
  }
}
