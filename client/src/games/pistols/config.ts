import { DojoAppConfig } from '@/lib/dojo/Dojo'
import { ChainId, defaultChainId } from '@/lib/dojo/setup/chainConfig'
import pistols_manifest_dev from '@/games/pistols/generated/dev/manifest.json'
import pistols_manifest_slot from '@/games/pistols/generated/slot/manifest.json'
import * as pistols_constants_dev from '@/games/pistols/generated/dev/contractConstants'
import * as pistols_constants_slot from '@/games/pistols/generated/slot/contractConstants'

export const makeDojoAppConfig = (): DojoAppConfig => {

  const mainSystemName = 'actions'

  const supportedChainIds: ChainId[] = [
    ChainId.KATANA_LOCAL,
    ChainId.PISTOLS_SLOT,
    ChainId.SN_SEPOLIA,
    // ChainId.SN_MAINNET,
    // ChainId.REALMS_WORLD,
  ]

  const manifests: Record<ChainId, any> = {
    [ChainId.KATANA_LOCAL]: pistols_manifest_dev,
    [ChainId.PISTOLS_SLOT]: pistols_manifest_slot,
    [ChainId.SN_SEPOLIA]: null,
    [ChainId.SN_MAINNET]: null,
    [ChainId.REALMS_WORLD]: null,
  }

  const constants: Record<ChainId, any> = {
    [ChainId.KATANA_LOCAL]: pistols_constants_dev,
    [ChainId.PISTOLS_SLOT]: pistols_constants_slot,
    [ChainId.SN_SEPOLIA]: null,
    [ChainId.SN_MAINNET]: null,
    [ChainId.REALMS_WORLD]: null,
  }

  const initialChainId: ChainId = (defaultChainId || (
    process.env.NODE_ENV === 'development' ? ChainId.KATANA_LOCAL
      : process.env.NODE_ENV === 'production' ? ChainId.REALMS_WORLD
        : process.env.NODE_ENV === 'test' ? ChainId.PISTOLS_SLOT
          : supportedChainIds[0]
  ))

  return {
    mainSystemName,
    supportedChainIds,
    initialChainId,
    manifests,
    constants,
  }
}
