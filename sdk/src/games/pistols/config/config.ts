import { Manifest, getContractByName } from '@dojoengine/core'
import { ChainId, getNetworkConfig, NetworkId } from './networks'
import pistols_manifest_dev from './manifests/manifest_dev.json'
import pistols_manifest_slot from './manifests/manifest_slot.json'
import pistols_manifest_staging from './manifests/manifest_staging.json'
import pistols_manifest_sepolia from './manifests/manifest_sepolia.json'
import pistols_manifest_mainnet from './manifests/manifest_mainnet.json'
import { bigintToAddress } from 'src/utils/misc/types'

export const NAMESPACE = 'pistols'

// TODO: Manifest is outdated???
// export type DojoManifest = Manifest
export type DojoManifest = Manifest & any

// TODO: move this here!
// import { defineContractComponents } from './generated/contractComponents'
// import { createSystemCalls } from './createSystemCalls'

const manifests_per_network: Record<NetworkId, DojoManifest> = {
  [NetworkId.MAINNET]: pistols_manifest_mainnet as DojoManifest,
  [NetworkId.SEPOLIA]: pistols_manifest_sepolia as DojoManifest,
  [NetworkId.STAGING]: pistols_manifest_staging as DojoManifest,
  [NetworkId.KATANA_SLOT]: pistols_manifest_slot as DojoManifest,
  [NetworkId.KATANA_LOCAL]: pistols_manifest_dev as DojoManifest,
}
const manifests_per_chain: Record<ChainId, DojoManifest> = {
  [ChainId.SN_MAIN]: pistols_manifest_mainnet as DojoManifest,
  [ChainId.SN_SEPOLIA]: pistols_manifest_sepolia as DojoManifest,
  [ChainId.KATANA_SLOT]: pistols_manifest_slot as DojoManifest,
  [ChainId.KATANA_LOCAL]: pistols_manifest_dev as DojoManifest,
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
const _getContractAddress = (networkId: NetworkId, contractName: string): string => (
  getContractByName(manifests_per_network[networkId], NAMESPACE, contractName)?.address ?? '0x0'
);
// erc-20
export const getLordsAddress = (networkId: NetworkId): string => bigintToAddress(getNetworkConfig(networkId).lordsAddress || _getContractAddress(networkId, 'lords_mock'))
export const getFameAddress = (networkId: NetworkId): string => bigintToAddress(_getContractAddress(networkId, 'fame_coin'));
export const getFoolsAddress = (networkId: NetworkId): string => bigintToAddress(_getContractAddress(networkId, 'fools_coin'));
// erc-721
export const getDuelistTokenAddress = (networkId: NetworkId): string => bigintToAddress(_getContractAddress(networkId, 'duelist_token'));
export const getDuelTokenAddress = (networkId: NetworkId): string => bigintToAddress(_getContractAddress(networkId, 'duel_token'));
export const getPackTokenAddress = (networkId: NetworkId): string => bigintToAddress(_getContractAddress(networkId, 'pack_token'));
export const getRingTokenAddress = (networkId: NetworkId): string => bigintToAddress(_getContractAddress(networkId, 'ring_token'));
export const getTournamentTokenAddress = (networkId: NetworkId): string => bigintToAddress(_getContractAddress(networkId, 'tournament_token'));
// contracts
export const getWorldAddress = (networkId: NetworkId): string => bigintToAddress(manifests_per_network[networkId]?.world?.address ?? 0);
export const getGameAddress = (networkId: NetworkId): string => bigintToAddress(_getContractAddress(networkId, 'game'));
export const getGameLoopAddress = (networkId: NetworkId): string => bigintToAddress(_getContractAddress(networkId, 'game_loop'));
export const getBotPlayerAddress = (networkId: NetworkId): string => bigintToAddress(_getContractAddress(networkId, 'bot_player'));
export const getMatchmakerAddress = (networkId: NetworkId): string => bigintToAddress(_getContractAddress(networkId, 'matchmaker'));
export const getCommunityAddress = (networkId: NetworkId): string => bigintToAddress(_getContractAddress(networkId, 'community'));
export const getTutorialAddress = (networkId: NetworkId): string => bigintToAddress(_getContractAddress(networkId, 'tutorial'));
export const getBankAddress = (networkId: NetworkId): string => bigintToAddress(_getContractAddress(networkId, 'bank'));
export const getAdminAddress = (networkId: NetworkId): string => bigintToAddress(_getContractAddress(networkId, 'admin'));
export const getVrfAddress = (networkId: NetworkId): string => bigintToAddress(getNetworkConfig(networkId).vrfAddress || _getContractAddress(networkId, 'vrf_mock'));
