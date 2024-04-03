import { DojoAppConfig } from '@/lib/dojo/AppDojo'
import { CHAIN_ID } from '@/lib/dojo/setup/chains'

export const makeDojoAppConfig = (): DojoAppConfig => {
  return {
    supportedChainIds: [
      CHAIN_ID.KATANA,
      CHAIN_ID.PISTOLS_SLOT,
      CHAIN_ID.DOJO_REALMS_WORLD,
    ],
  }
}
