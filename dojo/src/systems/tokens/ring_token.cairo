use starknet::{ContractAddress};
use dojo::world::IWorldDispatcher;
use pistols::models::ring::{RingType};

#[starknet::interface]
pub trait IRingToken<TState> {
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

    // IRingTokenPublic
    fn get_claimable_season_ring_type(self: @TState, recipient: ContractAddress, duel_id: u128) -> Option<RingType>;
    fn claim_season_ring(ref self: TState, recipient: ContractAddress, ring_type: RingType, duel_id: u128) -> bool;
    fn airdrop_ring(ref self: TState, recipient: ContractAddress, ring_type: RingType) -> bool;
}

// Exposed to clients
#[starknet::interface]
pub trait IRingTokenPublic<TState> {
    // view
    fn get_claimable_season_ring_type(self: @TState, recipient: ContractAddress, duel_id: u128) -> Option<RingType>;
    // write
    fn claim_season_ring(ref self: TState, recipient: ContractAddress, ring_type: RingType, duel_id: u128) -> bool;
    fn airdrop_ring(ref self: TState, recipient: ContractAddress, ring_type: RingType) -> bool;
}

#[dojo::contract]
pub mod ring_token {    
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
        IBankProtectedDispatcherTrait,
        IVrfProviderDispatcherTrait, Source,
    };
    use pistols::models::{
        ring::{Ring, RingValue, RingType, RingTypeTrait},
        player::{Player, PlayerTrait},
        events::{Activity},
        pool::{PoolType},
    };
    use pistols::libs::store::{Store, StoreTrait};
    use pistols::utils::short_string::{ShortStringTrait};
    use pistols::utils::byte_arrays::{BoolToStringTrait};
    use pistols::types::timestamp::{TimestampTrait, TIMESTAMP};
    use pistols::types::constants::{METADATA};
    use pistols::utils::misc::{ZERO};

    pub mod Errors {
        pub const NOT_IMPLEMENTED: felt252      = 'RING: Not implemented';
        pub const INELIGIBLE: felt252           = 'RING: Ineligible';
        pub const NOT_OWNER: felt252            = 'RING: Not owner';
    }

    //*******************************
    fn TOKEN_NAME()   -> ByteArray {("Pistols at Dawn Rings")}
    fn TOKEN_SYMBOL() -> ByteArray {("RING")}
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
    impl RingTokenPublicImpl of super::IRingTokenPublic<ContractState> {

        fn get_claimable_season_ring_type(self: @ContractState, recipient: ContractAddress, duel_id: u128) -> Option<RingType> {
            // let mut store: Store = StoreTrait::new(self.world_default());
            // let player: Player = store.get_player(recipient);
            // (!player.timestamps.claimed_starter_pack)
            (Option::None)
        }
        fn claim_season_ring(ref self: ContractState, recipient: ContractAddress, ring_type: RingType, duel_id: u128) -> bool {
            // let recipient: ContractAddress = starknet::get_caller_address();
            // assert(self.can_claim_starter_pack(recipient), Errors::INELIGIBLE);

            // // mint
            // let lords_amount: u128 = self.calc_mint_fee(recipient, PackType::StarterPack);
            // let pack: Pack = self._mint_pack(PackType::StarterPack, recipient, recipient.into(), lords_amount);
            
            // // events
            // let mut store: Store = StoreTrait::new(self.world_default());
            // PlayerTrait::check_in(ref store, Activity::PackStarter, recipient, pack.pack_id.into());

            // // open immediately
            // (self.open(pack.pack_id))
            (false)
        }
        //
        // adin
        //
        fn airdrop_ring(ref self: ContractState, recipient: ContractAddress, ring_type: RingType) -> bool {
            (false)
        }
    }


    //-----------------------------------
    // Internal
    //
    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn _mint_ring(ref self: ContractState,
            ring_type: RingType,
            recipient: ContractAddress,
            seed: felt252,
            lords_amount: u128,
        ) -> Ring {
            let mut store: Store = StoreTrait::new(self.world_default());

            // mint!
            let token_id: u128 = self.token.mint_next(recipient);

            // create Duelist
            let mut ring = Ring {
                ring_id: token_id,
                ring_type,
                granted_player_address: recipient,
            };
            store.set_ring(@ring);

            (ring)
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
                description: "Pistols at Dawn Rings",
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
            let ring: RingValue = store.get_ring_value(token_id.low);
            // Attributes
            let mut attributes: Array<Attribute> = array![
                Attribute {
                    key: "Type",
                    value: ring.ring_type.name(),
                },
                // Attribute {
                //     key: "Granted Player",
                //     value: ring.granted_player_address.to_string(),
                // },
            ];
            // return the metadata to be rendered by the component
            // https://docs.opensea.io/docs/metadata-standards#metadata-structure
            let metadata = TokenMetadata {
                token_id,
                name: format!("{} #{}", ring.ring_type.name(), token_id),
                description: format!("Pistols at Dawn Ring #{}. {}. https://pistols.gg", token_id, ring.ring_type.description()),
                image: Option::Some(format!("{}/pistols{}", base_uri, ring.ring_type.image_url())),
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
