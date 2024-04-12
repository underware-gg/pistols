import { DojoAppConfig } from '@/lib/dojo/Dojo'
import { CHAIN_ID } from '@/lib/dojo/setup/chains'
import manifest_katana from '@/generated/dev/manifest.json'
import manifest_slot from '@/generated/slot/manifest.json'
// use any manifest while not deployed, world will not be found
import manifest_realms from '@/generated/dev/manifest.json'

export const makeDojoAppConfig = (): DojoAppConfig => {

  const supportedChainIds = [
    CHAIN_ID.KATANA,
    CHAIN_ID.PISTOLS_SLOT,
    CHAIN_ID.DOJO_REALMS_WORLD,
  ]

  const manifests = {
    [CHAIN_ID.KATANA]: manifest_katana,
    [CHAIN_ID.PISTOLS_SLOT]: manifest_slot,
    [CHAIN_ID.DOJO_REALMS_WORLD]: manifest_realms,
  }

  const defaultChainId = (process.env.NEXT_PUBLIC_CHAIN_ID || (
    process.env.NODE_ENV === 'development' ? CHAIN_ID.KATANA
      : process.env.NODE_ENV === 'production' ? CHAIN_ID.DOJO_REALMS_WORLD
        : process.env.NODE_ENV === 'test' ? CHAIN_ID.PISTOLS_SLOT
          : supportedChainIds[0]
  )) as CHAIN_ID

  return {
    supportedChainIds,
    defaultChainId,
    manifests,
  }
}
