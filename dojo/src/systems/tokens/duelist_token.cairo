use starknet::{ContractAddress};
use dojo::world::IWorldDispatcher;
use pistols::models::challenge::{Challenge};
use pistols::types::rules::{RewardValues};

#[starknet::interface]
pub trait IDuelistToken<TState> {
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
    // (CamelOnly)
    fn maxSupply(self: @TState) -> u256;
    fn totalSupply(self: @TState) -> u256;
    fn lastTokenId(self: @TState) -> u256;
    fn isMintingPaused(self: @TState) -> bool;
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
    fn exists(self: @TState, token_id: u128) -> bool;
    fn is_owner_of(self: @TState, address: ContractAddress, token_id: u128) -> bool;
    fn minted_count(self: @TState) -> u128;

    // IDuelistTokenPublic
    fn fame_balance(self: @TState, duelist_id: u128) -> u128;
    fn is_alive(self: @TState, duelist_id: u128) -> bool;
    fn life_count(self: @TState, duelist_id: u128) -> u8;
    fn is_inactive(self: @TState, duelist_id: u128) -> bool;
    fn inactive_timestamp(self: @TState, duelist_id: u128) -> u64;
    fn inactive_fame_dripped(self: @TState, duelist_id: u128) -> u128;
    fn poke(ref self: TState, duelist_id: u128);
    fn sacrifice(ref self: TState, duelist_id: u128);
    fn memorialize(ref self: TState, duelist_id: u128);
    // fn delete_duelist(ref self: TState, duelist_id: u128);

    // IDuelistTokenProtected
    fn mint_duelists(ref self: TState, recipient: ContractAddress, quantity: usize, seed: felt252) -> Span<u128>;
    fn transfer_rewards(ref self: TState, challenge: Challenge, tournament_id: u128) -> (RewardValues, RewardValues);
}

// Exposed to clients
#[starknet::interface]
pub trait IDuelistTokenPublic<TState> {
    // view
    fn fame_balance(self: @TState, duelist_id: u128) -> u128;
    fn is_alive(self: @TState, duelist_id: u128) -> bool;
    fn life_count(self: @TState, duelist_id: u128) -> u8;
    fn is_inactive(self: @TState, duelist_id: u128) -> bool;
    fn inactive_timestamp(self: @TState, duelist_id: u128) -> u64;
    fn inactive_fame_dripped(self: @TState, duelist_id: u128) -> u128;
    // write
    fn poke(ref self: TState, duelist_id: u128); //@description:Reactivates an inactive Duelist
    fn sacrifice(ref self: TState, duelist_id: u128); //@description:Sacrifices a Duelist
    fn memorialize(ref self: TState, duelist_id: u128); //@description:Memorializes a Duelist
    // fn delete_duelist(ref self: TState, duelist_id: u128);
}

// Exposed to world
#[starknet::interface]
pub trait IDuelistTokenProtected<TState> {
    fn mint_duelists(ref self: TState, recipient: ContractAddress, quantity: usize, seed: felt252) -> Span<u128>;
    fn transfer_rewards(ref self: TState, challenge: Challenge, tournament_id: u128) -> (RewardValues, RewardValues);
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
        IFameCoinDispatcher, IFameCoinDispatcherTrait,
        IFoolsCoinDispatcher, IFoolsCoinDispatcherTrait,
        IBankDispatcher, IBankDispatcherTrait,
    };
    use pistols::models::{
        pool::{PoolType, PoolTypeTrait, LordsReleaseBill},
        player::{Activity, ActivityTrait},
        duelist::{
            Duelist, DuelistValue,
            ScoreboardValue, ScoreTrait,
            DuelistMemorial, CauseOfDeath,
            Archetype,
        },
        challenge::{Challenge},
    };
    use pistols::types::{
        profile_type::{ProfileTypeTrait, ProfileManagerTrait},
        rules::{
            RulesType, RulesTypeTrait,
            FeeDistribution, FeeDistributionTrait,
            RewardValues,
        },
        constants::{CONST, FAME},
    };
    use pistols::libs::store::{Store, StoreTrait};
    use pistols::utils::short_string::{ShortStringTrait};
    use pistols::utils::math::{MathTrait};

    mod Errors {
        pub const INVALID_CALLER: felt252           = 'DUELIST: Invalid caller';
        pub const INVALID_DUELIST: felt252          = 'DUELIST: Invalid duelist';
        pub const DUELIST_IS_DEAD: felt252          = 'DUELIST: Duelist is dead!';
        pub const DUELIST_A_IS_DEAD: felt252        = 'DUELIST: Duelist A is dead!';
        pub const DUELIST_B_IS_DEAD: felt252        = 'DUELIST: Duelist B is dead!';
        pub const NOT_IMPLEMENTED: felt252          = 'DUELIST: Not implemented';
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
        let base_uri: ByteArray = format!("https://{}",base_uri.to_string());
        self.erc721_combo.initializer(
            TOKEN_NAME(),
            TOKEN_SYMBOL(),
            base_uri,
            Option::None, // contract_uri (use hooks)
            Option::None, // max_supply
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
        #[inline(always)]
        fn fame_balance(self: @ContractState,
            duelist_id: u128,
        ) -> u128 {
            let fame_dispatcher: IFameCoinDispatcher = self.world_default().fame_coin_dispatcher();
            (self._fame_balance(@fame_dispatcher, duelist_id))
        }

        #[inline(always)]
        fn is_alive(
            self: @ContractState,
            duelist_id: u128,
        ) -> bool {
            (self.life_count(duelist_id) != 0)
        }
        
        fn life_count(self: @ContractState,
            duelist_id: u128,
        ) -> u8 {
            let fame_dispatcher: IFameCoinDispatcher = self.world_default().fame_coin_dispatcher();
            let fame_balance: u128 = self._fame_balance(@fame_dispatcher, duelist_id);
            (fame_balance / FAME::ONE_LIFE.low).try_into().unwrap()
        }

        #[inline(always)]
        fn is_inactive(self: @ContractState,
            duelist_id: u128,
        ) -> bool {
            ((self.inactive_timestamp(duelist_id)) > FAME::MAX_INACTIVE_TIMESTAMP)
        }
        
        fn inactive_timestamp(self: @ContractState,
            duelist_id: u128,
        ) -> u64 {
            let mut store: Store = StoreTrait::new(self.world_default());
            let timestamp_active: u64 = store.get_duelist_value(duelist_id).timestamp_active;
            let timestamp: u64 = starknet::get_block_timestamp();
            (timestamp - timestamp_active)
        }

        #[inline(always)]
        fn inactive_fame_dripped(self: @ContractState,
            duelist_id: u128,
        ) -> u128 {
            let inactive_timestamp: u64 = self.inactive_timestamp(duelist_id);
            let fame_dripped: u128 = (MathTrait::sub(inactive_timestamp, FAME::MAX_INACTIVE_TIMESTAMP) / FAME::TIMESTAMP_TO_DRIP_ONE_FAME).into();
            (fame_dripped * CONST::ETH_TO_WEI.low)
        }
        
        fn poke(ref self: ContractState,
            duelist_id: u128,
        ) {
            let mut fame_dripped: u128 = self.inactive_fame_dripped(duelist_id);
            if (fame_dripped != 0) {
                // burn fame_dripped
                let survived: bool = self._reactivate_or_sacrifice(duelist_id, Option::Some(fame_dripped), CauseOfDeath::Forsaken);
                // only duel_token and owner can poke alive duelists
                if (survived && !self.world_default().is_duel_contract(starknet::get_caller_address())) {
                    self.token.assert_is_owner_of(starknet::get_caller_address(), duelist_id.into());
                }
            }
        }

        fn sacrifice(ref self: ContractState,
            duelist_id: u128,
        ) {
            self.token.assert_is_owner_of(starknet::get_caller_address(), duelist_id.into());
            self._reactivate_or_sacrifice(duelist_id, Option::None, CauseOfDeath::Sacrifice);
        }

        fn memorialize(ref self: ContractState,
            duelist_id: u128,
        ) {
            self.token.assert_is_owner_of(starknet::get_caller_address(), duelist_id.into());
            self._reactivate_or_sacrifice(duelist_id, Option::None, CauseOfDeath::Memorize);
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
            assert(store.world.caller_is_world_contract(), Errors::INVALID_CALLER);

            // mint tokens
            let duelist_ids: Span<u128> = self.token.mint_multiple(recipient, quantity);

            // create duelists
            let timestamp: u64 = starknet::get_block_timestamp();
            let mut rnd: u256 = seed.into();
            let mut i: usize = 0;
            while (i < duelist_ids.len()) {
                // create Duelist
                let duelist = Duelist {
                    duelist_id: *duelist_ids[i],
                    profile_type: ProfileManagerTrait::randomize_duelist(rnd.low.into()),
                    timestamp_registered: timestamp,
                    timestamp_active: timestamp,
                };
                store.set_duelist(@duelist);

                // mint fame
                let fame_dispatcher: IFameCoinDispatcher = store.world.fame_coin_dispatcher();
                fame_dispatcher.minted_duelist(duelist.duelist_id);

                // events
                Activity::DuelistSpawned.emit(ref store.world, recipient, duelist.duelist_id.into());

                rnd /= 0x100;
                i += 1;
            };

            (duelist_ids)
        }
        
        fn transfer_rewards(
            ref self: ContractState,
            challenge: Challenge,
            tournament_id: u128,
        ) -> (RewardValues, RewardValues) {
            // validate caller (game contract only)
            let mut store: Store = StoreTrait::new(self.world_default());
            assert(store.world.caller_is_world_contract(), Errors::INVALID_CALLER);

            // get fees distribution
            let rules: RulesType = store.get_table_rules(challenge.table_id);
            let distribution: @FeeDistribution = rules.get_rewards_distribution(challenge.table_id, tournament_id);
            if (!distribution.is_payable()) {
                return (Default::default(), Default::default());
            }

            let fame_dispatcher: IFameCoinDispatcher = store.world.fame_coin_dispatcher();
            let fools_dispatcher: IFoolsCoinDispatcher = store.world.fools_coin_dispatcher();
            let bank_dispatcher: IBankDispatcher = store.world.bank_dispatcher();

            // get current balances
            let balance_a: u128 = self._fame_balance(@fame_dispatcher, challenge.duelist_id_a);
            let balance_b: u128 = self._fame_balance(@fame_dispatcher, challenge.duelist_id_b);

            // calculate fees
            let mut rewards_a: RewardValues = rules.calc_rewards(balance_a, challenge.lives_staked, challenge.winner == 1);
            let mut rewards_b: RewardValues = rules.calc_rewards(balance_b, challenge.lives_staked, challenge.winner == 2);

            // transfer gains
            let treasury_address: ContractAddress = store.get_config_treasury_address();
            self._process_rewards(@fame_dispatcher, @fools_dispatcher, challenge.duelist_id_a, rewards_a);
            self._process_rewards(@fame_dispatcher, @fools_dispatcher, challenge.duelist_id_b, rewards_b);
            self._process_lost_fame(@fame_dispatcher, @bank_dispatcher, treasury_address, distribution, balance_a, challenge.duelist_id_a, ref rewards_a, rewards_b.fame_gained);
            self._process_lost_fame(@fame_dispatcher, @bank_dispatcher, treasury_address, distribution, balance_b, challenge.duelist_id_b, ref rewards_b, rewards_a.fame_gained);

            // DEAD
            if (!rewards_a.survived) {
                self._duelist_died(ref store, challenge.duelist_id_a, CauseOfDeath::Duelling, balance_a, challenge.duelist_id_b);
            }
            if (!rewards_b.survived) {
                self._duelist_died(ref store, challenge.duelist_id_b, CauseOfDeath::Duelling, balance_b, challenge.duelist_id_a);
            }

            // notify indexers to update metadata
            self.erc721_combo._emit_metadata_update(challenge.duelist_id_a.into());
            self.erc721_combo._emit_metadata_update(challenge.duelist_id_b.into());

            (rewards_a, rewards_b)
        }
    }

    //-----------------------------------
    // Internal
    //
    #[generate_trait]
    impl InternalImpl of InternalTrait {
        #[inline(always)]
        fn _fame_balance(self: @ContractState,
            fame_dispatcher: @IFameCoinDispatcher,
            duelist_id: u128,
        ) -> u128 {
            (*fame_dispatcher).balance_of_token(starknet::get_contract_address(), duelist_id).low
        }

        fn _process_rewards(ref self: ContractState,
            fame_dispatcher: @IFameCoinDispatcher,
            fools_dispatcher: @IFoolsCoinDispatcher,
            duelist_id: u128,
            values: RewardValues,
        ) {
            // reward 100% FAME to duelist
            if (values.fame_gained != 0) {
// println!("++ values.fame_gained: {}", values.fame_gained);
                (*fame_dispatcher).reward_duelist(duelist_id, values.fame_gained);
            }
            // reward 100% FOOLS to owner
            if (values.fools_gained != 0) {
                let owner: ContractAddress = self.owner_of(duelist_id.into());
                (*fools_dispatcher).reward_player(owner, values.fools_gained);
            }
        }
        
        fn _process_lost_fame(ref self: ContractState,
            fame_dispatcher: @IFameCoinDispatcher,
            bank_dispatcher: @IBankDispatcher,
            underware_address: ContractAddress,
            distribution: @FeeDistribution,
            fame_balance: u128,
            duelist_id: u128,
            ref values: RewardValues,
            winners_minted_fame: u128,
        ) {
            // Burn FAME from duelist
            if (values.fame_lost != 0) {
                // totals...
                let mut total_to_burn: u128 = winners_minted_fame; // was minted to winner
                let mut release_bills: Array<LordsReleaseBill> = array![];
                //
                // Process residuals (dead duelist)
                // the residual balance is split between sacred flame + underware
                let mut residual_due: u128 = (fame_balance - values.fame_lost);
                values.survived = (residual_due >= FAME::ONE_LIFE.low);
                if (values.survived) {
                    residual_due = 0;
                } else {
                    // transfer to PoolType::SacredFlame, do not burn
                    let amount: u128 = MathTrait::percentage(residual_due, FAME::SACRED_FLAME_PERCENTAGE);
                    (*bank_dispatcher).duelist_lost_fame_to_pool(starknet::get_contract_address(), duelist_id, amount, PoolType::SacredFlame);
                    residual_due -= amount;
                }
                //
                // Process distribution
                // (calculated over burn-mint difference)
                let distribution_total: u128 = (values.fame_lost - winners_minted_fame);
                let mut distribution_due: u128 = distribution_total;
                // transfer to PoolType::Season(x), do not burn
                if (*distribution.pool_percent != 0 && distribution.pool_id.exists()) {
                    let amount: u128 = MathTrait::percentage(distribution_total, *distribution.pool_percent);
                    (*bank_dispatcher).duelist_lost_fame_to_pool(starknet::get_contract_address(), duelist_id, amount, *distribution.pool_id);
                    distribution_due -= amount;
                }
                // release LORDS do tournament creator + burn
                if (*distribution.creator_percent != 0 && distribution.creator_address.is_non_zero()) {
                    let amount: u128 = MathTrait::percentage(distribution_total, *distribution.creator_percent);
                    release_bills.append(LordsReleaseBill {
                        recipient: *distribution.creator_address,
                        fame_amount: amount,
                        lords_amount: 0,
                    });
                    distribution_due -= amount;
                    total_to_burn += amount; // released, need to burn
                }
                // remaining FAME to underware
                let mut underware_due: u128 = residual_due + distribution_due;
                release_bills.append(LordsReleaseBill {
                    recipient: underware_address,
                    fame_amount: underware_due,
                    lords_amount: 0,
                });
                total_to_burn += underware_due; // released, need to burn
                //
                // release LORDS and burn FAME
                values.lords_unlocked += (*bank_dispatcher).release_lords_from_fame_to_be_burned(release_bills.span());
                (*fame_dispatcher).burn_from_token(starknet::get_contract_address(), duelist_id, total_to_burn.into());
            } else {
                values.survived = true;
            }
        }

        fn _reactivate_or_sacrifice(ref self: ContractState,
            duelist_id: u128,
            fame_dripped: Option<u128>,
            cause_of_death: CauseOfDeath,
        ) -> bool {
            let mut store: Store = StoreTrait::new(self.world_default());
            let fame_dispatcher: IFameCoinDispatcher = store.world.fame_coin_dispatcher();
            let bank_dispatcher: IBankDispatcher = store.world.bank_dispatcher();

            // must be alive!
            let fame_balance: u128 = self._fame_balance(@fame_dispatcher, duelist_id);
            assert(fame_balance != 0, Errors::DUELIST_IS_DEAD);

            let mut due_amount = match fame_dripped {
                // poke: burn dripped fame, but no more than balance
                Option::Some(fame_dripped) => {core::cmp::min(fame_balance, fame_dripped)},
                // sacrifice: burn the whole balance
                Option::None => {fame_balance}
            };
// println!("fame_dripped: {}", fame_dripped.unwrap());
// println!("fame_balance: {}", fame_balance);
// println!("due_amount: {}", due_amount);
            // 60% of one life goes to sacred flame
            let survived: bool = (fame_balance - due_amount) >= FAME::ONE_LIFE.low;
// println!("survived: {}", survived);
            if (!survived) {
                let amount: u128 = MathTrait::percentage(FAME::ONE_LIFE.low, FAME::SACRED_FLAME_PERCENTAGE);
                bank_dispatcher.duelist_lost_fame_to_pool(starknet::get_contract_address(), duelist_id, amount, PoolType::SacredFlame);
                // burn the full balance
                due_amount = fame_balance - amount;
                // emit event...
                self._duelist_died(ref store,
                    duelist_id,
                    cause_of_death,
                    if (cause_of_death == CauseOfDeath::Sacrifice) {duelist_id} else {0},
                    fame_balance,
                );
            }

            // remaining fame to be burned and released
            let bill = LordsReleaseBill {
                recipient: store.get_config_treasury_address(),
                fame_amount: due_amount,
                lords_amount: 0,
            };
            bank_dispatcher.release_lords_from_fame_to_be_burned(array![bill].span());
            fame_dispatcher.burn_from_token(starknet::get_contract_address(), duelist_id, due_amount.into());
// println!("remaining: {}", self._fame_balance(@fame_dispatcher, duelist_id));

            // update duelist timestamp
            store.set_duelist_timestamp_active(duelist_id);
            
            // notify indexers to update metadata
            self.erc721_combo._emit_metadata_update(duelist_id.into());

            (survived)
        }

        fn _duelist_died(ref self: ContractState,
            ref store: Store,
            duelist_id: u128,
            cause_of_death: CauseOfDeath,
            killed_by: u128,
            fame_before_death: u128,
        ) {
            let mut memorial = DuelistMemorial {
                duelist_id,
                cause_of_death,
                killed_by,
                fame_before_death,
            };
            store.set_duelist_memorial(@memorial);
            // events
            Activity::DuelistDied.emit(ref store.world, starknet::get_caller_address(), duelist_id.into());
        }
    }


    //-----------------------------------
    // ERC721ComboHooksTrait
    //
    pub impl ERC721ComboHooksImpl of ERC721ComboComponent::ERC721ComboHooksTrait<ContractState> {
        fn render_contract_uri(self: @ERC721ComboComponent::ComponentState<ContractState>) -> Option<ContractMetadata> {
            let self = self.get_contract(); // get the component's contract state
            // let mut store: Store = StoreTrait::new(self.world_default());
            // return the metadata to be rendered by the component
            let metadata = ContractMetadata {
                name: self.name(),
                symbol: self.symbol(),
                description: "Pistols at Dawn Duelists",
                image: "",
                banner_image: "",
                featured_image: "",
                external_link: "https://pistols.underware.gg",
                collaborators: array![
                    // starknet::contract_address_const::<0x13d9ee239f33fea4f8785b9e3870ade909e20a9599ae7cd62c1c292b73af1b7>(),
                ].span(),
            };
            (Option::Some(metadata))
        }

        fn render_token_uri(self: @ERC721ComboComponent::ComponentState<ContractState>, token_id: u256) -> Option<TokenMetadata> {
            let self = self.get_contract(); // get the component's contract state
            let mut store: Store = StoreTrait::new(self.world_default());
            // gether data
            let duelist: DuelistValue = store.get_duelist_value(token_id.low);
            let scoreboard: ScoreboardValue = store.get_scoreboard_value(token_id.low.into(), 0);
            let archetype: Archetype = scoreboard.score.get_archetype();
            let base_uri: ByteArray = self.erc721._base_uri();
            let image_square: ByteArray = duelist.profile_type.get_uri(base_uri.clone(), "square");
            let image_portrait: ByteArray = duelist.profile_type.get_uri(base_uri.clone(), "portrait");
            let fame_balance: u128 = self._fame_balance(@store.world.fame_coin_dispatcher(), token_id.low) / CONST::ETH_TO_WEI.low;
            // Image
            let svg: ByteArray = 
                "<svg xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='xMinYMin meet' viewBox='0 0 1024 1434'>" +
                "<image href='" + 
                image_square.clone() +
                "' x='0' y='0' width='1024px' height='1024px' />" +
                "<image href='" +
                base_uri.clone() +
                "/textures/cards/card_front_brown.png' x='0' y='0' width='1024px' height='1434px' />" +
                "</svg>";
            let image: ByteArray = Encoder::encode_svg(svg, true);
            // Attributes
            let mut attributes: Array<Attribute> = array![
                Attribute {
                    key: "Name",
                    value: duelist.profile_type.name(),
                },
                Attribute {
                    key: "Honour",
                    value: scoreboard.score.get_honour(),
                },
                Attribute {
                    key: "Archetype",
                    value: archetype.into(),
                },
                Attribute {
                    key: "Fame",
                    value: fame_balance.to_string(),
                },
                Attribute {
                    key: "Lives",
                    value: (fame_balance / FAME::ONE_LIFE.low).to_string(),
                },
                Attribute {
                    key: "Alive",
                    value: if (fame_balance != 0) {"Alive"} else {"Dead"},
                },
                Attribute {
                    key: "Total Duels",
                    value: scoreboard.score.total_duels.to_string(),
                },
            ];
            if (scoreboard.score.total_duels != 0) {
                attributes.append(Attribute {
                    key: "Total Wins",
                    value: scoreboard.score.total_wins.to_string(),
                });
                attributes.append(Attribute {
                    key: "Total Losses",
                    value: scoreboard.score.total_losses.to_string(),
                });
                attributes.append(Attribute {
                    key: "Total Draws",
                    value: scoreboard.score.total_draws.to_string(),
                });
                attributes.append(Attribute {
                    key: "Score",
                    value: scoreboard.score.points.to_string(),
                });
            }
            // metadata
            let mut additional_metadata: Array<Attribute> = array![
                Attribute {
                    key: "image_square",
                    value: image_square.clone(),
                },
                Attribute {
                    key: "image_portrait",
                    value: image_portrait.clone(),
                },
            ];
            // return the metadata to be rendered by the component
            let metadata = TokenMetadata {
                token_id,
                name: format!("{} #{}", duelist.profile_type.name(), token_id),
                description: format!("Pistols at Dawn Duelist #{}. https://pistols.underware.gg", token_id),
                image,
                attributes: attributes.span(),
                additional_metadata: additional_metadata.span(),
            };
            (Option::Some(metadata))
        }
    }
}
