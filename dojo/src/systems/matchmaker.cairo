// use starknet::{ContractAddress};
use pistols::models::matches::{QueueId, QueueMode};

// Exposed to clients
#[starknet::interface]
pub trait IMatchMaker<TState> {
    fn match_make_me(ref self: TState, duelist_id: u128, queue_id: QueueId, queue_mode: QueueMode) -> u128;
    // fn ping_me(ref self: TState) -> u128;
}

#[dojo::contract]
pub mod matchmaker {
    use core::num::traits::Zero;
    use starknet::{ContractAddress};
    use dojo::world::{WorldStorage};

    use pistols::models::{
        matches::{
            QueueId, QueueIdTrait, QueueMode,
            MatchQueue, MatchQueueTrait,
            MatchPlayer, MatchPlayerTrait,
            QueueInfo, QueueInfoTrait,
        },
    };
    use pistols::types::{
        duelist_profile::{DuelistProfile, BotKey},
    };
    use pistols::interfaces::dns::{
        DnsTrait,
        IVrfProviderDispatcherTrait, Source,
        IDuelTokenProtectedDispatcherTrait,
        IBotPlayerProtectedDispatcher, IBotPlayerProtectedDispatcherTrait,
    };
    use pistols::libs::{
        store::{Store, StoreTrait},
    };
    // use pistols::utils::address::{ZERO};
    use pistols::utils::address::{ContractAddressDisplay};

    pub mod Errors {
        pub const INVALID_QUEUE: felt252        = 'MATCHMAKER: Invalid queue';
        pub const INVALID_MODE: felt252         = 'MATCHMAKER: Invalid mode';
    }

    fn dojo_init(ref self: ContractState) {
    }

    #[generate_trait]
    impl WorldDefaultImpl of WorldDefaultTrait {
        #[inline(always)]
        fn world_default(self: @ContractState) -> WorldStorage {
            (self.world(@"pistols"))
        }
    }

    #[abi(embed_v0)]
    impl MatchMakerImpl of super::IMatchMaker<ContractState> {

        fn match_make_me(ref self: ContractState,
            duelist_id: u128,
            queue_id: QueueId,      // only used to enter queue, not to match
            queue_mode: QueueMode,  // only used to enter queue, not to match
        ) -> u128 {
            let mut store: Store = StoreTrait::new(self.world_default());

            // get player entry in queue
            let caller: ContractAddress = starknet::get_caller_address();
            let mut matching_player: MatchPlayer = store.get_match_player(caller);

            // player is already in a duel...
            if (matching_player.duel_id.is_non_zero()) {
                return (matching_player.duel_id);
            }

            let mut queue: MatchQueue =
                // new player (not in queue)
                if (matching_player.queue_info.slot.is_zero()) {
                    // validate input and get the queue
                    assert(queue_id != QueueId::Undefined, Errors::INVALID_QUEUE);
                    assert(queue_mode != QueueMode::Undefined, Errors::INVALID_MODE);
                    let mut queue: MatchQueue = store.get_match_queue(queue_id);
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


    //------------------------------------
    // Internal calls
    //
    #[generate_trait]
    impl InternalImpl of InternalTrait {

        fn _match(ref self: ContractState,
            ref store: Store,
            ref matching_player: MatchPlayer,
            ref queue: MatchQueue,
        ) -> u128 {
            let mut matched_player_address: Option<ContractAddress> = Option::None;
            let mut expired_players: Array<ContractAddress> = array![];
            let mut player_is_in_queue: bool = false;

            // update ping timestamp
            let timestamp: u64 = starknet::get_block_timestamp();
            matching_player.queue_info.timestamp_ping = timestamp;

            // queue is not empty, try to match...
            if (queue.players.len().is_non_zero()) {
                // get all players in queue
                let players_info: Span<QueueInfo> = store.get_match_players_info(queue.players.span()).span();

                let mut candidates: Array<ContractAddress> = array![];
                let player_slot: u8 = matching_player.queue_info.slot + (players_info.len() & 0xff).try_into().unwrap();

                let mut i: usize = 0;
                while (i < players_info.len()) {
                    let candidate_address: ContractAddress = *queue.players[i];
                    if (candidate_address == matching_player.player_address) {
                        // player being matched
                        player_is_in_queue = true;
                    } else {
                        let mut queue_info: QueueInfo = *players_info[i];
// println!("____slot:{}<{}", queue_info.slot, player_slot);
                        // expired player, need to be removed...
                        if (queue_info.has_expired(timestamp)) {
                            // expire player
                            queue_info.expired = true;
                            store.set_match_player_queue_info(candidate_address, queue_info);
                            // mark for removal
                            expired_players.append(candidate_address);
                        }
                        // player is within slot...
                        else if (queue_info.slot < player_slot) {
                            candidates.append(candidate_address);
                        }
                    }
                    i += 1;
                };

// TODO: choose one player from all candidates within slot

                if (candidates.len().is_non_zero()) {
                    matched_player_address = Option::Some(*candidates[0]);
                }
            }

            // match player with another, create the duel...
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
                    // no tmatching player... if expired get an Imp!
                    (if (
                        matching_player.queue_info.expired || // was expired during other players matching
                        matching_player.queue_info.has_expired(timestamp) // in queue, and expired
                    ) {
                        let bot_player_dispatcher: IBotPlayerProtectedDispatcher = store.world.bot_player_protected_dispatcher();
                        (self._create_duel(
                            @store,
                            queue.queue_id,
                            matching_player,
                            bot_player_dispatcher.contract_address,
                            bot_player_dispatcher.summon_duelist(DuelistProfile::Bot(BotKey::Pro), queue.queue_id.get_lives_staked()),
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
                if (player_is_in_queue) {
                    queue.remove_player(@matching_player.player_address);
                }
            }
            // player is new, add to queue...
            else if (!player_is_in_queue) {
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
