// use starknet::{ContractAddress};
use pistols::models::matches::{QueueMode};

// Exposed to clients
#[starknet::interface]
pub trait IMatchMaker<TState> {
    fn match_make_me(ref self: TState, duelist_id: u128, queue_mode: QueueMode) -> u128;
    // fn ping_me(ref self: TState) -> u128;
}

#[dojo::contract]
pub mod matchmaker {
    use core::num::traits::Zero;
    use starknet::{ContractAddress};
    use dojo::world::{WorldStorage};

    //-------------------------------------
    // pistols
    //
    use pistols::interfaces::dns::{
        // DnsTrait,
        // SELECTORS,
    };
    use pistols::models::{
        matches::{
            MatchQueue, MatchQueueTrait,
            MatchPlayer,
            QueueInfo, QueueInfoTrait,
            QueueId, QueueMode,
        },
    };
    use pistols::types::{
        premise::{Premise},
    };
    use pistols::interfaces::dns::{
        DnsTrait,
        IVrfProviderDispatcherTrait, Source,
        IDuelTokenProtectedDispatcherTrait,
    };
    use pistols::libs::{
        store::{Store, StoreTrait},
    };
    // use pistols::utils::misc::{ZERO};

    pub mod Errors {
        pub const INVALID_MODE: felt252             = 'MATCHMAKER: Invalid mode';
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

        //------------------------
        // Matchmaker actions
        //

        fn match_make_me(ref self: ContractState,
            duelist_id: u128,
            queue_mode: QueueMode,
        ) -> u128 {
            assert(queue_mode != QueueMode::Undefined, Errors::INVALID_MODE);

            let caller: ContractAddress = starknet::get_caller_address();

            // get player entry in queue
            let mut store: Store = StoreTrait::new(self.world_default());
            let mut match_player: MatchPlayer = store.get_match_player(caller);
            let mut match_queue: MatchQueue = store.get_match_queue(QueueId::Main);

            // player is already in a duel...
            if (match_player.duel_id.is_non_zero()) {
                return (match_player.duel_id);
            }

            // new player (not in queue)
            if (match_player.queue_info.slot.is_zero()) {
                match_player.player_address = caller;
                match_player.duelist_id = duelist_id;
                match_player.queue_info.queue_mode = queue_mode;
                match_player.queue_info.block_enter = starknet::get_block_number();
                // randomize slot
                let seed: felt252 = store.vrf_dispatcher().consume_random(Source::Nonce(caller));
                match_player.queue_info.slot = match_queue.assign_slot(seed);
            }

            // match player...
            let duel_id: u128 = self._match(ref store, ref match_player, ref match_queue);

            // update players
            store.set_match_queue(@match_queue);
            store.set_match_player(@match_player);

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
            ref match_player: MatchPlayer,
            ref match_queue: MatchQueue,
        ) -> u128 {
            let block_number: u64 = starknet::get_block_number();
            let mut matched_player_address: Option<ContractAddress> = Option::None;
            let mut expired_players: Array<ContractAddress> = array![];
            let mut player_is_in_queue: bool = false;
            
            // queue is not empty, try to match...
            if (match_queue.players.len().is_non_zero()) {
                // get all players in queue
                let players_info: Span<QueueInfo> = store.get_match_players_info(match_queue.players.span()).span();

                let mut candidates: Array<ContractAddress> = array![];
                let player_slot: u8 = match_player.queue_info.slot + (players_info.len() & 0xff).try_into().unwrap();

                let mut i: usize = 0;
                while (i < players_info.len()) {
                    let candidate_address: ContractAddress = *match_queue.players[i];
                    if (candidate_address == match_player.player_address) {
                        // player being matched
                        player_is_in_queue = true;
                    } else {
                        let queue_info: QueueInfo = *players_info[i];
                        // expired player, need to be removed...
                        if (queue_info.has_expired(block_number)) {
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
                    let mut duel_id: u128 = store.world.duel_token_protected_dispatcher().match_make(
                        match_player.player_address,
                        match_player.duelist_id,
                        matched_player.player_address,
                        matched_player.duelist_id,
                        1, // lives_staked
                        10, // expire_minutes
                        Premise::Honour, // premise
                        "", // message
                    );

                    // update players: set duel id, remove from queue
                    match_player.duel_id = duel_id;
                    matched_player.duel_id = duel_id;
                    match_player.queue_info.slot = 0;
                    matched_player.queue_info.slot = 0;
                    store.set_match_player(@matched_player);

                    // remove matched player from queue
                    match_queue.remove_player(@matched_player.player_address);

                    // return the duel created
                    (duel_id)
                },
                Option::None => {
                    // not matched: update ping block
                    match_player.queue_info.block_ping = block_number;
                    // no duel created
                    (0)
                },
            };

            // player is in queue, and was matched, remove from queue...
            if (player_is_in_queue && duel_id.is_non_zero()) {
                match_queue.remove_player(@match_player.player_address);
            }

            // remove expired players...
            let mut i: usize = 0;
            while (i < expired_players.len()) {
                match_queue.remove_player(expired_players[i]);
                i += 1;
            };

            // player is new and not matched, add to queue...
            if (!player_is_in_queue && duel_id.is_zero()) {
                match_queue.append_player(match_player.player_address);
            }

            // duel created
            (duel_id)
        }
    }

}
