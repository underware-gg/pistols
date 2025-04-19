use starknet::{ContractAddress};
use dojo::world::IWorldDispatcher;
use tournaments::components::models::game::{TokenMetadata, GameMetadata};

#[starknet::interface]
pub trait ITournamentToken<TState> {
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

    // IGameToken (budokan)
    fn mint(ref self: TState,
        player_name: felt252,
        settings_id: u32,
        start: Option<u64>,
        end: Option<u64>,
        to: ContractAddress,
    ) -> u64;
    fn emit_metadata_update(ref self: TState, game_id: u64);
    fn game_metadata(self: @TState) -> GameMetadata;
    fn token_metadata(self: @TState, token_id: u64) -> TokenMetadata;
    fn game_count(self: @TState) -> u64;
    fn namespace(self: @TState) -> ByteArray;
    fn score_model(self: @TState) -> ByteArray;
    fn score_attribute(self: @TState) -> ByteArray;
    fn settings_model(self: @TState) -> ByteArray;


    // ITokenComponentPublic
    fn can_mint(self: @TState, recipient: ContractAddress) -> bool;
    fn update_contract_metadata(ref self: TState);
    fn update_token_metadata(ref self: TState, token_id: u128);
    // fn update_tokens_metadata(ref self: TState, from_token_id: u128, to_token_id: u128);

    // ITournamentTokenPublic
    fn get_tournament_id(self: @TState, entry_id: u64) -> u64;
    fn can_start_tournament(self: @TState, entry_id: u64) -> bool;
    fn start_tournament(ref self: TState, entry_id: u64) -> u64;
    fn can_enlist_duelist(self: @TState, entry_id: u64, duelist_id: u128) -> bool;
    fn enlist_duelist(ref self: TState, entry_id: u64, duelist_id: u128);
    fn can_join_duel(self: @TState, entry_id: u64) -> bool;
    fn join_duel(ref self: TState, entry_id: u64) -> u128;
    fn can_end_round(self: @TState, entry_id: u64) -> bool;
    fn end_round(ref self: TState, entry_id: u64) -> Option<u8>;
}

// Exposed to clients
#[starknet::interface]
pub trait ITournamentTokenPublic<TState> {
    // misc
    fn get_tournament_id(self: @TState, entry_id: u64) -> u64;

    // Phase 0 -- Budokan registration

    // Phase 1 -- Enlist Duelist (per player)
    // - can be called by before or after start_tournament()
    fn can_enlist_duelist(self: @TState, entry_id: u64, duelist_id: u128) -> bool;
    fn enlist_duelist(ref self: TState, entry_id: u64, duelist_id: u128);

    // Phase 2 -- Start tournament (any contestant can start)
    // - will shuffle initial bracket
    // - requires VRF!
    fn can_start_tournament(self: @TState, entry_id: u64) -> bool;
    fn start_tournament(ref self: TState, entry_id: u64) -> u64; // returns tournament_id

    // Phase 3 -- Join tournament (per player)
    fn can_join_duel(self: @TState, entry_id: u64) -> bool;
    fn join_duel(ref self: TState, entry_id: u64) -> u128; // returns duel_id

    // Phase 4 -- End round (any contestant can end)
    // - will shuffle next bracket
    // - or close tournament
    // - requires VRF!
    fn can_end_round(self: @TState, entry_id: u64) -> bool;
    fn end_round(ref self: TState, entry_id: u64) -> Option<u8>; // returns next round number
}

// Exposed to world and admins
#[starknet::interface]
pub trait ITournamentTokenProtected<TState> {
    fn create_settings(ref self: TState);
}

#[dojo::contract]
pub mod tournament_token {
    use core::num::traits::Zero;
    use starknet::{ContractAddress};
    use dojo::world::{WorldStorage, IWorldDispatcherTrait};

    //-----------------------------------
    // ERC-721 Start
    //
    use openzeppelin_introspection::src5::SRC5Component;
    use openzeppelin_token::erc721::ERC721Component;
    use nft_combo::erc721::erc721_combo::ERC721ComboComponent;
    use nft_combo::erc721::erc721_combo::ERC721ComboComponent::{ERC721HooksImpl};
    use nft_combo::utils::renderer::{ContractMetadata, TokenMetadata, Attribute};
    use nft_combo::utils::encoder::{Encoder};
    use tournaments::components::game::{game_component};
    use tournaments::components::interfaces::{IGameDetails, ISettings};//, IGameToken};
    component!(path: SRC5Component, storage: src5, event: SRC5Event);
    component!(path: ERC721Component, storage: erc721, event: ERC721Event);
    component!(path: ERC721ComboComponent, storage: erc721_combo, event: ERC721ComboEvent);
    component!(path: game_component, storage: game, event: GameEvent);
    impl ERC721InternalImpl = ERC721Component::InternalImpl<ContractState>;
    #[abi(embed_v0)]
    impl ERC721ComboMixinImpl = ERC721ComboComponent::ERC721ComboMixinImpl<ContractState>;
    impl ERC721ComboInternalImpl = ERC721ComboComponent::InternalImpl<ContractState>;
    #[abi(embed_v0)]
    impl GameImpl = game_component::GameImpl<ContractState>;
    impl GameInternalImpl = game_component::InternalImpl<ContractState>;
    #[storage]
    struct Storage {
        #[substorage(v0)]
        src5: SRC5Component::Storage,
        #[substorage(v0)]
        erc721: ERC721Component::Storage,
        #[substorage(v0)]
        erc721_combo: ERC721ComboComponent::Storage,
        #[substorage(v0)]
        game: game_component::Storage,
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
        GameEvent: game_component::Event,
    }
    //
    // ERC-721 End
    //-----------------------------------

    // use pistols::interfaces::dns::{
    //     DnsTrait,
    // };
    use pistols::models::{
        challenge::{ChallengeValue},
        duelist::{DuelistTrait},
        tournament::{
            TournamentEntry, TournamentEntryValue,
            TournamentSettingsValue,
            TournamentType, TournamentTypeTrait,
            TournamentRules,
            Tournament, TournamentValue,
            TournamentState,
            TournamentRound, TournamentRoundValue, TournamentRoundTrait,
            TournamentBracketTrait,
            TournamentResultsTrait,
            TournamentDuelKeys, TournamentDuelKeysTrait,
        },
    };
    use pistols::types::{
        constants::{METADATA},
        timestamp::{Period, PeriodTrait, TIMESTAMP},
    };
    use pistols::interfaces::dns::{
        DnsTrait, SELECTORS,
        IDuelistTokenDispatcher, IDuelistTokenDispatcherTrait,
        ITournamentDispatcher, ITournamentDispatcherTrait,
        IVrfProviderDispatcherTrait, Source,
        IDuelTokenProtectedDispatcherTrait,
    };
    use pistols::systems::rng::{RngWrap, RngWrapTrait};
    use pistols::libs::store::{Store, StoreTrait};
    use pistols::utils::short_string::{ShortStringTrait};
    use graffiti::url::{UrlImpl};

    use tournaments::components::models::{
        game::{TokenMetadataValue},
        tournament::{Registration},
        lifecycle::{Lifecycle},
    };
    use tournaments::components::libs::{
        lifecycle::{LifecycleTrait},
    };

    pub mod Errors {
        pub const INVALID_ENTRY: felt252            = 'TOURNAMENT: Invalid entry';
        pub const BUDOKAN_NOT_STARTABLE: felt252    = 'TOURNAMENT: Not startable';
        pub const BUDOKAN_NOT_PLAYABLE: felt252     = 'TOURNAMENT: Not playable';
        pub const ALREADY_STARTED: felt252          = 'TOURNAMENT: Already started';
        pub const ALREADY_ENLISTED: felt252         = 'TOURNAMENT: Already enlisted';
        pub const NOT_YOUR_ENTRY: felt252           = 'TOURNAMENT: Not your entry';
        pub const NOT_YOUR_DUELIST: felt252         = 'TOURNAMENT: Not your duelist';
        pub const INVALID_ENTRY_NUMBER: felt252     = 'TOURNAMENT: Invalid entry num';
        pub const TOURNAMENT_FULL: felt252          = 'TOURNAMENT: Full!';
        pub const INVALID_DUELIST: felt252          = 'TOURNAMENT: Invalid duelist';
        pub const DUELIST_IS_DEAD: felt252          = 'TOURNAMENT: Duelist is dead';
        pub const INSUFFICIENT_LIVES: felt252       = 'TOURNAMENT: Insufficient lives';
        pub const TOO_MANY_LIVES: felt252           = 'TOURNAMENT: Too many lives';
        pub const NOT_ENLISTED: felt252             = 'TOURNAMENT: Not enlisted';
        pub const NOT_STARTED: felt252              = 'TOURNAMENT: Not started';
        pub const HAS_ENDED: felt252                = 'TOURNAMENT: Has ended';
        pub const DUELIST_IN_CHALLENGE: felt252     = 'TOURNAMENT: In a challenge';
        pub const DUELIST_IN_TOURNAMENT: felt252    = 'TOURNAMENT: In a tournament';
        pub const INVALID_ROUND: felt252            = 'TOURNAMENT: Invalid round';
        pub const STILL_PLAYABLE: felt252           = 'TOURNAMENT: Still playable';
        pub const CALLER_NOT_OWNER: felt252         = 'TOURNAMENT: Caller not owner';
        pub const IMPOSSIBLE_ERROR: felt252         = 'TOURNAMENT: Impossible error';
    }

    //*******************************
    // erc721
    fn TOKEN_NAME()   -> ByteArray {("Pistols at Dawn Tournaments")}
    fn TOKEN_SYMBOL() -> ByteArray {("TOURNAMENT")}
    //*******************************
    // Budokan
    fn DEFAULT_NS() -> ByteArray {"pistols"}
    fn SCORE_MODEL() -> ByteArray {"TournamentEntry"}
    fn SCORE_ATTRIBUTE() -> ByteArray {"score"}
    fn SETTINGS_MODEL() -> ByteArray {"TournamentSettings"}
    //*******************************

    fn dojo_init(
        ref self: ContractState,
        base_uri: felt252,
    ) {
        self.erc721_combo.initializer(
            TOKEN_NAME(),
            TOKEN_SYMBOL(),
            base_uri.to_string(),
            Option::None, // contract_uri (use hooks)
            Option::None, // max_supply (infinite)
        );
        // initialize budokan
        self.game.initializer(
            starknet::get_contract_address(),
            'Pistols at Dawn',
            "10 paces, one shot. Whether you are duelling for honour or vengeance, be sure to put the bastard in the dirt.",
            'Underware.gg',
            'Underware.gg',
            'PvP Battle Royale',
            "https://assets.underware.gg/pistols/logo.png",
            DEFAULT_NS(),
            SCORE_MODEL(),
            SCORE_ATTRIBUTE(),
            SETTINGS_MODEL(),
        );
        self._create_settings();
    }

    #[generate_trait]
    impl WorldDefaultImpl of WorldDefaultTrait {
        #[inline(always)]
        fn world_default(self: @ContractState) -> WorldStorage {
            (self.world(@"pistols"))
        }
    }


    //-----------------------------------
    // Budokan hooks
    //
    #[abi(embed_v0)]
    impl SettingsImpl of ISettings<ContractState> {
        fn setting_exists(self: @ContractState, settings_id: u32) -> bool {
            let store: Store = StoreTrait::new(self.world_default());
            let settings: TournamentSettingsValue = store.get_tournament_settings_value(settings_id);
            (settings.tournament_type.exists())
        }
    }
    #[abi(embed_v0)]
    impl GameDetailsImpl of IGameDetails<ContractState> {
        fn score(self: @ContractState, game_id: u64) -> u32 {
            let store: Store = StoreTrait::new(self.world_default());
            let entry: TournamentEntryValue = store.get_tournament_entry_value(game_id);
            (entry.score)
        }
    }


    //-----------------------------------
    // Public
    //
    #[abi(embed_v0)]
    impl TournamentTokenPublicImpl of super::ITournamentTokenPublic<ContractState> {

        fn get_tournament_id(self: @ContractState, entry_id: u64) -> u64 {
            assert(self.erc721_combo.token_exists(entry_id.into()), Errors::INVALID_ENTRY);
            let store: Store = StoreTrait::new(self.world_default());
            // verify tournament not started
            let (_, tournament_id): (ITournamentDispatcher, u64) = self._get_budokan_tournament_id(@store, entry_id);
            (tournament_id)
        }

        //-----------------------------------
        // Phase 1 -- Enlist Duelist
        //
        fn can_enlist_duelist(self: @ContractState, entry_id: u64, duelist_id: u128) -> bool {
            let store: Store = StoreTrait::new(self.world_default());
            // get updates duelist lives
            let duelist_dispatcher: IDuelistTokenDispatcher = store.world.duelist_token_dispatcher();
            duelist_dispatcher.poke(duelist_id);
            let lives: u8 = duelist_dispatcher.life_count(duelist_id);
            // get tournament settings
            let token_metadata: TokenMetadataValue = store.get_budokan_token_metadata_value(entry_id);
            let rules: TournamentRules = store.get_tournament_settings_rules(token_metadata.settings_id);
            (
                // owns entry
                self.is_owner_of(starknet::get_caller_address(), entry_id.into()) &&
                // owns duelist
                duelist_dispatcher.is_owner_of(starknet::get_caller_address(), duelist_id.into()) &&
                // not enlisted
                store.get_tournament_entry_value(entry_id).duelist_id.is_zero() &&
                // lives are valid
                lives >= rules.min_lives && lives <= rules.max_lives
            )
        }
        fn enlist_duelist(ref self: ContractState, entry_id: u64, duelist_id: u128) {
            let mut store: Store = StoreTrait::new(self.world_default());
            // validate entry ownership
            let caller: ContractAddress = starknet::get_caller_address();
            assert(self.is_owner_of(caller, entry_id.into()) == true, Errors::NOT_YOUR_ENTRY);
            assert(duelist_id.is_non_zero(), Errors::INVALID_DUELIST);
            // validate duelist ownership
            let duelist_dispatcher: IDuelistTokenDispatcher = store.world.duelist_token_dispatcher();
            assert(duelist_dispatcher.is_owner_of(caller, duelist_id.into()) == true, Errors::NOT_YOUR_DUELIST);

            // validate duelist health
            let token_metadata: TokenMetadataValue = store.get_budokan_token_metadata_value(entry_id);
            let rules: TournamentRules = store.get_tournament_settings_rules(token_metadata.settings_id);
            duelist_dispatcher.poke(duelist_id);
            let lives: u8 = duelist_dispatcher.life_count(duelist_id);
            assert(lives > 0, Errors::DUELIST_IS_DEAD);
            assert(lives >= rules.min_lives, Errors::INSUFFICIENT_LIVES);
            assert(lives <= rules.max_lives, Errors::TOO_MANY_LIVES);

            // enlist duelist in this tournament
            let registration: Option<Registration> = self._get_budokan_registration(@store, entry_id);
            match registration {
                Option::Some(registration) => {
                    let mut entry: TournamentEntry = store.get_tournament_entry(entry_id);
                    assert(entry.duelist_id.is_zero(), Errors::ALREADY_ENLISTED);
                    assert(registration.entry_number.is_non_zero(), Errors::INVALID_ENTRY_NUMBER);
                    assert(registration.entry_number <= TournamentRoundTrait::MAX_ENTRIES.into(), Errors::TOURNAMENT_FULL);
                    entry.tournament_id = registration.tournament_id;
                    entry.entry_number = registration.entry_number.try_into().unwrap();
                    entry.duelist_id = duelist_id;
                    store.set_tournament_entry(@entry);
                    // validate and create DuelistAssignment
                    DuelistTrait::enter_tournament(ref store, duelist_id, entry_id);
                },
                Option::None => {
                    // should never get here since entry is owned and exists
                    assert(false, Errors::INVALID_ENTRY);
                },
            }
        }

        //-----------------------------------
        // Phase 2 -- Start tournament
        //
        fn can_start_tournament(self: @ContractState, entry_id: u64) -> bool {
            if (!self.erc721_combo.token_exists(entry_id.into())) {
                return false;
            }
            let store: Store = StoreTrait::new(self.world_default());
            let token_metadata: TokenMetadataValue = store.get_budokan_token_metadata_value(entry_id);
            let (_, tournament_id): (ITournamentDispatcher, u64) = self._get_budokan_tournament_id(@store, entry_id);
            let tournament: TournamentValue = store.get_tournament_value(tournament_id);
            (
                // owns entry
                self.is_owner_of(starknet::get_caller_address(), entry_id.into()) &&
                // correct lifecycle
                token_metadata.lifecycle.can_start(starknet::get_block_timestamp()) &&
                // tournament not started (don't exist yet)
                tournament.state == TournamentState::Undefined
            )
        }
        fn start_tournament(ref self: ContractState, entry_id: u64) -> u64 {
            assert(self.erc721_combo.token_exists(entry_id.into()), Errors::INVALID_ENTRY);
            let mut store: Store = StoreTrait::new(self.world_default());
            // validate ownership
            let caller: ContractAddress = starknet::get_caller_address();
            assert(self.is_owner_of(caller, entry_id.into()) == true, Errors::NOT_YOUR_ENTRY);
            // verify lifecycle
            let token_metadata: TokenMetadataValue = store.get_budokan_token_metadata_value(entry_id);
            assert(token_metadata.lifecycle.can_start(starknet::get_block_timestamp()), Errors::BUDOKAN_NOT_STARTABLE);
            // verify tournament not started
            let (budokan_dispatcher, tournament_id): (ITournamentDispatcher, u64) = self._get_budokan_tournament_id(@store, entry_id);
            let mut tournament: Tournament = store.get_tournament(tournament_id);
            assert(tournament.state == TournamentState::Undefined, Errors::ALREADY_STARTED);
            tournament.state = TournamentState::InProgress;
            tournament.round_number = 1;
            // initialize round
            let seed: felt252 = store.vrf_dispatcher().consume_random(Source::Nonce(caller));
            let round: TournamentRound = self._initialize_round(ref store,
                tournament_id, 1,
                token_metadata.lifecycle,
                core::cmp::min(budokan_dispatcher.tournament_entries(tournament_id), TournamentRoundTrait::MAX_ENTRIES.into()),
                Option::None,
                seed,
            );
            // store!
            store.set_tournament(@tournament);
            store.set_tournament_round(@round);
            // return tournament id
            (tournament_id)
        }

        //-----------------------------------
        // Phase 3 -- Join Duel
        //
        fn can_join_duel(self: @ContractState, entry_id: u64) -> bool {
            let store: Store = StoreTrait::new(self.world_default());
            let token_metadata: TokenMetadataValue = store.get_budokan_token_metadata_value(entry_id);
            let entry: TournamentEntryValue = store.get_tournament_entry_value(entry_id);
            let tournament: TournamentValue = store.get_tournament_value(entry.tournament_id);
            // check if joined
            let round: TournamentRoundValue = store.get_tournament_round_value(entry.tournament_id, tournament.round_number);
// TODO: validate TournamentRound?
            let opponent_entry_number: u8 = round.bracket.get_opponent_entry_number(entry.entry_number);
            let keys: @TournamentDuelKeys = TournamentDuelKeysTrait::new(
                entry.tournament_id,
                tournament.round_number,
                entry.entry_number,
                opponent_entry_number,
            );
            let mut duel_id: u128 = store.get_tournament_duel_id(keys);
            let mut challenge: ChallengeValue = store.get_challenge_value(duel_id);
            (
                // owns entry
                self.is_owner_of(starknet::get_caller_address(), entry_id.into()) &&
                // correct lifecycle
                token_metadata.lifecycle.is_playable(starknet::get_block_timestamp()) &&
                // enlisted
                entry.tournament_id.is_non_zero() &&
                // tournament has started
                tournament.state == TournamentState::InProgress &&
                // not joined
                (duel_id.is_zero() || (challenge.duelist_id_a != entry.duelist_id && challenge.duelist_id_b != entry.duelist_id))
            )
        }
        fn join_duel(ref self: ContractState, entry_id: u64) -> u128 {
            let mut store: Store = StoreTrait::new(self.world_default());
            // validate ownership
            let caller: ContractAddress = starknet::get_caller_address();
            assert(self.is_owner_of(caller, entry_id.into()) == true, Errors::NOT_YOUR_ENTRY);
            // budokan must be playable
            let token_metadata: TokenMetadataValue = store.get_budokan_token_metadata_value(entry_id);
            assert(token_metadata.lifecycle.is_playable(starknet::get_block_timestamp()), Errors::BUDOKAN_NOT_PLAYABLE);
            // enlisted
            let mut entry: TournamentEntry = store.get_tournament_entry(entry_id);
            assert(entry.tournament_id.is_non_zero(), Errors::NOT_ENLISTED);
            assert(entry.duelist_id.is_non_zero(), Errors::NOT_ENLISTED);
            // tournament has started
            let tournament: TournamentValue = store.get_tournament_value(entry.tournament_id);
            assert(tournament.state != TournamentState::Finished, Errors::HAS_ENDED);
            assert(tournament.state == TournamentState::InProgress, Errors::NOT_STARTED);
            // update entry
            entry.current_round_number = tournament.round_number;
            store.set_tournament_entry(@entry);
            // Get round pairing
            let round: TournamentRoundValue = store.get_tournament_round_value(entry.tournament_id, tournament.round_number);
            let opponent_entry_number: u8 = round.bracket.get_opponent_entry_number(entry.entry_number);
            // Create duel
            let rules: TournamentRules = store.get_tournament_settings_rules(token_metadata.settings_id);
            let duel_id: u128 = store.world.duel_token_protected_dispatcher().join_tournament_duel(
                caller,
                entry.duelist_id,
                entry.tournament_id,
                tournament.round_number,
                entry.entry_number,
                opponent_entry_number,
                rules,
                round.timestamps.end,
            );
            (duel_id)
        }

        //-----------------------------------
        // Phase 4 -- End round
        //
        fn can_end_round(self: @ContractState, entry_id: u64) -> bool {
            if (!self.erc721_combo.token_exists(entry_id.into())) {
                return false;
            }
            let store: Store = StoreTrait::new(self.world_default());
            let token_metadata: TokenMetadataValue = store.get_budokan_token_metadata_value(entry_id);
            let entry: TournamentEntryValue = store.get_tournament_entry_value(entry_id);
            let tournament: TournamentValue = store.get_tournament_value(entry.tournament_id);
            let round: TournamentRoundValue = store.get_tournament_round_value(entry.tournament_id, tournament.round_number);
            (
                // owns entry
                self.is_owner_of(starknet::get_caller_address(), entry_id.into()) &&
                // tournament is active
                tournament.state == TournamentState::InProgress &&
                // is valid round
                round.entry_count > 0 &&
                // end conditions
                (
                    // tournament has ended
                    !token_metadata.lifecycle.is_playable(starknet::get_block_timestamp()) ||
                    // round lifecycle has ended
                    round.timestamps.has_expired() ||
                    // all duels have finished
                    round.results.have_all_duels_finished()
                )
            )
        }
        fn end_round(ref self: ContractState, entry_id: u64) -> Option<u8> {
            assert(self.erc721_combo.token_exists(entry_id.into()), Errors::INVALID_ENTRY);
            let mut store: Store = StoreTrait::new(self.world_default());
            // validate ownership
            let caller: ContractAddress = starknet::get_caller_address();
            assert(self.is_owner_of(caller, entry_id.into()) == true, Errors::NOT_YOUR_ENTRY);
            // verify lifecycle
            let token_metadata: TokenMetadataValue = store.get_budokan_token_metadata_value(entry_id);
            let entry: TournamentEntryValue = store.get_tournament_entry_value(entry_id);
            let mut tournament: Tournament = store.get_tournament(entry.tournament_id);
            assert(tournament.state != TournamentState::Finished, Errors::HAS_ENDED);
            assert(tournament.state == TournamentState::InProgress, Errors::NOT_STARTED);
            // end conditions
            let mut round: TournamentRound = store.get_tournament_round(entry.tournament_id, tournament.round_number);
            assert(round.entry_count > 0, Errors::INVALID_ROUND);
            assert(
                (
                    !token_metadata.lifecycle.is_playable(starknet::get_block_timestamp()) ||
                    round.timestamps.has_expired() ||
                    round.results.have_all_duels_finished()
                ), Errors::STILL_PLAYABLE
            );

            // end round
            round.ended_round();
            store.set_tournament_round(@round);

            // can go to next round?
            let mut result: Option<u8> = Option::None;
            let rules: TournamentRules = store.get_tournament_settings_rules(token_metadata.settings_id);
            if (rules.max_rounds == 0 || tournament.round_number < rules.max_rounds) {
                // get survivors...
                let survivors: Span<u8> = round.results.get_surviving_entries();
                if (survivors.len() >= 2) {
                    // shuffle next round
                    tournament.round_number += 1;
                    let seed: felt252 = store.vrf_dispatcher().consume_random(Source::Nonce(caller));
                    let next_round: TournamentRound = self._initialize_round(ref store,
                        tournament.tournament_id, tournament.round_number,
                        token_metadata.lifecycle,
                        survivors.len(),
                        Option::Some(survivors),
                        seed,
                    );
                    store.set_tournament_round(@next_round);
                    // return next round number
                    result = Option::Some(tournament.round_number);
                }
            }
            
            // end tournament!
            if (result.is_none()) {
                tournament.state = TournamentState::Finished;
            };

            store.set_tournament(@tournament);

            (result)
        }
    }


    //-----------------------------------
    // Protected
    //
    #[abi(embed_v0)]
    impl TournamentTokenProtectedImpl of super::ITournamentTokenProtected<ContractState> {
        fn create_settings(ref self: ContractState) {
            self._assert_caller_is_owner();
            self._create_settings();
        }
    }

    //------------------------------------
    // Internal calls
    //
    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn _assert_caller_is_owner(self: @ContractState) {
            let mut world = self.world_default();
            assert(world.dispatcher.is_owner(SELECTORS::TOURNAMENT_TOKEN, starknet::get_caller_address()) == true, Errors::CALLER_NOT_OWNER);
        }
        fn _create_settings(ref self: ContractState) {
            let mut store: Store = StoreTrait::new(self.world_default());
            store.set_tournament_settings(TournamentType::LastManStanding.tournament_settings());
            store.set_tournament_settings(TournamentType::BestOfThree.tournament_settings());
        }

        fn _get_budokan_tournament_id(self: @ContractState, store: @Store, entry_id: u64) -> (ITournamentDispatcher, u64) {
            let budokan_dispatcher: ITournamentDispatcher = store.budokan_dispatcher_from_entry_id(entry_id);
            let tournament_id: u64 = if (budokan_dispatcher.contract_address.is_non_zero()) {
                budokan_dispatcher.get_tournament_id_for_token_id(starknet::get_contract_address(), entry_id)
            } else {0}; // invalid entry
            (budokan_dispatcher, tournament_id)
        }

        fn _get_budokan_registration(self: @ContractState, store: @Store, entry_id: u64) -> Option<Registration> {
            let budokan_dispatcher: ITournamentDispatcher = store.budokan_dispatcher_from_entry_id(entry_id);
            (if (budokan_dispatcher.contract_address.is_non_zero())
                {Option::Some(budokan_dispatcher.get_registration(starknet::get_contract_address(), entry_id))}
                else {Option::None}
            )
        }

        fn _initialize_round(ref self: ContractState,
            ref store: Store,
            tournament_id: u64,
            round_number: u8,
            lifecycle: Lifecycle,
            entry_count: u32,
            survivors: Option<Span<u8>>,
            seed: felt252,
        ) -> TournamentRound {
            let mut timestamps: Period = Period {
                start: starknet::get_block_timestamp(),
                end: starknet::get_block_timestamp() + TIMESTAMP::ONE_DAY
            };
            match lifecycle.end {
                Option::Some(end) => {
                    if (end < timestamps.end) {
                        timestamps.end = end;
                    };
                },
                _ => {}
            };
            let mut round = TournamentRound {
                tournament_id,
                round_number,
                entry_count: entry_count.try_into().unwrap(),
                bracket: 0,
                results: 0,
                timestamps,
            };
            // shuffle entries
            let wrapped: @RngWrap = RngWrapTrait::new(store.world.rng_address());
            match survivors {
                Option::Some(survivors) => {
                    // nth round!
                    assert(round_number > 1, Errors::IMPOSSIBLE_ERROR);
                    round.shuffle_survivors(wrapped, seed, survivors);
                },
                Option::None => {
                    // 1st round!
                    assert(round_number == 1, Errors::IMPOSSIBLE_ERROR);
                    round.shuffle_all(wrapped, seed);
                },
            }
            (round)
        }
    }


    
    //-----------------------------------
    // ERC721ComboHooksTrait
    //
    pub impl ERC721ComboHooksImpl of ERC721ComboComponent::ERC721ComboHooksTrait<ContractState> {
        fn render_contract_uri(self: @ERC721ComboComponent::ComponentState<ContractState>) -> Option<ContractMetadata> {
            let self = self.get_contract(); // get the component's contract state
            let base_uri: ByteArray = self.erc721._base_uri();
            // let mut store: Store = StoreTrait::new(self.world_default());
            // return the metadata to be rendered by the component
            // https://docs.opensea.io/docs/contract-level-metadata
            let metadata = ContractMetadata {
                name: self.name(),
                symbol: self.symbol(),
                description: "Pistols at Dawn Tournament Entry",
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
            let mut _store: Store = StoreTrait::new(self.world_default());
            // gather data
            let base_uri: ByteArray = self.erc721._base_uri();
            // let tournament: TournamentValue = store.get_tournament_value(token_id.low);
            // let winner_duelist: DuelistValue = store.get_duelist_value(tournament.winner_duelist_id);
            // let winner_name: ByteArray = format!("Duelist #{}", winner_duelist.duelist_id);
            // Image
            let image: ByteArray = UrlImpl::new(format!("{}/api/pistols/tournament_token/{}/image", base_uri.clone(), token_id))
                // .add("winner_address", format!("0x{:x}", tournament.winner_address), false)
                // .add("winner_duelist_id", tournament.winner_duelist_id.to_string(), false)
                // .add("winner_name", winner_name.clone(), false)
                // .add("profile_type", winner_duelist.profile_type.into(), false)
                // .add("profile_id", winner_duelist.profile_type.profile_id().to_string(), false)
                .build();
            // Attributes
            let mut attributes: Array<Attribute> = array![
                // Attribute {
                //     key: "Tournament ID",
                //     value: challenge.duel_type.to_string(),
                // },
                // Attribute {
                //     key: "Table",
                //     value: challenge.duel_type.to_string(),
                // },
            ];
            // if (tournament.winner_address.is_non_zero()) {
            //     attributes.append(Attribute {
            //         key: "Winner",
            //         value: winner_name.clone(),
            //     });
            // }
            // return the metadata to be rendered by the component
            // https://docs.opensea.io/docs/metadata-standards#metadata-structure
            let metadata = TokenMetadata {
                token_id,
                name: format!("Tournament #{}", token_id),
                description: format!("Pistols at Dawn Tournament Entry #{}. https://pistols.gg", token_id),
                image: Option::Some(image),
                image_data: Option::None,
                external_url: Option::Some(METADATA::EXTERNAL_LINK()), // TODO: format external token link
                background_color: Option::Some("000000"),
                animation_url: Option::None,
                youtube_url: Option::None,
                attributes: Option::Some(attributes.span()),
                additional_metadata: Option::None,
            };
            (Option::Some(metadata))
        }
    }

}
