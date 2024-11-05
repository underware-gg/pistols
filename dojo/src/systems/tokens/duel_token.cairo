use starknet::{ContractAddress};
use dojo::world::IWorldDispatcher;
use pistols::models::challenge::{Challenge};
use pistols::types::challenge_state::{ChallengeState};
use pistols::types::premise::{Premise};

#[starknet::interface]
pub trait IDuelToken<TState> {
    // IWorldProvider
    fn world_dispatcher(self: @TState) -> IWorldDispatcher;

    // ISRC5
    fn supports_interface(self: @TState, interface_id: felt252) -> bool;
    // IERC721
    fn balance_of(self: @TState, account: ContractAddress) -> u256;
    fn owner_of(self: @TState, token_id: u256) -> ContractAddress;
    fn safe_transfer_from(ref self: TState, from: ContractAddress, to: ContractAddress, token_id: u256, data: Span<felt252>);
    fn transfer_from(ref self: TState, from: ContractAddress, to: ContractAddress, token_id: u256);
    fn approve(ref self: TState, to: ContractAddress, token_id: u256);
    fn set_approval_for_all(ref self: TState, operator: ContractAddress, approved: bool);
    fn get_approved(self: @TState, token_id: u256) -> ContractAddress;
    fn is_approved_for_all(self: @TState, owner: ContractAddress, operator: ContractAddress) -> bool;
    // IERC721CamelOnly
    fn balanceOf(self: @TState, account: ContractAddress) -> u256;
    fn ownerOf(self: @TState, tokenId: u256) -> ContractAddress;
    fn safeTransferFrom(ref self: TState, from: ContractAddress, to: ContractAddress, tokenId: u256, data: Span<felt252>);
    fn transferFrom(ref self: TState, from: ContractAddress, to: ContractAddress, tokenId: u256);
    fn setApprovalForAll(ref self: TState, operator: ContractAddress, approved: bool);
    fn getApproved(self: @TState, tokenId: u256) -> ContractAddress;
    fn isApprovedForAll(self: @TState, owner: ContractAddress, operator: ContractAddress) -> bool;
    // IERC721Metadata
    fn name(self: @TState) -> ByteArray;
    fn symbol(self: @TState) -> ByteArray;
    fn token_uri(self: @TState, token_id: u256) -> ByteArray;
    // IERC721MetadataCamelOnly
    fn tokenURI(self: @TState, tokenId: u256) -> ByteArray;

    // ITokenComponentPublic
    fn can_mint(self: @TState, caller_address: ContractAddress) -> bool;
    fn exists(self: @TState, token_id: u128) -> bool;
    fn is_owner_of(self: @TState, address: ContractAddress, token_id: u128) -> bool;

    // ITokenRenderer
    fn get_token_name(self: @TState, token_id: u256) -> ByteArray;
    fn get_token_description(self: @TState, token_id: u256) -> ByteArray;
    fn get_token_image(self: @TState, token_id: u256) -> ByteArray;

    // IDuelTokenPublic
    fn create_duel(ref self: TState, duelist_id: u128, challenged_id_or_address: ContractAddress, premise: Premise, quote: felt252, table_id: felt252, expire_hours: u64) -> u128;
    fn reply_duel(ref self: TState, duelist_id: u128, duel_id: u128, accepted: bool) -> ChallengeState;
    fn delete_duel(ref self: TState, duel_id: u128);
    // view calls
    fn calc_fee(self: @TState, table_id: felt252) -> u128;
    fn get_pact(self: @TState, table_id: felt252, duelist_id_a: u128, duelist_id_b: u128) -> u128;
    fn has_pact(self: @TState, table_id: felt252, duelist_id_a: u128, duelist_id_b: u128) -> bool;
    fn can_join(self: @TState, table_id: felt252, duelist_id: u128) -> bool;
}

#[starknet::interface]
pub trait IDuelTokenPublic<TState> {
    fn create_duel(
        ref self: TState,
        duelist_id: u128,
        challenged_id_or_address: ContractAddress,
        premise: Premise,
        quote: felt252,
        table_id: felt252,
        expire_hours: u64,
    ) -> u128;
    fn reply_duel(
        ref self: TState,
        duelist_id: u128,
        duel_id: u128,
        accepted: bool,
    ) -> ChallengeState;
    fn delete_duel(
        ref self: TState,
        duel_id: u128,
    );

    // view calls
    fn calc_fee(self: @TState, table_id: felt252) -> u128;
    fn get_pact(self: @TState, table_id: felt252, duelist_id_a: u128, duelist_id_b: u128) -> u128;
    fn has_pact(self: @TState, table_id: felt252, duelist_id_a: u128, duelist_id_b: u128) -> bool;
    fn can_join(self: @TState, table_id: felt252, duelist_id: u128) -> bool;
}

#[dojo::contract]
pub mod duel_token {    
    // use debug::PrintTrait;
    use openzeppelin_account::interface::ISRC6;
    use starknet::{ContractAddress, get_contract_address, get_caller_address, get_block_timestamp};
    use dojo::world::{WorldStorage, IWorldDispatcher, IWorldDispatcherTrait};
    use dojo::model::{ModelStorage, ModelValueStorage};

    //-----------------------------------
    // ERC-721 Start
    //
    use openzeppelin_introspection::src5::SRC5Component;
    use openzeppelin_token::erc721::{ERC721Component};
    use pistols::systems::components::token_component::{TokenComponent};
    use pistols::systems::components::erc721_hooks::{ERC721HooksImpl};
    component!(path: SRC5Component, storage: src5, event: SRC5Event);
    component!(path: ERC721Component, storage: erc721, event: ERC721Event);
    component!(path: TokenComponent, storage: token, event: TokenEvent);
    #[abi(embed_v0)]
    impl ERC721MixinImpl = ERC721Component::ERC721MixinImpl<ContractState>;
    impl ERC721InternalImpl = ERC721Component::InternalImpl<ContractState>;
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
        TokenEvent: TokenComponent::Event,
    }
    //
    // ERC-721 End
    //-----------------------------------

    use pistols::interfaces::systems::{
        SystemsTrait,
        IDuelistTokenDispatcher, IDuelistTokenDispatcherTrait,
        IVRFMockDispatcher, IVRFMockDispatcherTrait,
    };
    use pistols::models::{
        config::{TokenConfig, TokenConfigValue},
        challenge::{Challenge, ChallengeValue, Round, Moves},
        duelist::{Duelist, DuelistValue, DuelistTrait, Pact, ProfilePicType, ProfilePicTypeTrait},
        table::{
            TableConfig, TableConfigTrait, TableConfigValue,
            TableAdmittance, TableAdmittanceTrait,
            TableType, TABLES,
        },
    };
    use pistols::types::premise::{Premise, PremiseTrait};
    use pistols::types::challenge_state::{ChallengeState, ChallengeStateTrait};
    use pistols::types::round_state::{RoundState};
    use pistols::types::duel_progress::{DuelistDrawnCard};
    use pistols::types::constants::{CONST, HONOUR};
    use pistols::libs::events::{emitters};
    use pistols::libs::store::{Store, StoreTrait};
    use pistols::libs::pact;
    use pistols::utils::metadata::{MetadataTrait};
    use pistols::utils::short_string::{ShortStringTrait};
    use pistols::utils::timestamp::{timestamp};
    use pistols::utils::math::{MathTrait};
    use pistols::utils::misc::{ZERO, CONSUME_ADDRESS};

    mod Errors {
        const NOT_IMPLEMENTED: felt252          = 'DUEL: Not implemented';
        const INVALID_DUEL: felt252             = 'DUEL: Invalid duel';
        const NOT_YOUR_DUEL: felt252            = 'DUEL: Not your duel';
        const INVALID_CHALLENGED: felt252       = 'DUEL: Challenged unknown';
        const INVALID_CHALLENGED_NULL: felt252  = 'DUEL: Challenged null';
        const INVALID_CHALLENGED_SELF: felt252  = 'DUEL: Challenged self';
        const INVALID_REPLY_SELF: felt252       = 'DUEL: Reply self';
        const INVALID_CHALLENGE: felt252        = 'DUEL: Invalid challenge';
        const NOT_YOUR_CHALLENGE: felt252       = 'DUEL: Not your challenge';
        const NOT_YOUR_DUELIST: felt252         = 'DUEL: Not your duelist';
        const CHALLENGER_NOT_ADMITTED: felt252  = 'DUEL: Challenger not allowed';
        const CHALLENGED_NOT_ADMITTED: felt252  = 'DUEL: Challenged not allowed';
        const CHALLENGE_NOT_AWAITING: felt252   = 'DUEL: Challenge not Awaiting';
        const TABLE_IS_CLOSED: felt252          = 'DUEL: Table is closed';
        const PACT_EXISTS: felt252              = 'DUEL: Pact exists';
    }

    //*******************************
    fn TOKEN_NAME()   -> ByteArray {("Pistols at 10 Blocks Duels")}
    fn TOKEN_SYMBOL() -> ByteArray {("DUEL")}
    fn BASE_URI()     -> ByteArray {("https://pistols.underware.gg")}
    //*******************************

    fn dojo_init(
        ref self: ContractState,
        base_uri: felt252,
        minter_address: ContractAddress,
        renderer_address: ContractAddress,
        fee_amount: u128,
    ) {
        self.erc721.initializer(
            TOKEN_NAME(),
            TOKEN_SYMBOL(),
            if(base_uri != 0){base_uri.as_string()}else{BASE_URI()},
        );
        self.token.initialize(
            minter_address,
            renderer_address,
            payment: Default::default(),
        );
    }

    #[generate_trait]
    impl WorldDefaultImpl of WorldDefaultTrait {
        fn world_default(self: @ContractState) -> WorldStorage {
            self.world(@"pistols")
        }
    }


    //-----------------------------------
    // Public
    //
    use super::{IDuelTokenPublic};
    #[abi(embed_v0)]
    impl DuelTokenPublicImpl of IDuelTokenPublic<ContractState> {

        fn create_duel(ref self: ContractState,
            duelist_id: u128,
            challenged_id_or_address: ContractAddress,
            premise: Premise,
            quote: felt252,
            table_id: felt252,
            expire_hours: u64,
        ) -> u128 {
            let mut world = self.world_default();
            let caller: ContractAddress = get_caller_address();

            // transfer mint fee
            let fee_amount: u128 = self.calc_fee(table_id);
            if (fee_amount > 0) {
                assert(false, Errors::NOT_IMPLEMENTED);
            }

            // mint!
            let duel_id: u128 = self.token.mint(caller);

            // validate challenger
            let address_a: ContractAddress = caller;
            let duelist_id_a: u128 = duelist_id;
            let duelist_dispatcher: IDuelistTokenDispatcher = world.duelist_token_dispatcher();
            assert(duelist_dispatcher.is_owner_of(address_a, duelist_id_a) == true, Errors::NOT_YOUR_DUELIST);

            // validate table
            let mut store: Store = StoreTrait::new(world);
            let table: TableConfigValue = store.get_table_config_value(table_id);
            assert(table.is_open == true, Errors::TABLE_IS_CLOSED);
            let table_admittance: TableAdmittance = store.get_table_admittance(table_id);
            assert(table_admittance.can_join(address_a, duelist_id_a), Errors::CHALLENGER_NOT_ADMITTED);

            // validate challenged
            assert(challenged_id_or_address.is_non_zero(), Errors::INVALID_CHALLENGED_NULL);
            let duelist_id_b: u128 = DuelistTrait::try_address_to_id(challenged_id_or_address);
            let address_b: ContractAddress = if (duelist_id_b > 0) {
                // challenging a duelist...
                assert(duelist_dispatcher.exists(duelist_id_b) == true, Errors::INVALID_CHALLENGED);
                assert(duelist_id_a != duelist_id_b, Errors::INVALID_CHALLENGED_SELF);
                (ZERO())
            } else {
                // challenging a wallet...
                assert(challenged_id_or_address != address_a, Errors::INVALID_CHALLENGED_SELF);
                (challenged_id_or_address)
            };
            assert(table_admittance.can_join(address_b, duelist_id_b), Errors::CHALLENGED_NOT_ADMITTED);

            // calc expiration
            let timestamp_start: u64 = get_block_timestamp();
            let timestamp_end: u64 = if (expire_hours == 0) { 0 } else { timestamp_start + timestamp::from_hours(expire_hours) };

            // create challenge
            let challenge = Challenge {
                duel_id,
                table_id,
                premise,
                quote,
                // duelists
                address_a,
                address_b,
                duelist_id_a,
                duelist_id_b,
                // progress
                state: ChallengeState::Awaiting,
                winner: 0,
                // times
                timestamp_start,   // chalenge issued
                timestamp_end,     // expire
            };
            store.set_challenge(@challenge);

            // create Round, readu for player A to 
            let mut round = Round {
                duel_id: challenge.duel_id,
                state: RoundState::Commit,
                moves_a: Default::default(),
                moves_b: Default::default(),
                state_a: Default::default(),
                state_b: Default::default(),
                final_blow: 0,
            };
            // generate player deck seed
            round.moves_a.seed = world.vrf_dispatcher().consume_random();
            store.set_round(@round);

            // set the pact + assert it does not exist
            pact::set_pact(ref store, challenge);

            emitters::emitNewChallengeEvent(@world, challenge);

            (duel_id)
        }
        
        fn reply_duel(ref self: ContractState,
            duelist_id: u128,
            duel_id: u128,
            accepted: bool,
        ) -> ChallengeState {
            let mut world = self.world_default();
            
            // validate chalenge
            let mut store: Store = StoreTrait::new(world);
            let mut challenge: Challenge = store.get_challenge(duel_id);
            assert(challenge.state.exists(), Errors::INVALID_CHALLENGE);
            assert(challenge.state == ChallengeState::Awaiting, Errors::CHALLENGE_NOT_AWAITING);

            let address_b: ContractAddress = starknet::get_caller_address();
            let duelist_id_b: u128 = duelist_id;
            let timestamp: u64 = get_block_timestamp();

            if (challenge.timestamp_end > 0 && timestamp > challenge.timestamp_end) {
                // Expired, close it!
                challenge.state = ChallengeState::Expired;
                challenge.timestamp_end = timestamp;
            } else if (challenge.duelist_id_a == duelist_id_b) {
                // same duelist, can only withdraw...
                assert(accepted == false, Errors::INVALID_REPLY_SELF);
                challenge.state = ChallengeState::Withdrawn;
                challenge.timestamp_end = timestamp;
            } else {
                // validate duelist ownership
                let duelist_dispatcher = world.duelist_token_dispatcher();
// address_b.print();
// duelist_id_b.print();
// duelist_dispatcher.owner_of(duelist_id_b).print();
                assert(duelist_dispatcher.is_owner_of(address_b, duelist_id_b) == true, Errors::NOT_YOUR_DUELIST);

                // validate challenged identity
                // either wallet ot duelist was challenged, never both
                if (challenge.duelist_id_b != 0) {
                    // challenged the duelist...
                    // can only be accepted by it
                    assert(challenge.duelist_id_b == duelist_id_b, Errors::NOT_YOUR_CHALLENGE);
                    // fill missing wallet
                    challenge.address_b = address_b;
                } else {
                    // challenged the wallet...
                    // can only be accepted by that wallet
                    assert(challenge.address_b == address_b, Errors::NOT_YOUR_CHALLENGE);
                    // validate chosen duelist
                    assert(challenge.duelist_id_a != duelist_id_b, Errors::INVALID_CHALLENGED_SELF);
                    // remove pact between wallets
                    pact::unset_pact(ref store, challenge);
                    // fil missing duelist
                    challenge.duelist_id_b = duelist_id_b;
                    // create pact between duelists
                    pact::set_pact(ref store, challenge);
                }
                // all good!
                if (accepted) {
                    // Challenged is accepting
                    challenge.state = ChallengeState::InProgress;
                    challenge.timestamp_start = timestamp;
                    challenge.timestamp_end = 0;
                    // generate player deck seed
                    let mut round: Round = store.get_round(duel_id);
                    round.moves_b.seed = world.vrf_dispatcher().consume_random();
                    store.set_round(@round);
                    // events
                    emitters::emitChallengeAcceptedEvent(@world, challenge, accepted);
                    emitters::emitDuelistTurnEvent(@world, challenge);
                } else {
                    // Challenged is Refusing
                    challenge.state = ChallengeState::Refused;
                    challenge.timestamp_end = timestamp;
                    // events
                    emitters::emitChallengeAcceptedEvent(@world, challenge, accepted);
                }
            }

            // update challenge
            store.set_challenge(@challenge);

            // duel canceled!
            if (challenge.state.is_canceled()) {
                pact::unset_pact(ref store, challenge);
            }
            
            (challenge.state)
        }
        
        fn delete_duel(ref self: ContractState,
            duel_id: u128,
        ) {
            self.token.assert_is_owner_of(get_caller_address(), duel_id.into());
            assert(false, Errors::NOT_IMPLEMENTED);
            self.token.burn(duel_id.into());
        }



        //-----------------------------------
        // View calls
        //
        fn calc_fee(self: @ContractState, table_id: felt252) -> u128 {
            let mut store: Store = StoreTrait::new(self.world_default());
            let table: TableConfig = store.get_table_config(table_id);
            (table.calc_fee())
        }
        
        fn get_pact(self: @ContractState, table_id: felt252, duelist_id_a: u128, duelist_id_b: u128) -> u128 {
            let mut store: Store = StoreTrait::new(self.world_default());
            (pact::get_pact(ref store, table_id, duelist_id_a, duelist_id_b))
        }
        fn has_pact(self: @ContractState, table_id: felt252, duelist_id_a: u128, duelist_id_b: u128) -> bool {
            (self.get_pact(table_id, duelist_id_a, duelist_id_b) != 0)
        }

        fn can_join(self: @ContractState, table_id: felt252, duelist_id: u128) -> bool {
            let mut store: Store = StoreTrait::new(self.world_default());
            let table: TableConfigValue = store.get_table_config_value(table_id);
            let table_admittance: TableAdmittance = store.get_table_admittance(table_id);
            (table.is_open && table_admittance.can_join(starknet::get_caller_address(), duelist_id))
        }
    }



    //-----------------------------------
    // ITokenRenderer
    //
    use pistols::systems::components::erc721_hooks::{ITokenRenderer};
    #[abi(embed_v0)]
    impl TokenRendererImpl of ITokenRenderer<ContractState> {
        fn get_token_name(self: @ContractState, token_id: u256) -> ByteArray {
            (format!("Duel #{}", token_id))
        }
        fn get_token_description(self: @ContractState, token_id: u256) -> ByteArray {
            (format!("Pistols at 10 Blocks Duel #{}. https://pistols.underware.gg", token_id))
        }
        fn get_token_image(self: @ContractState, token_id: u256) -> ByteArray {
            let mut world = self.world_default();
            let mut store: Store = StoreTrait::new(world);
            let challenge: ChallengeValue = store.get_challenge_value(token_id.low);
            let duelist_a: DuelistValue = store.get_duelist_value(challenge.duelist_id_a);
            let duelist_b: DuelistValue = store.get_duelist_value(challenge.duelist_id_b);
            let base_uri: ByteArray = self.erc721._base_uri();
            let image_a: ByteArray = duelist_a.profile_pic_type.get_uri(base_uri.clone(), duelist_a.profile_pic_uri, "portrait");
            let image_b: ByteArray = duelist_b.profile_pic_type.get_uri(base_uri.clone(), duelist_b.profile_pic_uri, "portrait");
            let result: ByteArray = 
                "<svg xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='xMinYMin meet' viewBox='0 0 1942 1024'>" +
                "<image href='" +
                image_a +
                "' x='0' y='50' width='560px' height='924px' />" +
                "<image href='" +
                image_b +
                "' x='1380' y='50' width='560px' height='924px' />" +
                "<image href='" +
                base_uri +
                "/textures/cards/card_wide_brown.png' x='0' y='0' width='1942px' height='1024px' />" +
                "</svg>";
            (MetadataTrait::encode_svg(result, true))
        }

        // returns: [key1, value1, key2, value2,...]
        fn get_metadata_pairs(self: @ContractState, token_id: u256) -> Span<ByteArray> {
            ([].span())
        }
        fn get_attribute_pairs(self: @ContractState, token_id: u256) -> Span<ByteArray> {
            let mut world = self.world_default();
            let mut store: Store = StoreTrait::new(world);
            let challenge: ChallengeValue = store.get_challenge_value(token_id.low);
            let mut result: Array<ByteArray> = array![];
            let duelist_a: ByteArray = format!("Duelist #{}", challenge.duelist_id_a);
            let duelist_b: ByteArray = format!("Duelist #{}", challenge.duelist_id_b);
            let state: felt252 = challenge.state.into();
            // Meta
            result.append("Table");
            result.append(challenge.table_id.as_string());
            result.append("Challenger");
            result.append(duelist_a.clone());
            result.append("Challenged");
            result.append(duelist_b.clone());
            result.append("Premise");
            result.append(challenge.premise.name().as_string());
            result.append("Quote");
            result.append(challenge.quote.as_string());
            result.append("State");
            result.append(state.as_string());
            if (challenge.winner != 0) {
                result.append("Winner");
                result.append(if(challenge.winner==1){duelist_a}else{duelist_b});
            }
            // done!
            (result.span())
        }
    }
}
