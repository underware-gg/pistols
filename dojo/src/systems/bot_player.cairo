use starknet::{ContractAddress};

// Exposed to clients
#[starknet::interface]
pub trait IBotPlayer<TState> {
    fn make_salt(self: @TState, duel_id: u128) -> felt252;
    fn reveal_moves(ref self: TState, duel_id: u128);
}

// Exposed to world
#[starknet::interface]
pub trait IBotPlayerProtected<TState> {
    fn reply_duel(ref self: TState, duel_id: u128);
    fn commit_moves(ref self: TState, duel_id: u128);
    fn transfer_to_winner(ref self: TState, duel_id: u128, duelist_id: u128, recipient: ContractAddress);
}

#[dojo::contract]
pub mod bot_player {
    use core::num::traits::Zero;
    use starknet::{ContractAddress};
    use dojo::world::{WorldStorage}; //, IWorldDispatcherTrait};

    use pistols::interfaces::dns::{
        DnsTrait,
        IDuelTokenDispatcherTrait,
        IDuelistTokenDispatcher, IDuelistTokenDispatcherTrait,
        IPackTokenProtectedDispatcherTrait,
        IGameDispatcherTrait,
    };
    use pistols::systems::rng::{RngWrap, RngWrapTrait, Dice, DiceTrait};
    use pistols::models::{
        challenge::{Challenge, ChallengeTrait, RoundValue},
        player::{PlayerDuelistStack, PlayerDuelistStackTrait},
    };
    use pistols::types::{
        cards::deck::{Deck},
        duelist_profile::{DuelistProfile, BotKey, ProfileManagerTrait},
    };
    use pistols::libs::{
        store::{Store, StoreTrait},
        seeder::{make_seed},
        bot::{BotPlayerMovesTrait},
        moves_hash::{MovesHashTrait},
    };

    pub mod Errors {
        pub const INVALID_CALLER: felt252           = 'BOT_PLAYER: Invalid caller';
    }

    #[generate_trait]
    impl WorldDefaultImpl of WorldDefaultTrait {
        #[inline(always)]
        fn world_default(self: @ContractState) -> WorldStorage {
            (self.world(@"pistols"))
        }
    }

    #[abi(embed_v0)]
    impl BotPlayerImpl of super::IBotPlayer<ContractState> {
        fn make_salt(self: @ContractState, duel_id: u128) -> felt252 {
            // salt is always the duel_id for permissionless reveal
            (BotPlayerMovesTrait::make_salt(duel_id))
        }

        fn reveal_moves(ref self: ContractState, duel_id: u128) {
            // anyone can request a reveal
            let mut store: Store = StoreTrait::new(self.world_default());
            let challenge: Challenge = store.get_challenge(duel_id);
            let round: RoundValue = store.get_round_value(duel_id);

            // make moves
            let salt: felt252 = self.make_salt(duel_id);
            let deck: Deck = challenge.get_deck();
            let moves: Span<u8> = MovesHashTrait::restore(salt, round.moves_b.hashed, deck);

            // reveal!
            store.world.game_dispatcher().reveal_moves(challenge.duelist_id_b, duel_id, salt, moves);
        }
    }

    //-----------------------------------
    // Protected
    //
    #[abi(embed_v0)]
    impl IBotPlayerProtectedImpl of super::IBotPlayerProtected<ContractState> {
        fn reply_duel(ref self: ContractState, duel_id: u128) {
            // only duel contract can request a reply
            let mut store: Store = StoreTrait::new(self.world_default());
            assert(store.world.caller_is_duel_contract(), Errors::INVALID_CALLER);

            // randomize a bot profile
            let mut dice: Dice = self._make_dice(@store, duel_id);
            let duelist_seed: u8 = dice.throw('bot_archetype', 255);
            let duelist_profile: DuelistProfile = ProfileManagerTrait::randomize_profile(DuelistProfile::Bot(BotKey::Unknown), duelist_seed.into());

            // get or mint a duelist
            let bot_address: ContractAddress = starknet::get_contract_address();
            let stack: PlayerDuelistStack = store.get_player_duelist_stack(bot_address, duelist_profile);
            let mut duelist_id: u128 = stack.get_first_available_duelist_id(@store);
            if (duelist_id.is_zero()) {
                // mint new duelist
                duelist_id = store.world.pack_token_protected_dispatcher().mint_bot_duelist(duelist_profile);
            };

            // reply to the duel
            store.world.duel_token_dispatcher().reply_duel(duel_id, duelist_id, true);
        }

        fn commit_moves(ref self: ContractState, duel_id: u128) {
            // only game contract can request a commit
            let mut store: Store = StoreTrait::new(self.world_default());
            assert(store.world.caller_is_game_contract(), Errors::INVALID_CALLER);

            // get duel and duelist
            let challenge: Challenge = store.get_challenge(duel_id);
            let duelist_id: u128 = challenge.duelist_id_b;
            let duelist_profile: DuelistProfile = store.get_duelist_profile(duelist_id);

            // make moves
            let mut dice: Dice = self._make_dice(@store, duel_id);
            let salt: felt252 = self.make_salt(duel_id);
            let moves: Span<u8> = duelist_profile.make_moves(@challenge, ref dice);
            let moves_hash: u128 = MovesHashTrait::hash(salt, moves);

            // commit!
            store.world.game_dispatcher().commit_moves(duelist_id, duel_id, moves_hash);
        }

        fn transfer_to_winner(ref self: ContractState, duel_id: u128, duelist_id: u128, recipient: ContractAddress) {
            let mut store: Store = StoreTrait::new(self.world_default());
            assert(store.world.caller_is_game_contract(), Errors::INVALID_CALLER);
            let duelist_dispatcher: IDuelistTokenDispatcher = store.world.duelist_token_dispatcher();
            if (!duelist_dispatcher.is_alive(duelist_id)) {
                duelist_dispatcher.transfer_from(starknet::get_contract_address(), recipient, duelist_id.into());
            }
        }
    }

    //------------------------------------
    // Internal calls
    //
    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn _make_dice(self: @ContractState, store: @Store, duel_id: u128) -> Dice {
            let bot_address: ContractAddress = starknet::get_contract_address();
            let seed: felt252 = make_seed(bot_address, duel_id.into());
            let wrapped: @RngWrap = RngWrapTrait::new(store.world.rng_address());
            let dice: Dice = DiceTrait::new(wrapped, seed);
            (dice)
        }
    }
}

