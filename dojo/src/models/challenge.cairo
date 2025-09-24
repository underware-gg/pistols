use starknet::{ContractAddress};
use pistols::types::challenge_state::{ChallengeState, ChallengeStateTrait};
use pistols::types::round_state::{RoundState};
use pistols::types::premise::{Premise};
use pistols::types::timestamp::{Period};

//-------------------------
// Challenge lifecycle
//
#[derive(Copy, Drop, Serde)]
#[derive(DojoLegacyStore)]
#[dojo::model]
pub struct Challenge {
    #[key]
    pub duel_id: u128,
    //-------------------------
    // settings
    pub duel_type: DuelType,        // duel type
    pub premise: Premise,           // premise of the dispute
    pub lives_staked: u8,           // lives staked by challenger
    // duelists
    pub address_a: ContractAddress, // Challenger wallet
    pub address_b: ContractAddress, // Challenged wallet
    pub duelist_id_a: u128,         // Challenger duelist
    pub duelist_id_b: u128,         // Challenged duelist 
    // progress and results
    pub state: ChallengeState,      // curerent state
    pub season_id: u32,            // season in which was settled (duel has finished)
    pub winner: u8,                 // 0:draw, 1:duelist_a, 2:duelist_b
    // timestamps in unix epoch
    pub timestamps: Period,
}

#[derive(Serde, Copy, Drop, PartialEq, Introspect)]
pub enum DuelType {
    Undefined,      // 0
    Seasonal,       // 1 - PvP
    Tournament,     // 2 - Budokan
    Tutorial,       // 3 - Tutorial
    Practice,       // 4 - Practice
    BotPlayer,      // 5 - Single Player Imps
    Ranked,         // 6 - Matchmaking Ranked
    Unranked,       // 7 - Matchmaking Unranked
}

#[derive(Clone, Drop, Serde)]
#[derive(DojoLegacyStore)]
#[dojo::model]
pub struct ChallengeMessage {
    #[key]
    pub duel_id: u128,
    //-------------------------
    pub message: ByteArray,
}

//
// Each duel round
#[derive(Copy, Drop, Serde)]
#[derive(DojoLegacyStore)]
#[dojo::model]
pub struct Round {
    #[key]
    pub duel_id: u128,
    //---------------
    pub moves_a: Moves,
    pub moves_b: Moves,
    pub state_a: DuelistState,
    pub state_b: DuelistState,
    pub state: RoundState,
    pub final_blow: FinalBlow,
}

//
// The shot of each player on a Round
#[derive(Copy, Drop, Serde, Default, IntrospectPacked)]
pub struct Moves {
    // commit/reveal
    pub salt: felt252,      // set on reveal: the player's secret salt
    pub hashed: u128,       // set on commit: hashed moves (salt + moves)
    pub timeout: u64,       // current timeout to reply
    // player input
    pub card_1: u8,         // PacesCard,
    pub card_2: u8,         // PacesCard,
    pub card_3: u8,         // TacticsCard,
    pub card_4: u8,         // BladesCard,
} // [f] + [128 + 64 + 32(4*8)]: 224 bits

#[derive(Copy, Drop, Serde, Default, IntrospectPacked)]
pub struct DuelistState {
    pub chances: u8,    // 0..100
    pub damage: u8,     // 0..CONST::INITIAL_CHANCE
    // outcome
    pub health: u8,     // 0..CONST::FULL_HEALTH
    pub dice_fire: u8,  // 0..100
    pub honour: u8,     // honour granted
} // [5*8]: 40 bits



//------------------------------------
// Traits
//
// use core::num::traits::Zero;
use pistols::models::{
    match_queue::{QueueMode, QueueModeTrait},
    season::{SeasonConfigTrait},
};
use pistols::types::{
    duelist_profile::{CharacterKey},
    rules::{Rules},
    timestamp::{TimestampTrait, TIMESTAMP},
    constants::{CONST},
};
use pistols::types::cards::{
    deck::{Deck, DeckType, DeckTypeTrait},
    hand::{DuelistHand},
    paces::{PacesCardTrait},
    hand::{FinalBlow},
};
use pistols::interfaces::dns::{DnsTrait};
use pistols::libs::store::{Store, StoreTrait};
use pistols::utils::arrays::{SpanUtilsTrait};
use pistols::utils::bitwise::{BitwiseU32, BitwiseU128};
use pistols::utils::hash::{hash_values};
use pistols::utils::address::{ZERO};
use pistols::utils::misc::{FeltToLossy};
use pistols::utils::math::{MathTrait};


#[generate_trait]
pub impl ChallengeImpl of ChallengeTrait {
    #[inline(always)]
    fn duelist_number(self: @Challenge, duelist_id: u128) -> u8 {
        (if (duelist_id == *self.duelist_id_a) {(1)}
        else if (duelist_id == *self.duelist_id_b) {(2)}
        else {(0)})
    }
    #[inline(always)]
    fn winner_address(self: @Challenge) -> ContractAddress {
        (if (*self.winner == 1) {*self.address_a}
        else if (*self.winner == 2) {*self.address_b}
        else {ZERO()})
    }
    #[inline(always)]
    fn loser_address(self: @Challenge) -> ContractAddress {
        (if (*self.winner == 1) {*self.address_b}
        else if (*self.winner == 2) {*self.address_a}
        else {ZERO()})
    }
    #[inline(always)]
    fn self_address(self: @Challenge, duelist_number: u8) -> ContractAddress {
        (if (duelist_number == 1) {*self.address_a}
        else if (duelist_number == 2) {*self.address_b}
        else {ZERO()})
    }
    #[inline(always)]
    fn exists(self: @Challenge) -> bool {
        ((*self).state.exists())
    }
    #[inline(always)]
    fn is_tutorial(self: @Challenge) -> bool {
        (*self.duel_type == DuelType::Tutorial)
    }
    #[inline(always)]
    fn is_tournament(self: @Challenge) -> bool {
        (*self.duel_type == DuelType::Tournament)
    }
    #[inline(always)]
    fn is_against_bot_player(self: @Challenge, store: @Store) -> bool {
        (
            *self.duel_type == DuelType::BotPlayer ||
            (*store.world).is_bot_player_contract(*self.address_b)
        )
    }
    fn get_deck_type(self: @Challenge) -> DeckType {
        if (
            self.is_tutorial() &&
            ((*self).duelist_id_a.into() == CharacterKey::Drunkard || (*self).duelist_id_b.into() == CharacterKey::Drunkard)
        ) {
            (DeckType::PacesOnly)
        } else {
            (DeckType::Classic)
        }
    }
    #[inline(always)]
    fn get_deck(self: @Challenge) -> Deck {
        (self.get_deck_type().build_deck())
    }
}

#[generate_trait]
pub impl DuelTypeImpl of DuelTypeTrait {
    fn get_rules(self: @DuelType, store: @Store) -> Rules {
        if (store.get_current_season().can_collect()) {
            (Rules::Undefined)
        } else {
            (match self {
                // Ranked
                DuelType::Tournament |
                DuelType::Ranked => store.get_current_season_rules(),
                // Unranked
                DuelType::Seasonal |
                DuelType::Unranked => Rules::Unranked,
                // Practice
                DuelType::Tutorial |
                DuelType::Practice |
                DuelType::BotPlayer |
                DuelType::Undefined => Rules::Undefined,
            })
        }
    }
    fn is_practice(self: @DuelType, store: @Store) -> bool {
        (self.get_rules(store) == Rules::Undefined)
    }
    fn get_reply_timeout(self: @DuelType, queue_mode: Option<QueueMode>) -> u64 {
        (match self {
            DuelType::Tournament |
            DuelType::Seasonal |
            DuelType::Tutorial |
            DuelType::Practice |
            DuelType::BotPlayer |
            DuelType::Undefined => (TIMESTAMP::ONE_DAY),
            DuelType::Ranked |
            DuelType::Unranked => {
                match queue_mode {
                    Option::Some(mode) => (mode.get_commit_timeout()),
                    Option::None => (TIMESTAMP::ONE_DAY),
                }
            }
        })
    }
}

#[generate_trait]
pub impl RoundImpl of RoundTrait {
    #[inline(always)]
    fn new(duel_id: u128) -> Round {
        (Round {
            duel_id,
            state: RoundState::Commit,
            moves_a: Default::default(),
            moves_b: Default::default(),
            state_a: Default::default(),
            state_b: Default::default(),
            final_blow: Default::default(),
        })
    }
    #[inline(always)]
    fn make_seed(self: @Round) -> felt252 {
        (hash_values([(*self).moves_a.salt, (*self).moves_b.salt].span()))
    }
    fn set_commit_timeout(ref self: Round, duel_type: DuelType, current_timestamp: u64, queue_mode: Option<QueueMode>) {
        let timeout: u64 = (current_timestamp + duel_type.get_reply_timeout(queue_mode));
        self.moves_a.set_commit_timeout(timeout);
        self.moves_b.set_commit_timeout(timeout);
    }
    fn set_reveal_timeout(ref self: Round, duel_type: DuelType, current_timestamp: u64) {
        let timeout: u64 = (current_timestamp + duel_type.get_reply_timeout(Option::None));
        self.moves_a.set_reveal_timeout(timeout);
        self.moves_b.set_reveal_timeout(timeout);
    }
}

#[generate_trait]
pub impl MovesImpl of MovesTrait {
    #[inline(always)]
    fn has_comitted(self: @Moves) -> bool {
        (*self.hashed != 0)
    }
    #[inline(always)]
    fn commit(ref self: Moves, hashed: u128) {
        self.hashed = hashed;
    }
    #[inline(always)]
    fn has_revealed(self: @Moves) -> bool {
        (*self.salt != 0)
    }
    fn reveal_salt_and_moves(ref self: Moves, salt: felt252, moves: Span<u8>) {
        self.salt = salt;
        self.card_1 = moves.value_or_zero(0);
        self.card_2 = moves.value_or_zero(1);
        self.card_3 = moves.value_or_zero(2);
        self.card_4 = moves.value_or_zero(3);
    }
    #[inline(always)]
    fn as_hand(self: @Moves) -> DuelistHand {
        (DuelistHand {
            card_fire: (*self.card_1).into(),
            card_dodge: (*self.card_2).into(),
            card_tactics: (*self.card_3).into(),
            card_blades: (*self.card_4).into(),
        })
    }
    #[inline(always)]
    fn set_commit_timeout(ref self: Moves, timeout: u64) {
        self.timeout = if (!self.has_comitted()) {(timeout)} else {(0)};
    }
    #[inline(always)]
    fn set_reveal_timeout(ref self: Moves, timeout: u64) {
        self.timeout = if (!self.has_revealed()) {(timeout)} else {(0)};
    }
    #[inline(always)]
    fn has_timed_out(ref self: Moves, challenge: @Challenge) -> bool {
        (self.timeout.has_timed_out(challenge))
    }
}

#[generate_trait]
pub impl DuelistStateImpl of DuelistStateTrait {
    fn initialize(ref self: DuelistState, hand: DuelistHand) {
        self = Default::default();
        self.chances = CONST::INITIAL_CHANCE;
        self.damage = CONST::INITIAL_DAMAGE;
        self.health = CONST::FULL_HEALTH;
        self.honour = hand.card_fire.honour();
    }
    #[inline(always)]
    fn apply_damage(ref self: DuelistState, amount: i8) {
        self.damage.addi(amount);
    }
    #[inline(always)]
    fn apply_chances(ref self: DuelistState, amount: i8) {
        self.chances.addi(amount);
        self.chances.clampi(0, 100);
    }
    #[inline(always)]
    fn has_hit(self: @DuelistState) -> bool {
        (*self.dice_fire > 0 && self.dice_fire <= self.chances)
    }
}


//---------------------------
// Converters
//
impl DuelTypeIntoByteArray of core::traits::Into<DuelType, ByteArray> {
    fn into(self: DuelType) -> ByteArray {
        match self {
            DuelType::Undefined    => "DuelType::Undefined",
            DuelType::Seasonal     => "DuelType::Seasonal",
            DuelType::Tournament   => "DuelType::Tournament",
            DuelType::Tutorial     => "DuelType::Tutorial",
            DuelType::Practice     => "DuelType::Practice",
            DuelType::BotPlayer    => "DuelType::BotPlayer",
            DuelType::Ranked    => "DuelType::Ranked",
            DuelType::Unranked     => "DuelType::Unranked",
        }
    }
}
// for println! format! (core::fmt::Display<>) assert! (core::fmt::Debug<>)
pub impl DuelTypeDisplay of core::fmt::Display<DuelType> {
    fn fmt(self: @DuelType, ref f: core::fmt::Formatter) -> Result<(), core::fmt::Error> {
        let result: ByteArray = (*self).into();
        f.buffer.append(@result);
        Result::Ok(())
    }
}
pub impl DuelTypeDebug of core::fmt::Debug<DuelType> {
    fn fmt(self: @DuelType, ref f: core::fmt::Formatter) -> Result<(), core::fmt::Error> {
        let result: ByteArray = (*self).into();
        f.buffer.append(@result);
        Result::Ok(())
    }
}
