use starknet::{ContractAddress};
use pistols::models::match_queue::{QueueId, QueueMode};

// Exposed to clients
#[starknet::interface]
pub trait IMatchMaker<TState> {
    // IMatchMakerPublic
    fn get_entry_fee(self: @TState, queue_id: QueueId) -> (ContractAddress, u128);
    fn enlist_duelist(ref self: TState, duelist_id: u128, queue_id: QueueId) -> u128;
    fn match_make_me(ref self: TState, duelist_id: u128, queue_id: QueueId, queue_mode: QueueMode) -> u128;
    // IMatchMakerProtected
    fn set_queue_size(ref self: TState, queue_id: QueueId, size: u8);
    fn set_queue_entry_token(ref self: TState, queue_id: QueueId, entry_token_address: ContractAddress, entry_token_amount: u128);
    fn clear_queue(ref self: TState, queue_id: QueueId);
    fn clear_player_queue(ref self: TState, queue_id: QueueId, player_address: ContractAddress);
}

// Exposed to clients
#[starknet::interface]
pub trait IMatchMakerPublic<TState> {
    fn enlist_duelist(ref self: TState, duelist_id: u128, queue_id: QueueId) -> u128; //@description: Enlist a Duelist in a ranked queue
    fn match_make_me(ref self: TState, duelist_id: u128, queue_id: QueueId, queue_mode: QueueMode) -> u128; //@description: Match a player against another player
    // view functions
    fn get_entry_fee(self: @TState, queue_id: QueueId) -> (ContractAddress, u128);
}

// Exposed to world
#[starknet::interface]
pub trait IMatchMakerProtected<TState> {
    fn set_queue_size(ref self: TState, queue_id: QueueId, size: u8);
    fn set_queue_entry_token(ref self: TState, queue_id: QueueId, entry_token_address: ContractAddress, entry_token_amount: u128);
    fn close_season(ref self: TState, queue_id: QueueId);
    fn clear_queue(ref self: TState, queue_id: QueueId);
    fn clear_player_queue(ref self: TState, queue_id: QueueId, player_address: ContractAddress);
}

#[dojo::contract]
pub mod matchmaker {
    use core::num::traits::Zero;
    use starknet::{ContractAddress};
    use dojo::world::{WorldStorage};

    use pistols::models::{
        challenge::{DuelType},
        duelist::{DuelistAssignmentTrait, CauseOfDeath},
        pact::{PactTrait},
        match_queue::{
            QueueId, QueueIdTrait, QueueMode,
            MatchQueue, MatchQueueTrait,
            MatchPlayer, MatchPlayerTrait,
            QueueInfo, QueueInfoTrait,
        },
        events::{Activity, ActivityTrait},
        season::{SeasonConfigTrait},
    };
    use pistols::types::{
        duelist_profile::{DuelistProfile, DuelistProfileTrait, BotKey},
    };
    use pistols::interfaces::dns::{
        DnsTrait,
        IVrfProviderDispatcherTrait, Source,
        IDuelTokenProtectedDispatcherTrait,
        IDuelistTokenProtectedDispatcher, IDuelistTokenProtectedDispatcherTrait,
        IBotPlayerProtectedDispatcher, IBotPlayerProtectedDispatcherTrait,
        IAdminDispatcherTrait,
    };
    use pistols::interfaces::ierc20::{IErc20Trait};
    use pistols::libs::{
        store::{Store, StoreTrait},
    };
    use pistols::utils::{
        address::{ContractAddressDisplay, ContractAddressIntoU256},
    };

    pub mod Errors {
        pub const CALLER_NOT_ADMIN: felt252         = 'MATCHMAKER: Caller not admin';
        pub const INVALID_CALLER: felt252           = 'MATCHMAKER: Invalid caller';
        pub const INVALID_QUEUE: felt252            = 'MATCHMAKER: Invalid queue';
        pub const INVALID_MODE: felt252             = 'MATCHMAKER: Invalid mode';
        pub const INVALID_DUELIST: felt252          = 'MATCHMAKER: Invalid duelist';
        pub const DUELIST_UNAVAILABLE: felt252      = 'MATCHMAKER: Duelist unavailable';
        pub const ENLISTMENT_NOT_REQUIRED: felt252  = 'MATCHMAKER: Not required';
        pub const INELIGIBLE_DUELIST: felt252       = 'MATCHMAKER: Ineligible duelist';
        pub const NOT_A_NEW_DUELIST: felt252        = 'MATCHMAKER: Not a new duelist';
        pub const NOT_ENLISTED: felt252             = 'MATCHMAKER: Not enlisted';
        pub const INVALID_SIZE: felt252             = 'MATCHMAKER: Invalid size';
        pub const UNFINISHED_IMP_DUEL: felt252      = 'MATCHMAKER: Unfinished Imp duel';
    }

    fn dojo_init(ref self: ContractState) {
        let mut store: Store = StoreTrait::new(self.world_default());
        MatchQueueTrait::initialize(ref store);
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
    impl MatchMakerPublicImpl of super::IMatchMakerPublic<ContractState> {

        fn get_entry_fee(self: @ContractState, queue_id: QueueId) -> (ContractAddress, u128) {
            assert(queue_id != QueueId::Undefined, Errors::INVALID_QUEUE);
            let store: Store = StoreTrait::new(self.world_default());
            let queue: MatchQueue = store.get_match_queue(queue_id);
            (queue.entry_token_address, queue.entry_token_amount)
        }

        fn enlist_duelist(ref self: ContractState,
            mut duelist_id: u128,
            queue_id: QueueId,
        ) -> u128 {
            let mut store: Store = StoreTrait::new(self.world_default());

            // validate queue
            assert(queue_id.permanent_enlistment(), Errors::ENLISTMENT_NOT_REQUIRED);

            // No starter duelists...
            let duelist_profile: DuelistProfile = store.get_duelist_profile(duelist_id);
            assert(!duelist_profile.is_starter_duelist(), Errors::INELIGIBLE_DUELIST);

            // Validate duelist
            let caller: ContractAddress = starknet::get_caller_address();
            let duelist_dispatcher: IDuelistTokenProtectedDispatcher = store.world.duelist_token_protected_dispatcher();
            duelist_id = (duelist_dispatcher.get_validated_active_duelist_id(caller, duelist_id, queue_id.get_lives_staked()));
            assert(duelist_id > 0, Errors::INVALID_DUELIST);

            // must be a fresh duelist (3K FAME)
            assert(store.get_duelist_totals(duelist_id).total_duels == 0, Errors::NOT_A_NEW_DUELIST);
            
            //----------------------------------
            // can enlist...

            // assign Duelist to queue (permanent)
            // will panic if already enlisted or not in another duel
            store.enlist_matchmaking(duelist_id, queue_id);

            // charge entry fee, if any...
            let mut queue: MatchQueue = store.get_match_queue(queue_id);
            IErc20Trait::asserted_transfer_from_to(
                caller,
                starknet::get_contract_address(),
                queue.entry_token_address,
                queue.entry_token_amount,
            );

            // de-peg FAME to season pool
            duelist_dispatcher.depeg_fame_to_season_pool(duelist_id);

            // add to enlisted duelist ids
            queue.enlisted_duelist_ids.append(duelist_id);
            store.set_match_queue(@queue);

            Activity::EnlistedRankedDuelist.emit(ref store.world, caller, duelist_id.into());

            // return the enlisted duelist id
            (duelist_id)
        }

        fn match_make_me(ref self: ContractState,
            mut duelist_id: u128,
            queue_id: QueueId,      // only used to enter queue, not to match
            queue_mode: QueueMode,  // only used to enter queue, can change to to match
        ) -> u128 {
            let mut store: Store = StoreTrait::new(self.world_default());

            // validate and get queue
            // Ranked: any mode is permitted
            // Unranked: only Slow mode
            assert(queue_id != QueueId::Undefined && !(queue_id == QueueId::Unranked && queue_mode == QueueMode::Fast), Errors::INVALID_QUEUE);
            
            // get player entry in queue
            let caller: ContractAddress = starknet::get_caller_address();
            let mut matching_player: MatchPlayer = store.get_match_player(caller, queue_id);

            // get the queue
            let mut queue: MatchQueue = store.get_match_queue(queue_id);

            // consume VRF always to avoid not consumed error
            // (will be discarded if not required)
            let seed: felt252 = store.vrf_dispatcher().consume_random(Source::Nonce(caller));

            //----------------------------------
            // new player... (not in queue)
            //
            if (matching_player.queue_info.slot.is_zero()) {
                // validate mode
                assert(queue_mode != QueueMode::Undefined, Errors::INVALID_MODE);
                // Validate duelist and set a slot
                let (duelist_id, slot): (u128, u8) = self._validate_and_randomize_slot(ref store, @queue, caller, duelist_id, seed);
                // enter queue
                matching_player.enter_queue(
                    queue_mode,
                    duelist_id,
                    0,
                    slot,
                );
                self._emit_duelist_matchmaking(ref store, caller, duelist_id, queue_id);
            }
            //----------------------------------
            // player ping...
            //
            // >> adding a new duelist to the stack...
            else if (duelist_id != matching_player.duelist_id) {
                // can stack duelists in SLOW mode only
                assert(queue_mode == QueueMode::Slow, Errors::INVALID_MODE);
                // avoiding stacking the same duelist twice
                if (!matching_player.is_duelist_stacked(duelist_id)) {
                    // Validate duelist and set a slot
                    let (duelist_id, slot): (u128, u8) = self._validate_and_randomize_slot(ref store, @queue, caller, duelist_id, seed);
                    // save it for later...
                    matching_player.stack_duelist(
                        duelist_id,
                        slot,
                    );
                    // save and return
                    store.set_match_player(@matching_player);
                    // events...
                    self._emit_duelist_matchmaking(ref store, caller, duelist_id, queue_id);
                }
                return (0);
            }
            //
            // >> switching from SLOW to FAST mode...
            // validate input mode
            else if (queue_mode != matching_player.queue_info.queue_mode) {
                assert(matching_player.queue_info.queue_mode == QueueMode::Slow && queue_mode == QueueMode::Fast, Errors::INVALID_MODE);
                // re-enter queue with new speed
                matching_player.enter_queue(
                    queue_mode,
                    matching_player.duelist_id,
                    matching_player.duel_id,
                    matching_player.queue_info.slot,
                );
            }
            //
            // >>> pinging with duelist currently in queue...
            else if (!matching_player.queue_info.expired) {
                // check if expired
                matching_player.queue_info.expired = matching_player.queue_info.has_expired(starknet::get_block_timestamp());
            }

            //----------------------------------
            // match player...
            //
            let matched_duel_id: u128 =
                //
                // match the queue only once
                if (matching_player.queue_info.timestamp_ping.is_zero()) {
                    // return the duel, if matched
                    (self._match_or_enqueue(
                        ref store,
                        ref queue,
                        ref matching_player,
                    ))
                }
                //
                // expired, match with an imp
                else if (matching_player.queue_info.expired) {
                    // create duel
                    let duel_id: u128 = self._start_match_with_imp(ref store, ref matching_player, queue_id);
                    // assert(duel_id.is_non_zero(), Errors::UNFINISHED_IMP_DUEL);
                    // unstack duelist, if available
                    if (duel_id.is_non_zero()) {
                        let stay_in_queue: bool = matching_player.unstack_duelist_or_clear();
                        queue.resolve_player(@matching_player.player_address, stay_in_queue);
                    }
                    // return the duel_id
                    (duel_id)
                }
                //
                // do nothing
                else {(0)};

            // save queue and player state
            store.set_match_queue(@queue);
            store.set_match_player(@matching_player);

            // return the created duel id (never zero)
            (matched_duel_id)
        }
    }


    //------------------------------------
    // Internal calls
    //
    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn _assert_caller_is_admin(self: @ContractState) {
            let mut world: WorldStorage = self.world_default();
            assert(world.admin_dispatcher().am_i_admin(starknet::get_caller_address()), Errors::CALLER_NOT_ADMIN);
        }

        fn _emit_duelist_matchmaking(ref self: ContractState,
            ref store: Store,
            caller: ContractAddress,
            duelist_id: u128,
            queue_id: QueueId,
        ) {
            match queue_id {
                QueueId::Ranked => {
                    Activity::DuelistMatchingRanked.emit(ref store.world, caller, duelist_id.into());
                },
                QueueId::Unranked => {
                    Activity::DuelistMatchingUnranked.emit(ref store.world, caller, duelist_id.into());
                },
                QueueId::Undefined => {},
            }
        }

        fn _validate_and_randomize_slot(ref self: ContractState,
            ref store: Store,
            queue: @MatchQueue,
            caller: ContractAddress,
            mut duelist_id: u128,
            seed: felt252,
        ) -> (u128, u8) {
            // Validate duelist
            let duelist_dispatcher: IDuelistTokenProtectedDispatcher = store.world.duelist_token_protected_dispatcher();
            duelist_id = (duelist_dispatcher.get_validated_active_duelist_id(caller, duelist_id, (*queue.queue_id).get_lives_staked()));
            assert(duelist_id > 0, Errors::INVALID_DUELIST);
            // verify enlistment
            if (queue.queue_id.permanent_enlistment()) {
                assert(store.is_enlisted_matchmaking(duelist_id, *queue.queue_id), Errors::NOT_ENLISTED);
                assert(store.is_available_for(duelist_id, Option::Some(*queue.queue_id)), Errors::DUELIST_UNAVAILABLE);
            } else {
                assert(store.is_available_for(duelist_id, Option::Some(*queue.queue_id)), Errors::DUELIST_UNAVAILABLE);
                store.enlist_matchmaking(duelist_id, *queue.queue_id);
            }
            // randomize slot...
            let slot: u8 = queue.assign_slot(@store, seed);
            // return validated duelist and slot
            (duelist_id, slot)
        }

        fn _match_or_enqueue(ref self: ContractState,
            ref store: Store,
            ref queue: MatchQueue,
            ref matching_player: MatchPlayer,
        ) -> u128 {
            let mut matched_player_address: Option<ContractAddress> = Option::None;
            let mut expired_players: Array<ContractAddress> = array![];
            let duel_type: DuelType = queue.queue_id.into();

            // update ping timestamp
            // ensures duelist can match the queue only once
            let timestamp: u64 = starknet::get_block_timestamp();
            matching_player.queue_info.timestamp_ping = timestamp;

            // queue is not empty, try to match if...
// println!("queue.players.len(): {}", queue.players.len());
            if (queue.players.len() > 0) {
                // get all players in queue
                let mut keys: Array<(ContractAddress, QueueId)> = array![];
                for i in 0..queue.players.len() {
                    keys.append((*queue.players[i], queue.queue_id),);
                }
                let players_info: Span<QueueInfo> = store.get_match_players_info_batch(keys.span()).span();

                // compose slot with queue size
                let player_slot: u8 = matching_player.queue_info.slot + players_info.len().try_into().unwrap();

                //----------------------------------
                // find candidates in queue
                //
                let mut candidates: Array<ContractAddress> = array![];
                for i in 0..players_info.len() {
                    let candidate_address: ContractAddress = *queue.players[i];
                    // skip if self...
                    if (candidate_address == matching_player.player_address) {
                        continue;
                    }
                    // get candidate queue info
                    let mut candidate_info: QueueInfo = *players_info[i];
                    // expired player, need to be removed...
                    if (candidate_info.has_expired(timestamp)) {
                        // expire player
                        candidate_info.expired = true;
                        store.set_match_player_queue_info(candidate_address, queue.queue_id, candidate_info);
                        // mark for removal
                        expired_players.append(candidate_address);
                        // try next...
                        continue;
                    }
                    // skip if not same speed...
                    if (candidate_info.queue_mode != matching_player.queue_info.queue_mode) {
                        continue;
                    }
                    // skip if have pact...
                    if (store.get_has_pact(duel_type, matching_player.player_address.into(), candidate_address.into())) {
                        continue;
                    }
                    // skip if both have a minted duel...
                    if (matching_player.queue_info.has_minted_duel && candidate_info.has_minted_duel) {
                        continue;
                    }
                    // >>> valid candidate! 
                    // compare slots...
// println!("slots... {} < {}", candidate_info.slot, player_slot);
                    if (candidate_info.slot < player_slot) {
                        candidates.append(candidate_address);
                    }
                }
                
                // choose a candidate, if any
                if (candidates.len() == 1) {
                    matched_player_address = Option::Some(*candidates[0]);
                } else if (candidates.len() > 1) {
                    // tie breaker is number of duels between player and candidates
                    // get duel count batch...
                    let mut keys: Array<(DuelType, u128)> = array![];
                    for i in 0..candidates.len() {
                        keys.append((duel_type, PactTrait::make_pair(matching_player.player_address.into(), (*candidates[i]).into())));
                    }
                    let duel_counts: Span<u32> = store.get_pacts_duel_counts_batch(keys.span()).span();
                    // choose the candidate with the least duels
                    let mut candidate_index: usize = 0;
                    for i in 1..candidates.len() {
                        if (duel_counts[i] < duel_counts[candidate_index]) {
                            candidate_index = i;
                        }
                    }
                    matched_player_address = Option::Some(*candidates[candidate_index]);
                }
            }

            // check if matched...
            let matched_duel_id: u128 = match matched_player_address {
                Option::Some(matched_player_address) => {
                    //----------------------------------
                    // MATCHED!!!
                    //
                    let mut matched_player: MatchPlayer = store.get_match_player(matched_player_address, queue.queue_id);
                    let duel_id: u128 = self._start_match(ref store, ref matching_player, ref matched_player, queue.queue_id);
                    // Resolve matched player
// println!("matched!!");
                    // unstack next duelist, if any
                    let stay_in_queue: bool = matched_player.unstack_duelist_or_clear();
                    queue.resolve_player(@matched_player.player_address, stay_in_queue);
                    store.set_match_player(@matched_player);
                    //
                    // Resolve matching player
                    let stay_in_queue: bool = matching_player.unstack_duelist_or_clear();
                    queue.resolve_player(@matching_player.player_address, stay_in_queue);
                    // return the matched duel
// println!("_start_match...");
                    (duel_id)
                },
                Option::None => {
                    //----------------------------------
                    // NO MATCH!!!
                    //
                    // player is new, add to queue...
// println!("not matched!!");
                    queue.resolve_player(@matching_player.player_address, true);
                    // new SLOW players must have a duel created to be able to pre-commit
                    if (matching_player.queue_info.queue_mode == QueueMode::Slow) {
                        self._mint_match_to_player(ref store, ref matching_player, @queue.queue_id);
                    }
                    // not matched
                    (0)
                },
            };

            // remove expired players...
            loop {
                match expired_players.pop_front() {
                    Option::Some(address) => {
                        queue.remove_player(@address);
                    },
                    Option::None => { break; }, // end of queue
                };
            };

            // duel matched
            (matched_duel_id)
        }

        fn _mint_match_to_player(ref self: ContractState,
            ref store: Store,
            ref matching_player: MatchPlayer,
            queue_id: @QueueId,
        ) -> u128 {
            if (!matching_player.queue_info.has_minted_duel) {
                matching_player.duel_id = store.world.duel_token_protected_dispatcher().create_match(
                    matching_player.player_address,
                    matching_player.duelist_id,
                    *queue_id,
                );
                matching_player.queue_info.has_minted_duel = true;
            }
            (matching_player.duel_id)
        }

        fn _start_match(ref self: ContractState,
            ref store: Store,
            ref matching_player: MatchPlayer,
            ref matched_player: MatchPlayer,
            queue_id: QueueId,
        ) -> u128 {
            let duel_id: u128 = if (matching_player.queue_info.has_minted_duel) {
                // was-SLOW player matching a FAST player
                // (use pre-minted duel)
// println!("start_match... 1 matched_player.duelist_id: {}", matched_player.duelist_id);
                store.world.duel_token_protected_dispatcher().start_match(
                    // matched player duel
                    matching_player.duel_id,
                    // against matching player
                    matched_player.player_address,
                    matched_player.duelist_id,
                    queue_id,
                    matched_player.queue_info.queue_mode,
                );
                (matching_player.duel_id)
            } else {
                // new SLOW player matching existing SLOW player (duel exists)
                // new FAST player matching existing FAST player (mint duel)
// println!("mint... 2");
                self._mint_match_to_player(ref store, ref matched_player, @queue_id);
// println!("start_match... 2 matching_player.duelist_id: {}", matching_player.duelist_id);
                store.world.duel_token_protected_dispatcher().start_match(
                    // matched player duel
                    matched_player.duel_id,
                    // against matching player
                    matching_player.player_address,
                    matching_player.duelist_id,
                    queue_id,
                    matching_player.queue_info.queue_mode,
                );
                (matched_player.duel_id)
            };
            (duel_id)
        }

        fn _start_match_with_imp(ref self: ContractState,
            ref store: Store,
            ref matching_player: MatchPlayer,
            queue_id: QueueId,
        ) -> u128 {
            // dont match if has a pact
            let bot_player_dispatcher: IBotPlayerProtectedDispatcher = store.world.bot_player_protected_dispatcher();
            if (store.get_has_pact(queue_id.into(), matching_player.player_address.into(), bot_player_dispatcher.contract_address.into())) {
                return (0);
            }
            // summon bot duelist
            let bot_duelist_id: u128 = bot_player_dispatcher.summon_bot_duelist(DuelistProfile::Bot(BotKey::Pro), queue_id);
            // Duel expects the bot duelist to be in the queue
            if (!queue_id.permanent_enlistment()) {
                store.enlist_matchmaking(bot_duelist_id, queue_id);
            }
            // mint duel if needed
            self._mint_match_to_player(ref store, ref matching_player, @queue_id);
            // start duel with an imp!
            store.world.duel_token_protected_dispatcher().start_match(
                matching_player.duel_id,
                bot_player_dispatcher.contract_address,
                bot_duelist_id,
                queue_id,
                matching_player.queue_info.queue_mode,
            );
            (matching_player.duel_id)
        }

        //------------------------------------
        // cleanup
        //

        fn _clear_season(ref self: ContractState, ref store: Store, ref queue: MatchQueue, season_ended: bool) {
            for player in queue.players {
                let mut match_player: MatchPlayer = store.get_match_player(player, queue.queue_id);
                self._clear_player_queue(ref store, queue.queue_id, ref match_player, season_ended);
            }
            queue.players = array![];
        }

        fn _clear_player_queue(ref self: ContractState, ref store: Store, queue_id: QueueId, ref match_player: MatchPlayer, season_ended: bool) {
            for next_duelist in match_player.next_duelists.clone() {
                DuelistAssignmentTrait::unassign_challenge(ref store, next_duelist.duelist_id);
            }
            // unassign main duelist
            if (match_player.duelist_id.is_non_zero()) {
                DuelistAssignmentTrait::unassign_challenge(ref store, match_player.duelist_id);
            }
            // if has a duel, wipe it...
            if (match_player.duel_id.is_non_zero() && !season_ended) {
                // has a duel, wipe it...
                // (if season ended, the duel will be expired)
                store.world.duel_token_protected_dispatcher().wipe_duel(match_player.duel_id);
            }
            store.delete_match_player(@match_player);
        }
    }


    //-----------------------------------
    // Protected / admin
    //
    #[abi(embed_v0)]
    impl MatchMakerProtectedImpl of super::IMatchMakerProtected<ContractState> {
        fn set_queue_size(ref self: ContractState,
            queue_id: QueueId,
            size: u8,
        ) {
            self._assert_caller_is_admin();
            assert(queue_id != QueueId::Undefined, Errors::INVALID_QUEUE);
            assert(size > 0, Errors::INVALID_SIZE);
            let mut store: Store = StoreTrait::new(self.world_default());
            let mut queue: MatchQueue = store.get_match_queue(queue_id);
            queue.slot_size = size;
            store.set_match_queue(@queue);
        }

        fn set_queue_entry_token(ref self: ContractState,
            queue_id: QueueId,
            entry_token_address: ContractAddress,
            entry_token_amount: u128,
        ) {
            self._assert_caller_is_admin();
            assert(queue_id != QueueId::Undefined, Errors::INVALID_QUEUE);
            let mut store: Store = StoreTrait::new(self.world_default());
            let mut queue: MatchQueue = store.get_match_queue(queue_id);
            queue.entry_token_address = entry_token_address;
            queue.entry_token_amount = entry_token_amount;
            store.set_match_queue(@queue);
        }

        // called by collect_season()
        fn close_season(ref self: ContractState, queue_id: QueueId) {
            // validate caller
            let mut store: Store = StoreTrait::new(self.world_default());
            assert(store.world.caller_is_world_contract(), Errors::INVALID_CALLER);
            //
            // memorialize duelists
            let mut queue: MatchQueue = store.get_match_queue(queue_id);
            store.world.duelist_token_protected_dispatcher().memorialize_duelists(queue.enlisted_duelist_ids, CauseOfDeath::Ranked);
            queue.enlisted_duelist_ids = array![];
            //
            // clear the queue
            self._clear_season(ref store, ref queue, true);
            store.set_match_queue(@queue);
        }

        fn clear_queue(ref self: ContractState, queue_id: QueueId) {
            self._assert_caller_is_admin();
            assert(queue_id != QueueId::Undefined, Errors::INVALID_QUEUE);
            let mut store: Store = StoreTrait::new(self.world_default());
            //
            // clear the queue
            let mut queue: MatchQueue = store.get_match_queue(queue_id);
            let season_ended: bool = store.get_current_season().can_collect();
            self._clear_season(ref store, ref queue, season_ended);
            store.set_match_queue(@queue);
        }

        fn clear_player_queue(ref self: ContractState, queue_id: QueueId, player_address: ContractAddress) {
            self._assert_caller_is_admin();
            assert(queue_id != QueueId::Undefined, Errors::INVALID_QUEUE);
            let mut store: Store = StoreTrait::new(self.world_default());
            //
            // remove from queue...
            let mut queue: MatchQueue = store.get_match_queue(queue_id);
            queue.resolve_player(@player_address, false);
            store.set_match_queue(@queue);
            //
            // clear player
            let mut match_player: MatchPlayer = store.get_match_player(player_address, queue_id);
            let season_ended: bool = store.get_current_season().can_collect();
            self._clear_player_queue(ref store, queue_id, ref match_player, season_ended);
        }
    }

}
