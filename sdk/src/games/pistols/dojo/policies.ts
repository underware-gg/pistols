import type { SessionPolicies } from '@cartridge/presets'
import type { DojoAppConfig, ContractPolicyDescriptions, SignedMessagePolicyDescriptions } from 'src/dojo/contexts/Dojo'
import { NetworkId } from 'src/games/pistols/config/networks'
import { makeControllerPolicies } from 'src/dojo/setup/controller'
import {
  NAMESPACE,
  makeStarknetDomain,
  getManifest,
  getVrfAddress,
} from 'src/games/pistols/config/config'
import {
  make_typed_data_CommitMoveMessage,
  make_typed_data_GeneralPurposeMessage,
  make_typed_data_PlayerOnline,
} from './signed_messages'
import { Connector } from '@starknet-react/core'


//----------------------------------------
// policies
//
const contractPolicyDescriptions_pistols: ContractPolicyDescriptions = {
  game: {
    name: 'Game',
    description: 'Game loop contract',
    interfaces: ['IGame'],
  },
  // tutorial: {
  //   name: 'Tutorial',
  //   description: 'Tutorial game contract',
  //   interfaces: ['ITutorial'],
  // },
  bank: {
    name: 'Bank',
    description: 'Bank contract',
    interfaces: ['IBankPublic'],
  },
  pack_token: {
    name: 'Pack token',
    description: 'Packs ERC721 contract',
    interfaces: ['IPackTokenPublic'],
  },
  duel_token: {
    name: 'Duel token',
    description: 'Duel ERC721 contract',
    interfaces: ['IDuelTokenPublic'],
  },
  duelist_token: {
    name: 'Duelist token',
    description: 'Duelist ERC721 contract',
    interfaces: ['IDuelistTokenPublic'],
  },
  tournament_token: {
    name: 'Tournament token',
    description: 'Tournament ERC721 contract',
    interfaces: ['ITournamentTokenPublic'],
  },
}
const contractPolicyDescriptions_mock: ContractPolicyDescriptions = {
  lords_mock: {
    name: 'Fake Lords',
    description: 'Fake Lords ERC20 contract',
    interfaces: [
      'ILordsMockPublic',
      // 'IERC20Allowance',
    ],
  },
}
const contractPolicyDescriptions_admin: ContractPolicyDescriptions = {
  admin: {
    name: 'Admin',
    description: 'Admin',
    interfaces: ['IAdmin'],
  },
}
const contractPolicyDescriptions_vrf = (networkId: NetworkId): ContractPolicyDescriptions => ({
  vrf: {
    name: 'VRF',
    description: 'Cartridge VRF Provider',
    contract_address: getVrfAddress(networkId),
    methods: [
      {
        entrypoint: 'request_random',
        description: 'Request a random number',
      },
    ]
  },
})

export const makePistolsPolicies = (networkId: NetworkId, mock: boolean, admin: boolean): SessionPolicies => {
  const signedMessagePolicyDescriptions: SignedMessagePolicyDescriptions = [
    {
      description: 'Verify the identity of a player in a Duel',
      typedData: make_typed_data_CommitMoveMessage(makeStarknetDomain(networkId), {
        duelId: 0n,
        duelistId: 0n,
      }),
    },
    {
      description: 'General purpose authorization message',
      typedData: make_typed_data_GeneralPurposeMessage(makeStarknetDomain(networkId), {
        purpose: 'Purpose',
      }),
    },
    {
      description: 'Notify when a player is online',
      typedData: make_typed_data_PlayerOnline({
        networkId: networkId,
        identity: '0x0',
        timestamp: 0,
      }),
    },
  ]
  return makeControllerPolicies(
    NAMESPACE,
    getManifest(networkId),
    {
      ...contractPolicyDescriptions_pistols,
      ...(mock ? contractPolicyDescriptions_mock : {}),
      ...(admin ? contractPolicyDescriptions_admin : {}),
      ...contractPolicyDescriptions_vrf(networkId),
    },
    signedMessagePolicyDescriptions,
  );
};


export const makeDojoAppConfig = (networkId: NetworkId, controllerConnector: Connector | undefined): DojoAppConfig => {
  return {
    selectedNetworkId: networkId,
    namespace: NAMESPACE,
    starknetDomain: makeStarknetDomain(networkId),
    manifest: getManifest(networkId),
    mainContractName: Object.keys(contractPolicyDescriptions_pistols)[0],
    controllerConnector,
  }
}
