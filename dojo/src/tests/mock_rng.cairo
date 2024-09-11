use starknet::{ContractAddress};
use dojo::world::IWorldDispatcher;

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct SaltValue {
    #[key]
    pub salt: felt252,
    //---------------
    pub value: felt252,
    pub exists: bool,
}

#[dojo::interface]
trait IRng {
    fn reseed(world: @IWorldDispatcher, seed: felt252, salt: felt252) -> felt252;
    fn set_salts(ref world: IWorldDispatcher, salts: Span<felt252>, values: Span<felt252>);
}

#[dojo::contract]
mod rng {
    use super::IRng;
    use debug::PrintTrait;
    use starknet::{ContractAddress};
    use super::{SaltValue, SaltValueStore};

    use pistols::utils::hash::{hash_values};
    use pistols::utils::misc::{WORLD};

    #[abi(embed_v0)]
    impl RngImpl of IRng<ContractState> {
        fn reseed(world: @IWorldDispatcher, seed: felt252, salt: felt252) -> felt252 {
            let new_seed: felt252 = hash_values([seed.into(), salt].span());
            let salt_value: SaltValue = SaltValueStore::get(world, salt);
            if (salt_value.exists) {
// println!("-- get_salt {} {} {}", salt, salt_value.exists, salt_value.value);
                return salt_value.value;
            }
            (new_seed)
        }
        fn set_salts(ref world: IWorldDispatcher, salts: Span<felt252>, values: Span<felt252>) {
            assert(salts.len() == values.len(), 'InvalidSaltValuesLength');
            let mut index: usize = 0;
            while (index < salts.len()) {
// println!("set_salts {} {} {}", index, salts[index], values[index]);
                let v: u256 = (*values[index]).try_into().unwrap();
                assert(v > 0, 'salt value > 0');
                assert(v < 256, 'salt value < 256');
                set!(world, (
                    SaltValue{
                        salt: *salts[index],
                        value: (*values[index] - 1), // throw_dice() will add 1
                        exists: true,
                    }
                ));
                index += 1;
            }
        }
    }
}
