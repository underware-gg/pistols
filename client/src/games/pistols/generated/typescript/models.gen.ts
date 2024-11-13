import type { SchemaType } from "@dojoengine/sdk";

// Type definition for `pistols::models::challenge::Challenge` struct
export interface Challenge {
	fieldOrder: string[];
	duel_id: number;
	table_id: number;
	premise: Premise;
	quote: number;
	address_a: string;
	address_b: string;
	duelist_id_a: number;
	duelist_id_b: number;
	state: ChallengeState;
	winner: number;
	timestamp_start: number;
	timestamp_end: number;
}

// Type definition for `pistols::models::challenge::ChallengeValue` struct
export interface ChallengeValue {
	fieldOrder: string[];
	table_id: number;
	premise: Premise;
	quote: number;
	address_a: string;
	address_b: string;
	duelist_id_a: number;
	duelist_id_b: number;
	state: ChallengeState;
	winner: number;
	timestamp_start: number;
	timestamp_end: number;
}

// Type definition for `pistols::models::challenge::ChallengeFameBalance` struct
export interface ChallengeFameBalance {
	fieldOrder: string[];
	duel_id: number;
	balance_a: number;
  balance_b: number;
}

// Type definition for `pistols::models::challenge::ChallengeFameBalanceValue` struct
export interface ChallengeFameBalanceValue {
	fieldOrder: string[];
  balance_a: number;
  balance_b: number;
}

// Type definition for `pistols::models::config::CoinConfigValue` struct
export interface CoinConfigValue {
	fieldOrder: string[];
	minter_address: string;
	faucet_amount: number;
}

// Type definition for `pistols::models::config::CoinConfig` struct
export interface CoinConfig {
	fieldOrder: string[];
	coin_address: string;
	minter_address: string;
	faucet_amount: number;
}

// Type definition for `pistols::models::config::ConfigValue` struct
export interface ConfigValue {
	fieldOrder: string[];
	treasury_address: string;
	lords_address: string;
	vrf_address: string;
	is_paused: boolean;
}

// Type definition for `pistols::models::config::Config` struct
export interface Config {
	fieldOrder: string[];
	key: number;
	treasury_address: string;
	lords_address: string;
	vrf_address: string;
	is_paused: boolean;
}

// Type definition for `pistols::models::duelist::DuelistValue` struct
export interface DuelistValue {
	fieldOrder: string[];
	name: number;
	profile_pic_type: ProfilePicType;
	profile_pic_uri: string;
	timestamp: number;
	score: Score;
}

// Type definition for `pistols::models::duelist::Score` struct
export interface Score {
	fieldOrder: string[];
	honour: number;
	total_duels: number;
	total_wins: number;
	total_losses: number;
	total_draws: number;
	honour_history: number;
}

// Type definition for `pistols::models::duelist::Duelist` struct
export interface Duelist {
	fieldOrder: string[];
	duelist_id: number;
	name: number;
	profile_pic_type: ProfilePicType;
	profile_pic_uri: string;
	timestamp: number;
	score: Score;
}

// Type definition for `pistols::models::duelist::Pact` struct
export interface Pact {
	fieldOrder: string[];
	table_id: number;
	pair: number;
	duel_id: number;
}

// Type definition for `pistols::models::duelist::PactValue` struct
export interface PactValue {
	fieldOrder: string[];
	duel_id: number;
}

// Type definition for `pistols::models::payment::PaymentValue` struct
export interface PaymentValue {
	fieldOrder: string[];
	amount: number;
	client_percent: number;
	ranking_percent: number;
	owner_percent: number;
	pool_percent: number;
	treasury_percent: number;
}

// Type definition for `pistols::models::payment::Payment` struct
export interface Payment {
	fieldOrder: string[];
	key: number;
	amount: number;
	client_percent: number;
	ranking_percent: number;
	owner_percent: number;
	pool_percent: number;
	treasury_percent: number;
}

// Type definition for `pistols::models::challenge::RoundValue` struct
export interface RoundValue {
	fieldOrder: string[];
	moves_a: Moves;
	moves_b: Moves;
	state_a: DuelistState;
	state_b: DuelistState;
	state: RoundState;
	final_blow: number;
}

// Type definition for `pistols::models::challenge::Round` struct
export interface Round {
	fieldOrder: string[];
	duel_id: number;
	moves_a: Moves;
	moves_b: Moves;
	state_a: DuelistState;
	state_b: DuelistState;
	state: RoundState;
	final_blow: number;
}

// Type definition for `pistols::models::challenge::Moves` struct
export interface Moves {
	fieldOrder: string[];
	seed: number;
	salt: number;
	hashed: number;
	card_1: number;
	card_2: number;
	card_3: number;
	card_4: number;
}

// Type definition for `pistols::models::challenge::DuelistState` struct
export interface DuelistState {
	fieldOrder: string[];
	chances: number;
	damage: number;
	health: number;
	dice_fire: number;
	honour: number;
}

// Type definition for `pistols::models::duelist::Score` struct
export interface Score {
	fieldOrder: string[];
	honour: number;
	total_duels: number;
	total_wins: number;
	total_losses: number;
	total_draws: number;
	honour_history: number;
}

// Type definition for `pistols::models::duelist::ScoreboardValue` struct
export interface ScoreboardValue {
	fieldOrder: string[];
	score: Score;
}

// Type definition for `pistols::models::duelist::Scoreboard` struct
export interface Scoreboard {
	fieldOrder: string[];
	table_id: number;
	duelist_id: number;
	score: Score;
}

// Type definition for `pistols::models::table::TableAdmittance` struct
export interface TableAdmittance {
	fieldOrder: string[];
	table_id: number;
	accounts: Array<string>;
	duelists: Array<number>;
}

// Type definition for `pistols::models::table::TableAdmittanceValue` struct
export interface TableAdmittanceValue {
	fieldOrder: string[];
	accounts: Array<string>;
	duelists: Array<number>;
}

// Type definition for `pistols::models::table::TableConfigValue` struct
export interface TableConfigValue {
	fieldOrder: string[];
	description: number;
	table_type: TableType;
	deck_type: DeckType;
	fee_collector_address: string;
	fee_min: number;
	is_open: boolean;
}

// Type definition for `pistols::models::table::TableConfig` struct
export interface TableConfig {
	fieldOrder: string[];
	table_id: number;
	description: number;
	table_type: TableType;
	deck_type: DeckType;
	fee_collector_address: string;
	fee_min: number;
	is_open: boolean;
}

// Type definition for `pistols::systems::components::token_bound::TokenBoundAddressValue` struct
export interface TokenBoundAddressValue {
	fieldOrder: string[];
	contract_address: string;
	token_id: number;
}

// Type definition for `pistols::systems::components::token_bound::TokenBoundAddress` struct
export interface TokenBoundAddress {
	fieldOrder: string[];
	recipient: string;
	contract_address: string;
	token_id: number;
}

// Type definition for `pistols::models::config::TokenConfigValue` struct
export interface TokenConfigValue {
	fieldOrder: string[];
	minter_address: string;
	renderer_address: string;
	minted_count: number;
}

// Type definition for `pistols::models::config::TokenConfig` struct
export interface TokenConfig {
	fieldOrder: string[];
	token_address: string;
	minter_address: string;
	renderer_address: string;
	minted_count: number;
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
		ChallengeFameBalance: ChallengeFameBalance,
		ChallengeFameBalanceValue: ChallengeFameBalanceValue,
		CoinConfigValue: CoinConfigValue,
		CoinConfig: CoinConfig,
		ConfigValue: ConfigValue,
		Config: Config,
		DuelistValue: DuelistValue,
		Score: Score,
		Duelist: Duelist,
		Pact: Pact,
		PactValue: PactValue,
		PaymentValue: PaymentValue,
		Payment: Payment,
		RoundValue: RoundValue,
		Round: Round,
		Moves: Moves,
		DuelistState: DuelistState,
		ScoreboardValue: ScoreboardValue,
		Scoreboard: Scoreboard,
		TableAdmittance: TableAdmittance,
		TableAdmittanceValue: TableAdmittanceValue,
		TableConfigValue: TableConfigValue,
		TableConfig: TableConfig,
		TokenBoundAddressValue: TokenBoundAddressValue,
		TokenBoundAddress: TokenBoundAddress,
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
		ChallengeFameBalance: {
			fieldOrder: ['duel_id', 'balance_a', 'balance_b'],
			duel_id: 0,
			balance_a: 0,
      balance_b: 0,
		},
		ChallengeFameBalanceValue: {
			fieldOrder: ['balance_a', 'balance_b'],
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
		ConfigValue: {
			fieldOrder: ['treasury_address', 'lords_address', 'vrf_address', 'is_paused'],
			treasury_address: "",
			lords_address: "",
			vrf_address: "",
			is_paused: false,
		},
		Config: {
			fieldOrder: ['key', 'treasury_address', 'lords_address', 'vrf_address', 'is_paused'],
			key: 0,
			treasury_address: "",
			lords_address: "",
			vrf_address: "",
			is_paused: false,
		},
		DuelistValue: {
			fieldOrder: ['name', 'profile_pic_type', 'profile_pic_uri', 'timestamp', 'score'],
			name: 0,
			profile_pic_type: ProfilePicType.Undefined,
			profile_pic_uri: "",
			timestamp: 0,
			score: { fieldOrder: ['honour', 'total_duels', 'total_wins', 'total_losses', 'total_draws', 'honour_history'], honour: 0, total_duels: 0, total_wins: 0, total_losses: 0, total_draws: 0, honour_history: 0, },
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
		Pact: {
			fieldOrder: ['table_id', 'pair', 'duel_id'],
			table_id: 0,
			pair: 0,
			duel_id: 0,
		},
		PactValue: {
			fieldOrder: ['duel_id'],
			duel_id: 0,
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
		RoundValue: {
			fieldOrder: ['moves_a', 'moves_b', 'state_a', 'state_b', 'state', 'final_blow'],
			moves_a: { fieldOrder: ['seed', 'salt', 'hashed', 'card_1', 'card_2', 'card_3', 'card_4'], seed: 0, salt: 0, hashed: 0, card_1: 0, card_2: 0, card_3: 0, card_4: 0, },
			moves_b: { fieldOrder: ['seed', 'salt', 'hashed', 'card_1', 'card_2', 'card_3', 'card_4'], seed: 0, salt: 0, hashed: 0, card_1: 0, card_2: 0, card_3: 0, card_4: 0, },
			state_a: { fieldOrder: ['chances', 'damage', 'health', 'dice_fire', 'honour'], chances: 0, damage: 0, health: 0, dice_fire: 0, honour: 0, },
			state_b: { fieldOrder: ['chances', 'damage', 'health', 'dice_fire', 'honour'], chances: 0, damage: 0, health: 0, dice_fire: 0, honour: 0, },
			state: RoundState.Null,
			final_blow: 0,
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
		DuelistState: {
			fieldOrder: ['chances', 'damage', 'health', 'dice_fire', 'honour'],
			chances: 0,
			damage: 0,
			health: 0,
			dice_fire: 0,
			honour: 0,
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
		TableConfigValue: {
			fieldOrder: ['description', 'table_type', 'deck_type', 'fee_collector_address', 'fee_min', 'is_open'],
			description: 0,
			table_type: TableType.Undefined,
			deck_type: DeckType.None,
			fee_collector_address: "",
			fee_min: 0,
			is_open: false,
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
		TokenBoundAddressValue: {
			fieldOrder: ['contract_address', 'token_id'],
			contract_address: "",
			token_id: 0,
		},
		TokenBoundAddress: {
			fieldOrder: ['recipient', 'contract_address', 'token_id'],
			recipient: "",
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