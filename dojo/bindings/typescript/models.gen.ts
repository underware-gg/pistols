import type { SchemaType } from "@dojoengine/sdk";

import type { BigNumberish } from 'starknet';
// Type definition for `pistols::models::challenge::Challenge` struct
export interface Challenge {
	fieldOrder: string[];
	duel_id: BigNumberish;
	table_id: BigNumberish;
	premise: Premise;
	quote: BigNumberish;
	address_a: string;
	address_b: string;
	duelist_id_a: BigNumberish;
	duelist_id_b: BigNumberish;
	state: ChallengeState;
	winner: BigNumberish;
	timestamp_start: BigNumberish;
	timestamp_end: BigNumberish;
}

// Type definition for `pistols::models::challenge::ChallengeValue` struct
export interface ChallengeValue {
	fieldOrder: string[];
	table_id: BigNumberish;
	premise: Premise;
	quote: BigNumberish;
	address_a: string;
	address_b: string;
	duelist_id_a: BigNumberish;
	duelist_id_b: BigNumberish;
	state: ChallengeState;
	winner: BigNumberish;
	timestamp_start: BigNumberish;
	timestamp_end: BigNumberish;
}

// Type definition for `pistols::models::challenge::ChallengeFameBalanceValue` struct
export interface ChallengeFameBalanceValue {
	fieldOrder: string[];
	balance_a: BigNumberish;
	balance_b: BigNumberish;
}

// Type definition for `pistols::models::challenge::ChallengeFameBalance` struct
export interface ChallengeFameBalance {
	fieldOrder: string[];
	duel_id: BigNumberish;
	balance_a: BigNumberish;
	balance_b: BigNumberish;
}

// Type definition for `pistols::models::config::CoinConfigValue` struct
export interface CoinConfigValue {
	fieldOrder: string[];
	minter_address: string;
	faucet_amount: BigNumberish;
}

// Type definition for `pistols::models::config::CoinConfig` struct
export interface CoinConfig {
	fieldOrder: string[];
	coin_address: string;
	minter_address: string;
	faucet_amount: BigNumberish;
}

// Type definition for `pistols::models::config::Config` struct
export interface Config {
	fieldOrder: string[];
	key: BigNumberish;
	treasury_address: string;
	lords_address: string;
	vrf_address: string;
	is_paused: boolean;
}

// Type definition for `pistols::models::config::ConfigValue` struct
export interface ConfigValue {
	fieldOrder: string[];
	treasury_address: string;
	lords_address: string;
	vrf_address: string;
	is_paused: boolean;
}

// Type definition for `pistols::models::duelist::Score` struct
export interface Score {
	fieldOrder: string[];
	honour: BigNumberish;
	total_duels: BigNumberish;
	total_wins: BigNumberish;
	total_losses: BigNumberish;
	total_draws: BigNumberish;
	honour_history: BigNumberish;
}

// Type definition for `pistols::models::duelist::Duelist` struct
export interface Duelist {
	fieldOrder: string[];
	duelist_id: BigNumberish;
	name: BigNumberish;
	profile_pic_type: ProfilePicType;
	profile_pic_uri: string;
	timestamp: BigNumberish;
	score: Score;
}

// Type definition for `pistols::models::duelist::DuelistValue` struct
export interface DuelistValue {
	fieldOrder: string[];
	name: BigNumberish;
	profile_pic_type: ProfilePicType;
	profile_pic_uri: string;
	timestamp: BigNumberish;
	score: Score;
}

// Type definition for `pistols::models::duelist::PactValue` struct
export interface PactValue {
	fieldOrder: string[];
	duel_id: BigNumberish;
}

// Type definition for `pistols::models::duelist::Pact` struct
export interface Pact {
	fieldOrder: string[];
	table_id: BigNumberish;
	pair: BigNumberish;
	duel_id: BigNumberish;
}

// Type definition for `pistols::models::payment::Payment` struct
export interface Payment {
	fieldOrder: string[];
	key: BigNumberish;
	amount: BigNumberish;
	client_percent: BigNumberish;
	ranking_percent: BigNumberish;
	owner_percent: BigNumberish;
	pool_percent: BigNumberish;
	treasury_percent: BigNumberish;
}

// Type definition for `pistols::models::payment::PaymentValue` struct
export interface PaymentValue {
	fieldOrder: string[];
	amount: BigNumberish;
	client_percent: BigNumberish;
	ranking_percent: BigNumberish;
	owner_percent: BigNumberish;
	pool_percent: BigNumberish;
	treasury_percent: BigNumberish;
}

// Type definition for `pistols::models::challenge::RoundValue` struct
export interface RoundValue {
	fieldOrder: string[];
	moves_a: Moves;
	moves_b: Moves;
	state_a: DuelistState;
	state_b: DuelistState;
	state: RoundState;
	final_blow: BigNumberish;
}

// Type definition for `pistols::models::challenge::DuelistState` struct
export interface DuelistState {
	fieldOrder: string[];
	chances: BigNumberish;
	damage: BigNumberish;
	health: BigNumberish;
	dice_fire: BigNumberish;
	honour: BigNumberish;
}

// Type definition for `pistols::models::challenge::Round` struct
export interface Round {
	fieldOrder: string[];
	duel_id: BigNumberish;
	moves_a: Moves;
	moves_b: Moves;
	state_a: DuelistState;
	state_b: DuelistState;
	state: RoundState;
	final_blow: BigNumberish;
}

// Type definition for `pistols::models::challenge::Moves` struct
export interface Moves {
	fieldOrder: string[];
	seed: BigNumberish;
	salt: BigNumberish;
	hashed: BigNumberish;
	card_1: BigNumberish;
	card_2: BigNumberish;
	card_3: BigNumberish;
	card_4: BigNumberish;
}

// Type definition for `pistols::models::duelist::ScoreboardValue` struct
export interface ScoreboardValue {
	fieldOrder: string[];
	score: Score;
}

// Type definition for `pistols::models::duelist::Score` struct
export interface Score {
	fieldOrder: string[];
	honour: BigNumberish;
	total_duels: BigNumberish;
	total_wins: BigNumberish;
	total_losses: BigNumberish;
	total_draws: BigNumberish;
	honour_history: BigNumberish;
}

// Type definition for `pistols::models::duelist::Scoreboard` struct
export interface Scoreboard {
	fieldOrder: string[];
	table_id: BigNumberish;
	duelist_id: BigNumberish;
	score: Score;
}

// Type definition for `pistols::models::table::TableAdmittance` struct
export interface TableAdmittance {
	fieldOrder: string[];
	table_id: BigNumberish;
	accounts: Array<string>;
	duelists: Array<BigNumberish>;
}

// Type definition for `pistols::models::table::TableAdmittanceValue` struct
export interface TableAdmittanceValue {
	fieldOrder: string[];
	accounts: Array<string>;
	duelists: Array<BigNumberish>;
}

// Type definition for `pistols::models::table::TableConfig` struct
export interface TableConfig {
	fieldOrder: string[];
	table_id: BigNumberish;
	description: BigNumberish;
	table_type: TableType;
	deck_type: DeckType;
	fee_collector_address: string;
	fee_min: BigNumberish;
	is_open: boolean;
}

// Type definition for `pistols::models::table::TableConfigValue` struct
export interface TableConfigValue {
	fieldOrder: string[];
	description: BigNumberish;
	table_type: TableType;
	deck_type: DeckType;
	fee_collector_address: string;
	fee_min: BigNumberish;
	is_open: boolean;
}

// Type definition for `pistols::systems::components::token_bound::TokenBoundAddress` struct
export interface TokenBoundAddress {
	fieldOrder: string[];
	recipient: string;
	contract_address: string;
	token_id: BigNumberish;
}

// Type definition for `pistols::systems::components::token_bound::TokenBoundAddressValue` struct
export interface TokenBoundAddressValue {
	fieldOrder: string[];
	contract_address: string;
	token_id: BigNumberish;
}

// Type definition for `pistols::models::config::TokenConfigValue` struct
export interface TokenConfigValue {
	fieldOrder: string[];
	minter_address: string;
	renderer_address: string;
	minted_count: BigNumberish;
}

// Type definition for `pistols::models::config::TokenConfig` struct
export interface TokenConfig {
	fieldOrder: string[];
	token_address: string;
	minter_address: string;
	renderer_address: string;
	minted_count: BigNumberish;
}

// Type definition for `pistols::types::challenge_state::ChallengeState` enum
export enum ChallengeState {
	Null,
	Awaiting,
	Withdrawn,
	Refused,
	Expired,
	InProgress,
	Resolved,
	Draw,
}

// Type definition for `pistols::types::premise::Premise` enum
export enum Premise {
	Null,
	Matter,
	Debt,
	Dispute,
	Honour,
	Hatred,
	Blood,
	Nothing,
	Tournament,
}

// Type definition for `pistols::models::duelist::ProfilePicType` enum
export enum ProfilePicType {
	Undefined,
	Duelist,
	External,
}

// Type definition for `pistols::types::round_state::RoundState` enum
export enum RoundState {
	Null,
	Commit,
	Reveal,
	Finished,
}

// Type definition for `pistols::models::table::TableType` enum
export enum TableType {
	Undefined,
	Classic,
	Tournament,
	IRLTournament,
}

// Type definition for `pistols::types::cards::hand::DeckType` enum
export enum DeckType {
	None,
	Classic,
}

export interface PistolsSchemaType extends SchemaType {
	pistols: {
		Challenge: Challenge,
		ChallengeValue: ChallengeValue,
		ChallengeFameBalanceValue: ChallengeFameBalanceValue,
		ChallengeFameBalance: ChallengeFameBalance,
		CoinConfigValue: CoinConfigValue,
		CoinConfig: CoinConfig,
		Config: Config,
		ConfigValue: ConfigValue,
		Score: Score,
		Duelist: Duelist,
		DuelistValue: DuelistValue,
		PactValue: PactValue,
		Pact: Pact,
		Payment: Payment,
		PaymentValue: PaymentValue,
		RoundValue: RoundValue,
		DuelistState: DuelistState,
		Round: Round,
		Moves: Moves,
		ScoreboardValue: ScoreboardValue,
		Scoreboard: Scoreboard,
		TableAdmittance: TableAdmittance,
		TableAdmittanceValue: TableAdmittanceValue,
		TableConfig: TableConfig,
		TableConfigValue: TableConfigValue,
		TokenBoundAddress: TokenBoundAddress,
		TokenBoundAddressValue: TokenBoundAddressValue,
		TokenConfigValue: TokenConfigValue,
		TokenConfig: TokenConfig,
		ERC__Balance: ERC__Balance,
		ERC__Token: ERC__Token,
		ERC__Transfer: ERC__Transfer,
	},
}
export const schema: PistolsSchemaType = {
	pistols: {
		Challenge: {
			fieldOrder: ['duel_id', 'table_id', 'premise', 'quote', 'address_a', 'address_b', 'duelist_id_a', 'duelist_id_b', 'state', 'winner', 'timestamp_start', 'timestamp_end'],
			duel_id: 0,
			table_id: 0,
			premise: Premise.Null,
			quote: 0,
			address_a: "",
			address_b: "",
			duelist_id_a: 0,
			duelist_id_b: 0,
			state: ChallengeState.Null,
			winner: 0,
			timestamp_start: 0,
			timestamp_end: 0,
		},
		ChallengeValue: {
			fieldOrder: ['table_id', 'premise', 'quote', 'address_a', 'address_b', 'duelist_id_a', 'duelist_id_b', 'state', 'winner', 'timestamp_start', 'timestamp_end'],
			table_id: 0,
			premise: Premise.Null,
			quote: 0,
			address_a: "",
			address_b: "",
			duelist_id_a: 0,
			duelist_id_b: 0,
			state: ChallengeState.Null,
			winner: 0,
			timestamp_start: 0,
			timestamp_end: 0,
		},
		ChallengeFameBalanceValue: {
			fieldOrder: ['balance_a', 'balance_b'],
			balance_a: 0,
			balance_b: 0,
		},
		ChallengeFameBalance: {
			fieldOrder: ['duel_id', 'balance_a', 'balance_b'],
			duel_id: 0,
			balance_a: 0,
			balance_b: 0,
		},
		CoinConfigValue: {
			fieldOrder: ['minter_address', 'faucet_amount'],
			minter_address: "",
			faucet_amount: 0,
		},
		CoinConfig: {
			fieldOrder: ['coin_address', 'minter_address', 'faucet_amount'],
			coin_address: "",
			minter_address: "",
			faucet_amount: 0,
		},
		Config: {
			fieldOrder: ['key', 'treasury_address', 'lords_address', 'vrf_address', 'is_paused'],
			key: 0,
			treasury_address: "",
			lords_address: "",
			vrf_address: "",
			is_paused: false,
		},
		ConfigValue: {
			fieldOrder: ['treasury_address', 'lords_address', 'vrf_address', 'is_paused'],
			treasury_address: "",
			lords_address: "",
			vrf_address: "",
			is_paused: false,
		},
		Score: {
			fieldOrder: ['honour', 'total_duels', 'total_wins', 'total_losses', 'total_draws', 'honour_history'],
			honour: 0,
			total_duels: 0,
			total_wins: 0,
			total_losses: 0,
			total_draws: 0,
			honour_history: 0,
		},
		Duelist: {
			fieldOrder: ['duelist_id', 'name', 'profile_pic_type', 'profile_pic_uri', 'timestamp', 'score'],
			duelist_id: 0,
			name: 0,
			profile_pic_type: ProfilePicType.Undefined,
			profile_pic_uri: "",
			timestamp: 0,
			score: { fieldOrder: ['honour', 'total_duels', 'total_wins', 'total_losses', 'total_draws', 'honour_history'], honour: 0, total_duels: 0, total_wins: 0, total_losses: 0, total_draws: 0, honour_history: 0, },
		},
		DuelistValue: {
			fieldOrder: ['name', 'profile_pic_type', 'profile_pic_uri', 'timestamp', 'score'],
			name: 0,
			profile_pic_type: ProfilePicType.Undefined,
			profile_pic_uri: "",
			timestamp: 0,
			score: { fieldOrder: ['honour', 'total_duels', 'total_wins', 'total_losses', 'total_draws', 'honour_history'], honour: 0, total_duels: 0, total_wins: 0, total_losses: 0, total_draws: 0, honour_history: 0, },
		},
		PactValue: {
			fieldOrder: ['duel_id'],
			duel_id: 0,
		},
		Pact: {
			fieldOrder: ['table_id', 'pair', 'duel_id'],
			table_id: 0,
			pair: 0,
			duel_id: 0,
		},
		Payment: {
			fieldOrder: ['key', 'amount', 'client_percent', 'ranking_percent', 'owner_percent', 'pool_percent', 'treasury_percent'],
			key: 0,
			amount: 0,
			client_percent: 0,
			ranking_percent: 0,
			owner_percent: 0,
			pool_percent: 0,
			treasury_percent: 0,
		},
		PaymentValue: {
			fieldOrder: ['amount', 'client_percent', 'ranking_percent', 'owner_percent', 'pool_percent', 'treasury_percent'],
			amount: 0,
			client_percent: 0,
			ranking_percent: 0,
			owner_percent: 0,
			pool_percent: 0,
			treasury_percent: 0,
		},
		RoundValue: {
			fieldOrder: ['moves_a', 'moves_b', 'state_a', 'state_b', 'state', 'final_blow'],
			moves_a: { fieldOrder: ['seed', 'salt', 'hashed', 'card_1', 'card_2', 'card_3', 'card_4'], seed: 0, salt: 0, hashed: 0, card_1: 0, card_2: 0, card_3: 0, card_4: 0, },
			moves_b: { fieldOrder: ['seed', 'salt', 'hashed', 'card_1', 'card_2', 'card_3', 'card_4'], seed: 0, salt: 0, hashed: 0, card_1: 0, card_2: 0, card_3: 0, card_4: 0, },
			state_a: { fieldOrder: ['chances', 'damage', 'health', 'dice_fire', 'honour'], chances: 0, damage: 0, health: 0, dice_fire: 0, honour: 0, },
			state_b: { fieldOrder: ['chances', 'damage', 'health', 'dice_fire', 'honour'], chances: 0, damage: 0, health: 0, dice_fire: 0, honour: 0, },
			state: RoundState.Null,
			final_blow: 0,
		},
		DuelistState: {
			fieldOrder: ['chances', 'damage', 'health', 'dice_fire', 'honour'],
			chances: 0,
			damage: 0,
			health: 0,
			dice_fire: 0,
			honour: 0,
		},
		Round: {
			fieldOrder: ['duel_id', 'moves_a', 'moves_b', 'state_a', 'state_b', 'state', 'final_blow'],
			duel_id: 0,
			moves_a: { fieldOrder: ['seed', 'salt', 'hashed', 'card_1', 'card_2', 'card_3', 'card_4'], seed: 0, salt: 0, hashed: 0, card_1: 0, card_2: 0, card_3: 0, card_4: 0, },
			moves_b: { fieldOrder: ['seed', 'salt', 'hashed', 'card_1', 'card_2', 'card_3', 'card_4'], seed: 0, salt: 0, hashed: 0, card_1: 0, card_2: 0, card_3: 0, card_4: 0, },
			state_a: { fieldOrder: ['chances', 'damage', 'health', 'dice_fire', 'honour'], chances: 0, damage: 0, health: 0, dice_fire: 0, honour: 0, },
			state_b: { fieldOrder: ['chances', 'damage', 'health', 'dice_fire', 'honour'], chances: 0, damage: 0, health: 0, dice_fire: 0, honour: 0, },
			state: RoundState.Null,
			final_blow: 0,
		},
		Moves: {
			fieldOrder: ['seed', 'salt', 'hashed', 'card_1', 'card_2', 'card_3', 'card_4'],
			seed: 0,
			salt: 0,
			hashed: 0,
			card_1: 0,
			card_2: 0,
			card_3: 0,
			card_4: 0,
		},
		ScoreboardValue: {
			fieldOrder: ['score'],
			score: { fieldOrder: ['honour', 'total_duels', 'total_wins', 'total_losses', 'total_draws', 'honour_history'], honour: 0, total_duels: 0, total_wins: 0, total_losses: 0, total_draws: 0, honour_history: 0, },
		},
		Scoreboard: {
			fieldOrder: ['table_id', 'duelist_id', 'score'],
			table_id: 0,
			duelist_id: 0,
			score: { fieldOrder: ['honour', 'total_duels', 'total_wins', 'total_losses', 'total_draws', 'honour_history'], honour: 0, total_duels: 0, total_wins: 0, total_losses: 0, total_draws: 0, honour_history: 0, },
		},
		TableAdmittance: {
			fieldOrder: ['table_id', 'accounts', 'duelists'],
			table_id: 0,
			accounts: [""],
			duelists: [0],
		},
		TableAdmittanceValue: {
			fieldOrder: ['accounts', 'duelists'],
			accounts: [""],
			duelists: [0],
		},
		TableConfig: {
			fieldOrder: ['table_id', 'description', 'table_type', 'deck_type', 'fee_collector_address', 'fee_min', 'is_open'],
			table_id: 0,
			description: 0,
			table_type: TableType.Undefined,
			deck_type: DeckType.None,
			fee_collector_address: "",
			fee_min: 0,
			is_open: false,
		},
		TableConfigValue: {
			fieldOrder: ['description', 'table_type', 'deck_type', 'fee_collector_address', 'fee_min', 'is_open'],
			description: 0,
			table_type: TableType.Undefined,
			deck_type: DeckType.None,
			fee_collector_address: "",
			fee_min: 0,
			is_open: false,
		},
		TokenBoundAddress: {
			fieldOrder: ['recipient', 'contract_address', 'token_id'],
			recipient: "",
			contract_address: "",
			token_id: 0,
		},
		TokenBoundAddressValue: {
			fieldOrder: ['contract_address', 'token_id'],
			contract_address: "",
			token_id: 0,
		},
		TokenConfigValue: {
			fieldOrder: ['minter_address', 'renderer_address', 'minted_count'],
			minter_address: "",
			renderer_address: "",
			minted_count: 0,
		},
		TokenConfig: {
			fieldOrder: ['token_address', 'minter_address', 'renderer_address', 'minted_count'],
			token_address: "",
			minter_address: "",
			renderer_address: "",
			minted_count: 0,
		},
		ERC__Balance: {
			fieldOrder: ['balance', 'type', 'tokenmetadata'],
			balance: '',
			type: 'ERC20',
			tokenMetadata: {
				fieldOrder: ['name', 'symbol', 'tokenId', 'decimals', 'contractAddress'],
				name: '',
				symbol: '',
				tokenId: '',
				decimals: '',
				contractAddress: '',
			},
		},
		ERC__Token: {
			fieldOrder: ['name', 'symbol', 'tokenId', 'decimals', 'contractAddress'],
			name: '',
			symbol: '',
			tokenId: '',
			decimals: '',
			contractAddress: '',
		},
		ERC__Transfer: {
			fieldOrder: ['from', 'to', 'amount', 'type', 'executed', 'tokenMetadata'],
			from: '',
			to: '',
			amount: '',
			type: 'ERC20',
			executedAt: '',
			tokenMetadata: {
				fieldOrder: ['name', 'symbol', 'tokenId', 'decimals', 'contractAddress'],
				name: '',
				symbol: '',
				tokenId: '',
				decimals: '',
				contractAddress: '',
			},
			transactionHash: '',
		},

	},
};
// Type definition for ERC__Balance struct
export type ERC__Type = 'ERC20' | 'ERC721';
export interface ERC__Balance {
    fieldOrder: string[];
    balance: string;
    type: string;
    tokenMetadata: ERC__Token;
}
export interface ERC__Token {
    fieldOrder: string[];
    name: string;
    symbol: string;
    tokenId: string;
    decimals: string;
    contractAddress: string;
}
export interface ERC__Transfer {
    fieldOrder: string[];
    from: string;
    to: string;
    amount: string;
    type: string;
    executedAt: string;
    tokenMetadata: ERC__Token;
    transactionHash: string;
}