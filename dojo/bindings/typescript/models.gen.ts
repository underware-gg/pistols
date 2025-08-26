import type { SchemaType as ISchemaType } from "@dojoengine/sdk";

import { CairoCustomEnum, CairoOption, CairoOptionVariant, BigNumberish } from 'starknet';

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

// Type definition for `pistols::models::config::CoinConfig` struct
export interface CoinConfig {
	coin_address: string;
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

// Type definition for `pistols::models::config::TokenConfig` struct
export interface TokenConfig {
	token_address: string;
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
	queue_id: QueueIdEnum;
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

// Type definition for `pistols::models::duelist::DuelistTimestamps` struct
export interface DuelistTimestamps {
	registered: BigNumberish;
	active: BigNumberish;
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

// Type definition for `pistols::models::matches::MatchPlayer` struct
export interface MatchPlayer {
	player_address: string;
	queue_id: QueueIdEnum;
	queue_info: QueueInfo;
	duelist_id: BigNumberish;
	duel_id: BigNumberish;
	next_duelists: Array<QueueNextDuelist>;
}

// Type definition for `pistols::models::matches::MatchQueue` struct
export interface MatchQueue {
	queue_id: QueueIdEnum;
	players: Array<string>;
	slot_size: BigNumberish;
	entry_token_address: string;
	entry_token_amount: BigNumberish;
}

// Type definition for `pistols::models::matches::QueueInfo` struct
export interface QueueInfo {
	queue_mode: QueueModeEnum;
	slot: BigNumberish;
	timestamp_enter: BigNumberish;
	timestamp_ping: BigNumberish;
	expired: boolean;
}

// Type definition for `pistols::models::matches::QueueNextDuelist` struct
export interface QueueNextDuelist {
	duelist_id: BigNumberish;
	slot: BigNumberish;
}

// Type definition for `pistols::models::pack::Pack` struct
export interface Pack {
	pack_id: BigNumberish;
	pack_type: PackTypeEnum;
	seed: BigNumberish;
	lords_amount: BigNumberish;
	is_open: boolean;
	duelist_profile: CairoOption<DuelistProfileEnum>;
}

// Type definition for `pistols::models::pact::Pact` struct
export interface Pact {
	duel_type: DuelTypeEnum;
	pair: BigNumberish;
	duel_id: BigNumberish;
	duel_count: BigNumberish;
}

// Type definition for `pistols::models::player::Player` struct
export interface Player {
	player_address: string;
	timestamps: PlayerTimestamps;
	totals: Totals;
	alive_duelist_count: BigNumberish;
	active_signet_ring: RingTypeEnum;
}

// Type definition for `pistols::models::player::PlayerDelegation` struct
export interface PlayerDelegation {
	player_address: string;
	delegatee_address: string;
	can_play_game: boolean;
}

// Type definition for `pistols::models::player::PlayerDuelistStack` struct
export interface PlayerDuelistStack {
	player_address: string;
	duelist_profile: DuelistProfileEnum;
	active_duelist_id: BigNumberish;
	level: BigNumberish;
	stacked_ids: Array<BigNumberish>;
}

// Type definition for `pistols::models::player::PlayerFlags` struct
export interface PlayerFlags {
	player_address: string;
	is_blocked: boolean;
}

// Type definition for `pistols::models::player::PlayerOnline` struct
export interface PlayerOnline {
	identity: string;
	timestamp: BigNumberish;
	available: boolean;
}

// Type definition for `pistols::models::player::PlayerTeamFlags` struct
export interface PlayerTeamFlags {
	player_address: string;
	is_team_member: boolean;
	is_admin: boolean;
}

// Type definition for `pistols::models::player::PlayerTimestamps` struct
export interface PlayerTimestamps {
	registered: BigNumberish;
	claimed_gift: BigNumberish;
	claimed_starter_pack: boolean;
}

// Type definition for `pistols::models::pool::Pool` struct
export interface Pool {
	pool_id: PoolTypeEnum;
	balance_lords: BigNumberish;
	balance_fame: BigNumberish;
}

// Type definition for `pistols::models::ring::Ring` struct
export interface Ring {
	ring_id: BigNumberish;
	ring_type: RingTypeEnum;
	claimed_by: string;
}

// Type definition for `pistols::models::ring::RingBalance` struct
export interface RingBalance {
	player_address: string;
	ring_type: RingTypeEnum;
	claimed: boolean;
	balance: BigNumberish;
}

// Type definition for `pistols::models::season::SeasonConfig` struct
export interface SeasonConfig {
	season_id: BigNumberish;
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

// Type definition for `pistols::systems::components::token_bound::TokenBoundAddress` struct
export interface TokenBoundAddress {
	recipient: string;
	contract_address: string;
	token_id: BigNumberish;
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

// Type definition for `achievement::events::index::TrophyProgression` struct
export interface TrophyProgression {
	player_id: BigNumberish;
	task_id: BigNumberish;
	count: BigNumberish;
	time: BigNumberish;
}

// Type definition for `achievement::types::index::Task` struct
export interface Task {
	id: BigNumberish;
	total: BigNumberish;
	description: string;
}

// Type definition for `pistols::models::events::CallToChallengeEvent` struct
export interface CallToChallengeEvent {
	player_address: string;
	duel_id: BigNumberish;
	action: ChallengeActionEnum;
	timestamp: BigNumberish;
}

// Type definition for `pistols::models::events::ChallengeRewardsEvent` struct
export interface ChallengeRewardsEvent {
	duel_id: BigNumberish;
	duelist_id: BigNumberish;
	rewards: RewardValues;
}

// Type definition for `pistols::models::events::LordsReleaseEvent` struct
export interface LordsReleaseEvent {
	season_id: BigNumberish;
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

// Type definition for `pistols::models::events::PlayerBookmarkEvent` struct
export interface PlayerBookmarkEvent {
	player_address: string;
	target_address: string;
	target_id: BigNumberish;
	enabled: boolean;
}

// Type definition for `pistols::models::events::PlayerSettingEvent` struct
export interface PlayerSettingEvent {
	player_address: string;
	setting: PlayerSettingEnum;
	value: PlayerSettingValueEnum;
}

// Type definition for `pistols::models::events::PlayerSocialLinkEvent` struct
export interface PlayerSocialLinkEvent {
	player_address: string;
	social_platform: SocialPlatformEnum;
	user_name: string;
	user_id: string;
	avatar: string;
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
	'BotPlayer',
	'Ranked',
	'Unranked',
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

// Type definition for `pistols::models::matches::QueueId` enum
export const queueId = [
	'Undefined',
	'Unranked',
	'Ranked',
] as const;
export type QueueId = { [key in typeof queueId[number]]: string };
export type QueueIdEnum = CairoCustomEnum;

// Type definition for `pistols::models::matches::QueueMode` enum
export const queueMode = [
	'Undefined',
	'Fast',
	'Slow',
] as const;
export type QueueMode = { [key in typeof queueMode[number]]: string };
export type QueueModeEnum = CairoCustomEnum;

// Type definition for `pistols::models::pack::PackType` enum
export const packType = [
	'Unknown',
	'StarterPack',
	'GenesisDuelists5x',
	'FreeDuelist',
	'SingleDuelist',
	'BotDuelist',
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
	'Claimable',
] as const;
export type PoolType = { [key in typeof poolType[number]]: string };
export type PoolTypeEnum = CairoCustomEnum;

// Type definition for `pistols::models::ring::RingType` enum
export const ringType = [
	'Unknown',
	'GoldSignetRing',
	'SilverSignetRing',
	'LeadSignetRing',
] as const;
export type RingType = { [key in typeof ringType[number]]: string };
export type RingTypeEnum = CairoCustomEnum;

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
	'Pro',
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
	'ImpMaster',
] as const;
export type CharacterKey = { [key in typeof characterKey[number]]: string };
export type CharacterKeyEnum = CairoCustomEnum;

// Type definition for `pistols::types::duelist_profile::DuelistProfile` enum
export const duelistProfile = [
	'Undefined',
	'Character',
	'Bot',
	'Genesis',
	'Legends',
] as const;
export type DuelistProfile = { 
	Undefined: string,
	Character: CharacterKeyEnum,
	Bot: BotKeyEnum,
	Genesis: GenesisKeyEnum,
	Legends: LegendsKeyEnum,
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

// Type definition for `pistols::types::duelist_profile::LegendsKey` enum
export const legendsKey = [
	'Unknown',
	'TGC1',
	'TGC2',
] as const;
export type LegendsKey = { [key in typeof legendsKey[number]]: string };
export type LegendsKeyEnum = CairoCustomEnum;

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
	'Unranked',
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
	'AirdroppedPack',
	'ClaimedRing',
] as const;
export type Activity = { [key in typeof activity[number]]: string };
export type ActivityEnum = CairoCustomEnum;

// Type definition for `pistols::models::events::ChallengeAction` enum
export const challengeAction = [
	'Undefined',
	'Reply',
	'Commit',
	'Reveal',
	'Waiting',
	'Results',
	'Finished',
] as const;
export type ChallengeAction = { [key in typeof challengeAction[number]]: string };
export type ChallengeActionEnum = CairoCustomEnum;

// Type definition for `pistols::models::events::PlayerSetting` enum
export const playerSetting = [
	'Undefined',
	'OptOutNotifications',
] as const;
export type PlayerSetting = { 
	Undefined: string,
	OptOutNotifications: SocialPlatformEnum,
};
export type PlayerSettingEnum = CairoCustomEnum;

// Type definition for `pistols::models::events::SocialPlatform` enum
export const socialPlatform = [
	'Undefined',
	'Discord',
	'Telegram',
	'X',
] as const;
export type SocialPlatform = { [key in typeof socialPlatform[number]]: string };
export type SocialPlatformEnum = CairoCustomEnum;

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
		DuelistState: DuelistState,
		Moves: Moves,
		Round: Round,
		CoinConfig: CoinConfig,
		Config: Config,
		TokenConfig: TokenConfig,
		Duelist: Duelist,
		DuelistAssignment: DuelistAssignment,
		DuelistMemorial: DuelistMemorial,
		DuelistTimestamps: DuelistTimestamps,
		Totals: Totals,
		Leaderboard: Leaderboard,
		MatchPlayer: MatchPlayer,
		MatchQueue: MatchQueue,
		QueueInfo: QueueInfo,
		QueueNextDuelist: QueueNextDuelist,
		Pack: Pack,
		Pact: Pact,
		Player: Player,
		PlayerDelegation: PlayerDelegation,
		PlayerDuelistStack: PlayerDuelistStack,
		PlayerFlags: PlayerFlags,
		PlayerOnline: PlayerOnline,
		PlayerTeamFlags: PlayerTeamFlags,
		PlayerTimestamps: PlayerTimestamps,
		Pool: Pool,
		Ring: Ring,
		RingBalance: RingBalance,
		SeasonConfig: SeasonConfig,
		SeasonScoreboard: SeasonScoreboard,
		TokenBoundAddress: TokenBoundAddress,
		Period: Period,
		TrophyCreation: TrophyCreation,
		TrophyProgression: TrophyProgression,
		Task: Task,
		CallToChallengeEvent: CallToChallengeEvent,
		ChallengeRewardsEvent: ChallengeRewardsEvent,
		LordsReleaseEvent: LordsReleaseEvent,
		PlayerActivityEvent: PlayerActivityEvent,
		PlayerBookmarkEvent: PlayerBookmarkEvent,
		PlayerSettingEvent: PlayerSettingEvent,
		PlayerSocialLinkEvent: PlayerSocialLinkEvent,
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
				Practice: undefined,
				BotPlayer: undefined,
				Ranked: undefined,
				Unranked: undefined, }),
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
		CoinConfig: {
			coin_address: "",
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
		TokenConfig: {
			token_address: "",
			minter_address: "",
			minted_count: 0,
		},
		Duelist: {
			duelist_id: 0,
		duelist_profile: new CairoCustomEnum({ 
					Undefined: "",
				Character: undefined,
				Bot: undefined,
				Genesis: undefined,
				Legends: undefined, }),
		timestamps: { registered: 0, active: 0, },
		totals: { total_duels: 0, total_wins: 0, total_losses: 0, total_draws: 0, honour: 0, honour_log: 0, },
		},
		DuelistAssignment: {
			duelist_id: 0,
			duel_id: 0,
			pass_id: 0,
		queue_id: new CairoCustomEnum({ 
					Undefined: "",
				Unranked: undefined,
				Ranked: undefined, }),
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
		DuelistTimestamps: {
			registered: 0,
			active: 0,
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
		MatchPlayer: {
			player_address: "",
		queue_id: new CairoCustomEnum({ 
					Undefined: "",
				Unranked: undefined,
				Ranked: undefined, }),
		queue_info: { queue_mode: new CairoCustomEnum({ 
					Undefined: "",
				Fast: undefined,
				Slow: undefined, }), slot: 0, timestamp_enter: 0, timestamp_ping: 0, expired: false, },
			duelist_id: 0,
			duel_id: 0,
			next_duelists: [{ duelist_id: 0, slot: 0, }],
		},
		MatchQueue: {
		queue_id: new CairoCustomEnum({ 
					Undefined: "",
				Unranked: undefined,
				Ranked: undefined, }),
			players: [""],
			slot_size: 0,
			entry_token_address: "",
			entry_token_amount: 0,
		},
		QueueInfo: {
		queue_mode: new CairoCustomEnum({ 
					Undefined: "",
				Fast: undefined,
				Slow: undefined, }),
			slot: 0,
			timestamp_enter: 0,
			timestamp_ping: 0,
			expired: false,
		},
		QueueNextDuelist: {
			duelist_id: 0,
			slot: 0,
		},
		Pack: {
			pack_id: 0,
		pack_type: new CairoCustomEnum({ 
					Unknown: "",
				StarterPack: undefined,
				GenesisDuelists5x: undefined,
				FreeDuelist: undefined,
				SingleDuelist: undefined,
				BotDuelist: undefined, }),
			seed: 0,
			lords_amount: 0,
			is_open: false,
		duelist_profile: new CairoOption(CairoOptionVariant.None),
		},
		Pact: {
		duel_type: new CairoCustomEnum({ 
					Undefined: "",
				Seasonal: undefined,
				Tournament: undefined,
				Tutorial: undefined,
				Practice: undefined,
				BotPlayer: undefined,
				Ranked: undefined,
				Unranked: undefined, }),
			pair: 0,
			duel_id: 0,
			duel_count: 0,
		},
		Player: {
			player_address: "",
		timestamps: { registered: 0, claimed_gift: 0, claimed_starter_pack: false, },
		totals: { total_duels: 0, total_wins: 0, total_losses: 0, total_draws: 0, honour: 0, honour_log: 0, },
			alive_duelist_count: 0,
		active_signet_ring: new CairoCustomEnum({ 
					Unknown: "",
				GoldSignetRing: undefined,
				SilverSignetRing: undefined,
				LeadSignetRing: undefined, }),
		},
		PlayerDelegation: {
			player_address: "",
			delegatee_address: "",
			can_play_game: false,
		},
		PlayerDuelistStack: {
			player_address: "",
		duelist_profile: new CairoCustomEnum({ 
					Undefined: "",
				Character: undefined,
				Bot: undefined,
				Genesis: undefined,
				Legends: undefined, }),
			active_duelist_id: 0,
			level: 0,
			stacked_ids: [0],
		},
		PlayerFlags: {
			player_address: "",
			is_blocked: false,
		},
		PlayerOnline: {
			identity: "",
			timestamp: 0,
			available: false,
		},
		PlayerTeamFlags: {
			player_address: "",
			is_team_member: false,
			is_admin: false,
		},
		PlayerTimestamps: {
			registered: 0,
			claimed_gift: 0,
			claimed_starter_pack: false,
		},
		Pool: {
		pool_id: new CairoCustomEnum({ 
					Undefined: "",
				Purchases: undefined,
				FamePeg: undefined,
				Season: undefined,
				Tournament: undefined,
				Sacrifice: undefined,
				Claimable: undefined, }),
			balance_lords: 0,
			balance_fame: 0,
		},
		Ring: {
			ring_id: 0,
		ring_type: new CairoCustomEnum({ 
					Unknown: "",
				GoldSignetRing: undefined,
				SilverSignetRing: undefined,
				LeadSignetRing: undefined, }),
			claimed_by: "",
		},
		RingBalance: {
			player_address: "",
		ring_type: new CairoCustomEnum({ 
					Unknown: "",
				GoldSignetRing: undefined,
				SilverSignetRing: undefined,
				LeadSignetRing: undefined, }),
			claimed: false,
			balance: 0,
		},
		SeasonConfig: {
			season_id: 0,
		rules: new CairoCustomEnum({ 
					Undefined: "",
				Season: undefined,
				Unranked: undefined, }),
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
		TokenBoundAddress: {
			recipient: "",
			contract_address: "",
			token_id: 0,
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
		TrophyProgression: {
			player_id: 0,
			task_id: 0,
			count: 0,
			time: 0,
		},
		Task: {
			id: 0,
			total: 0,
		description: "",
		},
		CallToChallengeEvent: {
			player_address: "",
			duel_id: 0,
		action: new CairoCustomEnum({ 
					Undefined: "",
				Reply: undefined,
				Commit: undefined,
				Reveal: undefined,
				Waiting: undefined,
				Results: undefined,
				Finished: undefined, }),
			timestamp: 0,
		},
		ChallengeRewardsEvent: {
			duel_id: 0,
			duelist_id: 0,
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
				ClaimedGift: undefined,
				AirdroppedPack: undefined,
				ClaimedRing: undefined, }),
			identifier: 0,
			is_public: false,
		},
		PlayerBookmarkEvent: {
			player_address: "",
			target_address: "",
			target_id: 0,
			enabled: false,
		},
		PlayerSettingEvent: {
			player_address: "",
		setting: new CairoCustomEnum({ 
					Undefined: "",
				OptOutNotifications: undefined, }),
		value: new CairoCustomEnum({ 
					Undefined: "",
				Boolean: undefined, }),
		},
		PlayerSocialLinkEvent: {
			player_address: "",
		social_platform: new CairoCustomEnum({ 
					Undefined: "",
				Discord: undefined,
				Telegram: undefined,
				X: undefined, }),
		user_name: "",
		user_id: "",
		avatar: "",
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
	DuelType = 'pistols-DuelType',
	DuelistState = 'pistols-DuelistState',
	Moves = 'pistols-Moves',
	Round = 'pistols-Round',
	CoinConfig = 'pistols-CoinConfig',
	Config = 'pistols-Config',
	TokenConfig = 'pistols-TokenConfig',
	CauseOfDeath = 'pistols-CauseOfDeath',
	Duelist = 'pistols-Duelist',
	DuelistAssignment = 'pistols-DuelistAssignment',
	DuelistMemorial = 'pistols-DuelistMemorial',
	DuelistTimestamps = 'pistols-DuelistTimestamps',
	Totals = 'pistols-Totals',
	Leaderboard = 'pistols-Leaderboard',
	MatchPlayer = 'pistols-MatchPlayer',
	MatchQueue = 'pistols-MatchQueue',
	QueueId = 'pistols-QueueId',
	QueueInfo = 'pistols-QueueInfo',
	QueueMode = 'pistols-QueueMode',
	QueueNextDuelist = 'pistols-QueueNextDuelist',
	Pack = 'pistols-Pack',
	PackType = 'pistols-PackType',
	Pact = 'pistols-Pact',
	Player = 'pistols-Player',
	PlayerDelegation = 'pistols-PlayerDelegation',
	PlayerDuelistStack = 'pistols-PlayerDuelistStack',
	PlayerFlags = 'pistols-PlayerFlags',
	PlayerOnline = 'pistols-PlayerOnline',
	PlayerTeamFlags = 'pistols-PlayerTeamFlags',
	PlayerTimestamps = 'pistols-PlayerTimestamps',
	Pool = 'pistols-Pool',
	PoolType = 'pistols-PoolType',
	Ring = 'pistols-Ring',
	RingBalance = 'pistols-RingBalance',
	RingType = 'pistols-RingType',
	SeasonConfig = 'pistols-SeasonConfig',
	SeasonPhase = 'pistols-SeasonPhase',
	SeasonScoreboard = 'pistols-SeasonScoreboard',
	TokenBoundAddress = 'pistols-TokenBoundAddress',
	BladesCard = 'pistols-BladesCard',
	FinalBlow = 'pistols-FinalBlow',
	PacesCard = 'pistols-PacesCard',
	ChallengeState = 'pistols-ChallengeState',
	BotKey = 'pistols-BotKey',
	CharacterKey = 'pistols-CharacterKey',
	DuelistProfile = 'pistols-DuelistProfile',
	GenesisKey = 'pistols-GenesisKey',
	LegendsKey = 'pistols-LegendsKey',
	Premise = 'pistols-Premise',
	RoundState = 'pistols-RoundState',
	Rules = 'pistols-Rules',
	Period = 'pistols-Period',
	TrophyCreation = 'achievement-TrophyCreation',
	TrophyProgression = 'achievement-TrophyProgression',
	Task = 'achievement-Task',
	Activity = 'pistols-Activity',
	CallToChallengeEvent = 'pistols-CallToChallengeEvent',
	ChallengeAction = 'pistols-ChallengeAction',
	ChallengeRewardsEvent = 'pistols-ChallengeRewardsEvent',
	LordsReleaseEvent = 'pistols-LordsReleaseEvent',
	PlayerActivityEvent = 'pistols-PlayerActivityEvent',
	PlayerBookmarkEvent = 'pistols-PlayerBookmarkEvent',
	PlayerSetting = 'pistols-PlayerSetting',
	PlayerSettingEvent = 'pistols-PlayerSettingEvent',
	PlayerSocialLinkEvent = 'pistols-PlayerSocialLinkEvent',
	SocialPlatform = 'pistols-SocialPlatform',
	LordsReleaseBill = 'pistols-LordsReleaseBill',
	ReleaseReason = 'pistols-ReleaseReason',
	RewardValues = 'pistols-RewardValues',
}