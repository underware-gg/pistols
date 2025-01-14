use starknet::{ContractAddress};
use dojo::world::IWorldDispatcher;
use pistols::types::profile_type::{ProfileType};

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
    fn can_mint(self: @TState, recipient: ContractAddress) -> bool;
    fn exists(self: @TState, token_id: u128) -> bool;
    fn is_owner_of(self: @TState, address: ContractAddress, token_id: u128) -> bool;

    // ITokenRenderer
    fn get_token_name(self: @TState, token_id: u256) -> ByteArray;
    fn get_token_description(self: @TState, token_id: u256) -> ByteArray;
    fn get_token_image(self: @TState, token_id: u256) -> ByteArray;

    // IDuelistTokenPublic
    fn is_alive(self: @TState, duelist_id: u128) -> bool;
    fn calc_fame_reward(self: @TState, duelist_id: u128) -> u128;
    fn mint_duelists(ref self: TState, recipient: ContractAddress, amount: usize, seed: felt252) -> Span<u128>;
    // fn delete_duelist(ref self: TState, duelist_id: u128);
    fn transfer_fame_reward(ref self: TState, duel_id: u128) -> (i128, i128);
}

#[starknet::interface]
pub trait IDuelistTokenPublic<TState> {
    // view
    fn is_alive(self: @TState, duelist_id: u128) -> bool;
    fn calc_fame_reward(self: @TState, duelist_id: u128) -> u128;
    // write
    fn mint_duelists(ref self: TState, recipient: ContractAddress, amount: usize, seed: felt252) -> Span<u128>;
    // fn delete_duelist(ref self: TState, duelist_id: u128);
    fn transfer_fame_reward(ref self: TState, duel_id: u128) -> (i128, i128);
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
        player::{Player, PlayerTrait, Activity},
        duelist::{
            Duelist, DuelistValue,
            Scoreboard, Score, ScoreTrait,
            Archetype,
        },
        challenge::{ChallengeValue},
        config::{TokenConfig, TokenConfigValue},
        payment::{Payment},
        table::{TABLES},
    };
    use pistols::types::{
        profile_type::{ProfileType, ProfileTypeTrait},
        constants::{CONST, FAME},
    };
    use pistols::libs::store::{Store, StoreTrait};
    use pistols::utils::metadata::{MetadataTrait};
    use pistols::utils::short_string::{ShortStringTrait};
    use pistols::utils::math::{MathTrait};

    mod Errors {
        const INVALID_DUELIST: felt252          = 'DUELIST: Invalid duelist';
        const NOT_IMPLEMENTED: felt252          = 'DUELIST: Not implemented';
        const DUEL_INVALID_CALLER: felt252      = 'DUELIST: Invalid caller';
        const DUELIST_A_IS_DEAD: felt252        = 'DUELIST: Duelist A is dead!';
        const DUELIST_B_IS_DEAD: felt252        = 'DUELIST: Duelist B is dead!';
    }

    //*******************************
    fn TOKEN_NAME()   -> ByteArray {("Pistols at Dawn Duelists")}
    fn TOKEN_SYMBOL() -> ByteArray {("DUELIST")}
    //*******************************

    fn dojo_init(
        ref self: ContractState,
        base_uri: felt252,
        renderer_address: ContractAddress,
    ) {
        self.erc721.initializer(
            TOKEN_NAME(),
            TOKEN_SYMBOL(),
            format!("https://{}",base_uri.to_string()),
        );
        self.token.initialize(
            self.world(@"pistols").pack_token_address(),
            renderer_address,
            payment: Default::default(),
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

        fn is_alive(
            self: @ContractState,
            duelist_id: u128,
        ) -> bool {
            let fame_dispatcher: IFameCoinDispatcher = self.world_default().fame_coin_dispatcher();
            let fame_balance: u256 = fame_dispatcher.balance_of_token(get_contract_address(), duelist_id);
            (fame_balance != 0)
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

        fn mint_duelists(ref self: ContractState,
            recipient: ContractAddress,
            amount: usize,
            seed: felt252,
        ) -> Span<u128>{
            let mut store: Store = StoreTrait::new(self.world_default());

            // mint tokens
            let duelist_ids: Span<u128> = self.token.mint_multiple(recipient, amount);

            // create duelists
            let mut rnd: u256 = seed.into();
            let mut i: usize = 0;
            while (i < duelist_ids.len()) {
                // create Duelist
                let duelist = Duelist {
                    duelist_id: *duelist_ids[i],
                    profile_type: ProfileTypeTrait::randomize_duelist(rnd.low.into()),
                    timestamp: get_block_timestamp(),
                };
                store.set_duelist(@duelist);

                // mint fame
                let fame_dispatcher: IFameCoinDispatcher = store.world.fame_coin_dispatcher();
                fame_dispatcher.minted_duelist(duelist.duelist_id, 0);

                // events
                PlayerTrait::check_in(ref store, recipient, Activity::CreatedDuelist, duelist.duelist_id.into());

                rnd /= 0x100;
                i += 1;
            };

            (duelist_ids)
        }
        
        // fn delete_duelist(ref self: ContractState,
        //     duelist_id: u128,
        // ) {
        //     self.token.assert_is_owner_of(get_caller_address(), duelist_id.into());
        //     // duelist burn not supported
        //     assert(false, Errors::NOT_IMPLEMENTED);
        //     // self.token.burn(duelist_id.into());
        //     // burn FAME too
        // }

        fn transfer_fame_reward(
            ref self: ContractState,
            duel_id: u128,
        ) -> (i128, i128) {
            let mut world = self.world_default();
            assert(world.is_game_contract(get_caller_address()), Errors::DUEL_INVALID_CALLER);
            
            // calculate penalty of each duelist
            let mut store: Store = StoreTrait::new(world);
            let challenge: ChallengeValue = store.get_challenge_value(duel_id);
            let due_amount_a: u128 = if (challenge.winner == 0 || challenge.winner == 2) {
                let amount: u128 = self.calc_fame_reward(challenge.duelist_id_a);
                assert(amount != 0, Errors::DUELIST_A_IS_DEAD);
                (amount)
            } else {0};
            let due_amount_b: u128 = if (challenge.winner == 0 || challenge.winner == 1) {
                let amount: u128 = self.calc_fame_reward(challenge.duelist_id_b);
                assert(amount != 0, Errors::DUELIST_B_IS_DEAD);
                (amount)
            } else {0};

            // transfer
            let fame_dispatcher: IFameCoinDispatcher = world.fame_coin_dispatcher();
            if (due_amount_a != 0 && due_amount_b != 0) {
                // draw, burn half of each
                fame_dispatcher.burn_from_token(get_contract_address(), challenge.duelist_id_a, (due_amount_a / 2).into());
                fame_dispatcher.burn_from_token(get_contract_address(), challenge.duelist_id_b, (due_amount_b / 2).into());
                (due_amount_a.try_into().unwrap() / -2, due_amount_b.try_into().unwrap() / -2)
            } else if (due_amount_a != 0) {
                fame_dispatcher.transfer_from_token(get_contract_address(), challenge.duelist_id_a, challenge.duelist_id_b, due_amount_a.into());
                (-due_amount_a.try_into().unwrap(), due_amount_a.try_into().unwrap())
            } else if (due_amount_b != 0) {
                fame_dispatcher.transfer_from_token(get_contract_address(), challenge.duelist_id_b, challenge.duelist_id_a, due_amount_b.into());
                (due_amount_b.try_into().unwrap(), -due_amount_b.try_into().unwrap())
            } else {
                (0, 0) // should never happen!
            }
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
    use pistols::systems::components::erc721_hooks::{TokenRendererTrait};
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
            (self.get_contract().render_token_uri(token_id))
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
                duelist.profile_type.name(),
                token_id
            ))
        }

        fn get_token_description(self: @ContractState, token_id: u256) -> ByteArray {
            (format!("Pistols at Dawn Duelist #{}. https://pistols.underware.gg", token_id))
        }

        fn get_token_image(self: @ContractState, token_id: u256) -> ByteArray {
            let mut world = self.world_default();
            let mut store: Store = StoreTrait::new(world);
            let duelist: DuelistValue = store.get_duelist_value(token_id.low);
            let base_uri: ByteArray = self.erc721._base_uri();
            let image_square: ByteArray = duelist.profile_type.get_uri(base_uri.clone(), "square");
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
            result.append(duelist.profile_type.get_uri(base_uri.clone(), "square"));
            result.append("portrait");
            result.append(duelist.profile_type.get_uri(base_uri.clone(), "portrait"));
            (result.span())
        }

        // returns: [key1, value1, key2, value2,...]
        fn get_attribute_pairs(self: @ContractState, token_id: u256) -> Span<ByteArray> {
            let mut world = self.world_default();
            let mut store: Store = StoreTrait::new(world);
            let duelist: DuelistValue = store.get_duelist_value(token_id.low);
            let scoreboard: Scoreboard = store.get_scoreboard(token_id.low.into());
            let mut result: Array<ByteArray> = array![];
            // Name
            result.append("Name");
            result.append(duelist.profile_type.name());
            // Honour
            result.append("Honour");
            result.append(scoreboard.score.get_honour());
            // Archetype
            let archetype: Archetype = scoreboard.score.get_archetype();
            result.append("Archetype");
            result.append(archetype.into());
            // Fame
            let fame_dispatcher: IFameCoinDispatcher = world.fame_coin_dispatcher();
            let fame_balance: u256 = fame_dispatcher.balance_of_token(get_contract_address(), token_id.low) / CONST::ETH_TO_WEI;
            result.append("Fame");
            result.append(fame_balance.to_string());
            result.append("Alive");
            result.append(if (fame_balance != 0) {"Alive"} else {"Dead"});
            // Totals
            result.append("Total Duels");
            result.append(scoreboard.score.total_duels.to_string());
            if (scoreboard.score.total_duels != 0) {
                result.append("Total Wins");
                result.append(scoreboard.score.total_wins.to_string());

                result.append("Total Losses");
                result.append(scoreboard.score.total_losses.to_string());
                
                result.append("Total Draws");
                result.append(scoreboard.score.total_draws.to_string());
            }
            // done!
            (result.span())
        }
    }
}
