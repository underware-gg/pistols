import type { SchemaType as ISchemaType } from "@dojoengine/sdk";

import { CairoCustomEnum, BigNumberish } from 'starknet';

// Type definition for `pistols::models::challenge::Challenge` struct
export interface Challenge {
	duel_id: BigNumberish;
	duel_type: DuelTypeEnum;
	premise: PremiseEnum;
	lives_staked: BigNumberish;
	address_a: string;
	address_b: string;
	duelist_id_a: BigNumberish;
	duelist_id_b: BigNumberish;
	state: ChallengeStateEnum;
	season_id: BigNumberish;
	winner: BigNumberish;
	timestamps: Period;
}

// Type definition for `pistols::models::challenge::ChallengeMessage` struct
export interface ChallengeMessage {
	duel_id: BigNumberish;
	message: string;
}

// Type definition for `pistols::models::challenge::ChallengeMessageValue` struct
export interface ChallengeMessageValue {
	message: string;
}

// Type definition for `pistols::models::challenge::ChallengeValue` struct
export interface ChallengeValue {
	duel_type: DuelTypeEnum;
	premise: PremiseEnum;
	lives_staked: BigNumberish;
	address_a: string;
	address_b: string;
	duelist_id_a: BigNumberish;
	duelist_id_b: BigNumberish;
	state: ChallengeStateEnum;
	season_id: BigNumberish;
	winner: BigNumberish;
	timestamps: Period;
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
	timeout: BigNumberish;
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
	current_season_id: BigNumberish;
	is_paused: boolean;
}

// Type definition for `pistols::models::config::ConfigValue` struct
export interface ConfigValue {
	treasury_address: string;
	lords_address: string;
	vrf_address: string;
	current_season_id: BigNumberish;
	is_paused: boolean;
}

// Type definition for `pistols::models::config::TokenConfig` struct
export interface TokenConfig {
	token_address: string;
	minter_address: string;
	minted_count: BigNumberish;
}

// Type definition for `pistols::models::config::TokenConfigValue` struct
export interface TokenConfigValue {
	minter_address: string;
	minted_count: BigNumberish;
}

// Type definition for `pistols::models::duelist::Duelist` struct
export interface Duelist {
	duelist_id: BigNumberish;
	duelist_profile: DuelistProfileEnum;
	timestamps: DuelistTimestamps;
	totals: Totals;
}

// Type definition for `pistols::models::duelist::DuelistAssignment` struct
export interface DuelistAssignment {
	duelist_id: BigNumberish;
	duel_id: BigNumberish;
	pass_id: BigNumberish;
}

// Type definition for `pistols::models::duelist::DuelistAssignmentValue` struct
export interface DuelistAssignmentValue {
	duel_id: BigNumberish;
	pass_id: BigNumberish;
}

// Type definition for `pistols::models::duelist::DuelistMemorial` struct
export interface DuelistMemorial {
	duelist_id: BigNumberish;
	cause_of_death: CauseOfDeathEnum;
	killed_by: BigNumberish;
	fame_before_death: BigNumberish;
	player_address: string;
	season_id: BigNumberish;
}

// Type definition for `pistols::models::duelist::DuelistMemorialValue` struct
export interface DuelistMemorialValue {
	cause_of_death: CauseOfDeathEnum;
	killed_by: BigNumberish;
	fame_before_death: BigNumberish;
	player_address: string;
	season_id: BigNumberish;
}

// Type definition for `pistols::models::duelist::DuelistTimestamps` struct
export interface DuelistTimestamps {
	registered: BigNumberish;
	active: BigNumberish;
}

// Type definition for `pistols::models::duelist::DuelistValue` struct
export interface DuelistValue {
	duelist_profile: DuelistProfileEnum;
	timestamps: DuelistTimestamps;
	totals: Totals;
}

// Type definition for `pistols::models::duelist::Totals` struct
export interface Totals {
	total_duels: BigNumberish;
	total_wins: BigNumberish;
	total_losses: BigNumberish;
	total_draws: BigNumberish;
	honour: BigNumberish;
	honour_log: BigNumberish;
}

// Type definition for `pistols::models::leaderboard::Leaderboard` struct
export interface Leaderboard {
	season_id: BigNumberish;
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
	duel_type: DuelTypeEnum;
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
	timestamps: PlayerTimestamps;
	totals: Totals;
	alive_duelist_count: BigNumberish;
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

// Type definition for `pistols::models::player::PlayerDuelistStack` struct
export interface PlayerDuelistStack {
	player_address: string;
	duelist_profile: DuelistProfileEnum;
	active_duelist_id: BigNumberish;
	level: BigNumberish;
	stacked_ids: Array<BigNumberish>;
}

// Type definition for `pistols::models::player::PlayerDuelistStackValue` struct
export interface PlayerDuelistStackValue {
	active_duelist_id: BigNumberish;
	level: BigNumberish;
	stacked_ids: Array<BigNumberish>;
}

// Type definition for `pistols::models::player::PlayerFlags` struct
export interface PlayerFlags {
	player_address: string;
	is_blocked: boolean;
}

// Type definition for `pistols::models::player::PlayerFlagsValue` struct
export interface PlayerFlagsValue {
	is_blocked: boolean;
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

// Type definition for `pistols::models::player::PlayerTeamFlags` struct
export interface PlayerTeamFlags {
	player_address: string;
	is_team_member: boolean;
	is_admin: boolean;
}

// Type definition for `pistols::models::player::PlayerTeamFlagsValue` struct
export interface PlayerTeamFlagsValue {
	is_team_member: boolean;
	is_admin: boolean;
}

// Type definition for `pistols::models::player::PlayerTimestamps` struct
export interface PlayerTimestamps {
	registered: BigNumberish;
	claimed_gift: BigNumberish;
	claimed_starter_pack: boolean;
}

// Type definition for `pistols::models::player::PlayerValue` struct
export interface PlayerValue {
	timestamps: PlayerTimestamps;
	totals: Totals;
	alive_duelist_count: BigNumberish;
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
	season_id: BigNumberish;
	rules: RulesEnum;
	phase: SeasonPhaseEnum;
	period: Period;
}

// Type definition for `pistols::models::season::SeasonConfigValue` struct
export interface SeasonConfigValue {
	rules: RulesEnum;
	phase: SeasonPhaseEnum;
	period: Period;
}

// Type definition for `pistols::models::season::SeasonScoreboard` struct
export interface SeasonScoreboard {
	season_id: BigNumberish;
	holder: BigNumberish;
	points: BigNumberish;
}

// Type definition for `pistols::models::season::SeasonScoreboardValue` struct
export interface SeasonScoreboardValue {
	points: BigNumberish;
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

// Type definition for `pistols::types::timestamp::Period` struct
export interface Period {
	start: BigNumberish;
	end: BigNumberish;
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

// Type definition for `pistols::models::events::CallToActionEvent` struct
export interface CallToActionEvent {
	player_address: string;
	duelist_id: BigNumberish;
	duel_id: BigNumberish;
	call_to_action: boolean;
	timestamp: BigNumberish;
}

// Type definition for `pistols::models::events::CallToActionEventValue` struct
export interface CallToActionEventValue {
	duel_id: BigNumberish;
	call_to_action: boolean;
	timestamp: BigNumberish;
}

// Type definition for `pistols::models::events::ChallengeRewardsEvent` struct
export interface ChallengeRewardsEvent {
	duel_id: BigNumberish;
	duelist_id: BigNumberish;
	rewards: RewardValues;
}

// Type definition for `pistols::models::events::ChallengeRewardsEventValue` struct
export interface ChallengeRewardsEventValue {
	rewards: RewardValues;
}

// Type definition for `pistols::models::events::LordsReleaseEvent` struct
export interface LordsReleaseEvent {
	season_id: BigNumberish;
	bill: LordsReleaseBill;
	duel_id: BigNumberish;
	timestamp: BigNumberish;
}

// Type definition for `pistols::models::events::LordsReleaseEventValue` struct
export interface LordsReleaseEventValue {
	bill: LordsReleaseBill;
	duel_id: BigNumberish;
	timestamp: BigNumberish;
}

// Type definition for `pistols::models::events::PlayerActivityEvent` struct
export interface PlayerActivityEvent {
	player_address: string;
	timestamp: BigNumberish;
	activity: ActivityEnum;
	identifier: BigNumberish;
	is_public: boolean;
}

// Type definition for `pistols::models::events::PlayerActivityEventValue` struct
export interface PlayerActivityEventValue {
	timestamp: BigNumberish;
	activity: ActivityEnum;
	identifier: BigNumberish;
	is_public: boolean;
}

// Type definition for `pistols::models::pool::LordsReleaseBill` struct
export interface LordsReleaseBill {
	reason: ReleaseReasonEnum;
	duelist_id: BigNumberish;
	recipient: string;
	pegged_fame: BigNumberish;
	pegged_lords: BigNumberish;
	sponsored_lords: BigNumberish;
}

// Type definition for `pistols::types::rules::RewardValues` struct
export interface RewardValues {
	fame_lost: BigNumberish;
	fame_gained: BigNumberish;
	fools_gained: BigNumberish;
	points_scored: BigNumberish;
	position: BigNumberish;
	fame_burned: BigNumberish;
	lords_unlocked: BigNumberish;
	survived: boolean;
}

// Type definition for `pistols::models::challenge::DuelType` enum
export const duelType = [
	'Undefined',
	'Seasonal',
	'Tournament',
	'Tutorial',
	'Practice',
] as const;
export type DuelType = { [key in typeof duelType[number]]: string };
export type DuelTypeEnum = CairoCustomEnum;

// Type definition for `pistols::models::duelist::CauseOfDeath` enum
export const causeOfDeath = [
	'None',
	'Duelling',
	'Memorize',
	'Sacrifice',
	'Forsaken',
] as const;
export type CauseOfDeath = { [key in typeof causeOfDeath[number]]: string };
export type CauseOfDeathEnum = CairoCustomEnum;

// Type definition for `pistols::models::pack::PackType` enum
export const packType = [
	'Unknown',
	'StarterPack',
	'GenesisDuelists5x',
	'FreeDuelist',
] as const;
export type PackType = { [key in typeof packType[number]]: string };
export type PackTypeEnum = CairoCustomEnum;

// Type definition for `pistols::models::pool::PoolType` enum
export const poolType = [
	'Undefined',
	'Purchases',
	'FamePeg',
	'Season',
	'Tournament',
	'Sacrifice',
] as const;
export type PoolType = { [key in typeof poolType[number]]: string };
export type PoolTypeEnum = CairoCustomEnum;

// Type definition for `pistols::models::season::SeasonPhase` enum
export const seasonPhase = [
	'Undefined',
	'InProgress',
	'Ended',
] as const;
export type SeasonPhase = { [key in typeof seasonPhase[number]]: string };
export type SeasonPhaseEnum = CairoCustomEnum;

// Type definition for `pistols::types::cards::blades::BladesCard` enum
export const bladesCard = [
	'None',
	'Seppuku',
	'PocketPistol',
	'Behead',
	'Grapple',
] as const;
export type BladesCard = { [key in typeof bladesCard[number]]: string };
export type BladesCardEnum = CairoCustomEnum;

// Type definition for `pistols::types::cards::hand::FinalBlow` enum
export const finalBlow = [
	'Undefined',
	'Paces',
	'Blades',
	'Forsaken',
	'Unpaired',
] as const;
export type FinalBlow = { 
	Undefined: string,
	Paces: PacesCardEnum,
	Blades: BladesCardEnum,
	Forsaken: string,
	Unpaired: string,
};
export type FinalBlowEnum = CairoCustomEnum;

// Type definition for `pistols::types::cards::paces::PacesCard` enum
export const pacesCard = [
	'None',
	'Paces1',
	'Paces2',
	'Paces3',
	'Paces4',
	'Paces5',
	'Paces6',
	'Paces7',
	'Paces8',
	'Paces9',
	'Paces10',
] as const;
export type PacesCard = { [key in typeof pacesCard[number]]: string };
export type PacesCardEnum = CairoCustomEnum;

// Type definition for `pistols::types::challenge_state::ChallengeState` enum
export const challengeState = [
	'Null',
	'Awaiting',
	'Withdrawn',
	'Refused',
	'Expired',
	'InProgress',
	'Resolved',
	'Draw',
] as const;
export type ChallengeState = { [key in typeof challengeState[number]]: string };
export type ChallengeStateEnum = CairoCustomEnum;

// Type definition for `pistols::types::duelist_profile::BotKey` enum
export const botKey = [
	'Unknown',
	'TinMan',
	'Scarecrow',
	'Leon',
] as const;
export type BotKey = { [key in typeof botKey[number]]: string };
export type BotKeyEnum = CairoCustomEnum;

// Type definition for `pistols::types::duelist_profile::CharacterKey` enum
export const characterKey = [
	'Unknown',
	'Bartender',
	'Drunkard',
	'Devil',
	'Player',
] as const;
export type CharacterKey = { [key in typeof characterKey[number]]: string };
export type CharacterKeyEnum = CairoCustomEnum;

// Type definition for `pistols::types::duelist_profile::DuelistProfile` enum
export const duelistProfile = [
	'Undefined',
	'Character',
	'Bot',
	'Genesis',
] as const;
export type DuelistProfile = { 
	Undefined: string,
	Character: CharacterKeyEnum,
	Bot: BotKeyEnum,
	Genesis: GenesisKeyEnum,
};
export type DuelistProfileEnum = CairoCustomEnum;

// Type definition for `pistols::types::duelist_profile::GenesisKey` enum
export const genesisKey = [
	'Unknown',
	'SerWalker',
	'LadyVengeance',
	'Duke',
	'Duella',
	'Jameson',
	'Misty',
	'Karaku',
	'Kenzu',
	'Pilgrim',
	'Jack',
	'Pops',
	'NynJah',
	'Thrak',
	'Bloberto',
	'Squiddo',
	'SlenderDuck',
	'Breadman',
	'Groggus',
	'Pistolopher',
	'Secreto',
	'ShadowMare',
	'Fjolnir',
	'ChimpDylan',
	'Hinata',
	'HelixVex',
	'BuccaneerJames',
	'TheSensei',
	'SenseiTarrence',
	'ThePainter',
	'Ashe',
	'SerGogi',
	'TheSurvivor',
	'TheFrenchman',
	'SerFocger',
	'SillySosij',
	'BloodBeard',
	'Fredison',
	'TheBard',
	'Ponzimancer',
	'DealerTani',
	'SerRichard',
	'Recipromancer',
	'Mataleone',
	'FortunaRegem',
	'Amaro',
	'Mononoke',
	'Parsa',
	'Jubilee',
	'LadyOfCrows',
	'BananaDuke',
	'LordGladstone',
	'LadyStrokes',
	'Bliss',
	'StormMirror',
	'Aldreda',
	'Petronella',
	'SeraphinaRose',
	'LucienDeSombrel',
	'FyernVirelock',
	'Noir',
	'QueenAce',
	'JoshPeel',
	'IronHandRogan',
	'GoodPupStarky',
	'ImyaSuspect',
	'TheAlchemist',
	'PonziusPilate',
	'MistressNoodle',
	'MasterOfSecrets',
] as const;
export type GenesisKey = { [key in typeof genesisKey[number]]: string };
export type GenesisKeyEnum = CairoCustomEnum;

// Type definition for `pistols::types::premise::Premise` enum
export const premise = [
	'Undefined',
	'Matter',
	'Debt',
	'Dispute',
	'Honour',
	'Hatred',
	'Blood',
	'Nothing',
	'Tournament',
	'Treaty',
	'Lesson',
] as const;
export type Premise = { [key in typeof premise[number]]: string };
export type PremiseEnum = CairoCustomEnum;

// Type definition for `pistols::types::round_state::RoundState` enum
export const roundState = [
	'Null',
	'Commit',
	'Reveal',
	'Finished',
] as const;
export type RoundState = { [key in typeof roundState[number]]: string };
export type RoundStateEnum = CairoCustomEnum;

// Type definition for `pistols::types::rules::Rules` enum
export const rules = [
	'Undefined',
	'Season',
] as const;
export type Rules = { [key in typeof rules[number]]: string };
export type RulesEnum = CairoCustomEnum;

// Type definition for `pistols::models::events::Activity` enum
export const activity = [
	'Undefined',
	'TutorialFinished',
	'PackStarter',
	'PackPurchased',
	'PackOpened',
	'DuelistSpawned',
	'DuelistDied',
	'ChallengeCreated',
	'ChallengeCanceled',
	'ChallengeReplied',
	'MovesCommitted',
	'MovesRevealed',
	'PlayerTimedOut',
	'ChallengeResolved',
	'ChallengeDraw',
	'ClaimedGift',
] as const;
export type Activity = { [key in typeof activity[number]]: string };
export type ActivityEnum = CairoCustomEnum;

// Type definition for `pistols::models::pool::ReleaseReason` enum
export const releaseReason = [
	'Undefined',
	'FameLostToCreator',
	'FameLostToDeveloper',
	'SacrificedToDeveloper',
	'LeaderboardPrize',
] as const;
export type ReleaseReason = { [key in typeof releaseReason[number]]: string };
export type ReleaseReasonEnum = CairoCustomEnum;

export interface SchemaType extends ISchemaType {
	pistols: {
		Challenge: Challenge,
		ChallengeMessage: ChallengeMessage,
		ChallengeMessageValue: ChallengeMessageValue,
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
		DuelistAssignment: DuelistAssignment,
		DuelistAssignmentValue: DuelistAssignmentValue,
		DuelistMemorial: DuelistMemorial,
		DuelistMemorialValue: DuelistMemorialValue,
		DuelistTimestamps: DuelistTimestamps,
		DuelistValue: DuelistValue,
		Totals: Totals,
		Leaderboard: Leaderboard,
		LeaderboardValue: LeaderboardValue,
		Pack: Pack,
		PackValue: PackValue,
		Pact: Pact,
		PactValue: PactValue,
		Player: Player,
		PlayerBookmark: PlayerBookmark,
		PlayerBookmarkValue: PlayerBookmarkValue,
		PlayerDuelistStack: PlayerDuelistStack,
		PlayerDuelistStackValue: PlayerDuelistStackValue,
		PlayerFlags: PlayerFlags,
		PlayerFlagsValue: PlayerFlagsValue,
		PlayerOnline: PlayerOnline,
		PlayerOnlineValue: PlayerOnlineValue,
		PlayerTeamFlags: PlayerTeamFlags,
		PlayerTeamFlagsValue: PlayerTeamFlagsValue,
		PlayerTimestamps: PlayerTimestamps,
		PlayerValue: PlayerValue,
		Pool: Pool,
		PoolValue: PoolValue,
		SeasonConfig: SeasonConfig,
		SeasonConfigValue: SeasonConfigValue,
		SeasonScoreboard: SeasonScoreboard,
		SeasonScoreboardValue: SeasonScoreboardValue,
		TokenBoundAddress: TokenBoundAddress,
		TokenBoundAddressValue: TokenBoundAddressValue,
		MockedValue: MockedValue,
		MockedValueValue: MockedValueValue,
		Period: Period,
	},
	achievement: {
		TrophyCreation: TrophyCreation,
		TrophyCreationValue: TrophyCreationValue,
		TrophyProgression: TrophyProgression,
		TrophyProgressionValue: TrophyProgressionValue,
		Task: Task,
		CallToActionEvent: CallToActionEvent,
		CallToActionEventValue: CallToActionEventValue,
		ChallengeRewardsEvent: ChallengeRewardsEvent,
		ChallengeRewardsEventValue: ChallengeRewardsEventValue,
		LordsReleaseEvent: LordsReleaseEvent,
		LordsReleaseEventValue: LordsReleaseEventValue,
		PlayerActivityEvent: PlayerActivityEvent,
		PlayerActivityEventValue: PlayerActivityEventValue,
		LordsReleaseBill: LordsReleaseBill,
		RewardValues: RewardValues,
	},
}
export const schema: SchemaType = {
	pistols: {
		Challenge: {
			duel_id: 0,
		duel_type: new CairoCustomEnum({ 
					Undefined: "",
				Seasonal: undefined,
				Tournament: undefined,
				Tutorial: undefined,
				Practice: undefined, }),
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
			season_id: 0,
			winner: 0,
		timestamps: { start: 0, end: 0, },
		},
		ChallengeMessage: {
			duel_id: 0,
		message: "",
		},
		ChallengeMessageValue: {
		message: "",
		},
		ChallengeValue: {
		duel_type: new CairoCustomEnum({ 
					Undefined: "",
				Seasonal: undefined,
				Tournament: undefined,
				Tutorial: undefined,
				Practice: undefined, }),
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
			season_id: 0,
			winner: 0,
		timestamps: { start: 0, end: 0, },
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
			timeout: 0,
			card_1: 0,
			card_2: 0,
			card_3: 0,
			card_4: 0,
		},
		Round: {
			duel_id: 0,
		moves_a: { salt: 0, hashed: 0, timeout: 0, card_1: 0, card_2: 0, card_3: 0, card_4: 0, },
		moves_b: { salt: 0, hashed: 0, timeout: 0, card_1: 0, card_2: 0, card_3: 0, card_4: 0, },
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
				Blades: undefined,
				Forsaken: undefined,
				Unpaired: undefined, }),
		},
		RoundValue: {
		moves_a: { salt: 0, hashed: 0, timeout: 0, card_1: 0, card_2: 0, card_3: 0, card_4: 0, },
		moves_b: { salt: 0, hashed: 0, timeout: 0, card_1: 0, card_2: 0, card_3: 0, card_4: 0, },
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
				Blades: undefined,
				Forsaken: undefined,
				Unpaired: undefined, }),
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
			current_season_id: 0,
			is_paused: false,
		},
		ConfigValue: {
			treasury_address: "",
			lords_address: "",
			vrf_address: "",
			current_season_id: 0,
			is_paused: false,
		},
		TokenConfig: {
			token_address: "",
			minter_address: "",
			minted_count: 0,
		},
		TokenConfigValue: {
			minter_address: "",
			minted_count: 0,
		},
		Duelist: {
			duelist_id: 0,
		duelist_profile: new CairoCustomEnum({ 
					Undefined: "",
				Character: undefined,
				Bot: undefined,
				Genesis: undefined, }),
		timestamps: { registered: 0, active: 0, },
		totals: { total_duels: 0, total_wins: 0, total_losses: 0, total_draws: 0, honour: 0, honour_log: 0, },
		},
		DuelistAssignment: {
			duelist_id: 0,
			duel_id: 0,
			pass_id: 0,
		},
		DuelistAssignmentValue: {
			duel_id: 0,
			pass_id: 0,
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
			player_address: "",
			season_id: 0,
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
			player_address: "",
			season_id: 0,
		},
		DuelistTimestamps: {
			registered: 0,
			active: 0,
		},
		DuelistValue: {
		duelist_profile: new CairoCustomEnum({ 
					Undefined: "",
				Character: undefined,
				Bot: undefined,
				Genesis: undefined, }),
		timestamps: { registered: 0, active: 0, },
		totals: { total_duels: 0, total_wins: 0, total_losses: 0, total_draws: 0, honour: 0, honour_log: 0, },
		},
		Totals: {
			total_duels: 0,
			total_wins: 0,
			total_losses: 0,
			total_draws: 0,
			honour: 0,
			honour_log: 0,
		},
		Leaderboard: {
			season_id: 0,
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
				GenesisDuelists5x: undefined,
				FreeDuelist: undefined, }),
			seed: 0,
			lords_amount: 0,
			is_open: false,
		},
		PackValue: {
		pack_type: new CairoCustomEnum({ 
					Unknown: "",
				StarterPack: undefined,
				GenesisDuelists5x: undefined,
				FreeDuelist: undefined, }),
			seed: 0,
			lords_amount: 0,
			is_open: false,
		},
		Pact: {
		duel_type: new CairoCustomEnum({ 
					Undefined: "",
				Seasonal: undefined,
				Tournament: undefined,
				Tutorial: undefined,
				Practice: undefined, }),
			pair: 0,
			duel_id: 0,
		},
		PactValue: {
			duel_id: 0,
		},
		Player: {
			player_address: "",
		timestamps: { registered: 0, claimed_gift: 0, claimed_starter_pack: false, },
		totals: { total_duels: 0, total_wins: 0, total_losses: 0, total_draws: 0, honour: 0, honour_log: 0, },
			alive_duelist_count: 0,
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
		PlayerDuelistStack: {
			player_address: "",
		duelist_profile: new CairoCustomEnum({ 
					Undefined: "",
				Character: undefined,
				Bot: undefined,
				Genesis: undefined, }),
			active_duelist_id: 0,
			level: 0,
			stacked_ids: [0],
		},
		PlayerDuelistStackValue: {
			active_duelist_id: 0,
			level: 0,
			stacked_ids: [0],
		},
		PlayerFlags: {
			player_address: "",
			is_blocked: false,
		},
		PlayerFlagsValue: {
			is_blocked: false,
		},
		PlayerOnline: {
			identity: "",
			timestamp: 0,
		},
		PlayerOnlineValue: {
			timestamp: 0,
		},
		PlayerTeamFlags: {
			player_address: "",
			is_team_member: false,
			is_admin: false,
		},
		PlayerTeamFlagsValue: {
			is_team_member: false,
			is_admin: false,
		},
		PlayerTimestamps: {
			registered: 0,
			claimed_gift: 0,
			claimed_starter_pack: false,
		},
		PlayerValue: {
		timestamps: { registered: 0, claimed_gift: 0, claimed_starter_pack: false, },
		totals: { total_duels: 0, total_wins: 0, total_losses: 0, total_draws: 0, honour: 0, honour_log: 0, },
			alive_duelist_count: 0,
		},
		Pool: {
		pool_id: new CairoCustomEnum({ 
					Undefined: "",
				Purchases: undefined,
				FamePeg: undefined,
				Season: undefined,
				Tournament: undefined,
				Sacrifice: undefined, }),
			balance_lords: 0,
			balance_fame: 0,
		},
		PoolValue: {
			balance_lords: 0,
			balance_fame: 0,
		},
		SeasonConfig: {
			season_id: 0,
		rules: new CairoCustomEnum({ 
					Undefined: "",
				Season: undefined, }),
		phase: new CairoCustomEnum({ 
					Undefined: "",
				InProgress: undefined,
				Ended: undefined, }),
		period: { start: 0, end: 0, },
		},
		SeasonConfigValue: {
		rules: new CairoCustomEnum({ 
					Undefined: "",
				Season: undefined, }),
		phase: new CairoCustomEnum({ 
					Undefined: "",
				InProgress: undefined,
				Ended: undefined, }),
		period: { start: 0, end: 0, },
		},
		SeasonScoreboard: {
			season_id: 0,
			holder: 0,
			points: 0,
		},
		SeasonScoreboardValue: {
			points: 0,
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
		Period: {
			start: 0,
			end: 0,
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
		CallToActionEvent: {
			player_address: "",
			duelist_id: 0,
			duel_id: 0,
			call_to_action: false,
			timestamp: 0,
		},
		CallToActionEventValue: {
			duel_id: 0,
			call_to_action: false,
			timestamp: 0,
		},
		ChallengeRewardsEvent: {
			duel_id: 0,
			duelist_id: 0,
		rewards: { fame_lost: 0, fame_gained: 0, fools_gained: 0, points_scored: 0, position: 0, fame_burned: 0, lords_unlocked: 0, survived: false, },
		},
		ChallengeRewardsEventValue: {
		rewards: { fame_lost: 0, fame_gained: 0, fools_gained: 0, points_scored: 0, position: 0, fame_burned: 0, lords_unlocked: 0, survived: false, },
		},
		LordsReleaseEvent: {
			season_id: 0,
		bill: { reason: new CairoCustomEnum({ 
					Undefined: "",
				FameLostToCreator: undefined,
				FameLostToDeveloper: undefined,
				SacrificedToDeveloper: undefined,
				LeaderboardPrize: undefined, }), duelist_id: 0, recipient: "", pegged_fame: 0, pegged_lords: 0, sponsored_lords: 0, },
			duel_id: 0,
			timestamp: 0,
		},
		LordsReleaseEventValue: {
		bill: { reason: new CairoCustomEnum({ 
					Undefined: "",
				FameLostToCreator: undefined,
				FameLostToDeveloper: undefined,
				SacrificedToDeveloper: undefined,
				LeaderboardPrize: undefined, }), duelist_id: 0, recipient: "", pegged_fame: 0, pegged_lords: 0, sponsored_lords: 0, },
			duel_id: 0,
			timestamp: 0,
		},
		PlayerActivityEvent: {
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
				ChallengeCanceled: undefined,
				ChallengeReplied: undefined,
				MovesCommitted: undefined,
				MovesRevealed: undefined,
				PlayerTimedOut: undefined,
				ChallengeResolved: undefined,
				ChallengeDraw: undefined,
				ClaimedGift: undefined, }),
			identifier: 0,
			is_public: false,
		},
		PlayerActivityEventValue: {
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
				ChallengeCanceled: undefined,
				ChallengeReplied: undefined,
				MovesCommitted: undefined,
				MovesRevealed: undefined,
				PlayerTimedOut: undefined,
				ChallengeResolved: undefined,
				ChallengeDraw: undefined,
				ClaimedGift: undefined, }),
			identifier: 0,
			is_public: false,
		},
		LordsReleaseBill: {
		reason: new CairoCustomEnum({ 
					Undefined: "",
				FameLostToCreator: undefined,
				FameLostToDeveloper: undefined,
				SacrificedToDeveloper: undefined,
				LeaderboardPrize: undefined, }),
			duelist_id: 0,
			recipient: "",
			pegged_fame: 0,
			pegged_lords: 0,
			sponsored_lords: 0,
		},
		RewardValues: {
			fame_lost: 0,
			fame_gained: 0,
			fools_gained: 0,
			points_scored: 0,
			position: 0,
			fame_burned: 0,
			lords_unlocked: 0,
			survived: false,
		},
	},
};
export enum ModelsMapping {
	Challenge = 'pistols-Challenge',
	ChallengeMessage = 'pistols-ChallengeMessage',
	ChallengeMessageValue = 'pistols-ChallengeMessageValue',
	ChallengeValue = 'pistols-ChallengeValue',
	DuelType = 'pistols-DuelType',
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
	DuelistAssignment = 'pistols-DuelistAssignment',
	DuelistAssignmentValue = 'pistols-DuelistAssignmentValue',
	DuelistMemorial = 'pistols-DuelistMemorial',
	DuelistMemorialValue = 'pistols-DuelistMemorialValue',
	DuelistTimestamps = 'pistols-DuelistTimestamps',
	DuelistValue = 'pistols-DuelistValue',
	Totals = 'pistols-Totals',
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
	PlayerDuelistStack = 'pistols-PlayerDuelistStack',
	PlayerDuelistStackValue = 'pistols-PlayerDuelistStackValue',
	PlayerFlags = 'pistols-PlayerFlags',
	PlayerFlagsValue = 'pistols-PlayerFlagsValue',
	PlayerOnline = 'pistols-PlayerOnline',
	PlayerOnlineValue = 'pistols-PlayerOnlineValue',
	PlayerTeamFlags = 'pistols-PlayerTeamFlags',
	PlayerTeamFlagsValue = 'pistols-PlayerTeamFlagsValue',
	PlayerTimestamps = 'pistols-PlayerTimestamps',
	PlayerValue = 'pistols-PlayerValue',
	Pool = 'pistols-Pool',
	PoolType = 'pistols-PoolType',
	PoolValue = 'pistols-PoolValue',
	SeasonConfig = 'pistols-SeasonConfig',
	SeasonConfigValue = 'pistols-SeasonConfigValue',
	SeasonPhase = 'pistols-SeasonPhase',
	SeasonScoreboard = 'pistols-SeasonScoreboard',
	SeasonScoreboardValue = 'pistols-SeasonScoreboardValue',
	TokenBoundAddress = 'pistols-TokenBoundAddress',
	TokenBoundAddressValue = 'pistols-TokenBoundAddressValue',
	MockedValue = 'pistols-MockedValue',
	MockedValueValue = 'pistols-MockedValueValue',
	BladesCard = 'pistols-BladesCard',
	FinalBlow = 'pistols-FinalBlow',
	PacesCard = 'pistols-PacesCard',
	ChallengeState = 'pistols-ChallengeState',
	BotKey = 'pistols-BotKey',
	CharacterKey = 'pistols-CharacterKey',
	DuelistProfile = 'pistols-DuelistProfile',
	GenesisKey = 'pistols-GenesisKey',
	Premise = 'pistols-Premise',
	RoundState = 'pistols-RoundState',
	Rules = 'pistols-Rules',
	Period = 'pistols-Period',
	TrophyCreation = 'achievement-TrophyCreation',
	TrophyCreationValue = 'achievement-TrophyCreationValue',
	TrophyProgression = 'achievement-TrophyProgression',
	TrophyProgressionValue = 'achievement-TrophyProgressionValue',
	Task = 'achievement-Task',
	Activity = 'pistols-Activity',
	CallToActionEvent = 'pistols-CallToActionEvent',
	CallToActionEventValue = 'pistols-CallToActionEventValue',
	ChallengeRewardsEvent = 'pistols-ChallengeRewardsEvent',
	ChallengeRewardsEventValue = 'pistols-ChallengeRewardsEventValue',
	LordsReleaseEvent = 'pistols-LordsReleaseEvent',
	LordsReleaseEventValue = 'pistols-LordsReleaseEventValue',
	PlayerActivityEvent = 'pistols-PlayerActivityEvent',
	PlayerActivityEventValue = 'pistols-PlayerActivityEventValue',
	LordsReleaseBill = 'pistols-LordsReleaseBill',
	ReleaseReason = 'pistols-ReleaseReason',
	RewardValues = 'pistols-RewardValues',
}