use starknet::{ContractAddress};
use dojo::world::IWorldDispatcher;
use pistols::models::pack::{Pack, PackType};

#[starknet::interface]
pub trait IPackToken<TState> {
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
    fn can_mint(self: @TState, recipient: ContractAddress) -> bool;
    fn exists(self: @TState, token_id: u128) -> bool;
    fn is_owner_of(self: @TState, address: ContractAddress, token_id: u128) -> bool;

    // ITokenRenderer
    fn get_token_name(self: @TState, token_id: u256) -> ByteArray;
    fn get_token_description(self: @TState, token_id: u256) -> ByteArray;
    fn get_token_image(self: @TState, token_id: u256) -> ByteArray;

    // IPackTokenPublic
    fn can_claim_welcome_pack(self: @TState, recipient: ContractAddress) -> bool;
    fn can_purchase(self: @TState, recipient: ContractAddress, pack_type: PackType) -> bool;
    fn calc_mint_fee(self: @TState, recipient: ContractAddress, pack_type: PackType) -> u128;
    fn claim_welcome_pack(ref self: TState) -> Span<u128>;
    fn purchase(ref self: TState, pack_type: PackType) -> Pack;
    fn open(ref self: TState, pack_id: u128) -> Span<u128>;
}

#[starknet::interface]
pub trait IPackTokenPublic<TState> {
    // view
    fn can_claim_welcome_pack(self: @TState, recipient: ContractAddress) -> bool;
    fn can_purchase(self: @TState, recipient: ContractAddress, pack_type: PackType) -> bool;
    fn calc_mint_fee(self: @TState, recipient: ContractAddress, pack_type: PackType) -> u128;
    // write
    fn claim_welcome_pack(ref self: TState) -> Span<u128>;
    fn purchase(ref self: TState, pack_type: PackType) -> Pack;
    fn open(ref self: TState, pack_id: u128) -> Span<u128>;
}

#[dojo::contract]
pub mod pack_token {    
    use starknet::{ContractAddress};
    use dojo::world::{WorldStorage};

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
        IBankDispatcherTrait,
        IVrfProviderDispatcherTrait, Source,
    };
    use pistols::models::{
        pack::{Pack, PackTrait, PackValue, PackType, PackTypeTrait},
        player::{Player, PlayerTrait, Activity},
        payment::{Payment},
    };
    use pistols::libs::store::{Store, StoreTrait};
    use pistols::utils::short_string::{ShortStringTrait};
    use pistols::utils::byte_arrays::{BoolToStringTrait};
    use pistols::utils::misc::{ZERO, CONSUME_U256};

    pub mod Errors {
        pub const NOT_IMPLEMENTED: felt252      = 'PACK: Not implemented';
        pub const ALREADY_CLAIMED: felt252      = 'PACK: Already claimed';
        pub const CLAIM_FIRST: felt252          = 'PACK: Claim duelists first';
        pub const NOT_FOR_SALE: felt252         = 'PACK: Not for sale';
        pub const ALREADY_OPENED: felt252       = 'PACK: Already opened';
        pub const NOT_OWNER: felt252            = 'PACK: Not owner';
    }

    //*******************************
    fn TOKEN_NAME()   -> ByteArray {("Pistols at Dawn Packs")}
    fn TOKEN_SYMBOL() -> ByteArray {("PACK")}
    //*******************************

    fn dojo_init(
        ref self: ContractState,
        base_uri: felt252,
    ) {
        self.erc721.initializer(
            TOKEN_NAME(),
            TOKEN_SYMBOL(),
            format!("https://{}",base_uri.to_string()),
        );
        let payment = Payment {
            key: starknet::get_contract_address().into(),
            amount: 0,
            client_percent: 0,
            ranking_percent: 0,
            owner_percent: 0,
            pool_percent: 0,
            treasury_percent: 100,
        };
        self.token.initialize(
            ZERO(),
            ZERO(),
            payment,
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
    use super::{IPackTokenPublic};
    #[abi(embed_v0)]
    impl PackTokenPublicImpl of IPackTokenPublic<ContractState> {

        fn can_claim_welcome_pack(self: @ContractState, recipient: ContractAddress) -> bool {
            let mut store: Store = StoreTrait::new(self.world_default());
            let player: Player = store.get_player(recipient);
            (!player.claimed_welcome_pack)
        }

        fn can_purchase(self: @ContractState, recipient: ContractAddress, pack_type: PackType) -> bool {
            (!self.can_claim_welcome_pack(recipient) && pack_type.can_purchase())
        }

        fn calc_mint_fee(self: @ContractState, recipient: ContractAddress, pack_type: PackType) -> u128 {
            (self.get_payment(recipient, pack_type).amount.low)
        }

        fn claim_welcome_pack(ref self: ContractState) -> Span<u128> {
            let mut store: Store = StoreTrait::new(self.world_default());

            // validate
            let recipient: ContractAddress = starknet::get_caller_address();
            assert(self.can_claim_welcome_pack(recipient), Errors::ALREADY_CLAIMED);

            // mint
            let pack: Pack = self.mint_pack(PackType::WelcomePack, recipient, recipient.into());
            
            // events
            PlayerTrait::check_in(ref store, Activity::WelcomePack, recipient, 0);

            // open immediately
            (self.open(pack.pack_id))
        }

        fn purchase(ref self: ContractState, pack_type: PackType) -> Pack {
            let mut store: Store = StoreTrait::new(self.world_default());

            // validate pack
            assert(pack_type.can_purchase(), Errors::NOT_FOR_SALE);

            // validate recipient
            let recipient: ContractAddress = starknet::get_caller_address();
            assert(!self.can_claim_welcome_pack(recipient), Errors::CLAIM_FIRST);

            // transfer mint fee
            let payment: Payment = self.get_payment(recipient, pack_type);
            if (payment.amount != 0) {
                store.world.bank_dispatcher().charge(recipient, payment);
            }

            // create vrf seed
            let seed: felt252 = store.world.vrf_dispatcher().consume_random(Source::Nonce(starknet::get_contract_address()));

            // mint
            let pack: Pack = self.mint_pack(pack_type, recipient, seed);
            
            // events
            PlayerTrait::check_in(ref store, Activity::PurchasedPack, recipient, pack.pack_type.identifier());

            (pack)
        }

        fn open(ref self: ContractState, pack_id: u128) -> Span<u128> {
            let mut store: Store = StoreTrait::new(self.world_default());

            // validate owner
            let recipient: ContractAddress = self.owner_of(pack_id.into());
            assert(recipient == starknet::get_caller_address(), Errors::NOT_OWNER);

            // check if already opened
            let mut pack: Pack = store.get_pack(pack_id);
            assert(!pack.is_open, Errors::ALREADY_OPENED);

            // open...
            let token_ids: Span<u128> = pack.open(ref store, recipient);

            // burn!
            self.token.burn(pack_id.into());

            (token_ids)
        }
    }


    //-----------------------------------
    // Internal
    //
    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn mint_pack(ref self: ContractState,
            pack_type: PackType,
            recipient: ContractAddress,
            seed: felt252,
        ) -> Pack {
            let mut store: Store = StoreTrait::new(self.world_default());

            // mint!
            let token_id: u128 = self.token.mint(recipient);

            // create Duelist
            let mut pack = Pack {
                pack_id: token_id,
                pack_type,
                seed,
                is_open: false,
            };
            store.set_pack(@pack);

            (pack)
        }
        
        fn get_payment(self: @ContractState, recipient: ContractAddress, pack_type: PackType) -> Payment {
            let mut store: Store = StoreTrait::new(self.world_default());
            let mut payment: Payment = store.get_payment(starknet::get_contract_address().into());
            payment.amount = pack_type.mint_fee();
            (payment)
        }
    }


    //-----------------------------------
    // ERC721HooksTrait
    //
    // use pistols::systems::components::erc721_hooks::{TokenRendererTrait};
    // pub impl ERC721HooksImpl of ERC721Component::ERC721HooksTrait<ContractState> {
    //     fn before_update(ref self: ERC721Component::ComponentState<ContractState>,
    //         to: ContractAddress,
    //         token_id: u256,
    //         auth: ContractAddress,
    //     ) {}

    //     fn after_update(ref self: ERC721Component::ComponentState<ContractState>,
    //         to: ContractAddress,
    //         token_id: u256,
    //         auth: ContractAddress,
    //     ) {
    //         // avoid transfer after opened
    //         let mut world = SystemsTrait::storage(self.get_contract().world_dispatcher(), @"pistols");
    //         let mut store: Store = StoreTrait::new(world);
    //         let pack: Pack = store.get_pack(token_id.low);
    //         assert(!pack.is_open, Errors::ALREADY_OPENED);
    //     }

    //     // same as ERC721HooksImpl::token_uri()
    //     fn token_uri(self: @ERC721Component::ComponentState<ContractState>, token_id: u256) -> ByteArray {
    //         (self.get_contract().render_token_uri(token_id))
    //     }
    // }


    //-----------------------------------
    // ITokenRenderer
    //
    use pistols::systems::components::erc721_hooks::{ITokenRenderer};
    #[abi(embed_v0)]
    impl TokenRendererImpl of ITokenRenderer<ContractState> {
        fn get_token_name(self: @ContractState, token_id: u256) -> ByteArray {
            let mut store: Store = StoreTrait::new(self.world_default());
            let pack: PackValue = store.get_pack_value(token_id.low);
            (format!("{} #{}",
                pack.pack_type.name(),
                token_id,
            ))
        }

        fn get_token_description(self: @ContractState, token_id: u256) -> ByteArray {
            (format!("Pistols at Dawn Pack #{}. https://pistols.underware.gg", token_id))
        }

        fn get_token_image(self: @ContractState, token_id: u256) -> ByteArray {
            let mut store: Store = StoreTrait::new(self.world_default());
            let pack: PackValue = store.get_pack_value(token_id.low);
            (format!("{}{}",
                self.erc721._base_uri(),
                pack.pack_type.image_url(pack.is_open),
            ))
        }

        // returns: [key1, value1, key2, value2,...]
        fn get_metadata_pairs(self: @ContractState, token_id: u256) -> Span<ByteArray> {
            CONSUME_U256(token_id);
            ([].span())
        }

        // returns: [key1, value1, key2, value2,...]
        fn get_attribute_pairs(self: @ContractState, token_id: u256) -> Span<ByteArray> {
            let mut store: Store = StoreTrait::new(self.world_default());
            let pack: PackValue = store.get_pack_value(token_id.low);
            let mut result: Array<ByteArray> = array![];
            // metadata
            result.append("Type");
            result.append(pack.pack_type.name());
            result.append("Is Open");
            result.append(pack.is_open.to_string());
            // done!
            (result.span())
        }
    }
}
