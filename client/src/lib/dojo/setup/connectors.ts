import { DojoPredeployedStarknetWindowObject, DojoBurnerStarknetWindowObject } from '@rsodre/create-burner'
import { argent, braavos } from '@starknet-react/core'

export const supportedConnetorIds = {
  CONTROLLER: 'cartridge',
  ARGENT: argent().id,
  BRAAVOS: braavos().id,
  DOJO_PREDEPLOYED: DojoPredeployedStarknetWindowObject.getId(),
  DOJO_BURNER: DojoBurnerStarknetWindowObject.getId(),
}
