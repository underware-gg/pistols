import { DojoAppConfig } from '@/lib/dojo/Dojo'
import { DojoPredeployedStarknetWindowObject, DojoBurnerStarknetWindowObject } from '@dojoengine/create-burner'
import { defaultChainId, CHAIN_ID } from '@/lib/dojo/setup/chainConfig'
import manifest_katana from '@/generated/dev/manifest.json'
import manifest_slot from '@/generated/slot/manifest.json'

export const makeDojoAppConfig = (): DojoAppConfig => {

  const mainSystemName = 'actions'

  const supportedConnectorIds = [
    // argent().id,
    // braavos().id,
    // DojoBurnerStarknetWindowObject.getId(),
    DojoPredeployedStarknetWindowObject.getId(),
  ]

  const supportedChainIds = [
    CHAIN_ID.KATANA,
    CHAIN_ID.WP_PISTOLS_SLOT,
    CHAIN_ID.KATANA_LOCAL,
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
    supportedConnectorIds,
    supportedChainIds,
    initialChainId,
    manifests,
  }
}
