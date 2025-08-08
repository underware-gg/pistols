use starknet::{ContractAddress};
use dojo::world::IWorldDispatcher;
use pistols::models::challenge::{Challenge};
use pistols::models::pool::{PoolType};
use pistols::types::duelist_profile::{DuelistProfile};
use pistols::types::rules::{RewardValues, DuelBonus};

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

    // IDuelistTokenPublic
    fn fame_balance(self: @TState, duelist_id: u128) -> u128;
    fn is_alive(self: @TState, duelist_id: u128) -> bool;
    fn life_count(self: @TState, duelist_id: u128) -> u8;
    fn is_inactive(self: @TState, duelist_id: u128) -> bool;
    fn inactive_timestamp(self: @TState, duelist_id: u128) -> u64;
    fn inactive_fame_dripped(self: @TState, duelist_id: u128) -> u128;
    fn poke(ref self: TState, duelist_id: u128) -> bool;
    fn sacrifice(ref self: TState, duelist_id: u128);
    fn memorialize(ref self: TState, duelist_id: u128);
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
    fn poke(ref self: TState, duelist_id: u128) -> bool; //@description: Reactivates an inactive Duelist
    fn sacrifice(ref self: TState, duelist_id: u128); //@description: Sacrifices a Duelist
    fn memorialize(ref self: TState, duelist_id: u128); //@description: Memorializes a Duelist
}

// Exposed to world
#[starknet::interface]
pub trait IDuelistTokenProtected<TState> {
    fn mint_duelists(ref self: TState,
        recipient: ContractAddress,
        quantity: usize,
        profile_type: DuelistProfile,
        seed: felt252,
        pool_type: PoolType,
        lords_amount: u128,
    ) -> Span<u128>;
    fn get_validated_active_duelist_id(ref self: TState, address: ContractAddress, duelist_id: u128, lives_staked: u8) -> u128;
    fn transfer_rewards(ref self: TState, challenge: Challenge, tournament_id: u64, bonus: DuelBonus) -> (RewardValues, RewardValues);
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
        IFameCoinDispatcher, IFameCoinDispatcherTrait,
        IFameCoinProtectedDispatcher, IFameCoinProtectedDispatcherTrait,
        IFoolsCoinProtectedDispatcher, IFoolsCoinProtectedDispatcherTrait,
        IBankProtectedDispatcher, IBankProtectedDispatcherTrait,
    };
    use pistols::models::{
        challenge::{Challenge, DuelTypeTrait},
        duelist::{
            Duelist, DuelistValue,
            DuelistTimestamps,
            DuelistAssignmentValue,
            DuelistMemorial, CauseOfDeath, //DuelistMemorialValue,
            TotalsTrait,
            Archetype,
        },
        player::{PlayerTrait, PlayerDuelistStack, PlayerDuelistStackTrait},
        pool::{PoolType, PoolTypeTrait, LordsReleaseBill, ReleaseReason},
        ring::{RingType},
        events::{Activity, ActivityTrait},
    };
    use pistols::types::{
        duelist_profile::{ProfileManagerTrait, DuelistProfile, DuelistProfileTrait},
        rules::{
            Rules, RulesTrait,
            PoolDistribution, PoolDistributionTrait,
            RewardValues, DuelBonus,
        },
        constants::{CONST, FAME, METADATA},
    };
    use pistols::libs::store::{Store, StoreTrait};
    use pistols::utils::short_string::{ShortStringTrait};
    use pistols::utils::math::{MathTrait};
    use pistols::utils::misc::{ETH};
    use graffiti::url::{UrlImpl};

    pub mod Errors {
        pub const INVALID_CALLER: felt252           = 'DUELIST: Invalid caller';
        pub const INVALID_DUELIST: felt252          = 'DUELIST: Invalid duelist';
        pub const NOT_YOUR_DUELIST: felt252         = 'DUELIST: Not your duelist';
        pub const DUELIST_IS_DEAD: felt252          = 'DUELIST: Duelist is dead!';
        pub const INSUFFICIENT_LIVES: felt252       = 'DUELIST: Insufficient lives';
        pub const NOT_IMPLEMENTED: felt252          = 'DUELIST: Not implemented';
    }

    //*******************************
    fn TOKEN_NAME()   -> ByteArray {("Pistols at Dawn Duelists")}
    fn TOKEN_SYMBOL() -> ByteArray {("DUELIST")}
    //*******************************

    fn dojo_init(
        ref self: ContractState,
        base_uri: felt252,
    ) {
        let mut world = self.world_default();
        self.erc721_combo.initializer(
            TOKEN_NAME(),
            TOKEN_SYMBOL(),
            base_uri.to_string(),
            Option::None, // contract_uri (use hooks)
            Option::Some(CONST::MAX_DUELIST_ID.into()), // max_supply
        );
        self.token.initialize(
            world.pack_token_address(),
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
            (fame_balance / FAME::ONE_LIFE).try_into().unwrap()
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
            //-----------------------------------
            // TEMP: disabled dripping
            // when enabling, also activate tests with "TEMP: disabled dripping"
            (0)
            //-----------------------------------
            // let mut store: Store = StoreTrait::new(self.world_default());
            // let timestamp_active: u64 = store.get_duelist_timestamps(duelist_id).active;
            // if (timestamp_active.is_zero()) {
            //     (0)
            // } else {
            //     let timestamp: u64 = starknet::get_block_timestamp();
            //     (timestamp - timestamp_active)
            // }
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
        ) -> bool {
            let mut survived: bool = true;
            let mut fame_dripped: u128 = self.inactive_fame_dripped(duelist_id);
            if (fame_dripped != 0) {
                // burn fame_dripped
                survived = self._reactivate_or_sacrifice(duelist_id, Option::Some(fame_dripped), CauseOfDeath::Forsaken);
                // only duel_token and owner can poke alive duelists
                let world = self.world_default();
                if (survived && !world.caller_is_duel_contract()) {
                    self.erc721_combo._require_owner_of(starknet::get_caller_address(), duelist_id.into());
                }
            }
            (survived)
        }

        fn sacrifice(ref self: ContractState,
            duelist_id: u128,
        ) {
            assert(false, Errors::NOT_IMPLEMENTED);
            self.erc721_combo._require_owner_of(starknet::get_caller_address(), duelist_id.into());
            self._reactivate_or_sacrifice(duelist_id, Option::None, CauseOfDeath::Sacrifice);
        }

        fn memorialize(ref self: ContractState,
            duelist_id: u128,
        ) {
            assert(false, Errors::NOT_IMPLEMENTED);
            self.erc721_combo._require_owner_of(starknet::get_caller_address(), duelist_id.into());
            self._reactivate_or_sacrifice(duelist_id, Option::None, CauseOfDeath::Memorize);
        }
    }

    //-----------------------------------
    // Protected
    //
    #[abi(embed_v0)]
    impl DuelistTokenProtectedImpl of super::IDuelistTokenProtected<ContractState> {
        fn mint_duelists(ref self: ContractState,
            recipient: ContractAddress,
            quantity: usize,
            profile_type: DuelistProfile,
            seed: felt252,
            pool_type: PoolType,
            lords_amount: u128,
        ) -> Span<u128>{
            let mut store: Store = StoreTrait::new(self.world_default());
            assert(store.world.caller_is_world_contract(), Errors::INVALID_CALLER);

            // mint tokens
            let duelist_ids: Span<u128> = self.token.mint_next_multiple(recipient, quantity);

            // create duelists
            let mut seed: u256 = seed.into();
            let mut i: usize = 0;
            while (i < duelist_ids.len()) {
                let duelist_id: u128 = *duelist_ids[i];
                let duelist_profile: DuelistProfile = 
                    // unpacked in open()
                    if (seed.is_zero()) {(profile_type)}
                    // randomize based on unknown type
                    else {(ProfileManagerTrait::randomize_profile(profile_type, seed.low.into()))};
                self._spawn_duelist(ref store,
                    recipient,
                    duelist_profile,
                    duelist_id,
                );
                seed /= 0x100;
                i += 1;
            };

            // minted fame, peg to paid LORDS
            store.world.bank_protected_dispatcher().peg_minted_fame_to_lords(recipient, lords_amount.into(), pool_type);

            PlayerTrait::append_alive_duelist(ref store, recipient, quantity.try_into().unwrap());

            (duelist_ids)
        }

        fn get_validated_active_duelist_id(ref self: ContractState, address: ContractAddress, duelist_id: u128, lives_staked: u8) -> u128 {
            assert(duelist_id.is_non_zero(), Errors::INVALID_DUELIST);

            // validate duelist ownership
            let mut store: Store = StoreTrait::new(self.world_default());
            assert(self.is_owner_of(address, duelist_id.into()) == true, Errors::NOT_YOUR_DUELIST);

            // bot duelists are always validates
            if (store.world.is_bot_player_contract(address)) {
                return (duelist_id);
            }

            // get active duelist from stack
            let mut active_duelist_id: u128 = store.get_active_duelist_id(address, duelist_id);
            // poke inactivity (it may die!)
// println!("poke A... {}", duelist_id_a);
            if (self.poke(active_duelist_id) == false) {
                // died, get next in line...
                active_duelist_id = store.get_active_duelist_id(address, duelist_id);
            }

            // validate duelist health
            let lives: u8 = self.life_count(active_duelist_id);
            assert(lives > 0, Errors::DUELIST_IS_DEAD);
            assert(lives >= lives_staked, Errors::INSUFFICIENT_LIVES);

            (active_duelist_id)
        }

        fn transfer_rewards(
            ref self: ContractState,
            challenge: Challenge,
            tournament_id: u64,
            bonus: DuelBonus,
        ) -> (RewardValues, RewardValues) {
            // validate caller (game contract only)
            let mut store: Store = StoreTrait::new(self.world_default());
            assert(store.world.caller_is_world_contract(), Errors::INVALID_CALLER);

            // get fees distribution
            let season_id: u32 = store.get_current_season_id();
            let rules: Rules = challenge.duel_type.get_rules(@store);
            let distribution: @PoolDistribution = rules.get_rewards_distribution(season_id, tournament_id);
            if (!distribution.is_payable()) {
                return (Default::default(), Default::default());
            }

            let fame_dispatcher: IFameCoinDispatcher = store.world.fame_coin_dispatcher();
            let fame_protected_dispatcher: IFameCoinProtectedDispatcher = store.world.fame_coin_protected_dispatcher();
            let fools_protected_dispatcher: IFoolsCoinProtectedDispatcher = store.world.fools_coin_protected_dispatcher();
            let bank_protected_dispatcher: IBankProtectedDispatcher = store.world.bank_protected_dispatcher();

            // get current balances
            let balance_a: u128 = self._fame_balance(@fame_dispatcher, challenge.duelist_id_a);
            let balance_b: u128 = self._fame_balance(@fame_dispatcher, challenge.duelist_id_b);

            // calculate fees
            let signet_ring_a: RingType = if (challenge.winner == 1) {store.get_player_active_signet_ring(challenge.address_a)} else {RingType::Unknown};
            let signet_ring_b: RingType = if (challenge.winner == 2) {store.get_player_active_signet_ring(challenge.address_b)} else {RingType::Unknown};
            let mut rewards_a: RewardValues = rules.calc_rewards(balance_a, challenge.lives_staked, challenge.winner == 1, signet_ring_a, @bonus.duelist_a);
            let mut rewards_b: RewardValues = rules.calc_rewards(balance_b, challenge.lives_staked, challenge.winner == 2, signet_ring_b, @bonus.duelist_b);

            // transfer gains
            let treasury_address: ContractAddress = store.get_config_treasury_address();
            self._process_rewards(@fame_protected_dispatcher, @fools_protected_dispatcher, challenge.duelist_id_a, rewards_a);
            self._process_rewards(@fame_protected_dispatcher, @fools_protected_dispatcher, challenge.duelist_id_b, rewards_b);
            self._process_lost_fame(@fame_protected_dispatcher, @bank_protected_dispatcher, treasury_address, distribution, balance_a, challenge.duel_id, challenge.duelist_id_a, ref rewards_a, rewards_b.fame_gained);
            self._process_lost_fame(@fame_protected_dispatcher, @bank_protected_dispatcher, treasury_address, distribution, balance_b, challenge.duel_id, challenge.duelist_id_b, ref rewards_b, rewards_a.fame_gained);

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
        fn _spawn_duelist(ref self: ContractState,
            ref store: Store,
            recipient: ContractAddress,
            duelist_profile: DuelistProfile,
            duelist_id: u128,
        ) {
            // create Duelist
            let duelist = Duelist {
                duelist_id,
                duelist_profile,
                timestamps: DuelistTimestamps {
                    registered: starknet::get_block_timestamp(),
                    active: 0,
                },
                totals: Default::default(),
            };
            store.set_duelist(@duelist);

            // add to player's stack
            let mut stack: PlayerDuelistStack = store.get_player_duelist_stack(recipient, duelist.duelist_profile);
            stack.append(duelist.duelist_id);
            store.set_player_duelist_stack(@stack);
            // mint fame
            store.world.fame_coin_protected_dispatcher().minted_duelist(duelist.duelist_id);

            // events
            Activity::DuelistSpawned.emit(ref store.world, recipient, duelist.duelist_id.into());
        }

        #[inline(always)]
        fn _fame_balance(self: @ContractState,
            fame_dispatcher: @IFameCoinDispatcher,
            duelist_id: u128,
        ) -> u128 {
            (*fame_dispatcher).balance_of_token(starknet::get_contract_address(), duelist_id).low
        }

        fn _process_rewards(ref self: ContractState,
            fame_protected_dispatcher: @IFameCoinProtectedDispatcher,
            fools_protected_dispatcher: @IFoolsCoinProtectedDispatcher,
            duelist_id: u128,
            values: RewardValues,
        ) {
            // reward 100% FAME to duelist
            if (values.fame_gained != 0) {
// println!("++ values.fame_gained: {}", values.fame_gained);
                (*fame_protected_dispatcher).reward_duelist(duelist_id, values.fame_gained);
            }
            // reward 100% FOOLS to owner
            if (values.fools_gained != 0) {
                let owner: ContractAddress = self.owner_of(duelist_id.into());
                (*fools_protected_dispatcher).reward_player(owner, values.fools_gained);
            }
        }
        
        fn _process_lost_fame(ref self: ContractState,
            fame_protected_dispatcher: @IFameCoinProtectedDispatcher,
            bank_protected_dispatcher: @IBankProtectedDispatcher,
            underware_address: ContractAddress,
            distribution: @PoolDistribution,
            fame_balance: u128,
            duel_id: u128,
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
                // the residual balance is split between sacrifice pool + underware
                let mut residual_due: u128 = (fame_balance - values.fame_lost);
                values.survived = (residual_due >= FAME::ONE_LIFE);
                if (values.survived) {
                    residual_due = 0;
                } else {
                    // transfer to PoolType::Sacrifice, do not burn
                    let amount: u128 = MathTrait::percentage(residual_due, FAME::SACRIFICE_PERCENTAGE);
                    (*bank_protected_dispatcher).duelist_lost_fame_to_pool(starknet::get_contract_address(), duelist_id, amount, PoolType::Sacrifice);
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
                    (*bank_protected_dispatcher).duelist_lost_fame_to_pool(starknet::get_contract_address(), duelist_id, amount, *distribution.pool_id);
                    distribution_due -= amount;
                }
                // release LORDS to tournament creator + burn
                if (*distribution.creator_percent != 0 && distribution.creator_address.is_non_zero()) {
                    let amount: u128 = MathTrait::percentage(distribution_total, *distribution.creator_percent);
                    release_bills.append(LordsReleaseBill {
                        reason: ReleaseReason::FameLostToCreator,
                        duelist_id,
                        recipient: *distribution.creator_address,
                        pegged_fame: amount,
                        pegged_lords: 0,
                        sponsored_lords: 0,
                    });
                    distribution_due -= amount;
                    total_to_burn += amount; // released, need to burn
                }
                // remaining FAME to underware
                let mut underware_due: u128 = residual_due + distribution_due;
                release_bills.append(LordsReleaseBill {
                    reason: ReleaseReason::FameLostToDeveloper,
                    duelist_id,
                    recipient: underware_address,
                    pegged_fame: underware_due,
                    pegged_lords: 0,
                    sponsored_lords: 0,
                });
                total_to_burn += underware_due; // released, need to burn
                //
                // release LORDS and burn FAME
                let season_id: u32 = match (*distribution.pool_id) {
                    PoolType::Season(season_id) => {season_id},
                    _ => {0},
                };
                values.lords_unlocked += (*bank_protected_dispatcher).release_lords_from_fame_to_be_burned(season_id, duel_id, release_bills.span());
                IFameCoinDispatcher{contract_address: *fame_protected_dispatcher.contract_address}
                    .burn_from_token(starknet::get_contract_address(), duelist_id, total_to_burn.into());
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
            let bank_dispatcher: IBankProtectedDispatcher = store.world.bank_protected_dispatcher();

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
            // 60% of one life goes to sacrifice pool
            let survived: bool = (fame_balance - due_amount) >= FAME::ONE_LIFE;
// println!("survived: {}", survived);
            if (!survived) {
                let amount: u128 = MathTrait::percentage(FAME::ONE_LIFE, FAME::SACRIFICE_PERCENTAGE);
                bank_dispatcher.duelist_lost_fame_to_pool(starknet::get_contract_address(), duelist_id, amount, PoolType::Sacrifice);
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
                reason: ReleaseReason::SacrificedToDeveloper,
                duelist_id,
                recipient: store.get_config_treasury_address(),
                pegged_fame: due_amount,
                pegged_lords: 0,
                sponsored_lords: 0,
            };
            bank_dispatcher.release_lords_from_fame_to_be_burned(0, 0, array![bill].span());
            fame_dispatcher.burn_from_token(starknet::get_contract_address(), duelist_id, due_amount.into());
// println!("remaining: {}", self._fame_balance(@fame_dispatcher, duelist_id));

            // update duelist timestamp
            store.set_duelist_timestamp_active(duelist_id, starknet::get_block_timestamp());
            
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
            let memorial = DuelistMemorial {
                duelist_id,
                player_address: self.owner_of(duelist_id.into()),
                cause_of_death,
                killed_by,
                fame_before_death,
                season_id: store.get_current_season_id(),
            };
            store.set_duelist_memorial(@memorial);
            // remove from stack
            let mut stack: PlayerDuelistStack = store.get_player_duelist_stack_from_id(memorial.player_address, duelist_id);
            stack.remove(duelist_id);
            store.set_player_duelist_stack(@stack);
            PlayerTrait::remove_alive_duelist(ref store, memorial.player_address, 1);
            // events
            Activity::DuelistDied.emit(ref store.world, memorial.player_address, duelist_id.into());
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
            if (from.is_non_zero()) {
                // remove from previous owner stack
                let mut store: Store = StoreTrait::new(self.world_default());
                let duelist_profile: DuelistProfile = store.get_duelist_profile(token_id.low);
                let mut stack: PlayerDuelistStack = store.get_player_duelist_stack(from, duelist_profile);
                // try to removed from stack...
                if (stack.remove(token_id.low)) {
                    // DUELIST IS ALIVE!
                    store.set_player_duelist_stack(@stack);
                    PlayerTrait::remove_alive_duelist(ref store, from, 1);
                    // append to new owner stack
                    // ps: `from` is zero when minting, added in mint_duelists()
                    if (to.is_non_zero()) {
                        let mut stack: PlayerDuelistStack = store.get_player_duelist_stack(to, duelist_profile);
                        stack.append(token_id.low);
                        store.set_player_duelist_stack(@stack);
                        PlayerTrait::append_alive_duelist(ref store, to, 1);
                    }
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
                description: "Pistols at Dawn Duelists",
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
            let duelist: DuelistValue = store.get_duelist_value(token_id.low);
            // let memorial: DuelistMemorialValue = store.get_duelist_memorial_value(token_id.low);
            // let is_memorized: bool = (memorial.cause_of_death == CauseOfDeath::Memorize);
            // TODO: use memorized player, FAME, season, cause_of_death
            let base_uri: ByteArray = self.erc721._base_uri();
            let owner: ContractAddress = self.owner_of(token_id);
            let assignment: DuelistAssignmentValue = store.get_duelist_assignment_value(token_id.low);
            let archetype: Archetype = duelist.totals.get_archetype();
            let duelist_image: ByteArray = duelist.duelist_profile.get_image_uri(base_uri.clone());
            let fame_balance: u128 = self._fame_balance(@store.world.fame_coin_dispatcher(), token_id.low);
            let lives: u128 = (fame_balance / FAME::ONE_LIFE);
            let fame_dispatcher: IFameCoinDispatcher = self.world_default().fame_coin_dispatcher();
            let tokenbound_address = fame_dispatcher.address_of_token(starknet::get_contract_address(), token_id.low);
            let mut stack: PlayerDuelistStack = store.get_player_duelist_stack(owner, duelist.duelist_profile);
            // Image
            let image: ByteArray = UrlImpl::new(format!("{}/api/pistols/duelist_token/{}/image", base_uri.clone(), token_id))
                .add("owner", format!("0x{:x}", owner), false)
                // .add("username", username, false)
                .add("honour", duelist.totals.get_honour(), false)
                .add("archetype", archetype.into(), false)
                .add("profile_type", duelist.duelist_profile.into(), false)
                .add("profile_id", duelist.duelist_profile.profile_id().to_string(), false)
                .add("total_duels", duelist.totals.total_duels.to_string(), false)
                .add("total_wins", duelist.totals.total_wins.to_string(), false)
                .add("total_losses", duelist.totals.total_losses.to_string(), false)
                .add("total_draws", duelist.totals.total_draws.to_string(), false)
                .add("fame", ETH(fame_balance.into()).low.to_string(), false)
                .add("lives", lives.to_string(), false)
                .add("duel_id", format!("0x{:x}", assignment.duel_id), false)
                .add("pass_id", format!("0x{:x}", assignment.pass_id), false)
                .add("timestamp_registered", format!("{}", duelist.timestamps.registered), false)
                .add("timestamp_active", format!("{}", duelist.timestamps.active), false)
                .add("level", format!("{}", stack.level), false)
                // .add("is_memorized", is_memorized.to_string(), false)
                // .add("tokenbound_address", format!("0x{:x}", tokenbound_address), false)
                .build();
            // Attributes
            let mut attributes: Array<Attribute> = array![
                Attribute {
                    key: "Name",
                    value: duelist.duelist_profile.name(),
                },
                Attribute {
                    key: "Honour",
                    value: duelist.totals.get_honour(),
                },
                Attribute {
                    key: "Archetype",
                    value: archetype.into(),
                },
                Attribute {
                    key: "Fame",
                    value: ETH(fame_balance.into()).low.to_string(),
                },
                Attribute {
                    key: "Lives",
                    value: lives.to_string(),
                },
                Attribute {
                    key: "Alive",
                    value: if (fame_balance != 0) {"Alive"} else {"Dead"},
                },
                Attribute {
                    key: "Level",
                    value: stack.level.to_string(),
                },
                Attribute {
                    key: "Total Duels",
                    value: duelist.totals.total_duels.to_string(),
                },
            ];
            if (duelist.totals.total_duels != 0) {
                attributes.append(Attribute {
                    key: "Total Wins",
                    value: duelist.totals.total_wins.to_string(),
                });
                attributes.append(Attribute {
                    key: "Total Losses",
                    value: duelist.totals.total_losses.to_string(),
                });
                attributes.append(Attribute {
                    key: "Total Draws",
                    value: duelist.totals.total_draws.to_string(),
                });
            }
            // metadata
            let mut additional_metadata: Array<Attribute> = array![
                Attribute {
                    key: "duelist_image",
                    value: duelist_image.clone(),
                },
                Attribute {
                    key: "tokenbound_address",
                    value: format!("0x{:x}", tokenbound_address),
                },
            ];
            // return the metadata to be rendered by the component
            // https://docs.opensea.io/docs/metadata-standards#metadata-structure
            let metadata = TokenMetadata {
                token_id,
                name: format!("{} #{}", duelist.duelist_profile.name(), token_id),
                description: format!("Pistols at Dawn Duelist #{}. https://pistols.gg", token_id),
                image: Option::Some(image),
                image_data: Option::None,
                external_url: Option::Some(METADATA::EXTERNAL_LINK()), // TODO: format external token link
                background_color: Option::Some("000000"),
                animation_url: Option::None,
                youtube_url: Option::None,
                attributes: Option::Some(attributes.span()),
                additional_metadata: Option::Some(additional_metadata.span()),
            };
            (Option::Some(metadata))
        }
    }
}
