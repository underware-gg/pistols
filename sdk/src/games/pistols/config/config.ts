import { StarknetDomain } from 'starknet'
import { getContractByName } from '@dojoengine/core'
import type { SessionPolicies } from '@cartridge/controller'
import type { DojoAppConfig, DojoManifest, ContractPolicyDescriptions, SignedMessagePolicyDescriptions } from 'src/dojo/contexts/Dojo'
import { NetworkId, NETWORKS } from 'src/games/pistols/config/networks'
import { makeControllerPolicies } from 'src/dojo/setup/controller'
import {
  make_typed_data_PlayerBookmark,
  make_typed_data_PlayerOnline,
} from './signed_messages'
import * as constants from '../generated/constants'
import pistols_manifest_dev from '../manifests/manifest_dev.json'
import pistols_manifest_academy from '../manifests/manifest_academy.json'
import pistols_manifest_staging from '../manifests/manifest_staging.json'
import pistols_manifest_sepolia from '../manifests/manifest_sepolia.json'
import pistols_manifest_mainnet from '../manifests/manifest_mainnet.json'
import { Connector } from '@starknet-react/core'

// TODO: move this here!
// import { defineContractComponents } from './generated/contractComponents'
// import { createSystemCalls } from './createSystemCalls'

const manifests: Record<NetworkId, DojoManifest> = {
  [NetworkId.KATANA_LOCAL]: pistols_manifest_dev as DojoManifest,
  [NetworkId.ACADEMY]: pistols_manifest_academy as DojoManifest,
  [NetworkId.STAGING]: pistols_manifest_staging as DojoManifest,
  [NetworkId.SEPOLIA]: pistols_manifest_sepolia as DojoManifest,
  [NetworkId.MAINNET]: pistols_manifest_mainnet as DojoManifest,
}

export const NAMESPACE = 'pistols'

const contractPolicyDescriptions_pistols: ContractPolicyDescriptions = {
  game: {
    name: 'Game',
    description: 'Game loop contract',
    interfaces: ['IGame'],
  },
  tutorial: {
    name: 'Tutorial',
    description: 'Tutorial game contract',
    interfaces: ['ITutorial'],
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
  // duelist_token: {
  //   name: 'Duelist token',
  //   description: 'Duelist ERC721 contract',
  //   interfaces: ['IDuelistTokenPublic'],
  // },
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

export const makePistolsPolicies = (networkId: NetworkId, mock: boolean, admin: boolean): SessionPolicies => {
  const signedMessagePolicyDescriptions: SignedMessagePolicyDescriptions = [
    {
      description: 'Notify the server that a player is online',
      typedData: make_typed_data_PlayerOnline({
        networkId: networkId,
        identity: '0x0',
        timestamp: 0,
      }),
    },
    {
      description: 'Notify the server that a player follows another player or token',
      typedData: make_typed_data_PlayerBookmark({
        networkId: networkId,
        identity: '0x0',
        target_address: '0x0',
        target_id: '0x0',
        enabled: false,
      })
    },
  ]
  return makeControllerPolicies(
    NAMESPACE,
    manifests[networkId],
    {
      ...contractPolicyDescriptions_pistols,
      ...(mock ? contractPolicyDescriptions_mock : {}),
      ...(admin ? contractPolicyDescriptions_admin : {}),
    },
    signedMessagePolicyDescriptions,
  );
};

// starknet domain
export const makeStarknetDomain = (networkId: NetworkId): StarknetDomain => ({
  name: constants.TYPED_DATA.NAME,
  version: constants.TYPED_DATA.VERSION,
  chainId: NETWORKS[networkId].chainId,
  revision: '1',
})

// contract addresses
// erc-20
export const getLordsAddress = (networkId: NetworkId): string => (NETWORKS[networkId].lordsAddress || (getContractByName(manifests[networkId], NAMESPACE, 'lords_mock')?.address ?? '0x0'))
export const getFameAddress = (networkId: NetworkId): string => (getContractByName(manifests[networkId], NAMESPACE, 'fame_coin')?.address ?? '0x0')
// export const getFoolsAddress = (networkId: NetworkId): string => (getContractByName(manifests[networkId], NAMESPACE, 'fools_coin')?.address ?? '0x0')
// erc-721
export const getDuelistTokenAddress = (networkId: NetworkId): string => (getContractByName(manifests[networkId], NAMESPACE, 'duelist_token')?.address ?? '0x0')
export const getDuelTokenAddress = (networkId: NetworkId): string => (getContractByName(manifests[networkId], NAMESPACE, 'duel_token')?.address ?? '0x0')
export const getPackTokenAddress = (networkId: NetworkId): string => (getContractByName(manifests[networkId], NAMESPACE, 'pack_token')?.address ?? '0x0')
// contracts
export const getBankAddress = (networkId: NetworkId): string => (getContractByName(manifests[networkId], NAMESPACE, 'bank')?.address ?? '0x0')



export const makeDojoAppConfig = (networkId: NetworkId, controllerConnector: Connector | undefined): DojoAppConfig => {
  return {
    selectedNetworkId: networkId,
    namespace: NAMESPACE,
    starknetDomain: makeStarknetDomain(networkId),
    manifest: manifests[networkId],
    mainContractName: Object.keys(contractPolicyDescriptions_pistols)[0],
    controllerConnector,
  }
}
