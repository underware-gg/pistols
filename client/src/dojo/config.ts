import { DojoAppConfig } from '@/lib/dojo/Dojo'
import { defaultChainId, CHAIN_ID } from '@/lib/dojo/setup/chainConfig'
import manifest_katana from '@/generated/dev/manifest.json'
import manifest_slot from '@/generated/slot/manifest.json'

export const makeDojoAppConfig = (): DojoAppConfig => {

  const mainSystemName = 'actions'

  const supportedChainIds = [
    // CHAIN_ID.KATANA, // Realms L3
    CHAIN_ID.KATANA_LOCAL,
    CHAIN_ID.WP_PISTOLS_SLOT,
    CHAIN_ID.SN_SEPOLIA,
    // CHAIN_ID.SN_MAINNET,
  ]

  const manifests = {
    [CHAIN_ID.KATANA_LOCAL]: manifest_katana,
    [CHAIN_ID.WP_PISTOLS_SLOT]: manifest_slot,
    [CHAIN_ID.KATANA]: null, // Realms
  }

  const initialChainId = (defaultChainId || (
    process.env.NODE_ENV === 'development' ? CHAIN_ID.KATANA_LOCAL
      : process.env.NODE_ENV === 'production' ? CHAIN_ID.KATANA
        : process.env.NODE_ENV === 'test' ? CHAIN_ID.WP_PISTOLS_SLOT
          : supportedChainIds[0]
  )) as CHAIN_ID

  return {
    mainSystemName,
    supportedChainIds,
    initialChainId,
    manifests,
  }
}
