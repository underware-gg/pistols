use starknet::{ContractAddress};
use dojo::world::IWorldDispatcher;
use pistols::models::duelist::{Duelist, ProfilePicType, Archetype};

#[starknet::interface]
trait IDuelistToken<TState> {
    // IWorldProvider
    fn world(self: @TState,) -> IWorldDispatcher;
    fn dojo_resource(ref self: TState) -> felt252;

    // ISRC5
    fn supports_interface(self: @TState, interface_id: felt252) -> bool;
    // ISRC5Camel
    fn supportsInterface(self: @TState, interfaceId: felt252) -> bool;

    // IERC721Metadata
    fn name(self: @TState) -> ByteArray;
    fn symbol(self: @TState) -> ByteArray;
    fn token_uri(self: @TState, token_id: u256) -> ByteArray;
    // IERC721MetadataCamel
    fn tokenURI(self: @TState, token_id: u256) -> ByteArray;

    // IERC721Owner
    fn owner_of(self: @TState, token_id: u256) -> ContractAddress;
    // IERC721OwnerCamel
    fn ownerOf(self: @TState, token_id: u256) -> ContractAddress;

    // IERC721Balance
    fn balance_of(self: @TState, account: ContractAddress) -> u256;
    fn transfer_from(ref self: TState, from: ContractAddress, to: ContractAddress, token_id: u256);
    fn safe_transfer_from(
        ref self: TState,
        from: ContractAddress,
        to: ContractAddress,
        token_id: u256,
        data: Span<felt252>
    );
    // IERC721CamelOnly
    fn balanceOf(self: @TState, account: ContractAddress) -> u256;
    fn transferFrom(ref self: TState, from: ContractAddress, to: ContractAddress, token_id: u256);
    fn safeTransferFrom(
        ref self: TState,
        from: ContractAddress,
        to: ContractAddress,
        token_id: u256,
        data: Span<felt252>
    );

    // IERC721Approval
    fn get_approved(self: @TState, token_id: u256) -> ContractAddress;
    fn is_approved_for_all(self: @TState, owner: ContractAddress, operator: ContractAddress) -> bool;
    fn approve(ref self: TState, to: ContractAddress, token_id: u256);
    fn set_approval_for_all(ref self: TState, operator: ContractAddress, approved: bool);
    // IERC721ApprovalCamel
    fn getApproved(self: @TState, token_id: u256) -> ContractAddress;
    fn isApprovedForAll(self: @TState, owner: ContractAddress, operator: ContractAddress) -> bool;
    fn setApprovalForAll(ref self: TState, operator: ContractAddress, approved: bool);

    // IERC721Enumerable
    fn total_supply(self: @TState) -> u256;
    fn token_by_index(self: @TState, index: u256) -> u256;
    fn token_of_owner_by_index(self: @TState, owner: ContractAddress, index: u256) -> u256;
    // IERC721EnumerableCamel
    fn totalSupply(self: @TState) -> u256;
    fn tokenByIndex(self: @TState, index: u256) -> u256;
    fn tokenOfOwnerByIndex(self: @TState, owner: ContractAddress, index: u256) -> u256;

    // IDuelistTokenPublic
    fn calc_price(ref self: TState, recipient: ContractAddress) -> u256;
    fn create_duelist(ref self: TState, recipient: ContractAddress, name: felt252, profile_pic_type: ProfilePicType, profile_pic_uri: felt252, initial_archetype: Archetype) -> Duelist;
    fn update_duelist(ref self: TState, duelist_id: u128, name: felt252, profile_pic_type: ProfilePicType, profile_pic_uri: felt252) -> Duelist;
    fn delete_duelist(ref self: TState, duelist_id: u128);
}

#[starknet::interface]
trait IDuelistTokenPublic<TState> {
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
trait ITokenComponentPublic<TState> {
    fn calc_price(
        self: @TState,
        recipient: ContractAddress,
    ) -> (ContractAddress, u128);
}

#[starknet::interface]
trait ITokenComponentInternal<TState> {
}

#[dojo::contract]
mod duelist_token {    
    // use debug::PrintTrait;
    use core::byte_array::ByteArrayTrait;
    use starknet::{ContractAddress, get_contract_address, get_caller_address, get_block_timestamp};

    use pistols::interfaces::systems::{WorldSystemsTrait};
    use pistols::models::{
        duelist::{
            Duelist, DuelistEntity,
            Score, ScoreTrait,
            Scoreboard, ScoreboardEntity,
            ProfilePicType, Archetype,
        },
        token_config::{TokenConfig, TokenConfigTrait},
        table::{TABLES},
    };

    use pistols::utils::misc::{CONSUME_BYTE_ARRAY, WORLD, ZERO};
    use pistols::utils::byte_arrays::{ByteArraysTrait, U8IntoByteArray, U16IntoByteArray, U32IntoByteArray, U256IntoByteArray, ByteArraySpanIntoByteArray};
    use pistols::utils::short_string::ShortStringTrait;
    use pistols::libs::store::{Store, StoreTrait};
    use pistols::types::constants::{CONST, HONOUR};

    use graffiti::json::JsonImpl;
    use graffiti::{Tag, TagImpl};

    use origami_token::components::security::initializable::initializable_component;
    use origami_token::components::introspection::src5::src5_component;
    use origami_token::components::token::erc721::erc721_approval::erc721_approval_component;
    use origami_token::components::token::erc721::erc721_balance::erc721_balance_component;
    use origami_token::components::token::erc721::erc721_burnable::erc721_burnable_component;
    use origami_token::components::token::erc721::erc721_enumerable::erc721_enumerable_component;
    use origami_token::components::token::erc721::erc721_metadata::erc721_metadata_component;
    use origami_token::components::token::erc721::erc721_mintable::erc721_mintable_component;
    use origami_token::components::token::erc721::erc721_owner::erc721_owner_component;

    component!(path: initializable_component, storage: initializable, event: InitializableEvent);
    component!(path: src5_component, storage: src5, event: SRC5Event);
    component!(path: erc721_approval_component, storage: erc721_approval, event: ERC721ApprovalEvent);
    component!(path: erc721_balance_component, storage: erc721_balance, event: ERC721BalanceEvent);
    component!(path: erc721_burnable_component, storage: erc721_burnable, event: ERC721BurnableEvent);
    component!(path: erc721_enumerable_component, storage: erc721_enumerable, event: ERC721EnumerableEvent);
    component!(path: erc721_mintable_component, storage: erc721_mintable, event: ERC721MintableEvent);
    component!(path: erc721_owner_component, storage: erc721_owner, event: ERC721OwnerEvent);
    component!(path: erc721_metadata_component, storage: erc721_metadata, event: ERC721MetadataEvent);

    impl InitializableImpl = initializable_component::InitializableImpl<ContractState>;
    #[abi(embed_v0)]
    impl SRC5Impl = src5_component::SRC5Impl<ContractState>;
    #[abi(embed_v0)]
    impl SRC5CamelImpl = src5_component::SRC5CamelImpl<ContractState>;
    #[abi(embed_v0)]
    impl ERC721ApprovalImpl = erc721_approval_component::ERC721ApprovalImpl<ContractState>;
    #[abi(embed_v0)]
    impl ERC721ApprovalCamelImpl = erc721_approval_component::ERC721ApprovalCamelImpl<ContractState>;
    #[abi(embed_v0)]
    impl ERC721BalanceImpl = erc721_balance_component::ERC721BalanceImpl<ContractState>;
    #[abi(embed_v0)]
    impl ERC721BalanceCamelImpl = erc721_balance_component::ERC721BalanceCamelImpl<ContractState>;
    #[abi(embed_v0)]
    impl ERC721EnumerableImpl = erc721_enumerable_component::ERC721EnumerableImpl<ContractState>;
    #[abi(embed_v0)]
    impl ERC721EnumerableCamelImpl = erc721_enumerable_component::ERC721EnumerableCamelImpl<ContractState>;
    #[abi(embed_v0)]
    impl ERC721MetadataImpl = erc721_metadata_component::ERC721MetadataImpl<ContractState>;
    #[abi(embed_v0)]
    impl ERC721MetadataCamelImpl = erc721_metadata_component::ERC721MetadataCamelImpl<ContractState>;
    #[abi(embed_v0)]
    impl ERC721OwnerImpl = erc721_owner_component::ERC721OwnerImpl<ContractState>;
    #[abi(embed_v0)]
    impl ERC721OwnerCamelImpl = erc721_owner_component::ERC721OwnerCamelImpl<ContractState>;

    //
    // Internal Impls
    //    
    impl InitializableInternalImpl = initializable_component::InternalImpl<ContractState>;
    impl ERC721ApprovalInternalImpl = erc721_approval_component::InternalImpl<ContractState>;
    impl ERC721BalanceInternalImpl = erc721_balance_component::InternalImpl<ContractState>;
    impl ERC721BurnableInternalImpl = erc721_burnable_component::InternalImpl<ContractState>;
    impl ERC721EnumerableInternalImpl = erc721_enumerable_component::InternalImpl<ContractState>;
    impl ERC721MetadataInternalImpl = erc721_metadata_component::InternalImpl<ContractState>;
    impl ERC721MintableInternalImpl = erc721_mintable_component::InternalImpl<ContractState>;
    impl ERC721OwnerInternalImpl = erc721_owner_component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        initializable: initializable_component::Storage,
        #[substorage(v0)]
        src5: src5_component::Storage,
        #[substorage(v0)]
        erc721_approval: erc721_approval_component::Storage,
        #[substorage(v0)]
        erc721_balance: erc721_balance_component::Storage,
        #[substorage(v0)]
        erc721_burnable: erc721_burnable_component::Storage,
        #[substorage(v0)]
        erc721_enumerable: erc721_enumerable_component::Storage,
        #[substorage(v0)]
        erc721_metadata: erc721_metadata_component::Storage,
        #[substorage(v0)]
        erc721_mintable: erc721_mintable_component::Storage,
        #[substorage(v0)]
        erc721_owner: erc721_owner_component::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        #[flat]
        InitializableEvent: initializable_component::Event,
        #[flat]
        SRC5Event: src5_component::Event,
        #[flat]
        ERC721ApprovalEvent: erc721_approval_component::Event,
        #[flat]
        ERC721BalanceEvent: erc721_balance_component::Event,
        #[flat]
        ERC721BurnableEvent: erc721_burnable_component::Event,
        #[flat]
        ERC721EnumerableEvent: erc721_enumerable_component::Event,
        #[flat]
        ERC721MetadataEvent: erc721_metadata_component::Event,
        #[flat]
        ERC721MintableEvent: erc721_mintable_component::Event,
        #[flat]
        ERC721OwnerEvent: erc721_owner_component::Event,
    }

    mod Errors {
        const CALLER_IS_NOT_MINTER: felt252     = 'DUELIST: Caller is not minter';
        const TRANSFER_FAILED: felt252          = 'DUELIST: Transfer failed';
        const INVALID_DUELIST: felt252          = 'DUELIST: Invalid duelist';
        const NOT_YOUR_DUELIST: felt252         = 'DUELIST: Not your duelist';
    }

    //*******************************
    const TOKEN_NAME: felt252 = 'Pistols at 10 Blocks Duelists';
    const TOKEN_SYMBOL: felt252 = 'DUELIST';
    const BASE_URI: felt252 = 'https://pistols.underware.gg';
    //*******************************

    fn dojo_init(
        ref self: ContractState,
        minter_contract: ContractAddress,
        renderer_contract: ContractAddress,
        treasury_contract: ContractAddress,
        fee_contract: ContractAddress,
        fee_amount: u128,
    ) {
        self.erc721_metadata.initialize(
            TOKEN_NAME.string(),
            TOKEN_SYMBOL.string(),
            BASE_URI.string(),
        );
        self.erc721_enumerable.initialize();
        self.initializable.initialize();

        let store: Store = StoreTrait::new(self.world());
        let token_config: TokenConfig = TokenConfig{
            token_address: get_contract_address(),
            minter_contract,
            renderer_contract,
            treasury_contract,
            fee_contract,
            fee_amount,
        };
        store.set_token_config(@token_config);
    }

    //
    // Metadata Hooks
    //
    use super::{IDuelistTokenDispatcher, IDuelistTokenDispatcherTrait};
    impl ERC721MetadataHooksImpl<ContractState> of erc721_metadata_component::ERC721MetadataHooksTrait<ContractState> {
        fn custom_uri(
            self: @erc721_metadata_component::ComponentState<ContractState>,
            base_uri: @ByteArray,
            token_id: u256,
        ) -> ByteArray {
            CONSUME_BYTE_ARRAY(base_uri);
            let selfie = IDuelistTokenDispatcher{ contract_address: get_contract_address() };
            let store = StoreTrait::new(selfie.world());
            let token_config: TokenConfig = store.get_token_config(get_contract_address());
            let duelist: Duelist = store.get_duelist(token_id.low);
            (token_config.render_uri(token_id, duelist, false))
        }
    }

    //-----------------------------------
    // Public
    //
    use super::{IDuelistTokenPublic};
    #[abi(embed_v0)]
    impl DuelistTokenPublicImpl of IDuelistTokenPublic<ContractState> {
        fn create_duelist(ref self: ContractState,
            recipient: ContractAddress,
            name: felt252,
            profile_pic_type: ProfilePicType,
            profile_pic_uri: felt252,
            initial_archetype: Archetype,
        ) -> Duelist {
            let store = StoreTrait::new(self.world());
            let token_config: TokenConfig = store.get_token_config(get_contract_address());

            // validate minter
            let caller: ContractAddress = starknet::get_caller_address();
            assert(token_config.is_minter(caller), Errors::CALLER_IS_NOT_MINTER);

            // transfer mint fee
            let (_fee_contract, fee_amount): (ContractAddress, u128) = self.calc_price(recipient);
            if (fee_amount > 0) {
                assert(false, Errors::TRANSFER_FAILED);
            }

            // mint!
            let token_id: u256 = self.total_supply()+ 1;
            self.erc721_mintable.mint(recipient, token_id);

            // create Duelist
            let mut duelist = Duelist {
                duelist_id: token_id.low,
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
            // validate duelist
            let store: Store = StoreTrait::new(self.world());
            let mut duelist: Duelist = store.get_duelist(duelist_id);
            assert(duelist.timestamp != 0, Errors::INVALID_DUELIST);

            // validate owner
            let caller: ContractAddress = starknet::get_caller_address();
            assert(self.owner_of(duelist_id.into()) == caller, Errors::NOT_YOUR_DUELIST);

            // update
            duelist.name = name;
            duelist.profile_pic_type = profile_pic_type;
            duelist.profile_pic_uri = profile_pic_uri.string();
            // save
            store.set_duelist(@duelist);

            // self._emitDuelistRegisteredEvent(caller, duelist.clone(), false);

            (duelist)
        }
        
        fn delete_duelist(ref self: ContractState, duelist_id: u128) {
            self.erc721_burnable.burn(duelist_id.into());
        }
    }

    use super::{ITokenComponentPublic};
    #[abi(embed_v0)]
    impl TokenComponentPublicImpl of ITokenComponentPublic<ContractState> {
        fn calc_price(
            self: @ContractState,
            recipient: ContractAddress,
        ) -> (ContractAddress, u128) {
            if (self.balance_of(recipient) == 0) {
                (ZERO(), 0)
            } else {
                let store = StoreTrait::new(self.world());
                let token_config: TokenConfig = store.get_token_config(get_contract_address());
                (token_config.fee_contract, token_config.fee_amount)
            }
        }
    }

    //-----------------------------------
    // Private
    //
    use pistols::interfaces::itoken::{ITokenRenderer};
    #[abi(embed_v0)]
    impl TokenRendererImpl of ITokenRenderer<ContractState> {
        fn format_name(self: @ContractState, token_id: u256, duelist: Duelist) -> ByteArray {
            let name: ByteArray = if (duelist.name != '') { duelist.name.string() } else { "Duelist" };
            (format!("{} #{}", name, token_id))
        }
        
        fn format_description(self: @ContractState, token_id: u256, _duelist: Duelist) -> ByteArray {
            (format!("Pistols at 10 Blocks Duelist #{}", token_id))
        }
        
        fn format_image(self: @ContractState, duelist: Duelist, variant: ByteArray) -> ByteArray {
            let base_uri: ByteArray = self.erc721_metadata.get_meta().base_uri;
            let number =
                if (duelist.profile_pic_uri.len() == 0) {"00"}
                else if (duelist.profile_pic_uri.len() == 1) {format!("0{}", duelist.profile_pic_uri)}
                else {duelist.profile_pic_uri};
            (format!("{}/profiles/{}/{}.jpg", base_uri, variant, number))
        }

        // returns: [key1, value1, key2, value2,...]
        fn get_attributes(self: @ContractState, duelist: Duelist) -> Span<ByteArray> {
            let store = StoreTrait::new(self.world());
            let mut result: Array<ByteArray> = array![];
            // Honour
            result.append("Honour");
            result.append(ScoreTrait::format_honour(duelist.score.honour));
            // Archetype
            let archetype: ByteArray = 
                if (duelist.score.is_villain()) {"Villain"}
                else if(duelist.score.is_trickster()) {"Trickster"}
                else if(duelist.score.is_lord()) {"Honourable"}
                else {"Undefined"};
            result.append("Archetype");
            result.append(archetype.copy());
            // Levels
            if (duelist.score.total_duels > 0) {
                let level: ByteArray = ScoreTrait::format_honour(
                    if (duelist.score.is_villain()) {duelist.score.level_villain}
                    else if(duelist.score.is_trickster()) {duelist.score.level_trickster}
                    else if(duelist.score.is_lord()) {duelist.score.level_lord}
                    else {0}
                );
                result.append("Archetype Level");
                result.append(level.copy());
                result.append(format!("{} Level", archetype));
                result.append(level.copy());
            }
            // Totals
            result.append("Total Duels");
            result.append(duelist.score.total_duels.into());
            if (duelist.score.total_duels > 0) {
                result.append("Total Wins");
                result.append(duelist.score.total_wins.into());

                result.append("Total Losses");
                result.append(duelist.score.total_losses.into());
                
                result.append("Total Draws");
                result.append(duelist.score.total_draws.into());
                
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
