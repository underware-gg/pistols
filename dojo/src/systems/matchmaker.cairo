use starknet::{ContractAddress};
use pistols::models::matches::{QueueId, QueueMode};

// Exposed to clients
#[starknet::interface]
pub trait IMatchMaker<TState> {
    fn match_make_me(ref self: TState, duelist_id: u128, queue_id: QueueId, queue_mode: QueueMode) -> u128;
    // admin/protected
    fn set_queue_size(ref self: TState, queue_id: QueueId, size: u8);
    fn set_queue_entry_token(ref self: TState, queue_id: QueueId, entry_token_address: ContractAddress, entry_token_amount: u128);
}

// Exposed to clients
#[starknet::interface]
pub trait IMatchMakerPublic<TState> {
    fn match_make_me(ref self: TState, duelist_id: u128, queue_id: QueueId, queue_mode: QueueMode) -> u128; //@description: Matches a player against each other
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
        duelist::{DuelistTrait},
        pact::{PactTrait},
        matches::{
            QueueId, QueueIdTrait, QueueMode,
            MatchQueue, MatchQueueTrait,
            MatchPlayer, MatchPlayerTrait,
            QueueInfo, QueueInfoTrait,
            MATCHMAKER,
        },
    };
    use pistols::types::{
        duelist_profile::{DuelistProfile, BotKey},
        constants::{CONST},
    };
    use pistols::interfaces::dns::{
        DnsTrait,
        IVrfProviderDispatcherTrait, Source,
        IDuelTokenProtectedDispatcherTrait,
        IDuelistTokenProtectedDispatcher, IDuelistTokenProtectedDispatcherTrait,
        IBotPlayerProtectedDispatcher, IBotPlayerProtectedDispatcherTrait,
        IAdminDispatcherTrait,
    };
    use pistols::libs::{
        store::{Store, StoreTrait},
    };
    use pistols::utils::{
        address::{ZERO, ContractAddressDisplay, ContractAddressIntoU256},
    };

    pub mod Errors {
        pub const CALLER_NOT_ADMIN: felt252     = 'MATCHMAKER: Caller not admin';
        pub const INVALID_QUEUE: felt252        = 'MATCHMAKER: Invalid queue';
        pub const INVALID_MODE: felt252         = 'MATCHMAKER: Invalid mode';
        pub const WRONG_QUEUE: felt252          = 'MATCHMAKER: Wrong queue';
        pub const INVALID_SIZE: felt252         = 'MATCHMAKER: Invalid size';
    }

    fn dojo_init(ref self: ContractState) {
        let mut store: Store = StoreTrait::new(self.world_default());
        store.set_match_queue(@MatchQueue {
            queue_id: QueueId::Unranked,
            slot_size: MATCHMAKER::INITIAL_SLOT_SIZE,
            players: array![],
            entry_token_address: ZERO(),
            entry_token_amount: 0,
        });
        store.set_match_queue(@MatchQueue {
            queue_id: QueueId::Ranked,
            slot_size: MATCHMAKER::INITIAL_SLOT_SIZE,
            players: array![],
            entry_token_address: store.world.fools_coin_address(),
            entry_token_amount: (5 * CONST::ETH_TO_WEI.low),
        });
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

        fn match_make_me(ref self: ContractState,
            mut duelist_id: u128,
            queue_id: QueueId,      // only used to enter queue, not to match
            queue_mode: QueueMode,  // only used to enter queue, can change to to match
        ) -> u128 {
            let mut store: Store = StoreTrait::new(self.world_default());

            // get player entry in queue
            let caller: ContractAddress = starknet::get_caller_address();
            let mut matching_player: MatchPlayer = store.get_match_player(caller);

            // player is already in a duel...
            if (matching_player.duel_id.is_non_zero()) {
                return (matching_player.duel_id);
            }

            // validate mode
            assert(queue_mode != QueueMode::Undefined, Errors::INVALID_MODE);
            
            // get the queue
            let mut queue: MatchQueue =
                // new player... (not in queue)
                if (matching_player.queue_info.slot.is_zero()) {
                    // validate and get queue
                    assert(queue_id != QueueId::Undefined, Errors::INVALID_QUEUE);
                    let mut queue: MatchQueue = store.get_match_queue(queue_id);
                    // Validate duelist
                    let duelist_dispatcher: IDuelistTokenProtectedDispatcher = store.world.duelist_token_protected_dispatcher();
                    duelist_id = (duelist_dispatcher.get_validated_active_duelist_id(caller, duelist_id, queue_id.get_lives_staked()));
                    store.enter_queue(duelist_id, queue_id);
                    // randomize slot
                    let seed: felt252 = store.vrf_dispatcher().consume_random(Source::Nonce(caller));
                    let slot: u8 = queue.assign_slot(@store, seed);
                    // enter queue
                    matching_player.enter_queue(
                        queue_id,
                        queue_mode,
                        slot,
                        duelist_id,
                    );
                    (queue)
                } else {
                    // already in queue, must ping to same queue...
                    assert(queue_id == matching_player.queue_id, Errors::WRONG_QUEUE);
                    // update queue mode (players can change)
                    matching_player.queue_info.queue_mode = queue_mode;
                    // get the player's queue, ignore input
                    (store.get_match_queue(matching_player.queue_id))
                };

            // match player...
            let duel_id: u128 =
                self._match(
                    ref store,
                    ref matching_player,
                    ref queue,
                );

            // update players
            store.set_match_queue(@queue);
            store.set_match_player(@matching_player);

            // return the created duel id (not zero)
            (duel_id)
        }
    }


    //-----------------------------------
    // Protected
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


    //------------------------------------
    // Internal calls
    //
    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn _assert_caller_is_admin(self: @ContractState) {
            let mut world = self.world_default();
            assert(world.admin_dispatcher().am_i_admin(starknet::get_caller_address()) == true, Errors::CALLER_NOT_ADMIN);
        }

        fn _match(ref self: ContractState,
            ref store: Store,
            ref matching_player: MatchPlayer,
            ref queue: MatchQueue,
        ) -> u128 {
            let mut matched_player_address: Option<ContractAddress> = Option::None;
            let mut expired_players: Array<ContractAddress> = array![];
            let player_position: Option<usize> = queue.player_position(@matching_player.player_address);

            // update ping timestamp
            let timestamp: u64 = starknet::get_block_timestamp();
            matching_player.queue_info.timestamp_ping = timestamp;

            // queue is not empty, try to match...
            if (queue.players.len().is_non_zero()) {
                // get all players in queue
                let players_info: Span<QueueInfo> = store.get_match_players_info_batch(queue.players.span()).span();

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
                            store.set_match_player_queue_info(candidate_address, candidate_info);
                            // mark for removal
                            expired_players.append(candidate_address);
                        }
                        // player has the same speed...
                        else if (candidate_info.queue_mode == matching_player.queue_info.queue_mode) {
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
                    let duel_type: DuelType = queue.queue_id.get_duel_type();
                    let mut keys: Array<(DuelType, u128)> = array![];
                    let mut i: usize = 0;
                    while (i < candidates.len()) {
                        let candidate_address: ContractAddress = *candidates[i];
                        keys.append((duel_type, PactTrait::make_pair(matching_player.player_address.into(), candidate_address.into())));
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

            //
            // MATCHED!!! create the duel...
            let duel_id: u128 = match matched_player_address {
                Option::Some(address) => {
                    // get matched player queue
                    let mut matched_player: MatchPlayer = store.get_match_player(address);
                    // create duel
                    let duel_id: u128 = self._create_duel(
                        @store,
                        queue.queue_id,
                        matching_player,
                        matched_player.player_address,
                        matched_player.duelist_id,
                    );
                    // update matched player
                    matched_player.enter_duel(duel_id);
                    store.set_match_player(@matched_player);
                    // remove from queue
                    queue.remove_player(@matched_player.player_address);

                    // return the duel created
                    (duel_id)
                },
                Option::None => {
                    // no matching player... if expired get an Imp!
                    (if (
                        matching_player.queue_info.expired || // was expired during other players matching
                        matching_player.queue_info.has_expired(timestamp) // in queue, and expired
                    ) {
                        // summon bot duelist
                        let bot_player_dispatcher: IBotPlayerProtectedDispatcher = store.world.bot_player_protected_dispatcher();
                        let bot_duelist_id: u128 = bot_player_dispatcher.summon_duelist(DuelistProfile::Bot(BotKey::Pro), queue.queue_id.get_lives_staked());
                        // Duel expects it to be in the queue
                        store.enter_queue(bot_duelist_id, queue.queue_id);
                        // create duel!
                        (self._create_duel(
                            @store,
                            queue.queue_id,
                            matching_player,
                            bot_player_dispatcher.contract_address,
                            bot_duelist_id,
                        ))
                    } else {
                        // no duel created
                        (0)
                    })
                },
            };

            // Matched!
            if (duel_id.is_non_zero()) {
                matching_player.enter_duel(duel_id);
                // remove from queue...
                if (player_position.is_some()) {
                    queue.remove_player(@matching_player.player_address);
                }
            }
            // player is new, add to queue...
            else if (player_position.is_none()) {
                queue.append_player(matching_player.player_address);
            }

            // remove expired players...
            loop {
                match expired_players.pop_front() {
                    Option::Some(address) => {
                        queue.remove_player(@address);
                    },
                    Option::None => { break; },
                };
            };

            // duel created
            (duel_id)
        }

        fn _create_duel(ref self: ContractState,
            store: @Store,
            queue_id: QueueId,
            matching_player: MatchPlayer,
            opponent_address: ContractAddress,
            opponent_duelist_id: u128,
        ) -> u128 {
            // create duel
            let mut duel_id: u128 = store.world.duel_token_protected_dispatcher().match_make(
                matching_player.player_address,
                matching_player.duelist_id,
                opponent_address,
                opponent_duelist_id,
                queue_id,
                matching_player.queue_info.queue_mode,
            );
            // return the duel created
            (duel_id)
        }
    }

}
