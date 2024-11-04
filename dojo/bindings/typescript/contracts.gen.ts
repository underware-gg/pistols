import { DojoProvider } from "@dojoengine/core";
import { Account } from "starknet";
import * as models from "./models.gen";

export async function setupWorld(provider: DojoProvider) {

	const bank_charge = async (account: Account, payer: string, payment: Payment) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "bank",
					entryPoint: "charge",
					calldata: [payer, payment],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const rng_reseed = async (account: Account, seed: number, salt: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "rng",
					entryPoint: "reseed",
					calldata: [seed, salt],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const rng_newShuffler = async (account: Account, shuffleSize: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "rng",
					entryPoint: "new_shuffler",
					calldata: [shuffleSize],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const game_commitMoves = async (account: Account, duelistId: number, duelId: number, hashed: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "game",
					entryPoint: "commit_moves",
					calldata: [duelistId, duelId, hashed],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const game_revealMoves = async (account: Account, duelistId: number, duelId: number, salt: number, moves: Array<number>) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "game",
					entryPoint: "reveal_moves",
					calldata: [duelistId, duelId, salt, moves],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const game_getPlayerCardDecks = async (account: Account, tableId: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "game",
					entryPoint: "get_player_card_decks",
					calldata: [tableId],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const game_getDuelProgress = async (account: Account, duelId: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "game",
					entryPoint: "get_duel_progress",
					calldata: [duelId],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const game_testValidateCommitMessage = async (account: Account, account: string, signature: Array<number>, duelId: number, duelistId: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "game",
					entryPoint: "test_validate_commit_message",
					calldata: [account, signature, duelId, duelistId],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const admin_amIAdmin = async (account: Account, accountAddress: string) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "admin",
					entryPoint: "am_i_admin",
					calldata: [accountAddress],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const admin_grantAdmin = async (account: Account, accountAddress: string, granted: boolean) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "admin",
					entryPoint: "grant_admin",
					calldata: [accountAddress, granted],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const admin_setConfig = async (account: Account, config: Config) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "admin",
					entryPoint: "set_config",
					calldata: [config],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const admin_setPaused = async (account: Account, paused: boolean) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "admin",
					entryPoint: "set_paused",
					calldata: [paused],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const admin_openTable = async (account: Account, tableId: number, isOpen: boolean) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "admin",
					entryPoint: "open_table",
					calldata: [tableId, isOpen],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const admin_setTable = async (account: Account, table: TableConfig) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "admin",
					entryPoint: "set_table",
					calldata: [table],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const admin_setTableAdmittance = async (account: Account, tableAdmittance: TableAdmittance) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "admin",
					entryPoint: "set_table_admittance",
					calldata: [tableAdmittance],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const fame_coin_totalSupply = async (account: Account) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "fame_coin",
					entryPoint: "total_supply",
					calldata: [],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const fame_coin_balanceOf = async (account: Account, account: string) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "fame_coin",
					entryPoint: "balance_of",
					calldata: [account],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const fame_coin_allowance = async (account: Account, owner: string, spender: string) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "fame_coin",
					entryPoint: "allowance",
					calldata: [owner, spender],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const fame_coin_transfer = async (account: Account, recipient: string, amount: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "fame_coin",
					entryPoint: "transfer",
					calldata: [recipient, amount],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const fame_coin_transferFrom = async (account: Account, sender: string, recipient: string, amount: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "fame_coin",
					entryPoint: "transfer_from",
					calldata: [sender, recipient, amount],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const fame_coin_approve = async (account: Account, spender: string, amount: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "fame_coin",
					entryPoint: "approve",
					calldata: [spender, amount],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const fame_coin_name = async (account: Account) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "fame_coin",
					entryPoint: "name",
					calldata: [],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const fame_coin_symbol = async (account: Account) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "fame_coin",
					entryPoint: "symbol",
					calldata: [],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const fame_coin_decimals = async (account: Account) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "fame_coin",
					entryPoint: "decimals",
					calldata: [],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const fame_coin_totalSupply = async (account: Account) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "fame_coin",
					entryPoint: "totalSupply",
					calldata: [],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const fame_coin_balanceOf = async (account: Account, account: string) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "fame_coin",
					entryPoint: "balanceOf",
					calldata: [account],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const fame_coin_transferFrom = async (account: Account, sender: string, recipient: string, amount: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "fame_coin",
					entryPoint: "transferFrom",
					calldata: [sender, recipient, amount],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const fame_coin_addressOfToken = async (account: Account, contractAddress: string, tokenId: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "fame_coin",
					entryPoint: "address_of_token",
					calldata: [contractAddress, tokenId],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const fame_coin_tokenOfAddress = async (account: Account, address: string) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "fame_coin",
					entryPoint: "token_of_address",
					calldata: [address],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const fame_coin_balanceOfToken = async (account: Account, contractAddress: string, tokenId: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "fame_coin",
					entryPoint: "balance_of_token",
					calldata: [contractAddress, tokenId],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const fame_coin_mintedDuelist = async (account: Account, duelistId: number, amountPaid: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "fame_coin",
					entryPoint: "minted_duelist",
					calldata: [duelistId, amountPaid],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const fame_coin_updatedDuelist = async (account: Account, from: string, to: string, duelistId: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "fame_coin",
					entryPoint: "updated_duelist",
					calldata: [from, to, duelistId],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_getTokenName = async (account: Account, tokenId: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duel_token",
					entryPoint: "get_token_name",
					calldata: [tokenId],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_getTokenDescription = async (account: Account, tokenId: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duel_token",
					entryPoint: "get_token_description",
					calldata: [tokenId],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_getTokenImage = async (account: Account, tokenId: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duel_token",
					entryPoint: "get_token_image",
					calldata: [tokenId],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_getAttributePairs = async (account: Account, tokenId: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duel_token",
					entryPoint: "get_attribute_pairs",
					calldata: [tokenId],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_getMetadataPairs = async (account: Account, tokenId: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duel_token",
					entryPoint: "get_metadata_pairs",
					calldata: [tokenId],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_createDuel = async (account: Account, duelistId: number, challengedIdOrAddress: string, premise: models.Premise, quote: number, tableId: number, expireHours: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duel_token",
					entryPoint: "create_duel",
					calldata: [duelistId, challengedIdOrAddress, premise, quote, tableId, expireHours],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_replyDuel = async (account: Account, duelistId: number, duelId: number, accepted: boolean) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duel_token",
					entryPoint: "reply_duel",
					calldata: [duelistId, duelId, accepted],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_deleteDuel = async (account: Account, duelId: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duel_token",
					entryPoint: "delete_duel",
					calldata: [duelId],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_calcFee = async (account: Account, tableId: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duel_token",
					entryPoint: "calc_fee",
					calldata: [tableId],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_getPact = async (account: Account, tableId: number, duelistIdA: number, duelistIdB: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duel_token",
					entryPoint: "get_pact",
					calldata: [tableId, duelistIdA, duelistIdB],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_hasPact = async (account: Account, tableId: number, duelistIdA: number, duelistIdB: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duel_token",
					entryPoint: "has_pact",
					calldata: [tableId, duelistIdA, duelistIdB],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_canJoin = async (account: Account, tableId: number, duelistId: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duel_token",
					entryPoint: "can_join",
					calldata: [tableId, duelistId],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_canMint = async (account: Account, callerAddress: string) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duel_token",
					entryPoint: "can_mint",
					calldata: [callerAddress],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_exists = async (account: Account, tokenId: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duel_token",
					entryPoint: "exists",
					calldata: [tokenId],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_isOwnerOf = async (account: Account, address: string, tokenId: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duel_token",
					entryPoint: "is_owner_of",
					calldata: [address, tokenId],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_balanceOf = async (account: Account, account: string) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duel_token",
					entryPoint: "balance_of",
					calldata: [account],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_ownerOf = async (account: Account, tokenId: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duel_token",
					entryPoint: "owner_of",
					calldata: [tokenId],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_safeTransferFrom = async (account: Account, from: string, to: string, tokenId: number, data: Array<number>) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duel_token",
					entryPoint: "safe_transfer_from",
					calldata: [from, to, tokenId, data],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_transferFrom = async (account: Account, from: string, to: string, tokenId: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duel_token",
					entryPoint: "transfer_from",
					calldata: [from, to, tokenId],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_approve = async (account: Account, to: string, tokenId: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duel_token",
					entryPoint: "approve",
					calldata: [to, tokenId],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_setApprovalForAll = async (account: Account, operator: string, approved: boolean) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duel_token",
					entryPoint: "set_approval_for_all",
					calldata: [operator, approved],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_getApproved = async (account: Account, tokenId: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duel_token",
					entryPoint: "get_approved",
					calldata: [tokenId],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_isApprovedForAll = async (account: Account, owner: string, operator: string) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duel_token",
					entryPoint: "is_approved_for_all",
					calldata: [owner, operator],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_supportsInterface = async (account: Account, interfaceId: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duel_token",
					entryPoint: "supports_interface",
					calldata: [interfaceId],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_name = async (account: Account) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duel_token",
					entryPoint: "name",
					calldata: [],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_symbol = async (account: Account) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duel_token",
					entryPoint: "symbol",
					calldata: [],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_tokenUri = async (account: Account, tokenId: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duel_token",
					entryPoint: "token_uri",
					calldata: [tokenId],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_balanceOf = async (account: Account, account: string) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duel_token",
					entryPoint: "balanceOf",
					calldata: [account],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_ownerOf = async (account: Account, tokenId: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duel_token",
					entryPoint: "ownerOf",
					calldata: [tokenId],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_safeTransferFrom = async (account: Account, from: string, to: string, tokenId: number, data: Array<number>) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duel_token",
					entryPoint: "safeTransferFrom",
					calldata: [from, to, tokenId, data],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_transferFrom = async (account: Account, from: string, to: string, tokenId: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duel_token",
					entryPoint: "transferFrom",
					calldata: [from, to, tokenId],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_setApprovalForAll = async (account: Account, operator: string, approved: boolean) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duel_token",
					entryPoint: "setApprovalForAll",
					calldata: [operator, approved],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_getApproved = async (account: Account, tokenId: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duel_token",
					entryPoint: "getApproved",
					calldata: [tokenId],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_isApprovedForAll = async (account: Account, owner: string, operator: string) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duel_token",
					entryPoint: "isApprovedForAll",
					calldata: [owner, operator],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_tokenUri = async (account: Account, tokenId: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duel_token",
					entryPoint: "tokenURI",
					calldata: [tokenId],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_canMint = async (account: Account, callerAddress: string) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duelist_token",
					entryPoint: "can_mint",
					calldata: [callerAddress],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_exists = async (account: Account, tokenId: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duelist_token",
					entryPoint: "exists",
					calldata: [tokenId],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_isOwnerOf = async (account: Account, address: string, tokenId: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duelist_token",
					entryPoint: "is_owner_of",
					calldata: [address, tokenId],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_getTokenName = async (account: Account, tokenId: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duelist_token",
					entryPoint: "get_token_name",
					calldata: [tokenId],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_getTokenDescription = async (account: Account, tokenId: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duelist_token",
					entryPoint: "get_token_description",
					calldata: [tokenId],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_getTokenImage = async (account: Account, tokenId: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duelist_token",
					entryPoint: "get_token_image",
					calldata: [tokenId],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_getAttributePairs = async (account: Account, tokenId: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duelist_token",
					entryPoint: "get_attribute_pairs",
					calldata: [tokenId],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_getMetadataPairs = async (account: Account, tokenId: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duelist_token",
					entryPoint: "get_metadata_pairs",
					calldata: [tokenId],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_balanceOf = async (account: Account, account: string) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duelist_token",
					entryPoint: "balance_of",
					calldata: [account],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_ownerOf = async (account: Account, tokenId: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duelist_token",
					entryPoint: "owner_of",
					calldata: [tokenId],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_safeTransferFrom = async (account: Account, from: string, to: string, tokenId: number, data: Array<number>) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duelist_token",
					entryPoint: "safe_transfer_from",
					calldata: [from, to, tokenId, data],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_transferFrom = async (account: Account, from: string, to: string, tokenId: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duelist_token",
					entryPoint: "transfer_from",
					calldata: [from, to, tokenId],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_approve = async (account: Account, to: string, tokenId: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duelist_token",
					entryPoint: "approve",
					calldata: [to, tokenId],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_setApprovalForAll = async (account: Account, operator: string, approved: boolean) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duelist_token",
					entryPoint: "set_approval_for_all",
					calldata: [operator, approved],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_getApproved = async (account: Account, tokenId: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duelist_token",
					entryPoint: "get_approved",
					calldata: [tokenId],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_isApprovedForAll = async (account: Account, owner: string, operator: string) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duelist_token",
					entryPoint: "is_approved_for_all",
					calldata: [owner, operator],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_supportsInterface = async (account: Account, interfaceId: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duelist_token",
					entryPoint: "supports_interface",
					calldata: [interfaceId],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_name = async (account: Account) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duelist_token",
					entryPoint: "name",
					calldata: [],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_symbol = async (account: Account) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duelist_token",
					entryPoint: "symbol",
					calldata: [],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_tokenUri = async (account: Account, tokenId: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duelist_token",
					entryPoint: "token_uri",
					calldata: [tokenId],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_balanceOf = async (account: Account, account: string) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duelist_token",
					entryPoint: "balanceOf",
					calldata: [account],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_ownerOf = async (account: Account, tokenId: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duelist_token",
					entryPoint: "ownerOf",
					calldata: [tokenId],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_safeTransferFrom = async (account: Account, from: string, to: string, tokenId: number, data: Array<number>) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duelist_token",
					entryPoint: "safeTransferFrom",
					calldata: [from, to, tokenId, data],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_transferFrom = async (account: Account, from: string, to: string, tokenId: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duelist_token",
					entryPoint: "transferFrom",
					calldata: [from, to, tokenId],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_setApprovalForAll = async (account: Account, operator: string, approved: boolean) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duelist_token",
					entryPoint: "setApprovalForAll",
					calldata: [operator, approved],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_getApproved = async (account: Account, tokenId: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duelist_token",
					entryPoint: "getApproved",
					calldata: [tokenId],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_isApprovedForAll = async (account: Account, owner: string, operator: string) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duelist_token",
					entryPoint: "isApprovedForAll",
					calldata: [owner, operator],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_tokenUri = async (account: Account, tokenId: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duelist_token",
					entryPoint: "tokenURI",
					calldata: [tokenId],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_calcFee = async (account: Account, recipient: string) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duelist_token",
					entryPoint: "calc_fee",
					calldata: [recipient],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_createDuelist = async (account: Account, recipient: string, name: number, profilePicType: models.ProfilePicType, profilePicUri: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duelist_token",
					entryPoint: "create_duelist",
					calldata: [recipient, name, profilePicType, profilePicUri],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_updateDuelist = async (account: Account, duelistId: number, name: number, profilePicType: models.ProfilePicType, profilePicUri: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duelist_token",
					entryPoint: "update_duelist",
					calldata: [duelistId, name, profilePicType, profilePicUri],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_deleteDuelist = async (account: Account, duelistId: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "duelist_token",
					entryPoint: "delete_duelist",
					calldata: [duelistId],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const lords_mock_faucet = async (account: Account) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "lords_mock",
					entryPoint: "faucet",
					calldata: [],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const lords_mock_mint = async (account: Account, recipient: string, amount: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "lords_mock",
					entryPoint: "mint",
					calldata: [recipient, amount],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const lords_mock_totalSupply = async (account: Account) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "lords_mock",
					entryPoint: "total_supply",
					calldata: [],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const lords_mock_balanceOf = async (account: Account, account: string) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "lords_mock",
					entryPoint: "balance_of",
					calldata: [account],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const lords_mock_allowance = async (account: Account, owner: string, spender: string) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "lords_mock",
					entryPoint: "allowance",
					calldata: [owner, spender],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const lords_mock_transfer = async (account: Account, recipient: string, amount: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "lords_mock",
					entryPoint: "transfer",
					calldata: [recipient, amount],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const lords_mock_transferFrom = async (account: Account, sender: string, recipient: string, amount: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "lords_mock",
					entryPoint: "transfer_from",
					calldata: [sender, recipient, amount],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const lords_mock_approve = async (account: Account, spender: string, amount: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "lords_mock",
					entryPoint: "approve",
					calldata: [spender, amount],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const lords_mock_name = async (account: Account) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "lords_mock",
					entryPoint: "name",
					calldata: [],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const lords_mock_symbol = async (account: Account) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "lords_mock",
					entryPoint: "symbol",
					calldata: [],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const lords_mock_decimals = async (account: Account) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "lords_mock",
					entryPoint: "decimals",
					calldata: [],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const lords_mock_totalSupply = async (account: Account) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "lords_mock",
					entryPoint: "totalSupply",
					calldata: [],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const lords_mock_balanceOf = async (account: Account, account: string) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "lords_mock",
					entryPoint: "balanceOf",
					calldata: [account],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const lords_mock_transferFrom = async (account: Account, sender: string, recipient: string, amount: number) => {
		try {
			return await provider.execute(
				account,
				{
					contractName: "lords_mock",
					entryPoint: "transferFrom",
					calldata: [sender, recipient, amount],
				}
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
		game: {
			commitMoves: game_commitMoves,
			revealMoves: game_revealMoves,
			getPlayerCardDecks: game_getPlayerCardDecks,
			getDuelProgress: game_getDuelProgress,
			testValidateCommitMessage: game_testValidateCommitMessage,
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
		fame_coin: {
			totalSupply: fame_coin_totalSupply,
			balanceOf: fame_coin_balanceOf,
			allowance: fame_coin_allowance,
			transfer: fame_coin_transfer,
			transferFrom: fame_coin_transferFrom,
			approve: fame_coin_approve,
			name: fame_coin_name,
			symbol: fame_coin_symbol,
			decimals: fame_coin_decimals,
			totalSupply: fame_coin_totalSupply,
			balanceOf: fame_coin_balanceOf,
			transferFrom: fame_coin_transferFrom,
			addressOfToken: fame_coin_addressOfToken,
			tokenOfAddress: fame_coin_tokenOfAddress,
			balanceOfToken: fame_coin_balanceOfToken,
			mintedDuelist: fame_coin_mintedDuelist,
			updatedDuelist: fame_coin_updatedDuelist,
		},
		duel_token: {
			getTokenName: duel_token_getTokenName,
			getTokenDescription: duel_token_getTokenDescription,
			getTokenImage: duel_token_getTokenImage,
			getAttributePairs: duel_token_getAttributePairs,
			getMetadataPairs: duel_token_getMetadataPairs,
			createDuel: duel_token_createDuel,
			replyDuel: duel_token_replyDuel,
			deleteDuel: duel_token_deleteDuel,
			calcFee: duel_token_calcFee,
			getPact: duel_token_getPact,
			hasPact: duel_token_hasPact,
			canJoin: duel_token_canJoin,
			canMint: duel_token_canMint,
			exists: duel_token_exists,
			isOwnerOf: duel_token_isOwnerOf,
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
			balanceOf: duel_token_balanceOf,
			ownerOf: duel_token_ownerOf,
			safeTransferFrom: duel_token_safeTransferFrom,
			transferFrom: duel_token_transferFrom,
			setApprovalForAll: duel_token_setApprovalForAll,
			getApproved: duel_token_getApproved,
			isApprovedForAll: duel_token_isApprovedForAll,
			tokenUri: duel_token_tokenUri,
		},
		duelist_token: {
			canMint: duelist_token_canMint,
			exists: duelist_token_exists,
			isOwnerOf: duelist_token_isOwnerOf,
			getTokenName: duelist_token_getTokenName,
			getTokenDescription: duelist_token_getTokenDescription,
			getTokenImage: duelist_token_getTokenImage,
			getAttributePairs: duelist_token_getAttributePairs,
			getMetadataPairs: duelist_token_getMetadataPairs,
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
			balanceOf: duelist_token_balanceOf,
			ownerOf: duelist_token_ownerOf,
			safeTransferFrom: duelist_token_safeTransferFrom,
			transferFrom: duelist_token_transferFrom,
			setApprovalForAll: duelist_token_setApprovalForAll,
			getApproved: duelist_token_getApproved,
			isApprovedForAll: duelist_token_isApprovedForAll,
			tokenUri: duelist_token_tokenUri,
			calcFee: duelist_token_calcFee,
			createDuelist: duelist_token_createDuelist,
			updateDuelist: duelist_token_updateDuelist,
			deleteDuelist: duelist_token_deleteDuelist,
		},
		lords_mock: {
			faucet: lords_mock_faucet,
			mint: lords_mock_mint,
			totalSupply: lords_mock_totalSupply,
			balanceOf: lords_mock_balanceOf,
			allowance: lords_mock_allowance,
			transfer: lords_mock_transfer,
			transferFrom: lords_mock_transferFrom,
			approve: lords_mock_approve,
			name: lords_mock_name,
			symbol: lords_mock_symbol,
			decimals: lords_mock_decimals,
			totalSupply: lords_mock_totalSupply,
			balanceOf: lords_mock_balanceOf,
			transferFrom: lords_mock_transferFrom,
		},
	};
}