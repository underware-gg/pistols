use starknet::{ContractAddress};
use dojo::world::IWorldDispatcher;
use pistols::models::challenge::{DuelType};
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
    // (CamelOnly)
    fn balanceOf(self: @TState, account: ContractAddress) -> u256;
    fn ownerOf(self: @TState, tokenId: u256) -> ContractAddress;
    fn safeTransferFrom(ref self: TState, from: ContractAddress, to: ContractAddress, tokenId: u256, data: Span<felt252>);
    fn transferFrom(ref self: TState, from: ContractAddress, to: ContractAddress, tokenId: u256);
    fn setApprovalForAll(ref self: TState, operator: ContractAddress, approved: bool);
    fn getApproved(self: @TState, tokenId: u256) -> ContractAddress;
    fn isApprovedForAll(self: @TState, owner: ContractAddress, operator: ContractAddress) -> bool;
    // (IERC721Metadata)
    fn name(self: @TState) -> ByteArray;
    fn symbol(self: @TState) -> ByteArray;
    fn token_uri(self: @TState, token_id: u256) -> ByteArray;
    // (CamelOnly)
    fn tokenURI(self: @TState, tokenId: u256) -> ByteArray;
    //-----------------------------------
    // IERC721Minter
    fn max_supply(self: @TState) -> u256;
    fn total_supply(self: @TState) -> u256;
    fn last_token_id(self: @TState) -> u256;
    fn is_minting_paused(self: @TState) -> bool;
    fn is_owner_of(self: @TState, address: ContractAddress, token_id: u256) -> bool;
    fn exists(self: @TState, token_id: u256) -> bool;
    // (CamelOnly)
    fn maxSupply(self: @TState) -> u256;
    fn totalSupply(self: @TState) -> u256;
    //-----------------------------------
    // IERC7572ContractMetadata
    fn contract_uri(self: @TState) -> ByteArray;
    // (CamelOnly)
    fn contractURI(self: @TState) -> ByteArray;
    //-----------------------------------
    // IERC4906MetadataUpdate
    //-----------------------------------
    // IERC2981RoyaltyInfo
    fn royalty_info(self: @TState, token_id: u256, sale_price: u256) -> (ContractAddress, u256);
    fn default_royalty(self: @TState) -> (ContractAddress, u128, u128);
    fn token_royalty(self: @TState, token_id: u256) -> (ContractAddress, u128, u128);
    // (CamelOnly)
    fn royaltyInfo(self: @TState, token_id: u256, sale_price: u256) -> (ContractAddress, u256);
    fn defaultRoyalty(self: @TState) -> (ContractAddress, u128, u128);
    fn tokenRoyalty(self: @TState, token_id: u256) -> (ContractAddress, u128, u128);
    // IERC721ComboABI end
    //-----------------------------------

    // ITokenComponentPublic
    fn can_mint(self: @TState, recipient: ContractAddress) -> bool;
    fn update_contract_metadata(ref self: TState);
    fn update_token_metadata(ref self: TState, token_id: u128);
    fn update_tokens_metadata(ref self: TState, from_token_id: u128, to_token_id: u128);

    // IDuelTokenPublic
    fn get_pact(self: @TState, duel_type: DuelType, address_a: ContractAddress, address_b: ContractAddress) -> u128;
    fn has_pact(self: @TState, duel_type: DuelType, address_a: ContractAddress, address_b: ContractAddress) -> bool;
    fn create_duel(ref self: TState, duel_type: DuelType, duelist_id: u128, challenged_address: ContractAddress, premise: Premise, quote: felt252, expire_hours: u64, lives_staked: u8) -> u128;
    fn reply_duel(ref self: TState, duel_id: u128, duelist_id: u128, accepted: bool) -> ChallengeState;
    // fn delete_duel(ref self: TState, duel_id: u128);

    // IDuelTokenProtected
    fn transfer_to_winner(ref self: TState, duel_id: u128);
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
        premise: Premise,
        quote: felt252,
        expire_hours: u64,
        lives_staked: u8,
    ) -> u128;
    fn reply_duel( //@description: Reply to a Duel (accept or reject)
        ref self: TState,
        duel_id: u128,
        duelist_id: u128,
        accepted: bool,
    ) -> ChallengeState;
    // fn delete_duel(ref self: TState, duel_id: u128);
}

// Exposed to world
#[starknet::interface]
pub trait IDuelTokenProtected<TState> {
    fn transfer_to_winner(ref self: TState, duel_id: u128);
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
    impl ERC721ComboInternalImpl = ERC721ComboComponent::InternalImpl<ContractState>;
    #[abi(embed_v0)]
    impl ERC721ComboMixinImpl = ERC721ComboComponent::ERC721ComboMixinImpl<ContractState>;
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
        IDuelistTokenDispatcher, IDuelistTokenDispatcherTrait,
    };
    use pistols::models::{
        player::{PlayerTrait},
        challenge::{Challenge, ChallengeTrait, ChallengeValue, DuelType, Round, RoundTrait},
        duelist::{DuelistTrait, DuelistValue, ProfileTypeTrait},
        pact::{PactTrait},
        events::{Activity, ActivityTrait},
    };
    use pistols::types::{
        challenge_state::{ChallengeState, ChallengeStateTrait},
        round_state::{RoundState},
        premise::{Premise, PremiseTrait},
        timestamp::{Period, PeriodTrait, TimestampTrait, TIMESTAMP},
        constants::{METADATA},
    };
    use pistols::libs::store::{Store, StoreTrait};
    use pistols::utils::short_string::{ShortStringTrait};
    use pistols::utils::math::{MathTrait};
    use graffiti::url::{UrlImpl};

    pub mod Errors {
        pub const INVALID_CALLER: felt252           = 'DUEL: Invalid caller';
        pub const INVALID_DUELIST: felt252          = 'DUEL: Invalid duelist';
        pub const INVALID_DUELIST_A_NULL: felt252   = 'DUEL: Duelist A null';
        pub const INVALID_DUELIST_B_NULL: felt252   = 'DUEL: Duelist B null';
        pub const INVALID_CHALLENGED_SELF: felt252  = 'DUEL: Challenged self';
        pub const INVALID_DUEL_TYPE: felt252        = 'DUEL: Invalid duel type';
        pub const INVALID_REPLY_SELF: felt252       = 'DUEL: Reply self';
        pub const INVALID_CHALLENGE: felt252        = 'DUEL: Invalid challenge';
        pub const NOT_YOUR_CHALLENGE: felt252       = 'DUEL: Not your challenge';
        pub const NOT_YOUR_DUELIST: felt252         = 'DUEL: Not your duelist';
        pub const DUELIST_IS_DEAD_A: felt252        = 'DUEL: Duelist A is dead!';
        pub const DUELIST_IS_DEAD_B: felt252        = 'DUEL: Duelist B is dead!';
        pub const INSUFFICIENT_LIVES_A: felt252     = 'DUEL: Insufficient lives A';
        pub const INSUFFICIENT_LIVES_B: felt252     = 'DUEL: Insufficient lives B';
        // pub const CHALLENGER_NOT_ADMITTED: felt252  = 'DUEL: Challenger not allowed';
        // pub const CHALLENGED_NOT_ADMITTED: felt252  = 'DUEL: Challenged not allowed';
        pub const CHALLENGE_NOT_AWAITING: felt252   = 'DUEL: Challenge not Awaiting';
        pub const PACT_EXISTS: felt252              = 'DUEL: Pact exists';
        pub const DUELIST_IN_CHALLENGE: felt252     = 'DUEL: Duelist in a challenge';
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
            (store.get_pact(duel_type, address_a, address_b).duel_id)
        }
        fn has_pact(self: @ContractState, duel_type: DuelType, address_a: ContractAddress, address_b: ContractAddress) -> bool {
            let mut store: Store = StoreTrait::new(self.world_default());
            (store.get_pact(duel_type, address_a, address_b).duel_id != 0)
        }

        //-----------------------------------
        // Write calls
        //
        fn create_duel(ref self: ContractState,
            duel_type: DuelType,
            duelist_id: u128,
            challenged_address: ContractAddress,
            premise: Premise,
            quote: felt252,
            expire_hours: u64,
            lives_staked: u8,
        ) -> u128 {
            let mut store: Store = StoreTrait::new(self.world_default());

            // mint to game, so it can transfer to winner
            let duel_id: u128 = self.token.mint(store.world.game_address());

            // validate duelist ownership
            let address_a: ContractAddress = starknet::get_caller_address();
            let duelist_id_a: u128 = duelist_id;
            let duelist_dispatcher: IDuelistTokenDispatcher = store.world.duelist_token_dispatcher();
            assert(duelist_id_a.is_non_zero(), Errors::INVALID_DUELIST);
            assert(duelist_dispatcher.is_owner_of(address_a, duelist_id_a.into()) == true, Errors::NOT_YOUR_DUELIST);

            // validate duelist health
// println!("poke A... {}", duelist_id_a);
            duelist_dispatcher.poke(duelist_id_a);
            let lives: u8 = duelist_dispatcher.life_count(duelist_id_a);
            assert(lives > 0, Errors::DUELIST_IS_DEAD_A);
            assert(lives >= lives_staked, Errors::INSUFFICIENT_LIVES_A);

            // validate challenged
            let address_b: ContractAddress = challenged_address;
            // assert(address_b.is_non_zero(), Errors::INVALID_CHALLENGED); // allow open challenge
            assert(address_b != address_a, Errors::INVALID_CHALLENGED_SELF);

            // validate duel type
            match duel_type {
                DuelType::Seasonal | 
                DuelType::Practice => {}, // ok!
                DuelType::Undefined | 
                DuelType::Tutorial => {
                    // create tutorials with the tutorial contact only
                    assert(false, Errors::INVALID_DUEL_TYPE);
                },
                DuelType::Tournament => {
// TODO...
// if (tournament_id != 0) {
//     assert(tournament.can_join(address_a, 0), Errors::CHALLENGED_NOT_ADMITTED);
//     assert(tournament.can_join(address_b, 0), Errors::CHALLENGED_NOT_ADMITTED);
// }
                },
            };

            // assert duelist is not in a challenge
            store.enter_challenge(duelist_id_a, duel_id);

            // calc expiration
            let timestamp: u64 = starknet::get_block_timestamp();
            let timestamps = Period {
                start: timestamp,
                end: timestamp + 
                    if (expire_hours == 0) {TIMESTAMP::ONE_DAY}
                    else {TimestampTrait::from_hours(expire_hours)},
            };

            // create challenge
            let challenge = Challenge {
                duel_id,
                duel_type,
                premise,
                quote,
                lives_staked: core::cmp::max(lives_staked, 1),
                tournament_id: 0,
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
            store.set_challenge(@challenge);

            // create Round, ready for player A to commit
            let mut round = Round {
                duel_id: challenge.duel_id,
                state: RoundState::Commit,
                moves_a: Default::default(),
                moves_b: Default::default(),
                state_a: Default::default(),
                state_b: Default::default(),
                final_blow: Default::default(),
            };
            store.set_round(@round);

            // set the pact + assert it does not exist
            if (address_b.is_non_zero()) {
                challenge.set_pact(ref store);
            }

            // Duelist 1 is ready to commit
            store.emit_challenge_action(@challenge, 1, true);
            // Duelist 2 has to reply
            store.emit_challenge_reply_action(@challenge, true);

            // events
            PlayerTrait::check_in(ref store, Activity::ChallengeCreated, address_a, duel_id.into());

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

            let address_b: ContractAddress = starknet::get_caller_address();
            let duelist_id_b: u128 = duelist_id;
            let timestamp: u64 = starknet::get_block_timestamp();

            if (challenge.timestamps.has_expired()) {
                // Expired, close it!
                challenge.state = ChallengeState::Expired;
            } else if (address_b == challenge.address_a) {
                // same duelist, can only withdraw...
                assert(accepted == false, Errors::INVALID_REPLY_SELF);
                challenge.state = ChallengeState::Withdrawn;
            } else {
                // open challenge: anyone can ACCEPT
                if (challenge.address_b.is_zero() && accepted) {
                    challenge.address_b = address_b;
                    // set the pact + assert it does not exist
                    challenge.set_pact(ref store);
                } else {
                    // else, only challenged can reply
                    assert(challenge.address_b == address_b, Errors::NOT_YOUR_CHALLENGE);
                }

                // Challenged is accepting...
                if (accepted) {
                    // validate duelist
                    assert(duelist_id_b.is_non_zero(), Errors::INVALID_DUELIST);
                    assert(duelist_id_b != challenge.duelist_id_a, Errors::INVALID_CHALLENGED_SELF);
                    // validate ownership
                    let duelist_dispatcher = store.world.duelist_token_dispatcher();
                    assert(duelist_dispatcher.is_owner_of(address_b, duelist_id_b.into()) == true, Errors::NOT_YOUR_DUELIST);

                    // validate duelist health
    // println!("poke B... {}", duelist_id_b);
                    duelist_dispatcher.poke(duelist_id_b);
                    let lives: u8 = duelist_dispatcher.life_count(duelist_id_b);
                    assert(lives > 0, Errors::DUELIST_IS_DEAD_B);
                    assert(lives >= challenge.lives_staked, Errors::INSUFFICIENT_LIVES_B);

                    // duelist is ok
                    challenge.duelist_id_b = duelist_id_b;

                    // assert duelist is not in a challenge
                    store.enter_challenge(duelist_id_b, duel_id);

                    // Duelist 2 can commit
                    store.emit_challenge_action(@challenge, 2, true);

                    // update timestamps
                    challenge.state = ChallengeState::InProgress;
                    challenge.timestamps.start = timestamp;
                    challenge.timestamps.end = 0;

                    // set reply timeouts
                    let mut round: Round = store.get_round(duel_id);
                    round.set_commit_timeout(store.get_current_season_rules(), timestamp);
                    store.set_round(@round);
                } else {
                    // Challenged is Refusing
                    challenge.state = ChallengeState::Refused;
                }
            }

            // replied
            store.emit_challenge_reply_action(@challenge, false);

            // duel canceled!
            if (challenge.state.is_canceled()) {
                challenge.season_id = store.get_current_season_id();
                challenge.timestamps.end = timestamp;
                challenge.unset_pact(ref store);
                store.exit_challenge(challenge.duelist_id_a);
                store.emit_clear_challenge_action(@challenge, 1);
                store.emit_clear_challenge_action(@challenge, 2);
                Activity::ChallengeCanceled.emit(ref store.world, starknet::get_caller_address(), challenge.duel_id.into());
            } else {
                PlayerTrait::check_in(ref store, Activity::ChallengeReplied, address_b, duel_id.into());
            }
            
            // update challenge
            store.set_challenge(@challenge);

            (challenge.state)
        }

        // fn delete_duel(ref self: ContractState,
        //     duel_id: u128,
        // ) {
        //     self.erc721_combo._require_owner_of(starknet::get_caller_address(), duel_id.into());
        //     assert(false, Errors::NOT_IMPLEMENTED);
        //     self.token.burn(duel_id.into());
        // }
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
            let duelist_a: DuelistValue = store.get_duelist_value(challenge.duelist_id_a);
            let duelist_b: DuelistValue = store.get_duelist_value(challenge.duelist_id_b);
            let duelist_name_a: ByteArray = format!("Duelist #{}", challenge.duelist_id_a);
            let duelist_name_b: ByteArray = format!("Duelist #{}", challenge.duelist_id_b);
            // Image
            let image: ByteArray = UrlImpl::new(format!("{}/api/pistols/duel_token/{}/image", base_uri.clone(), token_id))
                .add("duel_type", challenge.duel_type.into(), true)
                .add("premise", challenge.premise.name(), true)
                .add("quote", challenge.quote.to_string(), true)
                .add("state", challenge.state.into(), false)
                .add("winner", challenge.winner.to_string(), false)
                .add("season_id", challenge.season_id.to_string(), false)
                .add("profile_type_a", duelist_a.profile_type.into(), false)
                .add("profile_type_a", duelist_b.profile_type.into(), false)
                .add("profile_id_a", duelist_a.profile_type.profile_id().to_string(), false)
                .add("profile_id_b", duelist_b.profile_type.profile_id().to_string(), false)
                .add("address_a", format!("0x{:x}", challenge.address_a), false)
                .add("address_b", format!("0x{:x}", challenge.address_b), false)
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
                    key: "Quote",
                    value: challenge.quote.to_string(),
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
