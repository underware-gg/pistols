import { DojoProvider, DojoCall } from "@dojoengine/core";
import { Account, AccountInterface, BigNumberish, CairoOption, CairoCustomEnum } from "starknet";
import * as models from "./models.gen";

export function setupWorld(provider: DojoProvider) {

	const build_admin_amIAdmin_calldata = (accountAddress: string): DojoCall => {
		return {
			contractName: "admin",
			entrypoint: "am_i_admin",
			calldata: [accountAddress],
		};
	};

	const admin_amIAdmin = async (accountAddress: string) => {
		try {
			return await provider.call("pistols", build_admin_amIAdmin_calldata(accountAddress));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_admin_disqualifyDuelist_calldata = (seasonId: BigNumberish, duelistId: BigNumberish, blockOwner: boolean): DojoCall => {
		return {
			contractName: "admin",
			entrypoint: "disqualify_duelist",
			calldata: [seasonId, duelistId, blockOwner],
		};
	};

	const admin_disqualifyDuelist = async (snAccount: Account | AccountInterface, seasonId: BigNumberish, duelistId: BigNumberish, blockOwner: boolean) => {
		try {
			return await provider.execute(
				snAccount,
				build_admin_disqualifyDuelist_calldata(seasonId, duelistId, blockOwner),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_admin_fixPlayerBookmark_calldata = (playerAddress: string, targetAddress: string, targetId: BigNumberish, enabled: boolean): DojoCall => {
		return {
			contractName: "admin",
			entrypoint: "fix_player_bookmark",
			calldata: [playerAddress, targetAddress, targetId, enabled],
		};
	};

	const admin_fixPlayerBookmark = async (snAccount: Account | AccountInterface, playerAddress: string, targetAddress: string, targetId: BigNumberish, enabled: boolean) => {
		try {
			return await provider.execute(
				snAccount,
				build_admin_fixPlayerBookmark_calldata(playerAddress, targetAddress, targetId, enabled),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_admin_qualifyDuelist_calldata = (seasonId: BigNumberish, duelistId: BigNumberish): DojoCall => {
		return {
			contractName: "admin",
			entrypoint: "qualify_duelist",
			calldata: [seasonId, duelistId],
		};
	};

	const admin_qualifyDuelist = async (snAccount: Account | AccountInterface, seasonId: BigNumberish, duelistId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_admin_qualifyDuelist_calldata(seasonId, duelistId),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_admin_setIsBlocked_calldata = (accountAddress: string, isBlocked: boolean): DojoCall => {
		return {
			contractName: "admin",
			entrypoint: "set_is_blocked",
			calldata: [accountAddress, isBlocked],
		};
	};

	const admin_setIsBlocked = async (snAccount: Account | AccountInterface, accountAddress: string, isBlocked: boolean) => {
		try {
			return await provider.execute(
				snAccount,
				build_admin_setIsBlocked_calldata(accountAddress, isBlocked),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_admin_setIsTeamMember_calldata = (accountAddress: string, isTeamMember: boolean, isAdmin: boolean): DojoCall => {
		return {
			contractName: "admin",
			entrypoint: "set_is_team_member",
			calldata: [accountAddress, isTeamMember, isAdmin],
		};
	};

	const admin_setIsTeamMember = async (snAccount: Account | AccountInterface, accountAddress: string, isTeamMember: boolean, isAdmin: boolean) => {
		try {
			return await provider.execute(
				snAccount,
				build_admin_setIsTeamMember_calldata(accountAddress, isTeamMember, isAdmin),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_admin_setPaused_calldata = (paused: boolean): DojoCall => {
		return {
			contractName: "admin",
			entrypoint: "set_paused",
			calldata: [paused],
		};
	};

	const admin_setPaused = async (snAccount: Account | AccountInterface, paused: boolean) => {
		try {
			return await provider.execute(
				snAccount,
				build_admin_setPaused_calldata(paused),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_admin_setTreasury_calldata = (treasuryAddress: string): DojoCall => {
		return {
			contractName: "admin",
			entrypoint: "set_treasury",
			calldata: [treasuryAddress],
		};
	};

	const admin_setTreasury = async (snAccount: Account | AccountInterface, treasuryAddress: string) => {
		try {
			return await provider.execute(
				snAccount,
				build_admin_setTreasury_calldata(treasuryAddress),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_admin_urgentUpdate_calldata = (): DojoCall => {
		return {
			contractName: "admin",
			entrypoint: "urgent_update",
			calldata: [],
		};
	};

	const admin_urgentUpdate = async (snAccount: Account | AccountInterface) => {
		try {
			return await provider.execute(
				snAccount,
				build_admin_urgentUpdate_calldata(),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_bank_canCollectSeason_calldata = (): DojoCall => {
		return {
			contractName: "bank",
			entrypoint: "can_collect_season",
			calldata: [],
		};
	};

	const bank_canCollectSeason = async () => {
		try {
			return await provider.call("pistols", build_bank_canCollectSeason_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_bank_chargePurchase_calldata = (payer: string, lordsAmount: BigNumberish): DojoCall => {
		return {
			contractName: "bank",
			entrypoint: "charge_purchase",
			calldata: [payer, lordsAmount],
		};
	};

	const bank_chargePurchase = async (snAccount: Account | AccountInterface, payer: string, lordsAmount: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_bank_chargePurchase_calldata(payer, lordsAmount),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_bank_collectSeason_calldata = (): DojoCall => {
		return {
			contractName: "bank",
			entrypoint: "collect_season",
			calldata: [],
		};
	};

	const bank_collectSeason = async (snAccount: Account | AccountInterface) => {
		try {
			return await provider.execute(
				snAccount,
				build_bank_collectSeason_calldata(),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_bank_duelistLostFameToPool_calldata = (contractAddress: string, tokenId: BigNumberish, fameAmount: BigNumberish, poolId: CairoCustomEnum): DojoCall => {
		return {
			contractName: "bank",
			entrypoint: "duelist_lost_fame_to_pool",
			calldata: [contractAddress, tokenId, fameAmount, poolId],
		};
	};

	const bank_duelistLostFameToPool = async (snAccount: Account | AccountInterface, contractAddress: string, tokenId: BigNumberish, fameAmount: BigNumberish, poolId: CairoCustomEnum) => {
		try {
			return await provider.execute(
				snAccount,
				build_bank_duelistLostFameToPool_calldata(contractAddress, tokenId, fameAmount, poolId),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_bank_pegMintedFameToLords_calldata = (payer: string, lordsAmount: BigNumberish, fromPoolType: CairoCustomEnum): DojoCall => {
		return {
			contractName: "bank",
			entrypoint: "peg_minted_fame_to_lords",
			calldata: [payer, lordsAmount, fromPoolType],
		};
	};

	const bank_pegMintedFameToLords = async (snAccount: Account | AccountInterface, payer: string, lordsAmount: BigNumberish, fromPoolType: CairoCustomEnum) => {
		try {
			return await provider.execute(
				snAccount,
				build_bank_pegMintedFameToLords_calldata(payer, lordsAmount, fromPoolType),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	// const build_bank_releaseLordsFromFameToBeBurned_calldata = (seasonId: BigNumberish, duelId: BigNumberish, bills: Array<LordsReleaseBill>): DojoCall => {
	// 	return {
	// 		contractName: "bank",
	// 		entrypoint: "release_lords_from_fame_to_be_burned",
	// 		calldata: [seasonId, duelId, bills],
	// 	};
	// };

	// const bank_releaseLordsFromFameToBeBurned = async (snAccount: Account | AccountInterface, seasonId: BigNumberish, duelId: BigNumberish, bills: Array<LordsReleaseBill>) => {
	// 	try {
	// 		return await provider.execute(
	// 			snAccount,
	// 			build_bank_releaseLordsFromFameToBeBurned_calldata(seasonId, duelId, bills),
	// 			"pistols",
	// 		);
	// 	} catch (error) {
	// 		console.error(error);
	// 		throw error;
	// 	}
	// };

	const build_bank_sponsorDuelists_calldata = (payer: string, lordsAmount: BigNumberish): DojoCall => {
		return {
			contractName: "bank",
			entrypoint: "sponsor_duelists",
			calldata: [payer, lordsAmount],
		};
	};

	const bank_sponsorDuelists = async (snAccount: Account | AccountInterface, payer: string, lordsAmount: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_bank_sponsorDuelists_calldata(payer, lordsAmount),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_bank_sponsorSeason_calldata = (payer: string, lordsAmount: BigNumberish): DojoCall => {
		return {
			contractName: "bank",
			entrypoint: "sponsor_season",
			calldata: [payer, lordsAmount],
		};
	};

	const bank_sponsorSeason = async (snAccount: Account | AccountInterface, payer: string, lordsAmount: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_bank_sponsorSeason_calldata(payer, lordsAmount),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_bank_sponsorTournament_calldata = (payer: string, lordsAmount: BigNumberish, tournamentId: BigNumberish): DojoCall => {
		return {
			contractName: "bank",
			entrypoint: "sponsor_tournament",
			calldata: [payer, lordsAmount, tournamentId],
		};
	};

	const bank_sponsorTournament = async (snAccount: Account | AccountInterface, payer: string, lordsAmount: BigNumberish, tournamentId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_bank_sponsorTournament_calldata(payer, lordsAmount, tournamentId),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duel_token_approve_calldata = (to: string, tokenId: BigNumberish): DojoCall => {
		return {
			contractName: "duel_token",
			entrypoint: "approve",
			calldata: [to, tokenId],
		};
	};

	const duel_token_approve = async (snAccount: Account | AccountInterface, to: string, tokenId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_duel_token_approve_calldata(to, tokenId),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duel_token_balanceOf_calldata = (account: string): DojoCall => {
		return {
			contractName: "duel_token",
			entrypoint: "balanceOf",
			calldata: [account],
		};
	};

	const duel_token_balanceOf = async (account: string) => {
		try {
			return await provider.call("pistols", build_duel_token_balanceOf_calldata(account));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duel_token_canMint_calldata = (recipient: string): DojoCall => {
		return {
			contractName: "duel_token",
			entrypoint: "can_mint",
			calldata: [recipient],
		};
	};

	const duel_token_canMint = async (recipient: string) => {
		try {
			return await provider.call("pistols", build_duel_token_canMint_calldata(recipient));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duel_token_contractUri_calldata = (): DojoCall => {
		return {
			contractName: "duel_token",
			entrypoint: "contractURI",
			calldata: [],
		};
	};

	const duel_token_contractUri = async () => {
		try {
			return await provider.call("pistols", build_duel_token_contractUri_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duel_token_createDuel_calldata = (duelType: CairoCustomEnum, duelistId: BigNumberish, challengedAddress: string, livesStaked: BigNumberish, expireHours: BigNumberish, premise: CairoCustomEnum, message: string): DojoCall => {
		return {
			contractName: "duel_token",
			entrypoint: "create_duel",
			calldata: [duelType, duelistId, challengedAddress, livesStaked, expireHours, premise, message],
		};
	};

	const duel_token_createDuel = async (snAccount: Account | AccountInterface, duelType: CairoCustomEnum, duelistId: BigNumberish, challengedAddress: string, livesStaked: BigNumberish, expireHours: BigNumberish, premise: CairoCustomEnum, message: string) => {
		try {
			return await provider.execute(
				snAccount,
				build_duel_token_createDuel_calldata(duelType, duelistId, challengedAddress, livesStaked, expireHours, premise, message),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duel_token_defaultRoyalty_calldata = (): DojoCall => {
		return {
			contractName: "duel_token",
			entrypoint: "defaultRoyalty",
			calldata: [],
		};
	};

	const duel_token_defaultRoyalty = async () => {
		try {
			return await provider.call("pistols", build_duel_token_defaultRoyalty_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duel_token_getApproved_calldata = (tokenId: BigNumberish): DojoCall => {
		return {
			contractName: "duel_token",
			entrypoint: "getApproved",
			calldata: [tokenId],
		};
	};

	const duel_token_getApproved = async (tokenId: BigNumberish) => {
		try {
			return await provider.call("pistols", build_duel_token_getApproved_calldata(tokenId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duel_token_getPact_calldata = (duelType: CairoCustomEnum, addressA: string, addressB: string): DojoCall => {
		return {
			contractName: "duel_token",
			entrypoint: "get_pact",
			calldata: [duelType, addressA, addressB],
		};
	};

	const duel_token_getPact = async (duelType: CairoCustomEnum, addressA: string, addressB: string) => {
		try {
			return await provider.call("pistols", build_duel_token_getPact_calldata(duelType, addressA, addressB));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duel_token_hasPact_calldata = (duelType: CairoCustomEnum, addressA: string, addressB: string): DojoCall => {
		return {
			contractName: "duel_token",
			entrypoint: "has_pact",
			calldata: [duelType, addressA, addressB],
		};
	};

	const duel_token_hasPact = async (duelType: CairoCustomEnum, addressA: string, addressB: string) => {
		try {
			return await provider.call("pistols", build_duel_token_hasPact_calldata(duelType, addressA, addressB));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duel_token_isApprovedForAll_calldata = (owner: string, operator: string): DojoCall => {
		return {
			contractName: "duel_token",
			entrypoint: "isApprovedForAll",
			calldata: [owner, operator],
		};
	};

	const duel_token_isApprovedForAll = async (owner: string, operator: string) => {
		try {
			return await provider.call("pistols", build_duel_token_isApprovedForAll_calldata(owner, operator));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duel_token_isMintingPaused_calldata = (): DojoCall => {
		return {
			contractName: "duel_token",
			entrypoint: "is_minting_paused",
			calldata: [],
		};
	};

	const duel_token_isMintingPaused = async () => {
		try {
			return await provider.call("pistols", build_duel_token_isMintingPaused_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duel_token_isOwnerOf_calldata = (address: string, tokenId: BigNumberish): DojoCall => {
		return {
			contractName: "duel_token",
			entrypoint: "is_owner_of",
			calldata: [address, tokenId],
		};
	};

	const duel_token_isOwnerOf = async (address: string, tokenId: BigNumberish) => {
		try {
			return await provider.call("pistols", build_duel_token_isOwnerOf_calldata(address, tokenId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duel_token_lastTokenId_calldata = (): DojoCall => {
		return {
			contractName: "duel_token",
			entrypoint: "last_token_id",
			calldata: [],
		};
	};

	const duel_token_lastTokenId = async () => {
		try {
			return await provider.call("pistols", build_duel_token_lastTokenId_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duel_token_maxSupply_calldata = (): DojoCall => {
		return {
			contractName: "duel_token",
			entrypoint: "maxSupply",
			calldata: [],
		};
	};

	const duel_token_maxSupply = async () => {
		try {
			return await provider.call("pistols", build_duel_token_maxSupply_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duel_token_name_calldata = (): DojoCall => {
		return {
			contractName: "duel_token",
			entrypoint: "name",
			calldata: [],
		};
	};

	const duel_token_name = async () => {
		try {
			return await provider.call("pistols", build_duel_token_name_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duel_token_ownerOf_calldata = (tokenId: BigNumberish): DojoCall => {
		return {
			contractName: "duel_token",
			entrypoint: "ownerOf",
			calldata: [tokenId],
		};
	};

	const duel_token_ownerOf = async (tokenId: BigNumberish) => {
		try {
			return await provider.call("pistols", build_duel_token_ownerOf_calldata(tokenId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duel_token_replyDuel_calldata = (duelId: BigNumberish, duelistId: BigNumberish, accepted: boolean): DojoCall => {
		return {
			contractName: "duel_token",
			entrypoint: "reply_duel",
			calldata: [duelId, duelistId, accepted],
		};
	};

	const duel_token_replyDuel = async (snAccount: Account | AccountInterface, duelId: BigNumberish, duelistId: BigNumberish, accepted: boolean) => {
		try {
			return await provider.execute(
				snAccount,
				build_duel_token_replyDuel_calldata(duelId, duelistId, accepted),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duel_token_royaltyInfo_calldata = (tokenId: BigNumberish, salePrice: BigNumberish): DojoCall => {
		return {
			contractName: "duel_token",
			entrypoint: "royaltyInfo",
			calldata: [tokenId, salePrice],
		};
	};

	const duel_token_royaltyInfo = async (tokenId: BigNumberish, salePrice: BigNumberish) => {
		try {
			return await provider.call("pistols", build_duel_token_royaltyInfo_calldata(tokenId, salePrice));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duel_token_safeTransferFrom_calldata = (from: string, to: string, tokenId: BigNumberish, data: Array<BigNumberish>): DojoCall => {
		return {
			contractName: "duel_token",
			entrypoint: "safeTransferFrom",
			calldata: [from, to, tokenId, data],
		};
	};

	const duel_token_safeTransferFrom = async (snAccount: Account | AccountInterface, from: string, to: string, tokenId: BigNumberish, data: Array<BigNumberish>) => {
		try {
			return await provider.execute(
				snAccount,
				build_duel_token_safeTransferFrom_calldata(from, to, tokenId, data),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duel_token_setApprovalForAll_calldata = (operator: string, approved: boolean): DojoCall => {
		return {
			contractName: "duel_token",
			entrypoint: "setApprovalForAll",
			calldata: [operator, approved],
		};
	};

	const duel_token_setApprovalForAll = async (snAccount: Account | AccountInterface, operator: string, approved: boolean) => {
		try {
			return await provider.execute(
				snAccount,
				build_duel_token_setApprovalForAll_calldata(operator, approved),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duel_token_supportsInterface_calldata = (interfaceId: BigNumberish): DojoCall => {
		return {
			contractName: "duel_token",
			entrypoint: "supports_interface",
			calldata: [interfaceId],
		};
	};

	const duel_token_supportsInterface = async (interfaceId: BigNumberish) => {
		try {
			return await provider.call("pistols", build_duel_token_supportsInterface_calldata(interfaceId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duel_token_symbol_calldata = (): DojoCall => {
		return {
			contractName: "duel_token",
			entrypoint: "symbol",
			calldata: [],
		};
	};

	const duel_token_symbol = async () => {
		try {
			return await provider.call("pistols", build_duel_token_symbol_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duel_token_tokenRoyalty_calldata = (tokenId: BigNumberish): DojoCall => {
		return {
			contractName: "duel_token",
			entrypoint: "tokenRoyalty",
			calldata: [tokenId],
		};
	};

	const duel_token_tokenRoyalty = async (tokenId: BigNumberish) => {
		try {
			return await provider.call("pistols", build_duel_token_tokenRoyalty_calldata(tokenId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duel_token_tokenUri_calldata = (tokenId: BigNumberish): DojoCall => {
		return {
			contractName: "duel_token",
			entrypoint: "tokenURI",
			calldata: [tokenId],
		};
	};

	const duel_token_tokenUri = async (tokenId: BigNumberish) => {
		try {
			return await provider.call("pistols", build_duel_token_tokenUri_calldata(tokenId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duel_token_tokenExists_calldata = (tokenId: BigNumberish): DojoCall => {
		return {
			contractName: "duel_token",
			entrypoint: "token_exists",
			calldata: [tokenId],
		};
	};

	const duel_token_tokenExists = async (tokenId: BigNumberish) => {
		try {
			return await provider.call("pistols", build_duel_token_tokenExists_calldata(tokenId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duel_token_totalSupply_calldata = (): DojoCall => {
		return {
			contractName: "duel_token",
			entrypoint: "totalSupply",
			calldata: [],
		};
	};

	const duel_token_totalSupply = async () => {
		try {
			return await provider.call("pistols", build_duel_token_totalSupply_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duel_token_transferFrom_calldata = (from: string, to: string, tokenId: BigNumberish): DojoCall => {
		return {
			contractName: "duel_token",
			entrypoint: "transferFrom",
			calldata: [from, to, tokenId],
		};
	};

	const duel_token_transferFrom = async (snAccount: Account | AccountInterface, from: string, to: string, tokenId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_duel_token_transferFrom_calldata(from, to, tokenId),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duel_token_transferToWinner_calldata = (duelId: BigNumberish): DojoCall => {
		return {
			contractName: "duel_token",
			entrypoint: "transfer_to_winner",
			calldata: [duelId],
		};
	};

	const duel_token_transferToWinner = async (snAccount: Account | AccountInterface, duelId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_duel_token_transferToWinner_calldata(duelId),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duel_token_updateContractMetadata_calldata = (): DojoCall => {
		return {
			contractName: "duel_token",
			entrypoint: "update_contract_metadata",
			calldata: [],
		};
	};

	const duel_token_updateContractMetadata = async (snAccount: Account | AccountInterface) => {
		try {
			return await provider.execute(
				snAccount,
				build_duel_token_updateContractMetadata_calldata(),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duel_token_updateTokenMetadata_calldata = (tokenId: BigNumberish): DojoCall => {
		return {
			contractName: "duel_token",
			entrypoint: "update_token_metadata",
			calldata: [tokenId],
		};
	};

	const duel_token_updateTokenMetadata = async (snAccount: Account | AccountInterface, tokenId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_duel_token_updateTokenMetadata_calldata(tokenId),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duel_token_updateTokensMetadata_calldata = (fromTokenId: BigNumberish, toTokenId: BigNumberish): DojoCall => {
		return {
			contractName: "duel_token",
			entrypoint: "update_tokens_metadata",
			calldata: [fromTokenId, toTokenId],
		};
	};

	const duel_token_updateTokensMetadata = async (snAccount: Account | AccountInterface, fromTokenId: BigNumberish, toTokenId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_duel_token_updateTokensMetadata_calldata(fromTokenId, toTokenId),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duelist_token_approve_calldata = (to: string, tokenId: BigNumberish): DojoCall => {
		return {
			contractName: "duelist_token",
			entrypoint: "approve",
			calldata: [to, tokenId],
		};
	};

	const duelist_token_approve = async (snAccount: Account | AccountInterface, to: string, tokenId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_duelist_token_approve_calldata(to, tokenId),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duelist_token_balanceOf_calldata = (account: string): DojoCall => {
		return {
			contractName: "duelist_token",
			entrypoint: "balanceOf",
			calldata: [account],
		};
	};

	const duelist_token_balanceOf = async (account: string) => {
		try {
			return await provider.call("pistols", build_duelist_token_balanceOf_calldata(account));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duelist_token_canMint_calldata = (recipient: string): DojoCall => {
		return {
			contractName: "duelist_token",
			entrypoint: "can_mint",
			calldata: [recipient],
		};
	};

	const duelist_token_canMint = async (recipient: string) => {
		try {
			return await provider.call("pistols", build_duelist_token_canMint_calldata(recipient));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duelist_token_contractUri_calldata = (): DojoCall => {
		return {
			contractName: "duelist_token",
			entrypoint: "contractURI",
			calldata: [],
		};
	};

	const duelist_token_contractUri = async () => {
		try {
			return await provider.call("pistols", build_duelist_token_contractUri_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duelist_token_defaultRoyalty_calldata = (): DojoCall => {
		return {
			contractName: "duelist_token",
			entrypoint: "defaultRoyalty",
			calldata: [],
		};
	};

	const duelist_token_defaultRoyalty = async () => {
		try {
			return await provider.call("pistols", build_duelist_token_defaultRoyalty_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duelist_token_fameBalance_calldata = (duelistId: BigNumberish): DojoCall => {
		return {
			contractName: "duelist_token",
			entrypoint: "fame_balance",
			calldata: [duelistId],
		};
	};

	const duelist_token_fameBalance = async (duelistId: BigNumberish) => {
		try {
			return await provider.call("pistols", build_duelist_token_fameBalance_calldata(duelistId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duelist_token_getApproved_calldata = (tokenId: BigNumberish): DojoCall => {
		return {
			contractName: "duelist_token",
			entrypoint: "getApproved",
			calldata: [tokenId],
		};
	};

	const duelist_token_getApproved = async (tokenId: BigNumberish) => {
		try {
			return await provider.call("pistols", build_duelist_token_getApproved_calldata(tokenId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duelist_token_getValidatedActiveDuelistId_calldata = (address: string, duelistId: BigNumberish, livesStaked: BigNumberish): DojoCall => {
		return {
			contractName: "duelist_token",
			entrypoint: "get_validated_active_duelist_id",
			calldata: [address, duelistId, livesStaked],
		};
	};

	const duelist_token_getValidatedActiveDuelistId = async (snAccount: Account | AccountInterface, address: string, duelistId: BigNumberish, livesStaked: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_duelist_token_getValidatedActiveDuelistId_calldata(address, duelistId, livesStaked),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duelist_token_inactiveFameDripped_calldata = (duelistId: BigNumberish): DojoCall => {
		return {
			contractName: "duelist_token",
			entrypoint: "inactive_fame_dripped",
			calldata: [duelistId],
		};
	};

	const duelist_token_inactiveFameDripped = async (duelistId: BigNumberish) => {
		try {
			return await provider.call("pistols", build_duelist_token_inactiveFameDripped_calldata(duelistId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duelist_token_inactiveTimestamp_calldata = (duelistId: BigNumberish): DojoCall => {
		return {
			contractName: "duelist_token",
			entrypoint: "inactive_timestamp",
			calldata: [duelistId],
		};
	};

	const duelist_token_inactiveTimestamp = async (duelistId: BigNumberish) => {
		try {
			return await provider.call("pistols", build_duelist_token_inactiveTimestamp_calldata(duelistId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duelist_token_isApprovedForAll_calldata = (owner: string, operator: string): DojoCall => {
		return {
			contractName: "duelist_token",
			entrypoint: "isApprovedForAll",
			calldata: [owner, operator],
		};
	};

	const duelist_token_isApprovedForAll = async (owner: string, operator: string) => {
		try {
			return await provider.call("pistols", build_duelist_token_isApprovedForAll_calldata(owner, operator));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duelist_token_isAlive_calldata = (duelistId: BigNumberish): DojoCall => {
		return {
			contractName: "duelist_token",
			entrypoint: "is_alive",
			calldata: [duelistId],
		};
	};

	const duelist_token_isAlive = async (duelistId: BigNumberish) => {
		try {
			return await provider.call("pistols", build_duelist_token_isAlive_calldata(duelistId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duelist_token_isInactive_calldata = (duelistId: BigNumberish): DojoCall => {
		return {
			contractName: "duelist_token",
			entrypoint: "is_inactive",
			calldata: [duelistId],
		};
	};

	const duelist_token_isInactive = async (duelistId: BigNumberish) => {
		try {
			return await provider.call("pistols", build_duelist_token_isInactive_calldata(duelistId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duelist_token_isMintingPaused_calldata = (): DojoCall => {
		return {
			contractName: "duelist_token",
			entrypoint: "is_minting_paused",
			calldata: [],
		};
	};

	const duelist_token_isMintingPaused = async () => {
		try {
			return await provider.call("pistols", build_duelist_token_isMintingPaused_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duelist_token_isOwnerOf_calldata = (address: string, tokenId: BigNumberish): DojoCall => {
		return {
			contractName: "duelist_token",
			entrypoint: "is_owner_of",
			calldata: [address, tokenId],
		};
	};

	const duelist_token_isOwnerOf = async (address: string, tokenId: BigNumberish) => {
		try {
			return await provider.call("pistols", build_duelist_token_isOwnerOf_calldata(address, tokenId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duelist_token_lastTokenId_calldata = (): DojoCall => {
		return {
			contractName: "duelist_token",
			entrypoint: "last_token_id",
			calldata: [],
		};
	};

	const duelist_token_lastTokenId = async () => {
		try {
			return await provider.call("pistols", build_duelist_token_lastTokenId_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duelist_token_lifeCount_calldata = (duelistId: BigNumberish): DojoCall => {
		return {
			contractName: "duelist_token",
			entrypoint: "life_count",
			calldata: [duelistId],
		};
	};

	const duelist_token_lifeCount = async (duelistId: BigNumberish) => {
		try {
			return await provider.call("pistols", build_duelist_token_lifeCount_calldata(duelistId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duelist_token_maxSupply_calldata = (): DojoCall => {
		return {
			contractName: "duelist_token",
			entrypoint: "maxSupply",
			calldata: [],
		};
	};

	const duelist_token_maxSupply = async () => {
		try {
			return await provider.call("pistols", build_duelist_token_maxSupply_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duelist_token_memorialize_calldata = (duelistId: BigNumberish): DojoCall => {
		return {
			contractName: "duelist_token",
			entrypoint: "memorialize",
			calldata: [duelistId],
		};
	};

	const duelist_token_memorialize = async (snAccount: Account | AccountInterface, duelistId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_duelist_token_memorialize_calldata(duelistId),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duelist_token_mintDuelists_calldata = (recipient: string, profileSample: CairoCustomEnum, quantity: BigNumberish, seed: BigNumberish): DojoCall => {
		return {
			contractName: "duelist_token",
			entrypoint: "mint_duelists",
			calldata: [recipient, profileSample, quantity, seed],
		};
	};

	const duelist_token_mintDuelists = async (snAccount: Account | AccountInterface, recipient: string, profileSample: CairoCustomEnum, quantity: BigNumberish, seed: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_duelist_token_mintDuelists_calldata(recipient, profileSample, quantity, seed),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duelist_token_name_calldata = (): DojoCall => {
		return {
			contractName: "duelist_token",
			entrypoint: "name",
			calldata: [],
		};
	};

	const duelist_token_name = async () => {
		try {
			return await provider.call("pistols", build_duelist_token_name_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duelist_token_ownerOf_calldata = (tokenId: BigNumberish): DojoCall => {
		return {
			contractName: "duelist_token",
			entrypoint: "ownerOf",
			calldata: [tokenId],
		};
	};

	const duelist_token_ownerOf = async (tokenId: BigNumberish) => {
		try {
			return await provider.call("pistols", build_duelist_token_ownerOf_calldata(tokenId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duelist_token_poke_calldata = (duelistId: BigNumberish): DojoCall => {
		return {
			contractName: "duelist_token",
			entrypoint: "poke",
			calldata: [duelistId],
		};
	};

	const duelist_token_poke = async (snAccount: Account | AccountInterface, duelistId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_duelist_token_poke_calldata(duelistId),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duelist_token_royaltyInfo_calldata = (tokenId: BigNumberish, salePrice: BigNumberish): DojoCall => {
		return {
			contractName: "duelist_token",
			entrypoint: "royaltyInfo",
			calldata: [tokenId, salePrice],
		};
	};

	const duelist_token_royaltyInfo = async (tokenId: BigNumberish, salePrice: BigNumberish) => {
		try {
			return await provider.call("pistols", build_duelist_token_royaltyInfo_calldata(tokenId, salePrice));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duelist_token_sacrifice_calldata = (duelistId: BigNumberish): DojoCall => {
		return {
			contractName: "duelist_token",
			entrypoint: "sacrifice",
			calldata: [duelistId],
		};
	};

	const duelist_token_sacrifice = async (snAccount: Account | AccountInterface, duelistId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_duelist_token_sacrifice_calldata(duelistId),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duelist_token_safeTransferFrom_calldata = (from: string, to: string, tokenId: BigNumberish, data: Array<BigNumberish>): DojoCall => {
		return {
			contractName: "duelist_token",
			entrypoint: "safeTransferFrom",
			calldata: [from, to, tokenId, data],
		};
	};

	const duelist_token_safeTransferFrom = async (snAccount: Account | AccountInterface, from: string, to: string, tokenId: BigNumberish, data: Array<BigNumberish>) => {
		try {
			return await provider.execute(
				snAccount,
				build_duelist_token_safeTransferFrom_calldata(from, to, tokenId, data),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duelist_token_setApprovalForAll_calldata = (operator: string, approved: boolean): DojoCall => {
		return {
			contractName: "duelist_token",
			entrypoint: "setApprovalForAll",
			calldata: [operator, approved],
		};
	};

	const duelist_token_setApprovalForAll = async (snAccount: Account | AccountInterface, operator: string, approved: boolean) => {
		try {
			return await provider.execute(
				snAccount,
				build_duelist_token_setApprovalForAll_calldata(operator, approved),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duelist_token_supportsInterface_calldata = (interfaceId: BigNumberish): DojoCall => {
		return {
			contractName: "duelist_token",
			entrypoint: "supports_interface",
			calldata: [interfaceId],
		};
	};

	const duelist_token_supportsInterface = async (interfaceId: BigNumberish) => {
		try {
			return await provider.call("pistols", build_duelist_token_supportsInterface_calldata(interfaceId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duelist_token_symbol_calldata = (): DojoCall => {
		return {
			contractName: "duelist_token",
			entrypoint: "symbol",
			calldata: [],
		};
	};

	const duelist_token_symbol = async () => {
		try {
			return await provider.call("pistols", build_duelist_token_symbol_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duelist_token_tokenRoyalty_calldata = (tokenId: BigNumberish): DojoCall => {
		return {
			contractName: "duelist_token",
			entrypoint: "tokenRoyalty",
			calldata: [tokenId],
		};
	};

	const duelist_token_tokenRoyalty = async (tokenId: BigNumberish) => {
		try {
			return await provider.call("pistols", build_duelist_token_tokenRoyalty_calldata(tokenId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duelist_token_tokenUri_calldata = (tokenId: BigNumberish): DojoCall => {
		return {
			contractName: "duelist_token",
			entrypoint: "tokenURI",
			calldata: [tokenId],
		};
	};

	const duelist_token_tokenUri = async (tokenId: BigNumberish) => {
		try {
			return await provider.call("pistols", build_duelist_token_tokenUri_calldata(tokenId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duelist_token_tokenExists_calldata = (tokenId: BigNumberish): DojoCall => {
		return {
			contractName: "duelist_token",
			entrypoint: "token_exists",
			calldata: [tokenId],
		};
	};

	const duelist_token_tokenExists = async (tokenId: BigNumberish) => {
		try {
			return await provider.call("pistols", build_duelist_token_tokenExists_calldata(tokenId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duelist_token_totalSupply_calldata = (): DojoCall => {
		return {
			contractName: "duelist_token",
			entrypoint: "totalSupply",
			calldata: [],
		};
	};

	const duelist_token_totalSupply = async () => {
		try {
			return await provider.call("pistols", build_duelist_token_totalSupply_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duelist_token_transferFrom_calldata = (from: string, to: string, tokenId: BigNumberish): DojoCall => {
		return {
			contractName: "duelist_token",
			entrypoint: "transferFrom",
			calldata: [from, to, tokenId],
		};
	};

	const duelist_token_transferFrom = async (snAccount: Account | AccountInterface, from: string, to: string, tokenId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_duelist_token_transferFrom_calldata(from, to, tokenId),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	// const build_duelist_token_transferRewards_calldata = (challenge: models.Challenge, tournamentId: BigNumberish, bonus: models.DuelBonus): DojoCall => {
	// 	return {
	// 		contractName: "duelist_token",
	// 		entrypoint: "transfer_rewards",
	// 		calldata: [challenge, tournamentId, bonus],
	// 	};
	// };

	// const duelist_token_transferRewards = async (snAccount: Account | AccountInterface, challenge: models.Challenge, tournamentId: BigNumberish, bonus: models.DuelBonus) => {
	// 	try {
	// 		return await provider.execute(
	// 			snAccount,
	// 			build_duelist_token_transferRewards_calldata(challenge, tournamentId, bonus),
	// 			"pistols",
	// 		);
	// 	} catch (error) {
	// 		console.error(error);
	// 		throw error;
	// 	}
	// };

	const build_duelist_token_updateContractMetadata_calldata = (): DojoCall => {
		return {
			contractName: "duelist_token",
			entrypoint: "update_contract_metadata",
			calldata: [],
		};
	};

	const duelist_token_updateContractMetadata = async (snAccount: Account | AccountInterface) => {
		try {
			return await provider.execute(
				snAccount,
				build_duelist_token_updateContractMetadata_calldata(),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duelist_token_updateTokenMetadata_calldata = (tokenId: BigNumberish): DojoCall => {
		return {
			contractName: "duelist_token",
			entrypoint: "update_token_metadata",
			calldata: [tokenId],
		};
	};

	const duelist_token_updateTokenMetadata = async (snAccount: Account | AccountInterface, tokenId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_duelist_token_updateTokenMetadata_calldata(tokenId),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duelist_token_updateTokensMetadata_calldata = (fromTokenId: BigNumberish, toTokenId: BigNumberish): DojoCall => {
		return {
			contractName: "duelist_token",
			entrypoint: "update_tokens_metadata",
			calldata: [fromTokenId, toTokenId],
		};
	};

	const duelist_token_updateTokensMetadata = async (snAccount: Account | AccountInterface, fromTokenId: BigNumberish, toTokenId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_duelist_token_updateTokensMetadata_calldata(fromTokenId, toTokenId),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_fame_coin_addressOfToken_calldata = (contractAddress: string, tokenId: BigNumberish): DojoCall => {
		return {
			contractName: "fame_coin",
			entrypoint: "address_of_token",
			calldata: [contractAddress, tokenId],
		};
	};

	const fame_coin_addressOfToken = async (contractAddress: string, tokenId: BigNumberish) => {
		try {
			return await provider.call("pistols", build_fame_coin_addressOfToken_calldata(contractAddress, tokenId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_fame_coin_allowance_calldata = (owner: string, spender: string): DojoCall => {
		return {
			contractName: "fame_coin",
			entrypoint: "allowance",
			calldata: [owner, spender],
		};
	};

	const fame_coin_allowance = async (owner: string, spender: string) => {
		try {
			return await provider.call("pistols", build_fame_coin_allowance_calldata(owner, spender));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_fame_coin_approve_calldata = (spender: string, amount: BigNumberish): DojoCall => {
		return {
			contractName: "fame_coin",
			entrypoint: "approve",
			calldata: [spender, amount],
		};
	};

	const fame_coin_approve = async (snAccount: Account | AccountInterface, spender: string, amount: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_fame_coin_approve_calldata(spender, amount),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_fame_coin_balanceOf_calldata = (account: string): DojoCall => {
		return {
			contractName: "fame_coin",
			entrypoint: "balanceOf",
			calldata: [account],
		};
	};

	const fame_coin_balanceOf = async (account: string) => {
		try {
			return await provider.call("pistols", build_fame_coin_balanceOf_calldata(account));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_fame_coin_balanceOfToken_calldata = (contractAddress: string, tokenId: BigNumberish): DojoCall => {
		return {
			contractName: "fame_coin",
			entrypoint: "balance_of_token",
			calldata: [contractAddress, tokenId],
		};
	};

	const fame_coin_balanceOfToken = async (contractAddress: string, tokenId: BigNumberish) => {
		try {
			return await provider.call("pistols", build_fame_coin_balanceOfToken_calldata(contractAddress, tokenId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_fame_coin_burn_calldata = (amount: BigNumberish): DojoCall => {
		return {
			contractName: "fame_coin",
			entrypoint: "burn",
			calldata: [amount],
		};
	};

	const fame_coin_burn = async (snAccount: Account | AccountInterface, amount: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_fame_coin_burn_calldata(amount),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_fame_coin_burnFromToken_calldata = (contractAddress: string, tokenId: BigNumberish, amount: BigNumberish): DojoCall => {
		return {
			contractName: "fame_coin",
			entrypoint: "burn_from_token",
			calldata: [contractAddress, tokenId, amount],
		};
	};

	const fame_coin_burnFromToken = async (snAccount: Account | AccountInterface, contractAddress: string, tokenId: BigNumberish, amount: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_fame_coin_burnFromToken_calldata(contractAddress, tokenId, amount),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_fame_coin_decimals_calldata = (): DojoCall => {
		return {
			contractName: "fame_coin",
			entrypoint: "decimals",
			calldata: [],
		};
	};

	const fame_coin_decimals = async () => {
		try {
			return await provider.call("pistols", build_fame_coin_decimals_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_fame_coin_mintedDuelist_calldata = (duelistId: BigNumberish): DojoCall => {
		return {
			contractName: "fame_coin",
			entrypoint: "minted_duelist",
			calldata: [duelistId],
		};
	};

	const fame_coin_mintedDuelist = async (snAccount: Account | AccountInterface, duelistId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_fame_coin_mintedDuelist_calldata(duelistId),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_fame_coin_name_calldata = (): DojoCall => {
		return {
			contractName: "fame_coin",
			entrypoint: "name",
			calldata: [],
		};
	};

	const fame_coin_name = async () => {
		try {
			return await provider.call("pistols", build_fame_coin_name_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_fame_coin_rewardDuelist_calldata = (duelistId: BigNumberish, amount: BigNumberish): DojoCall => {
		return {
			contractName: "fame_coin",
			entrypoint: "reward_duelist",
			calldata: [duelistId, amount],
		};
	};

	const fame_coin_rewardDuelist = async (snAccount: Account | AccountInterface, duelistId: BigNumberish, amount: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_fame_coin_rewardDuelist_calldata(duelistId, amount),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_fame_coin_symbol_calldata = (): DojoCall => {
		return {
			contractName: "fame_coin",
			entrypoint: "symbol",
			calldata: [],
		};
	};

	const fame_coin_symbol = async () => {
		try {
			return await provider.call("pistols", build_fame_coin_symbol_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_fame_coin_tokenOfAddress_calldata = (address: string): DojoCall => {
		return {
			contractName: "fame_coin",
			entrypoint: "token_of_address",
			calldata: [address],
		};
	};

	const fame_coin_tokenOfAddress = async (address: string) => {
		try {
			return await provider.call("pistols", build_fame_coin_tokenOfAddress_calldata(address));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_fame_coin_totalSupply_calldata = (): DojoCall => {
		return {
			contractName: "fame_coin",
			entrypoint: "totalSupply",
			calldata: [],
		};
	};

	const fame_coin_totalSupply = async () => {
		try {
			return await provider.call("pistols", build_fame_coin_totalSupply_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_fame_coin_transfer_calldata = (recipient: string, amount: BigNumberish): DojoCall => {
		return {
			contractName: "fame_coin",
			entrypoint: "transfer",
			calldata: [recipient, amount],
		};
	};

	const fame_coin_transfer = async (snAccount: Account | AccountInterface, recipient: string, amount: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_fame_coin_transfer_calldata(recipient, amount),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_fame_coin_transferFrom_calldata = (sender: string, recipient: string, amount: BigNumberish): DojoCall => {
		return {
			contractName: "fame_coin",
			entrypoint: "transferFrom",
			calldata: [sender, recipient, amount],
		};
	};

	const fame_coin_transferFrom = async (snAccount: Account | AccountInterface, sender: string, recipient: string, amount: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_fame_coin_transferFrom_calldata(sender, recipient, amount),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_fame_coin_transferFromToken_calldata = (contractAddress: string, senderTokenId: BigNumberish, recipient: string, amount: BigNumberish): DojoCall => {
		return {
			contractName: "fame_coin",
			entrypoint: "transfer_from_token",
			calldata: [contractAddress, senderTokenId, recipient, amount],
		};
	};

	const fame_coin_transferFromToken = async (snAccount: Account | AccountInterface, contractAddress: string, senderTokenId: BigNumberish, recipient: string, amount: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_fame_coin_transferFromToken_calldata(contractAddress, senderTokenId, recipient, amount),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_fame_coin_transferFromTokenToToken_calldata = (contractAddress: string, senderTokenId: BigNumberish, recipientTokenId: BigNumberish, amount: BigNumberish): DojoCall => {
		return {
			contractName: "fame_coin",
			entrypoint: "transfer_from_token_to_token",
			calldata: [contractAddress, senderTokenId, recipientTokenId, amount],
		};
	};

	const fame_coin_transferFromTokenToToken = async (snAccount: Account | AccountInterface, contractAddress: string, senderTokenId: BigNumberish, recipientTokenId: BigNumberish, amount: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_fame_coin_transferFromTokenToToken_calldata(contractAddress, senderTokenId, recipientTokenId, amount),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_fools_coin_allowance_calldata = (owner: string, spender: string): DojoCall => {
		return {
			contractName: "fools_coin",
			entrypoint: "allowance",
			calldata: [owner, spender],
		};
	};

	const fools_coin_allowance = async (owner: string, spender: string) => {
		try {
			return await provider.call("pistols", build_fools_coin_allowance_calldata(owner, spender));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_fools_coin_approve_calldata = (spender: string, amount: BigNumberish): DojoCall => {
		return {
			contractName: "fools_coin",
			entrypoint: "approve",
			calldata: [spender, amount],
		};
	};

	const fools_coin_approve = async (snAccount: Account | AccountInterface, spender: string, amount: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_fools_coin_approve_calldata(spender, amount),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_fools_coin_balanceOf_calldata = (account: string): DojoCall => {
		return {
			contractName: "fools_coin",
			entrypoint: "balanceOf",
			calldata: [account],
		};
	};

	const fools_coin_balanceOf = async (account: string) => {
		try {
			return await provider.call("pistols", build_fools_coin_balanceOf_calldata(account));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_fools_coin_decimals_calldata = (): DojoCall => {
		return {
			contractName: "fools_coin",
			entrypoint: "decimals",
			calldata: [],
		};
	};

	const fools_coin_decimals = async () => {
		try {
			return await provider.call("pistols", build_fools_coin_decimals_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_fools_coin_name_calldata = (): DojoCall => {
		return {
			contractName: "fools_coin",
			entrypoint: "name",
			calldata: [],
		};
	};

	const fools_coin_name = async () => {
		try {
			return await provider.call("pistols", build_fools_coin_name_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_fools_coin_rewardPlayer_calldata = (recipient: string, amount: BigNumberish): DojoCall => {
		return {
			contractName: "fools_coin",
			entrypoint: "reward_player",
			calldata: [recipient, amount],
		};
	};

	const fools_coin_rewardPlayer = async (snAccount: Account | AccountInterface, recipient: string, amount: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_fools_coin_rewardPlayer_calldata(recipient, amount),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_fools_coin_symbol_calldata = (): DojoCall => {
		return {
			contractName: "fools_coin",
			entrypoint: "symbol",
			calldata: [],
		};
	};

	const fools_coin_symbol = async () => {
		try {
			return await provider.call("pistols", build_fools_coin_symbol_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_fools_coin_totalSupply_calldata = (): DojoCall => {
		return {
			contractName: "fools_coin",
			entrypoint: "totalSupply",
			calldata: [],
		};
	};

	const fools_coin_totalSupply = async () => {
		try {
			return await provider.call("pistols", build_fools_coin_totalSupply_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_fools_coin_transfer_calldata = (recipient: string, amount: BigNumberish): DojoCall => {
		return {
			contractName: "fools_coin",
			entrypoint: "transfer",
			calldata: [recipient, amount],
		};
	};

	const fools_coin_transfer = async (snAccount: Account | AccountInterface, recipient: string, amount: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_fools_coin_transfer_calldata(recipient, amount),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_fools_coin_transferFrom_calldata = (sender: string, recipient: string, amount: BigNumberish): DojoCall => {
		return {
			contractName: "fools_coin",
			entrypoint: "transferFrom",
			calldata: [sender, recipient, amount],
		};
	};

	const fools_coin_transferFrom = async (snAccount: Account | AccountInterface, sender: string, recipient: string, amount: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_fools_coin_transferFrom_calldata(sender, recipient, amount),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_calcSeasonReward_calldata = (seasonId: BigNumberish, duelistId: BigNumberish, livesStaked: BigNumberish): DojoCall => {
		return {
			contractName: "game",
			entrypoint: "calc_season_reward",
			calldata: [seasonId, duelistId, livesStaked],
		};
	};

	const game_calcSeasonReward = async (seasonId: BigNumberish, duelistId: BigNumberish, livesStaked: BigNumberish) => {
		try {
			return await provider.call("pistols", build_game_calcSeasonReward_calldata(seasonId, duelistId, livesStaked));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_canCollectDuel_calldata = (duelId: BigNumberish): DojoCall => {
		return {
			contractName: "game",
			entrypoint: "can_collect_duel",
			calldata: [duelId],
		};
	};

	const game_canCollectDuel = async (duelId: BigNumberish) => {
		try {
			return await provider.call("pistols", build_game_canCollectDuel_calldata(duelId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_clearCallToAction_calldata = (duelistId: BigNumberish): DojoCall => {
		return {
			contractName: "game",
			entrypoint: "clear_call_to_action",
			calldata: [duelistId],
		};
	};

	const game_clearCallToAction = async (snAccount: Account | AccountInterface, duelistId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_game_clearCallToAction_calldata(duelistId),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_clearPlayerSocialLink_calldata = (socialPlatform: CairoCustomEnum): DojoCall => {
		return {
			contractName: "game",
			entrypoint: "clear_player_social_link",
			calldata: [socialPlatform],
		};
	};

	const game_clearPlayerSocialLink = async (snAccount: Account | AccountInterface, socialPlatform: CairoCustomEnum) => {
		try {
			return await provider.execute(
				snAccount,
				build_game_clearPlayerSocialLink_calldata(socialPlatform),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_collectDuel_calldata = (duelId: BigNumberish): DojoCall => {
		return {
			contractName: "game",
			entrypoint: "collect_duel",
			calldata: [duelId],
		};
	};

	const game_collectDuel = async (snAccount: Account | AccountInterface, duelId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_game_collectDuel_calldata(duelId),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_commitMoves_calldata = (duelistId: BigNumberish, duelId: BigNumberish, hashed: BigNumberish): DojoCall => {
		return {
			contractName: "game",
			entrypoint: "commit_moves",
			calldata: [duelistId, duelId, hashed],
		};
	};

	const game_commitMoves = async (snAccount: Account | AccountInterface, duelistId: BigNumberish, duelId: BigNumberish, hashed: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_game_commitMoves_calldata(duelistId, duelId, hashed),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_createTrophies_calldata = (): DojoCall => {
		return {
			contractName: "game",
			entrypoint: "create_trophies",
			calldata: [],
		};
	};

	const game_createTrophies = async (snAccount: Account | AccountInterface) => {
		try {
			return await provider.execute(
				snAccount,
				build_game_createTrophies_calldata(),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_doThatThing_calldata = (): DojoCall => {
		return {
			contractName: "game",
			entrypoint: "do_that_thing",
			calldata: [],
		};
	};

	const game_doThatThing = async (snAccount: Account | AccountInterface) => {
		try {
			return await provider.execute(
				snAccount,
				build_game_doThatThing_calldata(),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_emitPlayerBookmark_calldata = (targetAddress: string, targetId: BigNumberish, enabled: boolean): DojoCall => {
		return {
			contractName: "game",
			entrypoint: "emit_player_bookmark",
			calldata: [targetAddress, targetId, enabled],
		};
	};

	const game_emitPlayerBookmark = async (snAccount: Account | AccountInterface, targetAddress: string, targetId: BigNumberish, enabled: boolean) => {
		try {
			return await provider.execute(
				snAccount,
				build_game_emitPlayerBookmark_calldata(targetAddress, targetId, enabled),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

  const build_game_emitPlayerSocialLink_calldata = (socialPlatform: CairoCustomEnum, playerAddress: string, userName: string, userId: string): DojoCall => {
		return {
			contractName: "game",
			entrypoint: "emit_player_social_link",
			calldata: [socialPlatform, playerAddress, userName, userId],
		};
	};

  const game_emitPlayerSocialLink = async (snAccount: Account | AccountInterface, socialPlatform: CairoCustomEnum, playerAddress: string, userName: string, userId: string) => {
		try {
			return await provider.execute(
				snAccount,
				build_game_emitPlayerSocialLink_calldata(socialPlatform, playerAddress, userName, userId),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_getDuelDeck_calldata = (duelId: BigNumberish): DojoCall => {
		return {
			contractName: "game",
			entrypoint: "get_duel_deck",
			calldata: [duelId],
		};
	};

	const game_getDuelDeck = async (duelId: BigNumberish) => {
		try {
			return await provider.call("pistols", build_game_getDuelDeck_calldata(duelId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_getDuelProgress_calldata = (duelId: BigNumberish): DojoCall => {
		return {
			contractName: "game",
			entrypoint: "get_duel_progress",
			calldata: [duelId],
		};
	};

	const game_getDuelProgress = async (duelId: BigNumberish) => {
		try {
			return await provider.call("pistols", build_game_getDuelProgress_calldata(duelId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_getDuelistLeaderboardPosition_calldata = (seasonId: BigNumberish, duelistId: BigNumberish): DojoCall => {
		return {
			contractName: "game",
			entrypoint: "get_duelist_leaderboard_position",
			calldata: [seasonId, duelistId],
		};
	};

	const game_getDuelistLeaderboardPosition = async (seasonId: BigNumberish, duelistId: BigNumberish) => {
		try {
			return await provider.call("pistols", build_game_getDuelistLeaderboardPosition_calldata(seasonId, duelistId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_getLeaderboard_calldata = (seasonId: BigNumberish): DojoCall => {
		return {
			contractName: "game",
			entrypoint: "get_leaderboard",
			calldata: [seasonId],
		};
	};

	const game_getLeaderboard = async (seasonId: BigNumberish) => {
		try {
			return await provider.call("pistols", build_game_getLeaderboard_calldata(seasonId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_getTimestamp_calldata = (): DojoCall => {
		return {
			contractName: "game",
			entrypoint: "get_timestamp",
			calldata: [],
		};
	};

	const game_getTimestamp = async () => {
		try {
			return await provider.call("pistols", build_game_getTimestamp_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	// const build_game_loop_executeGameLoop_calldata = (wrapped: models.RngWrap, deck: models.Deck, round: models.Round): DojoCall => {
	// 	return {
	// 		contractName: "game_loop",
	// 		entrypoint: "execute_game_loop",
	// 		calldata: [wrapped, deck, round],
	// 	};
	// };

	// const game_loop_executeGameLoop = async (wrapped: models.RngWrap, deck: models.Deck, round: models.Round) => {
	// 	try {
	// 		return await provider.call("pistols", build_game_loop_executeGameLoop_calldata(wrapped, deck, round));
	// 	} catch (error) {
	// 		console.error(error);
	// 		throw error;
	// 	}
	// };

	const build_game_revealMoves_calldata = (duelistId: BigNumberish, duelId: BigNumberish, salt: BigNumberish, moves: Array<BigNumberish>): DojoCall => {
		return {
			contractName: "game",
			entrypoint: "reveal_moves",
			calldata: [duelistId, duelId, salt, moves],
		};
	};

	const game_revealMoves = async (snAccount: Account | AccountInterface, duelistId: BigNumberish, duelId: BigNumberish, salt: BigNumberish, moves: Array<BigNumberish>) => {
		try {
			return await provider.execute(
				snAccount,
				build_game_revealMoves_calldata(duelistId, duelId, salt, moves),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_lords_mock_allowance_calldata = (owner: string, spender: string): DojoCall => {
		return {
			contractName: "lords_mock",
			entrypoint: "allowance",
			calldata: [owner, spender],
		};
	};

	const lords_mock_allowance = async (owner: string, spender: string) => {
		try {
			return await provider.call("pistols", build_lords_mock_allowance_calldata(owner, spender));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_lords_mock_approve_calldata = (spender: string, amount: BigNumberish): DojoCall => {
		return {
			contractName: "lords_mock",
			entrypoint: "approve",
			calldata: [spender, amount],
		};
	};

	const lords_mock_approve = async (snAccount: Account | AccountInterface, spender: string, amount: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_lords_mock_approve_calldata(spender, amount),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_lords_mock_balanceOf_calldata = (account: string): DojoCall => {
		return {
			contractName: "lords_mock",
			entrypoint: "balanceOf",
			calldata: [account],
		};
	};

	const lords_mock_balanceOf = async (account: string) => {
		try {
			return await provider.call("pistols", build_lords_mock_balanceOf_calldata(account));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_lords_mock_decimals_calldata = (): DojoCall => {
		return {
			contractName: "lords_mock",
			entrypoint: "decimals",
			calldata: [],
		};
	};

	const lords_mock_decimals = async () => {
		try {
			return await provider.call("pistols", build_lords_mock_decimals_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_lords_mock_faucet_calldata = (): DojoCall => {
		return {
			contractName: "lords_mock",
			entrypoint: "faucet",
			calldata: [],
		};
	};

	const lords_mock_faucet = async (snAccount: Account | AccountInterface) => {
		try {
			return await provider.execute(
				snAccount,
				build_lords_mock_faucet_calldata(),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_lords_mock_mint_calldata = (recipient: string, amount: BigNumberish): DojoCall => {
		return {
			contractName: "lords_mock",
			entrypoint: "mint",
			calldata: [recipient, amount],
		};
	};

	const lords_mock_mint = async (snAccount: Account | AccountInterface, recipient: string, amount: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_lords_mock_mint_calldata(recipient, amount),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_lords_mock_name_calldata = (): DojoCall => {
		return {
			contractName: "lords_mock",
			entrypoint: "name",
			calldata: [],
		};
	};

	const lords_mock_name = async () => {
		try {
			return await provider.call("pistols", build_lords_mock_name_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_lords_mock_symbol_calldata = (): DojoCall => {
		return {
			contractName: "lords_mock",
			entrypoint: "symbol",
			calldata: [],
		};
	};

	const lords_mock_symbol = async () => {
		try {
			return await provider.call("pistols", build_lords_mock_symbol_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_lords_mock_totalSupply_calldata = (): DojoCall => {
		return {
			contractName: "lords_mock",
			entrypoint: "totalSupply",
			calldata: [],
		};
	};

	const lords_mock_totalSupply = async () => {
		try {
			return await provider.call("pistols", build_lords_mock_totalSupply_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_lords_mock_transfer_calldata = (recipient: string, amount: BigNumberish): DojoCall => {
		return {
			contractName: "lords_mock",
			entrypoint: "transfer",
			calldata: [recipient, amount],
		};
	};

	const lords_mock_transfer = async (snAccount: Account | AccountInterface, recipient: string, amount: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_lords_mock_transfer_calldata(recipient, amount),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_lords_mock_transferFrom_calldata = (sender: string, recipient: string, amount: BigNumberish): DojoCall => {
		return {
			contractName: "lords_mock",
			entrypoint: "transferFrom",
			calldata: [sender, recipient, amount],
		};
	};

	const lords_mock_transferFrom = async (snAccount: Account | AccountInterface, sender: string, recipient: string, amount: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_lords_mock_transferFrom_calldata(sender, recipient, amount),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_pack_token_approve_calldata = (to: string, tokenId: BigNumberish): DojoCall => {
		return {
			contractName: "pack_token",
			entrypoint: "approve",
			calldata: [to, tokenId],
		};
	};

	const pack_token_approve = async (snAccount: Account | AccountInterface, to: string, tokenId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_pack_token_approve_calldata(to, tokenId),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_pack_token_balanceOf_calldata = (account: string): DojoCall => {
		return {
			contractName: "pack_token",
			entrypoint: "balanceOf",
			calldata: [account],
		};
	};

	const pack_token_balanceOf = async (account: string) => {
		try {
			return await provider.call("pistols", build_pack_token_balanceOf_calldata(account));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_pack_token_calcMintFee_calldata = (recipient: string, packType: CairoCustomEnum): DojoCall => {
		return {
			contractName: "pack_token",
			entrypoint: "calc_mint_fee",
			calldata: [recipient, packType],
		};
	};

	const pack_token_calcMintFee = async (recipient: string, packType: CairoCustomEnum) => {
		try {
			return await provider.call("pistols", build_pack_token_calcMintFee_calldata(recipient, packType));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_pack_token_canClaimGift_calldata = (recipient: string): DojoCall => {
		return {
			contractName: "pack_token",
			entrypoint: "can_claim_gift",
			calldata: [recipient],
		};
	};

	const pack_token_canClaimGift = async (recipient: string) => {
		try {
			return await provider.call("pistols", build_pack_token_canClaimGift_calldata(recipient));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_pack_token_canClaimStarterPack_calldata = (recipient: string): DojoCall => {
		return {
			contractName: "pack_token",
			entrypoint: "can_claim_starter_pack",
			calldata: [recipient],
		};
	};

	const pack_token_canClaimStarterPack = async (recipient: string) => {
		try {
			return await provider.call("pistols", build_pack_token_canClaimStarterPack_calldata(recipient));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_pack_token_canMint_calldata = (recipient: string): DojoCall => {
		return {
			contractName: "pack_token",
			entrypoint: "can_mint",
			calldata: [recipient],
		};
	};

	const pack_token_canMint = async (recipient: string) => {
		try {
			return await provider.call("pistols", build_pack_token_canMint_calldata(recipient));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_pack_token_canPurchase_calldata = (recipient: string, packType: CairoCustomEnum): DojoCall => {
		return {
			contractName: "pack_token",
			entrypoint: "can_purchase",
			calldata: [recipient, packType],
		};
	};

	const pack_token_canPurchase = async (recipient: string, packType: CairoCustomEnum) => {
		try {
			return await provider.call("pistols", build_pack_token_canPurchase_calldata(recipient, packType));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_pack_token_claimGift_calldata = (): DojoCall => {
		return {
			contractName: "pack_token",
			entrypoint: "claim_gift",
			calldata: [],
		};
	};

	const pack_token_claimGift = async (snAccount: Account | AccountInterface) => {
		try {
			return await provider.execute(
				snAccount,
				build_pack_token_claimGift_calldata(),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_pack_token_claimStarterPack_calldata = (): DojoCall => {
		return {
			contractName: "pack_token",
			entrypoint: "claim_starter_pack",
			calldata: [],
		};
	};

	const pack_token_claimStarterPack = async (snAccount: Account | AccountInterface) => {
		try {
			return await provider.execute(
				snAccount,
				build_pack_token_claimStarterPack_calldata(),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_pack_token_contractUri_calldata = (): DojoCall => {
		return {
			contractName: "pack_token",
			entrypoint: "contractURI",
			calldata: [],
		};
	};

	const pack_token_contractUri = async () => {
		try {
			return await provider.call("pistols", build_pack_token_contractUri_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_pack_token_defaultRoyalty_calldata = (): DojoCall => {
		return {
			contractName: "pack_token",
			entrypoint: "defaultRoyalty",
			calldata: [],
		};
	};

	const pack_token_defaultRoyalty = async () => {
		try {
			return await provider.call("pistols", build_pack_token_defaultRoyalty_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_pack_token_getApproved_calldata = (tokenId: BigNumberish): DojoCall => {
		return {
			contractName: "pack_token",
			entrypoint: "getApproved",
			calldata: [tokenId],
		};
	};

	const pack_token_getApproved = async (tokenId: BigNumberish) => {
		try {
			return await provider.call("pistols", build_pack_token_getApproved_calldata(tokenId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_pack_token_isApprovedForAll_calldata = (owner: string, operator: string): DojoCall => {
		return {
			contractName: "pack_token",
			entrypoint: "isApprovedForAll",
			calldata: [owner, operator],
		};
	};

	const pack_token_isApprovedForAll = async (owner: string, operator: string) => {
		try {
			return await provider.call("pistols", build_pack_token_isApprovedForAll_calldata(owner, operator));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_pack_token_isMintingPaused_calldata = (): DojoCall => {
		return {
			contractName: "pack_token",
			entrypoint: "is_minting_paused",
			calldata: [],
		};
	};

	const pack_token_isMintingPaused = async () => {
		try {
			return await provider.call("pistols", build_pack_token_isMintingPaused_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_pack_token_isOwnerOf_calldata = (address: string, tokenId: BigNumberish): DojoCall => {
		return {
			contractName: "pack_token",
			entrypoint: "is_owner_of",
			calldata: [address, tokenId],
		};
	};

	const pack_token_isOwnerOf = async (address: string, tokenId: BigNumberish) => {
		try {
			return await provider.call("pistols", build_pack_token_isOwnerOf_calldata(address, tokenId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_pack_token_lastTokenId_calldata = (): DojoCall => {
		return {
			contractName: "pack_token",
			entrypoint: "last_token_id",
			calldata: [],
		};
	};

	const pack_token_lastTokenId = async () => {
		try {
			return await provider.call("pistols", build_pack_token_lastTokenId_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_pack_token_maxSupply_calldata = (): DojoCall => {
		return {
			contractName: "pack_token",
			entrypoint: "maxSupply",
			calldata: [],
		};
	};

	const pack_token_maxSupply = async () => {
		try {
			return await provider.call("pistols", build_pack_token_maxSupply_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_pack_token_name_calldata = (): DojoCall => {
		return {
			contractName: "pack_token",
			entrypoint: "name",
			calldata: [],
		};
	};

	const pack_token_name = async () => {
		try {
			return await provider.call("pistols", build_pack_token_name_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_pack_token_open_calldata = (packId: BigNumberish): DojoCall => {
		return {
			contractName: "pack_token",
			entrypoint: "open",
			calldata: [packId],
		};
	};

	const pack_token_open = async (snAccount: Account | AccountInterface, packId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_pack_token_open_calldata(packId),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_pack_token_ownerOf_calldata = (tokenId: BigNumberish): DojoCall => {
		return {
			contractName: "pack_token",
			entrypoint: "ownerOf",
			calldata: [tokenId],
		};
	};

	const pack_token_ownerOf = async (tokenId: BigNumberish) => {
		try {
			return await provider.call("pistols", build_pack_token_ownerOf_calldata(tokenId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_pack_token_purchase_calldata = (packType: CairoCustomEnum): DojoCall => {
		return {
			contractName: "pack_token",
			entrypoint: "purchase",
			calldata: [packType],
		};
	};

	const pack_token_purchase = async (snAccount: Account | AccountInterface, packType: CairoCustomEnum) => {
		try {
			return await provider.execute(
				snAccount,
				build_pack_token_purchase_calldata(packType),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_pack_token_royaltyInfo_calldata = (tokenId: BigNumberish, salePrice: BigNumberish): DojoCall => {
		return {
			contractName: "pack_token",
			entrypoint: "royaltyInfo",
			calldata: [tokenId, salePrice],
		};
	};

	const pack_token_royaltyInfo = async (tokenId: BigNumberish, salePrice: BigNumberish) => {
		try {
			return await provider.call("pistols", build_pack_token_royaltyInfo_calldata(tokenId, salePrice));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_pack_token_safeTransferFrom_calldata = (from: string, to: string, tokenId: BigNumberish, data: Array<BigNumberish>): DojoCall => {
		return {
			contractName: "pack_token",
			entrypoint: "safeTransferFrom",
			calldata: [from, to, tokenId, data],
		};
	};

	const pack_token_safeTransferFrom = async (snAccount: Account | AccountInterface, from: string, to: string, tokenId: BigNumberish, data: Array<BigNumberish>) => {
		try {
			return await provider.execute(
				snAccount,
				build_pack_token_safeTransferFrom_calldata(from, to, tokenId, data),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_pack_token_setApprovalForAll_calldata = (operator: string, approved: boolean): DojoCall => {
		return {
			contractName: "pack_token",
			entrypoint: "setApprovalForAll",
			calldata: [operator, approved],
		};
	};

	const pack_token_setApprovalForAll = async (snAccount: Account | AccountInterface, operator: string, approved: boolean) => {
		try {
			return await provider.execute(
				snAccount,
				build_pack_token_setApprovalForAll_calldata(operator, approved),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_pack_token_supportsInterface_calldata = (interfaceId: BigNumberish): DojoCall => {
		return {
			contractName: "pack_token",
			entrypoint: "supports_interface",
			calldata: [interfaceId],
		};
	};

	const pack_token_supportsInterface = async (interfaceId: BigNumberish) => {
		try {
			return await provider.call("pistols", build_pack_token_supportsInterface_calldata(interfaceId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_pack_token_symbol_calldata = (): DojoCall => {
		return {
			contractName: "pack_token",
			entrypoint: "symbol",
			calldata: [],
		};
	};

	const pack_token_symbol = async () => {
		try {
			return await provider.call("pistols", build_pack_token_symbol_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_pack_token_tokenRoyalty_calldata = (tokenId: BigNumberish): DojoCall => {
		return {
			contractName: "pack_token",
			entrypoint: "tokenRoyalty",
			calldata: [tokenId],
		};
	};

	const pack_token_tokenRoyalty = async (tokenId: BigNumberish) => {
		try {
			return await provider.call("pistols", build_pack_token_tokenRoyalty_calldata(tokenId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_pack_token_tokenUri_calldata = (tokenId: BigNumberish): DojoCall => {
		return {
			contractName: "pack_token",
			entrypoint: "tokenURI",
			calldata: [tokenId],
		};
	};

	const pack_token_tokenUri = async (tokenId: BigNumberish) => {
		try {
			return await provider.call("pistols", build_pack_token_tokenUri_calldata(tokenId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_pack_token_tokenExists_calldata = (tokenId: BigNumberish): DojoCall => {
		return {
			contractName: "pack_token",
			entrypoint: "token_exists",
			calldata: [tokenId],
		};
	};

	const pack_token_tokenExists = async (tokenId: BigNumberish) => {
		try {
			return await provider.call("pistols", build_pack_token_tokenExists_calldata(tokenId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_pack_token_totalSupply_calldata = (): DojoCall => {
		return {
			contractName: "pack_token",
			entrypoint: "totalSupply",
			calldata: [],
		};
	};

	const pack_token_totalSupply = async () => {
		try {
			return await provider.call("pistols", build_pack_token_totalSupply_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_pack_token_transferFrom_calldata = (from: string, to: string, tokenId: BigNumberish): DojoCall => {
		return {
			contractName: "pack_token",
			entrypoint: "transferFrom",
			calldata: [from, to, tokenId],
		};
	};

	const pack_token_transferFrom = async (snAccount: Account | AccountInterface, from: string, to: string, tokenId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_pack_token_transferFrom_calldata(from, to, tokenId),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_pack_token_updateContractMetadata_calldata = (): DojoCall => {
		return {
			contractName: "pack_token",
			entrypoint: "update_contract_metadata",
			calldata: [],
		};
	};

	const pack_token_updateContractMetadata = async (snAccount: Account | AccountInterface) => {
		try {
			return await provider.execute(
				snAccount,
				build_pack_token_updateContractMetadata_calldata(),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_pack_token_updateTokenMetadata_calldata = (tokenId: BigNumberish): DojoCall => {
		return {
			contractName: "pack_token",
			entrypoint: "update_token_metadata",
			calldata: [tokenId],
		};
	};

	const pack_token_updateTokenMetadata = async (snAccount: Account | AccountInterface, tokenId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_pack_token_updateTokenMetadata_calldata(tokenId),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_pack_token_updateTokensMetadata_calldata = (fromTokenId: BigNumberish, toTokenId: BigNumberish): DojoCall => {
		return {
			contractName: "pack_token",
			entrypoint: "update_tokens_metadata",
			calldata: [fromTokenId, toTokenId],
		};
	};

	const pack_token_updateTokensMetadata = async (snAccount: Account | AccountInterface, fromTokenId: BigNumberish, toTokenId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_pack_token_updateTokensMetadata_calldata(fromTokenId, toTokenId),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	// const build_rng_isMocked_calldata = (salt: BigNumberish): DojoCall => {
	// 	return {
	// 		contractName: "rng",
	// 		entrypoint: "is_mocked",
	// 		calldata: [salt],
	// 	};
	// };

	// const rng_isMocked = async (salt: BigNumberish) => {
	// 	try {
	// 		return await provider.call("pistols", build_rng_isMocked_calldata(salt));
	// 	} catch (error) {
	// 		console.error(error);
	// 		throw error;
	// 	}
	// };

	// const build_rng_mock_isMocked_calldata = (salt: BigNumberish): DojoCall => {
	// 	return {
	// 		contractName: "rng_mock",
	// 		entrypoint: "is_mocked",
	// 		calldata: [salt],
	// 	};
	// };

	// const rng_mock_isMocked = async (salt: BigNumberish) => {
	// 	try {
	// 		return await provider.call("pistols", build_rng_mock_isMocked_calldata(salt));
	// 	} catch (error) {
	// 		console.error(error);
	// 		throw error;
	// 	}
	// };

	// const build_rng_mock_mockValues_calldata = (mocked: Array<MockedValue>): DojoCall => {
	// 	return {
	// 		contractName: "rng_mock",
	// 		entrypoint: "mock_values",
	// 		calldata: [mocked],
	// 	};
	// };

	// const rng_mock_mockValues = async (snAccount: Account | AccountInterface, mocked: Array<MockedValue>) => {
	// 	try {
	// 		return await provider.execute(
	// 			snAccount,
	// 			build_rng_mock_mockValues_calldata(mocked),
	// 			"pistols",
	// 		);
	// 	} catch (error) {
	// 		console.error(error);
	// 		throw error;
	// 	}
	// };

	// const build_rng_mock_reseed_calldata = (seed: BigNumberish, salt: BigNumberish, mocked: Array<MockedValue>): DojoCall => {
	// 	return {
	// 		contractName: "rng_mock",
	// 		entrypoint: "reseed",
	// 		calldata: [seed, salt, mocked],
	// 	};
	// };

	// const rng_mock_reseed = async (seed: BigNumberish, salt: BigNumberish, mocked: Array<MockedValue>) => {
	// 	try {
	// 		return await provider.call("pistols", build_rng_mock_reseed_calldata(seed, salt, mocked));
	// 	} catch (error) {
	// 		console.error(error);
	// 		throw error;
	// 	}
	// };

	// const build_rng_reseed_calldata = (seed: BigNumberish, salt: BigNumberish, mocked: Array<MockedValue>): DojoCall => {
	// 	return {
	// 		contractName: "rng",
	// 		entrypoint: "reseed",
	// 		calldata: [seed, salt, mocked],
	// 	};
	// };

	// const rng_reseed = async (seed: BigNumberish, salt: BigNumberish, mocked: Array<MockedValue>) => {
	// 	try {
	// 		return await provider.call("pistols", build_rng_reseed_calldata(seed, salt, mocked));
	// 	} catch (error) {
	// 		console.error(error);
	// 		throw error;
	// 	}
	// };

	const build_tutorial_calcDuelId_calldata = (playerId: BigNumberish, tutorialId: BigNumberish): DojoCall => {
		return {
			contractName: "tutorial",
			entrypoint: "calc_duel_id",
			calldata: [playerId, tutorialId],
		};
	};

	const tutorial_calcDuelId = async (playerId: BigNumberish, tutorialId: BigNumberish) => {
		try {
			return await provider.call("pistols", build_tutorial_calcDuelId_calldata(playerId, tutorialId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_tutorial_commitMoves_calldata = (duelistId: BigNumberish, duelId: BigNumberish, hashed: BigNumberish): DojoCall => {
		return {
			contractName: "tutorial",
			entrypoint: "commit_moves",
			calldata: [duelistId, duelId, hashed],
		};
	};

	const tutorial_commitMoves = async (snAccount: Account | AccountInterface, duelistId: BigNumberish, duelId: BigNumberish, hashed: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_tutorial_commitMoves_calldata(duelistId, duelId, hashed),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_tutorial_createTutorial_calldata = (playerId: BigNumberish, tutorialId: BigNumberish): DojoCall => {
		return {
			contractName: "tutorial",
			entrypoint: "create_tutorial",
			calldata: [playerId, tutorialId],
		};
	};

	const tutorial_createTutorial = async (snAccount: Account | AccountInterface, playerId: BigNumberish, tutorialId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_tutorial_createTutorial_calldata(playerId, tutorialId),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_tutorial_getDuelProgress_calldata = (duelId: BigNumberish): DojoCall => {
		return {
			contractName: "tutorial",
			entrypoint: "get_duel_progress",
			calldata: [duelId],
		};
	};

	const tutorial_getDuelProgress = async (duelId: BigNumberish) => {
		try {
			return await provider.call("pistols", build_tutorial_getDuelProgress_calldata(duelId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_tutorial_revealMoves_calldata = (duelistId: BigNumberish, duelId: BigNumberish, salt: BigNumberish, moves: Array<BigNumberish>): DojoCall => {
		return {
			contractName: "tutorial",
			entrypoint: "reveal_moves",
			calldata: [duelistId, duelId, salt, moves],
		};
	};

	const tutorial_revealMoves = async (snAccount: Account | AccountInterface, duelistId: BigNumberish, duelId: BigNumberish, salt: BigNumberish, moves: Array<BigNumberish>) => {
		try {
			return await provider.execute(
				snAccount,
				build_tutorial_revealMoves_calldata(duelistId, duelId, salt, moves),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_vrf_mock_consumeRandom_calldata = (source: CairoCustomEnum): DojoCall => {
		return {
			contractName: "vrf_mock",
			entrypoint: "consume_random",
			calldata: [source],
		};
	};

	const vrf_mock_consumeRandom = async (snAccount: Account | AccountInterface, source: CairoCustomEnum) => {
		try {
			return await provider.execute(
				snAccount,
				build_vrf_mock_consumeRandom_calldata(source),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_vrf_mock_requestRandom_calldata = (caller: string, source: CairoCustomEnum): DojoCall => {
		return {
			contractName: "vrf_mock",
			entrypoint: "request_random",
			calldata: [caller, source],
		};
	};

	const vrf_mock_requestRandom = async (caller: string, source: CairoCustomEnum) => {
		try {
			return await provider.call("pistols", build_vrf_mock_requestRandom_calldata(caller, source));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};



	return {
		admin: {
			amIAdmin: admin_amIAdmin,
			buildAmIAdminCalldata: build_admin_amIAdmin_calldata,
			disqualifyDuelist: admin_disqualifyDuelist,
			buildDisqualifyDuelistCalldata: build_admin_disqualifyDuelist_calldata,
			fixPlayerBookmark: admin_fixPlayerBookmark,
			buildFixPlayerBookmarkCalldata: build_admin_fixPlayerBookmark_calldata,
			qualifyDuelist: admin_qualifyDuelist,
			buildQualifyDuelistCalldata: build_admin_qualifyDuelist_calldata,
			setIsBlocked: admin_setIsBlocked,
			buildSetIsBlockedCalldata: build_admin_setIsBlocked_calldata,
			setIsTeamMember: admin_setIsTeamMember,
			buildSetIsTeamMemberCalldata: build_admin_setIsTeamMember_calldata,
			setPaused: admin_setPaused,
			buildSetPausedCalldata: build_admin_setPaused_calldata,
			setTreasury: admin_setTreasury,
			buildSetTreasuryCalldata: build_admin_setTreasury_calldata,
			urgentUpdate: admin_urgentUpdate,
			buildUrgentUpdateCalldata: build_admin_urgentUpdate_calldata,
		},
		bank: {
			canCollectSeason: bank_canCollectSeason,
			buildCanCollectSeasonCalldata: build_bank_canCollectSeason_calldata,
			chargePurchase: bank_chargePurchase,
			buildChargePurchaseCalldata: build_bank_chargePurchase_calldata,
			collectSeason: bank_collectSeason,
			buildCollectSeasonCalldata: build_bank_collectSeason_calldata,
			duelistLostFameToPool: bank_duelistLostFameToPool,
			buildDuelistLostFameToPoolCalldata: build_bank_duelistLostFameToPool_calldata,
			pegMintedFameToLords: bank_pegMintedFameToLords,
			buildPegMintedFameToLordsCalldata: build_bank_pegMintedFameToLords_calldata,
			// releaseLordsFromFameToBeBurned: bank_releaseLordsFromFameToBeBurned,
			// buildReleaseLordsFromFameToBeBurnedCalldata: build_bank_releaseLordsFromFameToBeBurned_calldata,
			sponsorDuelists: bank_sponsorDuelists,
			buildSponsorDuelistsCalldata: build_bank_sponsorDuelists_calldata,
			sponsorSeason: bank_sponsorSeason,
			buildSponsorSeasonCalldata: build_bank_sponsorSeason_calldata,
			sponsorTournament: bank_sponsorTournament,
			buildSponsorTournamentCalldata: build_bank_sponsorTournament_calldata,
		},
		duel_token: {
			approve: duel_token_approve,
			buildApproveCalldata: build_duel_token_approve_calldata,
			balanceOf: duel_token_balanceOf,
			buildBalanceOfCalldata: build_duel_token_balanceOf_calldata,
			canMint: duel_token_canMint,
			buildCanMintCalldata: build_duel_token_canMint_calldata,
			contractUri: duel_token_contractUri,
			buildContractUriCalldata: build_duel_token_contractUri_calldata,
			createDuel: duel_token_createDuel,
			buildCreateDuelCalldata: build_duel_token_createDuel_calldata,
			defaultRoyalty: duel_token_defaultRoyalty,
			buildDefaultRoyaltyCalldata: build_duel_token_defaultRoyalty_calldata,
			getApproved: duel_token_getApproved,
			buildGetApprovedCalldata: build_duel_token_getApproved_calldata,
			getPact: duel_token_getPact,
			buildGetPactCalldata: build_duel_token_getPact_calldata,
			hasPact: duel_token_hasPact,
			buildHasPactCalldata: build_duel_token_hasPact_calldata,
			isApprovedForAll: duel_token_isApprovedForAll,
			buildIsApprovedForAllCalldata: build_duel_token_isApprovedForAll_calldata,
			isMintingPaused: duel_token_isMintingPaused,
			buildIsMintingPausedCalldata: build_duel_token_isMintingPaused_calldata,
			isOwnerOf: duel_token_isOwnerOf,
			buildIsOwnerOfCalldata: build_duel_token_isOwnerOf_calldata,
			lastTokenId: duel_token_lastTokenId,
			buildLastTokenIdCalldata: build_duel_token_lastTokenId_calldata,
			maxSupply: duel_token_maxSupply,
			buildMaxSupplyCalldata: build_duel_token_maxSupply_calldata,
			name: duel_token_name,
			buildNameCalldata: build_duel_token_name_calldata,
			ownerOf: duel_token_ownerOf,
			buildOwnerOfCalldata: build_duel_token_ownerOf_calldata,
			replyDuel: duel_token_replyDuel,
			buildReplyDuelCalldata: build_duel_token_replyDuel_calldata,
			royaltyInfo: duel_token_royaltyInfo,
			buildRoyaltyInfoCalldata: build_duel_token_royaltyInfo_calldata,
			safeTransferFrom: duel_token_safeTransferFrom,
			buildSafeTransferFromCalldata: build_duel_token_safeTransferFrom_calldata,
			setApprovalForAll: duel_token_setApprovalForAll,
			buildSetApprovalForAllCalldata: build_duel_token_setApprovalForAll_calldata,
			supportsInterface: duel_token_supportsInterface,
			buildSupportsInterfaceCalldata: build_duel_token_supportsInterface_calldata,
			symbol: duel_token_symbol,
			buildSymbolCalldata: build_duel_token_symbol_calldata,
			tokenRoyalty: duel_token_tokenRoyalty,
			buildTokenRoyaltyCalldata: build_duel_token_tokenRoyalty_calldata,
			tokenUri: duel_token_tokenUri,
			buildTokenUriCalldata: build_duel_token_tokenUri_calldata,
			tokenExists: duel_token_tokenExists,
			buildTokenExistsCalldata: build_duel_token_tokenExists_calldata,
			totalSupply: duel_token_totalSupply,
			buildTotalSupplyCalldata: build_duel_token_totalSupply_calldata,
			transferFrom: duel_token_transferFrom,
			buildTransferFromCalldata: build_duel_token_transferFrom_calldata,
			transferToWinner: duel_token_transferToWinner,
			buildTransferToWinnerCalldata: build_duel_token_transferToWinner_calldata,
			updateContractMetadata: duel_token_updateContractMetadata,
			buildUpdateContractMetadataCalldata: build_duel_token_updateContractMetadata_calldata,
			updateTokenMetadata: duel_token_updateTokenMetadata,
			buildUpdateTokenMetadataCalldata: build_duel_token_updateTokenMetadata_calldata,
			updateTokensMetadata: duel_token_updateTokensMetadata,
			buildUpdateTokensMetadataCalldata: build_duel_token_updateTokensMetadata_calldata,
		},
		duelist_token: {
			approve: duelist_token_approve,
			buildApproveCalldata: build_duelist_token_approve_calldata,
			balanceOf: duelist_token_balanceOf,
			buildBalanceOfCalldata: build_duelist_token_balanceOf_calldata,
			canMint: duelist_token_canMint,
			buildCanMintCalldata: build_duelist_token_canMint_calldata,
			contractUri: duelist_token_contractUri,
			buildContractUriCalldata: build_duelist_token_contractUri_calldata,
			defaultRoyalty: duelist_token_defaultRoyalty,
			buildDefaultRoyaltyCalldata: build_duelist_token_defaultRoyalty_calldata,
			fameBalance: duelist_token_fameBalance,
			buildFameBalanceCalldata: build_duelist_token_fameBalance_calldata,
			getApproved: duelist_token_getApproved,
			buildGetApprovedCalldata: build_duelist_token_getApproved_calldata,
			getValidatedActiveDuelistId: duelist_token_getValidatedActiveDuelistId,
			buildGetValidatedActiveDuelistIdCalldata: build_duelist_token_getValidatedActiveDuelistId_calldata,
			inactiveFameDripped: duelist_token_inactiveFameDripped,
			buildInactiveFameDrippedCalldata: build_duelist_token_inactiveFameDripped_calldata,
			inactiveTimestamp: duelist_token_inactiveTimestamp,
			buildInactiveTimestampCalldata: build_duelist_token_inactiveTimestamp_calldata,
			isApprovedForAll: duelist_token_isApprovedForAll,
			buildIsApprovedForAllCalldata: build_duelist_token_isApprovedForAll_calldata,
			isAlive: duelist_token_isAlive,
			buildIsAliveCalldata: build_duelist_token_isAlive_calldata,
			isInactive: duelist_token_isInactive,
			buildIsInactiveCalldata: build_duelist_token_isInactive_calldata,
			isMintingPaused: duelist_token_isMintingPaused,
			buildIsMintingPausedCalldata: build_duelist_token_isMintingPaused_calldata,
			isOwnerOf: duelist_token_isOwnerOf,
			buildIsOwnerOfCalldata: build_duelist_token_isOwnerOf_calldata,
			lastTokenId: duelist_token_lastTokenId,
			buildLastTokenIdCalldata: build_duelist_token_lastTokenId_calldata,
			lifeCount: duelist_token_lifeCount,
			buildLifeCountCalldata: build_duelist_token_lifeCount_calldata,
			maxSupply: duelist_token_maxSupply,
			buildMaxSupplyCalldata: build_duelist_token_maxSupply_calldata,
			memorialize: duelist_token_memorialize,
			buildMemorializeCalldata: build_duelist_token_memorialize_calldata,
			mintDuelists: duelist_token_mintDuelists,
			buildMintDuelistsCalldata: build_duelist_token_mintDuelists_calldata,
			name: duelist_token_name,
			buildNameCalldata: build_duelist_token_name_calldata,
			ownerOf: duelist_token_ownerOf,
			buildOwnerOfCalldata: build_duelist_token_ownerOf_calldata,
			poke: duelist_token_poke,
			buildPokeCalldata: build_duelist_token_poke_calldata,
			royaltyInfo: duelist_token_royaltyInfo,
			buildRoyaltyInfoCalldata: build_duelist_token_royaltyInfo_calldata,
			sacrifice: duelist_token_sacrifice,
			buildSacrificeCalldata: build_duelist_token_sacrifice_calldata,
			safeTransferFrom: duelist_token_safeTransferFrom,
			buildSafeTransferFromCalldata: build_duelist_token_safeTransferFrom_calldata,
			setApprovalForAll: duelist_token_setApprovalForAll,
			buildSetApprovalForAllCalldata: build_duelist_token_setApprovalForAll_calldata,
			supportsInterface: duelist_token_supportsInterface,
			buildSupportsInterfaceCalldata: build_duelist_token_supportsInterface_calldata,
			symbol: duelist_token_symbol,
			buildSymbolCalldata: build_duelist_token_symbol_calldata,
			tokenRoyalty: duelist_token_tokenRoyalty,
			buildTokenRoyaltyCalldata: build_duelist_token_tokenRoyalty_calldata,
			tokenUri: duelist_token_tokenUri,
			buildTokenUriCalldata: build_duelist_token_tokenUri_calldata,
			tokenExists: duelist_token_tokenExists,
			buildTokenExistsCalldata: build_duelist_token_tokenExists_calldata,
			totalSupply: duelist_token_totalSupply,
			buildTotalSupplyCalldata: build_duelist_token_totalSupply_calldata,
			transferFrom: duelist_token_transferFrom,
			buildTransferFromCalldata: build_duelist_token_transferFrom_calldata,
			// transferRewards: duelist_token_transferRewards,
			// buildTransferRewardsCalldata: build_duelist_token_transferRewards_calldata,
			updateContractMetadata: duelist_token_updateContractMetadata,
			buildUpdateContractMetadataCalldata: build_duelist_token_updateContractMetadata_calldata,
			updateTokenMetadata: duelist_token_updateTokenMetadata,
			buildUpdateTokenMetadataCalldata: build_duelist_token_updateTokenMetadata_calldata,
			updateTokensMetadata: duelist_token_updateTokensMetadata,
			buildUpdateTokensMetadataCalldata: build_duelist_token_updateTokensMetadata_calldata,
		},
		fame_coin: {
			addressOfToken: fame_coin_addressOfToken,
			buildAddressOfTokenCalldata: build_fame_coin_addressOfToken_calldata,
			allowance: fame_coin_allowance,
			buildAllowanceCalldata: build_fame_coin_allowance_calldata,
			approve: fame_coin_approve,
			buildApproveCalldata: build_fame_coin_approve_calldata,
			balanceOf: fame_coin_balanceOf,
			buildBalanceOfCalldata: build_fame_coin_balanceOf_calldata,
			balanceOfToken: fame_coin_balanceOfToken,
			buildBalanceOfTokenCalldata: build_fame_coin_balanceOfToken_calldata,
			burn: fame_coin_burn,
			buildBurnCalldata: build_fame_coin_burn_calldata,
			burnFromToken: fame_coin_burnFromToken,
			buildBurnFromTokenCalldata: build_fame_coin_burnFromToken_calldata,
			decimals: fame_coin_decimals,
			buildDecimalsCalldata: build_fame_coin_decimals_calldata,
			mintedDuelist: fame_coin_mintedDuelist,
			buildMintedDuelistCalldata: build_fame_coin_mintedDuelist_calldata,
			name: fame_coin_name,
			buildNameCalldata: build_fame_coin_name_calldata,
			rewardDuelist: fame_coin_rewardDuelist,
			buildRewardDuelistCalldata: build_fame_coin_rewardDuelist_calldata,
			symbol: fame_coin_symbol,
			buildSymbolCalldata: build_fame_coin_symbol_calldata,
			tokenOfAddress: fame_coin_tokenOfAddress,
			buildTokenOfAddressCalldata: build_fame_coin_tokenOfAddress_calldata,
			totalSupply: fame_coin_totalSupply,
			buildTotalSupplyCalldata: build_fame_coin_totalSupply_calldata,
			transfer: fame_coin_transfer,
			buildTransferCalldata: build_fame_coin_transfer_calldata,
			transferFrom: fame_coin_transferFrom,
			buildTransferFromCalldata: build_fame_coin_transferFrom_calldata,
			transferFromToken: fame_coin_transferFromToken,
			buildTransferFromTokenCalldata: build_fame_coin_transferFromToken_calldata,
			transferFromTokenToToken: fame_coin_transferFromTokenToToken,
			buildTransferFromTokenToTokenCalldata: build_fame_coin_transferFromTokenToToken_calldata,
		},
		fools_coin: {
			allowance: fools_coin_allowance,
			buildAllowanceCalldata: build_fools_coin_allowance_calldata,
			approve: fools_coin_approve,
			buildApproveCalldata: build_fools_coin_approve_calldata,
			balanceOf: fools_coin_balanceOf,
			buildBalanceOfCalldata: build_fools_coin_balanceOf_calldata,
			decimals: fools_coin_decimals,
			buildDecimalsCalldata: build_fools_coin_decimals_calldata,
			name: fools_coin_name,
			buildNameCalldata: build_fools_coin_name_calldata,
			rewardPlayer: fools_coin_rewardPlayer,
			buildRewardPlayerCalldata: build_fools_coin_rewardPlayer_calldata,
			symbol: fools_coin_symbol,
			buildSymbolCalldata: build_fools_coin_symbol_calldata,
			totalSupply: fools_coin_totalSupply,
			buildTotalSupplyCalldata: build_fools_coin_totalSupply_calldata,
			transfer: fools_coin_transfer,
			buildTransferCalldata: build_fools_coin_transfer_calldata,
			transferFrom: fools_coin_transferFrom,
			buildTransferFromCalldata: build_fools_coin_transferFrom_calldata,
		},
		game: {
			calcSeasonReward: game_calcSeasonReward,
			buildCalcSeasonRewardCalldata: build_game_calcSeasonReward_calldata,
			canCollectDuel: game_canCollectDuel,
			buildCanCollectDuelCalldata: build_game_canCollectDuel_calldata,
			clearCallToAction: game_clearCallToAction,
			buildClearCallToActionCalldata: build_game_clearCallToAction_calldata,
			clearPlayerSocialLink: game_clearPlayerSocialLink,
			buildClearPlayerSocialLinkCalldata: build_game_clearPlayerSocialLink_calldata,
			collectDuel: game_collectDuel,
			buildCollectDuelCalldata: build_game_collectDuel_calldata,
			commitMoves: game_commitMoves,
			buildCommitMovesCalldata: build_game_commitMoves_calldata,
			createTrophies: game_createTrophies,
			buildCreateTrophiesCalldata: build_game_createTrophies_calldata,
			doThatThing: game_doThatThing,
			buildDoThatThingCalldata: build_game_doThatThing_calldata,
			emitPlayerBookmark: game_emitPlayerBookmark,
			buildEmitPlayerBookmarkCalldata: build_game_emitPlayerBookmark_calldata,
			emitPlayerSocialLink: game_emitPlayerSocialLink,
			buildEmitPlayerSocialLinkCalldata: build_game_emitPlayerSocialLink_calldata,
			getDuelDeck: game_getDuelDeck,
			buildGetDuelDeckCalldata: build_game_getDuelDeck_calldata,
			getDuelProgress: game_getDuelProgress,
			buildGetDuelProgressCalldata: build_game_getDuelProgress_calldata,
			getDuelistLeaderboardPosition: game_getDuelistLeaderboardPosition,
			buildGetDuelistLeaderboardPositionCalldata: build_game_getDuelistLeaderboardPosition_calldata,
			getLeaderboard: game_getLeaderboard,
			buildGetLeaderboardCalldata: build_game_getLeaderboard_calldata,
			getTimestamp: game_getTimestamp,
			buildGetTimestampCalldata: build_game_getTimestamp_calldata,
			revealMoves: game_revealMoves,
			buildRevealMovesCalldata: build_game_revealMoves_calldata,
		},
		// game_loop: {
		// 	executeGameLoop: game_loop_executeGameLoop,
		// 	buildExecuteGameLoopCalldata: build_game_loop_executeGameLoop_calldata,
		// },
		lords_mock: {
			allowance: lords_mock_allowance,
			buildAllowanceCalldata: build_lords_mock_allowance_calldata,
			approve: lords_mock_approve,
			buildApproveCalldata: build_lords_mock_approve_calldata,
			balanceOf: lords_mock_balanceOf,
			buildBalanceOfCalldata: build_lords_mock_balanceOf_calldata,
			decimals: lords_mock_decimals,
			buildDecimalsCalldata: build_lords_mock_decimals_calldata,
			faucet: lords_mock_faucet,
			buildFaucetCalldata: build_lords_mock_faucet_calldata,
			mint: lords_mock_mint,
			buildMintCalldata: build_lords_mock_mint_calldata,
			name: lords_mock_name,
			buildNameCalldata: build_lords_mock_name_calldata,
			symbol: lords_mock_symbol,
			buildSymbolCalldata: build_lords_mock_symbol_calldata,
			totalSupply: lords_mock_totalSupply,
			buildTotalSupplyCalldata: build_lords_mock_totalSupply_calldata,
			transfer: lords_mock_transfer,
			buildTransferCalldata: build_lords_mock_transfer_calldata,
			transferFrom: lords_mock_transferFrom,
			buildTransferFromCalldata: build_lords_mock_transferFrom_calldata,
		},
		pack_token: {
			approve: pack_token_approve,
			buildApproveCalldata: build_pack_token_approve_calldata,
			balanceOf: pack_token_balanceOf,
			buildBalanceOfCalldata: build_pack_token_balanceOf_calldata,
			calcMintFee: pack_token_calcMintFee,
			buildCalcMintFeeCalldata: build_pack_token_calcMintFee_calldata,
			canClaimGift: pack_token_canClaimGift,
			buildCanClaimGiftCalldata: build_pack_token_canClaimGift_calldata,
			canClaimStarterPack: pack_token_canClaimStarterPack,
			buildCanClaimStarterPackCalldata: build_pack_token_canClaimStarterPack_calldata,
			canMint: pack_token_canMint,
			buildCanMintCalldata: build_pack_token_canMint_calldata,
			canPurchase: pack_token_canPurchase,
			buildCanPurchaseCalldata: build_pack_token_canPurchase_calldata,
			claimGift: pack_token_claimGift,
			buildClaimGiftCalldata: build_pack_token_claimGift_calldata,
			claimStarterPack: pack_token_claimStarterPack,
			buildClaimStarterPackCalldata: build_pack_token_claimStarterPack_calldata,
			contractUri: pack_token_contractUri,
			buildContractUriCalldata: build_pack_token_contractUri_calldata,
			defaultRoyalty: pack_token_defaultRoyalty,
			buildDefaultRoyaltyCalldata: build_pack_token_defaultRoyalty_calldata,
			getApproved: pack_token_getApproved,
			buildGetApprovedCalldata: build_pack_token_getApproved_calldata,
			isApprovedForAll: pack_token_isApprovedForAll,
			buildIsApprovedForAllCalldata: build_pack_token_isApprovedForAll_calldata,
			isMintingPaused: pack_token_isMintingPaused,
			buildIsMintingPausedCalldata: build_pack_token_isMintingPaused_calldata,
			isOwnerOf: pack_token_isOwnerOf,
			buildIsOwnerOfCalldata: build_pack_token_isOwnerOf_calldata,
			lastTokenId: pack_token_lastTokenId,
			buildLastTokenIdCalldata: build_pack_token_lastTokenId_calldata,
			maxSupply: pack_token_maxSupply,
			buildMaxSupplyCalldata: build_pack_token_maxSupply_calldata,
			name: pack_token_name,
			buildNameCalldata: build_pack_token_name_calldata,
			open: pack_token_open,
			buildOpenCalldata: build_pack_token_open_calldata,
			ownerOf: pack_token_ownerOf,
			buildOwnerOfCalldata: build_pack_token_ownerOf_calldata,
			purchase: pack_token_purchase,
			buildPurchaseCalldata: build_pack_token_purchase_calldata,
			royaltyInfo: pack_token_royaltyInfo,
			buildRoyaltyInfoCalldata: build_pack_token_royaltyInfo_calldata,
			safeTransferFrom: pack_token_safeTransferFrom,
			buildSafeTransferFromCalldata: build_pack_token_safeTransferFrom_calldata,
			setApprovalForAll: pack_token_setApprovalForAll,
			buildSetApprovalForAllCalldata: build_pack_token_setApprovalForAll_calldata,
			supportsInterface: pack_token_supportsInterface,
			buildSupportsInterfaceCalldata: build_pack_token_supportsInterface_calldata,
			symbol: pack_token_symbol,
			buildSymbolCalldata: build_pack_token_symbol_calldata,
			tokenRoyalty: pack_token_tokenRoyalty,
			buildTokenRoyaltyCalldata: build_pack_token_tokenRoyalty_calldata,
			tokenUri: pack_token_tokenUri,
			buildTokenUriCalldata: build_pack_token_tokenUri_calldata,
			tokenExists: pack_token_tokenExists,
			buildTokenExistsCalldata: build_pack_token_tokenExists_calldata,
			totalSupply: pack_token_totalSupply,
			buildTotalSupplyCalldata: build_pack_token_totalSupply_calldata,
			transferFrom: pack_token_transferFrom,
			buildTransferFromCalldata: build_pack_token_transferFrom_calldata,
			updateContractMetadata: pack_token_updateContractMetadata,
			buildUpdateContractMetadataCalldata: build_pack_token_updateContractMetadata_calldata,
			updateTokenMetadata: pack_token_updateTokenMetadata,
			buildUpdateTokenMetadataCalldata: build_pack_token_updateTokenMetadata_calldata,
			updateTokensMetadata: pack_token_updateTokensMetadata,
			buildUpdateTokensMetadataCalldata: build_pack_token_updateTokensMetadata_calldata,
		},
		// rng: {
		// 	isMocked: rng_isMocked,
		// 	buildIsMockedCalldata: build_rng_isMocked_calldata,
		// 	reseed: rng_reseed,
		// 	buildReseedCalldata: build_rng_reseed_calldata,
		// },
		// rng_mock: {
		// 	isMocked: rng_mock_isMocked,
		// 	buildIsMockedCalldata: build_rng_mock_isMocked_calldata,
		// 	mockValues: rng_mock_mockValues,
		// 	buildMockValuesCalldata: build_rng_mock_mockValues_calldata,
		// 	reseed: rng_mock_reseed,
		// 	buildReseedCalldata: build_rng_mock_reseed_calldata,
		// },
		tutorial: {
			calcDuelId: tutorial_calcDuelId,
			buildCalcDuelIdCalldata: build_tutorial_calcDuelId_calldata,
			commitMoves: tutorial_commitMoves,
			buildCommitMovesCalldata: build_tutorial_commitMoves_calldata,
			createTutorial: tutorial_createTutorial,
			buildCreateTutorialCalldata: build_tutorial_createTutorial_calldata,
			getDuelProgress: tutorial_getDuelProgress,
			buildGetDuelProgressCalldata: build_tutorial_getDuelProgress_calldata,
			revealMoves: tutorial_revealMoves,
			buildRevealMovesCalldata: build_tutorial_revealMoves_calldata,
		},
		vrf_mock: {
			consumeRandom: vrf_mock_consumeRandom,
			buildConsumeRandomCalldata: build_vrf_mock_consumeRandom_calldata,
			requestRandom: vrf_mock_requestRandom,
			buildRequestRandomCalldata: build_vrf_mock_requestRandom_calldata,
		},
	};
}