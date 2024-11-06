//@ts-nocheck
import { DojoProvider } from "@dojoengine/core";
import { Account } from "starknet";
import * as models from "./models.gen";

export async function setupWorld(provider: DojoProvider) {

	const bank_charge = async (snAccount: Account, payer: string, payment: models.Payment) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "bank",
					entryPoint: "charge",
					calldata: [payer, payment],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const rng_reseed = async (snAccount: Account, seed: number, salt: number) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "rng",
					entryPoint: "reseed",
					calldata: [seed, salt],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const rng_newShuffler = async (snAccount: Account, shuffleSize: number) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "rng",
					entryPoint: "new_shuffler",
					calldata: [shuffleSize],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const lords_mock_totalSupply = async (snAccount: Account) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "lords_mock",
					entryPoint: "total_supply",
					calldata: [],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const lords_mock_balanceOf = async (snAccount: Account, account: string) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "lords_mock",
					entryPoint: "balance_of",
					calldata: [account],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const lords_mock_allowance = async (snAccount: Account, owner: string, spender: string) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "lords_mock",
					entryPoint: "allowance",
					calldata: [owner, spender],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const lords_mock_transfer = async (snAccount: Account, recipient: string, amount: number) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "lords_mock",
					entryPoint: "transfer",
					calldata: [recipient, amount],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const lords_mock_transferFrom = async (snAccount: Account, sender: string, recipient: string, amount: number) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "lords_mock",
					entryPoint: "transfer_from",
					calldata: [sender, recipient, amount],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const lords_mock_approve = async (snAccount: Account, spender: string, amount: number) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "lords_mock",
					entryPoint: "approve",
					calldata: [spender, amount],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const lords_mock_name = async (snAccount: Account) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "lords_mock",
					entryPoint: "_name",
					calldata: [],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const lords_mock_symbol = async (snAccount: Account) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "lords_mock",
					entryPoint: "symbol",
					calldata: [],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const lords_mock_decimals = async (snAccount: Account) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "lords_mock",
					entryPoint: "decimals",
					calldata: [],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const lords_mock_faucet = async (snAccount: Account) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "lords_mock",
					entryPoint: "faucet",
					calldata: [],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const lords_mock_mint = async (snAccount: Account, recipient: string, amount: number) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "lords_mock",
					entryPoint: "mint",
					calldata: [recipient, amount],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const admin_amIAdmin = async (snAccount: Account, accountAddress: string) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "admin",
					entryPoint: "am_i_admin",
					calldata: [accountAddress],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const admin_grantAdmin = async (snAccount: Account, accountAddress: string, granted: boolean) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "admin",
					entryPoint: "grant_admin",
					calldata: [accountAddress, granted],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const admin_setConfig = async (snAccount: Account, config: models.Config) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "admin",
					entryPoint: "set_config",
					calldata: [config],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const admin_setPaused = async (snAccount: Account, paused: boolean) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "admin",
					entryPoint: "set_paused",
					calldata: [paused],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const admin_openTable = async (snAccount: Account, tableId: number, isOpen: boolean) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "admin",
					entryPoint: "open_table",
					calldata: [tableId, isOpen],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const admin_setTable = async (snAccount: Account, table: models.TableConfig) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "admin",
					entryPoint: "set_table",
					calldata: [table],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const admin_setTableAdmittance = async (snAccount: Account, tableAdmittance: models.TableAdmittance) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "admin",
					entryPoint: "set_table_admittance",
					calldata: [tableAdmittance],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const game_commitMoves = async (snAccount: Account, duelistId: number, duelId: number, hashed: number) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "game",
					entryPoint: "commit_moves",
					calldata: [duelistId, duelId, hashed],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const game_revealMoves = async (snAccount: Account, duelistId: number, duelId: number, salt: number, moves: Array<number>) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "game",
					entryPoint: "reveal_moves",
					calldata: [duelistId, duelId, salt, moves],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const game_getPlayerCardDecks = async (snAccount: Account, tableId: number) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "game",
					entryPoint: "get_player_card_decks",
					calldata: [tableId],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const game_getDuelProgress = async (snAccount: Account, duelId: number) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "game",
					entryPoint: "get_duel_progress",
					calldata: [duelId],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const game_testValidateCommitMessage = async (snAccount: Account, account: string, signature: Array<number>, duelId: number, duelistId: number) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "game",
					entryPoint: "test_validate_commit_message",
					calldata: [account, signature, duelId, duelistId],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_canMint = async (snAccount: Account, callerAddress: string) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duel_token",
					entryPoint: "can_mint",
					calldata: [callerAddress],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_exists = async (snAccount: Account, tokenId: number) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duel_token",
					entryPoint: "exists",
					calldata: [tokenId],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_isOwnerOf = async (snAccount: Account, address: string, tokenId: number) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duel_token",
					entryPoint: "is_owner_of",
					calldata: [address, tokenId],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_createDuel = async (snAccount: Account, duelistId: number, challengedIdOrAddress: string, premise: models.Premise, quote: number, tableId: number, expireHours: number) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duel_token",
					entryPoint: "create_duel",
					calldata: [duelistId, challengedIdOrAddress, premise, quote, tableId, expireHours],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_replyDuel = async (snAccount: Account, duelistId: number, duelId: number, accepted: boolean) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duel_token",
					entryPoint: "reply_duel",
					calldata: [duelistId, duelId, accepted],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_deleteDuel = async (snAccount: Account, duelId: number) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duel_token",
					entryPoint: "delete_duel",
					calldata: [duelId],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_calcFee = async (snAccount: Account, tableId: number) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duel_token",
					entryPoint: "calc_fee",
					calldata: [tableId],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_getPact = async (snAccount: Account, tableId: number, duelistIdA: number, duelistIdB: number) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duel_token",
					entryPoint: "get_pact",
					calldata: [tableId, duelistIdA, duelistIdB],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_hasPact = async (snAccount: Account, tableId: number, duelistIdA: number, duelistIdB: number) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duel_token",
					entryPoint: "has_pact",
					calldata: [tableId, duelistIdA, duelistIdB],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_canJoin = async (snAccount: Account, tableId: number, duelistId: number) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duel_token",
					entryPoint: "can_join",
					calldata: [tableId, duelistId],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_getTokenName = async (snAccount: Account, tokenId: number) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duel_token",
					entryPoint: "get_token_name",
					calldata: [tokenId],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_getTokenDescription = async (snAccount: Account, tokenId: number) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duel_token",
					entryPoint: "get_token_description",
					calldata: [tokenId],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_getTokenImage = async (snAccount: Account, tokenId: number) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duel_token",
					entryPoint: "get_token_image",
					calldata: [tokenId],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_getAttributePairs = async (snAccount: Account, tokenId: number) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duel_token",
					entryPoint: "get_attribute_pairs",
					calldata: [tokenId],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_getMetadataPairs = async (snAccount: Account, tokenId: number) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duel_token",
					entryPoint: "get_metadata_pairs",
					calldata: [tokenId],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_balanceOf = async (snAccount: Account, account: string) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duel_token",
					entryPoint: "balance_of",
					calldata: [account],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_ownerOf = async (snAccount: Account, tokenId: number) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duel_token",
					entryPoint: "owner_of",
					calldata: [tokenId],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_safeTransferFrom = async (snAccount: Account, from: string, to: string, tokenId: number, data: Array<number>) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duel_token",
					entryPoint: "safe_transfer_from",
					calldata: [from, to, tokenId, data],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_transferFrom = async (snAccount: Account, from: string, to: string, tokenId: number) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duel_token",
					entryPoint: "transfer_from",
					calldata: [from, to, tokenId],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_approve = async (snAccount: Account, to: string, tokenId: number) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duel_token",
					entryPoint: "approve",
					calldata: [to, tokenId],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_setApprovalForAll = async (snAccount: Account, operator: string, approved: boolean) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duel_token",
					entryPoint: "set_approval_for_all",
					calldata: [operator, approved],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_getApproved = async (snAccount: Account, tokenId: number) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duel_token",
					entryPoint: "get_approved",
					calldata: [tokenId],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_isApprovedForAll = async (snAccount: Account, owner: string, operator: string) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duel_token",
					entryPoint: "is_approved_for_all",
					calldata: [owner, operator],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_supportsInterface = async (snAccount: Account, interfaceId: number) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duel_token",
					entryPoint: "supports_interface",
					calldata: [interfaceId],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_name = async (snAccount: Account) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duel_token",
					entryPoint: "_name",
					calldata: [],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_symbol = async (snAccount: Account) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duel_token",
					entryPoint: "symbol",
					calldata: [],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_tokenUri = async (snAccount: Account, tokenId: number) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duel_token",
					entryPoint: "token_uri",
					calldata: [tokenId],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const fame_coin_mintedDuelist = async (snAccount: Account, duelistId: number, amountPaid: number) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "fame_coin",
					entryPoint: "minted_duelist",
					calldata: [duelistId, amountPaid],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const fame_coin_updatedDuelist = async (snAccount: Account, from: string, to: string, duelistId: number) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "fame_coin",
					entryPoint: "updated_duelist",
					calldata: [from, to, duelistId],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const fame_coin_totalSupply = async (snAccount: Account) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "fame_coin",
					entryPoint: "total_supply",
					calldata: [],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const fame_coin_balanceOf = async (snAccount: Account, account: string) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "fame_coin",
					entryPoint: "balance_of",
					calldata: [account],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const fame_coin_allowance = async (snAccount: Account, owner: string, spender: string) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "fame_coin",
					entryPoint: "allowance",
					calldata: [owner, spender],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const fame_coin_transfer = async (snAccount: Account, recipient: string, amount: number) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "fame_coin",
					entryPoint: "transfer",
					calldata: [recipient, amount],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const fame_coin_transferFrom = async (snAccount: Account, sender: string, recipient: string, amount: number) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "fame_coin",
					entryPoint: "transfer_from",
					calldata: [sender, recipient, amount],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const fame_coin_approve = async (snAccount: Account, spender: string, amount: number) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "fame_coin",
					entryPoint: "approve",
					calldata: [spender, amount],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const fame_coin_name = async (snAccount: Account) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "fame_coin",
					entryPoint: "_name",
					calldata: [],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const fame_coin_symbol = async (snAccount: Account) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "fame_coin",
					entryPoint: "symbol",
					calldata: [],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const fame_coin_decimals = async (snAccount: Account) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "fame_coin",
					entryPoint: "decimals",
					calldata: [],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const fame_coin_addressOfToken = async (snAccount: Account, contractAddress: string, tokenId: number) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "fame_coin",
					entryPoint: "address_of_token",
					calldata: [contractAddress, tokenId],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const fame_coin_tokenOfAddress = async (snAccount: Account, address: string) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "fame_coin",
					entryPoint: "token_of_address",
					calldata: [address],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const fame_coin_balanceOfToken = async (snAccount: Account, contractAddress: string, tokenId: number) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "fame_coin",
					entryPoint: "balance_of_token",
					calldata: [contractAddress, tokenId],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_balanceOf = async (snAccount: Account, account: string) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duelist_token",
					entryPoint: "balance_of",
					calldata: [account],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_ownerOf = async (snAccount: Account, tokenId: number) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duelist_token",
					entryPoint: "owner_of",
					calldata: [tokenId],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_safeTransferFrom = async (snAccount: Account, from: string, to: string, tokenId: number, data: Array<number>) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duelist_token",
					entryPoint: "safe_transfer_from",
					calldata: [from, to, tokenId, data],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_transferFrom = async (snAccount: Account, from: string, to: string, tokenId: number) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duelist_token",
					entryPoint: "transfer_from",
					calldata: [from, to, tokenId],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_approve = async (snAccount: Account, to: string, tokenId: number) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duelist_token",
					entryPoint: "approve",
					calldata: [to, tokenId],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_setApprovalForAll = async (snAccount: Account, operator: string, approved: boolean) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duelist_token",
					entryPoint: "set_approval_for_all",
					calldata: [operator, approved],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_getApproved = async (snAccount: Account, tokenId: number) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duelist_token",
					entryPoint: "get_approved",
					calldata: [tokenId],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_isApprovedForAll = async (snAccount: Account, owner: string, operator: string) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duelist_token",
					entryPoint: "is_approved_for_all",
					calldata: [owner, operator],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_supportsInterface = async (snAccount: Account, interfaceId: number) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duelist_token",
					entryPoint: "supports_interface",
					calldata: [interfaceId],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_name = async (snAccount: Account) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duelist_token",
					entryPoint: "_name",
					calldata: [],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_symbol = async (snAccount: Account) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duelist_token",
					entryPoint: "symbol",
					calldata: [],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_tokenUri = async (snAccount: Account, tokenId: number) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duelist_token",
					entryPoint: "token_uri",
					calldata: [tokenId],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_calcFee = async (snAccount: Account, recipient: string) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duelist_token",
					entryPoint: "calc_fee",
					calldata: [recipient],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_createDuelist = async (snAccount: Account, recipient: string, name: number, profilePicType: models.ProfilePicType, profilePicUri: number) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duelist_token",
					entryPoint: "create_duelist",
					calldata: [recipient, name, profilePicType, profilePicUri],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_updateDuelist = async (snAccount: Account, duelistId: number, name: number, profilePicType: models.ProfilePicType, profilePicUri: number) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duelist_token",
					entryPoint: "update_duelist",
					calldata: [duelistId, name, profilePicType, profilePicUri],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_deleteDuelist = async (snAccount: Account, duelistId: number) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duelist_token",
					entryPoint: "delete_duelist",
					calldata: [duelistId],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_canMint = async (snAccount: Account, callerAddress: string) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duelist_token",
					entryPoint: "can_mint",
					calldata: [callerAddress],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_exists = async (snAccount: Account, tokenId: number) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duelist_token",
					entryPoint: "exists",
					calldata: [tokenId],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_isOwnerOf = async (snAccount: Account, address: string, tokenId: number) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duelist_token",
					entryPoint: "is_owner_of",
					calldata: [address, tokenId],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_getTokenName = async (snAccount: Account, tokenId: number) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duelist_token",
					entryPoint: "get_token_name",
					calldata: [tokenId],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_getTokenDescription = async (snAccount: Account, tokenId: number) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duelist_token",
					entryPoint: "get_token_description",
					calldata: [tokenId],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_getTokenImage = async (snAccount: Account, tokenId: number) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duelist_token",
					entryPoint: "get_token_image",
					calldata: [tokenId],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_getAttributePairs = async (snAccount: Account, tokenId: number) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duelist_token",
					entryPoint: "get_attribute_pairs",
					calldata: [tokenId],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_getMetadataPairs = async (snAccount: Account, tokenId: number) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duelist_token",
					entryPoint: "get_metadata_pairs",
					calldata: [tokenId],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	return {
		bank: {
			charge: bank_charge,
		},
		rng: {
			reseed: rng_reseed,
			newShuffler: rng_newShuffler,
		},
		lords_mock: {
			totalSupply: lords_mock_totalSupply,
			balanceOf: lords_mock_balanceOf,
			allowance: lords_mock_allowance,
			transfer: lords_mock_transfer,
			transferFrom: lords_mock_transferFrom,
			approve: lords_mock_approve,
			name: lords_mock_name,
			symbol: lords_mock_symbol,
			decimals: lords_mock_decimals,
			faucet: lords_mock_faucet,
			mint: lords_mock_mint,
		},
		admin: {
			amIAdmin: admin_amIAdmin,
			grantAdmin: admin_grantAdmin,
			setConfig: admin_setConfig,
			setPaused: admin_setPaused,
			openTable: admin_openTable,
			setTable: admin_setTable,
			setTableAdmittance: admin_setTableAdmittance,
		},
		game: {
			commitMoves: game_commitMoves,
			revealMoves: game_revealMoves,
			getPlayerCardDecks: game_getPlayerCardDecks,
			getDuelProgress: game_getDuelProgress,
			testValidateCommitMessage: game_testValidateCommitMessage,
		},
		duel_token: {
			canMint: duel_token_canMint,
			exists: duel_token_exists,
			isOwnerOf: duel_token_isOwnerOf,
			createDuel: duel_token_createDuel,
			replyDuel: duel_token_replyDuel,
			deleteDuel: duel_token_deleteDuel,
			calcFee: duel_token_calcFee,
			getPact: duel_token_getPact,
			hasPact: duel_token_hasPact,
			canJoin: duel_token_canJoin,
			getTokenName: duel_token_getTokenName,
			getTokenDescription: duel_token_getTokenDescription,
			getTokenImage: duel_token_getTokenImage,
			getAttributePairs: duel_token_getAttributePairs,
			getMetadataPairs: duel_token_getMetadataPairs,
			balanceOf: duel_token_balanceOf,
			ownerOf: duel_token_ownerOf,
			safeTransferFrom: duel_token_safeTransferFrom,
			transferFrom: duel_token_transferFrom,
			approve: duel_token_approve,
			setApprovalForAll: duel_token_setApprovalForAll,
			getApproved: duel_token_getApproved,
			isApprovedForAll: duel_token_isApprovedForAll,
			supportsInterface: duel_token_supportsInterface,
			name: duel_token_name,
			symbol: duel_token_symbol,
			tokenUri: duel_token_tokenUri,
		},
		fame_coin: {
			mintedDuelist: fame_coin_mintedDuelist,
			updatedDuelist: fame_coin_updatedDuelist,
			totalSupply: fame_coin_totalSupply,
			balanceOf: fame_coin_balanceOf,
			allowance: fame_coin_allowance,
			transfer: fame_coin_transfer,
			transferFrom: fame_coin_transferFrom,
			approve: fame_coin_approve,
			name: fame_coin_name,
			symbol: fame_coin_symbol,
			decimals: fame_coin_decimals,
			addressOfToken: fame_coin_addressOfToken,
			tokenOfAddress: fame_coin_tokenOfAddress,
			balanceOfToken: fame_coin_balanceOfToken,
		},
		duelist_token: {
			balanceOf: duelist_token_balanceOf,
			ownerOf: duelist_token_ownerOf,
			safeTransferFrom: duelist_token_safeTransferFrom,
			transferFrom: duelist_token_transferFrom,
			approve: duelist_token_approve,
			setApprovalForAll: duelist_token_setApprovalForAll,
			getApproved: duelist_token_getApproved,
			isApprovedForAll: duelist_token_isApprovedForAll,
			supportsInterface: duelist_token_supportsInterface,
			name: duelist_token_name,
			symbol: duelist_token_symbol,
			tokenUri: duelist_token_tokenUri,
			calcFee: duelist_token_calcFee,
			createDuelist: duelist_token_createDuelist,
			updateDuelist: duelist_token_updateDuelist,
			deleteDuelist: duelist_token_deleteDuelist,
			canMint: duelist_token_canMint,
			exists: duelist_token_exists,
			isOwnerOf: duelist_token_isOwnerOf,
			getTokenName: duelist_token_getTokenName,
			getTokenDescription: duelist_token_getTokenDescription,
			getTokenImage: duelist_token_getTokenImage,
			getAttributePairs: duelist_token_getAttributePairs,
			getMetadataPairs: duelist_token_getMetadataPairs,
		},
	};
}