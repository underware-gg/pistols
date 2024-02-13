use starknet::{ContractAddress};
use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};
use pistols::types::challenge::{ChallengeState};

// define the interface
#[starknet::interface]
trait IActions<TContractState> {
    //
    // Duelists
    fn register_duelist(self: @TContractState,
        name: felt252,
        profile_pic: u8,
    );

    //
    // Challenge
    fn create_challenge(self: @TContractState,
        challenged: ContractAddress,
        message: felt252,
        expire_seconds: u64,
    ) -> u128;
    fn reply_challenge(self: @TContractState,
        duel_id: u128,
        accepted: bool,
    ) -> ChallengeState;

    //
    // Duel
    fn commit_move(self: @TContractState,
        duel_id: u128,
        round_number: u8,
        hash: felt252,
    );
    fn reveal_move(self: @TContractState,
        duel_id: u128,
        round_number: u8,
        salt: u64,
        move: u8,
    );

    //
    // read-only calls
    fn get_pact(self: @TContractState,
        duelist_a: ContractAddress,
        duelist_b: ContractAddress,
    ) -> u128;
    fn has_pact(self: @TContractState,
        duelist_a: ContractAddress,
        duelist_b: ContractAddress,
    ) -> bool;
    fn get_pistols_bonus(self: @TContractState,
        duelist_address: ContractAddress,
    ) -> u8;
    fn get_pistols_hit_chance(self: @TContractState,
        duelist_address: ContractAddress,
        steps: u8,
    ) -> u8;
    fn get_pistols_kill_chance(self: @TContractState,
        duelist_address: ContractAddress,
        steps: u8,
    ) -> u8;
}

#[dojo::contract]
mod actions {
    use debug::PrintTrait;
    use super::IActions;
    use traits::{Into, TryInto};
    use core::option::OptionTrait;
    use starknet::{ContractAddress, get_block_timestamp, get_block_info};

    use pistols::models::models::{Duelist, Challenge, Pact, Round, Move};
    use pistols::types::challenge::{ChallengeState, ChallengeStateTrait};
    use pistols::types::round::{RoundState, RoundStateTrait};
    use pistols::utils::timestamp::{timestamp};
    use pistols::systems::seeder::{make_seed};
    use pistols::systems::shooter::{shooter};
    use pistols::systems::{utils};
    use pistols::types::constants::{constants};

    // impl: implement functions specified in trait
    #[external(v0)]
    impl ActionsImpl of IActions<ContractState> {

        //------------------------
        // Duelists
        //
        fn register_duelist(self: @ContractState,
            name: felt252,
            profile_pic: u8,
        ) {
            let world: IWorldDispatcher = self.world_dispatcher.read();
            let caller: ContractAddress = starknet::get_caller_address();

            let mut duelist: Duelist = get!(world, caller, Duelist);
            // 1st time setup
            if (duelist.timestamp == 0) {
                duelist.timestamp = get_block_timestamp();
            }
            // update
            duelist.name = name;
            duelist.profile_pic = profile_pic;

            set!(world, (duelist));
            return ();
        }

        //------------------------
        // NEW Challenge
        //
        fn create_challenge(self: @ContractState,
            challenged: ContractAddress,
            message: felt252,
            expire_seconds: u64,
        ) -> u128 {
            let world: IWorldDispatcher = self.world_dispatcher.read();
            let caller: ContractAddress = starknet::get_caller_address();

            assert(challenged != utils::zero_address(), 'Missing challenged address');
            assert(expire_seconds == 0 || expire_seconds >= timestamp::from_hours(1), 'Invalid expire_seconds');

            assert(utils::duelist_exist(world, caller), 'Challenger not registered');
            assert(caller != challenged, 'Challenging thyself, you fool!');
            assert(!self.has_pact(caller, challenged), 'Duplicated challenge');
            // if (challenged != utils::zero_address()) {
            //     assert(utils::duelist_exist(world, caller), 'Challenged is not registered');
            // }

            // let duel_id: u32 = world.uuid();
            let duel_id: u128 = make_seed(caller);
            let timestamp_start: u64 = get_block_timestamp();
            let timestamp_end: u64 = if (expire_seconds == 0) { 0 } else { timestamp_start + expire_seconds };

            let challenge = Challenge {
                duel_id,
                duelist_a: caller,
                duelist_b: challenged,
                message,
                // progress
                state: ChallengeState::Awaiting.into(),
                round_number: 0,
                winner: 0,
                // times
                timestamp_start,   // chalenge issued
                timestamp_end,     // expire
            };

            utils::set_challenge(world, challenge);

            (duel_id)
        }

        //------------------------
        // REPLY Challenge
        //
        fn reply_challenge(self: @ContractState,
            duel_id: u128,
            accepted: bool,
        ) -> ChallengeState {
            let world: IWorldDispatcher = self.world_dispatcher.read();
            let caller: ContractAddress = starknet::get_caller_address();

            let mut challenge: Challenge = get!(world, duel_id, Challenge);
            let state: ChallengeState = challenge.state.try_into().unwrap();
            assert(state.exists(), 'Challenge do not exist');
            assert(state == ChallengeState::Awaiting, 'Challenge is not Awaiting');

            let timestamp: u64 = get_block_timestamp();

            if (challenge.timestamp_end > 0 && timestamp > challenge.timestamp_end) {
                challenge.state = ChallengeState::Expired.into();
                challenge.timestamp_end = timestamp;
            } else if (caller == challenge.duelist_a) {
                assert(accepted == false, 'Cannot accept own challenge');
                challenge.state = ChallengeState::Withdrawn.into();
                challenge.timestamp_end = timestamp;
            } else {
                assert(caller == challenge.duelist_b, 'Not the Challenged');
                assert(utils::duelist_exist(world, caller), 'Challenged not registered');
                if (!accepted) {
                    challenge.state = ChallengeState::Refused.into();
                    challenge.timestamp_end = timestamp;
                } else {
                    challenge.state = ChallengeState::InProgress.into();
                    challenge.round_number = 1;
                    challenge.timestamp_start = timestamp;
                    challenge.timestamp_end = 0;
                }
            }
            // update challenge state
            utils::set_challenge(world, challenge);

            (challenge.state.try_into().unwrap())
        }


        //------------------------
        // COMMIT Duel move
        //

        fn commit_move(self: @ContractState,
            duel_id: u128,
            round_number: u8,
            hash: felt252,
        ) {
            let world: IWorldDispatcher = self.world_dispatcher.read();
            shooter::commit_move(world, duel_id, round_number, hash);
        }

        fn reveal_move(self: @ContractState,
            duel_id: u128,
            round_number: u8,
            salt: u64,
            move: u8,
        ) {
            let world: IWorldDispatcher = self.world_dispatcher.read();
            shooter::reveal_move(world, duel_id, round_number, salt, move);
        }



        //------------------------------------
        // read-only calls
        //

        fn get_pact(self: @ContractState,
            duelist_a: ContractAddress,
            duelist_b: ContractAddress,
        ) -> u128 {
            let world: IWorldDispatcher = self.world_dispatcher.read();
            let pair: u128 = utils::make_pact_pair(duelist_a, duelist_b);
            (get!(world, pair, Pact).duel_id)
        }

        fn has_pact(self: @ContractState,
            duelist_a: ContractAddress,
            duelist_b: ContractAddress,
        ) -> bool {
            (self.get_pact(duelist_a, duelist_b) != 0)
        }

        fn get_pistols_bonus(self: @ContractState,
            duelist_address: ContractAddress,
        ) -> u8 {
            let world: IWorldDispatcher = self.world_dispatcher.read();
            (utils::get_pistols_bonus(world, duelist_address))
        }
        fn get_pistols_hit_chance(self: @ContractState,
            duelist_address: ContractAddress,
            steps: u8,
        ) -> u8 {
            let world: IWorldDispatcher = self.world_dispatcher.read();
            (utils::get_pistols_hit_chance(world, duelist_address, steps))
        }
        fn get_pistols_kill_chance(self: @ContractState,
            duelist_address: ContractAddress,
            steps: u8,
        ) -> u8 {
            let world: IWorldDispatcher = self.world_dispatcher.read();
            (utils::get_pistols_kill_chance(world, duelist_address, steps))
        }

    }
}
