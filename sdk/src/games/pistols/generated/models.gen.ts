import type { SchemaType as ISchemaType } from "@dojoengine/sdk";

import { CairoCustomEnum, BigNumberish } from 'starknet';

type WithFieldOrder<T> = T & { fieldOrder: string[] };

// Type definition for `pistols::models::challenge::Challenge` struct
export interface Challenge {
	duel_id: BigNumberish;
	table_id: BigNumberish;
	premise: PremiseEnum;
	quote: BigNumberish;
	address_a: string;
	address_b: string;
	duelist_id_a: BigNumberish;
	duelist_id_b: BigNumberish;
	state: ChallengeStateEnum;
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
	premise: PremiseEnum;
	quote: BigNumberish;
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
	holder: BigNumberish;
	score: Score;
}

// Type definition for `pistols::models::duelist::ScoreboardTable` struct
export interface ScoreboardTable {
	holder: BigNumberish;
	table_id: BigNumberish;
	score: Score;
}

// Type definition for `pistols::models::duelist::ScoreboardTableValue` struct
export interface ScoreboardTableValue {
	score: Score;
}

// Type definition for `pistols::models::duelist::ScoreboardValue` struct
export interface ScoreboardValue {
	score: Score;
}

// Type definition for `pistols::models::pack::Pack` struct
export interface Pack {
	pack_id: BigNumberish;
	pack_type: PackTypeEnum;
	seed: BigNumberish;
	is_open: boolean;
}

// Type definition for `pistols::models::pack::PackValue` struct
export interface PackValue {
	pack_type: PackTypeEnum;
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

// Type definition for `pistols::models::player::Player` struct
export interface Player {
	player_address: string;
	timestamp_registered: BigNumberish;
	claimed_welcome_pack: boolean;
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

// Type definition for `pistols::models::player::PlayerTutorialProgress` struct
export interface PlayerTutorialProgress {
	identity: string;
	progress: TutorialProgressEnum;
}

// Type definition for `pistols::models::player::PlayerTutorialProgressValue` struct
export interface PlayerTutorialProgressValue {
	progress: TutorialProgressEnum;
}

// Type definition for `pistols::models::player::PlayerValue` struct
export interface PlayerValue {
	timestamp_registered: BigNumberish;
	claimed_welcome_pack: boolean;
}

// Type definition for `pistols::models::table::TableConfig` struct
export interface TableConfig {
	table_id: BigNumberish;
	description: BigNumberish;
	table_type: TableTypeEnum;
	deck_type: DeckTypeEnum;
	fee_collector_address: string;
	fee_min: BigNumberish;
	is_open: boolean;
}

// Type definition for `pistols::models::table::TableConfigValue` struct
export interface TableConfigValue {
	description: BigNumberish;
	table_type: TableTypeEnum;
	deck_type: DeckTypeEnum;
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

// Type definition for `pistols::models::pack::PackType` enum
export type PackType = {
	Unknown: string;
	WelcomePack: string;
	Duelists5x: string;
}
export type PackTypeEnum = CairoCustomEnum;

// Type definition for `pistols::models::player::TutorialProgress` enum
export type TutorialProgress = {
	None: string;
	FinishedFirst: string;
	FinishedSecond: string;
	FinishedFirstDuel: string;
}
export type TutorialProgressEnum = CairoCustomEnum;

// Type definition for `pistols::models::table::TableType` enum
export type TableType = {
	Undefined: string;
	Classic: string;
	Tournament: string;
	IRLTournament: string;
}
export type TableTypeEnum = CairoCustomEnum;

// Type definition for `pistols::types::cards::blades::BladesCard` enum
export type BladesCard = {
	None: string;
	Seppuku: string;
	PocketPistol: string;
	Behead: string;
	Grapple: string;
}
export type BladesCardEnum = CairoCustomEnum;

// Type definition for `pistols::types::cards::hand::DeckType` enum
export type DeckType = {
	None: string;
	Classic: string;
}
export type DeckTypeEnum = CairoCustomEnum;

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
}
export type PremiseEnum = CairoCustomEnum;

// Type definition for `pistols::types::profile_type::BotProfile` enum
export type BotProfile = {
	Unknown: string;
	Scarecrow: string;
	TinMan: string;
}
export type BotProfileEnum = CairoCustomEnum;

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

// Type definition for `pistols::models::player::Activity` enum
export type Activity = {
	Undefined: string;
	StartedTutorial: string;
	FinishedTutorial: string;
	WelcomePack: string;
	PurchasedPack: string;
	CreatedDuelist: string;
	CreatedChallenge: string;
	RepliedChallenge: string;
	CommittedMoves: string;
	RevealedMoves: string;
	Achievement: string;
}
export type ActivityEnum = CairoCustomEnum;

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
		ScoreboardTable: WithFieldOrder<ScoreboardTable>,
		ScoreboardTableValue: WithFieldOrder<ScoreboardTableValue>,
		ScoreboardValue: WithFieldOrder<ScoreboardValue>,
		Pack: WithFieldOrder<Pack>,
		PackValue: WithFieldOrder<PackValue>,
		Pact: WithFieldOrder<Pact>,
		PactValue: WithFieldOrder<PactValue>,
		Payment: WithFieldOrder<Payment>,
		PaymentValue: WithFieldOrder<PaymentValue>,
		Player: WithFieldOrder<Player>,
		PlayerBookmark: WithFieldOrder<PlayerBookmark>,
		PlayerBookmarkValue: WithFieldOrder<PlayerBookmarkValue>,
		PlayerOnline: WithFieldOrder<PlayerOnline>,
		PlayerOnlineValue: WithFieldOrder<PlayerOnlineValue>,
		PlayerTutorialProgress: WithFieldOrder<PlayerTutorialProgress>,
		PlayerTutorialProgressValue: WithFieldOrder<PlayerTutorialProgressValue>,
		PlayerValue: WithFieldOrder<PlayerValue>,
		TableConfig: WithFieldOrder<TableConfig>,
		TableConfigValue: WithFieldOrder<TableConfigValue>,
		TokenBoundAddress: WithFieldOrder<TokenBoundAddress>,
		TokenBoundAddressValue: WithFieldOrder<TokenBoundAddressValue>,
		TrophyCreation: WithFieldOrder<TrophyCreation>,
		TrophyCreationValue: WithFieldOrder<TrophyCreationValue>,
		TrophyProgression: WithFieldOrder<TrophyProgression>,
		TrophyProgressionValue: WithFieldOrder<TrophyProgressionValue>,
		Task: WithFieldOrder<Task>,
		PlayerActivity: WithFieldOrder<PlayerActivity>,
		PlayerActivityValue: WithFieldOrder<PlayerActivityValue>,
		PlayerRequiredAction: WithFieldOrder<PlayerRequiredAction>,
		PlayerRequiredActionValue: WithFieldOrder<PlayerRequiredActionValue>,
	},
}
export const schema: SchemaType = {
	pistols: {
		Challenge: {
			fieldOrder: ['duel_id', 'table_id', 'premise', 'quote', 'address_a', 'address_b', 'duelist_id_a', 'duelist_id_b', 'state', 'winner', 'timestamp_start', 'timestamp_end'],
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
				Tournament: undefined, }),
			quote: 0,
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
		premise: new CairoCustomEnum({ 
					Undefined: "",
				Matter: undefined,
				Debt: undefined,
				Dispute: undefined,
				Honour: undefined,
				Hatred: undefined,
				Blood: undefined,
				Nothing: undefined,
				Tournament: undefined, }),
			quote: 0,
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
			fieldOrder: ['moves_a', 'moves_b', 'state_a', 'state_b', 'state', 'final_blow'],
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
			fieldOrder: ['duelist_id', 'profile_type', 'timestamp'],
			duelist_id: 0,
		profile_type: new CairoCustomEnum({ 
					Undefined: "",
				Duelist: undefined,
				Bot: undefined, }),
			timestamp: 0,
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
			fieldOrder: ['profile_type', 'timestamp'],
		profile_type: new CairoCustomEnum({ 
					Undefined: "",
				Duelist: undefined,
				Bot: undefined, }),
			timestamp: 0,
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
			fieldOrder: ['holder', 'score'],
			holder: 0,
		score: { honour: 0, total_duels: 0, total_wins: 0, total_losses: 0, total_draws: 0, honour_history: 0, },
		},
		ScoreboardTable: {
			fieldOrder: ['holder', 'table_id', 'score'],
			holder: 0,
			table_id: 0,
		score: { honour: 0, total_duels: 0, total_wins: 0, total_losses: 0, total_draws: 0, honour_history: 0, },
		},
		ScoreboardTableValue: {
			fieldOrder: ['score'],
		score: { honour: 0, total_duels: 0, total_wins: 0, total_losses: 0, total_draws: 0, honour_history: 0, },
		},
		ScoreboardValue: {
			fieldOrder: ['score'],
		score: { honour: 0, total_duels: 0, total_wins: 0, total_losses: 0, total_draws: 0, honour_history: 0, },
		},
		Pack: {
			fieldOrder: ['pack_id', 'pack_type', 'seed', 'is_open'],
			pack_id: 0,
		pack_type: new CairoCustomEnum({ 
					Unknown: "",
				WelcomePack: undefined,
				Duelists5x: undefined, }),
			seed: 0,
			is_open: false,
		},
		PackValue: {
			fieldOrder: ['pack_type', 'seed', 'is_open'],
		pack_type: new CairoCustomEnum({ 
					Unknown: "",
				WelcomePack: undefined,
				Duelists5x: undefined, }),
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
		Player: {
			fieldOrder: ['player_address', 'timestamp_registered', 'claimed_welcome_pack'],
			player_address: "",
			timestamp_registered: 0,
			claimed_welcome_pack: false,
		},
		PlayerBookmark: {
			fieldOrder: ['identity', 'target_address', 'target_id', 'enabled'],
			identity: "",
			target_address: "",
			target_id: 0,
			enabled: false,
		},
		PlayerBookmarkValue: {
			fieldOrder: ['enabled'],
			enabled: false,
		},
		PlayerOnline: {
			fieldOrder: ['identity', 'timestamp'],
			identity: "",
			timestamp: 0,
		},
		PlayerOnlineValue: {
			fieldOrder: ['timestamp'],
			timestamp: 0,
		},
		PlayerTutorialProgress: {
			fieldOrder: ['identity', 'progress'],
			identity: "",
		progress: new CairoCustomEnum({ 
					None: "",
				FinishedFirst: undefined,
				FinishedSecond: undefined,
				FinishedFirstDuel: undefined, }),
		},
		PlayerTutorialProgressValue: {
			fieldOrder: ['progress'],
		progress: new CairoCustomEnum({ 
					None: "",
				FinishedFirst: undefined,
				FinishedSecond: undefined,
				FinishedFirstDuel: undefined, }),
		},
		PlayerValue: {
			fieldOrder: ['timestamp_registered', 'claimed_welcome_pack'],
			timestamp_registered: 0,
			claimed_welcome_pack: false,
		},
		TableConfig: {
			fieldOrder: ['table_id', 'description', 'table_type', 'deck_type', 'fee_collector_address', 'fee_min', 'is_open'],
			table_id: 0,
			description: 0,
		table_type: new CairoCustomEnum({ 
					Undefined: "",
				Classic: undefined,
				Tournament: undefined,
				IRLTournament: undefined, }),
		deck_type: new CairoCustomEnum({ 
					None: "",
				Classic: undefined, }),
			fee_collector_address: "",
			fee_min: 0,
			is_open: false,
		},
		TableConfigValue: {
			fieldOrder: ['description', 'table_type', 'deck_type', 'fee_collector_address', 'fee_min', 'is_open'],
			description: 0,
		table_type: new CairoCustomEnum({ 
					Undefined: "",
				Classic: undefined,
				Tournament: undefined,
				IRLTournament: undefined, }),
		deck_type: new CairoCustomEnum({ 
					None: "",
				Classic: undefined, }),
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
		TrophyCreation: {
			fieldOrder: ['id', 'hidden', 'index', 'points', 'start', 'end', 'group', 'icon', 'title', 'description', 'tasks', 'data'],
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
			fieldOrder: ['hidden', 'index', 'points', 'start', 'end', 'group', 'icon', 'title', 'description', 'tasks', 'data'],
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
			fieldOrder: ['player_id', 'task_id', 'count', 'time'],
			player_id: 0,
			task_id: 0,
			count: 0,
			time: 0,
		},
		TrophyProgressionValue: {
			fieldOrder: ['count', 'time'],
			count: 0,
			time: 0,
		},
		Task: {
			fieldOrder: ['id', 'total', 'description'],
			id: 0,
			total: 0,
		description: "",
		},
		PlayerActivity: {
			fieldOrder: ['player_address', 'timestamp', 'activity', 'identifier', 'is_public'],
			player_address: "",
			timestamp: 0,
		activity: new CairoCustomEnum({ 
					Undefined: "",
				StartedTutorial: undefined,
				FinishedTutorial: undefined,
				WelcomePack: undefined,
				PurchasedPack: undefined,
				CreatedDuelist: undefined,
				CreatedChallenge: undefined,
				RepliedChallenge: undefined,
				CommittedMoves: undefined,
				RevealedMoves: undefined,
				Achievement: undefined, }),
			identifier: 0,
			is_public: false,
		},
		PlayerActivityValue: {
			fieldOrder: ['timestamp', 'activity', 'identifier', 'is_public'],
			timestamp: 0,
		activity: new CairoCustomEnum({ 
					Undefined: "",
				StartedTutorial: undefined,
				FinishedTutorial: undefined,
				WelcomePack: undefined,
				PurchasedPack: undefined,
				CreatedDuelist: undefined,
				CreatedChallenge: undefined,
				RepliedChallenge: undefined,
				CommittedMoves: undefined,
				RevealedMoves: undefined,
				Achievement: undefined, }),
			identifier: 0,
			is_public: false,
		},
		PlayerRequiredAction: {
			fieldOrder: ['duelist_id', 'duel_id'],
			duelist_id: 0,
			duel_id: 0,
		},
		PlayerRequiredActionValue: {
			fieldOrder: ['duel_id'],
			duel_id: 0,
		},
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
	ScoreboardTable = 'pistols-ScoreboardTable',
	ScoreboardTableValue = 'pistols-ScoreboardTableValue',
	ScoreboardValue = 'pistols-ScoreboardValue',
	Pack = 'pistols-Pack',
	PackType = 'pistols-PackType',
	PackValue = 'pistols-PackValue',
	Pact = 'pistols-Pact',
	PactValue = 'pistols-PactValue',
	Payment = 'pistols-Payment',
	PaymentValue = 'pistols-PaymentValue',
	Player = 'pistols-Player',
	PlayerBookmark = 'pistols-PlayerBookmark',
	PlayerBookmarkValue = 'pistols-PlayerBookmarkValue',
	PlayerOnline = 'pistols-PlayerOnline',
	PlayerOnlineValue = 'pistols-PlayerOnlineValue',
	PlayerTutorialProgress = 'pistols-PlayerTutorialProgress',
	PlayerTutorialProgressValue = 'pistols-PlayerTutorialProgressValue',
	PlayerValue = 'pistols-PlayerValue',
	TutorialProgress = 'pistols-TutorialProgress',
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