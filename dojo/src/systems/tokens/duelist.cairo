use starknet::{ContractAddress};
use dojo::world::IWorldDispatcher;
use pistols::models::duelist::{Duelist, ProfilePicType, Archetype};

#[starknet::interface]
pub trait IDuelistToken<TState> {
    // IWorldProvider
    fn world(self: @TState,) -> IWorldDispatcher;

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

    // IDuelistTokenPublic
    fn calc_price(ref self: TState, recipient: ContractAddress) -> u128;
    fn create_duelist(ref self: TState, recipient: ContractAddress, name: felt252, profile_pic_type: ProfilePicType, profile_pic_uri: felt252, initial_archetype: Archetype) -> Duelist;
    fn update_duelist(ref self: TState, duelist_id: u128, name: felt252, profile_pic_type: ProfilePicType, profile_pic_uri: felt252) -> Duelist;
    fn delete_duelist(ref self: TState, duelist_id: u128);
}

#[starknet::interface]
pub trait IDuelistTokenPublic<TState> {
    fn calc_price(
        self: @TState,
        recipient: ContractAddress,
    ) -> u128;
    fn create_duelist(
        ref self: TState,
        recipient: ContractAddress,
        name: felt252,
        profile_pic_type: ProfilePicType,
        profile_pic_uri: felt252,
        initial_archetype: Archetype,
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
}

#[starknet::interface]
pub trait IDuelistTokenInternal<TState> {
}

#[dojo::contract]
pub mod duelist {    
    // use debug::PrintTrait;
    use openzeppelin_account::interface::ISRC6;
    use starknet::{ContractAddress, get_contract_address, get_caller_address, get_block_timestamp};

    use pistols::models::{
        duelist::{
            Duelist, DuelistEntity,
            Score, ScoreTrait,
            ProfilePicType, Archetype,
        },
        token_config::{
            TokenConfig, TokenConfigStore,
            TokenConfigEntity, TokenConfigEntityStore,
        },
        table::{TABLES},
    };
    use pistols::types::constants::{CONST, HONOUR};
    use pistols::libs::store::{Store, StoreTrait};
    use pistols::utils::short_string::ShortStringTrait;


    //-----------------------------------
    // OpenZeppelin start
    //
    use openzeppelin_introspection::src5::SRC5Component;
    use openzeppelin_token::erc721::{ERC721Component};
    use pistols::systems::components::erc721_hooks::{ERC721HooksImpl};
    use pistols::systems::components::token_component::{TokenComponent};
    component!(path: SRC5Component, storage: src5, event: SRC5Event);
    component!(path: ERC721Component, storage: erc721, event: ERC721Event);
    component!(path: TokenComponent, storage: token, event: TokenEvent);
    #[abi(embed_v0)]
    impl ERC721MixinImpl = ERC721Component::ERC721MixinImpl<ContractState>;
    impl ERC721InternalImpl = ERC721Component::InternalImpl<ContractState>;
    impl TokenInternalImpl = TokenComponent::InternalImpl<ContractState>;
    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc721: ERC721Component::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
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
    // OpenZeppelin end
    //-----------------------------------

    mod Errors {
        const NOT_IMPLEMENTED: felt252          = 'DUELIST: not implemented';
        const INVALID_DUELIST: felt252          = 'DUELIST: invalid duelist';
        const NOT_YOUR_DUELIST: felt252         = 'DUELIST: not your duelist';
    }

    //*******************************
    fn TOKEN_NAME() -> ByteArray {("Pistols at 10 Blocks Duelists")}
    fn TOKEN_SYMBOL() -> ByteArray {("DUELIST")}
    fn BASE_URI() -> ByteArray {("https://pistols.underware.gg")}
    //*******************************

    fn dojo_init(
        ref self: ContractState,
        minter_address: ContractAddress,
        renderer_address: ContractAddress,
        treasury_address: ContractAddress,
        fee_contract: ContractAddress,
        fee_amount: u128,
    ) {
        self.erc721.initializer(
            TOKEN_NAME(),
            TOKEN_SYMBOL(),
            BASE_URI(),
        );
        self.token._initialize(
            minter_address,
            renderer_address,
            treasury_address,
            fee_contract,
            fee_amount: fee_amount.into(),
        );
    }


    //-----------------------------------
    // Public
    //
    use super::{IDuelistTokenPublic};
    #[abi(embed_v0)]
    impl TokenComponentPublicImpl of IDuelistTokenPublic<ContractState> {

        fn calc_price(self: @ContractState,
            recipient: ContractAddress,
        ) -> u128 {
            if (self.erc721.balance_of(recipient) == 0) {
                (0) // first is free
            } else {
                let store = StoreTrait::new(self.world());
                let token_config: TokenConfig = store.get_token_config(get_contract_address());
                (token_config.fee_amount)
            }
        }

        fn create_duelist(ref self: ContractState,
            recipient: ContractAddress,
            name: felt252,
            profile_pic_type: ProfilePicType,
            profile_pic_uri: felt252,
            initial_archetype: Archetype,
        ) -> Duelist {
            // transfer mint fee
            let fee_amount: u128 = self.calc_price(recipient);
            if (fee_amount > 0) {
                assert(false, Errors::NOT_IMPLEMENTED);
            }

            // mint!
            let token_id: u128 = self.token._mint(recipient).low;

            // create Duelist
            let mut duelist = Duelist {
                duelist_id: token_id,
                timestamp: get_block_timestamp(),
                name,
                profile_pic_type,
                profile_pic_uri: profile_pic_uri.string(),
                score: Default::default(),
            };
            match initial_archetype {
                Archetype::Villainous => { duelist.score.level_villain = HONOUR::LEVEL_MAX; },
                Archetype::Trickster =>  { duelist.score.level_trickster = HONOUR::LEVEL_MAX; },
                Archetype::Honourable => { duelist.score.level_lord = HONOUR::LEVEL_MAX; },
                _ => {},
            };
            
            // save
            let store = StoreTrait::new(self.world());
            store.set_duelist(@duelist);

            // self._emitDuelistRegisteredEvent(caller, duelist.clone(), true);

            (duelist)
        }

        fn update_duelist(ref self: ContractState,
            duelist_id: u128,
            name: felt252,
            profile_pic_type: ProfilePicType,
            profile_pic_uri: felt252,
        ) -> Duelist {
            // validate owner
            self.token._assert_caller_is_owner(get_caller_address(), duelist_id.into());

            // validate duelist
            let store: Store = StoreTrait::new(self.world());
            let mut duelist: Duelist = store.get_duelist(duelist_id);
            assert(duelist.timestamp != 0, Errors::INVALID_DUELIST);

            // update
            duelist.name = name;
            duelist.profile_pic_type = profile_pic_type;
            duelist.profile_pic_uri = profile_pic_uri.string();
            // save
            store.set_duelist(@duelist);

            // self._emitDuelistRegisteredEvent(caller, duelist.clone(), false);

            (duelist)
        }
        
        fn delete_duelist(ref self: ContractState,
            duelist_id: u128,
        ) {
            self.token._assert_caller_is_owner(get_caller_address(), duelist_id.into());
            assert(false, Errors::NOT_IMPLEMENTED);
            self.token._burn(duelist_id.into());
        }

    }

}
