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
    fn has_claimed(self: @TState, recipient: ContractAddress, ring_type: RingType) -> bool;
    fn get_claimable_season_ring_type(self: @TState, recipient: ContractAddress, duel_id: u128) -> Option<RingType>;
    fn balance_of_ring(self: @TState, account: ContractAddress, ring_type: RingType) -> u128;
    fn claim_season_ring(ref self: TState, duel_id: u128, ring_type: RingType) -> u128;
    fn airdrop_ring(ref self: TState, recipient: ContractAddress, ring_type: RingType) -> u128;
}

// Exposed to clients
#[starknet::interface]
pub trait IRingTokenPublic<TState> {
    // view
    fn has_claimed(self: @TState, recipient: ContractAddress, ring_type: RingType) -> bool;
    fn get_claimable_season_ring_type(self: @TState, recipient: ContractAddress, duel_id: u128) -> Option<RingType>;
    fn balance_of_ring(self: @TState, account: ContractAddress, ring_type: RingType) -> u128;
    // write
    fn claim_season_ring(ref self: TState, duel_id: u128, ring_type: RingType) -> u128; //@description: Claim Signet Ring from a Duel season
    fn airdrop_ring(ref self: TState, recipient: ContractAddress, ring_type: RingType) -> u128; //@description: Airdrop Signet Rings (admin)
}

#[dojo::contract]
pub mod ring_token {
    use core::num::traits::Zero;
    use starknet::{ContractAddress};
    use dojo::world::{WorldStorage, IWorldDispatcherTrait};

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

    use pistols::models::{
        ring::{
            Ring, RingValue,
            RingBalance, RingBalanceValue,
            RingType, RingTypeTrait,
        },
        player::{Player},
        events::{Activity, ActivityTrait},
    };
    use pistols::interfaces::dns::{
        DnsTrait, SELECTORS,
        IAdminDispatcherTrait,
    };
    use pistols::libs::store::{Store, StoreTrait};
    use pistols::utils::short_string::{ShortStringTrait};
    use pistols::utils::math::{MathU128};
    use pistols::utils::address::{ZERO};
    use pistols::types::constants::{METADATA};

    pub mod Errors {
        pub const CALLER_NOT_OWNER: felt252     = 'RING: Caller not owner';
        pub const CALLER_NOT_ADMIN: felt252     = 'RING: Caller not admin';
        pub const INELIGIBLE: felt252           = 'RING: Ineligible';
        pub const ALREADY_CLAIMED: felt252      = 'RING: Already claimed';
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
        fn has_claimed(self: @ContractState, recipient: ContractAddress, ring_type: RingType) -> bool {
            let store: Store = StoreTrait::new(self.world_default());
            (self._has_claimed(@store, recipient, ring_type))
        }

        fn get_claimable_season_ring_type(self: @ContractState, recipient: ContractAddress, duel_id: u128) -> Option<RingType> {
            let store: Store = StoreTrait::new(self.world_default());
            let ring_type: Option<RingType> = RingTypeTrait::get_season_ring_type(@store, recipient, duel_id);
            (if (ring_type.is_some() && !self._has_claimed(@store, recipient, ring_type.unwrap())) {
                (ring_type)
            } else {
                (Option::None)
            })
        }
        fn balance_of_ring(self: @ContractState, account: ContractAddress, ring_type: RingType) -> u128 {
            let store: Store = StoreTrait::new(self.world_default());
            (store.get_ring_balance_value(account, ring_type).balance)
        }

        fn claim_season_ring(ref self: ContractState, duel_id: u128, ring_type: RingType) -> u128 {
            let mut store: Store = StoreTrait::new(self.world_default());

            // validate recipient to ring type
            let recipient: ContractAddress = starknet::get_caller_address();
            let ring_type: Option<RingType> = RingTypeTrait::get_season_ring_type(@store, recipient, duel_id);
            assert(ring_type.is_some(), Errors::INELIGIBLE);
            let ring_type: RingType = ring_type.unwrap();
            assert(!self._has_claimed(@store, recipient, ring_type), Errors::ALREADY_CLAIMED);

            // mint
            let ring_id: u128 = self._mint_ring(ref store, recipient, ring_type);
            
            (ring_id)
        }

        //
        // admin
        //
        fn airdrop_ring(ref self: ContractState, recipient: ContractAddress, ring_type: RingType) -> u128 {
            let mut store: Store = StoreTrait::new(self.world_default());
            self._assert_caller_is_admin(@store);
            // must not have claimed!
            assert(!self._has_claimed(@store, recipient, ring_type), Errors::ALREADY_CLAIMED);
            // mint it
            let ring_id: u128 = self._mint_ring(ref store, recipient, ring_type);
            (ring_id)
        }
    }


    //-----------------------------------
    // Internal
    //
    #[generate_trait]
    impl InternalImpl of InternalTrait {
        #[inline(always)]
        fn _assert_caller_is_admin(self: @ContractState, store: @Store) {
            assert(store.world.admin_dispatcher().am_i_admin(starknet::get_caller_address()), Errors::CALLER_NOT_ADMIN);
        }
        #[inline(always)]
        fn _assert_caller_is_owner(self: @ContractState, store: @Store) {
            assert((*store.world.dispatcher).is_owner(SELECTORS::RING_TOKEN, starknet::get_caller_address()), Errors::CALLER_NOT_OWNER);
        }

        fn _has_claimed(self: @ContractState, store: @Store, recipient: ContractAddress, ring_type: RingType) -> bool {
            let ring_balance: RingBalanceValue = store.get_ring_balance_value(recipient, ring_type);
            (ring_balance.claimed)
        }

        fn _mint_ring(ref self: ContractState, ref store: Store, recipient: ContractAddress, ring_type: RingType) -> u128 {
            // mint!
            let ring_id: u128 = self.token.mint_next(recipient);

            // create Duelist
            let mut ring = Ring {
                ring_id,
                ring_type,
                claimed_by: recipient,
            };
            store.set_ring(@ring);

            // set claimed flag
            let mut ring_balance: RingBalance = store.get_ring_balance(recipient, ring_type);
            ring_balance.claimed = true;
            ring_balance.balance += 1;
            store.set_ring_balance(@ring_balance);

            // update active ring
            self._update_active_ring(ref store, recipient, ring_type);

            // events
            Activity::ClaimedRing.emit(ref store.world, recipient, ring_id.into());

            (ring_id)
        }

        fn _update_active_ring(ref self: ContractState, ref store: Store, recipient: ContractAddress, ring_type: RingType) {
            // add to player profile, if higher ring
            let mut player: Player = store.get_player(recipient);
            if (ring_type > player.active_signet_ring) {
                // replace with next higher ring
                player.active_signet_ring = ring_type;
                store.set_player(@player);
            }
        }
    }


    //-----------------------------------
    // ERC721ComboHooksTrait
    //
    pub impl ERC721ComboHooksImpl of ERC721ComboComponent::ERC721ComboHooksTrait<ContractState> {
        fn before_update(ref self: ERC721ComboComponent::ComponentState<ContractState>, to: ContractAddress, token_id: u256, auth: ContractAddress) {
            let mut self = self.get_contract_mut();
            let mut erc721 = ERC721Component::HasComponent::get_component_mut(ref self);
            let from: ContractAddress = erc721._owner_of(token_id);
            // change ring type balances on transfers only
            if (from.is_non_zero()) {
                // get ring type
                let mut store: Store = StoreTrait::new(self.world_default());
                let ring_type: RingType = store.get_ring_type(token_id.low);
                // remove from balance
                let mut ring_balance_from: RingBalance = store.get_ring_balance(from, ring_type);
                ring_balance_from.balance.subi(1);
                store.set_ring_balance(@ring_balance_from);
                // if balance is zero and it was active, remove/replace from profile
                if (ring_balance_from.balance.is_zero()) {
                    let mut player: Player = store.get_player(from);
                    if (ring_type == player.active_signet_ring) {
                        // replace with next higher ring
                        player.active_signet_ring = RingTypeTrait::get_player_highest_ring(@store, from);
                        store.set_player(@player);
                    }
                }
                // add to new owner balance
                // mints are handled in _mint_ring()
                if (to.is_non_zero()) {
                    let mut ring_balance_to: RingBalance = store.get_ring_balance(to, ring_type);
                    ring_balance_to.balance += 1;
                    store.set_ring_balance(@ring_balance_to);
                    self._update_active_ring(ref store, to, ring_type);
                }
            }
        }

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
