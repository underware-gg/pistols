use starknet::{ContractAddress};
use dojo::world::IWorldDispatcher;
use pistols::models::challenge::{Challenge};
use pistols::models::table::{FeeValues};

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
    fn minted_count(self: @TState) -> u128;

    // ITokenRenderer
    fn get_token_name(self: @TState, token_id: u256) -> ByteArray;
    fn get_token_description(self: @TState, token_id: u256) -> ByteArray;
    fn get_token_image(self: @TState, token_id: u256) -> ByteArray;

    // IDuelistTokenPublic
    fn is_alive(self: @TState, duelist_id: u128) -> bool;
    fn life_count(self: @TState, duelist_id: u128) -> u8;
    fn calc_season_reward(self: @TState, duelist_id: u128, lives_staked: u8) -> FeeValues;
    // fn delete_duelist(ref self: TState, duelist_id: u128);

    // IDuelistTokenProtected
    fn mint_duelists(ref self: TState, recipient: ContractAddress, quantity: usize, seed: felt252) -> Span<u128>;
    fn transfer_rewards(ref self: TState, challenge: Challenge, tournament_id: u128) -> (FeeValues, FeeValues);
}

#[starknet::interface]
pub trait IDuelistTokenPublic<TState> {
    // view
    fn is_alive(self: @TState, duelist_id: u128) -> bool;
    fn life_count(self: @TState, duelist_id: u128) -> u8;
    fn calc_season_reward(self: @TState, duelist_id: u128, lives_staked: u8) -> FeeValues;
    // write
    // fn delete_duelist(ref self: TState, duelist_id: u128);
}

#[starknet::interface]
pub trait IDuelistTokenProtected<TState> {
    fn mint_duelists(ref self: TState, recipient: ContractAddress, quantity: usize, seed: felt252) -> Span<u128>;
    fn transfer_rewards(ref self: TState, challenge: Challenge, tournament_id: u128) -> (FeeValues, FeeValues);
}

#[dojo::contract]
pub mod duelist_token {    
    use core::num::traits::Zero;
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
        IFameCoinDispatcher, IFameCoinDispatcherTrait,
        IFoolsCoinDispatcher, IFoolsCoinDispatcherTrait,
        IBankDispatcher, IBankDispatcherTrait,
    };
    use pistols::models::{
        config::{Config},
        pool::{PoolType, PoolTypeTrait},
        player::{PlayerTrait, Activity},
        duelist::{
            Duelist, DuelistValue,
            Scoreboard, ScoreTrait,
            Archetype,
        },
        challenge::{Challenge},
        table::{
            TableConfig,
            TableType, TableTypeTrait,
            FeeDistribution, FeeDistributionTrait,
            FeeValues,
        },
    };
    use pistols::types::{
        profile_type::{ProfileTypeTrait, ProfileManagerTrait},
        constants::{CONST, FAME},
    };
    use pistols::libs::store::{Store, StoreTrait};
    use pistols::utils::metadata::{MetadataTrait};
    use pistols::utils::short_string::{ShortStringTrait};
    use pistols::utils::math::{MathTrait};

    mod Errors {
        pub const INVALID_DUELIST: felt252          = 'DUELIST: Invalid duelist';
        pub const NOT_IMPLEMENTED: felt252          = 'DUELIST: Not implemented';
        pub const DUEL_INVALID_CALLER: felt252      = 'DUELIST: Invalid caller';
        pub const DUELIST_A_IS_DEAD: felt252        = 'DUELIST: Duelist A is dead!';
        pub const DUELIST_B_IS_DEAD: felt252        = 'DUELIST: Duelist B is dead!';
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
        let mut world = self.world_default();
        self.erc721.initializer(
            TOKEN_NAME(),
            TOKEN_SYMBOL(),
            format!("https://{}",base_uri.to_string()),
        );
        self.token.initialize(
            world.pack_token_address(),
            renderer_address,
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
    impl DuelistTokenPublicImpl of super::IDuelistTokenPublic<ContractState> {
        fn is_alive(
            self: @ContractState,
            duelist_id: u128,
        ) -> bool {
            (self.life_count(duelist_id) > 0)
        }
        
        fn life_count(self: @ContractState,
            duelist_id: u128,
        ) -> u8 {
            let fame_dispatcher: IFameCoinDispatcher = self.world_default().fame_coin_dispatcher();
            let fame_balance: u256 = fame_dispatcher.balance_of_token(starknet::get_contract_address(), duelist_id);
            ((fame_balance / FAME::ONE_LIFE).try_into().unwrap())
        }

        fn calc_season_reward(self: @ContractState, duelist_id: u128, lives_staked: u8) -> FeeValues {
            let mut store: Store = StoreTrait::new(self.world_default());
            let table: TableConfig = store.get_current_season_table();
            let fame_balance: u128 = store.world.fame_coin_dispatcher().balance_of_token(starknet::get_contract_address(), duelist_id).low;
            let fees_loss: FeeValues = table.table_type.calc_fame_fees(fame_balance, lives_staked, false);
            let fees_win: FeeValues = table.table_type.calc_fame_fees(fame_balance, lives_staked, true);
            (FeeValues{
                fame_lost: fees_loss.fame_lost,
                fame_gained: fees_win.fame_gained,
                fools_gained: fees_win.fools_gained,
                lords_unlocked: fees_win.lords_unlocked,
            })
        }

        // fn delete_duelist(ref self: ContractState,
        //     duelist_id: u128,
        // ) {
        //     self.token.assert_is_owner_of(starknet::get_caller_address(), duelist_id.into());
        //     // duelist burn not supported
        //     assert(false, Errors::NOT_IMPLEMENTED);
        //     // self.token.burn(duelist_id.into());
        //     // burn FAME too
        // }

    }

    //-----------------------------------
    // Protected
    //
    #[abi(embed_v0)]
    impl DuelistTokenProtectedImpl of super::IDuelistTokenProtected<ContractState> {
        fn mint_duelists(ref self: ContractState,
            recipient: ContractAddress,
            quantity: usize,
            seed: felt252,
        ) -> Span<u128>{
            let mut store: Store = StoreTrait::new(self.world_default());

            // mint tokens
            let duelist_ids: Span<u128> = self.token.mint_multiple(recipient, quantity);

            // create duelists
            let mut rnd: u256 = seed.into();
            let mut i: usize = 0;
            while (i < duelist_ids.len()) {
                // create Duelist
                let duelist = Duelist {
                    duelist_id: *duelist_ids[i],
                    profile_type: ProfileManagerTrait::randomize_duelist(rnd.low.into()),
                    timestamp: starknet::get_block_timestamp(),
                };
                store.set_duelist(@duelist);

                // mint fame
                let fame_dispatcher: IFameCoinDispatcher = store.world.fame_coin_dispatcher();
                fame_dispatcher.minted_duelist(duelist.duelist_id);

                // events
                PlayerTrait::check_in(ref store, Activity::CreatedDuelist, recipient, duelist.duelist_id.into());

                rnd /= 0x100;
                i += 1;
            };

            (duelist_ids)
        }
        
        fn transfer_rewards(
            ref self: ContractState,
            challenge: Challenge,
            tournament_id: u128,
        ) -> (FeeValues, FeeValues) {
            // validate caller (game contract only)
            let mut store: Store = StoreTrait::new(self.world_default());
            assert(store.world.is_game_contract(starknet::get_caller_address()), Errors::DUEL_INVALID_CALLER);

            // get fees distribution
            let table_type: TableType = store.get_table_config(challenge.table_id).table_type;
            let distribution: @FeeDistribution = table_type.get_fame_distribution(challenge.table_id, tournament_id);
            if (!distribution.is_payable()) {
                return (Default::default(), Default::default());
            }

            let fame_dispatcher: IFameCoinDispatcher = store.world.fame_coin_dispatcher();
            let fools_dispatcher: IFoolsCoinDispatcher = store.world.fools_coin_dispatcher();
            let bank_dispatcher: IBankDispatcher = store.world.bank_dispatcher();

            // get current balances
            let balance_a: u128 = fame_dispatcher.balance_of_token(starknet::get_contract_address(), challenge.duelist_id_a).low;
            let balance_b: u128 = fame_dispatcher.balance_of_token(starknet::get_contract_address(), challenge.duelist_id_b).low;

            // calculate fees
            let mut values_a: FeeValues = table_type.calc_fame_fees(balance_a, challenge.lives_staked, challenge.winner == 1);
            let mut values_b: FeeValues = table_type.calc_fame_fees(balance_b, challenge.lives_staked, challenge.winner == 2);

            // transfer gains
            let config: Config = store.get_config();
            self.transfer_gains(fame_dispatcher, fools_dispatcher, values_a, challenge.duelist_id_a);
            self.transfer_gains(fame_dispatcher, fools_dispatcher, values_b, challenge.duelist_id_b);
            // TODO... optimize, combine LORDS releases into one
            self.transfer_losses(fame_dispatcher, bank_dispatcher, distribution, ref values_a, challenge.duelist_id_a, config.treasury_address);
            self.transfer_losses(fame_dispatcher, bank_dispatcher, distribution, ref values_b, challenge.duelist_id_b, config.treasury_address);

            (values_a, values_b)
        }
    }

    //-----------------------------------
    // Internal
    //
    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn transfer_gains(ref self: ContractState,
            fame_dispatcher: IFameCoinDispatcher,
            fools_dispatcher: IFoolsCoinDispatcher,
            values: FeeValues,
            duelist_id: u128,
        ) {
            // reward 100% FAME to duelist
            if (values.fame_gained != 0) {
                fame_dispatcher.reward_duelist(duelist_id, values.fame_gained.into());
            }
            // reward 100% FOOLS to owner
            if (values.fools_gained != 0) {
                let owner: ContractAddress = self.owner_of(duelist_id.into());
                fools_dispatcher.reward_player(owner, values.fools_gained.into());
            }
        }
        fn transfer_losses(ref self: ContractState,
            fame_dispatcher: IFameCoinDispatcher,
            bank_dispatcher: IBankDispatcher,
            distribution: @FeeDistribution,
            ref values: FeeValues,
            duelist_id: u128,
            underware_address: ContractAddress,
        ) {
            // Burn FAME from duelist
            if (values.fame_lost != 0) {
                // if duelist died, residual fame is also burned
                let fame_balance: u128 = fame_dispatcher.balance_of_token(starknet::get_contract_address(), duelist_id).low;
                let mut residual_fame: u128 = (fame_balance - values.fame_lost);
                if (residual_fame < FAME::ONE_LIFE.low && residual_fame != 0) {
                    // 60% residual goes to PoolType::SacredFlame
                    let amount: u128 = MathTrait::percentage(residual_fame, 60);
                    bank_dispatcher.duelist_lost_fame(starknet::get_contract_address(), duelist_id, amount.into(), PoolType::SacredFlame);
                    // remaining for underware
                    residual_fame -= amount;
                } else {
                    // not dead yet
                    residual_fame = 0;
                }
                // distribute fame lost...
                let mut due_amount: u128 = values.fame_lost;
                // transfer lost FAME to PoolType::Season()
                if (*distribution.winners_percent != 0 && distribution.pool_id.exists()) {
                    let amount: u128 = MathTrait::percentage(due_amount, *distribution.winners_percent);
                    bank_dispatcher.duelist_lost_fame(starknet::get_contract_address(), duelist_id, amount.into(), *distribution.pool_id);
                    due_amount -= amount;
                }
                // remaining is burned before unlocking
                fame_dispatcher.burn_from_token(starknet::get_contract_address(), duelist_id, (due_amount + residual_fame).into());
                // reward tournament creator
                if (*distribution.creator_percent != 0 && distribution.creator_address.is_non_zero()) {
                    let amount: u128 = MathTrait::percentage(due_amount, *distribution.creator_percent);
                    values.lords_unlocked += bank_dispatcher.burned_fame_release_lords(*distribution.creator_address, amount.into()).low;
                    due_amount -= amount;
                }
                // remaining to underware
                values.lords_unlocked += bank_dispatcher.burned_fame_release_lords(underware_address, (due_amount + residual_fame).into()).low;
            }
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
    //     ) {
    //     }

    //     fn after_update(ref self: ERC721Component::ComponentState<ContractState>,
    //         to: ContractAddress,
    //         token_id: u256,
    //         auth: ContractAddress,
    //     ) {}

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
            let fame_balance: u256 = fame_dispatcher.balance_of_token(starknet::get_contract_address(), token_id.low) / CONST::ETH_TO_WEI;
            result.append("Fame");
            result.append(fame_balance.to_string());
            result.append("Lives");
            result.append((fame_balance / FAME::ONE_LIFE).to_string());
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
