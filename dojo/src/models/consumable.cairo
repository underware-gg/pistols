use starknet::ContractAddress;

#[derive(Serde, Copy, Drop, PartialEq, Introspect)]
pub enum ConsumableType {
    Undefined,    // 0
    DuelistToken, // 1
}

//---------------------
// Consumables
//
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct ConsumableBalance {
    #[key]
    pub consumable_type: ConsumableType,
    #[key]
    pub player_address: ContractAddress,
    //------------
    pub balance: u32,
}


//----------------------------------
// Traits
//
use pistols::libs::store::{Store, StoreTrait};
use pistols::models::player::{Errors as PlayerErrors};

#[generate_trait]
impl ConsumableTypeTraitImpl of ConsumableTypeTrait {
    fn get_balance(self: ConsumableType, ref store: Store, player_address: ContractAddress) -> u32 {
        let balance: ConsumableBalanceValue = store.get_consumable_balance_value(self, player_address);
        (balance.balance)
    }
    fn grant(self: ConsumableType, ref store: Store, player_address: ContractAddress, amount: u32) {
        let mut balance: ConsumableBalance = store.get_consumable_balance(self, player_address);
        balance.balance += amount;
        store.set_consumable_balance(@balance);
    }
    fn consume(self: ConsumableType, ref store: Store, player_address: ContractAddress, amount: u32) {
        let mut balance: ConsumableBalance = store.get_consumable_balance(self, player_address);
        assert(balance.balance >= amount, PlayerErrors::INSUFFICIENT_CONSUMABLES);
        balance.balance -= amount;
        store.set_consumable_balance(@balance);
    }
}


//
// Converters
//
impl ConsumableTypeIntoFelt252 of Into<ConsumableType, felt252> {
    fn into(self: ConsumableType) -> felt252 {
        match self {
            ConsumableType::Undefined => 0,
            ConsumableType::DuelistToken => 1,
        }
    }
}
impl ConsumableTypeIntoByteArray of Into<ConsumableType, ByteArray> {
    fn into(self: ConsumableType) -> ByteArray {
        match self {
            ConsumableType::Undefined => "Undefined",
            ConsumableType::DuelistToken => "DuelistToken",
        }
    }
}
