import { DojoProvider } from "@dojoengine/core";
import { Account } from "starknet";
import * as models from "./models.gen";

export async function setupWorld(provider: DojoProvider) {{

	const name = async (account: Account) => {
		try {
			return await provider.execute(

				account,
				{
					contractName: "game",
					entryPoint: "name",
					calldata: [],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const commitMoves = async (account: Account, duelistId: number, duelId: number, hashed: number) => {
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

	const revealMoves = async (account: Account, duelistId: number, duelId: number, salt: number, moves: Array<number>) => {
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

	const getPlayerCardDecks = async (account: Account, tableId: number) => {
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

	const getDuelProgress = async (account: Account, duelId: number) => {
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

	const testValidateCommitMessage = async (account: Account, account: string, signature: Array<number>, duelId: number, duelistId: number) => {
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

	const reseed = async (account: Account, seed: number, salt: number) => {
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

	const newShuffler = async (account: Account, shuffleSize: number) => {
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

	const name = async (account: Account) => {
		try {
			return await provider.execute(

				account,
				{
					contractName: "rng",
					entryPoint: "name",
					calldata: [],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const faucet = async (account: Account) => {
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

	const mint = async (account: Account, recipient: string, amount: number) => {
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

	const name = async (account: Account) => {
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

	const totalSupply = async (account: Account) => {
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

	const balanceOf = async (account: Account, account: string) => {
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

	const allowance = async (account: Account, owner: string, spender: string) => {
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

	const transfer = async (account: Account, recipient: string, amount: number) => {
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

	const transferFrom = async (account: Account, sender: string, recipient: string, amount: number) => {
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

	const approve = async (account: Account, spender: string, amount: number) => {
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

	const name = async (account: Account) => {
		try {
			return await provider.execute(

				account,
				{
					contractName: "lords_mock",
					entryPoint: "_name",
					calldata: [],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const symbol = async (account: Account) => {
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

	const decimals = async (account: Account) => {
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

	const totalSupply = async (account: Account) => {
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

	const balanceOf = async (account: Account, account: string) => {
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

	const transferFrom = async (account: Account, sender: string, recipient: string, amount: number) => {
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

	const canMint = async (account: Account, callerAddress: string) => {
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

	const exists = async (account: Account, tokenId: number) => {
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

	const isOwnerOf = async (account: Account, address: string, tokenId: number) => {
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

	const name = async (account: Account) => {
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

	const calcFee = async (account: Account, recipient: string) => {
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

	const createDuelist = async (account: Account, recipient: string, name: number, profilePicType: models.ProfilePicType, profilePicUri: number) => {
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

	const updateDuelist = async (account: Account, duelistId: number, name: number, profilePicType: models.ProfilePicType, profilePicUri: number) => {
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

	const deleteDuelist = async (account: Account, duelistId: number) => {
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

	const getTokenName = async (account: Account, tokenId: number) => {
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

	const getTokenDescription = async (account: Account, tokenId: number) => {
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

	const getTokenImage = async (account: Account, tokenId: number) => {
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

	const getAttributePairs = async (account: Account, tokenId: number) => {
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

	const getMetadataPairs = async (account: Account, tokenId: number) => {
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

	const balanceOf = async (account: Account, account: string) => {
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

	const ownerOf = async (account: Account, tokenId: number) => {
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

	const safeTransferFrom = async (account: Account, from: string, to: string, tokenId: number, data: Array<number>) => {
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

	const transferFrom = async (account: Account, from: string, to: string, tokenId: number) => {
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

	const approve = async (account: Account, to: string, tokenId: number) => {
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

	const setApprovalForAll = async (account: Account, operator: string, approved: boolean) => {
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

	const getApproved = async (account: Account, tokenId: number) => {
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

	const isApprovedForAll = async (account: Account, owner: string, operator: string) => {
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

	const supportsInterface = async (account: Account, interfaceId: number) => {
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

	const name = async (account: Account) => {
		try {
			return await provider.execute(

				account,
				{
					contractName: "duelist_token",
					entryPoint: "_name",
					calldata: [],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const symbol = async (account: Account) => {
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

	const tokenUri = async (account: Account, tokenId: number) => {
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

	const balanceOf = async (account: Account, account: string) => {
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

	const ownerOf = async (account: Account, tokenId: number) => {
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

	const safeTransferFrom = async (account: Account, from: string, to: string, tokenId: number, data: Array<number>) => {
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

	const transferFrom = async (account: Account, from: string, to: string, tokenId: number) => {
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

	const setApprovalForAll = async (account: Account, operator: string, approved: boolean) => {
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

	const getApproved = async (account: Account, tokenId: number) => {
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

	const isApprovedForAll = async (account: Account, owner: string, operator: string) => {
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

	const tokenUri = async (account: Account, tokenId: number) => {
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

	const name = async (account: Account) => {
		try {
			return await provider.execute(

				account,
				{
					contractName: "bank",
					entryPoint: "name",
					calldata: [],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const charge = async (account: Account, payer: string, payment: Payment) => {
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

	const amIAdmin = async (account: Account, accountAddress: string) => {
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

	const grantAdmin = async (account: Account, accountAddress: string, granted: boolean) => {
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

	const setConfig = async (account: Account, config: Config) => {
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

	const setPaused = async (account: Account, paused: boolean) => {
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

	const openTable = async (account: Account, tableId: number, isOpen: boolean) => {
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

	const setTable = async (account: Account, table: TableConfig) => {
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

	const setTableAdmittance = async (account: Account, tableAdmittance: TableAdmittance) => {
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

	const name = async (account: Account) => {
		try {
			return await provider.execute(

				account,
				{
					contractName: "admin",
					entryPoint: "name",
					calldata: [],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const name = async (account: Account) => {
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

	const getTokenName = async (account: Account, tokenId: number) => {
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

	const getTokenDescription = async (account: Account, tokenId: number) => {
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

	const getTokenImage = async (account: Account, tokenId: number) => {
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

	const getAttributePairs = async (account: Account, tokenId: number) => {
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

	const getMetadataPairs = async (account: Account, tokenId: number) => {
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

	const createDuel = async (account: Account, duelistId: number, challengedIdOrAddress: string, premise: models.Premise, quote: number, tableId: number, expireHours: number) => {
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

	const replyDuel = async (account: Account, duelistId: number, duelId: number, accepted: boolean) => {
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

	const deleteDuel = async (account: Account, duelId: number) => {
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

	const calcFee = async (account: Account, tableId: number) => {
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

	const getPact = async (account: Account, tableId: number, duelistIdA: number, duelistIdB: number) => {
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

	const hasPact = async (account: Account, tableId: number, duelistIdA: number, duelistIdB: number) => {
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

	const canJoin = async (account: Account, tableId: number, duelistId: number) => {
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

	const canMint = async (account: Account, callerAddress: string) => {
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

	const exists = async (account: Account, tokenId: number) => {
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

	const isOwnerOf = async (account: Account, address: string, tokenId: number) => {
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

	const balanceOf = async (account: Account, account: string) => {
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

	const ownerOf = async (account: Account, tokenId: number) => {
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

	const safeTransferFrom = async (account: Account, from: string, to: string, tokenId: number, data: Array<number>) => {
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

	const transferFrom = async (account: Account, from: string, to: string, tokenId: number) => {
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

	const approve = async (account: Account, to: string, tokenId: number) => {
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

	const setApprovalForAll = async (account: Account, operator: string, approved: boolean) => {
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

	const getApproved = async (account: Account, tokenId: number) => {
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

	const isApprovedForAll = async (account: Account, owner: string, operator: string) => {
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

	const supportsInterface = async (account: Account, interfaceId: number) => {
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

	const name = async (account: Account) => {
		try {
			return await provider.execute(

				account,
				{
					contractName: "duel_token",
					entryPoint: "_name",
					calldata: [],
				}
			);
		} catch (error) {
			console.error(error);
		}
	};

	const symbol = async (account: Account) => {
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

	const tokenUri = async (account: Account, tokenId: number) => {
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

	const balanceOf = async (account: Account, account: string) => {
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

	const ownerOf = async (account: Account, tokenId: number) => {
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

	const safeTransferFrom = async (account: Account, from: string, to: string, tokenId: number, data: Array<number>) => {
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

	const transferFrom = async (account: Account, from: string, to: string, tokenId: number) => {
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

	const setApprovalForAll = async (account: Account, operator: string, approved: boolean) => {
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

	const getApproved = async (account: Account, tokenId: number) => {
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

	const isApprovedForAll = async (account: Account, owner: string, operator: string) => {
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

	const tokenUri = async (account: Account, tokenId: number) => {
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

	return {
		name,
		commitMoves,
		revealMoves,
		getPlayerCardDecks,
		getDuelProgress,
		testValidateCommitMessage,
		reseed,
		newShuffler,
		name,
		faucet,
		mint,
		name,
		totalSupply,
		balanceOf,
		allowance,
		transfer,
		transferFrom,
		approve,
		name,
		symbol,
		decimals,
		totalSupply,
		balanceOf,
		transferFrom,
		canMint,
		exists,
		isOwnerOf,
		name,
		calcFee,
		createDuelist,
		updateDuelist,
		deleteDuelist,
		getTokenName,
		getTokenDescription,
		getTokenImage,
		getAttributePairs,
		getMetadataPairs,
		balanceOf,
		ownerOf,
		safeTransferFrom,
		transferFrom,
		approve,
		setApprovalForAll,
		getApproved,
		isApprovedForAll,
		supportsInterface,
		name,
		symbol,
		tokenUri,
		balanceOf,
		ownerOf,
		safeTransferFrom,
		transferFrom,
		setApprovalForAll,
		getApproved,
		isApprovedForAll,
		tokenUri,
		name,
		charge,
		amIAdmin,
		grantAdmin,
		setConfig,
		setPaused,
		openTable,
		setTable,
		setTableAdmittance,
		name,
		name,
		getTokenName,
		getTokenDescription,
		getTokenImage,
		getAttributePairs,
		getMetadataPairs,
		createDuel,
		replyDuel,
		deleteDuel,
		calcFee,
		getPact,
		hasPact,
		canJoin,
		canMint,
		exists,
		isOwnerOf,
		balanceOf,
		ownerOf,
		safeTransferFrom,
		transferFrom,
		approve,
		setApprovalForAll,
		getApproved,
		isApprovedForAll,
		supportsInterface,
		name,
		symbol,
		tokenUri,
		balanceOf,
		ownerOf,
		safeTransferFrom,
		transferFrom,
		setApprovalForAll,
		getApproved,
		isApprovedForAll,
		tokenUri,
	};
}