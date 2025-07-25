use starknet::{ContractAddress};
use dojo::world::IWorldDispatcher;
use pistols::models::pack::{PackType};
use pistols::types::duelist_profile::{DuelistProfile};

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

    // IPackTokenPublic
    fn can_claim_starter_pack(self: @TState, recipient: ContractAddress) -> bool;
    fn can_claim_gift(self: @TState, recipient: ContractAddress) -> bool;
    fn can_purchase(self: @TState, recipient: ContractAddress, pack_type: PackType) -> bool;
    fn calc_mint_fee(self: @TState, recipient: ContractAddress, pack_type: PackType) -> u128;
    fn claim_starter_pack(ref self: TState) -> Span<u128>;
    fn claim_gift(ref self: TState) -> Span<u128>;
    fn purchase(ref self: TState, pack_type: PackType) -> u128;
    fn airdrop(ref self: TState, recipient: ContractAddress, pack_type: PackType, duelist_profile: Option<DuelistProfile>) -> u128;
    fn open(ref self: TState, pack_id: u128) -> Span<u128>;
}

// Exposed to clients
#[starknet::interface]
pub trait IPackTokenPublic<TState> {
    // view
    fn can_claim_starter_pack(self: @TState, recipient: ContractAddress) -> bool;
    fn can_claim_gift(self: @TState, recipient: ContractAddress) -> bool;
    fn can_purchase(self: @TState, recipient: ContractAddress, pack_type: PackType) -> bool;
    fn calc_mint_fee(self: @TState, recipient: ContractAddress, pack_type: PackType) -> u128;
    // write
    fn claim_starter_pack(ref self: TState) -> Span<u128>; //@description: Claim the starter pack, mint Duelists
    fn claim_gift(ref self: TState) -> Span<u128>; //@description: Claim gift pack, if available
    fn purchase(ref self: TState, pack_type: PackType) -> u128; //@description: Purchase a closed pack
    fn airdrop(ref self: TState, recipient: ContractAddress, pack_type: PackType, duelist_profile: Option<DuelistProfile>) -> u128; //@description: Airdrops a pack (admin)
    fn open(ref self: TState, pack_id: u128) -> Span<u128>; //@description: Open a pack, mint its contents
}

// Exposed to world
#[starknet::interface]
pub trait IPackTokenProtected<TState> {
    fn mint_bot_duelist(ref self: TState, duelist_profile: DuelistProfile) -> u128;
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
        IAdminDispatcherTrait,
        IDuelistTokenProtectedDispatcherTrait,
    };
    use pistols::models::{
        pack::{Pack, PackTrait, PackType, PackTypeTrait},
        player::{Player, PlayerTrait},
        events::{Activity, ActivityTrait},
        pool::{Pool, PoolTrait, PoolType},
    };
    use pistols::types::{
        duelist_profile::{DuelistProfile, DuelistProfileTrait, GenesisKey},
        timestamp::{TimestampTrait, TIMESTAMP},
        constants::{METADATA},
    };
    use pistols::libs::store::{Store, StoreTrait};
    use pistols::utils::short_string::{ShortStringTrait};
    use pistols::utils::byte_arrays::{BoolToStringTrait};
    use pistols::utils::misc::{ZERO};

    pub mod Errors {
        pub const INVALID_CALLER: felt252       = 'PACK: Invalid caller';
        pub const CALLER_NOT_ADMIN: felt252     = 'PACK: Caller not admin';
        pub const NOT_IMPLEMENTED: felt252      = 'PACK: Not implemented';
        pub const INELIGIBLE: felt252           = 'PACK: Ineligible';
        pub const CLAIM_FIRST: felt252          = 'PACK: Claim duelists first';
        pub const NOT_FOR_SALE: felt252         = 'PACK: Not for sale';
        pub const NOT_OWNER: felt252            = 'PACK: Not owner';
        pub const ALREADY_OPENED: felt252       = 'PACK: Already opened';
        pub const MISSING_DUELIST: felt252      = 'PACK: Missing duelist';
        pub const INVALID_DUELIST: felt252      = 'PACK: Invalid duelist';
        pub const INSUFFICIENT_LORDS: felt252   = 'PACK: insufficient LORDS pool';
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

        //
        // starter packs
        //
        fn can_claim_starter_pack(self: @ContractState, recipient: ContractAddress) -> bool {
            let mut store: Store = StoreTrait::new(self.world_default());
            let player: Player = store.get_player(recipient);
            (!player.timestamps.claimed_starter_pack)
        }

        fn claim_starter_pack(ref self: ContractState) -> Span<u128> {
            let recipient: ContractAddress = starknet::get_caller_address();
            assert(self.can_claim_starter_pack(recipient), Errors::INELIGIBLE);

            // mint
            let mut store: Store = StoreTrait::new(self.world_default());
            let seed: felt252 = recipient.into(); // seed is soulbound
            let lords_amount: u128 = self.calc_mint_fee(recipient, PackType::StarterPack);
            let pack: Pack = self._mint_pack(ref store, PackType::StarterPack, recipient, seed, lords_amount, Option::None);
            
            // events
            PlayerTrait::check_in(ref store, Activity::PackStarter, recipient, pack.pack_id.into());

            // open immediately
            (self.open(pack.pack_id))
        }

        //
        // gifts
        //

        fn can_claim_gift(self: @ContractState, recipient: ContractAddress) -> bool {
            let mut store: Store = StoreTrait::new(self.world_default());
            let player: Player = store.get_player(recipient);
            // has not claimed or passed 24 hours
            if (
                player.timestamps.claimed_starter_pack &&   // has claimed starter pack
                player.timestamps.claimed_gift.has_elapsed(TIMESTAMP::ONE_DAY) && // passed 24 hours from last gift
                store.get_player_alive_duelist_count(recipient) == 0 // no alive duelists
            ) {
                (true)
            } else {
                (false)
            }
        }

        fn claim_gift(ref self: ContractState) -> Span<u128> {
            let recipient: ContractAddress = starknet::get_caller_address();
            assert(self.can_claim_gift(recipient), Errors::INELIGIBLE);

            // create vrf seed
            let mut store: Store = StoreTrait::new(self.world_default());
            let seed: felt252 = store.vrf_dispatcher().consume_random(Source::Nonce(recipient));

            // mint
            let lords_amount: u128 = self.calc_mint_fee(recipient, PackType::FreeDuelist);
            let pack: Pack = self._mint_pack(ref store, PackType::FreeDuelist, recipient, seed, lords_amount, Option::None);
            
            // events
            PlayerTrait::check_in(ref store, Activity::ClaimedGift, recipient, pack.pack_id.into());

            // open immediately
            (self.open(pack.pack_id))
        }

        //
        // purchases
        //

        fn can_purchase(self: @ContractState, recipient: ContractAddress, pack_type: PackType) -> bool {
            (!self.can_claim_starter_pack(recipient) && pack_type.can_purchase())
        }

        fn calc_mint_fee(self: @ContractState, recipient: ContractAddress, pack_type: PackType) -> u128 {
            (pack_type.mint_fee())
        }

        fn purchase(ref self: ContractState, pack_type: PackType) -> u128 {
            let mut store: Store = StoreTrait::new(self.world_default());

            // validate pack
            assert(pack_type.can_purchase(), Errors::NOT_FOR_SALE);

            // validate recipient
            let recipient: ContractAddress = starknet::get_caller_address();
            assert(!self.can_claim_starter_pack(recipient), Errors::CLAIM_FIRST);

            // transfer mint fee
            let lords_amount: u128 = self.calc_mint_fee(recipient, pack_type);
            if (lords_amount != 0) {
                store.world.bank_protected_dispatcher().charge_purchase(recipient, lords_amount.into());
            }

            // create vrf seed
            let seed: felt252 = store.vrf_dispatcher().consume_random(Source::Nonce(recipient));

            // mint
            let pack: Pack = self._mint_pack(ref store, pack_type, recipient, seed, lords_amount, Option::None);
            
            // events
            PlayerTrait::check_in(ref store, Activity::PackPurchased, recipient, pack.pack_id.into());

            (pack.pack_id)
        }

        fn airdrop(ref self: ContractState,
            recipient: ContractAddress,
            pack_type: PackType,
            duelist_profile: Option<DuelistProfile>,
        ) -> u128 {
            self._assert_caller_is_admin();

            // validate pack and contents
            match (pack_type) {
                PackType::SingleDuelist => {
                    match (duelist_profile) {
                        Option::None => {
                            // PackType::SingleDuelist must have a duelist!
                            assert(false, Errors::MISSING_DUELIST);
                        },
                        Option::Some(profile) => {
                            assert(profile.exists(), Errors::INVALID_DUELIST);
                            assert(profile.is_playable(), Errors::INVALID_DUELIST);
                        },
                    };
                },
                _ => {
                    // only PackType::SingleDuelist can have a duelist
                    assert(duelist_profile.is_none(), Errors::INVALID_DUELIST);
                }
            }

            // all free duelists must have a claimable balance
            let mut store: Store = StoreTrait::new(self.world_default());
            let mut pool_claimable: Pool = store.get_pool(PoolType::Claimable);
            let lords_amount: u128 = self.calc_mint_fee(recipient, pack_type);
            assert(pool_claimable.balance_lords >= lords_amount, Errors::INSUFFICIENT_LORDS);

            // move lords to purchases pool if needed
            if (pack_type.deposited_pool_type() == PoolType::Purchases) {
                let mut pool_purchases: Pool = store.get_pool(PoolType::Purchases);
                pool_claimable.withdraw_lords(lords_amount);
                pool_purchases.deposit_lords(lords_amount);
                store.set_pool(@pool_claimable);
                store.set_pool(@pool_purchases);
            }

            // need vrf seed if duelist_profile is not provided
            let seed: felt252 = match (duelist_profile) {
                Option::None => {(store.vrf_dispatcher().consume_random(Source::Nonce(recipient)))},
                Option::Some(_) => {(0)},
            };

            // mint
            let pack: Pack = self._mint_pack(ref store, pack_type, recipient, seed, lords_amount, duelist_profile);

            Activity::AirdroppedPack.emit(ref store.world, recipient, pack.pack_id.into());

            (pack.pack_id)
        }

        //
        // open an existing pack
        //

        fn open(ref self: ContractState, pack_id: u128) -> Span<u128> {
            let mut store: Store = StoreTrait::new(self.world_default());

            // validate owner
            let recipient: ContractAddress = self.owner_of(pack_id.into());
            assert(recipient == starknet::get_caller_address(), Errors::NOT_OWNER);

            // open...
            let mut pack: Pack = store.get_pack(pack_id);
            assert(!pack.is_open, Errors::ALREADY_OPENED);

            // open...
            let token_ids: Span<u128> = self._mint_pack_duelists(ref store, pack, recipient);
            pack.is_open = true;
            store.set_pack(@pack);

            // burn!
            self.erc721.burn(pack_id.into());

            // events
            PlayerTrait::check_in(ref store, Activity::PackOpened, recipient, pack_id.into());

            (token_ids)
        }
    }


    //-----------------------------------
    // Protected
    //
    #[abi(embed_v0)]
    impl PackTokenProtectedImpl of super::IPackTokenProtected<ContractState> {
        fn mint_bot_duelist(ref self: ContractState, duelist_profile: DuelistProfile) -> u128 {
            let mut store: Store = StoreTrait::new(self.world_default());

            // only bot contract can mint a bot duelist
            let bot_address: ContractAddress = store.world.bot_player_address();
            assert(starknet::get_caller_address() == bot_address, Errors::INVALID_CALLER);

            let token_ids: Span<u128> = store.world.duelist_token_protected_dispatcher().mint_duelists(
                bot_address, 1, duelist_profile, 0,
                PoolType::Claimable,
                PackType::BotDuelist.mint_fee(),
            );

            (*token_ids[0])
        }
    }


    //-----------------------------------
    // Internal
    //
    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn _assert_caller_is_admin(self: @ContractState) {
            let mut world = self.world_default();
            assert(world.admin_dispatcher().am_i_admin(starknet::get_caller_address()) == true, Errors::CALLER_NOT_ADMIN);
        }

        fn _mint_pack(ref self: ContractState,
            ref store: Store,
            pack_type: PackType,
            recipient: ContractAddress,
            seed: felt252,
            lords_amount: u128,
            duelist_profile: Option<DuelistProfile>,
        ) -> Pack {
            // mint!
            let token_id: u128 = self.token.mint_next(recipient);
            // create Pack
            let mut pack = Pack {
                pack_id: token_id,
                pack_type,
                seed,
                lords_amount,
                is_open: false,
                duelist_profile,
            };
            store.set_pack(@pack);
            (pack)
        }

        fn _mint_pack_duelists(ref self: ContractState,
            ref store: Store,
            pack: Pack,
            recipient: ContractAddress,
        ) -> Span<u128> {
            // pack data
            let quantity: usize = pack.pack_type.descriptor().quantity;
            let pool_type: PoolType = pack.pack_type.deposited_pool_type();
            let lords_amount: u128 = pack.lords_amount;
            // mint...
            let token_ids: Span<u128> = match pack.pack_type {
                PackType::BotDuelist |
                PackType::Unknown => { [].span() },
                PackType::StarterPack => {
                    (store.world.duelist_token_protected_dispatcher()
                        .mint_duelists(
                            recipient,
                            quantity,
                            DuelistProfile::Genesis(GenesisKey::Unknown),
                            0x0100, // fake seed: Ser Walker (0x__00) + Lady Vengeance (0x01__)
                            pool_type,
                            lords_amount,
                        )
                    )
                },
                PackType::FreeDuelist |
                PackType::GenesisDuelists5x => {
                    (store.world.duelist_token_protected_dispatcher()
                        .mint_duelists(
                            recipient,
                            quantity,
                            DuelistProfile::Genesis(GenesisKey::Unknown),
                            pack.seed,
                            pool_type,
                            lords_amount,
                        )
                    )
                },
                PackType::SingleDuelist => {
                    assert(pack.duelist_profile.is_some(), Errors::MISSING_DUELIST);
                    let duelist_profile: DuelistProfile = pack.duelist_profile.unwrap();
                    (store.world.duelist_token_protected_dispatcher()
                        .mint_duelists(
                            recipient,
                            quantity,
                            duelist_profile,
                            0,
                            pool_type,
                            lords_amount,
                        )
                    )
                },
            };
            (token_ids)
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
            let pack: Pack = store.get_pack(token_id.low);
            // Attributes
            let mut attributes: Array<Attribute> = array![
                Attribute {
                    key: "Type",
                    value: pack.pack_type.name(),
                },
                Attribute {
                    key: "Contents",
                    value: pack.contents(),
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
                image: Option::Some(pack.pack_type.image_url(base_uri, pack.is_open)),
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
