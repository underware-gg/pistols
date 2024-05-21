import { DojoPredeployedStarknetWindowObject, DojoBurnerStarknetWindowObject } from '@dojoengine/create-burner'
import { argent, braavos } from '@starknet-react/core'

export const supportedConnetorIds = {
  ARGENT: argent().id,
  BRAAVOS: braavos().id,
  DOJO_PREDEPLOYED: DojoPredeployedStarknetWindowObject.getId(),
  DOJO_BURNER: DojoBurnerStarknetWindowObject.getId(),
}
