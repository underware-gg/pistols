import type { SchemaType as ISchemaType } from "@dojoengine/sdk";

import { CairoCustomEnum, BigNumberish } from 'starknet';

type WithFieldOrder<T> = T & { fieldOrder: string[] };

// Type definition for `pistols::models::challenge::Challenge` struct
export interface Challenge {
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

// Type definition for `pistols::models::challenge::ChallengeFameBalance` struct
export interface ChallengeFameBalance {
	duel_id: BigNumberish;
	balance_a: BigNumberish;
	balance_b: BigNumberish;
}

// Type definition for `pistols::models::challenge::ChallengeFameBalanceValue` struct
export interface ChallengeFameBalanceValue {
	balance_a: BigNumberish;
	balance_b: BigNumberish;
}

// Type definition for `pistols::models::challenge::ChallengeValue` struct
export interface ChallengeValue {
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

// Type definition for `pistols::models::challenge::DuelistState` struct
export interface DuelistState {
	chances: BigNumberish;
	damage: BigNumberish;
	health: BigNumberish;
	dice_fire: BigNumberish;
	honour: BigNumberish;
}

// Type definition for `pistols::models::challenge::Moves` struct
export interface Moves {
	salt: BigNumberish;
	hashed: BigNumberish;
	card_1: BigNumberish;
	card_2: BigNumberish;
	card_3: BigNumberish;
	card_4: BigNumberish;
}

// Type definition for `pistols::models::challenge::Round` struct
export interface Round {
	duel_id: BigNumberish;
	moves_a: Moves;
	moves_b: Moves;
	state_a: DuelistState;
	state_b: DuelistState;
	state: RoundState;
	final_blow: FinalBlowEnum;
}

// Type definition for `pistols::models::challenge::RoundValue` struct
export interface RoundValue {
	moves_a: Moves;
	moves_b: Moves;
	state_a: DuelistState;
	state_b: DuelistState;
	state: RoundState;
	final_blow: FinalBlowEnum;
}

// Type definition for `pistols::models::config::CoinConfig` struct
export interface CoinConfig {
	coin_address: string;
	minter_address: string;
	faucet_amount: BigNumberish;
}

// Type definition for `pistols::models::config::CoinConfigValue` struct
export interface CoinConfigValue {
	minter_address: string;
	faucet_amount: BigNumberish;
}

// Type definition for `pistols::models::config::Config` struct
export interface Config {
	key: BigNumberish;
	treasury_address: string;
	lords_address: string;
	vrf_address: string;
	is_paused: boolean;
}

// Type definition for `pistols::models::config::ConfigValue` struct
export interface ConfigValue {
	treasury_address: string;
	lords_address: string;
	vrf_address: string;
	is_paused: boolean;
}

// Type definition for `pistols::models::config::TokenConfig` struct
export interface TokenConfig {
	token_address: string;
	minter_address: string;
	renderer_address: string;
	minted_count: BigNumberish;
}

// Type definition for `pistols::models::config::TokenConfigValue` struct
export interface TokenConfigValue {
	minter_address: string;
	renderer_address: string;
	minted_count: BigNumberish;
}

// Type definition for `pistols::models::duelist::Duelist` struct
export interface Duelist {
	duelist_id: BigNumberish;
	profile_type: ProfileTypeEnum;
	timestamp: BigNumberish;
	score: Score;
}

// Type definition for `pistols::models::duelist::DuelistChallenge` struct
export interface DuelistChallenge {
	duelist_id: BigNumberish;
	duel_id: BigNumberish;
}

// Type definition for `pistols::models::duelist::DuelistChallengeValue` struct
export interface DuelistChallengeValue {
	duel_id: BigNumberish;
}

// Type definition for `pistols::models::duelist::DuelistValue` struct
export interface DuelistValue {
	profile_type: ProfileTypeEnum;
	timestamp: BigNumberish;
	score: Score;
}

// Type definition for `pistols::models::duelist::Score` struct
export interface Score {
	honour: BigNumberish;
	total_duels: BigNumberish;
	total_wins: BigNumberish;
	total_losses: BigNumberish;
	total_draws: BigNumberish;
	honour_history: BigNumberish;
}

// Type definition for `pistols::models::duelist::Scoreboard` struct
export interface Scoreboard {
	table_id: BigNumberish;
	duelist_id: BigNumberish;
	score: Score;
}

// Type definition for `pistols::models::duelist::ScoreboardValue` struct
export interface ScoreboardValue {
	score: Score;
}

// Type definition for `pistols::models::pack::Pack` struct
export interface Pack {
	pack_id: BigNumberish;
	pack_type: PackType;
	seed: BigNumberish;
	is_open: boolean;
}

// Type definition for `pistols::models::pack::PackValue` struct
export interface PackValue {
	pack_type: PackType;
	seed: BigNumberish;
	is_open: boolean;
}

// Type definition for `pistols::models::pact::Pact` struct
export interface Pact {
	table_id: BigNumberish;
	pair: BigNumberish;
	duel_id: BigNumberish;
}

// Type definition for `pistols::models::pact::PactValue` struct
export interface PactValue {
	duel_id: BigNumberish;
}

// Type definition for `pistols::models::payment::Payment` struct
export interface Payment {
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
	amount: BigNumberish;
	client_percent: BigNumberish;
	ranking_percent: BigNumberish;
	owner_percent: BigNumberish;
	pool_percent: BigNumberish;
	treasury_percent: BigNumberish;
}

// Type definition for `pistols::models::player::PPlayerBookmark` struct
export interface PPlayerBookmark {
	identity: string;
	target_address: string;
	target_id: BigNumberish;
	enabled: boolean;
}

// Type definition for `pistols::models::player::PPlayerBookmarkValue` struct
export interface PPlayerBookmarkValue {
	enabled: boolean;
}

// Type definition for `pistols::models::player::PPlayerOnline` struct
export interface PPlayerOnline {
	identity: string;
	timestamp: BigNumberish;
}

// Type definition for `pistols::models::player::PPlayerOnlineValue` struct
export interface PPlayerOnlineValue {
	timestamp: BigNumberish;
}

// Type definition for `pistols::models::player::PPlayerTutorialProgress` struct
export interface PPlayerTutorialProgress {
	identity: string;
	progress: TutorialProgress;
}

// Type definition for `pistols::models::player::PPlayerTutorialProgressValue` struct
export interface PPlayerTutorialProgressValue {
	progress: TutorialProgress;
}

// Type definition for `pistols::models::player::Player` struct
export interface Player {
	address: string;
	timestamp_registered: BigNumberish;
	claimed_welcome_pack: boolean;
}

// Type definition for `pistols::models::player::PlayerValue` struct
export interface PlayerValue {
	timestamp_registered: BigNumberish;
	claimed_welcome_pack: boolean;
}

// Type definition for `pistols::models::table::TableAdmittance` struct
export interface TableAdmittance {
	table_id: BigNumberish;
	accounts: Array<string>;
	duelists: Array<BigNumberish>;
}

// Type definition for `pistols::models::table::TableAdmittanceValue` struct
export interface TableAdmittanceValue {
	accounts: Array<string>;
	duelists: Array<BigNumberish>;
}

// Type definition for `pistols::models::table::TableConfig` struct
export interface TableConfig {
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
	description: BigNumberish;
	table_type: TableType;
	deck_type: DeckType;
	fee_collector_address: string;
	fee_min: BigNumberish;
	is_open: boolean;
}

// Type definition for `pistols::systems::components::token_bound::TokenBoundAddress` struct
export interface TokenBoundAddress {
	recipient: string;
	contract_address: string;
	token_id: BigNumberish;
}

// Type definition for `pistols::systems::components::token_bound::TokenBoundAddressValue` struct
export interface TokenBoundAddressValue {
	contract_address: string;
	token_id: BigNumberish;
}

// Type definition for `pistols::models::pack::PackType` enum
export enum PackType {
	Unknown,
	WelcomePack,
	Duelists5x,
}

// Type definition for `pistols::models::player::TutorialProgress` enum
export enum TutorialProgress {
	None,
	FinishedFirst,
	FinishedSecond,
	FinishedFirstDuel,
}

// Type definition for `pistols::models::table::TableType` enum
export enum TableType {
	Undefined,
	Classic,
	Tournament,
	IRLTournament,
}

// Type definition for `pistols::types::cards::blades::BladesCard` enum
export enum BladesCard {
	None,
	Seppuku,
	PocketPistol,
	Behead,
	Grapple,
}

// Type definition for `pistols::types::cards::hand::DeckType` enum
export enum DeckType {
	None,
	Classic,
}

// Type definition for `pistols::types::cards::hand::FinalBlow` enum
export type FinalBlow = {
	Undefined: string;
	Paces: PacesCard;
	Blades: BladesCard;
}
export type FinalBlowEnum = CairoCustomEnum;

// Type definition for `pistols::types::cards::paces::PacesCard` enum
export enum PacesCard {
	None,
	Paces1,
	Paces2,
	Paces3,
	Paces4,
	Paces5,
	Paces6,
	Paces7,
	Paces8,
	Paces9,
	Paces10,
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
	Undefined,
	Matter,
	Debt,
	Dispute,
	Honour,
	Hatred,
	Blood,
	Nothing,
	Tournament,
}

// Type definition for `pistols::types::profile_type::BotProfile` enum
export enum BotProfile {
	Unknown,
	Scarecrow,
	TinMan,
}

// Type definition for `pistols::types::profile_type::DuelistProfile` enum
export enum DuelistProfile {
	Unknown,
	Duke,
	Duella,
	Jameson,
	Pilgrim,
	Jack,
	Pops,
	SerWalker,
	Bloberto,
	Squiddo,
	SlenderDuck,
	LadyVengeance,
	Breadman,
	Brutus,
	Pistolopher,
	Secreto,
	ShadowMare,
	Karaku,
	Misty,
	Kenzu,
	NynJah,
	Thrak,
}

// Type definition for `pistols::types::profile_type::ProfileType` enum
export type ProfileType = {
	Undefined: string;
	Duelist: DuelistProfile;
	Bot: BotProfile;
}
export type ProfileTypeEnum = CairoCustomEnum;

// Type definition for `pistols::types::round_state::RoundState` enum
export enum RoundState {
	Null,
	Commit,
	Reveal,
	Finished,
}


//----------------------------------
// Events
//
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
// Type definition for `pistols::models::player::PlayerActivity` struct
export interface PlayerActivity {
  address: string;
  timestamp: BigNumberish;
  activity: Activity;
  identifier: BigNumberish;
  is_public: boolean;
}
// Type definition for `pistols::models::player::PlayerRequiredAction` struct
export interface PlayerRequiredAction {
  address: string;
  duelist_id: BigNumberish;
  duel_id: BigNumberish;
}
//----------------------------------



export interface SchemaType extends ISchemaType {
	pistols: {
		Challenge: WithFieldOrder<Challenge>,
		ChallengeFameBalance: WithFieldOrder<ChallengeFameBalance>,
		ChallengeFameBalanceValue: WithFieldOrder<ChallengeFameBalanceValue>,
		ChallengeValue: WithFieldOrder<ChallengeValue>,
		DuelistState: WithFieldOrder<DuelistState>,
		Moves: WithFieldOrder<Moves>,
		Round: WithFieldOrder<Round>,
		RoundValue: WithFieldOrder<RoundValue>,
		CoinConfig: WithFieldOrder<CoinConfig>,
		CoinConfigValue: WithFieldOrder<CoinConfigValue>,
		Config: WithFieldOrder<Config>,
		ConfigValue: WithFieldOrder<ConfigValue>,
		TokenConfig: WithFieldOrder<TokenConfig>,
		TokenConfigValue: WithFieldOrder<TokenConfigValue>,
		Duelist: WithFieldOrder<Duelist>,
		DuelistChallenge: WithFieldOrder<DuelistChallenge>,
		DuelistChallengeValue: WithFieldOrder<DuelistChallengeValue>,
		DuelistValue: WithFieldOrder<DuelistValue>,
		Score: WithFieldOrder<Score>,
		Scoreboard: WithFieldOrder<Scoreboard>,
		ScoreboardValue: WithFieldOrder<ScoreboardValue>,
		Pack: WithFieldOrder<Pack>,
		PackValue: WithFieldOrder<PackValue>,
		Pact: WithFieldOrder<Pact>,
		PactValue: WithFieldOrder<PactValue>,
		Payment: WithFieldOrder<Payment>,
		PaymentValue: WithFieldOrder<PaymentValue>,
		PPlayerBookmark: WithFieldOrder<PPlayerBookmark>,
		PPlayerBookmarkValue: WithFieldOrder<PPlayerBookmarkValue>,
		PPlayerOnline: WithFieldOrder<PPlayerOnline>,
		PPlayerOnlineValue: WithFieldOrder<PPlayerOnlineValue>,
		PPlayerTutorialProgress: WithFieldOrder<PPlayerTutorialProgress>,
		PPlayerTutorialProgressValue: WithFieldOrder<PPlayerTutorialProgressValue>,
		Player: WithFieldOrder<Player>,
		PlayerValue: WithFieldOrder<PlayerValue>,
		TableAdmittance: WithFieldOrder<TableAdmittance>,
		TableAdmittanceValue: WithFieldOrder<TableAdmittanceValue>,
		TableConfig: WithFieldOrder<TableConfig>,
		TableConfigValue: WithFieldOrder<TableConfigValue>,
		TokenBoundAddress: WithFieldOrder<TokenBoundAddress>,
		TokenBoundAddressValue: WithFieldOrder<TokenBoundAddressValue>,
    //----------------------------------
    // Events
    PlayerActivity: WithFieldOrder<PlayerActivity>,
    PlayerRequiredAction: WithFieldOrder<PlayerRequiredAction>,
    //----------------------------------
	},
}
export const schema: SchemaType = {
	pistols: {
		Challenge: {
			fieldOrder: ['duel_id', 'table_id', 'premise', 'quote', 'address_a', 'address_b', 'duelist_id_a', 'duelist_id_b', 'state', 'winner', 'timestamp_start', 'timestamp_end'],
			duel_id: 0,
			table_id: 0,
		premise: Premise.Undefined,
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
		ChallengeValue: {
			fieldOrder: ['table_id', 'premise', 'quote', 'address_a', 'address_b', 'duelist_id_a', 'duelist_id_b', 'state', 'winner', 'timestamp_start', 'timestamp_end'],
			table_id: 0,
		premise: Premise.Undefined,
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
		DuelistState: {
			fieldOrder: ['chances', 'damage', 'health', 'dice_fire', 'honour'],
			chances: 0,
			damage: 0,
			health: 0,
			dice_fire: 0,
			honour: 0,
		},
		Moves: {
			fieldOrder: ['salt', 'hashed', 'card_1', 'card_2', 'card_3', 'card_4'],
			salt: 0,
			hashed: 0,
			card_1: 0,
			card_2: 0,
			card_3: 0,
			card_4: 0,
		},
		Round: {
			fieldOrder: ['duel_id', 'moves_a', 'moves_b', 'state_a', 'state_b', 'state', 'final_blow'],
			duel_id: 0,
      //@ts-ignore
		moves_a: { fieldOrder: ['salt', 'hashed', 'card_1', 'card_2', 'card_3', 'card_4'], salt: 0, hashed: 0, card_1: 0, card_2: 0, card_3: 0, card_4: 0, },
      //@ts-ignore
		moves_b: { fieldOrder: ['salt', 'hashed', 'card_1', 'card_2', 'card_3', 'card_4'], salt: 0, hashed: 0, card_1: 0, card_2: 0, card_3: 0, card_4: 0, },
      //@ts-ignore
		state_a: { fieldOrder: ['chances', 'damage', 'health', 'dice_fire', 'honour'], chances: 0, damage: 0, health: 0, dice_fire: 0, honour: 0, },
      //@ts-ignore
		state_b: { fieldOrder: ['chances', 'damage', 'health', 'dice_fire', 'honour'], chances: 0, damage: 0, health: 0, dice_fire: 0, honour: 0, },
		state: RoundState.Null,
		final_blow: new CairoCustomEnum({ 
					Undefined: {},
				paces: undefined,
				blades: undefined, }),
		},
		RoundValue: {
			fieldOrder: ['moves_a', 'moves_b', 'state_a', 'state_b', 'state', 'final_blow'],
      //@ts-ignore
		moves_a: { fieldOrder: ['salt', 'hashed', 'card_1', 'card_2', 'card_3', 'card_4'], salt: 0, hashed: 0, card_1: 0, card_2: 0, card_3: 0, card_4: 0, },
      //@ts-ignore
		moves_b: { fieldOrder: ['salt', 'hashed', 'card_1', 'card_2', 'card_3', 'card_4'], salt: 0, hashed: 0, card_1: 0, card_2: 0, card_3: 0, card_4: 0, },
      //@ts-ignore
		state_a: { fieldOrder: ['chances', 'damage', 'health', 'dice_fire', 'honour'], chances: 0, damage: 0, health: 0, dice_fire: 0, honour: 0, },
      //@ts-ignore
		state_b: { fieldOrder: ['chances', 'damage', 'health', 'dice_fire', 'honour'], chances: 0, damage: 0, health: 0, dice_fire: 0, honour: 0, },
		state: RoundState.Null,
		final_blow: new CairoCustomEnum({ 
					Undefined: {},
				paces: undefined,
				blades: undefined, }),
		},
		CoinConfig: {
			fieldOrder: ['coin_address', 'minter_address', 'faucet_amount'],
			coin_address: "",
			minter_address: "",
			faucet_amount: 0,
		},
		CoinConfigValue: {
			fieldOrder: ['minter_address', 'faucet_amount'],
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
		Duelist: {
			fieldOrder: ['duelist_id', 'profile_type', 'timestamp', 'score'],
			duelist_id: 0,
		profile_type: new CairoCustomEnum({ 
					Undefined: {},
				duelist: undefined,
				bot: undefined, }),
			timestamp: 0,
      //@ts-ignore
		score: { fieldOrder: ['honour', 'total_duels', 'total_wins', 'total_losses', 'total_draws', 'honour_history'], honour: 0, total_duels: 0, total_wins: 0, total_losses: 0, total_draws: 0, honour_history: 0, },
		},
		DuelistChallenge: {
			fieldOrder: ['duelist_id', 'duel_id'],
			duelist_id: 0,
			duel_id: 0,
		},
		DuelistChallengeValue: {
			fieldOrder: ['duel_id'],
			duel_id: 0,
		},
		DuelistValue: {
			fieldOrder: ['profile_type', 'timestamp', 'score'],
		profile_type: new CairoCustomEnum({ 
					Undefined: {},
				duelist: undefined,
				bot: undefined, }),
			timestamp: 0,
      //@ts-ignore
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
		Scoreboard: {
			fieldOrder: ['table_id', 'duelist_id', 'score'],
			table_id: 0,
			duelist_id: 0,
      //@ts-ignore
		score: { fieldOrder: ['honour', 'total_duels', 'total_wins', 'total_losses', 'total_draws', 'honour_history'], honour: 0, total_duels: 0, total_wins: 0, total_losses: 0, total_draws: 0, honour_history: 0, },
		},
		ScoreboardValue: {
			fieldOrder: ['score'],
      //@ts-ignore
		score: { fieldOrder: ['honour', 'total_duels', 'total_wins', 'total_losses', 'total_draws', 'honour_history'], honour: 0, total_duels: 0, total_wins: 0, total_losses: 0, total_draws: 0, honour_history: 0, },
		},
		Pack: {
			fieldOrder: ['pack_id', 'pack_type', 'seed', 'is_open'],
			pack_id: 0,
		pack_type: PackType.Unknown,
			seed: 0,
			is_open: false,
		},
		PackValue: {
			fieldOrder: ['pack_type', 'seed', 'is_open'],
		pack_type: PackType.Unknown,
			seed: 0,
			is_open: false,
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
		PPlayerBookmark: {
			fieldOrder: ['identity', 'target_address', 'target_id', 'enabled'],
			identity: "",
			target_address: "",
			target_id: 0,
			enabled: false,
		},
		PPlayerBookmarkValue: {
			fieldOrder: ['enabled'],
			enabled: false,
		},
		PPlayerOnline: {
			fieldOrder: ['identity', 'timestamp'],
			identity: "",
			timestamp: 0,
		},
		PPlayerOnlineValue: {
			fieldOrder: ['timestamp'],
			timestamp: 0,
		},
		PPlayerTutorialProgress: {
			fieldOrder: ['identity', 'progress'],
			identity: "",
		progress: TutorialProgress.None,
		},
		PPlayerTutorialProgressValue: {
			fieldOrder: ['progress'],
		progress: TutorialProgress.None,
		},
		Player: {
			fieldOrder: ['address', 'timestamp_registered', 'claimed_welcome_pack'],
			address: "",
			timestamp_registered: 0,
			claimed_welcome_pack: false,
		},
		PlayerValue: {
			fieldOrder: ['timestamp_registered', 'claimed_welcome_pack'],
			timestamp_registered: 0,
			claimed_welcome_pack: false,
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
    //----------------------------------
    // Events
    PlayerActivity: {
      fieldOrder: ['address', 'timestamp', 'activity', 'identifier', 'is_public'],
      address: "",
      timestamp: 0,
      activity: Activity.Undefined,
      identifier: 0,
      is_public: true,
    },
    PlayerRequiredAction: {
      fieldOrder: ['address', 'duelist_id', 'duel_id'],
      address: "",
      duelist_id: 0,
      duel_id: 0,
    },
    //----------------------------------
	},
};
export enum ModelsMapping {
	Challenge = 'pistols-Challenge',
	ChallengeFameBalance = 'pistols-ChallengeFameBalance',
	ChallengeFameBalanceValue = 'pistols-ChallengeFameBalanceValue',
	ChallengeValue = 'pistols-ChallengeValue',
	DuelistState = 'pistols-DuelistState',
	Moves = 'pistols-Moves',
	Round = 'pistols-Round',
	RoundValue = 'pistols-RoundValue',
	CoinConfig = 'pistols-CoinConfig',
	CoinConfigValue = 'pistols-CoinConfigValue',
	Config = 'pistols-Config',
	ConfigValue = 'pistols-ConfigValue',
	TokenConfig = 'pistols-TokenConfig',
	TokenConfigValue = 'pistols-TokenConfigValue',
	Duelist = 'pistols-Duelist',
	DuelistChallenge = 'pistols-DuelistChallenge',
	DuelistChallengeValue = 'pistols-DuelistChallengeValue',
	DuelistValue = 'pistols-DuelistValue',
	Score = 'pistols-Score',
	Scoreboard = 'pistols-Scoreboard',
	ScoreboardValue = 'pistols-ScoreboardValue',
	Pack = 'pistols-Pack',
	PackType = 'pistols-PackType',
	PackValue = 'pistols-PackValue',
	Pact = 'pistols-Pact',
	PactValue = 'pistols-PactValue',
	Payment = 'pistols-Payment',
	PaymentValue = 'pistols-PaymentValue',
	PPlayerBookmark = 'pistols-PPlayerBookmark',
	PPlayerBookmarkValue = 'pistols-PPlayerBookmarkValue',
	PPlayerOnline = 'pistols-PPlayerOnline',
	PPlayerOnlineValue = 'pistols-PPlayerOnlineValue',
	PPlayerTutorialProgress = 'pistols-PPlayerTutorialProgress',
	PPlayerTutorialProgressValue = 'pistols-PPlayerTutorialProgressValue',
	Player = 'pistols-Player',
	PlayerValue = 'pistols-PlayerValue',
	TutorialProgress = 'pistols-TutorialProgress',
	TableAdmittance = 'pistols-TableAdmittance',
	TableAdmittanceValue = 'pistols-TableAdmittanceValue',
	TableConfig = 'pistols-TableConfig',
	TableConfigValue = 'pistols-TableConfigValue',
	TableType = 'pistols-TableType',
	TokenBoundAddress = 'pistols-TokenBoundAddress',
	TokenBoundAddressValue = 'pistols-TokenBoundAddressValue',
	BladesCard = 'pistols-BladesCard',
	DeckType = 'pistols-DeckType',
	FinalBlow = 'pistols-FinalBlow',
	PacesCard = 'pistols-PacesCard',
	ChallengeState = 'pistols-ChallengeState',
	Premise = 'pistols-Premise',
	BotProfile = 'pistols-BotProfile',
	DuelistProfile = 'pistols-DuelistProfile',
	ProfileType = 'pistols-ProfileType',
	RoundState = 'pistols-RoundState',
}