use starknet::{ContractAddress};
use dojo::world::IWorldDispatcher;
use pistols::models::duelist::{Duelist, ProfilePicType, Archetype};

#[starknet::interface]
pub trait IDuelistToken<TState> {
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

    // IDuelistTokenPublic
    fn calc_mint_fee(self: @TState, recipient: ContractAddress) -> u128;
    fn create_duelist(ref self: TState, recipient: ContractAddress, name: felt252, profile_pic_type: ProfilePicType, profile_pic_uri: felt252) -> Duelist;
    fn update_duelist(ref self: TState, duelist_id: u128, name: felt252, profile_pic_type: ProfilePicType, profile_pic_uri: felt252) -> Duelist;
    fn delete_duelist(ref self: TState, duelist_id: u128);
    fn calc_fame_reward(self: @TState, duelist_id: u128) -> u128;
    fn transfer_fame_reward(ref self: TState, duel_id: u128) -> u128;
}

#[starknet::interface]
pub trait IDuelistTokenPublic<TState> {
    fn calc_mint_fee(
        self: @TState,
        recipient: ContractAddress,
    ) -> u128;
    fn create_duelist(
        ref self: TState,
        recipient: ContractAddress,
        name: felt252,
        profile_pic_type: ProfilePicType,
        profile_pic_uri: felt252,
    ) -> Duelist;
    fn update_duelist(
        ref self: TState,
        duelist_id: u128,
        name: felt252,
        profile_pic_type: ProfilePicType,
        profile_pic_uri: felt252,
    ) -> Duelist;
    fn delete_duelist(
        ref self: TState,
        duelist_id: u128,
    );
    fn calc_fame_reward(
        self: @TState,
        duelist_id: u128,
    ) -> u128;
    fn transfer_fame_reward(
        ref self: TState,
        duel_id: u128,
    ) -> u128;
}

#[dojo::contract]
pub mod duelist_token {    
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
    // use pistols::systems::components::erc721_hooks::{ERC721HooksImpl};
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
        IBankDispatcher, IBankDispatcherTrait,
        IFameCoinDispatcher, IFameCoinDispatcherTrait,
    };
    use pistols::models::{
        duelist::{
            Duelist, DuelistValue,
            Score, ScoreTrait,
            ProfilePicType, ProfilePicTypeTrait,
            Archetype,
            ScoreboardValue,
        },
        challenge::{
            ChallengeValue,
        },
        config::{
            TokenConfig, TokenConfigValue,
        },
        payment::{Payment},
        table::{TABLES},
    };
    use pistols::types::constants::{CONST, FAME};
    use pistols::libs::events::{emitters};
    use pistols::libs::store::{Store, StoreTrait};
    use pistols::utils::metadata::{MetadataTrait};
    use pistols::utils::short_string::ShortStringTrait;
    use pistols::utils::math::{MathTrait};

    mod Errors {
        const INVALID_DUELIST: felt252          = 'DUELIST: Invalid duelist';
        const NOT_IMPLEMENTED: felt252          = 'DUELIST: Not implemented';
        const DUEL_INVALID_CALLER: felt252      = 'DUELIST: Invalid caller';
        const DUEL_HAS_NO_WINNER: felt252       = 'DUELIST: Duel has no winner';
        const REWARD_TRANSFERRED: felt252       = 'DUELIST: Reward transferred';
    }

    //*******************************
    fn TOKEN_NAME()   -> ByteArray {("Pistols at 10 Blocks Duelists")}
    fn TOKEN_SYMBOL() -> ByteArray {("DUELIST")}
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
        let payment = Payment {
            key: get_contract_address().into(),
            amount: fee_amount.into(),
            client_percent: 0,
            ranking_percent: 0,
            owner_percent: 0,
            pool_percent: 0,
            treasury_percent: 100,
        };
        self.token.initialize(
            minter_address,
            renderer_address,
            payment,
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
    use super::{IDuelistTokenPublic};
    #[abi(embed_v0)]
    impl DuelistTokenPublicImpl of IDuelistTokenPublic<ContractState> {

        fn calc_mint_fee(self: @ContractState,
            recipient: ContractAddress,
        ) -> u128 {
            (self.get_payment(recipient).amount.low)
        }

        fn create_duelist(ref self: ContractState,
            recipient: ContractAddress,
            name: felt252,
            profile_pic_type: ProfilePicType,
            profile_pic_uri: felt252,
        ) -> Duelist {
            let mut world = self.world_default();

            // transfer mint fee
            let payment: Payment = self.get_payment(recipient);
            if (payment.amount > 0) { // avoid bank contract during tests
                world.bank_dispatcher().charge(recipient, payment);
            }

            // mint!
            let token_id: u128 = self.token.mint(recipient);

            // create Duelist
            let mut duelist = Duelist {
                duelist_id: token_id,
                timestamp: get_block_timestamp(),
                name,
                profile_pic_type,
                profile_pic_uri: profile_pic_uri.as_string(),
                score: Default::default(),
            };
            
            // save
            let mut store: Store = StoreTrait::new(world);
            store.set_duelist(@duelist);

            // mint fame
            let fame_dispatcher: IFameCoinDispatcher = world.fame_coin_dispatcher();
            fame_dispatcher.minted_duelist(duelist.duelist_id, payment.amount);

            emitters::emitDuelistRegisteredEvent(@world, recipient, duelist.clone(), true);

            (duelist)
        }

        fn update_duelist(ref self: ContractState,
            duelist_id: u128,
            name: felt252,
            profile_pic_type: ProfilePicType,
            profile_pic_uri: felt252,
        ) -> Duelist {
            // validate owner
            self.token.assert_is_owner_of(get_caller_address(), duelist_id.into());

            // validate duelist
            let mut world = self.world_default();
            let mut store: Store = StoreTrait::new(world);
            let mut duelist: Duelist = store.get_duelist(duelist_id);
            assert(duelist.timestamp != 0, Errors::INVALID_DUELIST);

            // update
            duelist.name = name;
            duelist.profile_pic_type = profile_pic_type;
            duelist.profile_pic_uri = profile_pic_uri.as_string();
            // save
            store.set_duelist(@duelist);

            emitters::emitDuelistRegisteredEvent(@world, get_caller_address(), duelist.clone(), false);

            (duelist)
        }
        
        fn delete_duelist(ref self: ContractState,
            duelist_id: u128,
        ) {
            self.token.assert_is_owner_of(get_caller_address(), duelist_id.into());
            // duelist burn not supported
            assert(false, Errors::NOT_IMPLEMENTED);
            // self.token.burn(duelist_id.into());
            // burn FAME too
        }

        fn calc_fame_reward(
            self: @ContractState,
            duelist_id: u128,
        ) -> u128 {
            let fame_dispatcher: IFameCoinDispatcher = self.world_default().fame_coin_dispatcher();
            let fame_balance: u256 = fame_dispatcher.balance_of_token(get_contract_address(), duelist_id);
            let fame_reward: u256 = (fame_balance / 2);
            (if (fame_reward >= FAME::MIN_REWARD_AMOUNT) {(fame_reward.low)} else {(fame_balance.low)})
        }

        fn transfer_fame_reward(
            ref self: ContractState,
            duel_id: u128,
        ) -> u128 {
            let mut world = self.world_default();
            assert(world.is_game_contract(get_caller_address()), Errors::DUEL_INVALID_CALLER);
            
            let mut store: Store = StoreTrait::new(world);
            let challenge: ChallengeValue = store.get_challenge_value(duel_id);
            assert(challenge.winner != 0, Errors::DUEL_HAS_NO_WINNER);
            assert(challenge.reward_amount == 0, Errors::REWARD_TRANSFERRED);

            let (from, to): (u128, u128) = 
                if (challenge.winner == 1) {(challenge.duelist_id_b, challenge.duelist_id_a)}
                else {(challenge.duelist_id_a, challenge.duelist_id_b)};
            let amount = self.calc_fame_reward(from);
            if (amount > 0) {
                let fame_dispatcher: IFameCoinDispatcher = world.fame_coin_dispatcher();
                fame_dispatcher.transfer_from_token(get_contract_address(), from, to, amount.into());
            }
            (amount)
        }

    }


    //-----------------------------------
    // Internal
    //
    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn get_payment(self: @ContractState,
            recipient: ContractAddress,
        ) -> Payment {
            if (self.erc721.balance_of(recipient) == 0) {
                (Default::default()) // first is free
            } else {
                let mut world = self.world_default();
                let mut store: Store = StoreTrait::new(world);
                (store.get_payment(get_contract_address().into()))
            }
        }
    }


    //-----------------------------------
    // ERC721HooksTrait
    //
    use pistols::systems::components::erc721_hooks::{TokenConfigRenderTrait};
    pub impl ERC721HooksImpl of ERC721Component::ERC721HooksTrait<ContractState> {
        fn before_update(ref self: ERC721Component::ComponentState<ContractState>,
            to: ContractAddress,
            token_id: u256,
            auth: ContractAddress,
        ) {
            let mut world = SystemsTrait::storage(self.get_contract().world_dispatcher(), @"pistols");
            let fame_dispatcher: IFameCoinDispatcher = world.fame_coin_dispatcher();
            let owner: ContractAddress = self._owner_of(token_id);
            fame_dispatcher.updated_duelist(owner, to, token_id.low);
        }

        fn after_update(ref self: ERC721Component::ComponentState<ContractState>,
            to: ContractAddress,
            token_id: u256,
            auth: ContractAddress,
        ) {}

        // same as ERC721HooksImpl::token_uri()
        fn token_uri(self: @ERC721Component::ComponentState<ContractState>, token_id: u256) -> ByteArray {
            let mut world = SystemsTrait::storage(self.get_contract().world_dispatcher(), @"pistols");
            let mut store: Store = StoreTrait::new(world);
            (store.get_token_config(get_contract_address()).render(token_id))
        }
    }



    //-----------------------------------
    // ITokenRenderer
    //
    use pistols::systems::components::erc721_hooks::{ITokenRenderer};
    #[abi(embed_v0)]
    impl TokenRendererImpl of ITokenRenderer<ContractState> {
        fn get_token_name(self: @ContractState, token_id: u256) -> ByteArray {
            let mut world = self.world_default();
            let mut store: Store = StoreTrait::new(world);
            let duelist: DuelistValue = store.get_duelist_value(token_id.low);
            (format!("{} #{}",
                if (duelist.name != '') { duelist.name.as_string() } else { "Duelist" },
                token_id
            ))
        }

        fn get_token_description(self: @ContractState, token_id: u256) -> ByteArray {
            (format!("Pistols at 10 Blocks Duelist #{}. https://pistols.underware.gg", token_id))
        }

        fn get_token_image(self: @ContractState, token_id: u256) -> ByteArray {
            let mut world = self.world_default();
            let mut store: Store = StoreTrait::new(world);
            let duelist: DuelistValue = store.get_duelist_value(token_id.low);
            let base_uri: ByteArray = self.erc721._base_uri();
            let image_square: ByteArray = duelist.profile_pic_type.get_uri(base_uri.clone(), duelist.profile_pic_uri, "square");
            let result: ByteArray = 
                "<svg xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='xMinYMin meet' viewBox='0 0 1024 1434'>" +
                "<image href='" + 
                image_square +
                "' x='0' y='0' width='1024px' height='1024px' />" +
                "<image href='" +
                base_uri +
                "/textures/cards/card_front_brown.png' x='0' y='0' width='1024px' height='1434px' />" +
                "</svg>";
            (MetadataTrait::encode_svg(result, true))
        }

        // returns: [key1, value1, key2, value2,...]
        fn get_metadata_pairs(self: @ContractState, token_id: u256) -> Span<ByteArray> {
            let mut world = self.world_default();
            let mut store: Store = StoreTrait::new(world);
            let duelist: DuelistValue = store.get_duelist_value(token_id.low);
            let base_uri: ByteArray = self.erc721._base_uri();
            let mut result: Array<ByteArray> = array![];
            result.append("square");
            result.append(duelist.profile_pic_type.get_uri(base_uri.clone(), duelist.profile_pic_uri.clone(), "square"));
            result.append("portrait");
            result.append(duelist.profile_pic_type.get_uri(base_uri.clone(), duelist.profile_pic_uri.clone(), "portrait"));
            (result.span())
        }

        // returns: [key1, value1, key2, value2,...]
        fn get_attribute_pairs(self: @ContractState, token_id: u256) -> Span<ByteArray> {
            let mut world = self.world_default();
            let mut store: Store = StoreTrait::new(world);
            let duelist: DuelistValue = store.get_duelist_value(token_id.low);
            let mut result: Array<ByteArray> = array![];
            // Honour
            result.append("Honour");
            result.append(ScoreTrait::format_honour(duelist.score.honour));
            // Archetype
            let archetype: Archetype = duelist.score.get_archetype();
            result.append("Archetype");
            result.append(archetype.into());
            // Fame
            let fame_dispatcher: IFameCoinDispatcher = world.fame_coin_dispatcher();
            let fame_balance: u256 = fame_dispatcher.balance_of_token(get_contract_address(), token_id.low) / CONST::ETH_TO_WEI;
            result.append("Fame");
            result.append(fame_balance.as_string());
            // Totals
            result.append("Total Duels");
            result.append(duelist.score.total_duels.as_string());
            if (duelist.score.total_duels > 0) {
                result.append("Total Wins");
                result.append(duelist.score.total_wins.as_string());

                result.append("Total Losses");
                result.append(duelist.score.total_losses.as_string());
                
                result.append("Total Draws");
                result.append(duelist.score.total_draws.as_string());
            }
            // done!
            (result.span())
        }
    }
}
