import { DojoCall, DojoProvider } from "@dojoengine/core";
import { Account, AccountInterface, BigNumberish, CairoOption, CairoCustomEnum, ByteArray } from "starknet";
import * as models from "./models.gen";

export function setupWorld(provider: DojoProvider) {

	const build_fame_coin_addressOfToken_calldata = (contractAddress: string, tokenId: BigNumberish) => {
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

	const build_lords_mock_allowance_calldata = (owner: string, spender: string) => {
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

	const build_fame_coin_allowance_calldata = (owner: string, spender: string) => {
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

	const build_admin_amIAdmin_calldata = (accountAddress: string) => {
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

	const build_lords_mock_approve_calldata = (spender: string, amount: BigNumberish) => {
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

	const build_fame_coin_approve_calldata = (spender: string, amount: BigNumberish) => {
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

	const build_duel_token_approve_calldata = (to: string, tokenId: BigNumberish) => {
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

	const build_duelist_token_approve_calldata = (to: string, tokenId: BigNumberish) => {
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

	const build_pack_token_approve_calldata = (to: string, tokenId: BigNumberish) => {
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

	const build_lords_mock_balanceOf_calldata = (account: string) => {
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

	const build_fame_coin_balanceOf_calldata = (account: string) => {
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

	const build_duel_token_balanceOf_calldata = (account: string) => {
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

	const build_duelist_token_balanceOf_calldata = (account: string) => {
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

	const build_pack_token_balanceOf_calldata = (account: string) => {
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

	const build_fame_coin_balanceOfToken_calldata = (contractAddress: string, tokenId: BigNumberish) => {
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

	const build_fame_coin_burnFromToken_calldata = (contractAddress: string, tokenId: BigNumberish, amount: BigNumberish) => {
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

	const build_duelist_token_calcFameReward_calldata = (duelistId: BigNumberish) => {
		return {
			contractName: "duelist_token",
			entrypoint: "calc_fame_reward",
			calldata: [duelistId],
		};
	};

	const duelist_token_calcFameReward = async (duelistId: BigNumberish) => {
		try {
			return await provider.call("pistols", build_duelist_token_calcFameReward_calldata(duelistId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duel_token_calcMintFee_calldata = (tableId: BigNumberish) => {
		return {
			contractName: "duel_token",
			entrypoint: "calc_mint_fee",
			calldata: [tableId],
		};
	};

	const duel_token_calcMintFee = async (tableId: BigNumberish) => {
		try {
			return await provider.call("pistols", build_duel_token_calcMintFee_calldata(tableId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_pack_token_calcMintFee_calldata = (recipient: string, packType: models.PackType) => {
		return {
			contractName: "pack_token",
			entrypoint: "calc_mint_fee",
			calldata: [recipient, packType],
		};
	};

	const pack_token_calcMintFee = async (recipient: string, packType: models.PackType) => {
		try {
			return await provider.call("pistols", build_pack_token_calcMintFee_calldata(recipient, packType));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_pack_token_canClaimWelcomePack_calldata = (recipient: string) => {
		return {
			contractName: "pack_token",
			entrypoint: "can_claim_welcome_pack",
			calldata: [recipient],
		};
	};

	const pack_token_canClaimWelcomePack = async (recipient: string) => {
		try {
			return await provider.call("pistols", build_pack_token_canClaimWelcomePack_calldata(recipient));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duel_token_canJoin_calldata = (tableId: BigNumberish, duelistId: BigNumberish) => {
		return {
			contractName: "duel_token",
			entrypoint: "can_join",
			calldata: [tableId, duelistId],
		};
	};

	const duel_token_canJoin = async (tableId: BigNumberish, duelistId: BigNumberish) => {
		try {
			return await provider.call("pistols", build_duel_token_canJoin_calldata(tableId, duelistId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duel_token_canMint_calldata = (recipient: string) => {
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

	const build_duelist_token_canMint_calldata = (recipient: string) => {
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

	const build_pack_token_canMint_calldata = (recipient: string) => {
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

	const build_pack_token_canPurchase_calldata = (recipient: string, packType: models.PackType) => {
		return {
			contractName: "pack_token",
			entrypoint: "can_purchase",
			calldata: [recipient, packType],
		};
	};

	const pack_token_canPurchase = async (recipient: string, packType: models.PackType) => {
		try {
			return await provider.call("pistols", build_pack_token_canPurchase_calldata(recipient, packType));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_bank_charge_calldata = (payer: string, payment: models.Payment) => {
		return {
			contractName: "bank",
			entrypoint: "charge",
			calldata: [payer, payment],
		};
	};

	const bank_charge = async (snAccount: Account | AccountInterface, payer: string, payment: models.Payment) => {
		try {
			return await provider.execute(
				snAccount,
				build_bank_charge_calldata(payer, payment),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_pack_token_claimWelcomePack_calldata = (): DojoCall => {
		return {
			contractName: "pack_token",
			entrypoint: "claim_welcome_pack",
			calldata: [],
		};
	};

	const pack_token_claimWelcomePack = async (snAccount: Account | AccountInterface) => {
		try {
			return await provider.execute(
				snAccount,
				build_pack_token_claimWelcomePack_calldata(),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_commitMoves_calldata = (duelistId: BigNumberish, duelId: BigNumberish, hashed: BigNumberish) => {
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

	// const build_vrf_mock_consumeRandom_calldata = (source: models.Source) => {
	// 	return {
	// 		contractName: "vrf_mock",
	// 		entrypoint: "consume_random",
	// 		calldata: [source],
	// 	};
	// };

	// const vrf_mock_consumeRandom = async (snAccount: Account | AccountInterface, source: models.Source) => {
	// 	try {
	// 		return await provider.execute(
	// 			snAccount,
	// 			build_vrf_mock_consumeRandom_calldata(source),
	// 			"pistols",
	// 		);
	// 	} catch (error) {
	// 		console.error(error);
	// 		throw error;
	// 	}
	// };

	const build_duel_token_createDuel_calldata = (duelistId: BigNumberish, challengedAddress: string, premise: models.Premise, quote: BigNumberish, tableId: BigNumberish, expireHours: BigNumberish) => {
		return {
			contractName: "duel_token",
			entrypoint: "create_duel",
			calldata: [duelistId, challengedAddress, premise, quote, tableId, expireHours],
		};
	};

	const duel_token_createDuel = async (snAccount: Account | AccountInterface, duelistId: BigNumberish, challengedAddress: string, premise: models.Premise, quote: BigNumberish, tableId: BigNumberish, expireHours: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_duel_token_createDuel_calldata(duelistId, challengedAddress, premise, quote, tableId, expireHours),
				"pistols",
			);
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

	const build_duel_token_exists_calldata = (tokenId: BigNumberish) => {
		return {
			contractName: "duel_token",
			entrypoint: "exists",
			calldata: [tokenId],
		};
	};

	const duel_token_exists = async (tokenId: BigNumberish) => {
		try {
			return await provider.call("pistols", build_duel_token_exists_calldata(tokenId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duelist_token_exists_calldata = (tokenId: BigNumberish) => {
		return {
			contractName: "duelist_token",
			entrypoint: "exists",
			calldata: [tokenId],
		};
	};

	const duelist_token_exists = async (tokenId: BigNumberish) => {
		try {
			return await provider.call("pistols", build_duelist_token_exists_calldata(tokenId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_pack_token_exists_calldata = (tokenId: BigNumberish) => {
		return {
			contractName: "pack_token",
			entrypoint: "exists",
			calldata: [tokenId],
		};
	};

	const pack_token_exists = async (tokenId: BigNumberish) => {
		try {
			return await provider.call("pistols", build_pack_token_exists_calldata(tokenId));
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

	const build_duel_token_getApproved_calldata = (tokenId: BigNumberish) => {
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

	const build_duelist_token_getApproved_calldata = (tokenId: BigNumberish) => {
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

	const build_pack_token_getApproved_calldata = (tokenId: BigNumberish) => {
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

	const build_duel_token_getAttributePairs_calldata = (tokenId: BigNumberish) => {
		return {
			contractName: "duel_token",
			entrypoint: "get_attribute_pairs",
			calldata: [tokenId],
		};
	};

	const duel_token_getAttributePairs = async (tokenId: BigNumberish) => {
		try {
			return await provider.call("pistols", build_duel_token_getAttributePairs_calldata(tokenId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duelist_token_getAttributePairs_calldata = (tokenId: BigNumberish) => {
		return {
			contractName: "duelist_token",
			entrypoint: "get_attribute_pairs",
			calldata: [tokenId],
		};
	};

	const duelist_token_getAttributePairs = async (tokenId: BigNumberish) => {
		try {
			return await provider.call("pistols", build_duelist_token_getAttributePairs_calldata(tokenId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_pack_token_getAttributePairs_calldata = (tokenId: BigNumberish) => {
		return {
			contractName: "pack_token",
			entrypoint: "get_attribute_pairs",
			calldata: [tokenId],
		};
	};

	const pack_token_getAttributePairs = async (tokenId: BigNumberish) => {
		try {
			return await provider.call("pistols", build_pack_token_getAttributePairs_calldata(tokenId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_getDuelProgress_calldata = (duelId: BigNumberish) => {
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

	const build_duel_token_getMetadataPairs_calldata = (tokenId: BigNumberish) => {
		return {
			contractName: "duel_token",
			entrypoint: "get_metadata_pairs",
			calldata: [tokenId],
		};
	};

	const duel_token_getMetadataPairs = async (tokenId: BigNumberish) => {
		try {
			return await provider.call("pistols", build_duel_token_getMetadataPairs_calldata(tokenId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duelist_token_getMetadataPairs_calldata = (tokenId: BigNumberish) => {
		return {
			contractName: "duelist_token",
			entrypoint: "get_metadata_pairs",
			calldata: [tokenId],
		};
	};

	const duelist_token_getMetadataPairs = async (tokenId: BigNumberish) => {
		try {
			return await provider.call("pistols", build_duelist_token_getMetadataPairs_calldata(tokenId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_pack_token_getMetadataPairs_calldata = (tokenId: BigNumberish) => {
		return {
			contractName: "pack_token",
			entrypoint: "get_metadata_pairs",
			calldata: [tokenId],
		};
	};

	const pack_token_getMetadataPairs = async (tokenId: BigNumberish) => {
		try {
			return await provider.call("pistols", build_pack_token_getMetadataPairs_calldata(tokenId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duel_token_getPact_calldata = (tableId: BigNumberish, addressA: string, addressB: string) => {
		return {
			contractName: "duel_token",
			entrypoint: "get_pact",
			calldata: [tableId, addressA, addressB],
		};
	};

	const duel_token_getPact = async (tableId: BigNumberish, addressA: string, addressB: string) => {
		try {
			return await provider.call("pistols", build_duel_token_getPact_calldata(tableId, addressA, addressB));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_getPlayerCardDecks_calldata = (tableId: BigNumberish) => {
		return {
			contractName: "game",
			entrypoint: "get_player_card_decks",
			calldata: [tableId],
		};
	};

	const game_getPlayerCardDecks = async (tableId: BigNumberish) => {
		try {
			return await provider.call("pistols", build_game_getPlayerCardDecks_calldata(tableId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duel_token_getTokenDescription_calldata = (tokenId: BigNumberish) => {
		return {
			contractName: "duel_token",
			entrypoint: "get_token_description",
			calldata: [tokenId],
		};
	};

	const duel_token_getTokenDescription = async (tokenId: BigNumberish) => {
		try {
			return await provider.call("pistols", build_duel_token_getTokenDescription_calldata(tokenId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duelist_token_getTokenDescription_calldata = (tokenId: BigNumberish) => {
		return {
			contractName: "duelist_token",
			entrypoint: "get_token_description",
			calldata: [tokenId],
		};
	};

	const duelist_token_getTokenDescription = async (tokenId: BigNumberish) => {
		try {
			return await provider.call("pistols", build_duelist_token_getTokenDescription_calldata(tokenId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_pack_token_getTokenDescription_calldata = (tokenId: BigNumberish) => {
		return {
			contractName: "pack_token",
			entrypoint: "get_token_description",
			calldata: [tokenId],
		};
	};

	const pack_token_getTokenDescription = async (tokenId: BigNumberish) => {
		try {
			return await provider.call("pistols", build_pack_token_getTokenDescription_calldata(tokenId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duel_token_getTokenImage_calldata = (tokenId: BigNumberish) => {
		return {
			contractName: "duel_token",
			entrypoint: "get_token_image",
			calldata: [tokenId],
		};
	};

	const duel_token_getTokenImage = async (tokenId: BigNumberish) => {
		try {
			return await provider.call("pistols", build_duel_token_getTokenImage_calldata(tokenId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duelist_token_getTokenImage_calldata = (tokenId: BigNumberish) => {
		return {
			contractName: "duelist_token",
			entrypoint: "get_token_image",
			calldata: [tokenId],
		};
	};

	const duelist_token_getTokenImage = async (tokenId: BigNumberish) => {
		try {
			return await provider.call("pistols", build_duelist_token_getTokenImage_calldata(tokenId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_pack_token_getTokenImage_calldata = (tokenId: BigNumberish) => {
		return {
			contractName: "pack_token",
			entrypoint: "get_token_image",
			calldata: [tokenId],
		};
	};

	const pack_token_getTokenImage = async (tokenId: BigNumberish) => {
		try {
			return await provider.call("pistols", build_pack_token_getTokenImage_calldata(tokenId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duel_token_getTokenName_calldata = (tokenId: BigNumberish) => {
		return {
			contractName: "duel_token",
			entrypoint: "get_token_name",
			calldata: [tokenId],
		};
	};

	const duel_token_getTokenName = async (tokenId: BigNumberish) => {
		try {
			return await provider.call("pistols", build_duel_token_getTokenName_calldata(tokenId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duelist_token_getTokenName_calldata = (tokenId: BigNumberish) => {
		return {
			contractName: "duelist_token",
			entrypoint: "get_token_name",
			calldata: [tokenId],
		};
	};

	const duelist_token_getTokenName = async (tokenId: BigNumberish) => {
		try {
			return await provider.call("pistols", build_duelist_token_getTokenName_calldata(tokenId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_pack_token_getTokenName_calldata = (tokenId: BigNumberish) => {
		return {
			contractName: "pack_token",
			entrypoint: "get_token_name",
			calldata: [tokenId],
		};
	};

	const pack_token_getTokenName = async (tokenId: BigNumberish) => {
		try {
			return await provider.call("pistols", build_pack_token_getTokenName_calldata(tokenId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_admin_grantAdmin_calldata = (accountAddress: string, granted: boolean) => {
		return {
			contractName: "admin",
			entrypoint: "grant_admin",
			calldata: [accountAddress, granted],
		};
	};

	const admin_grantAdmin = async (snAccount: Account | AccountInterface, accountAddress: string, granted: boolean) => {
		try {
			return await provider.execute(
				snAccount,
				build_admin_grantAdmin_calldata(accountAddress, granted),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duel_token_hasPact_calldata = (tableId: BigNumberish, addressA: string, addressB: string) => {
		return {
			contractName: "duel_token",
			entrypoint: "has_pact",
			calldata: [tableId, addressA, addressB],
		};
	};

	const duel_token_hasPact = async (tableId: BigNumberish, addressA: string, addressB: string) => {
		try {
			return await provider.call("pistols", build_duel_token_hasPact_calldata(tableId, addressA, addressB));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duel_token_isApprovedForAll_calldata = (owner: string, operator: string) => {
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

	const build_duelist_token_isApprovedForAll_calldata = (owner: string, operator: string) => {
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

	const build_pack_token_isApprovedForAll_calldata = (owner: string, operator: string) => {
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

	const build_duelist_token_isAlive_calldata = (duelistId: BigNumberish) => {
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

	const build_duel_token_isOwnerOf_calldata = (address: string, tokenId: BigNumberish) => {
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

	const build_duelist_token_isOwnerOf_calldata = (address: string, tokenId: BigNumberish) => {
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

	const build_pack_token_isOwnerOf_calldata = (address: string, tokenId: BigNumberish) => {
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

	const build_lords_mock_mint_calldata = (recipient: string, amount: BigNumberish) => {
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

	const build_duelist_token_mintDuelists_calldata = (recipient: string, amount: BigNumberish, seed: BigNumberish) => {
		return {
			contractName: "duelist_token",
			entrypoint: "mint_duelists",
			calldata: [recipient, amount, seed],
		};
	};

	const duelist_token_mintDuelists = async (snAccount: Account | AccountInterface, recipient: string, amount: BigNumberish, seed: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_duelist_token_mintDuelists_calldata(recipient, amount, seed),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_fame_coin_mintedDuelist_calldata = (duelistId: BigNumberish, amountPaid: BigNumberish) => {
		return {
			contractName: "fame_coin",
			entrypoint: "minted_duelist",
			calldata: [duelistId, amountPaid],
		};
	};

	const fame_coin_mintedDuelist = async (snAccount: Account | AccountInterface, duelistId: BigNumberish, amountPaid: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_fame_coin_mintedDuelist_calldata(duelistId, amountPaid),
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

	const build_rng_newShuffler_calldata = (shuffleSize: BigNumberish) => {
		return {
			contractName: "rng",
			entrypoint: "new_shuffler",
			calldata: [shuffleSize],
		};
	};

	const rng_newShuffler = async (shuffleSize: BigNumberish) => {
		try {
			return await provider.call("pistols", build_rng_newShuffler_calldata(shuffleSize));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_pack_token_open_calldata = (packId: BigNumberish) => {
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

	const build_admin_openTable_calldata = (tableId: BigNumberish, isOpen: boolean) => {
		return {
			contractName: "admin",
			entrypoint: "open_table",
			calldata: [tableId, isOpen],
		};
	};

	const admin_openTable = async (snAccount: Account | AccountInterface, tableId: BigNumberish, isOpen: boolean) => {
		try {
			return await provider.execute(
				snAccount,
				build_admin_openTable_calldata(tableId, isOpen),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duel_token_ownerOf_calldata = (tokenId: BigNumberish) => {
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

	const build_duelist_token_ownerOf_calldata = (tokenId: BigNumberish) => {
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

	const build_pack_token_ownerOf_calldata = (tokenId: BigNumberish) => {
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

	const build_pack_token_purchase_calldata = (packType: models.PackType) => {
		return {
			contractName: "pack_token",
			entrypoint: "purchase",
			calldata: [packType],
		};
	};

	const pack_token_purchase = async (snAccount: Account | AccountInterface, packType: models.PackType) => {
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

	const build_duel_token_replyDuel_calldata = (duelistId: BigNumberish, duelId: BigNumberish, accepted: boolean) => {
		return {
			contractName: "duel_token",
			entrypoint: "reply_duel",
			calldata: [duelistId, duelId, accepted],
		};
	};

	const duel_token_replyDuel = async (snAccount: Account | AccountInterface, duelistId: BigNumberish, duelId: BigNumberish, accepted: boolean) => {
		try {
			return await provider.execute(
				snAccount,
				build_duel_token_replyDuel_calldata(duelistId, duelId, accepted),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	// const build_vrf_mock_requestRandom_calldata = (caller: string, source: models.Source) => {
	// 	return {
	// 		contractName: "vrf_mock",
	// 		entrypoint: "request_random",
	// 		calldata: [caller, source],
	// 	};
	// };

	// const vrf_mock_requestRandom = async (caller: string, source: models.Source) => {
	// 	try {
	// 		return await provider.call("pistols", build_vrf_mock_requestRandom_calldata(caller, source));
	// 	} catch (error) {
	// 		console.error(error);
	// 		throw error;
	// 	}
	// };

	const build_rng_reseed_calldata = (seed: BigNumberish, salt: BigNumberish) => {
		return {
			contractName: "rng",
			entrypoint: "reseed",
			calldata: [seed, salt],
		};
	};

	const rng_reseed = async (seed: BigNumberish, salt: BigNumberish) => {
		try {
			return await provider.call("pistols", build_rng_reseed_calldata(seed, salt));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_revealMoves_calldata = (duelistId: BigNumberish, duelId: BigNumberish, salt: BigNumberish, moves: Array<BigNumberish>) => {
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

	const build_duel_token_safeTransferFrom_calldata = (from: string, to: string, tokenId: BigNumberish, data: Array<BigNumberish>) => {
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

	const build_duelist_token_safeTransferFrom_calldata = (from: string, to: string, tokenId: BigNumberish, data: Array<BigNumberish>) => {
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

	const build_pack_token_safeTransferFrom_calldata = (from: string, to: string, tokenId: BigNumberish, data: Array<BigNumberish>) => {
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

	const build_duel_token_setApprovalForAll_calldata = (operator: string, approved: boolean) => {
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

	const build_duelist_token_setApprovalForAll_calldata = (operator: string, approved: boolean) => {
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

	const build_pack_token_setApprovalForAll_calldata = (operator: string, approved: boolean) => {
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

	const build_admin_setPaused_calldata = (paused: boolean) => {
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

	const build_admin_setTable_calldata = (table: models.TableConfig) => {
		return {
			contractName: "admin",
			entrypoint: "set_table",
			calldata: [table],
		};
	};

	const admin_setTable = async (snAccount: Account | AccountInterface, table: models.TableConfig) => {
		try {
			return await provider.execute(
				snAccount,
				build_admin_setTable_calldata(table),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_admin_setTreasury_calldata = (treasuryAddress: string) => {
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

	const build_duel_token_supportsInterface_calldata = (interfaceId: BigNumberish) => {
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

	const build_duelist_token_supportsInterface_calldata = (interfaceId: BigNumberish) => {
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

	const build_pack_token_supportsInterface_calldata = (interfaceId: BigNumberish) => {
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

	const build_game_testValidateCommitMessage_calldata = (account: string, signature: Array<BigNumberish>, duelId: BigNumberish, duelistId: BigNumberish) => {
		return {
			contractName: "game",
			entrypoint: "test_validate_commit_message",
			calldata: [account, signature, duelId, duelistId],
		};
	};

	const game_testValidateCommitMessage = async (account: string, signature: Array<BigNumberish>, duelId: BigNumberish, duelistId: BigNumberish) => {
		try {
			return await provider.call("pistols", build_game_testValidateCommitMessage_calldata(account, signature, duelId, duelistId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duel_token_tokenUri_calldata = (tokenId: BigNumberish) => {
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

	const build_duelist_token_tokenUri_calldata = (tokenId: BigNumberish) => {
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

	const build_pack_token_tokenUri_calldata = (tokenId: BigNumberish) => {
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

	const build_fame_coin_tokenOfAddress_calldata = (address: string) => {
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

	const build_lords_mock_transfer_calldata = (recipient: string, amount: BigNumberish) => {
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

	const build_fame_coin_transfer_calldata = (recipient: string, amount: BigNumberish) => {
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

	const build_lords_mock_transferFrom_calldata = (sender: string, recipient: string, amount: BigNumberish) => {
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

	const build_fame_coin_transferFrom_calldata = (sender: string, recipient: string, amount: BigNumberish) => {
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

	const build_duel_token_transferFrom_calldata = (from: string, to: string, tokenId: BigNumberish) => {
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

	const build_duelist_token_transferFrom_calldata = (from: string, to: string, tokenId: BigNumberish) => {
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

	const build_pack_token_transferFrom_calldata = (from: string, to: string, tokenId: BigNumberish) => {
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

	const build_duelist_token_transferFameReward_calldata = (duelId: BigNumberish) => {
		return {
			contractName: "duelist_token",
			entrypoint: "transfer_fame_reward",
			calldata: [duelId],
		};
	};

	const duelist_token_transferFameReward = async (snAccount: Account | AccountInterface, duelId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_duelist_token_transferFameReward_calldata(duelId),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_fame_coin_transferFromToken_calldata = (contractAddress: string, senderTokenId: BigNumberish, recipientTokenId: BigNumberish, amount: BigNumberish) => {
		return {
			contractName: "fame_coin",
			entrypoint: "transfer_from_token",
			calldata: [contractAddress, senderTokenId, recipientTokenId, amount],
		};
	};

	const fame_coin_transferFromToken = async (snAccount: Account | AccountInterface, contractAddress: string, senderTokenId: BigNumberish, recipientTokenId: BigNumberish, amount: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_fame_coin_transferFromToken_calldata(contractAddress, senderTokenId, recipientTokenId, amount),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_duel_token_transferToWinner_calldata = (duelId: BigNumberish) => {
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

	const build_fame_coin_updatedDuelist_calldata = (from: string, to: string, duelistId: BigNumberish) => {
		return {
			contractName: "fame_coin",
			entrypoint: "updated_duelist",
			calldata: [from, to, duelistId],
		};
	};

	const fame_coin_updatedDuelist = async (snAccount: Account | AccountInterface, from: string, to: string, duelistId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_fame_coin_updatedDuelist_calldata(from, to, duelistId),
				"pistols",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};



	return {
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
			burnFromToken: fame_coin_burnFromToken,
			buildBurnFromTokenCalldata: build_fame_coin_burnFromToken_calldata,
			decimals: fame_coin_decimals,
			buildDecimalsCalldata: build_fame_coin_decimals_calldata,
			mintedDuelist: fame_coin_mintedDuelist,
			buildMintedDuelistCalldata: build_fame_coin_mintedDuelist_calldata,
			name: fame_coin_name,
			buildNameCalldata: build_fame_coin_name_calldata,
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
			updatedDuelist: fame_coin_updatedDuelist,
			buildUpdatedDuelistCalldata: build_fame_coin_updatedDuelist_calldata,
		},
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
		admin: {
			amIAdmin: admin_amIAdmin,
			buildAmIAdminCalldata: build_admin_amIAdmin_calldata,
			grantAdmin: admin_grantAdmin,
			buildGrantAdminCalldata: build_admin_grantAdmin_calldata,
			openTable: admin_openTable,
			buildOpenTableCalldata: build_admin_openTable_calldata,
			setPaused: admin_setPaused,
			buildSetPausedCalldata: build_admin_setPaused_calldata,
			setTable: admin_setTable,
			buildSetTableCalldata: build_admin_setTable_calldata,
			setTreasury: admin_setTreasury,
			buildSetTreasuryCalldata: build_admin_setTreasury_calldata,
		},
		duel_token: {
			approve: duel_token_approve,
			buildApproveCalldata: build_duel_token_approve_calldata,
			balanceOf: duel_token_balanceOf,
			buildBalanceOfCalldata: build_duel_token_balanceOf_calldata,
			calcMintFee: duel_token_calcMintFee,
			buildCalcMintFeeCalldata: build_duel_token_calcMintFee_calldata,
			canJoin: duel_token_canJoin,
			buildCanJoinCalldata: build_duel_token_canJoin_calldata,
			canMint: duel_token_canMint,
			buildCanMintCalldata: build_duel_token_canMint_calldata,
			createDuel: duel_token_createDuel,
			buildCreateDuelCalldata: build_duel_token_createDuel_calldata,
			exists: duel_token_exists,
			buildExistsCalldata: build_duel_token_exists_calldata,
			getApproved: duel_token_getApproved,
			buildGetApprovedCalldata: build_duel_token_getApproved_calldata,
			getAttributePairs: duel_token_getAttributePairs,
			buildGetAttributePairsCalldata: build_duel_token_getAttributePairs_calldata,
			getMetadataPairs: duel_token_getMetadataPairs,
			buildGetMetadataPairsCalldata: build_duel_token_getMetadataPairs_calldata,
			getPact: duel_token_getPact,
			buildGetPactCalldata: build_duel_token_getPact_calldata,
			getTokenDescription: duel_token_getTokenDescription,
			buildGetTokenDescriptionCalldata: build_duel_token_getTokenDescription_calldata,
			getTokenImage: duel_token_getTokenImage,
			buildGetTokenImageCalldata: build_duel_token_getTokenImage_calldata,
			getTokenName: duel_token_getTokenName,
			buildGetTokenNameCalldata: build_duel_token_getTokenName_calldata,
			hasPact: duel_token_hasPact,
			buildHasPactCalldata: build_duel_token_hasPact_calldata,
			isApprovedForAll: duel_token_isApprovedForAll,
			buildIsApprovedForAllCalldata: build_duel_token_isApprovedForAll_calldata,
			isOwnerOf: duel_token_isOwnerOf,
			buildIsOwnerOfCalldata: build_duel_token_isOwnerOf_calldata,
			name: duel_token_name,
			buildNameCalldata: build_duel_token_name_calldata,
			ownerOf: duel_token_ownerOf,
			buildOwnerOfCalldata: build_duel_token_ownerOf_calldata,
			replyDuel: duel_token_replyDuel,
			buildReplyDuelCalldata: build_duel_token_replyDuel_calldata,
			safeTransferFrom: duel_token_safeTransferFrom,
			buildSafeTransferFromCalldata: build_duel_token_safeTransferFrom_calldata,
			setApprovalForAll: duel_token_setApprovalForAll,
			buildSetApprovalForAllCalldata: build_duel_token_setApprovalForAll_calldata,
			supportsInterface: duel_token_supportsInterface,
			buildSupportsInterfaceCalldata: build_duel_token_supportsInterface_calldata,
			symbol: duel_token_symbol,
			buildSymbolCalldata: build_duel_token_symbol_calldata,
			tokenUri: duel_token_tokenUri,
			buildTokenUriCalldata: build_duel_token_tokenUri_calldata,
			transferFrom: duel_token_transferFrom,
			buildTransferFromCalldata: build_duel_token_transferFrom_calldata,
			transferToWinner: duel_token_transferToWinner,
			buildTransferToWinnerCalldata: build_duel_token_transferToWinner_calldata,
		},
		duelist_token: {
			approve: duelist_token_approve,
			buildApproveCalldata: build_duelist_token_approve_calldata,
			balanceOf: duelist_token_balanceOf,
			buildBalanceOfCalldata: build_duelist_token_balanceOf_calldata,
			calcFameReward: duelist_token_calcFameReward,
			buildCalcFameRewardCalldata: build_duelist_token_calcFameReward_calldata,
			canMint: duelist_token_canMint,
			buildCanMintCalldata: build_duelist_token_canMint_calldata,
			exists: duelist_token_exists,
			buildExistsCalldata: build_duelist_token_exists_calldata,
			getApproved: duelist_token_getApproved,
			buildGetApprovedCalldata: build_duelist_token_getApproved_calldata,
			getAttributePairs: duelist_token_getAttributePairs,
			buildGetAttributePairsCalldata: build_duelist_token_getAttributePairs_calldata,
			getMetadataPairs: duelist_token_getMetadataPairs,
			buildGetMetadataPairsCalldata: build_duelist_token_getMetadataPairs_calldata,
			getTokenDescription: duelist_token_getTokenDescription,
			buildGetTokenDescriptionCalldata: build_duelist_token_getTokenDescription_calldata,
			getTokenImage: duelist_token_getTokenImage,
			buildGetTokenImageCalldata: build_duelist_token_getTokenImage_calldata,
			getTokenName: duelist_token_getTokenName,
			buildGetTokenNameCalldata: build_duelist_token_getTokenName_calldata,
			isApprovedForAll: duelist_token_isApprovedForAll,
			buildIsApprovedForAllCalldata: build_duelist_token_isApprovedForAll_calldata,
			isAlive: duelist_token_isAlive,
			buildIsAliveCalldata: build_duelist_token_isAlive_calldata,
			isOwnerOf: duelist_token_isOwnerOf,
			buildIsOwnerOfCalldata: build_duelist_token_isOwnerOf_calldata,
			mintDuelists: duelist_token_mintDuelists,
			buildMintDuelistsCalldata: build_duelist_token_mintDuelists_calldata,
			name: duelist_token_name,
			buildNameCalldata: build_duelist_token_name_calldata,
			ownerOf: duelist_token_ownerOf,
			buildOwnerOfCalldata: build_duelist_token_ownerOf_calldata,
			safeTransferFrom: duelist_token_safeTransferFrom,
			buildSafeTransferFromCalldata: build_duelist_token_safeTransferFrom_calldata,
			setApprovalForAll: duelist_token_setApprovalForAll,
			buildSetApprovalForAllCalldata: build_duelist_token_setApprovalForAll_calldata,
			supportsInterface: duelist_token_supportsInterface,
			buildSupportsInterfaceCalldata: build_duelist_token_supportsInterface_calldata,
			symbol: duelist_token_symbol,
			buildSymbolCalldata: build_duelist_token_symbol_calldata,
			tokenUri: duelist_token_tokenUri,
			buildTokenUriCalldata: build_duelist_token_tokenUri_calldata,
			transferFrom: duelist_token_transferFrom,
			buildTransferFromCalldata: build_duelist_token_transferFrom_calldata,
			transferFameReward: duelist_token_transferFameReward,
			buildTransferFameRewardCalldata: build_duelist_token_transferFameReward_calldata,
		},
		pack_token: {
			approve: pack_token_approve,
			buildApproveCalldata: build_pack_token_approve_calldata,
			balanceOf: pack_token_balanceOf,
			buildBalanceOfCalldata: build_pack_token_balanceOf_calldata,
			calcMintFee: pack_token_calcMintFee,
			buildCalcMintFeeCalldata: build_pack_token_calcMintFee_calldata,
			canClaimWelcomePack: pack_token_canClaimWelcomePack,
			buildCanClaimWelcomePackCalldata: build_pack_token_canClaimWelcomePack_calldata,
			canMint: pack_token_canMint,
			buildCanMintCalldata: build_pack_token_canMint_calldata,
			canPurchase: pack_token_canPurchase,
			buildCanPurchaseCalldata: build_pack_token_canPurchase_calldata,
			claimWelcomePack: pack_token_claimWelcomePack,
			buildClaimWelcomePackCalldata: build_pack_token_claimWelcomePack_calldata,
			exists: pack_token_exists,
			buildExistsCalldata: build_pack_token_exists_calldata,
			getApproved: pack_token_getApproved,
			buildGetApprovedCalldata: build_pack_token_getApproved_calldata,
			getAttributePairs: pack_token_getAttributePairs,
			buildGetAttributePairsCalldata: build_pack_token_getAttributePairs_calldata,
			getMetadataPairs: pack_token_getMetadataPairs,
			buildGetMetadataPairsCalldata: build_pack_token_getMetadataPairs_calldata,
			getTokenDescription: pack_token_getTokenDescription,
			buildGetTokenDescriptionCalldata: build_pack_token_getTokenDescription_calldata,
			getTokenImage: pack_token_getTokenImage,
			buildGetTokenImageCalldata: build_pack_token_getTokenImage_calldata,
			getTokenName: pack_token_getTokenName,
			buildGetTokenNameCalldata: build_pack_token_getTokenName_calldata,
			isApprovedForAll: pack_token_isApprovedForAll,
			buildIsApprovedForAllCalldata: build_pack_token_isApprovedForAll_calldata,
			isOwnerOf: pack_token_isOwnerOf,
			buildIsOwnerOfCalldata: build_pack_token_isOwnerOf_calldata,
			name: pack_token_name,
			buildNameCalldata: build_pack_token_name_calldata,
			open: pack_token_open,
			buildOpenCalldata: build_pack_token_open_calldata,
			ownerOf: pack_token_ownerOf,
			buildOwnerOfCalldata: build_pack_token_ownerOf_calldata,
			purchase: pack_token_purchase,
			buildPurchaseCalldata: build_pack_token_purchase_calldata,
			safeTransferFrom: pack_token_safeTransferFrom,
			buildSafeTransferFromCalldata: build_pack_token_safeTransferFrom_calldata,
			setApprovalForAll: pack_token_setApprovalForAll,
			buildSetApprovalForAllCalldata: build_pack_token_setApprovalForAll_calldata,
			supportsInterface: pack_token_supportsInterface,
			buildSupportsInterfaceCalldata: build_pack_token_supportsInterface_calldata,
			symbol: pack_token_symbol,
			buildSymbolCalldata: build_pack_token_symbol_calldata,
			tokenUri: pack_token_tokenUri,
			buildTokenUriCalldata: build_pack_token_tokenUri_calldata,
			transferFrom: pack_token_transferFrom,
			buildTransferFromCalldata: build_pack_token_transferFrom_calldata,
		},
		bank: {
			charge: bank_charge,
			buildChargeCalldata: build_bank_charge_calldata,
		},
		game: {
			commitMoves: game_commitMoves,
			buildCommitMovesCalldata: build_game_commitMoves_calldata,
			getDuelProgress: game_getDuelProgress,
			buildGetDuelProgressCalldata: build_game_getDuelProgress_calldata,
			getPlayerCardDecks: game_getPlayerCardDecks,
			buildGetPlayerCardDecksCalldata: build_game_getPlayerCardDecks_calldata,
			revealMoves: game_revealMoves,
			buildRevealMovesCalldata: build_game_revealMoves_calldata,
			testValidateCommitMessage: game_testValidateCommitMessage,
			buildTestValidateCommitMessageCalldata: build_game_testValidateCommitMessage_calldata,
		},
		// vrf_mock: {
		// 	consumeRandom: vrf_mock_consumeRandom,
		// 	buildConsumeRandomCalldata: build_vrf_mock_consumeRandom_calldata,
		// 	requestRandom: vrf_mock_requestRandom,
		// 	buildRequestRandomCalldata: build_vrf_mock_requestRandom_calldata,
		// },
		rng: {
			newShuffler: rng_newShuffler,
			buildNewShufflerCalldata: build_rng_newShuffler_calldata,
			reseed: rng_reseed,
			buildReseedCalldata: build_rng_reseed_calldata,
		},
	};
}