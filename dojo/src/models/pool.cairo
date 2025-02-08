
//
// How Pools work...
//
// Everything that is deposited to pistols-bank contract must be assigned to a pool!
// 
// PoolType::Bank
//  - LORDS from purchases, pegged to FAME in circulation
//  - FAME: not used
//
// PoolType::Season / PoolType::Tournament
//  - FAME lost in duels, will be burned to release LORDS from PoolType::Bank
//  - LORDS from sponsors, distributed directly to winners
//
// PoolType::SacredFlame
//  - FAME from dead and sacrificed duelists, burned to release LORDS from PoolType::Bank
//  - LORDS: not used
//


#[derive(Serde, Copy, Drop, PartialEq, Introspect)]
pub enum PoolType {
    Undefined,              // 0
    Bank,                   // 1
    Season: felt252,        // 2
    Tournament: felt252,    // 3
    SacredFlame,            // 4
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



//---------------------------
// Traits
//
use pistols::systems::bank::bank::{Errors as BankErrors};

#[generate_trait]
pub impl PoolImpl of PoolTrait {
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
            PoolType::Bank          =>  "Bank",
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
