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
    fn claim_duelists(ref self: TState) -> Pack;
    fn purchase(ref self: TState, pack_type: PackType) -> Pack;
    fn calc_mint_fee(self: @TState, recipient: ContractAddress, pack_type: PackType) -> u128;
}

#[starknet::interface]
pub trait IPackTokenPublic<TState> {
    fn claim_duelists(ref self: TState) -> Pack;
    fn purchase(ref self: TState, pack_type: PackType) -> Pack;
    fn can_claim_duelists(self: @TState, recipient: ContractAddress) -> bool;
    fn calc_mint_fee(self: @TState, recipient: ContractAddress, pack_type: PackType) -> u128;
}

#[dojo::contract]
pub mod pack_token {    
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
        IBankDispatcher, IBankDispatcherTrait,
        IFameCoinDispatcher, IFameCoinDispatcherTrait,
    };
    use pistols::models::{
        pack::{Pack, PackValue, PackType, PackTypeTrait},
        player::{Player, PlayerTrait, Activity},
        config::{TokenConfig, TokenConfigValue},
        payment::{Payment},
    };
    use pistols::libs::store::{Store, StoreTrait};
    use pistols::utils::metadata::{MetadataTrait};
    use pistols::utils::short_string::ShortStringTrait;
    use pistols::utils::math::{MathTrait};
    use pistols::utils::misc::{ZERO, CONSUME_U256};

    mod Errors {
        const NOT_IMPLEMENTED: felt252      = 'PACK: Not implemented';
        const ALREADY_CLAIMED: felt252      = 'PACK: Already claimed';
        const NOT_CLAIMED: felt252          = 'PACK: Claim duelists first';
    }

    //*******************************
    fn TOKEN_NAME()   -> ByteArray {("Pistols at 10 Blocks Packs")}
    fn TOKEN_SYMBOL() -> ByteArray {("PACK")}
    //*******************************

    fn dojo_init(
        ref self: ContractState,
        base_uri: felt252,
    ) {
        self.erc721.initializer(
            TOKEN_NAME(),
            TOKEN_SYMBOL(),
            format!("https://{}",base_uri.as_string()),
        );
        let payment = Payment {
            key: get_contract_address().into(),
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
        fn world_default(self: @ContractState) -> WorldStorage {
            self.world(@"pistols")
        }
    }


    //-----------------------------------
    // Public
    //
    use super::{IPackTokenPublic};
    #[abi(embed_v0)]
    impl PackTokenPublicImpl of IPackTokenPublic<ContractState> {

        fn can_claim_duelists(self: @ContractState, recipient: ContractAddress) -> bool {
            let mut store: Store = StoreTrait::new(self.world_default());
            let player: Player = store.get_player(recipient);
            (!player.exists())
        }

        fn calc_mint_fee(self: @ContractState, recipient: ContractAddress, pack_type: PackType) -> u128 {
            (self.get_payment(recipient, pack_type).amount.low)
        }

        fn claim_duelists(ref self: ContractState) -> Pack {
            // validate
            let recipient: ContractAddress = get_caller_address();
            assert(self.can_claim_duelists(recipient), Errors::ALREADY_CLAIMED);

            // mint
            let pack: Pack = self.mint_pack(PackType::Duelists5x, recipient);
            
            // events
            let mut store: Store = StoreTrait::new(self.world_default());
            PlayerTrait::check_in(ref store, recipient, Activity::WelcomePack, 0);

            (pack)
        }

        fn purchase(ref self: ContractState, pack_type: PackType) -> Pack {
            let mut world = self.world_default();

            // validate
            let recipient: ContractAddress = get_caller_address();
            assert(!self.can_claim_duelists(recipient), Errors::NOT_CLAIMED);

            // transfer mint fee
            let payment: Payment = self.get_payment(recipient, pack_type);
            if (payment.amount != 0) {
                world.bank_dispatcher().charge(recipient, payment);
            }

            // mint
            let pack: Pack = self.mint_pack(PackType::Duelists5x, recipient);
            
            // events
            let mut store: Store = StoreTrait::new(world);
            PlayerTrait::check_in(ref store, recipient, Activity::PurchasedPack, pack.pack_type.id());

            (pack)
        }

    }


    //-----------------------------------
    // Internal
    //
    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn mint_pack(ref self: ContractState, pack_type: PackType, recipient: ContractAddress) -> Pack {
            // mint!
            let token_id: u128 = self.token.mint(recipient);

            // create Duelist
            let mut pack = Pack {
                pack_id: token_id,
                pack_type,
                seed: 0,
            };
            
            // save
            let mut store: Store = StoreTrait::new(self.world_default());
            store.set_pack(@pack);

            (pack)
        }
        
        fn get_payment(self: @ContractState, recipient: ContractAddress, pack_type: PackType) -> Payment {
            let mut store: Store = StoreTrait::new(self.world_default());
            let mut payment: Payment = store.get_payment(get_contract_address().into());
            payment.amount = pack_type.mint_fee();
            (payment)
        }
    }


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
            (format!("Pistols at 10 Blocks Pack #{}. https://pistols.underware.gg", token_id))
        }

        fn get_token_image(self: @ContractState, token_id: u256) -> ByteArray {
            let mut store: Store = StoreTrait::new(self.world_default());
            let pack: PackValue = store.get_pack_value(token_id.low);
            (format!("{}{}",
                self.erc721._base_uri(),
                pack.pack_type.image_url(),
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
            // Type
            result.append("Type");
            result.append(pack.pack_type.name());
            // done!
            (result.span())
        }
    }
}
