import type { SchemaType as ISchemaType } from "@dojoengine/sdk";

import type { BigNumberish } from 'starknet';

type RemoveFieldOrder<T> = T extends object
  ? Omit<
      {
        [K in keyof T]: T[K] extends object ? RemoveFieldOrder<T[K]> : T[K];
      },
      'fieldOrder'
    >
  : T;
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
export type InputChallenge = RemoveFieldOrder<Challenge>;

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
export type InputChallengeValue = RemoveFieldOrder<ChallengeValue>;

// Type definition for `pistols::models::challenge::ChallengeFameBalance` struct
export interface ChallengeFameBalance {
	fieldOrder: string[];
	duel_id: BigNumberish;
	balance_a: BigNumberish;
	balance_b: BigNumberish;
}
export type InputChallengeFameBalance = RemoveFieldOrder<ChallengeFameBalance>;

// Type definition for `pistols::models::challenge::ChallengeFameBalanceValue` struct
export interface ChallengeFameBalanceValue {
	fieldOrder: string[];
	balance_a: BigNumberish;
	balance_b: BigNumberish;
}
export type InputChallengeFameBalanceValue = RemoveFieldOrder<ChallengeFameBalanceValue>;

// Type definition for `pistols::models::config::CoinConfigValue` struct
export interface CoinConfigValue {
	fieldOrder: string[];
	minter_address: string;
	faucet_amount: BigNumberish;
}
export type InputCoinConfigValue = RemoveFieldOrder<CoinConfigValue>;

// Type definition for `pistols::models::config::CoinConfig` struct
export interface CoinConfig {
	fieldOrder: string[];
	coin_address: string;
	minter_address: string;
	faucet_amount: BigNumberish;
}
export type InputCoinConfig = RemoveFieldOrder<CoinConfig>;

// Type definition for `pistols::models::config::Config` struct
export interface Config {
	fieldOrder: string[];
	key: BigNumberish;
	treasury_address: string;
	lords_address: string;
	vrf_address: string;
	is_paused: boolean;
}
export type InputConfig = RemoveFieldOrder<Config>;

// Type definition for `pistols::models::config::ConfigValue` struct
export interface ConfigValue {
	fieldOrder: string[];
	treasury_address: string;
	lords_address: string;
	vrf_address: string;
	is_paused: boolean;
}
export type InputConfigValue = RemoveFieldOrder<ConfigValue>;

// Type definition for `pistols::models::consumable::ConsumableBalance` struct
export interface ConsumableBalance {
	fieldOrder: string[];
	consumable_type: ConsumableType;
	player_address: string;
	balance: BigNumberish;
}
export type InputConsumableBalance = RemoveFieldOrder<ConsumableBalance>;

// Type definition for `pistols::models::consumable::ConsumableBalanceValue` struct
export interface ConsumableBalanceValue {
	fieldOrder: string[];
	balance: BigNumberish;
}
export type InputConsumableBalanceValue = RemoveFieldOrder<ConsumableBalanceValue>;

// Type definition for `pistols::models::duelist::DuelistValue` struct
export interface DuelistValue {
	fieldOrder: string[];
	name: BigNumberish;
	profile_pic_type: ProfilePicType;
	profile_pic_uri: string;
	timestamp: BigNumberish;
	score: Score;
}
export type InputDuelistValue = RemoveFieldOrder<DuelistValue>;

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
export type InputScore = RemoveFieldOrder<Score>;

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
export type InputDuelist = RemoveFieldOrder<Duelist>;

// Type definition for `pistols::models::duelist::PactValue` struct
export interface PactValue {
	fieldOrder: string[];
	duel_id: BigNumberish;
}
export type InputPactValue = RemoveFieldOrder<PactValue>;

// Type definition for `pistols::models::duelist::Pact` struct
export interface Pact {
	fieldOrder: string[];
	table_id: BigNumberish;
	pair: BigNumberish;
	duel_id: BigNumberish;
}
export type InputPact = RemoveFieldOrder<Pact>;

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
export type InputPayment = RemoveFieldOrder<Payment>;

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
export type InputPaymentValue = RemoveFieldOrder<PaymentValue>;

// Type definition for `pistols::models::player::PlayerValue` struct
export interface PlayerValue {
	fieldOrder: string[];
	timestamp_registered: BigNumberish;
}
export type InputPlayerValue = RemoveFieldOrder<PlayerValue>;

// Type definition for `pistols::models::player::Player` struct
export interface Player {
	fieldOrder: string[];
	address: string;
	timestamp_registered: BigNumberish;
}
export type InputPlayer = RemoveFieldOrder<Player>;

// Type definition for `pistols::models::player::PlayerActivity` struct
export interface PlayerActivity {
	fieldOrder: string[];
	address: string;
	timestamp: BigNumberish;
	activity: Activity;
	identifier: BigNumberish;
}
export type InputPlayerActivity = RemoveFieldOrder<PlayerActivity>;

// Type definition for `pistols::models::player::PlayerActivityValue` struct
export interface PlayerActivityValue {
	fieldOrder: string[];
	timestamp: BigNumberish;
	activity: Activity;
	identifier: BigNumberish;
}
export type InputPlayerActivityValue = RemoveFieldOrder<PlayerActivityValue>;

// Type definition for `pistols::models::player::PlayerBookmarkValue` struct
export interface PlayerBookmarkValue {
  fieldOrder: string[];
  enabled: boolean;
}
export type InputPlayerBookmarkValue = RemoveFieldOrder<PlayerBookmarkValue>;

// Type definition for `pistols::models::player::PlayerBookmark` struct
export interface PlayerBookmark {
  fieldOrder: string[];
  address: string;
  bookmark: BigNumberish;
  enabled: boolean;
}
export type InputPlayerBookmark = RemoveFieldOrder<PlayerBookmark>;

// Type definition for `pistols::models::player::PlayerOnline` struct
export interface PlayerOnline {
  fieldOrder: string[];
  address: string;
  timestamp: BigNumberish;
}
export type InputPlayerOnline = RemoveFieldOrder<PlayerOnline>;

// Type definition for `pistols::models::player::PlayerOnlineValue` struct
export interface PlayerOnlineValue {
  fieldOrder: string[];
  timestamp: BigNumberish;
}
export type InputPlayerOnlineValue = RemoveFieldOrder<PlayerOnlineValue>;

// Type definition for `pistols::models::player::PlayerTutorialProgressValue` struct
export interface PlayerTutorialProgressValue {
  fieldOrder: string[];
  progress: TutorialProgress;
}
export type InputPlayerTutorialProgressValue = RemoveFieldOrder<PlayerTutorialProgressValue>;

// Type definition for `pistols::models::player::PlayerTutorialProgress` struct
export interface PlayerTutorialProgress {
  fieldOrder: string[];
  address: string;
  progress: TutorialProgress;
}
export type InputPlayerTutorialProgress = RemoveFieldOrder<PlayerTutorialProgress>;

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
export type InputMoves = RemoveFieldOrder<Moves>;

// Type definition for `pistols::models::challenge::DuelistState` struct
export interface DuelistState {
	fieldOrder: string[];
	chances: BigNumberish;
	damage: BigNumberish;
	health: BigNumberish;
	dice_fire: BigNumberish;
	honour: BigNumberish;
}
export type InputDuelistState = RemoveFieldOrder<DuelistState>;

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
export type InputRound = RemoveFieldOrder<Round>;

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
export type InputRoundValue = RemoveFieldOrder<RoundValue>;

// Type definition for `pistols::models::duelist::ScoreboardValue` struct
export interface ScoreboardValue {
	fieldOrder: string[];
	score: Score;
}
export type InputScoreboardValue = RemoveFieldOrder<ScoreboardValue>;

// Type definition for `pistols::models::duelist::Scoreboard` struct
export interface Scoreboard {
	fieldOrder: string[];
	table_id: BigNumberish;
	duelist_id: BigNumberish;
	score: Score;
}
export type InputScoreboard = RemoveFieldOrder<Scoreboard>;

// Type definition for `pistols::models::table::TableAdmittanceValue` struct
export interface TableAdmittanceValue {
	fieldOrder: string[];
	accounts: Array<string>;
	duelists: Array<BigNumberish>;
}
export type InputTableAdmittanceValue = RemoveFieldOrder<TableAdmittanceValue>;

// Type definition for `pistols::models::table::TableAdmittance` struct
export interface TableAdmittance {
	fieldOrder: string[];
	table_id: BigNumberish;
	accounts: Array<string>;
	duelists: Array<BigNumberish>;
}
export type InputTableAdmittance = RemoveFieldOrder<TableAdmittance>;

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
export type InputTableConfig = RemoveFieldOrder<TableConfig>;

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
export type InputTableConfigValue = RemoveFieldOrder<TableConfigValue>;

// Type definition for `pistols::systems::components::token_bound::TokenBoundAddressValue` struct
export interface TokenBoundAddressValue {
	fieldOrder: string[];
	contract_address: string;
	token_id: BigNumberish;
}
export type InputTokenBoundAddressValue = RemoveFieldOrder<TokenBoundAddressValue>;

// Type definition for `pistols::systems::components::token_bound::TokenBoundAddress` struct
export interface TokenBoundAddress {
	fieldOrder: string[];
	recipient: string;
	contract_address: string;
	token_id: BigNumberish;
}
export type InputTokenBoundAddress = RemoveFieldOrder<TokenBoundAddress>;

// Type definition for `pistols::models::config::TokenConfig` struct
export interface TokenConfig {
	fieldOrder: string[];
	token_address: string;
	minter_address: string;
	renderer_address: string;
	minted_count: BigNumberish;
}
export type InputTokenConfig = RemoveFieldOrder<TokenConfig>;

// Type definition for `pistols::models::config::TokenConfigValue` struct
export interface TokenConfigValue {
	fieldOrder: string[];
	minter_address: string;
	renderer_address: string;
	minted_count: BigNumberish;
}
export type InputTokenConfigValue = RemoveFieldOrder<TokenConfigValue>;

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

// Type definition for `pistols::models::consumable::ConsumableType` enum
export enum ConsumableType {
	Undefined,
	DuelistToken,
}

// Type definition for `pistols::models::duelist::ProfilePicType` enum
export enum ProfilePicType {
	Undefined,
	Duelist,
	External,
}

// Type definition for `pistols::models::player::TutorialProgress` enum
export enum TutorialProgress {
  None,
  FinishedFirst,
  FinishedSecond,
  FinishedFirstDuel,
}

// Type definition for `pistols::models::player::Activity` enum
export enum Activity {
	Undefined,
	CreatedDuelist,
	CreatedChallenge,
	RepliedChallenge,
	CommittedMoves,
	RevealedMoves,
	Online,
}

// Type definition for `pistols::types::round_state::RoundState` enum
export enum RoundState {
	Null,
	Commit,
	Reveal,
	Finished,
}

// Type definition for `pistols::types::cards::hand::DeckType` enum
export enum DeckType {
	None,
	Classic,
}

// Type definition for `pistols::models::table::TableType` enum
export enum TableType {
	Undefined,
	Classic,
	Tournament,
	IRLTournament,
}

export interface SchemaType extends ISchemaType {
	pistols: {
		Challenge: Challenge,
		ChallengeValue: ChallengeValue,
		ChallengeFameBalance: ChallengeFameBalance,
		ChallengeFameBalanceValue: ChallengeFameBalanceValue,
		CoinConfigValue: CoinConfigValue,
		CoinConfig: CoinConfig,
		Config: Config,
		ConfigValue: ConfigValue,
		ConsumableBalance: ConsumableBalance,
		ConsumableBalanceValue: ConsumableBalanceValue,
		DuelistValue: DuelistValue,
		Score: Score,
		Duelist: Duelist,
		PactValue: PactValue,
		Pact: Pact,
		Payment: Payment,
		PaymentValue: PaymentValue,
		PlayerValue: PlayerValue,
		Player: Player,
		PlayerActivity: PlayerActivity,
		PlayerActivityValue: PlayerActivityValue,
    PlayerBookmarkValue: PlayerBookmarkValue,
    PlayerBookmark: PlayerBookmark,
    PlayerOnline: PlayerOnline,
    PlayerOnlineValue: PlayerOnlineValue,
    PlayerTutorialProgressValue: PlayerTutorialProgressValue,
    PlayerTutorialProgress: PlayerTutorialProgress,
		Moves: Moves,
		DuelistState: DuelistState,
		Round: Round,
		RoundValue: RoundValue,
		ScoreboardValue: ScoreboardValue,
		Scoreboard: Scoreboard,
		TableAdmittanceValue: TableAdmittanceValue,
		TableAdmittance: TableAdmittance,
		TableConfig: TableConfig,
		TableConfigValue: TableConfigValue,
		TokenBoundAddressValue: TokenBoundAddressValue,
		TokenBoundAddress: TokenBoundAddress,
		TokenConfig: TokenConfig,
		TokenConfigValue: TokenConfigValue,
	},
}
export const schema: SchemaType = {
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
		ConsumableBalance: {
			fieldOrder: ['consumable_type', 'player_address', 'balance'],
			consumable_type: ConsumableType.Undefined,
			player_address: "",
			balance: 0,
		},
		ConsumableBalanceValue: {
			fieldOrder: ['balance'],
			balance: 0,
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
		PlayerValue: {
			fieldOrder: ['timestamp_registered'],
			timestamp_registered: 0,
		},
		Player: {
			fieldOrder: ['address', 'timestamp_registered'],
			address: "",
			timestamp_registered: 0,
		},
		PlayerActivity: {
			fieldOrder: ['address', 'timestamp', 'activity', 'identifier'],
			address: "",
			timestamp: 0,
			activity: Activity.Undefined,
			identifier: 0,
		},
		PlayerActivityValue: {
			fieldOrder: ['timestamp', 'activity', 'identifier'],
			timestamp: 0,
			activity: Activity.Undefined,
			identifier: 0,
		},
    PlayerBookmarkValue: {
      fieldOrder: ['enabled'],
      enabled: false,
    },
    PlayerBookmark: {
      fieldOrder: ['address', 'bookmark', 'enabled'],
      address: "",
      bookmark: 0,
      enabled: false,
    },
    PlayerOnline: {
      fieldOrder: ['address', 'timestamp'],
      address: "",
      timestamp: 0,
    },
    PlayerOnlineValue: {
      fieldOrder: ['timestamp'],
      timestamp: 0,
    },
    PlayerTutorialProgressValue: {
      fieldOrder: ['progress'],
      progress: TutorialProgress.None,
    },
    PlayerTutorialProgress: {
      fieldOrder: ['address', 'progress'],
      address: "",
      progress: TutorialProgress.None,
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
		RoundValue: {
			fieldOrder: ['moves_a', 'moves_b', 'state_a', 'state_b', 'state', 'final_blow'],
			moves_a: { fieldOrder: ['seed', 'salt', 'hashed', 'card_1', 'card_2', 'card_3', 'card_4'], seed: 0, salt: 0, hashed: 0, card_1: 0, card_2: 0, card_3: 0, card_4: 0, },
			moves_b: { fieldOrder: ['seed', 'salt', 'hashed', 'card_1', 'card_2', 'card_3', 'card_4'], seed: 0, salt: 0, hashed: 0, card_1: 0, card_2: 0, card_3: 0, card_4: 0, },
			state_a: { fieldOrder: ['chances', 'damage', 'health', 'dice_fire', 'honour'], chances: 0, damage: 0, health: 0, dice_fire: 0, honour: 0, },
			state_b: { fieldOrder: ['chances', 'damage', 'health', 'dice_fire', 'honour'], chances: 0, damage: 0, health: 0, dice_fire: 0, honour: 0, },
			state: RoundState.Null,
			final_blow: 0,
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
		TableAdmittanceValue: {
			fieldOrder: ['accounts', 'duelists'],
			accounts: [""],
			duelists: [0],
		},
		TableAdmittance: {
			fieldOrder: ['table_id', 'accounts', 'duelists'],
			table_id: 0,
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
		TokenConfig: {
			fieldOrder: ['token_address', 'minter_address', 'renderer_address', 'minted_count'],
			token_address: "",
			minter_address: "",
			renderer_address: "",
			minted_count: 0,
		},
		TokenConfigValue: {
			fieldOrder: ['minter_address', 'renderer_address', 'minted_count'],
			minter_address: "",
			renderer_address: "",
			minted_count: 0,
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