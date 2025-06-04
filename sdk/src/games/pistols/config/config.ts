import { Manifest, getContractByName } from '@dojoengine/core'
import { ChainId, getNetworkConfig, NetworkId } from './networks'
import pistols_manifest_dev from './manifests/manifest_dev.json'
import pistols_manifest_academy from './manifests/manifest_academy.json'
import pistols_manifest_staging from './manifests/manifest_staging.json'
import pistols_manifest_sepolia from './manifests/manifest_sepolia.json'
import pistols_manifest_mainnet from './manifests/manifest_mainnet.json'

export const NAMESPACE = 'pistols'

// TODO: Manifest is outdated???
// export type DojoManifest = Manifest
export type DojoManifest = Manifest & any

// TODO: move this here!
// import { defineContractComponents } from './generated/contractComponents'
// import { createSystemCalls } from './createSystemCalls'

const manifests_per_network: Record<NetworkId, DojoManifest> = {
  [NetworkId.KATANA_LOCAL]: pistols_manifest_dev as DojoManifest,
  [NetworkId.ACADEMY]: pistols_manifest_academy as DojoManifest,
  [NetworkId.STAGING]: pistols_manifest_staging as DojoManifest,
  [NetworkId.SEPOLIA]: pistols_manifest_sepolia as DojoManifest,
  [NetworkId.MAINNET]: pistols_manifest_mainnet as DojoManifest,
}
const manifests_per_chain: Record<ChainId, DojoManifest> = {
  [ChainId.KATANA_LOCAL]: pistols_manifest_dev as DojoManifest,
  [ChainId.PISTOLS_ACADEMY]: pistols_manifest_academy as DojoManifest,
  [ChainId.PISTOLS_STAGING]: pistols_manifest_staging as DojoManifest,
  [ChainId.SN_SEPOLIA]: pistols_manifest_sepolia as DojoManifest,
  [ChainId.SN_MAIN]: pistols_manifest_mainnet as DojoManifest,
}

export const getManifest = ({
  networkId,
  chainId,
}: {
  networkId?: NetworkId,
  chainId?: ChainId,
}): DojoManifest => (
  networkId ? manifests_per_network[networkId]
    : chainId ? manifests_per_chain[chainId]
      : pistols_manifest_mainnet
)



//----------------------------------------
// contract addresses
//
// erc-20
export const getLordsAddress = (networkId: NetworkId): string => (getNetworkConfig(networkId).lordsAddress || (getContractByName(manifests_per_network[networkId], NAMESPACE, 'lords_mock')?.address ?? '0x0'))
export const getFameAddress = (networkId: NetworkId): string => (getContractByName(manifests_per_network[networkId], NAMESPACE, 'fame_coin')?.address ?? '0x0')
export const getFoolsAddress = (networkId: NetworkId): string => (getContractByName(manifests_per_network[networkId], NAMESPACE, 'fools_coin')?.address ?? '0x0')
// erc-721
export const getDuelistTokenAddress = (networkId: NetworkId): string => (getContractByName(manifests_per_network[networkId], NAMESPACE, 'duelist_token')?.address ?? '0x0')
export const getDuelTokenAddress = (networkId: NetworkId): string => (getContractByName(manifests_per_network[networkId], NAMESPACE, 'duel_token')?.address ?? '0x0')
export const getPackTokenAddress = (networkId: NetworkId): string => (getContractByName(manifests_per_network[networkId], NAMESPACE, 'pack_token')?.address ?? '0x0')
export const getTournamentTokenAddress = (networkId: NetworkId): string => (getContractByName(manifests_per_network[networkId], NAMESPACE, 'tournament_token')?.address ?? '0x0')
// contracts
export const getWorldAddress = (networkId: NetworkId): string => (manifests_per_network[networkId]?.world?.address ?? '0x0')
export const getGameAddress = (networkId: NetworkId): string => (getContractByName(manifests_per_network[networkId], NAMESPACE, 'game')?.address ?? '0x0')
export const getBankAddress = (networkId: NetworkId): string => (getContractByName(manifests_per_network[networkId], NAMESPACE, 'bank')?.address ?? '0x0')
export const getAdminAddress = (networkId: NetworkId): string => (getContractByName(manifests_per_network[networkId], NAMESPACE, 'admin')?.address ?? '0x0')
export const getVrfAddress = (networkId: NetworkId): string => (getNetworkConfig(networkId).vrfAddress || (getContractByName(manifests_per_network[networkId], NAMESPACE, 'vrf_mock')?.address ?? '0x0'))

