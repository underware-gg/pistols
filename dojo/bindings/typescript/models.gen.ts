import type { SchemaType as ISchemaType } from "@dojoengine/sdk";

import { CairoCustomEnum, BigNumberish } from 'starknet';

// Type definition for `pistols::models::challenge::Challenge` struct
export interface Challenge {
	duel_id: BigNumberish;
	table_id: BigNumberish;
	premise: PremiseEnum;
	quote: BigNumberish;
	lives_staked: BigNumberish;
	address_a: string;
	address_b: string;
	duelist_id_a: BigNumberish;
	duelist_id_b: BigNumberish;
	state: ChallengeStateEnum;
	winner: BigNumberish;
	timestamp_start: BigNumberish;
	timestamp_end: BigNumberish;
}

// Type definition for `pistols::models::challenge::ChallengeValue` struct
export interface ChallengeValue {
	table_id: BigNumberish;
	premise: PremiseEnum;
	quote: BigNumberish;
	lives_staked: BigNumberish;
	address_a: string;
	address_b: string;
	duelist_id_a: BigNumberish;
	duelist_id_b: BigNumberish;
	state: ChallengeStateEnum;
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
	state: RoundStateEnum;
	final_blow: FinalBlowEnum;
}

// Type definition for `pistols::models::challenge::RoundValue` struct
export interface RoundValue {
	moves_a: Moves;
	moves_b: Moves;
	state_a: DuelistState;
	state_b: DuelistState;
	state: RoundStateEnum;
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
	season_table_id: BigNumberish;
	is_paused: boolean;
}

// Type definition for `pistols::models::config::ConfigValue` struct
export interface ConfigValue {
	treasury_address: string;
	lords_address: string;
	vrf_address: string;
	season_table_id: BigNumberish;
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
	timestamp_registered: BigNumberish;
	timestamp_active: BigNumberish;
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

// Type definition for `pistols::models::duelist::DuelistMemorial` struct
export interface DuelistMemorial {
	duelist_id: BigNumberish;
	cause_of_death: CauseOfDeathEnum;
	killed_by: BigNumberish;
	fame_before_death: BigNumberish;
}

// Type definition for `pistols::models::duelist::DuelistMemorialValue` struct
export interface DuelistMemorialValue {
	cause_of_death: CauseOfDeathEnum;
	killed_by: BigNumberish;
	fame_before_death: BigNumberish;
}

// Type definition for `pistols::models::duelist::DuelistValue` struct
export interface DuelistValue {
	profile_type: ProfileTypeEnum;
	timestamp_registered: BigNumberish;
	timestamp_active: BigNumberish;
}

// Type definition for `pistols::models::duelist::Score` struct
export interface Score {
	honour: BigNumberish;
	points: BigNumberish;
	total_duels: BigNumberish;
	total_wins: BigNumberish;
	total_losses: BigNumberish;
	total_draws: BigNumberish;
	honour_history: BigNumberish;
}

// Type definition for `pistols::models::duelist::Scoreboard` struct
export interface Scoreboard {
	holder: BigNumberish;
	table_id: BigNumberish;
	score: Score;
}

// Type definition for `pistols::models::duelist::ScoreboardValue` struct
export interface ScoreboardValue {
	score: Score;
}

// Type definition for `pistols::models::leaderboard::Leaderboard` struct
export interface Leaderboard {
	table_id: BigNumberish;
	positions: BigNumberish;
	duelist_ids: BigNumberish;
	scores: BigNumberish;
}

// Type definition for `pistols::models::leaderboard::LeaderboardValue` struct
export interface LeaderboardValue {
	positions: BigNumberish;
	duelist_ids: BigNumberish;
	scores: BigNumberish;
}

// Type definition for `pistols::models::pack::Pack` struct
export interface Pack {
	pack_id: BigNumberish;
	pack_type: PackTypeEnum;
	seed: BigNumberish;
	lords_amount: BigNumberish;
	is_open: boolean;
}

// Type definition for `pistols::models::pack::PackValue` struct
export interface PackValue {
	pack_type: PackTypeEnum;
	seed: BigNumberish;
	lords_amount: BigNumberish;
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

// Type definition for `pistols::models::player::Player` struct
export interface Player {
	player_address: string;
	timestamp_registered: BigNumberish;
	claimed_starter_pack: boolean;
}

// Type definition for `pistols::models::player::PlayerBookmark` struct
export interface PlayerBookmark {
	identity: string;
	target_address: string;
	target_id: BigNumberish;
	enabled: boolean;
}

// Type definition for `pistols::models::player::PlayerBookmarkValue` struct
export interface PlayerBookmarkValue {
	enabled: boolean;
}

// Type definition for `pistols::models::player::PlayerOnline` struct
export interface PlayerOnline {
	identity: string;
	timestamp: BigNumberish;
}

// Type definition for `pistols::models::player::PlayerOnlineValue` struct
export interface PlayerOnlineValue {
	timestamp: BigNumberish;
}

// Type definition for `pistols::models::player::PlayerValue` struct
export interface PlayerValue {
	timestamp_registered: BigNumberish;
	claimed_starter_pack: boolean;
}

// Type definition for `pistols::models::pool::Pool` struct
export interface Pool {
	pool_id: PoolTypeEnum;
	balance_lords: BigNumberish;
	balance_fame: BigNumberish;
}

// Type definition for `pistols::models::pool::PoolValue` struct
export interface PoolValue {
	balance_lords: BigNumberish;
	balance_fame: BigNumberish;
}

// Type definition for `pistols::models::season::SeasonConfig` struct
export interface SeasonConfig {
	table_id: BigNumberish;
	season_id: BigNumberish;
	timestamp_start: BigNumberish;
	timestamp_end: BigNumberish;
	phase: SeasonPhaseEnum;
}

// Type definition for `pistols::models::season::SeasonConfigValue` struct
export interface SeasonConfigValue {
	season_id: BigNumberish;
	timestamp_start: BigNumberish;
	timestamp_end: BigNumberish;
	phase: SeasonPhaseEnum;
}

// Type definition for `pistols::models::table::TableConfig` struct
export interface TableConfig {
	table_id: BigNumberish;
	description: BigNumberish;
	rules: RulesTypeEnum;
}

// Type definition for `pistols::models::table::TableConfigValue` struct
export interface TableConfigValue {
	description: BigNumberish;
	rules: RulesTypeEnum;
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

// Type definition for `pistols::systems::rng_mock::MockedValue` struct
export interface MockedValue {
	salt: BigNumberish;
	value: BigNumberish;
	exists: boolean;
}

// Type definition for `pistols::systems::rng_mock::MockedValueValue` struct
export interface MockedValueValue {
	value: BigNumberish;
	exists: boolean;
}

// Type definition for `achievement::events::index::TrophyCreation` struct
export interface TrophyCreation {
	id: BigNumberish;
	hidden: boolean;
	index: BigNumberish;
	points: BigNumberish;
	start: BigNumberish;
	end: BigNumberish;
	group: BigNumberish;
	icon: BigNumberish;
	title: BigNumberish;
	description: string;
	tasks: Array<Task>;
	data: string;
}

// Type definition for `achievement::events::index::TrophyCreationValue` struct
export interface TrophyCreationValue {
	hidden: boolean;
	index: BigNumberish;
	points: BigNumberish;
	start: BigNumberish;
	end: BigNumberish;
	group: BigNumberish;
	icon: BigNumberish;
	title: BigNumberish;
	description: string;
	tasks: Array<Task>;
	data: string;
}

// Type definition for `achievement::events::index::TrophyProgression` struct
export interface TrophyProgression {
	player_id: BigNumberish;
	task_id: BigNumberish;
	count: BigNumberish;
	time: BigNumberish;
}

// Type definition for `achievement::events::index::TrophyProgressionValue` struct
export interface TrophyProgressionValue {
	count: BigNumberish;
	time: BigNumberish;
}

// Type definition for `achievement::types::index::Task` struct
export interface Task {
	id: BigNumberish;
	total: BigNumberish;
	description: string;
}

// Type definition for `pistols::models::player::PlayerActivity` struct
export interface PlayerActivity {
	player_address: string;
	timestamp: BigNumberish;
	activity: ActivityEnum;
	identifier: BigNumberish;
	is_public: boolean;
}

// Type definition for `pistols::models::player::PlayerActivityValue` struct
export interface PlayerActivityValue {
	timestamp: BigNumberish;
	activity: ActivityEnum;
	identifier: BigNumberish;
	is_public: boolean;
}

// Type definition for `pistols::models::player::PlayerRequiredAction` struct
export interface PlayerRequiredAction {
	duelist_id: BigNumberish;
	duel_id: BigNumberish;
}

// Type definition for `pistols::models::player::PlayerRequiredActionValue` struct
export interface PlayerRequiredActionValue {
	duel_id: BigNumberish;
}

// Type definition for `pistols::models::duelist::CauseOfDeath` enum
export type CauseOfDeath = {
	None: string;
	Duelling: string;
	Memorize: string;
	Sacrifice: string;
	Forsaken: string;
}
export type CauseOfDeathEnum = CairoCustomEnum;

// Type definition for `pistols::models::pack::PackType` enum
export type PackType = {
	Unknown: string;
	StarterPack: string;
	Duelists5x: string;
}
export type PackTypeEnum = CairoCustomEnum;

// Type definition for `pistols::models::pool::PoolType` enum
export type PoolType = {
	Undefined: string;
	Purchases: string;
	FamePeg: string;
	Season: BigNumberish;
	Tournament: BigNumberish;
	SacredFlame: string;
}
export type PoolTypeEnum = CairoCustomEnum;

// Type definition for `pistols::models::season::SeasonPhase` enum
export type SeasonPhase = {
	Undefined: string;
	InProgress: string;
	Ended: string;
}
export type SeasonPhaseEnum = CairoCustomEnum;

// Type definition for `pistols::types::cards::blades::BladesCard` enum
export type BladesCard = {
	None: string;
	Seppuku: string;
	PocketPistol: string;
	Behead: string;
	Grapple: string;
}
export type BladesCardEnum = CairoCustomEnum;

// Type definition for `pistols::types::cards::hand::FinalBlow` enum
export type FinalBlow = {
	Undefined: string;
	Paces: PacesCardEnum;
	Blades: BladesCardEnum;
}
export type FinalBlowEnum = CairoCustomEnum;

// Type definition for `pistols::types::cards::paces::PacesCard` enum
export type PacesCard = {
	None: string;
	Paces1: string;
	Paces2: string;
	Paces3: string;
	Paces4: string;
	Paces5: string;
	Paces6: string;
	Paces7: string;
	Paces8: string;
	Paces9: string;
	Paces10: string;
}
export type PacesCardEnum = CairoCustomEnum;

// Type definition for `pistols::types::challenge_state::ChallengeState` enum
export type ChallengeState = {
	Null: string;
	Awaiting: string;
	Withdrawn: string;
	Refused: string;
	Expired: string;
	InProgress: string;
	Resolved: string;
	Draw: string;
}
export type ChallengeStateEnum = CairoCustomEnum;

// Type definition for `pistols::types::premise::Premise` enum
export type Premise = {
	Undefined: string;
	Matter: string;
	Debt: string;
	Dispute: string;
	Honour: string;
	Hatred: string;
	Blood: string;
	Nothing: string;
	Tournament: string;
	Treaty: string;
	Lesson: string;
}
export type PremiseEnum = CairoCustomEnum;

// Type definition for `pistols::types::profile_type::BotProfile` enum
export type BotProfile = {
	Unknown: string;
	TinMan: string;
	Scarecrow: string;
	Leon: string;
}
export type BotProfileEnum = CairoCustomEnum;

// Type definition for `pistols::types::profile_type::CharacterProfile` enum
export type CharacterProfile = {
	Unknown: string;
	Bartender: string;
	Drunkard: string;
	Devil: string;
	Player: string;
}
export type CharacterProfileEnum = CairoCustomEnum;

// Type definition for `pistols::types::profile_type::DuelistProfile` enum
export type DuelistProfile = {
	Unknown: string;
	Duke: string;
	Duella: string;
	Jameson: string;
	Pilgrim: string;
	Jack: string;
	Pops: string;
	SerWalker: string;
	Bloberto: string;
	Squiddo: string;
	SlenderDuck: string;
	LadyVengeance: string;
	Breadman: string;
	Brutus: string;
	Pistolopher: string;
	Secreto: string;
	ShadowMare: string;
	Karaku: string;
	Misty: string;
	Kenzu: string;
	NynJah: string;
	Thrak: string;
}
export type DuelistProfileEnum = CairoCustomEnum;

// Type definition for `pistols::types::profile_type::ProfileType` enum
export type ProfileType = {
	Undefined: string;
	Duelist: DuelistProfileEnum;
	Character: CharacterProfileEnum;
	Bot: BotProfileEnum;
}
export type ProfileTypeEnum = CairoCustomEnum;

// Type definition for `pistols::types::round_state::RoundState` enum
export type RoundState = {
	Null: string;
	Commit: string;
	Reveal: string;
	Finished: string;
}
export type RoundStateEnum = CairoCustomEnum;

// Type definition for `pistols::types::rules::RulesType` enum
export type RulesType = {
	Undefined: string;
	Academia: string;
	Season: string;
}
export type RulesTypeEnum = CairoCustomEnum;

// Type definition for `pistols::models::player::Activity` enum
export type Activity = {
	Undefined: string;
	TutorialFinished: string;
	PackStarter: string;
	PackPurchased: string;
	PackOpened: string;
	DuelistSpawned: string;
	DuelistDied: string;
	ChallengeCreated: string;
	ChallengeReplied: string;
	MovesCommitted: string;
	MovesRevealed: string;
	ChallengeResolved: string;
	ChallengeDraw: string;
}
export type ActivityEnum = CairoCustomEnum;

export interface SchemaType extends ISchemaType {
	pistols: {
		Challenge: Challenge,
		ChallengeValue: ChallengeValue,
		DuelistState: DuelistState,
		Moves: Moves,
		Round: Round,
		RoundValue: RoundValue,
		CoinConfig: CoinConfig,
		CoinConfigValue: CoinConfigValue,
		Config: Config,
		ConfigValue: ConfigValue,
		TokenConfig: TokenConfig,
		TokenConfigValue: TokenConfigValue,
		Duelist: Duelist,
		DuelistChallenge: DuelistChallenge,
		DuelistChallengeValue: DuelistChallengeValue,
		DuelistMemorial: DuelistMemorial,
		DuelistMemorialValue: DuelistMemorialValue,
		DuelistValue: DuelistValue,
		Score: Score,
		Scoreboard: Scoreboard,
		ScoreboardValue: ScoreboardValue,
		Leaderboard: Leaderboard,
		LeaderboardValue: LeaderboardValue,
		Pack: Pack,
		PackValue: PackValue,
		Pact: Pact,
		PactValue: PactValue,
		Player: Player,
		PlayerBookmark: PlayerBookmark,
		PlayerBookmarkValue: PlayerBookmarkValue,
		PlayerOnline: PlayerOnline,
		PlayerOnlineValue: PlayerOnlineValue,
		PlayerValue: PlayerValue,
		Pool: Pool,
		PoolValue: PoolValue,
		SeasonConfig: SeasonConfig,
		SeasonConfigValue: SeasonConfigValue,
		TableConfig: TableConfig,
		TableConfigValue: TableConfigValue,
		TokenBoundAddress: TokenBoundAddress,
		TokenBoundAddressValue: TokenBoundAddressValue,
		MockedValue: MockedValue,
		MockedValueValue: MockedValueValue,
	},
	achievement: {
		TrophyCreation: TrophyCreation,
		TrophyCreationValue: TrophyCreationValue,
		TrophyProgression: TrophyProgression,
		TrophyProgressionValue: TrophyProgressionValue,
		Task: Task,
		PlayerActivity: PlayerActivity,
		PlayerActivityValue: PlayerActivityValue,
		PlayerRequiredAction: PlayerRequiredAction,
		PlayerRequiredActionValue: PlayerRequiredActionValue,
	},
}
export const schema: SchemaType = {
	pistols: {
		Challenge: {
			duel_id: 0,
			table_id: 0,
		premise: new CairoCustomEnum({ 
					Undefined: "",
				Matter: undefined,
				Debt: undefined,
				Dispute: undefined,
				Honour: undefined,
				Hatred: undefined,
				Blood: undefined,
				Nothing: undefined,
				Tournament: undefined,
				Treaty: undefined,
				Lesson: undefined, }),
			quote: 0,
			lives_staked: 0,
			address_a: "",
			address_b: "",
			duelist_id_a: 0,
			duelist_id_b: 0,
		state: new CairoCustomEnum({ 
					Null: "",
				Awaiting: undefined,
				Withdrawn: undefined,
				Refused: undefined,
				Expired: undefined,
				InProgress: undefined,
				Resolved: undefined,
				Draw: undefined, }),
			winner: 0,
			timestamp_start: 0,
			timestamp_end: 0,
		},
		ChallengeValue: {
			table_id: 0,
		premise: new CairoCustomEnum({ 
					Undefined: "",
				Matter: undefined,
				Debt: undefined,
				Dispute: undefined,
				Honour: undefined,
				Hatred: undefined,
				Blood: undefined,
				Nothing: undefined,
				Tournament: undefined,
				Treaty: undefined,
				Lesson: undefined, }),
			quote: 0,
			lives_staked: 0,
			address_a: "",
			address_b: "",
			duelist_id_a: 0,
			duelist_id_b: 0,
		state: new CairoCustomEnum({ 
					Null: "",
				Awaiting: undefined,
				Withdrawn: undefined,
				Refused: undefined,
				Expired: undefined,
				InProgress: undefined,
				Resolved: undefined,
				Draw: undefined, }),
			winner: 0,
			timestamp_start: 0,
			timestamp_end: 0,
		},
		DuelistState: {
			chances: 0,
			damage: 0,
			health: 0,
			dice_fire: 0,
			honour: 0,
		},
		Moves: {
			salt: 0,
			hashed: 0,
			card_1: 0,
			card_2: 0,
			card_3: 0,
			card_4: 0,
		},
		Round: {
			duel_id: 0,
		moves_a: { salt: 0, hashed: 0, card_1: 0, card_2: 0, card_3: 0, card_4: 0, },
		moves_b: { salt: 0, hashed: 0, card_1: 0, card_2: 0, card_3: 0, card_4: 0, },
		state_a: { chances: 0, damage: 0, health: 0, dice_fire: 0, honour: 0, },
		state_b: { chances: 0, damage: 0, health: 0, dice_fire: 0, honour: 0, },
		state: new CairoCustomEnum({ 
					Null: "",
				Commit: undefined,
				Reveal: undefined,
				Finished: undefined, }),
		final_blow: new CairoCustomEnum({ 
					Undefined: "",
				Paces: undefined,
				Blades: undefined, }),
		},
		RoundValue: {
		moves_a: { salt: 0, hashed: 0, card_1: 0, card_2: 0, card_3: 0, card_4: 0, },
		moves_b: { salt: 0, hashed: 0, card_1: 0, card_2: 0, card_3: 0, card_4: 0, },
		state_a: { chances: 0, damage: 0, health: 0, dice_fire: 0, honour: 0, },
		state_b: { chances: 0, damage: 0, health: 0, dice_fire: 0, honour: 0, },
		state: new CairoCustomEnum({ 
					Null: "",
				Commit: undefined,
				Reveal: undefined,
				Finished: undefined, }),
		final_blow: new CairoCustomEnum({ 
					Undefined: "",
				Paces: undefined,
				Blades: undefined, }),
		},
		CoinConfig: {
			coin_address: "",
			minter_address: "",
			faucet_amount: 0,
		},
		CoinConfigValue: {
			minter_address: "",
			faucet_amount: 0,
		},
		Config: {
			key: 0,
			treasury_address: "",
			lords_address: "",
			vrf_address: "",
			season_table_id: 0,
			is_paused: false,
		},
		ConfigValue: {
			treasury_address: "",
			lords_address: "",
			vrf_address: "",
			season_table_id: 0,
			is_paused: false,
		},
		TokenConfig: {
			token_address: "",
			minter_address: "",
			renderer_address: "",
			minted_count: 0,
		},
		TokenConfigValue: {
			minter_address: "",
			renderer_address: "",
			minted_count: 0,
		},
		Duelist: {
			duelist_id: 0,
		profile_type: new CairoCustomEnum({ 
					Undefined: "",
				Duelist: undefined,
				Character: undefined,
				Bot: undefined, }),
			timestamp_registered: 0,
			timestamp_active: 0,
		},
		DuelistChallenge: {
			duelist_id: 0,
			duel_id: 0,
		},
		DuelistChallengeValue: {
			duel_id: 0,
		},
		DuelistMemorial: {
			duelist_id: 0,
		cause_of_death: new CairoCustomEnum({ 
					None: "",
				Duelling: undefined,
				Memorize: undefined,
				Sacrifice: undefined,
				Forsaken: undefined, }),
			killed_by: 0,
			fame_before_death: 0,
		},
		DuelistMemorialValue: {
		cause_of_death: new CairoCustomEnum({ 
					None: "",
				Duelling: undefined,
				Memorize: undefined,
				Sacrifice: undefined,
				Forsaken: undefined, }),
			killed_by: 0,
			fame_before_death: 0,
		},
		DuelistValue: {
		profile_type: new CairoCustomEnum({ 
					Undefined: "",
				Duelist: undefined,
				Character: undefined,
				Bot: undefined, }),
			timestamp_registered: 0,
			timestamp_active: 0,
		},
		Score: {
			honour: 0,
			points: 0,
			total_duels: 0,
			total_wins: 0,
			total_losses: 0,
			total_draws: 0,
			honour_history: 0,
		},
		Scoreboard: {
			holder: 0,
			table_id: 0,
		score: { honour: 0, points: 0, total_duels: 0, total_wins: 0, total_losses: 0, total_draws: 0, honour_history: 0, },
		},
		ScoreboardValue: {
		score: { honour: 0, points: 0, total_duels: 0, total_wins: 0, total_losses: 0, total_draws: 0, honour_history: 0, },
		},
		Leaderboard: {
			table_id: 0,
			positions: 0,
			duelist_ids: 0,
			scores: 0,
		},
		LeaderboardValue: {
			positions: 0,
			duelist_ids: 0,
			scores: 0,
		},
		Pack: {
			pack_id: 0,
		pack_type: new CairoCustomEnum({ 
					Unknown: "",
				StarterPack: undefined,
				Duelists5x: undefined, }),
			seed: 0,
			lords_amount: 0,
			is_open: false,
		},
		PackValue: {
		pack_type: new CairoCustomEnum({ 
					Unknown: "",
				StarterPack: undefined,
				Duelists5x: undefined, }),
			seed: 0,
			lords_amount: 0,
			is_open: false,
		},
		Pact: {
			table_id: 0,
			pair: 0,
			duel_id: 0,
		},
		PactValue: {
			duel_id: 0,
		},
		Player: {
			player_address: "",
			timestamp_registered: 0,
			claimed_starter_pack: false,
		},
		PlayerBookmark: {
			identity: "",
			target_address: "",
			target_id: 0,
			enabled: false,
		},
		PlayerBookmarkValue: {
			enabled: false,
		},
		PlayerOnline: {
			identity: "",
			timestamp: 0,
		},
		PlayerOnlineValue: {
			timestamp: 0,
		},
		PlayerValue: {
			timestamp_registered: 0,
			claimed_starter_pack: false,
		},
		Pool: {
		pool_id: new CairoCustomEnum({ 
					Undefined: "",
				Purchases: undefined,
				FamePeg: undefined,
				Season: undefined,
				Tournament: undefined,
				SacredFlame: undefined, }),
			balance_lords: 0,
			balance_fame: 0,
		},
		PoolValue: {
			balance_lords: 0,
			balance_fame: 0,
		},
		SeasonConfig: {
			table_id: 0,
			season_id: 0,
			timestamp_start: 0,
			timestamp_end: 0,
		phase: new CairoCustomEnum({ 
					Undefined: "",
				InProgress: undefined,
				Ended: undefined, }),
		},
		SeasonConfigValue: {
			season_id: 0,
			timestamp_start: 0,
			timestamp_end: 0,
		phase: new CairoCustomEnum({ 
					Undefined: "",
				InProgress: undefined,
				Ended: undefined, }),
		},
		TableConfig: {
			table_id: 0,
			description: 0,
		rules: new CairoCustomEnum({ 
					Undefined: "",
				Academia: undefined,
				Season: undefined, }),
		},
		TableConfigValue: {
			description: 0,
		rules: new CairoCustomEnum({ 
					Undefined: "",
				Academia: undefined,
				Season: undefined, }),
		},
		TokenBoundAddress: {
			recipient: "",
			contract_address: "",
			token_id: 0,
		},
		TokenBoundAddressValue: {
			contract_address: "",
			token_id: 0,
		},
		MockedValue: {
			salt: 0,
			value: 0,
			exists: false,
		},
		MockedValueValue: {
			value: 0,
			exists: false,
		},
		TrophyCreation: {
			id: 0,
			hidden: false,
			index: 0,
			points: 0,
			start: 0,
			end: 0,
			group: 0,
			icon: 0,
			title: 0,
		description: "",
			tasks: [{ id: 0, total: 0, description: "", }],
		data: "",
		},
		TrophyCreationValue: {
			hidden: false,
			index: 0,
			points: 0,
			start: 0,
			end: 0,
			group: 0,
			icon: 0,
			title: 0,
		description: "",
			tasks: [{ id: 0, total: 0, description: "", }],
		data: "",
		},
		TrophyProgression: {
			player_id: 0,
			task_id: 0,
			count: 0,
			time: 0,
		},
		TrophyProgressionValue: {
			count: 0,
			time: 0,
		},
		Task: {
			id: 0,
			total: 0,
		description: "",
		},
		PlayerActivity: {
			player_address: "",
			timestamp: 0,
		activity: new CairoCustomEnum({ 
					Undefined: "",
				TutorialFinished: undefined,
				PackStarter: undefined,
				PackPurchased: undefined,
				PackOpened: undefined,
				DuelistSpawned: undefined,
				DuelistDied: undefined,
				ChallengeCreated: undefined,
				ChallengeReplied: undefined,
				MovesCommitted: undefined,
				MovesRevealed: undefined,
				ChallengeResolved: undefined,
				ChallengeDraw: undefined, }),
			identifier: 0,
			is_public: false,
		},
		PlayerActivityValue: {
			timestamp: 0,
		activity: new CairoCustomEnum({ 
					Undefined: "",
				TutorialFinished: undefined,
				PackStarter: undefined,
				PackPurchased: undefined,
				PackOpened: undefined,
				DuelistSpawned: undefined,
				DuelistDied: undefined,
				ChallengeCreated: undefined,
				ChallengeReplied: undefined,
				MovesCommitted: undefined,
				MovesRevealed: undefined,
				ChallengeResolved: undefined,
				ChallengeDraw: undefined, }),
			identifier: 0,
			is_public: false,
		},
		PlayerRequiredAction: {
			duelist_id: 0,
			duel_id: 0,
		},
		PlayerRequiredActionValue: {
			duel_id: 0,
		},
	},
};
export enum ModelsMapping {
	Challenge = 'pistols-Challenge',
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
	CauseOfDeath = 'pistols-CauseOfDeath',
	Duelist = 'pistols-Duelist',
	DuelistChallenge = 'pistols-DuelistChallenge',
	DuelistChallengeValue = 'pistols-DuelistChallengeValue',
	DuelistMemorial = 'pistols-DuelistMemorial',
	DuelistMemorialValue = 'pistols-DuelistMemorialValue',
	DuelistValue = 'pistols-DuelistValue',
	Score = 'pistols-Score',
	Scoreboard = 'pistols-Scoreboard',
	ScoreboardValue = 'pistols-ScoreboardValue',
	Leaderboard = 'pistols-Leaderboard',
	LeaderboardValue = 'pistols-LeaderboardValue',
	Pack = 'pistols-Pack',
	PackType = 'pistols-PackType',
	PackValue = 'pistols-PackValue',
	Pact = 'pistols-Pact',
	PactValue = 'pistols-PactValue',
	Player = 'pistols-Player',
	PlayerBookmark = 'pistols-PlayerBookmark',
	PlayerBookmarkValue = 'pistols-PlayerBookmarkValue',
	PlayerOnline = 'pistols-PlayerOnline',
	PlayerOnlineValue = 'pistols-PlayerOnlineValue',
	PlayerValue = 'pistols-PlayerValue',
	Pool = 'pistols-Pool',
	PoolType = 'pistols-PoolType',
	PoolValue = 'pistols-PoolValue',
	SeasonConfig = 'pistols-SeasonConfig',
	SeasonConfigValue = 'pistols-SeasonConfigValue',
	SeasonPhase = 'pistols-SeasonPhase',
	TableConfig = 'pistols-TableConfig',
	TableConfigValue = 'pistols-TableConfigValue',
	TokenBoundAddress = 'pistols-TokenBoundAddress',
	TokenBoundAddressValue = 'pistols-TokenBoundAddressValue',
	MockedValue = 'pistols-MockedValue',
	MockedValueValue = 'pistols-MockedValueValue',
	BladesCard = 'pistols-BladesCard',
	FinalBlow = 'pistols-FinalBlow',
	PacesCard = 'pistols-PacesCard',
	ChallengeState = 'pistols-ChallengeState',
	Premise = 'pistols-Premise',
	BotProfile = 'pistols-BotProfile',
	CharacterProfile = 'pistols-CharacterProfile',
	DuelistProfile = 'pistols-DuelistProfile',
	ProfileType = 'pistols-ProfileType',
	RoundState = 'pistols-RoundState',
	RulesType = 'pistols-RulesType',
	TrophyCreation = 'achievement-TrophyCreation',
	TrophyCreationValue = 'achievement-TrophyCreationValue',
	TrophyProgression = 'achievement-TrophyProgression',
	TrophyProgressionValue = 'achievement-TrophyProgressionValue',
	Task = 'achievement-Task',
	Activity = 'pistols-Activity',
	PlayerActivity = 'pistols-PlayerActivity',
	PlayerActivityValue = 'pistols-PlayerActivityValue',
	PlayerRequiredAction = 'pistols-PlayerRequiredAction',
	PlayerRequiredActionValue = 'pistols-PlayerRequiredActionValue',
}