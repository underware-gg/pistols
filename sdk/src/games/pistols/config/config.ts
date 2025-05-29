import { StarknetDomain } from 'starknet'
import { Manifest, getContractByName } from '@dojoengine/core'
import { ChainId, NetworkId, NETWORKS } from './networks'
import pistols_manifest_dev from './manifests/manifest_dev.json'
import pistols_manifest_academy from './manifests/manifest_academy.json'
import pistols_manifest_staging from './manifests/manifest_staging.json'
import pistols_manifest_sepolia from './manifests/manifest_sepolia.json'
import pistols_manifest_mainnet from './manifests/manifest_mainnet.json'

// TODO: Manifest is outdated???
// export type DojoManifest = Manifest
export type DojoManifest = Manifest & any

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

// starknet domain
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

export const getManifest = (networkId: NetworkId): DojoManifest => (manifests[networkId])

//----------------------------------------
// contract addresses
//
// erc-20
export const getLordsAddress = (networkId: NetworkId): string => (NETWORKS[networkId].lordsAddress || (getContractByName(manifests[networkId], NAMESPACE, 'lords_mock')?.address ?? '0x0'))
export const getFameAddress = (networkId: NetworkId): string => (getContractByName(manifests[networkId], NAMESPACE, 'fame_coin')?.address ?? '0x0')
export const getFoolsAddress = (networkId: NetworkId): string => (getContractByName(manifests[networkId], NAMESPACE, 'fools_coin')?.address ?? '0x0')
// erc-721
export const getDuelistTokenAddress = (networkId: NetworkId): string => (getContractByName(manifests[networkId], NAMESPACE, 'duelist_token')?.address ?? '0x0')
export const getDuelTokenAddress = (networkId: NetworkId): string => (getContractByName(manifests[networkId], NAMESPACE, 'duel_token')?.address ?? '0x0')
export const getPackTokenAddress = (networkId: NetworkId): string => (getContractByName(manifests[networkId], NAMESPACE, 'pack_token')?.address ?? '0x0')
export const getTournamentTokenAddress = (networkId: NetworkId): string => (getContractByName(manifests[networkId], NAMESPACE, 'tournament_token')?.address ?? '0x0')
// contracts
export const getWorldAddress = (networkId: NetworkId): string => (manifests[networkId]?.world?.address ?? '0x0')
export const getGameAddress = (networkId: NetworkId): string => (getContractByName(manifests[networkId], NAMESPACE, 'game')?.address ?? '0x0')
export const getBankAddress = (networkId: NetworkId): string => (getContractByName(manifests[networkId], NAMESPACE, 'bank')?.address ?? '0x0')
export const getAdminAddress = (networkId: NetworkId): string => (getContractByName(manifests[networkId], NAMESPACE, 'admin')?.address ?? '0x0')
export const getVrfAddress = (networkId: NetworkId): string => (NETWORKS[networkId].vrfAddress || (getContractByName(manifests[networkId], NAMESPACE, 'vrf_mock')?.address ?? '0x0'))

