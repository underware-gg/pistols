import { StarknetDomain } from 'starknet'
import { ChainId, NetworkId, NETWORKS } from './networks'
import { Messages } from 'src/starknet/starknet_sign'

//----------------------------------------
// starknet domain
// for all pistols messages
//

export const makeStarknetDomain = ({
  chainId,
  networkId,
}: {
  chainId?: string,
  networkId?: NetworkId
}): StarknetDomain => ({
  name: 'Underware_gg',
  version: '1.0.0',
  chainId: chainId ?? NETWORKS[networkId]?.chainId ?? ChainId.SN_MAIN,
  revision: '1',
})


//----------------------------------------
// typed data definitions
//

export interface CommitMoveMessage extends Messages {
  duelId: bigint,
  duelistId: bigint,
}

// generates a salt for player authentication
export interface GeneralPurposeMessage extends Messages {
  purpose: string,
}

// passed to salt server to validate a GeneralPurposeMessage
// https://discord.com/developers/docs/topics/oauth2#state-and-security
export interface GeneralPurposeState {
  chainId: string,
  playerAddress: string,
  salt: string,
  redirectUrl: string,
}

