use starknet::{ContractAddress};
use dojo::world::IWorldDispatcher;

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct SaltValue {
    #[key]
    pub salt: felt252,
    //---------------
    pub value: u128,
    pub exists: bool,
}

#[dojo::interface]
trait IRng {
    fn reseed(world: @IWorldDispatcher, seed: u128, salt: felt252) -> u128;
    fn set_salts(ref world: IWorldDispatcher, salts: Span<felt252>, values: Span<u128>);
}

#[dojo::contract]
mod rng {
    use super::IRng;
    use debug::PrintTrait;
    use starknet::{ContractAddress};
    use super::{SaltValue, SaltValueStore};

    use pistols::utils::hash::{hash_values, felt_to_u128};
    use pistols::utils::misc::{WORLD};

    #[abi(embed_v0)]
    impl RngImpl of IRng<ContractState> {
        fn reseed(world: @IWorldDispatcher, seed: u128, salt: felt252) -> u128 {
            let new_seed: felt252 = hash_values([seed.into(), salt].span());
            let salt_value: SaltValue = SaltValueStore::get(world, salt);
            if (salt_value.exists) {
                // println!("-- get_salt {} {} {}", salt, salt_value.exists, salt_value.value);
                return salt_value.value;
            }
            (felt_to_u128(new_seed))
        }
        fn set_salts(ref world: IWorldDispatcher, salts: Span<felt252>, values: Span<u128>) {
            assert(salts.len() == values.len(), 'InvalidSaltValuesLength');
            let mut index: usize = 0;
            while (index < salts.len()) {
            // println!("set_salts {} {} {}", index, salts[index], values[index]);
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

    // #[generate_trait]
    // impl InternalImpl of InternalTrait {
    //     fn make_block_hash(self: @ContractState) -> u128 {
    //         let block_info = get_block_info().unbox();
    //         hash_u128(block_info.block_number.into(), block_info.block_timestamp.into())
    //     }
    // }
}
