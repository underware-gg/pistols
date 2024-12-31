import { DojoProvider } from "@dojoengine/core";
import { Account, AccountInterface, BigNumberish, CairoOption, CairoCustomEnum, ByteArray } from "starknet";
import * as models from "./models.gen";

export function setupWorld(provider: DojoProvider) {

	const admin_amIAdmin = async (accountAddress: string) => {
		try {
			return await provider.call("pistols", {
				contractName: "admin",
				entrypoint: "am_i_admin",
				calldata: [accountAddress],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const admin_grantAdmin = async (snAccount: Account | AccountInterface, accountAddress: string, granted: boolean) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "admin",
					entrypoint: "grant_admin",
					calldata: [accountAddress, granted],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const admin_setTreasury = async (snAccount: Account | AccountInterface, treasuryAddress: string) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "admin",
					entrypoint: "set_treasury",
					calldata: [treasuryAddress],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const admin_setPaused = async (snAccount: Account | AccountInterface, paused: boolean) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "admin",
					entrypoint: "set_paused",
					calldata: [paused],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const admin_openTable = async (snAccount: Account | AccountInterface, tableId: BigNumberish, isOpen: boolean) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "admin",
					entrypoint: "open_table",
					calldata: [tableId, isOpen],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const admin_setTable = async (snAccount: Account | AccountInterface, table: models.TableConfig) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "admin",
					entrypoint: "set_table",
					calldata: [table],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const admin_setTableAdmittance = async (snAccount: Account | AccountInterface, tableAdmittance: models.TableAdmittance) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "admin",
					entrypoint: "set_table_admittance",
					calldata: [tableAdmittance],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const game_commitMoves = async (snAccount: Account | AccountInterface, duelistId: BigNumberish, duelId: BigNumberish, hashed: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "game",
					entrypoint: "commit_moves",
					calldata: [duelistId, duelId, hashed],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const game_revealMoves = async (snAccount: Account | AccountInterface, duelistId: BigNumberish, duelId: BigNumberish, salt: BigNumberish, moves: Array<BigNumberish>) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "game",
					entrypoint: "reveal_moves",
					calldata: [duelistId, duelId, salt, moves],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const game_getPlayerCardDecks = async (tableId: BigNumberish) => {
		try {
			return await provider.call("pistols", {
				contractName: "game",
				entrypoint: "get_player_card_decks",
				calldata: [tableId],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const game_getDuelProgress = async (duelId: BigNumberish) => {
		try {
			return await provider.call("pistols", {
				contractName: "game",
				entrypoint: "get_duel_progress",
				calldata: [duelId],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const game_testValidateCommitMessage = async (account: string, signature: Array<BigNumberish>, duelId: BigNumberish, duelistId: BigNumberish) => {
		try {
			return await provider.call("pistols", {
				contractName: "game",
				entrypoint: "test_validate_commit_message",
				calldata: [account, signature, duelId, duelistId],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const pack_token_getTokenName = async (tokenId: U256) => {
		try {
			return await provider.call("pistols", {
				contractName: "pack_token",
				entrypoint: "get_token_name",
				calldata: [tokenId],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const pack_token_getTokenDescription = async (tokenId: U256) => {
		try {
			return await provider.call("pistols", {
				contractName: "pack_token",
				entrypoint: "get_token_description",
				calldata: [tokenId],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const pack_token_getTokenImage = async (tokenId: U256) => {
		try {
			return await provider.call("pistols", {
				contractName: "pack_token",
				entrypoint: "get_token_image",
				calldata: [tokenId],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const pack_token_getAttributePairs = async (tokenId: U256) => {
		try {
			return await provider.call("pistols", {
				contractName: "pack_token",
				entrypoint: "get_attribute_pairs",
				calldata: [tokenId],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const pack_token_getMetadataPairs = async (tokenId: U256) => {
		try {
			return await provider.call("pistols", {
				contractName: "pack_token",
				entrypoint: "get_metadata_pairs",
				calldata: [tokenId],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const pack_token_balanceOf = async (account: string) => {
		try {
			return await provider.call("pistols", {
				contractName: "pack_token",
				entrypoint: "balance_of",
				calldata: [account],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const pack_token_ownerOf = async (tokenId: U256) => {
		try {
			return await provider.call("pistols", {
				contractName: "pack_token",
				entrypoint: "owner_of",
				calldata: [tokenId],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const pack_token_safeTransferFrom = async (snAccount: Account | AccountInterface, from: string, to: string, tokenId: U256, data: Array<BigNumberish>) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "pack_token",
					entrypoint: "safe_transfer_from",
					calldata: [from, to, tokenId, data],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const pack_token_transferFrom = async (snAccount: Account | AccountInterface, from: string, to: string, tokenId: U256) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "pack_token",
					entrypoint: "transfer_from",
					calldata: [from, to, tokenId],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const pack_token_approve = async (snAccount: Account | AccountInterface, to: string, tokenId: U256) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "pack_token",
					entrypoint: "approve",
					calldata: [to, tokenId],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const pack_token_setApprovalForAll = async (snAccount: Account | AccountInterface, operator: string, approved: boolean) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "pack_token",
					entrypoint: "set_approval_for_all",
					calldata: [operator, approved],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const pack_token_getApproved = async (tokenId: U256) => {
		try {
			return await provider.call("pistols", {
				contractName: "pack_token",
				entrypoint: "get_approved",
				calldata: [tokenId],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const pack_token_isApprovedForAll = async (owner: string, operator: string) => {
		try {
			return await provider.call("pistols", {
				contractName: "pack_token",
				entrypoint: "is_approved_for_all",
				calldata: [owner, operator],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const pack_token_supportsInterface = async (interfaceId: BigNumberish) => {
		try {
			return await provider.call("pistols", {
				contractName: "pack_token",
				entrypoint: "supports_interface",
				calldata: [interfaceId],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const pack_token_name = async () => {
		try {
			return await provider.call("pistols", {
				contractName: "pack_token",
				entrypoint: "name",
				calldata: [],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const pack_token_symbol = async () => {
		try {
			return await provider.call("pistols", {
				contractName: "pack_token",
				entrypoint: "symbol",
				calldata: [],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const pack_token_tokenUri = async (tokenId: U256) => {
		try {
			return await provider.call("pistols", {
				contractName: "pack_token",
				entrypoint: "token_uri",
				calldata: [tokenId],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const pack_token_canMint = async (recipient: string) => {
		try {
			return await provider.call("pistols", {
				contractName: "pack_token",
				entrypoint: "can_mint",
				calldata: [recipient],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const pack_token_exists = async (tokenId: BigNumberish) => {
		try {
			return await provider.call("pistols", {
				contractName: "pack_token",
				entrypoint: "exists",
				calldata: [tokenId],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const pack_token_isOwnerOf = async (address: string, tokenId: BigNumberish) => {
		try {
			return await provider.call("pistols", {
				contractName: "pack_token",
				entrypoint: "is_owner_of",
				calldata: [address, tokenId],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const pack_token_canClaimWelcomePack = async (recipient: string) => {
		try {
			return await provider.call("pistols", {
				contractName: "pack_token",
				entrypoint: "can_claim_welcome_pack",
				calldata: [recipient],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const pack_token_canPurchase = async (recipient: string, packType: models.PackType) => {
		try {
			return await provider.call("pistols", {
				contractName: "pack_token",
				entrypoint: "can_purchase",
				calldata: [recipient, packType],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const pack_token_calcMintFee = async (recipient: string, packType: models.PackType) => {
		try {
			return await provider.call("pistols", {
				contractName: "pack_token",
				entrypoint: "calc_mint_fee",
				calldata: [recipient, packType],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const pack_token_claimWelcomePack = async (snAccount: Account | AccountInterface) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "pack_token",
					entrypoint: "claim_welcome_pack",
					calldata: [],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const pack_token_purchase = async (snAccount: Account | AccountInterface, packType: models.PackType) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "pack_token",
					entrypoint: "purchase",
					calldata: [packType],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const pack_token_open = async (snAccount: Account | AccountInterface, packId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "pack_token",
					entrypoint: "open",
					calldata: [packId],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_balanceOf = async (account: string) => {
		try {
			return await provider.call("pistols", {
				contractName: "duelist_token",
				entrypoint: "balance_of",
				calldata: [account],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_ownerOf = async (tokenId: U256) => {
		try {
			return await provider.call("pistols", {
				contractName: "duelist_token",
				entrypoint: "owner_of",
				calldata: [tokenId],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_safeTransferFrom = async (snAccount: Account | AccountInterface, from: string, to: string, tokenId: U256, data: Array<BigNumberish>) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duelist_token",
					entrypoint: "safe_transfer_from",
					calldata: [from, to, tokenId, data],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_transferFrom = async (snAccount: Account | AccountInterface, from: string, to: string, tokenId: U256) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duelist_token",
					entrypoint: "transfer_from",
					calldata: [from, to, tokenId],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_approve = async (snAccount: Account | AccountInterface, to: string, tokenId: U256) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duelist_token",
					entrypoint: "approve",
					calldata: [to, tokenId],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_setApprovalForAll = async (snAccount: Account | AccountInterface, operator: string, approved: boolean) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duelist_token",
					entrypoint: "set_approval_for_all",
					calldata: [operator, approved],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_getApproved = async (tokenId: U256) => {
		try {
			return await provider.call("pistols", {
				contractName: "duelist_token",
				entrypoint: "get_approved",
				calldata: [tokenId],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_isApprovedForAll = async (owner: string, operator: string) => {
		try {
			return await provider.call("pistols", {
				contractName: "duelist_token",
				entrypoint: "is_approved_for_all",
				calldata: [owner, operator],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_supportsInterface = async (interfaceId: BigNumberish) => {
		try {
			return await provider.call("pistols", {
				contractName: "duelist_token",
				entrypoint: "supports_interface",
				calldata: [interfaceId],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_name = async () => {
		try {
			return await provider.call("pistols", {
				contractName: "duelist_token",
				entrypoint: "name",
				calldata: [],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_symbol = async () => {
		try {
			return await provider.call("pistols", {
				contractName: "duelist_token",
				entrypoint: "symbol",
				calldata: [],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_tokenUri = async (tokenId: U256) => {
		try {
			return await provider.call("pistols", {
				contractName: "duelist_token",
				entrypoint: "token_uri",
				calldata: [tokenId],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_canMint = async (recipient: string) => {
		try {
			return await provider.call("pistols", {
				contractName: "duelist_token",
				entrypoint: "can_mint",
				calldata: [recipient],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_exists = async (tokenId: BigNumberish) => {
		try {
			return await provider.call("pistols", {
				contractName: "duelist_token",
				entrypoint: "exists",
				calldata: [tokenId],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_isOwnerOf = async (address: string, tokenId: BigNumberish) => {
		try {
			return await provider.call("pistols", {
				contractName: "duelist_token",
				entrypoint: "is_owner_of",
				calldata: [address, tokenId],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_isAlive = async (duelistId: BigNumberish) => {
		try {
			return await provider.call("pistols", {
				contractName: "duelist_token",
				entrypoint: "is_alive",
				calldata: [duelistId],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_calcFameReward = async (duelistId: BigNumberish) => {
		try {
			return await provider.call("pistols", {
				contractName: "duelist_token",
				entrypoint: "calc_fame_reward",
				calldata: [duelistId],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_mintDuelists = async (snAccount: Account | AccountInterface, recipient: string, amount: BigNumberish, seed: BigNumberish, profileType: models.ProfileType) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duelist_token",
					entrypoint: "mint_duelists",
					calldata: [recipient, amount, seed, profileType],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_transferFameReward = async (snAccount: Account | AccountInterface, duelId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duelist_token",
					entrypoint: "transfer_fame_reward",
					calldata: [duelId],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_getTokenName = async (tokenId: U256) => {
		try {
			return await provider.call("pistols", {
				contractName: "duelist_token",
				entrypoint: "get_token_name",
				calldata: [tokenId],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_getTokenDescription = async (tokenId: U256) => {
		try {
			return await provider.call("pistols", {
				contractName: "duelist_token",
				entrypoint: "get_token_description",
				calldata: [tokenId],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_getTokenImage = async (tokenId: U256) => {
		try {
			return await provider.call("pistols", {
				contractName: "duelist_token",
				entrypoint: "get_token_image",
				calldata: [tokenId],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_getAttributePairs = async (tokenId: U256) => {
		try {
			return await provider.call("pistols", {
				contractName: "duelist_token",
				entrypoint: "get_attribute_pairs",
				calldata: [tokenId],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const duelist_token_getMetadataPairs = async (tokenId: U256) => {
		try {
			return await provider.call("pistols", {
				contractName: "duelist_token",
				entrypoint: "get_metadata_pairs",
				calldata: [tokenId],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const fame_coin_totalSupply = async () => {
		try {
			return await provider.call("pistols", {
				contractName: "fame_coin",
				entrypoint: "total_supply",
				calldata: [],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const fame_coin_balanceOf = async (account: string) => {
		try {
			return await provider.call("pistols", {
				contractName: "fame_coin",
				entrypoint: "balance_of",
				calldata: [account],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const fame_coin_allowance = async (owner: string, spender: string) => {
		try {
			return await provider.call("pistols", {
				contractName: "fame_coin",
				entrypoint: "allowance",
				calldata: [owner, spender],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const fame_coin_transfer = async (snAccount: Account | AccountInterface, recipient: string, amount: U256) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "fame_coin",
					entrypoint: "transfer",
					calldata: [recipient, amount],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const fame_coin_transferFrom = async (snAccount: Account | AccountInterface, sender: string, recipient: string, amount: U256) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "fame_coin",
					entrypoint: "transfer_from",
					calldata: [sender, recipient, amount],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const fame_coin_approve = async (snAccount: Account | AccountInterface, spender: string, amount: U256) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "fame_coin",
					entrypoint: "approve",
					calldata: [spender, amount],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const fame_coin_name = async () => {
		try {
			return await provider.call("pistols", {
				contractName: "fame_coin",
				entrypoint: "name",
				calldata: [],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const fame_coin_symbol = async () => {
		try {
			return await provider.call("pistols", {
				contractName: "fame_coin",
				entrypoint: "symbol",
				calldata: [],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const fame_coin_decimals = async () => {
		try {
			return await provider.call("pistols", {
				contractName: "fame_coin",
				entrypoint: "decimals",
				calldata: [],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const fame_coin_addressOfToken = async (contractAddress: string, tokenId: BigNumberish) => {
		try {
			return await provider.call("pistols", {
				contractName: "fame_coin",
				entrypoint: "address_of_token",
				calldata: [contractAddress, tokenId],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const fame_coin_tokenOfAddress = async (address: string) => {
		try {
			return await provider.call("pistols", {
				contractName: "fame_coin",
				entrypoint: "token_of_address",
				calldata: [address],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const fame_coin_balanceOfToken = async (contractAddress: string, tokenId: BigNumberish) => {
		try {
			return await provider.call("pistols", {
				contractName: "fame_coin",
				entrypoint: "balance_of_token",
				calldata: [contractAddress, tokenId],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const fame_coin_transferFromToken = async (snAccount: Account | AccountInterface, contractAddress: string, senderTokenId: BigNumberish, recipientTokenId: BigNumberish, amount: U256) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "fame_coin",
					entrypoint: "transfer_from_token",
					calldata: [contractAddress, senderTokenId, recipientTokenId, amount],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const fame_coin_burnFromToken = async (snAccount: Account | AccountInterface, contractAddress: string, tokenId: BigNumberish, amount: U256) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "fame_coin",
					entrypoint: "burn_from_token",
					calldata: [contractAddress, tokenId, amount],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const fame_coin_mintedDuelist = async (snAccount: Account | AccountInterface, duelistId: BigNumberish, amountPaid: U256) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "fame_coin",
					entrypoint: "minted_duelist",
					calldata: [duelistId, amountPaid],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const fame_coin_updatedDuelist = async (snAccount: Account | AccountInterface, from: string, to: string, duelistId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "fame_coin",
					entrypoint: "updated_duelist",
					calldata: [from, to, duelistId],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const vrf_mock_requestRandom = async (caller: string, source: models.Source) => {
		try {
			return await provider.call("pistols", {
				contractName: "vrf_mock",
				entrypoint: "request_random",
				calldata: [caller, source],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const vrf_mock_consumeRandom = async (snAccount: Account | AccountInterface, source: models.Source) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "vrf_mock",
					entrypoint: "consume_random",
					calldata: [source],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_canMint = async (recipient: string) => {
		try {
			return await provider.call("pistols", {
				contractName: "duel_token",
				entrypoint: "can_mint",
				calldata: [recipient],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_exists = async (tokenId: BigNumberish) => {
		try {
			return await provider.call("pistols", {
				contractName: "duel_token",
				entrypoint: "exists",
				calldata: [tokenId],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_isOwnerOf = async (address: string, tokenId: BigNumberish) => {
		try {
			return await provider.call("pistols", {
				contractName: "duel_token",
				entrypoint: "is_owner_of",
				calldata: [address, tokenId],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_calcMintFee = async (tableId: BigNumberish) => {
		try {
			return await provider.call("pistols", {
				contractName: "duel_token",
				entrypoint: "calc_mint_fee",
				calldata: [tableId],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_getPact = async (tableId: BigNumberish, duelistIdA: BigNumberish, duelistIdB: BigNumberish) => {
		try {
			return await provider.call("pistols", {
				contractName: "duel_token",
				entrypoint: "get_pact",
				calldata: [tableId, duelistIdA, duelistIdB],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_hasPact = async (tableId: BigNumberish, duelistIdA: BigNumberish, duelistIdB: BigNumberish) => {
		try {
			return await provider.call("pistols", {
				contractName: "duel_token",
				entrypoint: "has_pact",
				calldata: [tableId, duelistIdA, duelistIdB],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_canJoin = async (tableId: BigNumberish, duelistId: BigNumberish) => {
		try {
			return await provider.call("pistols", {
				contractName: "duel_token",
				entrypoint: "can_join",
				calldata: [tableId, duelistId],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_createDuel = async (snAccount: Account | AccountInterface, duelistId: BigNumberish, challengedIdOrAddress: string, premise: models.Premise, quote: BigNumberish, tableId: BigNumberish, expireHours: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duel_token",
					entrypoint: "create_duel",
					calldata: [duelistId, challengedIdOrAddress, premise, quote, tableId, expireHours],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_replyDuel = async (snAccount: Account | AccountInterface, duelistId: BigNumberish, duelId: BigNumberish, accepted: boolean) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duel_token",
					entrypoint: "reply_duel",
					calldata: [duelistId, duelId, accepted],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_transferToWinner = async (snAccount: Account | AccountInterface, duelId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duel_token",
					entrypoint: "transfer_to_winner",
					calldata: [duelId],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_balanceOf = async (account: string) => {
		try {
			return await provider.call("pistols", {
				contractName: "duel_token",
				entrypoint: "balance_of",
				calldata: [account],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_ownerOf = async (tokenId: U256) => {
		try {
			return await provider.call("pistols", {
				contractName: "duel_token",
				entrypoint: "owner_of",
				calldata: [tokenId],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_safeTransferFrom = async (snAccount: Account | AccountInterface, from: string, to: string, tokenId: U256, data: Array<BigNumberish>) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duel_token",
					entrypoint: "safe_transfer_from",
					calldata: [from, to, tokenId, data],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_transferFrom = async (snAccount: Account | AccountInterface, from: string, to: string, tokenId: U256) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duel_token",
					entrypoint: "transfer_from",
					calldata: [from, to, tokenId],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_approve = async (snAccount: Account | AccountInterface, to: string, tokenId: U256) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duel_token",
					entrypoint: "approve",
					calldata: [to, tokenId],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_setApprovalForAll = async (snAccount: Account | AccountInterface, operator: string, approved: boolean) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "duel_token",
					entrypoint: "set_approval_for_all",
					calldata: [operator, approved],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_getApproved = async (tokenId: U256) => {
		try {
			return await provider.call("pistols", {
				contractName: "duel_token",
				entrypoint: "get_approved",
				calldata: [tokenId],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_isApprovedForAll = async (owner: string, operator: string) => {
		try {
			return await provider.call("pistols", {
				contractName: "duel_token",
				entrypoint: "is_approved_for_all",
				calldata: [owner, operator],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_supportsInterface = async (interfaceId: BigNumberish) => {
		try {
			return await provider.call("pistols", {
				contractName: "duel_token",
				entrypoint: "supports_interface",
				calldata: [interfaceId],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_name = async () => {
		try {
			return await provider.call("pistols", {
				contractName: "duel_token",
				entrypoint: "name",
				calldata: [],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_symbol = async () => {
		try {
			return await provider.call("pistols", {
				contractName: "duel_token",
				entrypoint: "symbol",
				calldata: [],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_tokenUri = async (tokenId: U256) => {
		try {
			return await provider.call("pistols", {
				contractName: "duel_token",
				entrypoint: "token_uri",
				calldata: [tokenId],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_getTokenName = async (tokenId: U256) => {
		try {
			return await provider.call("pistols", {
				contractName: "duel_token",
				entrypoint: "get_token_name",
				calldata: [tokenId],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_getTokenDescription = async (tokenId: U256) => {
		try {
			return await provider.call("pistols", {
				contractName: "duel_token",
				entrypoint: "get_token_description",
				calldata: [tokenId],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_getTokenImage = async (tokenId: U256) => {
		try {
			return await provider.call("pistols", {
				contractName: "duel_token",
				entrypoint: "get_token_image",
				calldata: [tokenId],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_getAttributePairs = async (tokenId: U256) => {
		try {
			return await provider.call("pistols", {
				contractName: "duel_token",
				entrypoint: "get_attribute_pairs",
				calldata: [tokenId],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const duel_token_getMetadataPairs = async (tokenId: U256) => {
		try {
			return await provider.call("pistols", {
				contractName: "duel_token",
				entrypoint: "get_metadata_pairs",
				calldata: [tokenId],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const bank_charge = async (snAccount: Account | AccountInterface, payer: string, payment: models.Payment) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "bank",
					entrypoint: "charge",
					calldata: [payer, payment],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const lords_mock_faucet = async (snAccount: Account | AccountInterface) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "lords_mock",
					entrypoint: "faucet",
					calldata: [],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const lords_mock_mint = async (snAccount: Account | AccountInterface, recipient: string, amount: U256) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "lords_mock",
					entrypoint: "mint",
					calldata: [recipient, amount],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const lords_mock_totalSupply = async () => {
		try {
			return await provider.call("pistols", {
				contractName: "lords_mock",
				entrypoint: "total_supply",
				calldata: [],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const lords_mock_balanceOf = async (account: string) => {
		try {
			return await provider.call("pistols", {
				contractName: "lords_mock",
				entrypoint: "balance_of",
				calldata: [account],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const lords_mock_allowance = async (owner: string, spender: string) => {
		try {
			return await provider.call("pistols", {
				contractName: "lords_mock",
				entrypoint: "allowance",
				calldata: [owner, spender],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const lords_mock_transfer = async (snAccount: Account | AccountInterface, recipient: string, amount: U256) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "lords_mock",
					entrypoint: "transfer",
					calldata: [recipient, amount],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const lords_mock_transferFrom = async (snAccount: Account | AccountInterface, sender: string, recipient: string, amount: U256) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "lords_mock",
					entrypoint: "transfer_from",
					calldata: [sender, recipient, amount],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const lords_mock_approve = async (snAccount: Account | AccountInterface, spender: string, amount: U256) => {
		try {
			return await provider.execute(
				snAccount,
				{
					contractName: "lords_mock",
					entrypoint: "approve",
					calldata: [spender, amount],
				},
				"pistols",
			);
		} catch (error) {
			console.error(error);
		}
	};

	const lords_mock_name = async () => {
		try {
			return await provider.call("pistols", {
				contractName: "lords_mock",
				entrypoint: "name",
				calldata: [],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const lords_mock_symbol = async () => {
		try {
			return await provider.call("pistols", {
				contractName: "lords_mock",
				entrypoint: "symbol",
				calldata: [],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const lords_mock_decimals = async () => {
		try {
			return await provider.call("pistols", {
				contractName: "lords_mock",
				entrypoint: "decimals",
				calldata: [],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const rng_reseed = async (seed: BigNumberish, salt: BigNumberish) => {
		try {
			return await provider.call("pistols", {
				contractName: "rng",
				entrypoint: "reseed",
				calldata: [seed, salt],
			});
		} catch (error) {
			console.error(error);
		}
	};

	const rng_newShuffler = async (shuffleSize: BigNumberish) => {
		try {
			return await provider.call("pistols", {
				contractName: "rng",
				entrypoint: "new_shuffler",
				calldata: [shuffleSize],
			});
		} catch (error) {
			console.error(error);
		}
	};

	return {
		admin: {
			amIAdmin: admin_amIAdmin,
			grantAdmin: admin_grantAdmin,
			setTreasury: admin_setTreasury,
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
		pack_token: {
			getTokenName: pack_token_getTokenName,
			getTokenDescription: pack_token_getTokenDescription,
			getTokenImage: pack_token_getTokenImage,
			getAttributePairs: pack_token_getAttributePairs,
			getMetadataPairs: pack_token_getMetadataPairs,
			balanceOf: pack_token_balanceOf,
			ownerOf: pack_token_ownerOf,
			safeTransferFrom: pack_token_safeTransferFrom,
			transferFrom: pack_token_transferFrom,
			approve: pack_token_approve,
			setApprovalForAll: pack_token_setApprovalForAll,
			getApproved: pack_token_getApproved,
			isApprovedForAll: pack_token_isApprovedForAll,
			supportsInterface: pack_token_supportsInterface,
			name: pack_token_name,
			symbol: pack_token_symbol,
			tokenUri: pack_token_tokenUri,
			canMint: pack_token_canMint,
			exists: pack_token_exists,
			isOwnerOf: pack_token_isOwnerOf,
			canClaimWelcomePack: pack_token_canClaimWelcomePack,
			canPurchase: pack_token_canPurchase,
			calcMintFee: pack_token_calcMintFee,
			claimWelcomePack: pack_token_claimWelcomePack,
			purchase: pack_token_purchase,
			open: pack_token_open,
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
			canMint: duelist_token_canMint,
			exists: duelist_token_exists,
			isOwnerOf: duelist_token_isOwnerOf,
			isAlive: duelist_token_isAlive,
			calcFameReward: duelist_token_calcFameReward,
			mintDuelists: duelist_token_mintDuelists,
			transferFameReward: duelist_token_transferFameReward,
			getTokenName: duelist_token_getTokenName,
			getTokenDescription: duelist_token_getTokenDescription,
			getTokenImage: duelist_token_getTokenImage,
			getAttributePairs: duelist_token_getAttributePairs,
			getMetadataPairs: duelist_token_getMetadataPairs,
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
			addressOfToken: fame_coin_addressOfToken,
			tokenOfAddress: fame_coin_tokenOfAddress,
			balanceOfToken: fame_coin_balanceOfToken,
			transferFromToken: fame_coin_transferFromToken,
			burnFromToken: fame_coin_burnFromToken,
			mintedDuelist: fame_coin_mintedDuelist,
			updatedDuelist: fame_coin_updatedDuelist,
		},
		vrf_mock: {
			requestRandom: vrf_mock_requestRandom,
			consumeRandom: vrf_mock_consumeRandom,
		},
		duel_token: {
			canMint: duel_token_canMint,
			exists: duel_token_exists,
			isOwnerOf: duel_token_isOwnerOf,
			calcMintFee: duel_token_calcMintFee,
			getPact: duel_token_getPact,
			hasPact: duel_token_hasPact,
			canJoin: duel_token_canJoin,
			createDuel: duel_token_createDuel,
			replyDuel: duel_token_replyDuel,
			transferToWinner: duel_token_transferToWinner,
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
			getTokenName: duel_token_getTokenName,
			getTokenDescription: duel_token_getTokenDescription,
			getTokenImage: duel_token_getTokenImage,
			getAttributePairs: duel_token_getAttributePairs,
			getMetadataPairs: duel_token_getMetadataPairs,
		},
		bank: {
			charge: bank_charge,
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
		},
		rng: {
			reseed: rng_reseed,
			newShuffler: rng_newShuffler,
		},
	};
}