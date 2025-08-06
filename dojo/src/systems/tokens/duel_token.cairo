use starknet::{ContractAddress};
use dojo::world::IWorldDispatcher;
use pistols::models::challenge::{DuelType};
// use pistols::models::tournament::{TournamentRules};
use pistols::types::challenge_state::{ChallengeState};
use pistols::types::premise::{Premise};

#[starknet::interface]
pub trait IDuelToken<TState> {
    // IWorldProvider
    fn world_dispatcher(self: @TState) -> IWorldDispatcher;

    //-----------------------------------
    // IERC721ComboABI start
    //
    // (ISRC5)
    fn supports_interface(self: @TState, interface_id: felt252) -> bool;
    // (IERC721)
    fn balance_of(self: @TState, account: ContractAddress) -> u256;
    fn owner_of(self: @TState, token_id: u256) -> ContractAddress;
    fn safe_transfer_from(ref self: TState, from: ContractAddress, to: ContractAddress, token_id: u256, data: Span<felt252>);
    fn transfer_from(ref self: TState, from: ContractAddress, to: ContractAddress, token_id: u256);
    fn approve(ref self: TState, to: ContractAddress, token_id: u256);
    fn set_approval_for_all(ref self: TState, operator: ContractAddress, approved: bool);
    fn get_approved(self: @TState, token_id: u256) -> ContractAddress;
    fn is_approved_for_all(self: @TState, owner: ContractAddress, operator: ContractAddress) -> bool;
    // (IERC721Metadata)
    fn name(self: @TState) -> ByteArray;
    fn symbol(self: @TState) -> ByteArray;
    fn token_uri(self: @TState, token_id: u256) -> ByteArray;
    fn tokenURI(self: @TState, tokenId: u256) -> ByteArray;
    //-----------------------------------
    // IERC721Minter
    fn max_supply(self: @TState) -> u256;
    fn total_supply(self: @TState) -> u256;
    fn last_token_id(self: @TState) -> u256;
    fn is_minting_paused(self: @TState) -> bool;
    fn is_owner_of(self: @TState, address: ContractAddress, token_id: u256) -> bool;
    fn token_exists(self: @TState, token_id: u256) -> bool;
    fn totalSupply(self: @TState) -> u256;
    //-----------------------------------
    // IERC7572ContractMetadata
    fn contract_uri(self: @TState) -> ByteArray;
    fn contractURI(self: @TState) -> ByteArray;
    //-----------------------------------
    // IERC4906MetadataUpdate
    //-----------------------------------
    // IERC2981RoyaltyInfo
    fn royalty_info(self: @TState, token_id: u256, sale_price: u256) -> (ContractAddress, u256);
    fn default_royalty(self: @TState) -> (ContractAddress, u128, u128);
    fn token_royalty(self: @TState, token_id: u256) -> (ContractAddress, u128, u128);
    // IERC721ComboABI end
    //-----------------------------------

    // ITokenComponentPublic
    fn can_mint(self: @TState, recipient: ContractAddress) -> bool;
    fn update_contract_metadata(ref self: TState);
    fn update_token_metadata(ref self: TState, token_id: u128);
    // fn update_tokens_metadata(ref self: TState, from_token_id: u128, to_token_id: u128);

    // IDuelTokenPublic
    fn get_pact(self: @TState, duel_type: DuelType, address_a: ContractAddress, address_b: ContractAddress) -> u128;
    fn has_pact(self: @TState, duel_type: DuelType, address_a: ContractAddress, address_b: ContractAddress) -> bool;
    fn create_duel(ref self: TState, duel_type: DuelType, duelist_id: u128, challenged_address: ContractAddress, lives_staked: u8, expire_minutes: u64, premise: Premise, message: ByteArray) -> u128;
    fn reply_duel(ref self: TState, duel_id: u128, duelist_id: u128, accepted: bool) -> ChallengeState;
    fn match_make(ref self: TState, address_a: ContractAddress, duelist_id_a: u128, address_b: ContractAddress, duelist_id_b: u128, lives_staked: u8, expire_minutes: u64, premise: Premise, message: ByteArray) -> u128;
}

// Exposed to clients
#[starknet::interface]
pub trait IDuelTokenPublic<TState> {
    // view
    fn get_pact(self: @TState, duel_type: DuelType, address_a: ContractAddress, address_b: ContractAddress) -> u128;
    fn has_pact(self: @TState, duel_type: DuelType, address_a: ContractAddress, address_b: ContractAddress) -> bool;
    // write
    fn create_duel( //@description: Create a Duel, mint its token
        ref self: TState,
        duel_type: DuelType,
        duelist_id: u128,
        challenged_address: ContractAddress,
        lives_staked: u8,
        expire_minutes: u64,
        premise: Premise,
        message: ByteArray,
    ) -> u128;
    fn reply_duel( //@description: Reply to a Duel (accept or reject)
        ref self: TState,
        duel_id: u128,
        duelist_id: u128,
        accepted: bool,
    ) -> ChallengeState;
    fn match_make( //@description: Create an official ranked Duel
        ref self: TState,
        address_a: ContractAddress,
        duelist_id_a: u128,
        address_b: ContractAddress,
        duelist_id_b: u128,
        lives_staked: u8,
        expire_minutes: u64,
        premise: Premise,
        message: ByteArray,
    ) -> u128;
}

// Exposed to world
#[starknet::interface]
pub trait IDuelTokenProtected<TState> {
    fn transfer_to_winner(ref self: TState, duel_id: u128);
    // fn join_tournament_duel(
    //     ref self: TState,
    //     player_address: ContractAddress,
    //     duelist_id: u128,
    //     tournament_id: u64,
    //     round_number: u8,
    //     entry_number: u8,
    //     opponent_entry_number: u8,
    //     rules: TournamentRules,
    //     timestamp_end: u64,
    // ) -> u128;
}

#[dojo::contract]
pub mod duel_token {    
    use core::num::traits::Zero;
    use starknet::{ContractAddress};
    use dojo::world::{WorldStorage};

    //-----------------------------------
    // ERC-721 Start
    //
    use openzeppelin_introspection::src5::SRC5Component;
    use openzeppelin_token::erc721::ERC721Component;
    use nft_combo::erc721::erc721_combo::ERC721ComboComponent;
    use nft_combo::erc721::erc721_combo::ERC721ComboComponent::{ERC721HooksImpl};
    use nft_combo::utils::renderer::{ContractMetadata, TokenMetadata, Attribute};
    use nft_combo::utils::encoder::{Encoder};
    use pistols::systems::components::token_component::{TokenComponent};
    component!(path: SRC5Component, storage: src5, event: SRC5Event);
    component!(path: ERC721Component, storage: erc721, event: ERC721Event);
    component!(path: ERC721ComboComponent, storage: erc721_combo, event: ERC721ComboEvent);
    component!(path: TokenComponent, storage: token, event: TokenEvent);
    impl ERC721InternalImpl = ERC721Component::InternalImpl<ContractState>;
    #[abi(embed_v0)]
    impl ERC721ComboMixinImpl = ERC721ComboComponent::ERC721ComboMixinImpl<ContractState>;
    impl ERC721ComboInternalImpl = ERC721ComboComponent::InternalImpl<ContractState>;
    #[abi(embed_v0)]
    impl TokenComponentPublicImpl = TokenComponent::TokenComponentPublicImpl<ContractState>;
    impl TokenComponentInternalImpl = TokenComponent::TokenComponentInternalImpl<ContractState>;
    #[storage]
    struct Storage {
        #[substorage(v0)]
        src5: SRC5Component::Storage,
        #[substorage(v0)]
        erc721: ERC721Component::Storage,
        #[substorage(v0)]
        erc721_combo: ERC721ComboComponent::Storage,
        #[substorage(v0)]
        token: TokenComponent::Storage,
    }
    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        SRC5Event: SRC5Component::Event,
        #[flat]
        ERC721Event: ERC721Component::Event,
        #[flat]
        ERC721ComboEvent: ERC721ComboComponent::Event,
        #[flat]
        TokenEvent: TokenComponent::Event,
    }
    //
    // ERC-721 End
    //-----------------------------------

    use pistols::interfaces::dns::{
        DnsTrait,
        IDuelistTokenProtectedDispatcher, IDuelistTokenProtectedDispatcherTrait,
        IBotPlayerProtectedDispatcherTrait,
        IAdminDispatcherTrait,
        // IGameDispatcherTrait,
    };
    use pistols::models::{
        player::{PlayerTrait, PlayerDelegationTrait},
        challenge::{
            Challenge, ChallengeTrait, ChallengeValue,
            ChallengeMessage, ChallengeMessageValue,
            DuelType, DuelTypeTrait,
            Round, RoundTrait,
        },
        duelist::{DuelistTrait, DuelistProfile, DuelistProfileTrait},
        pact::{PactTrait},
        events::{Activity, ActivityTrait, ChallengeAction},
        // tournament::{
        //     TournamentDuelKeys, TournamentDuelKeysTrait,
        //     TournamentRules,
        //     ChallengeToTournament, TournamentToChallenge,
        // },
    };
    use pistols::types::{
        challenge_state::{ChallengeState, ChallengeStateTrait},
        premise::{Premise, PremiseTrait},
        timestamp::{Period, PeriodTrait, TimestampTrait, TIMESTAMP},
        constants::{METADATA},
    };
    use pistols::libs::store::{Store, StoreTrait};
    use pistols::utils::short_string::{ShortStringTrait};
    use pistols::utils::misc::{ContractAddressIntoU256};//, ZERO};
    use pistols::utils::math::{MathTrait};

    // use tournaments::components::{
    //     models::lifecycle::{Lifecycle},
    //     libs::lifecycle::{LifecycleTrait},
    // };
    use graffiti::url::{UrlImpl};

    pub mod Errors {
        pub const CALLER_NOT_ADMIN: felt252         = 'DUEL: Caller not admin';
        pub const INVALID_CALLER: felt252           = 'DUEL: Invalid caller';
        pub const INVALID_DUELIST_A_NULL: felt252   = 'DUEL: Duelist A null';
        pub const INVALID_DUELIST_B_NULL: felt252   = 'DUEL: Duelist B null';
        pub const INVALID_CHALLENGE_SELF: felt252   = 'DUEL: Invalid self challenge';
        pub const INVALID_DUEL_TYPE: felt252        = 'DUEL: Invalid duel type';
        pub const INVALID_REPLY_SELF: felt252       = 'DUEL: Reply self';
        pub const INVALID_CHALLENGE: felt252        = 'DUEL: Invalid challenge';
        pub const INVALID_STAKE: felt252            = 'DUEL: Invalid stake';
        pub const NOT_YOUR_CHALLENGE: felt252       = 'DUEL: Not your challenge';
        pub const CHALLENGE_NOT_AWAITING: felt252   = 'DUEL: Challenge not Awaiting';
        pub const DUELIST_IN_CHALLENGE: felt252     = 'DUEL: Duelist in a challenge';
        pub const PACT_EXISTS: felt252              = 'DUEL: Pact exists';
    }

    //*******************************
    fn TOKEN_NAME()   -> ByteArray {("Pistols at Dawn Duels")}
    fn TOKEN_SYMBOL() -> ByteArray {("DUEL")}
    //*******************************

    fn dojo_init(
        ref self: ContractState,
        base_uri: felt252,
        minter_address: ContractAddress,
    ) {
        self.erc721_combo.initializer(
            TOKEN_NAME(),
            TOKEN_SYMBOL(),
            base_uri.to_string(),
            Option::None, // contract_uri (use hooks)
            Option::None, // max_supply (infinite)
        );
        self.token.initialize(
            minter_address,
        );
    }

    #[generate_trait]
    impl WorldDefaultImpl of WorldDefaultTrait {
        #[inline(always)]
        fn world_default(self: @ContractState) -> WorldStorage {
            (self.world(@"pistols"))
        }
    }


    //-----------------------------------
    // Public
    //
    #[abi(embed_v0)]
    impl DuelTokenPublicImpl of super::IDuelTokenPublic<ContractState> {

        //-----------------------------------
        // View calls
        //
        fn get_pact(self: @ContractState, duel_type: DuelType, address_a: ContractAddress, address_b: ContractAddress) -> u128 {
            let mut store: Store = StoreTrait::new(self.world_default());
            (store.get_pact(duel_type, address_a.into(), address_b.into()).duel_id)
        }
        fn has_pact(self: @ContractState, duel_type: DuelType, address_a: ContractAddress, address_b: ContractAddress) -> bool {
            let mut store: Store = StoreTrait::new(self.world_default());
            (store.get_pact(duel_type, address_a.into(), address_b.into()).duel_id != 0)
        }

        //-----------------------------------
        // Write calls
        //
        fn create_duel(ref self: ContractState,
            duel_type: DuelType,
            duelist_id: u128,
            challenged_address: ContractAddress,
            lives_staked: u8,
            expire_minutes: u64,
            premise: Premise,
            message: ByteArray,
        ) -> u128 {
            let mut store: Store = StoreTrait::new(self.world_default());

            // validate challenged
            let address_a: ContractAddress = starknet::get_caller_address();
            let mut address_b: ContractAddress = challenged_address;
            assert(address_b != address_a, Errors::INVALID_CHALLENGE_SELF);

            // validate duel type
            match duel_type {
                DuelType::Seasonal |
                DuelType::Practice => {
                    // at least 1 life stake
                    assert(lives_staked > 0, Errors::INVALID_STAKE);
                },
                DuelType::BotPlayer => {
                    // this is a challenge to the bot_player contract
                    address_b = store.world.bot_player_address();
                    assert(lives_staked == 1, Errors::INVALID_STAKE);
                },
                DuelType::Tutorial |    // created by the tutorials contact only
                DuelType::Tournament |  // created by the tournaments contact only
                DuelType::MatchMake |   // created by match_make() only
                DuelType::Undefined=> {
                    assert(false, Errors::INVALID_DUEL_TYPE);
                },
            };

            // get active duelist from stack
            let duelist_dispatcher: IDuelistTokenProtectedDispatcher = store.world.duelist_token_protected_dispatcher();
            let duelist_id_a: u128 = duelist_dispatcher.get_validated_active_duelist_id(address_a, duelist_id, lives_staked);

            // mint to game, so it can transfer to winner
            let duel_id: u128 = self.token.mint_next(store.world.game_address());

            // assert duelist is not in a challenge, get into it
            store.enter_challenge(duelist_id_a, duel_id);

            // calc expiration
            let timestamps: Period = PeriodTrait::new_from_now(
                if (expire_minutes == 0) {TIMESTAMP::ONE_DAY}
                else {TimestampTrait::from_minutes(expire_minutes)},
            );

            // create challenge
            let challenge = Challenge {
                duel_id,
                duel_type,
                premise,
                lives_staked,
                // duelists
                address_a,
                address_b,
                duelist_id_a,
                duelist_id_b: 0,
                // progress
                state: ChallengeState::Awaiting,
                season_id: 0,
                winner: 0,
                // timestamps
                timestamps,
            };

            // save!
            store.set_challenge(@challenge);
            store.set_round(@RoundTrait::new(duel_id));

            if (message.len() > 0) {
                store.set_challenge_message(@ChallengeMessage {
                    duel_id,
                    message,
                });
            }

            // set the pact + assert it does not exist
            if (address_b.is_non_zero()) {
                challenge.assert_set_pact(ref store);
            }

            // Duelist 1 is ready to commit
            store.emit_challenge_action(@challenge, 1, ChallengeAction::Commit);
            // Duelist 2 has to reply
            store.emit_challenge_action(@challenge, 2, ChallengeAction::Reply);

            // events
            PlayerTrait::check_in(ref store, Activity::ChallengeCreated, address_a, duel_id.into());

            // bot player reply
            if (challenge.is_against_bot_player(@store)) {
                store.world.bot_player_protected_dispatcher().reply_duel(duel_id);
            }

            (duel_id)
        }
        
        fn reply_duel(ref self: ContractState,
            duel_id: u128,
            duelist_id: u128,
            accepted: bool,
        ) -> ChallengeState {
            let mut store: Store = StoreTrait::new(self.world_default());
            
            // validate chalenge
            let mut challenge: Challenge = store.get_challenge(duel_id);
            assert(challenge.exists(), Errors::INVALID_CHALLENGE);
            assert(challenge.state == ChallengeState::Awaiting, Errors::CHALLENGE_NOT_AWAITING);

            let caller: ContractAddress = starknet::get_caller_address();
            let timestamp: u64 = starknet::get_block_timestamp();

            if (caller == challenge.address_a) {
                // same duelist, can only withdraw...
                assert(accepted == false, Errors::INVALID_REPLY_SELF);
                challenge.state = ChallengeState::Withdrawn;
            } else {
                // open challenge: anyone can ACCEPT
                if (challenge.address_b.is_zero() && accepted) {
                    challenge.address_b = caller;
                    // set the pact + assert it does not exist
                    challenge.assert_set_pact(ref store);
                } else {
                    // else, only challenged or delegated can reply
                    assert(PlayerDelegationTrait::can_play_game(@store, challenge.address_b, caller), Errors::NOT_YOUR_CHALLENGE);
                }

                // Challenged is accepting...
                if (accepted) {
                    // get active duelist from stack
                    let duelist_dispatcher: IDuelistTokenProtectedDispatcher = store.world.duelist_token_protected_dispatcher();
                    challenge.duelist_id_b = (duelist_dispatcher.get_validated_active_duelist_id(challenge.address_b, duelist_id, challenge.lives_staked));

                    // validate duelist
                    assert(challenge.duelist_id_b != challenge.duelist_id_a, Errors::INVALID_CHALLENGE_SELF);

                    // assert duelist is not in a challenge
                    store.enter_challenge(challenge.duelist_id_b, duel_id);

                    // Duelist 2 can commit
                    store.emit_challenge_action(@challenge, 2, ChallengeAction::Commit);

                    // update timestamps
                    challenge.state = ChallengeState::InProgress;
                    challenge.timestamps.start = timestamp;
                    challenge.timestamps.end = 0;

                    store.set_duelist_timestamp_active(challenge.duelist_id_a, timestamp);
                    store.set_duelist_timestamp_active(challenge.duelist_id_b, timestamp);

                    // set reply timeouts
                    let mut round: Round = store.get_round(duel_id);
                    round.set_commit_timeout(challenge.duel_type.get_rules(@store), timestamp);
                    store.set_round(@round);
                } else {
                    // Challenged is Refusing
                    challenge.state = ChallengeState::Refused;
                }
            }

            // duel canceled!
            if (challenge.state.is_canceled()) {
                challenge.season_id = store.get_current_season_id();
                challenge.timestamps.end = timestamp;
                challenge.unset_pact(ref store);
                store.exit_challenge(challenge.duelist_id_a);
                store.emit_challenge_action(@challenge, 1, ChallengeAction::Finished);
                store.emit_challenge_action(@challenge, 2, ChallengeAction::Finished);
                // emit event in behalf of the player who canceled the duel
                let player_address: ContractAddress = if (caller == challenge.address_a) {challenge.address_a} else {challenge.address_b};
                Activity::ChallengeCanceled.emit(ref store.world, player_address, challenge.duel_id.into());
            } else {
                PlayerTrait::check_in(ref store, Activity::ChallengeReplied, challenge.address_b, duel_id.into());
            }
            
            // update challenge
            store.set_challenge(@challenge);

            // update token metadata
            self.update_token_metadata(duel_id);

            (challenge.state)
        }

        //-----------------------------------
        // match-making
        // official ranked games created by team bots only
        //
        fn match_make(ref self: ContractState,
            address_a: ContractAddress,
            duelist_id_a: u128,
            address_b: ContractAddress,
            duelist_id_b: u128,
            mut lives_staked: u8,
            expire_minutes: u64,
            premise: Premise,
            message: ByteArray,
        ) -> u128 {
            self._assert_caller_is_admin();
            
            // validate players
            assert(address_a != address_b, Errors::INVALID_CHALLENGE_SELF);

            // get active duelist from stack
            let mut store: Store = StoreTrait::new(self.world_default());
            lives_staked = core::cmp::max(lives_staked, 1);
            let duelist_dispatcher: IDuelistTokenProtectedDispatcher = store.world.duelist_token_protected_dispatcher();
            let duelist_id_a: u128 = duelist_dispatcher.get_validated_active_duelist_id(address_a, duelist_id_a, lives_staked);
            let duelist_id_b: u128 = duelist_dispatcher.get_validated_active_duelist_id(address_b, duelist_id_b, lives_staked);

            // mint to game, so it can transfer to winner
            let duel_id: u128 = self.token.mint_next(store.world.game_address());

            // assert duelist is not in a challenge, get into it
            store.enter_challenge(duelist_id_a, duel_id);
            store.enter_challenge(duelist_id_b, duel_id);

            // calc expiration
            let timestamps: Period = PeriodTrait::new_from_now(
                if (expire_minutes == 0) {TIMESTAMP::ONE_MINUTE * 10}
                else {TimestampTrait::from_minutes(expire_minutes)}
            );

            // create challenge
            let challenge = Challenge {
                duel_id,
                duel_type: DuelType::MatchMake,
                premise,
                lives_staked,
                // duelists
                address_a,
                address_b,
                duelist_id_a,
                duelist_id_b,
                // progress
                state: ChallengeState::InProgress,
                season_id: 0,
                winner: 0,
                // timestamps
                timestamps,
            };

            // save!
            store.set_challenge(@challenge);
            store.set_round(@RoundTrait::new(duel_id));
            challenge.assert_set_pact(ref store);

            if (message.len() > 0) {
                store.set_challenge_message(@ChallengeMessage {
                    duel_id,
                    message,
                });
            }

            // Duelist 1 is ready to commit
            store.emit_challenge_action(@challenge, 1, ChallengeAction::Commit);
            store.emit_challenge_action(@challenge, 2, ChallengeAction::Commit);

            // events
            PlayerTrait::check_in(ref store, Activity::ChallengeCreated, challenge.address_a, duel_id.into());

            (duel_id)
        }
    }

    
    //-----------------------------------
    // Protected
    //
    #[abi(embed_v0)]
    impl DuelTokenProtectedImpl of super::IDuelTokenProtected<ContractState> {
        fn transfer_to_winner(ref self: ContractState,
            duel_id: u128,
        ) {
            let mut store: Store = StoreTrait::new(self.world_default());
            assert(store.world.caller_is_world_contract(), Errors::INVALID_CALLER);

            let challenge: ChallengeValue = store.get_challenge_value(duel_id);
            let owner: ContractAddress = store.world.game_address();
            if (challenge.winner == 1) {
                self.transfer_from(owner, challenge.address_a, duel_id.into());
            } else if (challenge.winner == 2) {
                self.transfer_from(owner, challenge.address_b, duel_id.into());
            }
        }

//         fn join_tournament_duel(ref self: ContractState,
//             player_address: ContractAddress,
//             duelist_id: u128,
//             tournament_id: u64,
//             round_number: u8,
//             entry_number: u8,
//             opponent_entry_number: u8,
//             rules: TournamentRules,
//             timestamp_end: u64,
//         ) -> u128 {
//             let mut store: Store = StoreTrait::new(self.world_default());
//             assert(store.world.caller_is_tournament_contract(), Errors::INVALID_CALLER);

//             // check if duel is minted
//             let keys: @TournamentDuelKeys = TournamentDuelKeysTrait::new(
//                 tournament_id,
//                 round_number,
//                 entry_number,
//                 opponent_entry_number,
//             );
//             let mut duel_id: u128 = store.get_tournament_duel_id(keys);
//             let duelist_number: u8 = if (entry_number == *keys.entry_number_a) {1} else {2};
            
//             //-----------------------------------
//             // NEW DUEL
//             //
//             if (duel_id.is_zero()) {
//                 // mint to game, so it can transfer to winner
//                 duel_id = self.token.mint_next(store.world.game_address());

//                 // create challenge
//                 let timestamp: u64 = starknet::get_block_timestamp();
//                 let challenge = Challenge {
//                     duel_id,
//                     duel_type: DuelType::Tournament,
//                     premise: Premise::Tournament,
//                     lives_staked: rules.lives_staked,
//                     // duelists
//                     address_a: if (duelist_number == 1) {player_address} else {ZERO()},
//                     address_b: if (duelist_number == 2) {player_address} else {ZERO()},
//                     duelist_id_a: if (duelist_number == 1) {duelist_id} else {0},
//                     duelist_id_b: if (duelist_number == 2) {duelist_id} else {0},
//                     // progress
//                     state: ChallengeState::Awaiting,
//                     season_id: 0,
//                     winner: 0,
//                     // timestamps
//                     timestamps: Period {
//                         start: timestamp,
//                         end: timestamp_end,
//                     },
//                 };
// // println!("player_address: {:x}", player_address);
// // println!("duelist_id: {}", duelist_id);
// // println!("entry_number: {}", entry_number);
// // println!("opponent_entry_number: {}", opponent_entry_number);
// // println!("duelist_number: {}", duelist_number);
// // println!("challenge.address_a: {:x}", challenge.address_a);
// // println!("challenge.address_b: {:x}", challenge.address_b);
// // println!("challenge.duelist_id_a: {}", challenge.duelist_id_a);
// // println!("challenge.duelist_id_b: {}", challenge.duelist_id_b);

//                 // create Round, ready for player A to commit
//                 let mut round = RoundTrait::new(duel_id);
//                 round.set_commit_timeout(challenge.duel_type.get_rules(@store), timestamp);

//                 // save!
//                 store.set_challenge(@challenge);
//                 store.set_round(@round);

//                 // tournament links
//                 store.set_challenge_to_tournament(@ChallengeToTournament {
//                     duel_id,
//                     keys: *keys,
//                 });
//                 store.set_tournament_to_challenge(@TournamentToChallenge {
//                     keys: *keys,
//                     duel_id,
//                 });

//                 if (keys.entry_number_b.is_zero()) {
//                     // no opponent! declare winner
//                     // collect rewards for this player
//                     store.world.game_dispatcher().collect_duel(duel_id);
//                 } else {
//                     // assert duelist is not in a challenge
//                     store.enter_challenge(duelist_id, duel_id);
//                     // Duelist 1 is ready to commit
//                     store.emit_challenge_action(@challenge, duelist_number, true);
//                     // events
//                     PlayerTrait::check_in(ref store, Activity::ChallengeCreated, player_address, duel_id.into());
//                 }
//             }
//             //-----------------------------------
//             // EXISTING DUEL
//             //
//             else {
//                 let mut challenge: Challenge = store.get_challenge(duel_id);
//                 assert(challenge.exists(), Errors::INVALID_CHALLENGE);
//                 assert(challenge.state == ChallengeState::Awaiting, Errors::CHALLENGE_NOT_AWAITING);

//                 if (duelist_number == 1) {
//                     assert(*keys.entry_number_a == entry_number, Errors::NOT_YOUR_CHALLENGE);
//                     assert(challenge.address_a.is_zero(), Errors::INVALID_REPLY_SELF);
//                     challenge.address_a = player_address;
//                     challenge.duelist_id_a = duelist_id;
//                 } else {
//                     assert(*keys.entry_number_b == entry_number, Errors::NOT_YOUR_CHALLENGE);
//                     assert(challenge.address_b.is_zero(), Errors::INVALID_REPLY_SELF);
//                     challenge.address_b = player_address;
//                     challenge.duelist_id_b = duelist_id;
//                 }

//                 if (challenge.timestamps.has_expired()) {
//                     // Expired, close it!
//                     challenge.state = ChallengeState::Expired;
//                 } else {
//                     // game on!
//                     challenge.state = ChallengeState::InProgress;
//                 }

//                 // save!
//                 store.set_challenge(@challenge);

//                 // assert duelist is not in a challenge
//                 store.enter_challenge(duelist_id, duel_id);

//                 // Duelist 2 can commit
//                 store.emit_challenge_action(@challenge, duelist_number, true);

//                 // events
//                 PlayerTrait::check_in(ref store, Activity::ChallengeReplied, player_address, duel_id.into());
//             };

//             (duel_id)
//         }
    }


    //------------------------------------
    // Internal calls
    //
    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn _assert_caller_is_admin(self: @ContractState) {
            let mut world = self.world_default();
            assert(world.admin_dispatcher().am_i_admin(starknet::get_caller_address()) == true, Errors::CALLER_NOT_ADMIN);
        }
    }


    //-----------------------------------
    // ERC721ComboHooksTrait
    //
    pub impl ERC721ComboHooksImpl of ERC721ComboComponent::ERC721ComboHooksTrait<ContractState> {
        fn render_contract_uri(self: @ERC721ComboComponent::ComponentState<ContractState>) -> Option<ContractMetadata> {
            let self = self.get_contract(); // get the component's contract state
            let base_uri: ByteArray = self.erc721._base_uri();
            // let mut store: Store = StoreTrait::new(self.world_default());
            // return the metadata to be rendered by the component
            // https://docs.opensea.io/docs/contract-level-metadata
            let metadata = ContractMetadata {
                name: self.name(),
                symbol: self.symbol(),
                description: "Pistols at Dawn Duels",
                image: Option::Some(METADATA::CONTRACT_IMAGE(base_uri.clone())),
                banner_image: Option::Some(METADATA::CONTRACT_BANNER_IMAGE(base_uri.clone())),
                featured_image: Option::Some(METADATA::CONTRACT_FEATURED_IMAGE(base_uri.clone())),
                external_link: Option::Some(METADATA::EXTERNAL_LINK()),
                collaborators: Option::None,
            };
            (Option::Some(metadata))
        }

        fn render_token_uri(self: @ERC721ComboComponent::ComponentState<ContractState>, token_id: u256) -> Option<TokenMetadata> {
            let self = self.get_contract(); // get the component's contract state
            let mut store: Store = StoreTrait::new(self.world_default());
            // gather data
            let base_uri: ByteArray = self.erc721._base_uri();
            let challenge: ChallengeValue = store.get_challenge_value(token_id.low);
            let (duelist_profile_a, duelist_name_a): (DuelistProfile, ByteArray) = (
                store.get_duelist_profile(challenge.duelist_id_a),
                format!("Duelist #{}", challenge.duelist_id_a),
            );
            let (duelist_profile_b, duelist_name_b): (DuelistProfile, ByteArray) =
            if (challenge.duelist_id_b.is_non_zero()) {(
                store.get_duelist_profile(challenge.duelist_id_b),
                format!("Duelist #{}", challenge.duelist_id_b),
            )} else {
                (DuelistProfile::Undefined, "Undefined")
            };
            let challenge_message: ChallengeMessageValue = store.get_challenge_message_value(token_id.low);
            // Image
            let image: ByteArray = UrlImpl::new(format!("{}/api/pistols/duel_token/{}/image", base_uri.clone(), token_id))
                .add("duel_type", challenge.duel_type.into(), true)
                .add("premise", challenge.premise.name(), true)
                .add("state", challenge.state.into(), false)
                .add("winner", challenge.winner.to_string(), false)
                .add("season_id", challenge.season_id.to_string(), false)
                .add("profile_type_a", duelist_profile_a.into(), false)
                .add("profile_id_a", duelist_profile_a.profile_id().to_string(), false)
                .add("profile_type_b", duelist_profile_b.into(), false)
                .add("profile_id_b", duelist_profile_b.profile_id().to_string(), false)
                .add("address_a", format!("0x{:x}", challenge.address_a), false)
                .add("address_b", format!("0x{:x}", challenge.address_b), false)
                .add("message", challenge_message.message, true)
                .build();
            // Attributes
            let mut attributes: Array<Attribute> = array![
                Attribute {
                    key: "Season",
                    value: if(challenge.season_id != 0) {challenge.season_id.to_string()} else {"Undefined"},
                },
                Attribute {
                    key: "Duel Type",
                    value: challenge.duel_type.into(),
                },
                Attribute {
                    key: "Challenger",
                    value: duelist_name_a.clone(),
                },
                Attribute {
                    key: "Challenged",
                    value: duelist_name_b.clone(),
                },
                Attribute {
                    key: "Premise",
                    value: challenge.premise.name(),
                },
                Attribute {
                    key: "State",
                    value: challenge.state.into(),
                },
            ];
            if (challenge.winner != 0) {
                attributes.append(Attribute {
                    key: "Winner",
                    value: if(challenge.winner==1){duelist_name_a}else{duelist_name_b},
                });
            }
            // return the metadata to be rendered by the component
            // https://docs.opensea.io/docs/metadata-standards#metadata-structure
            let metadata = TokenMetadata {
                token_id,
                name: format!("Duel #{}", token_id),
                description: format!("Pistols at Dawn Duel #{}. https://pistols.gg", token_id),
                image: Option::Some(image),
                image_data: Option::None,
                external_url: Option::Some(METADATA::EXTERNAL_LINK()), // TODO: format external token link
                background_color: Option::Some("000000"),
                animation_url: Option::None,
                youtube_url: Option::None,
                attributes: Option::Some(attributes.span()),
                additional_metadata: Option::None,
            };
            (Option::Some(metadata))
        }
    }

}
