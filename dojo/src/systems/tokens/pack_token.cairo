use starknet::{ContractAddress};
use dojo::world::IWorldDispatcher;
use pistols::models::pack::{Pack, PackType};

#[starknet::interface]
pub trait IPackToken<TState> {
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

    // IPackTokenPublic
    fn can_claim_starter_pack(self: @TState, recipient: ContractAddress) -> bool;
    fn can_purchase(self: @TState, recipient: ContractAddress, pack_type: PackType) -> bool;
    fn calc_mint_fee(self: @TState, recipient: ContractAddress, pack_type: PackType) -> u128;
    fn claim_starter_pack(ref self: TState) -> Span<u128>;
    fn purchase(ref self: TState, pack_type: PackType) -> Pack;
    fn open(ref self: TState, pack_id: u128) -> Span<u128>;
}

// Exposed to clients
#[starknet::interface]
pub trait IPackTokenPublic<TState> {
    // view
    fn can_claim_starter_pack(self: @TState, recipient: ContractAddress) -> bool;
    fn can_purchase(self: @TState, recipient: ContractAddress, pack_type: PackType) -> bool;
    fn calc_mint_fee(self: @TState, recipient: ContractAddress, pack_type: PackType) -> u128;
    // write
    fn claim_starter_pack(ref self: TState) -> Span<u128>; //@description: Claim the starter pack, mint Duelists
    fn purchase(ref self: TState, pack_type: PackType) -> Pack; //@description: Purchase a closed pack
    fn open(ref self: TState, pack_id: u128) -> Span<u128>; //@description: Open a pack, mint its contents
}

#[dojo::contract]
pub mod pack_token {    
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
        IBankDispatcherTrait,
        IVrfProviderDispatcherTrait, Source,
    };
    use pistols::models::{
        pack::{Pack, PackTrait, PackValue, PackType, PackTypeTrait},
        player::{Player, PlayerTrait},
        events::{Activity},
    };
    use pistols::libs::store::{Store, StoreTrait};
    use pistols::utils::short_string::{ShortStringTrait};
    use pistols::utils::byte_arrays::{BoolToStringTrait};
    use pistols::types::constants::{METADATA};
    use pistols::utils::misc::{ZERO};

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
        self.erc721_combo.initializer(
            TOKEN_NAME(),
            TOKEN_SYMBOL(),
            base_uri.to_string(),
            Option::None, // contract_uri (use hooks)
            Option::None, // max_supply (infinite)
        );
        self.token.initialize(
            ZERO(),
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
    impl PackTokenPublicImpl of super::IPackTokenPublic<ContractState> {

        fn can_claim_starter_pack(self: @ContractState, recipient: ContractAddress) -> bool {
            let mut store: Store = StoreTrait::new(self.world_default());
            let player: Player = store.get_player(recipient);
            (!player.timestamps.claimed_starter_pack)
        }

        fn can_purchase(self: @ContractState, recipient: ContractAddress, pack_type: PackType) -> bool {
            (!self.can_claim_starter_pack(recipient) && pack_type.can_purchase())
        }

        fn calc_mint_fee(self: @ContractState, recipient: ContractAddress, pack_type: PackType) -> u128 {
            (pack_type.mint_fee())
        }

        fn claim_starter_pack(ref self: ContractState) -> Span<u128> {
            let mut store: Store = StoreTrait::new(self.world_default());

            // validate
            let recipient: ContractAddress = starknet::get_caller_address();
            assert(self.can_claim_starter_pack(recipient), Errors::ALREADY_CLAIMED);

            // mint
            let lords_amount: u128 = self.calc_mint_fee(recipient, PackType::StarterPack);
            let pack: Pack = self._mint_pack(PackType::StarterPack, recipient, recipient.into(), lords_amount);
            
            // events
            PlayerTrait::check_in(ref store, Activity::PackStarter, recipient, pack.pack_id.into());

            // open immediately
            (self.open(pack.pack_id))
        }

        fn purchase(ref self: ContractState, pack_type: PackType) -> Pack {
            let mut store: Store = StoreTrait::new(self.world_default());

            // validate pack
            assert(pack_type.can_purchase(), Errors::NOT_FOR_SALE);

            // validate recipient
            let recipient: ContractAddress = starknet::get_caller_address();
            assert(!self.can_claim_starter_pack(recipient), Errors::CLAIM_FIRST);

            // transfer mint fee
            let lords_amount: u128 = self.calc_mint_fee(recipient, pack_type);
            if (lords_amount != 0) {
                store.world.bank_dispatcher().charge_purchase(recipient, lords_amount.into());
            }

            // create vrf seed
            let seed: felt252 = store.vrf_dispatcher().consume_random(Source::Nonce(recipient));

            // mint
            let pack: Pack = self._mint_pack(pack_type, recipient, seed, lords_amount);
            
            // events
            PlayerTrait::check_in(ref store, Activity::PackPurchased, recipient, pack.pack_id.into());

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

            // events
            PlayerTrait::check_in(ref store, Activity::PackOpened, recipient, pack_id.into());

            // open...
            let token_ids: Span<u128> = pack.open(ref store, recipient);

            // minted fame, peg to paid LORDS
            store.world.bank_dispatcher().peg_minted_fame_to_purchased_lords(recipient, pack.lords_amount.into());

            // burn!
            self.erc721.burn(pack_id.into());

            (token_ids)
        }
    }


    //-----------------------------------
    // Internal
    //
    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn _mint_pack(ref self: ContractState,
            pack_type: PackType,
            recipient: ContractAddress,
            seed: felt252,
            lords_amount: u128,
        ) -> Pack {
            let mut store: Store = StoreTrait::new(self.world_default());

            // mint!
            let token_id: u128 = self.token.mint(recipient);

            // create Duelist
            let mut pack = Pack {
                pack_id: token_id,
                pack_type,
                seed,
                lords_amount,
                is_open: false,
            };
            store.set_pack(@pack);

            (pack)
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
                description: "Pistols at Dawn Packs",
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
            let pack: PackValue = store.get_pack_value(token_id.low);
            // Attributes
            let mut attributes: Array<Attribute> = array![
                Attribute {
                    key: "Type",
                    value: pack.pack_type.name(),
                },
                Attribute {
                    key: "Is Open",
                    value: pack.is_open.to_string(),
                },
            ];
            // return the metadata to be rendered by the component
            // https://docs.opensea.io/docs/metadata-standards#metadata-structure
            let metadata = TokenMetadata {
                token_id,
                name: format!("{} #{}", pack.pack_type.name(), token_id),
                description: format!("Pistols at Dawn Pack #{}. https://pistols.gg", token_id),
                image: format!("{}/pistols{}", base_uri, pack.pack_type.image_url(pack.is_open)),
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

        // optional hooks from ERC721Component::ERC721HooksTrait
        // fn before_update(ref self: ERC721ComboComponent::ComponentState<ContractState>, to: ContractAddress, token_id: u256, auth: ContractAddress) {}
        // fn after_update(ref self: ERC721ComboComponent::ComponentState<ContractState>, to: ContractAddress, token_id: u256, auth: ContractAddress) {
        // ) {
        //     // avoid transfer after opened
        //     let mut world = DnsTrait::storage(self.get_contract().world_dispatcher(), @"pistols");
        //     let mut store: Store = StoreTrait::new(world);
        //     let pack: Pack = store.get_pack(token_id.low);
        //     assert(!pack.is_open, Errors::ALREADY_OPENED);
        // }
    }

}
