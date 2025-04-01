use starknet::{ContractAddress};

//
// How Pools work...
//
// Everything that is deposited to pistols-bank contract must be assigned to a pool!
// 
// PoolType::Purchases
//  - LORDS: from purchases (Packs)
//  - FAME: -
//
// PoolType::FamePeg
//  - LORDS: from PoolType::Purchases (Packs opened), pegged to FAME in circulation
//  - FAME: -
//
// PoolType::Season / PoolType::Tournament
//  - FAME: lost in duels, will be burned to release LORDS from PoolType::FamePeg
//  - LORDS: from sponsors, distributed directly to winners
//
// PoolType::SacredFlame
//  - FAME: from dead and sacrificed duelists, burned to release LORDS from PoolType::FamePeg
//  - LORDS: -
//


#[derive(Serde, Copy, Drop, PartialEq, Introspect)]
pub enum PoolType {
    Undefined,              // 0
    Purchases,              // 1
    FamePeg,                // 2
    Season: u128,           // 3
    Tournament: u128,       // 4
    SacredFlame,            // 5
}
impl PoolTypeDefault of Default<PoolType> {
    fn default() -> PoolType {(PoolType::Undefined)}
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct Pool {
    #[key]
    pub pool_id: PoolType,
    //------
    pub balance_lords: u128,
    pub balance_fame: u128,
}

#[derive(Serde, Copy, Drop, PartialEq, Introspect)]
pub enum ReleaseReason {
    Undefined,              // 0
    FameLostToCreator,      // 1
    FameLostToDeveloper,    // 2
    SacrificedToDeveloper,  // 3
    LeaderboardPrize: u8,   // 4
}

#[derive(Copy, Drop, Serde, Introspect)]
pub struct LordsReleaseBill {
    pub reason: ReleaseReason,
    pub duelist_id: u128,
    pub recipient: ContractAddress,
    pub pegged_fame: u128,      // LORDS pegged to FAME
    pub pegged_lords: u128,     // LORDS pegged to FAME
    pub sponsored_lords: u128,  // LORDS from sponsors (can be zero)
}


//---------------------------
// Traits
//
use pistols::systems::bank::bank::{Errors as BankErrors};

#[generate_trait]
pub impl PoolImpl of PoolTrait {
    #[inline(always)]
    fn empty(ref self: Pool) {
        self.balance_lords = 0;
        self.balance_fame = 0;
    }
    #[inline(always)]
    fn deposit_lords(ref self: Pool, amount: u128) {
        self.balance_lords += amount;
    }
    #[inline(always)]
    fn deposit_fame(ref self: Pool, amount: u128) {
        self.balance_fame += amount;
    }
    #[inline(always)]
    fn withdraw_lords(ref self: Pool, amount: u128) {
        assert(self.balance_lords >= amount, BankErrors::INSUFFICIENT_LORDS);
        self.balance_lords -= amount;
    }
    #[inline(always)]
    fn withdraw_fame(ref self: Pool, amount: u128) {
        assert(self.balance_fame >= amount, BankErrors::INSUFFICIENT_FAME);
        self.balance_fame -= amount;
    }
}

#[generate_trait]
pub impl PoolTypeImpl of PoolTypeTrait {
    #[inline(always)]
    fn exists(self: @PoolType) -> bool {
        (*self != PoolType::Undefined)
    }
}



//---------------------------
// Converters
//
impl PoolTypeIntoByteArray of core::traits::Into<PoolType, ByteArray> {
    fn into(self: PoolType) -> ByteArray {
        match self {
            PoolType::Undefined     =>  "Undefined",
            PoolType::Purchases     =>  "Purchases",
            PoolType::FamePeg       =>  "FamePeg",
            PoolType::Season        =>  "Season",
            PoolType::Tournament    =>  "Tournament",
            PoolType::SacredFlame   =>  "SacredFlame",
        }
    }
}
// for println! format! (core::fmt::Display<>) assert! (core::fmt::Debug<>)
pub impl PoolTypeDebug of core::fmt::Debug<PoolType> {
    fn fmt(self: @PoolType, ref f: core::fmt::Formatter) -> Result<(), core::fmt::Error> {
        let result: ByteArray = (*self).into();
        f.buffer.append(@result);
        Result::Ok(())
    }
}
