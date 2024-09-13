import { DojoPredeployedStarknetWindowObject } from '@dojoengine/create-burner'
import { argent, braavos } from '@starknet-react/core'

export const supportedConnetorIds = {
  CONTROLLER: 'controller',
  // ARGENT: argent().id,
  // BRAAVOS: braavos().id,
  DOJO_PREDEPLOYED: DojoPredeployedStarknetWindowObject.getId(),
}
