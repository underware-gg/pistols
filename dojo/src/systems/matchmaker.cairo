use starknet::{ContractAddress};
use pistols::models::matches::{QueueId, QueueMode};

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
}

#[dojo::contract]
pub mod matchmaker {
    use core::num::traits::Zero;
    use starknet::{ContractAddress};
    use dojo::world::{WorldStorage};

    use pistols::models::{
        challenge::{DuelType},
        duelist::{DuelistAssignmentTrait},
        pact::{PactTrait},
        matches::{
            QueueId, QueueIdTrait, QueueMode,
            MatchQueue, MatchQueueTrait,
            MatchPlayer, MatchPlayerTrait,
            QueueInfo, QueueInfoTrait,
        },
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
        pub const INVALID_QUEUE: felt252            = 'MATCHMAKER: Invalid queue';
        pub const INVALID_MODE: felt252             = 'MATCHMAKER: Invalid mode';
        pub const INVALID_DUELIST: felt252          = 'MATCHMAKER: Invalid duelist';
        pub const ENLISTMENT_NOT_REQUIRED: felt252  = 'MATCHMAKER: Not required';
        pub const INELIGIBLE_DUELIST: felt252       = 'MATCHMAKER: Ineligible duelist';
        pub const NOT_ENLISTED: felt252             = 'MATCHMAKER: Not enlisted';
        pub const INVALID_SIZE: felt252             = 'MATCHMAKER: Invalid size';
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
            let queue: MatchQueue = store.get_match_queue(queue_id);
            assert(queue.requires_enlistment(), Errors::ENLISTMENT_NOT_REQUIRED);

            // Validate duelist
            let caller: ContractAddress = starknet::get_caller_address();
            let duelist_dispatcher: IDuelistTokenProtectedDispatcher = store.world.duelist_token_protected_dispatcher();
            duelist_id = (duelist_dispatcher.get_validated_active_duelist_id(caller, duelist_id, queue_id.get_lives_staked()));
            assert(duelist_id > 0, Errors::INVALID_DUELIST);

            // No starter duelists...
            let duelist_profile: DuelistProfile = store.get_duelist_profile(duelist_id);
            assert(!duelist_profile.is_starter_duelist(), Errors::INELIGIBLE_DUELIST);

            // assign queue
            // will panic if already enlisted or not in another duel
            store.enlist_matchmaking(duelist_id, queue_id);

            // charge entry fee, if any...
            IErc20Trait::asserted_transfer_from_to(
                caller,
                starknet::get_contract_address(),
                queue.entry_token_address,
                queue.entry_token_amount,
            );

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

            //----------------------------------
            // new player... (not in queue)
            //
            if (matching_player.queue_info.slot.is_zero()) {
                // validate mode
                assert(queue_mode != QueueMode::Undefined, Errors::INVALID_MODE);
                // Validate duelist and set a slot
                let (duelist_id, slot): (u128, u8) = self._validate_and_randomize_slot(ref store, @queue, caller, duelist_id);
                // enter queue
                matching_player.enter_queue(
                    queue_mode,
                    duelist_id,
                    0,
                    slot,
                );
            } else {
                //----------------------------------
                // player ping...
                //
                // validate input duelist
                if (duelist_id != matching_player.duelist_id) {
                    // can stack duelists in SLOW mode only
                    assert(queue_mode == QueueMode::Slow, Errors::INVALID_MODE);
                    // Validate duelist and set a slot
                    let (duelist_id, slot): (u128, u8) = self._validate_and_randomize_slot(ref store, @queue, caller, duelist_id);
                    // save it for later...
                    matching_player.stack_duelist(
                        duelist_id,
                        slot,
                    );
                    // save and return
                    store.set_match_player(@matching_player);
                    return (0);
                }
                // validate input mode
                // can switch from SLOW to FAST only...
                else if (queue_mode != matching_player.queue_info.queue_mode) {
                    assert(matching_player.queue_info.queue_mode == QueueMode::Slow && queue_mode == QueueMode::Fast, Errors::INVALID_MODE);
                    // re-enter queue with new speed
                    matching_player.enter_queue(
                        queue_mode,
                        matching_player.duelist_id,
                        matching_player.duel_id,
                        matching_player.queue_info.slot,
                    );
                } else {
                    matching_player.queue_info.expired = matching_player.queue_info.expired || matching_player.queue_info.has_expired(starknet::get_block_timestamp());
                }
            };

            // match player...
            let matched_duel_id: u128 =
                if (matching_player.queue_info.timestamp_ping.is_zero() || matching_player.queue_info.expired) {
                    (self._match_or_enqueue(
                        ref store,
                        ref queue,
                        ref matching_player,
                    ))
                } else {(0)};

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
            let mut world = self.world_default();
            assert(world.admin_dispatcher().am_i_admin(starknet::get_caller_address()) == true, Errors::CALLER_NOT_ADMIN);
        }

        fn _validate_and_randomize_slot(ref self: ContractState,
            ref store: Store,
            queue: @MatchQueue,
            caller: ContractAddress,
            mut duelist_id: u128,
        ) -> (u128, u8) {
            // Validate duelist
            let duelist_dispatcher: IDuelistTokenProtectedDispatcher = store.world.duelist_token_protected_dispatcher();
            duelist_id = (duelist_dispatcher.get_validated_active_duelist_id(caller, duelist_id, (*queue.queue_id).get_lives_staked()));
            assert(duelist_id > 0, Errors::INVALID_DUELIST);
            // verify enlistment
            if (queue.requires_enlistment()) {
                assert(store.is_enlisted_matchmaking(duelist_id, *queue.queue_id), Errors::NOT_ENLISTED);
            } else {
                store.enlist_matchmaking(duelist_id, *queue.queue_id);
            }
            // randomize slot
            let seed: felt252 = store.vrf_dispatcher().consume_random(Source::Nonce(caller));
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
            let player_position: Option<usize> = queue.player_position(@matching_player.player_address);
            let duel_type: DuelType = queue.queue_id.into();

            // update ping timestamp
            let timestamp: u64 = starknet::get_block_timestamp();
            matching_player.queue_info.timestamp_ping = timestamp;
            // queue is not empty, try to match if...
            if (queue.players.len() > 0) {
                // get all players in queue
                let mut keys: Array<(ContractAddress, QueueId)> = array![];
                let mut i: usize = 0;
                while (i < queue.players.len()) {
                    keys.append((*queue.players[i], queue.queue_id),);
                    i += 1;
                };
                let players_info: Span<QueueInfo> = store.get_match_players_info_batch(keys.span()).span();

                let player_slot: u8 = matching_player.queue_info.slot + 
                    (match player_position {
                        // not in the queue yet
                        Option::None => {(players_info.len())},
                        // in the queue, compose slot with its position
                        Option::Some(position) => {(position)},
                    }).try_into().unwrap();

                // find candidates in queue
                let mut candidates: Array<ContractAddress> = array![];
                let mut i: usize = 0;
                while (i < players_info.len()) {
                    let candidate_address: ContractAddress = *queue.players[i];
                    if (candidate_address != matching_player.player_address) {
                        // get candidate queue info
                        let mut candidate_info: QueueInfo = *players_info[i];
                        // expired player, need to be removed...
                        if (candidate_info.has_expired(timestamp)) {
                            // expire player
                            candidate_info.expired = true;
                            store.set_match_player_queue_info(candidate_address, queue.queue_id, candidate_info);
                            // mark for removal
                            expired_players.append(candidate_address);
                        }
                        // validate candidate...
                        else if (
                            candidate_info.queue_mode == matching_player.queue_info.queue_mode && // players have the same speed
                            !store.get_has_pact(duel_type, matching_player.player_address.into(), candidate_address.into()) && // dont have a pact
                            !(matching_player.queue_info.has_minted_duel && candidate_info.has_minted_duel) // cant both have minted duel
                        ) {
                            // compare slots...
                            match player_position {
                                // player not in the queue yet
                                Option::None => {
                                    if (candidate_info.slot < player_slot) {
                                        candidates.append(candidate_address);
                                    }
                                },
                                // player already in the queue, running again....
                                Option::Some(position) => {
                                    if (
                                        // candidate is BEFORE the player
                                        (i < position && candidate_info.slot < player_slot) ||
                                        // candidate is AFTER the player
                                        (i > position && player_slot < (candidate_info.slot + i.try_into().unwrap()))
                                    ) {
                                        candidates.append(candidate_address);
                                    }
                                }, // in the queue, compose slot with its position
                            };
                        }
                    }
                    i += 1;
                };
                
                // choose a candidate, if any
                if (candidates.len() == 1) {
                    matched_player_address = Option::Some(*candidates[0]);
                } else if (candidates.len() > 1) {
                    // tie breaker is number of duels between player and candidates
                    // get duel count batch...
                    let mut keys: Array<(DuelType, u128)> = array![];
                    let mut i: usize = 0;
                    while (i < candidates.len()) {
                        keys.append((duel_type, PactTrait::make_pair(matching_player.player_address.into(), (*candidates[i]).into())));
                        i += 1;
                    };
                    let duel_counts: Span<u32> = store.get_pacts_duel_counts_batch(keys.span()).span();
                    // choose the candidate with the least duels
                    let mut candidate_index: usize = 0;
                    let mut i: usize = 1;
                    while (i < candidates.len()) {
                        if (duel_counts[i] < duel_counts[candidate_index]) {
                            candidate_index = i;
                        }
                        i += 1;
                    };
                    matched_player_address = Option::Some(*candidates[candidate_index]);
                }
            }

            // check if matched...
            let matched_duel_id: u128 = match matched_player_address {
                Option::Some(address) => {
                    //----------------------------------
                    // MATCHED!!!
                    //
                    // start duel...
                    let mut matched_player: MatchPlayer = store.get_match_player(address, queue.queue_id);
                    let duel_id: u128 = self._start_match(ref store, ref matching_player, ref matched_player, queue.queue_id);
                    // unstack next duelist, if any
                    let stay_in_queue: bool = matched_player.unstack_duelist_or_clear();
                    if (!stay_in_queue) {
                        queue.remove_player(@matched_player.player_address);
                    }
                    // save matched_player (matching_player is saved at the end)
                    store.set_match_player(@matched_player);
                    // return the matched duel
                    (duel_id)
                },
                Option::None => {
                    //----------------------------------
                    // NO MATCH!!!
                    //
                    // if expired match, an Imp!
                    (if (matching_player.queue_info.expired) {
                        (self._start_match_with_imp(ref store, ref matching_player, queue.queue_id))
                    } else {
                        // new SLOW players must have a duel created to be able to pre-commit
                        if (matching_player.queue_info.queue_mode == QueueMode::Slow) {
                            self._mint_match_to_player(ref store, ref matching_player, queue.queue_id);
                        }
                        // not matched
                        (0)
                    })
                },
            };

            // matched player...
            if (matched_duel_id > 0) {
                let stay_in_queue: bool = matching_player.unstack_duelist_or_clear();
                if (!stay_in_queue && player_position.is_some()) {
                    queue.remove_player(@matching_player.player_address);
                } else if (stay_in_queue && player_position.is_none()) {
                    queue.append_player(@matching_player.player_address);
                }
            }
            // player is new, add to queue...
            else if (player_position.is_none()) {
                queue.append_player(@matching_player.player_address);
            }

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
            queue_id: QueueId,
        ) -> u128 {
            if (!matching_player.queue_info.has_minted_duel) {
                matching_player.duel_id = store.world.duel_token_protected_dispatcher().create_match(
                    matching_player.player_address,
                    matching_player.duelist_id,
                    queue_id,
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
                self._mint_match_to_player(ref store, ref matched_player, queue_id);
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
            let bot_duelist_id: u128 = bot_player_dispatcher.summon_duelist(DuelistProfile::Bot(BotKey::Pro), queue_id.get_lives_staked());
            // Duel expects the bot duelist to be in the queue
            store.enlist_matchmaking(bot_duelist_id, queue_id);
            // mint duel if needed
            self._mint_match_to_player(ref store, ref matching_player, queue_id);
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
    }

}
