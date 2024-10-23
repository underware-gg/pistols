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

    // ITokenComponentPublic
    fn can_mint(self: @TState, caller_address: ContractAddress) -> bool;
    fn exists(self: @TState, token_id: u128) -> bool;
    fn is_owner_of(self: @TState, address: ContractAddress, token_id: u128) -> bool;

    // IDuelistTokenPublic
    fn calc_fee(ref self: TState, recipient: ContractAddress) -> u128;
    fn create_duelist(ref self: TState, recipient: ContractAddress, name: felt252, profile_pic_type: ProfilePicType, profile_pic_uri: felt252) -> Duelist;
    fn update_duelist(ref self: TState, duelist_id: u128, name: felt252, profile_pic_type: ProfilePicType, profile_pic_uri: felt252) -> Duelist;
    fn delete_duelist(ref self: TState, duelist_id: u128);
}

#[starknet::interface]
pub trait IDuelistTokenPublic<TState> {
    fn calc_fee(
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
}

#[starknet::interface]
pub trait IDuelistTokenInternal<TState> {
    fn format_image(self: @TState, duelist: Duelist, variant: ByteArray) -> ByteArray;
}

#[dojo::contract]
pub mod duelist_token {    
    // use debug::PrintTrait;
    use openzeppelin_account::interface::ISRC6;
    use starknet::{ContractAddress, get_contract_address, get_caller_address, get_block_timestamp};

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

    use pistols::models::{
        duelist::{
            Duelist, DuelistEntity,
            Score, ScoreTrait,
            ProfilePicType, Archetype,
            ScoreboardEntity,
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
    use pistols::utils::math::{MathTrait};

    mod Errors {
        const NOT_IMPLEMENTED: felt252          = 'DUELIST: Not implemented';
        const INVALID_DUELIST: felt252          = 'DUELIST: Invalid duelist';
    }

    //*******************************
    fn TOKEN_NAME()   -> ByteArray {("Pistols at 10 Blocks Duelists")}
    fn TOKEN_SYMBOL() -> ByteArray {("DUELIST")}
    fn BASE_URI()     -> ByteArray {("https://pistols.underware.gg")}
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
        self.token.initialize(
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
    impl DuelistTokenPublicImpl of IDuelistTokenPublic<ContractState> {

        fn calc_fee(self: @ContractState,
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
        ) -> Duelist {
            // transfer mint fee
            let fee_amount: u128 = self.calc_fee(recipient);
            if (fee_amount > 0) {
                assert(false, Errors::NOT_IMPLEMENTED);
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
            self.token.assert_is_owner_of(get_caller_address(), duelist_id.into());

            // validate duelist
            let store: Store = StoreTrait::new(self.world());
            let mut duelist: Duelist = store.get_duelist(duelist_id);
            assert(duelist.timestamp != 0, Errors::INVALID_DUELIST);

            // update
            duelist.name = name;
            duelist.profile_pic_type = profile_pic_type;
            duelist.profile_pic_uri = profile_pic_uri.as_string();
            // save
            store.set_duelist(@duelist);

            // self._emitDuelistRegisteredEvent(caller, duelist.clone(), false);

            (duelist)
        }
        
        fn delete_duelist(ref self: ContractState,
            duelist_id: u128,
        ) {
            self.token.assert_is_owner_of(get_caller_address(), duelist_id.into());
            assert(false, Errors::NOT_IMPLEMENTED);
            self.token.burn(duelist_id.into());
        }

    }


    //-----------------------------------
    // Internal
    //
    use super::{IDuelistTokenInternal};
    impl DuelistTokenInternalImpl of IDuelistTokenInternal<ContractState> {
        fn format_image(self: @ContractState, duelist: Duelist, variant: ByteArray) -> ByteArray {
            let base_uri: ByteArray = self.erc721._base_uri();
            let number =
                if (duelist.profile_pic_uri.len() == 0) {"00"}
                else if (duelist.profile_pic_uri.len() == 1) {format!("0{}", duelist.profile_pic_uri)}
                else {duelist.profile_pic_uri};
            (format!("{}/profiles/{}/{}.jpg", base_uri, variant, number))
        }
    }


    //-----------------------------------
    // ITokenRenderer
    //
    use pistols::systems::components::erc721_hooks::{ITokenRenderer, TokenMetadata};
    #[abi(embed_v0)]
    impl TokenRendererImpl of ITokenRenderer<ContractState> {
        fn get_token_metadata(self: @ContractState, token_id: u256) -> TokenMetadata {
            let store: Store = StoreTrait::new(self.world());
            let duelist: Duelist = store.get_duelist(token_id.low);

            let name: ByteArray = format!("{} #{}",
                if (duelist.name != '') { duelist.name.as_string() } else { "Duelist" },
                token_id
            );
            let description: ByteArray = format!("Pistols at 10 Blocks Duelist #{}. https://pistols.underware.gg", token_id);
            let image: ByteArray = self.format_image(duelist.clone(), "portrait");

            (TokenMetadata {
                name,
                description,
                image,
            })
        }

        // returns: [key1, value1, key2, value2,...]
        fn get_metadata_pairs(self: @ContractState, token_id: u256) -> Span<ByteArray> {
            let store = StoreTrait::new(self.world());
            let duelist: Duelist = store.get_duelist(token_id.low);
            let mut result: Array<ByteArray> = array![];
            result.append("square");
            result.append(self.format_image(duelist.clone(), "square"));
            result.append("portrait");
            result.append(self.format_image(duelist.clone(), "portrait"));
            (result.span())
        }

        // returns: [key1, value1, key2, value2,...]
        fn get_attribute_pairs(self: @ContractState, token_id: u256) -> Span<ByteArray> {
            let store = StoreTrait::new(self.world());
            let duelist: Duelist = store.get_duelist(token_id.low);
            let mut result: Array<ByteArray> = array![];
            // Honour
            result.append("Honour");
            result.append(ScoreTrait::format_honour(duelist.score.honour));
            // Archetype
            let archetype: Archetype = duelist.score.get_archetype();
            result.append("Archetype");
            result.append(archetype.into());
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
                
                // Wager on Lords table
                let scoreboard: ScoreboardEntity = store.get_scoreboard_entity(TABLES::LORDS, duelist.duelist_id);
                
                result.append("Lords Won");
                let amount: u128 = (scoreboard.wager_won / CONST::ETH_TO_WEI.low);
                result.append(format!("{}", amount));
                
                result.append("Lords Lost");
                if (scoreboard.wager_lost == 0) {
                    result.append("0");
                } else {
                    let amount: u128 = (scoreboard.wager_lost / CONST::ETH_TO_WEI.low);
                    result.append(format!("-{}", amount));
                }
                
                result.append("Lords Balance");
                if (scoreboard.wager_lost > scoreboard.wager_won) {
                    let amount: u128 = ((scoreboard.wager_lost - scoreboard.wager_won) / CONST::ETH_TO_WEI.low);
                    result.append(format!("-{}", amount));
                } else {
                    let amount: u128 = ((scoreboard.wager_won - scoreboard.wager_lost) / CONST::ETH_TO_WEI.low);
                    result.append(format!("{}", amount));
                }
            }
            // done!
            (result.span())
        }
    }
}
