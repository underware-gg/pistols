
// Generated by dojo-bindgen on Tue, 30 Jul 2024 02:57:47 +0000. Do not modify this file manually.
// Import the necessary types from the recs SDK
// generate again with `sozo build --typescript` 
import { defineComponent, Type as RecsType, World } from "@dojoengine/recs";

export type ContractComponents = Awaited<ReturnType<typeof defineContractComponents>>;



// Type definition for `dojo::model::layout::Layout` enum
export type Layout = { type: 'Fixed'; value: RecsType.NumberArray; } | { type: 'Struct'; value: RecsType.StringArray; } | { type: 'Tuple'; value: RecsType.StringArray; } | { type: 'Array'; value: RecsType.StringArray; } | { type: 'ByteArray'; } | { type: 'Enum'; value: RecsType.StringArray; };

export const LayoutDefinition = {
    type: RecsType.String,
    value: RecsType.String
};
        
// Type definition for `core::integer::u256` struct
export interface U256 {
    low: BigInt;
    high: BigInt;
    
}
export const U256Definition = {
    low: RecsType.BigInt,
    high: RecsType.BigInt,
    
};

// Type definition for `dojo::model::layout::FieldLayout` struct
export interface FieldLayout {
    selector: BigInt;
    layout: Layout;
    
}
export const FieldLayoutDefinition = {
    selector: RecsType.BigInt,
    layout: LayoutDefinition,
    
};

// Type definition for `origami_token::components::token::erc20::erc20_allowance::ERC20AllowanceModel` struct
export interface ERC20AllowanceModel {
    token: BigInt;
    owner: BigInt;
    spender: BigInt;
    amount: U256;
    
}
export const ERC20AllowanceModelDefinition = {
    token: RecsType.BigInt,
    owner: RecsType.BigInt,
    spender: RecsType.BigInt,
    amount: U256Definition,
    
};

// Type definition for `core::byte_array::ByteArray` struct
export interface ByteArray {
    data: String[];
    pending_word: BigInt;
    pending_word_len: Number;
    
}
export const ByteArrayDefinition = {
    data: RecsType.StringArray,
    pending_word: RecsType.BigInt,
    pending_word_len: RecsType.Number,
    
};


// Type definition for `pistols::models::duelist::Pact` struct
export interface Pact {
    table_id: BigInt;
    pair: BigInt;
    duel_id: BigInt;
    
}
export const PactDefinition = {
    table_id: RecsType.BigInt,
    pair: RecsType.BigInt,
    duel_id: RecsType.BigInt,
    
};


// Type definition for `pistols::models::duelist::Score` struct
export interface Score {
    honour: Number;
    level_villain: Number;
    level_trickster: Number;
    level_lord: Number;
    total_duels: Number;
    total_wins: Number;
    total_losses: Number;
    total_draws: Number;
    honour_history: Number;
    
}
export const ScoreDefinition = {
    honour: RecsType.Number,
    level_villain: RecsType.Number,
    level_trickster: RecsType.Number,
    level_lord: RecsType.Number,
    total_duels: RecsType.Number,
    total_wins: RecsType.Number,
    total_losses: RecsType.Number,
    total_draws: RecsType.Number,
    honour_history: RecsType.Number,
    
};

// Type definition for `pistols::models::duelist::Duelist` struct
export interface Duelist {
    duelist_id: BigInt;
    name: BigInt;
    profile_pic_uri: String;
    profile_pic_type: Number;
    timestamp: Number;
    score: Score;
    
}
export const DuelistDefinition = {
    duelist_id: RecsType.BigInt,
    name: RecsType.BigInt,
    profile_pic_uri: RecsType.String,
    profile_pic_type: RecsType.Number,
    timestamp: RecsType.Number,
    score: ScoreDefinition,
    
};


// Type definition for `pistols::models::challenge::Snapshot` struct
export interface Snapshot {
    duel_id: BigInt;
    score_a: Score;
    score_b: Score;
    
}
export const SnapshotDefinition = {
    duel_id: RecsType.BigInt,
    score_a: ScoreDefinition,
    score_b: ScoreDefinition,
    
};


// Type definition for `pistols::models::table::TableAdmittance` struct
export interface TableAdmittance {
    table_id: BigInt;
    accounts: BigInt[];
    duelists: BigInt[];
    
}
export const TableAdmittanceDefinition = {
    table_id: RecsType.BigInt,
    accounts: RecsType.BigIntArray,
    duelists: RecsType.BigIntArray,
    
};


// Type definition for `origami_token::components::introspection::src5::SRC5Model` struct
export interface SRC5Model {
    token: BigInt;
    interface_id: BigInt;
    supports: Boolean;
    
}
export const SRC5ModelDefinition = {
    token: RecsType.BigInt,
    interface_id: RecsType.BigInt,
    supports: RecsType.Boolean,
    
};


// Type definition for `pistols::models::challenge::Wager` struct
export interface Wager {
    duel_id: BigInt;
    value: BigInt;
    fee: BigInt;
    
}
export const WagerDefinition = {
    duel_id: RecsType.BigInt,
    value: RecsType.BigInt,
    fee: RecsType.BigInt,
    
};


// Type definition for `origami_token::components::token::erc721::erc721_approval::ERC721TokenApprovalModel` struct
export interface ERC721TokenApprovalModel {
    token: BigInt;
    token_id: BigInt;
    address: BigInt;
    
}
export const ERC721TokenApprovalModelDefinition = {
    token: RecsType.BigInt,
    token_id: RecsType.BigInt,
    address: RecsType.BigInt,
    
};


// Type definition for `origami_token::components::security::initializable::InitializableModel` struct
export interface InitializableModel {
    token: BigInt;
    initialized: Boolean;
    
}
export const InitializableModelDefinition = {
    token: RecsType.BigInt,
    initialized: RecsType.Boolean,
    
};


// Type definition for `origami_token::components::token::erc721::erc721_owner::ERC721OwnerModel` struct
export interface ERC721OwnerModel {
    token: BigInt;
    token_id: BigInt;
    address: BigInt;
    
}
export const ERC721OwnerModelDefinition = {
    token: RecsType.BigInt,
    token_id: RecsType.BigInt,
    address: RecsType.BigInt,
    
};


// Type definition for `origami_token::components::token::erc20::erc20_bridgeable::ERC20BridgeableModel` struct
export interface ERC20BridgeableModel {
    token: BigInt;
    l2_bridge_address: BigInt;
    
}
export const ERC20BridgeableModelDefinition = {
    token: RecsType.BigInt,
    l2_bridge_address: RecsType.BigInt,
    
};


// Type definition for `origami_token::components::token::erc721::erc721_balance::ERC721BalanceModel` struct
export interface ERC721BalanceModel {
    token: BigInt;
    account: BigInt;
    amount: BigInt;
    
}
export const ERC721BalanceModelDefinition = {
    token: RecsType.BigInt,
    account: RecsType.BigInt,
    amount: RecsType.BigInt,
    
};


// Type definition for `pistols::models::challenge::Shot` struct
export interface Shot {
    hash: Number;
    salt: Number;
    action: Number;
    chance_crit: Number;
    chance_hit: Number;
    chance_lethal: Number;
    dice_crit: Number;
    dice_hit: Number;
    damage: Number;
    block: Number;
    win: Number;
    wager: Number;
    health: Number;
    honour: Number;
    
}
export const ShotDefinition = {
    hash: RecsType.Number,
    salt: RecsType.Number,
    action: RecsType.Number,
    chance_crit: RecsType.Number,
    chance_hit: RecsType.Number,
    chance_lethal: RecsType.Number,
    dice_crit: RecsType.Number,
    dice_hit: RecsType.Number,
    damage: RecsType.Number,
    block: RecsType.Number,
    win: RecsType.Number,
    wager: RecsType.Number,
    health: RecsType.Number,
    honour: RecsType.Number,
    
};

// Type definition for `pistols::models::challenge::Round` struct
export interface Round {
    duel_id: BigInt;
    round_number: Number;
    state: Number;
    shot_a: Shot;
    shot_b: Shot;
    
}
export const RoundDefinition = {
    duel_id: RecsType.BigInt,
    round_number: RecsType.Number,
    state: RecsType.Number,
    shot_a: ShotDefinition,
    shot_b: ShotDefinition,
    
};


// Type definition for `pistols::models::duelist::Scoreboard` struct
export interface Scoreboard {
    table_id: BigInt;
    duelist_id: BigInt;
    score: Score;
    wager_won: BigInt;
    wager_lost: BigInt;
    
}
export const ScoreboardDefinition = {
    table_id: RecsType.BigInt,
    duelist_id: RecsType.BigInt,
    score: ScoreDefinition,
    wager_won: RecsType.BigInt,
    wager_lost: RecsType.BigInt,
    
};


// Type definition for `origami_token::components::token::erc20::erc20_balance::ERC20BalanceModel` struct
export interface ERC20BalanceModel {
    token: BigInt;
    account: BigInt;
    amount: U256;
    
}
export const ERC20BalanceModelDefinition = {
    token: RecsType.BigInt,
    account: RecsType.BigInt,
    amount: U256Definition,
    
};


// Type definition for `origami_token::components::token::erc20::erc20_metadata::ERC20MetadataModel` struct
export interface ERC20MetadataModel {
    token: BigInt;
    name: String;
    symbol: String;
    decimals: Number;
    total_supply: U256;
    
}
export const ERC20MetadataModelDefinition = {
    token: RecsType.BigInt,
    name: RecsType.String,
    symbol: RecsType.String,
    decimals: RecsType.Number,
    total_supply: U256Definition,
    
};


// Type definition for `origami_token::components::token::erc721::erc721_enumerable::ERC721EnumerableOwnerIndexModel` struct
export interface ERC721EnumerableOwnerIndexModel {
    token: BigInt;
    owner: BigInt;
    index: BigInt;
    token_id: BigInt;
    
}
export const ERC721EnumerableOwnerIndexModelDefinition = {
    token: RecsType.BigInt,
    owner: RecsType.BigInt,
    index: RecsType.BigInt,
    token_id: RecsType.BigInt,
    
};


// Type definition for `pistols::models::table::TableType` enum
export type TableType = { type: 'Undefined'; } | { type: 'Classic'; } | { type: 'Tournament'; } | { type: 'IRLTournament'; };

export const TableTypeDefinition = {
    type: RecsType.String,
    value: RecsType.String
};
        
// Type definition for `pistols::models::table::TableConfig` struct
export interface TableConfig {
    table_id: BigInt;
    table_type: TableType;
    description: BigInt;
    fee_collector_address: BigInt;
    wager_contract_address: BigInt;
    wager_min: BigInt;
    fee_min: BigInt;
    fee_pct: Number;
    is_open: Boolean;
    
}
export const TableConfigDefinition = {
    table_id: RecsType.BigInt,
    table_type: TableTypeDefinition,
    description: RecsType.BigInt,
    fee_collector_address: RecsType.BigInt,
    wager_contract_address: RecsType.BigInt,
    wager_min: RecsType.BigInt,
    fee_min: RecsType.BigInt,
    fee_pct: RecsType.Number,
    is_open: RecsType.Boolean,
    
};


// Type definition for `origami_token::components::token::erc721::erc721_enumerable::ERC721EnumerableOwnerTokenModel` struct
export interface ERC721EnumerableOwnerTokenModel {
    token: BigInt;
    owner: BigInt;
    token_id: BigInt;
    index: BigInt;
    
}
export const ERC721EnumerableOwnerTokenModelDefinition = {
    token: RecsType.BigInt,
    owner: RecsType.BigInt,
    token_id: RecsType.BigInt,
    index: RecsType.BigInt,
    
};


// Type definition for `pistols::models::token_config::TokenConfig` struct
export interface TokenConfig {
    token_address: BigInt;
    max_supply: Number;
    max_per_wallet: Number;
    minted_count: Number;
    is_open: Boolean;
    
}
export const TokenConfigDefinition = {
    token_address: RecsType.BigInt,
    max_supply: RecsType.Number,
    max_per_wallet: RecsType.Number,
    minted_count: RecsType.Number,
    is_open: RecsType.Boolean,
    
};


// Type definition for `pistols::models::challenge::Challenge` struct
export interface Challenge {
    duel_id: BigInt;
    table_id: BigInt;
    message: BigInt;
    address_a: BigInt;
    address_b: BigInt;
    duelist_id_a: BigInt;
    duelist_id_b: BigInt;
    state: Number;
    round_number: Number;
    winner: Number;
    timestamp_start: Number;
    timestamp_end: Number;
    
}
export const ChallengeDefinition = {
    duel_id: RecsType.BigInt,
    table_id: RecsType.BigInt,
    message: RecsType.BigInt,
    address_a: RecsType.BigInt,
    address_b: RecsType.BigInt,
    duelist_id_a: RecsType.BigInt,
    duelist_id_b: RecsType.BigInt,
    state: RecsType.Number,
    round_number: RecsType.Number,
    winner: RecsType.Number,
    timestamp_start: RecsType.Number,
    timestamp_end: RecsType.Number,
    
};


// Type definition for `origami_token::components::token::erc721::erc721_approval::ERC721OperatorApprovalModel` struct
export interface ERC721OperatorApprovalModel {
    token: BigInt;
    owner: BigInt;
    operator: BigInt;
    approved: Boolean;
    
}
export const ERC721OperatorApprovalModelDefinition = {
    token: RecsType.BigInt,
    owner: RecsType.BigInt,
    operator: RecsType.BigInt,
    approved: RecsType.Boolean,
    
};


// Type definition for `origami_token::components::token::erc721::erc721_enumerable::ERC721EnumerableTokenModel` struct
export interface ERC721EnumerableTokenModel {
    token: BigInt;
    token_id: BigInt;
    index: BigInt;
    
}
export const ERC721EnumerableTokenModelDefinition = {
    token: RecsType.BigInt,
    token_id: RecsType.BigInt,
    index: RecsType.BigInt,
    
};


// Type definition for `origami_token::components::token::erc721::erc721_enumerable::ERC721EnumerableIndexModel` struct
export interface ERC721EnumerableIndexModel {
    token: BigInt;
    index: BigInt;
    token_id: BigInt;
    
}
export const ERC721EnumerableIndexModelDefinition = {
    token: RecsType.BigInt,
    index: RecsType.BigInt,
    token_id: RecsType.BigInt,
    
};


// Type definition for `origami_token::components::token::erc721::erc721_metadata::ERC721MetaModel` struct
export interface ERC721MetaModel {
    token: BigInt;
    name: String;
    symbol: String;
    base_uri: String;
    
}
export const ERC721MetaModelDefinition = {
    token: RecsType.BigInt,
    name: RecsType.String,
    symbol: RecsType.String,
    base_uri: RecsType.String,
    
};


// Type definition for `origami_token::components::token::erc721::erc721_enumerable::ERC721EnumerableTotalModel` struct
export interface ERC721EnumerableTotalModel {
    token: BigInt;
    total_supply: BigInt;
    
}
export const ERC721EnumerableTotalModelDefinition = {
    token: RecsType.BigInt,
    total_supply: RecsType.BigInt,
    
};


// Type definition for `pistols::models::config::Config` struct
export interface Config {
    key: Number;
    treasury_address: BigInt;
    paused: Boolean;
    
}
export const ConfigDefinition = {
    key: RecsType.Number,
    treasury_address: RecsType.BigInt,
    paused: RecsType.Boolean,
    
};


export function defineContractComponents(world: World) {
    return {

        // Model definition for `origami_token::components::token::erc20::erc20_allowance::ERC20AllowanceModel` model
        ERC20AllowanceModel: (() => {
            return defineComponent(
                world,
                {
                    token: RecsType.BigInt,
                    owner: RecsType.BigInt,
                    spender: RecsType.BigInt,
                    amount: U256Definition,
                },
                {
                    metadata: {
                        namespace: "origami_token",
                        name: "ERC20AllowanceModel",
                        types: ["ContractAddress", "ContractAddress", "ContractAddress"],
                        customTypes: ["U256"],
                    },
                }
            );
        })(),

        // Model definition for `pistols::models::duelist::Pact` model
        Pact: (() => {
            return defineComponent(
                world,
                {
                    table_id: RecsType.BigInt,
                    pair: RecsType.BigInt,
                    duel_id: RecsType.BigInt,
                },
                {
                    metadata: {
                        namespace: "pistols",
                        name: "Pact",
                        types: ["felt252", "u128", "u128"],
                        customTypes: [],
                    },
                }
            );
        })(),

        // Model definition for `pistols::models::duelist::Duelist` model
        Duelist: (() => {
            return defineComponent(
                world,
                {
                    duelist_id: RecsType.BigInt,
                    name: RecsType.BigInt,
                    profile_pic_uri: RecsType.StringDefinition,
                    profile_pic_type: RecsType.Number,
                    timestamp: RecsType.Number,
                    score: ScoreDefinition,
                },
                {
                    metadata: {
                        namespace: "pistols",
                        name: "Duelist",
                        types: ["u128", "felt252", "u8", "u64"],
                        customTypes: ["ByteArray", "Score"],
                    },
                }
            );
        })(),

        // Model definition for `pistols::models::challenge::Snapshot` model
        Snapshot: (() => {
            return defineComponent(
                world,
                {
                    duel_id: RecsType.BigInt,
                    score_a: ScoreDefinition,
                    score_b: ScoreDefinition,
                },
                {
                    metadata: {
                        namespace: "pistols",
                        name: "Snapshot",
                        types: ["u128"],
                        customTypes: ["Score", "Score"],
                    },
                }
            );
        })(),

        // Model definition for `pistols::models::table::TableAdmittance` model
        TableAdmittance: (() => {
            return defineComponent(
                world,
                {
                    table_id: RecsType.BigInt,
                    accounts: RecsType.BigIntArray,
                    duelists: RecsType.BigIntArray,
                },
                {
                    metadata: {
                        namespace: "pistols",
                        name: "TableAdmittance",
                        types: ["felt252", "array", "array"],
                        customTypes: [],
                    },
                }
            );
        })(),

        // Model definition for `origami_token::components::introspection::src5::SRC5Model` model
        SRC5Model: (() => {
            return defineComponent(
                world,
                {
                    token: RecsType.BigInt,
                    interface_id: RecsType.BigInt,
                    supports: RecsType.Boolean,
                },
                {
                    metadata: {
                        namespace: "origami_token",
                        name: "SRC5Model",
                        types: ["ContractAddress", "felt252", "bool"],
                        customTypes: [],
                    },
                }
            );
        })(),

        // Model definition for `pistols::models::challenge::Wager` model
        Wager: (() => {
            return defineComponent(
                world,
                {
                    duel_id: RecsType.BigInt,
                    value: RecsType.BigInt,
                    fee: RecsType.BigInt,
                },
                {
                    metadata: {
                        namespace: "pistols",
                        name: "Wager",
                        types: ["u128", "u128", "u128"],
                        customTypes: [],
                    },
                }
            );
        })(),

        // Model definition for `origami_token::components::token::erc721::erc721_approval::ERC721TokenApprovalModel` model
        ERC721TokenApprovalModel: (() => {
            return defineComponent(
                world,
                {
                    token: RecsType.BigInt,
                    token_id: RecsType.BigInt,
                    address: RecsType.BigInt,
                },
                {
                    metadata: {
                        namespace: "origami_token",
                        name: "ERC721TokenApprovalModel",
                        types: ["ContractAddress", "u128", "ContractAddress"],
                        customTypes: [],
                    },
                }
            );
        })(),

        // Model definition for `origami_token::components::security::initializable::InitializableModel` model
        InitializableModel: (() => {
            return defineComponent(
                world,
                {
                    token: RecsType.BigInt,
                    initialized: RecsType.Boolean,
                },
                {
                    metadata: {
                        namespace: "origami_token",
                        name: "InitializableModel",
                        types: ["ContractAddress", "bool"],
                        customTypes: [],
                    },
                }
            );
        })(),

        // Model definition for `origami_token::components::token::erc721::erc721_owner::ERC721OwnerModel` model
        ERC721OwnerModel: (() => {
            return defineComponent(
                world,
                {
                    token: RecsType.BigInt,
                    token_id: RecsType.BigInt,
                    address: RecsType.BigInt,
                },
                {
                    metadata: {
                        namespace: "origami_token",
                        name: "ERC721OwnerModel",
                        types: ["ContractAddress", "u128", "ContractAddress"],
                        customTypes: [],
                    },
                }
            );
        })(),

        // Model definition for `origami_token::components::token::erc20::erc20_bridgeable::ERC20BridgeableModel` model
        ERC20BridgeableModel: (() => {
            return defineComponent(
                world,
                {
                    token: RecsType.BigInt,
                    l2_bridge_address: RecsType.BigInt,
                },
                {
                    metadata: {
                        namespace: "origami_token",
                        name: "ERC20BridgeableModel",
                        types: ["ContractAddress", "ContractAddress"],
                        customTypes: [],
                    },
                }
            );
        })(),

        // Model definition for `origami_token::components::token::erc721::erc721_balance::ERC721BalanceModel` model
        ERC721BalanceModel: (() => {
            return defineComponent(
                world,
                {
                    token: RecsType.BigInt,
                    account: RecsType.BigInt,
                    amount: RecsType.BigInt,
                },
                {
                    metadata: {
                        namespace: "origami_token",
                        name: "ERC721BalanceModel",
                        types: ["ContractAddress", "ContractAddress", "u128"],
                        customTypes: [],
                    },
                }
            );
        })(),

        // Model definition for `pistols::models::challenge::Round` model
        Round: (() => {
            return defineComponent(
                world,
                {
                    duel_id: RecsType.BigInt,
                    round_number: RecsType.Number,
                    state: RecsType.Number,
                    shot_a: ShotDefinition,
                    shot_b: ShotDefinition,
                },
                {
                    metadata: {
                        namespace: "pistols",
                        name: "Round",
                        types: ["u128", "u8", "u8"],
                        customTypes: ["Shot", "Shot"],
                    },
                }
            );
        })(),

        // Model definition for `pistols::models::duelist::Scoreboard` model
        Scoreboard: (() => {
            return defineComponent(
                world,
                {
                    table_id: RecsType.BigInt,
                    duelist_id: RecsType.BigInt,
                    score: ScoreDefinition,
                    wager_won: RecsType.BigInt,
                    wager_lost: RecsType.BigInt,
                },
                {
                    metadata: {
                        namespace: "pistols",
                        name: "Scoreboard",
                        types: ["felt252", "u128", "u128", "u128"],
                        customTypes: ["Score"],
                    },
                }
            );
        })(),

        // Model definition for `origami_token::components::token::erc20::erc20_balance::ERC20BalanceModel` model
        ERC20BalanceModel: (() => {
            return defineComponent(
                world,
                {
                    token: RecsType.BigInt,
                    account: RecsType.BigInt,
                    amount: U256Definition,
                },
                {
                    metadata: {
                        namespace: "origami_token",
                        name: "ERC20BalanceModel",
                        types: ["ContractAddress", "ContractAddress"],
                        customTypes: ["U256"],
                    },
                }
            );
        })(),

        // Model definition for `origami_token::components::token::erc20::erc20_metadata::ERC20MetadataModel` model
        ERC20MetadataModel: (() => {
            return defineComponent(
                world,
                {
                    token: RecsType.BigInt,
                    name: RecsType.StringDefinition,
                    symbol: RecsType.StringDefinition,
                    decimals: RecsType.Number,
                    total_supply: U256Definition,
                },
                {
                    metadata: {
                        namespace: "origami_token",
                        name: "ERC20MetadataModel",
                        types: ["ContractAddress", "u8"],
                        customTypes: ["ByteArray", "ByteArray", "U256"],
                    },
                }
            );
        })(),

        // Model definition for `origami_token::components::token::erc721::erc721_enumerable::ERC721EnumerableOwnerIndexModel` model
        ERC721EnumerableOwnerIndexModel: (() => {
            return defineComponent(
                world,
                {
                    token: RecsType.BigInt,
                    owner: RecsType.BigInt,
                    index: RecsType.BigInt,
                    token_id: RecsType.BigInt,
                },
                {
                    metadata: {
                        namespace: "origami_token",
                        name: "ERC721EnumerableOwnerIndexModel",
                        types: ["ContractAddress", "ContractAddress", "u128", "u128"],
                        customTypes: [],
                    },
                }
            );
        })(),

        // Model definition for `pistols::models::table::TableConfig` model
        TableConfig: (() => {
            return defineComponent(
                world,
                {
                    table_id: RecsType.BigInt,
                    table_type: RecsType.String,
                    description: RecsType.BigInt,
                    fee_collector_address: RecsType.BigInt,
                    wager_contract_address: RecsType.BigInt,
                    wager_min: RecsType.BigInt,
                    fee_min: RecsType.BigInt,
                    fee_pct: RecsType.Number,
                    is_open: RecsType.Boolean,
                },
                {
                    metadata: {
                        namespace: "pistols",
                        name: "TableConfig",
                        types: ["felt252", "TableType", "felt252", "ContractAddress", "ContractAddress", "u128", "u128", "u8", "bool"],
                        customTypes: [],
                    },
                }
            );
        })(),

        // Model definition for `origami_token::components::token::erc721::erc721_enumerable::ERC721EnumerableOwnerTokenModel` model
        ERC721EnumerableOwnerTokenModel: (() => {
            return defineComponent(
                world,
                {
                    token: RecsType.BigInt,
                    owner: RecsType.BigInt,
                    token_id: RecsType.BigInt,
                    index: RecsType.BigInt,
                },
                {
                    metadata: {
                        namespace: "origami_token",
                        name: "ERC721EnumerableOwnerTokenModel",
                        types: ["ContractAddress", "ContractAddress", "u128", "u128"],
                        customTypes: [],
                    },
                }
            );
        })(),

        // Model definition for `pistols::models::token_config::TokenConfig` model
        TokenConfig: (() => {
            return defineComponent(
                world,
                {
                    token_address: RecsType.BigInt,
                    max_supply: RecsType.Number,
                    max_per_wallet: RecsType.Number,
                    minted_count: RecsType.Number,
                    is_open: RecsType.Boolean,
                },
                {
                    metadata: {
                        namespace: "pistols",
                        name: "TokenConfig",
                        types: ["ContractAddress", "u16", "u16", "u16", "bool"],
                        customTypes: [],
                    },
                }
            );
        })(),

        // Model definition for `pistols::models::challenge::Challenge` model
        Challenge: (() => {
            return defineComponent(
                world,
                {
                    duel_id: RecsType.BigInt,
                    table_id: RecsType.BigInt,
                    message: RecsType.BigInt,
                    address_a: RecsType.BigInt,
                    address_b: RecsType.BigInt,
                    duelist_id_a: RecsType.BigInt,
                    duelist_id_b: RecsType.BigInt,
                    state: RecsType.Number,
                    round_number: RecsType.Number,
                    winner: RecsType.Number,
                    timestamp_start: RecsType.Number,
                    timestamp_end: RecsType.Number,
                },
                {
                    metadata: {
                        namespace: "pistols",
                        name: "Challenge",
                        types: ["u128", "felt252", "felt252", "ContractAddress", "ContractAddress", "u128", "u128", "u8", "u8", "u8", "u64", "u64"],
                        customTypes: [],
                    },
                }
            );
        })(),

        // Model definition for `origami_token::components::token::erc721::erc721_approval::ERC721OperatorApprovalModel` model
        ERC721OperatorApprovalModel: (() => {
            return defineComponent(
                world,
                {
                    token: RecsType.BigInt,
                    owner: RecsType.BigInt,
                    operator: RecsType.BigInt,
                    approved: RecsType.Boolean,
                },
                {
                    metadata: {
                        namespace: "origami_token",
                        name: "ERC721OperatorApprovalModel",
                        types: ["ContractAddress", "ContractAddress", "ContractAddress", "bool"],
                        customTypes: [],
                    },
                }
            );
        })(),

        // Model definition for `origami_token::components::token::erc721::erc721_enumerable::ERC721EnumerableTokenModel` model
        ERC721EnumerableTokenModel: (() => {
            return defineComponent(
                world,
                {
                    token: RecsType.BigInt,
                    token_id: RecsType.BigInt,
                    index: RecsType.BigInt,
                },
                {
                    metadata: {
                        namespace: "origami_token",
                        name: "ERC721EnumerableTokenModel",
                        types: ["ContractAddress", "u128", "u128"],
                        customTypes: [],
                    },
                }
            );
        })(),

        // Model definition for `origami_token::components::token::erc721::erc721_enumerable::ERC721EnumerableIndexModel` model
        ERC721EnumerableIndexModel: (() => {
            return defineComponent(
                world,
                {
                    token: RecsType.BigInt,
                    index: RecsType.BigInt,
                    token_id: RecsType.BigInt,
                },
                {
                    metadata: {
                        namespace: "origami_token",
                        name: "ERC721EnumerableIndexModel",
                        types: ["ContractAddress", "u128", "u128"],
                        customTypes: [],
                    },
                }
            );
        })(),

        // Model definition for `origami_token::components::token::erc721::erc721_metadata::ERC721MetaModel` model
        ERC721MetaModel: (() => {
            return defineComponent(
                world,
                {
                    token: RecsType.BigInt,
                    name: RecsType.StringDefinition,
                    symbol: RecsType.StringDefinition,
                    base_uri: RecsType.StringDefinition,
                },
                {
                    metadata: {
                        namespace: "origami_token",
                        name: "ERC721MetaModel",
                        types: ["ContractAddress"],
                        customTypes: ["ByteArray", "ByteArray", "ByteArray"],
                    },
                }
            );
        })(),

        // Model definition for `origami_token::components::token::erc721::erc721_enumerable::ERC721EnumerableTotalModel` model
        ERC721EnumerableTotalModel: (() => {
            return defineComponent(
                world,
                {
                    token: RecsType.BigInt,
                    total_supply: RecsType.BigInt,
                },
                {
                    metadata: {
                        namespace: "origami_token",
                        name: "ERC721EnumerableTotalModel",
                        types: ["ContractAddress", "u128"],
                        customTypes: [],
                    },
                }
            );
        })(),

        // Model definition for `pistols::models::config::Config` model
        Config: (() => {
            return defineComponent(
                world,
                {
                    key: RecsType.Number,
                    treasury_address: RecsType.BigInt,
                    paused: RecsType.Boolean,
                },
                {
                    metadata: {
                        namespace: "pistols",
                        name: "Config",
                        types: ["u8", "ContractAddress", "bool"],
                        customTypes: [],
                    },
                }
            );
        })(),
    };
}