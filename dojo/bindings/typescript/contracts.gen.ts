// Generated by dojo-bindgen on Wed, 5 Jun 2024 21:32:01 +0000. Do not modify this file manually.
import { Account } from "starknet";
import { DojoProvider } from "@dojoengine/core";
import * as models from "./models.gen";

export type IWorld = Awaited<ReturnType<typeof setupWorld>>;

export async function setupWorld(provider: DojoProvider) {
    // System definitions for `pistols::systems::admin::admin` contract
    function admin() {
        const contract_name = "admin";

        
        // Call the `initialize` system with the specified Account and calldata
        const initialize = async (props: { account: Account, owner_address: bigint, treasury_address: bigint, lords_address: bigint }) => {
            try {
                return await provider.execute(
                    props.account,
                    contract_name,
                    "initialize",
                    [props.owner_address,
                props.treasury_address,
                props.lords_address]
                );
            } catch (error) {
                console.error("Error executing spawn:", error);
                throw error;
            }
        };
            

    
        // Call the `is_initialized` system with the specified Account and calldata
        const is_initialized = async (props: { account: Account }) => {
            try {
                return await provider.execute(
                    props.account,
                    contract_name,
                    "is_initialized",
                    []
                );
            } catch (error) {
                console.error("Error executing spawn:", error);
                throw error;
            }
        };
            

    
        // Call the `set_owner` system with the specified Account and calldata
        const set_owner = async (props: { account: Account, owner_address: bigint }) => {
            try {
                return await provider.execute(
                    props.account,
                    contract_name,
                    "set_owner",
                    [props.owner_address]
                );
            } catch (error) {
                console.error("Error executing spawn:", error);
                throw error;
            }
        };
            

    
        // Call the `set_treasury` system with the specified Account and calldata
        const set_treasury = async (props: { account: Account, treasury_address: bigint }) => {
            try {
                return await provider.execute(
                    props.account,
                    contract_name,
                    "set_treasury",
                    [props.treasury_address]
                );
            } catch (error) {
                console.error("Error executing spawn:", error);
                throw error;
            }
        };
            

    
        // Call the `set_paused` system with the specified Account and calldata
        const set_paused = async (props: { account: Account, paused: boolean }) => {
            try {
                return await provider.execute(
                    props.account,
                    contract_name,
                    "set_paused",
                    [props.paused]
                );
            } catch (error) {
                console.error("Error executing spawn:", error);
                throw error;
            }
        };
            

    
        // Call the `set_table` system with the specified Account and calldata
        const set_table = async (props: { account: Account, table_id: bigint, contract_address: bigint, description: bigint, fee_min: models.U256, fee_pct: number, enabled: boolean }) => {
            try {
                return await provider.execute(
                    props.account,
                    contract_name,
                    "set_table",
                    [props.table_id,
                props.contract_address,
                props.description,
                props.fee_min.low,
                    props.fee_min.high,
                props.fee_pct,
                props.enabled]
                );
            } catch (error) {
                console.error("Error executing spawn:", error);
                throw error;
            }
        };
            

    
        // Call the `enable_table` system with the specified Account and calldata
        const enable_table = async (props: { account: Account, table_id: bigint, enabled: boolean }) => {
            try {
                return await provider.execute(
                    props.account,
                    contract_name,
                    "enable_table",
                    [props.table_id,
                props.enabled]
                );
            } catch (error) {
                console.error("Error executing spawn:", error);
                throw error;
            }
        };
            

    
        // Call the `get_config` system with the specified Account and calldata
        const get_config = async (props: { account: Account }) => {
            try {
                return await provider.execute(
                    props.account,
                    contract_name,
                    "get_config",
                    []
                );
            } catch (error) {
                console.error("Error executing spawn:", error);
                throw error;
            }
        };
            

    
        // Call the `get_table` system with the specified Account and calldata
        const get_table = async (props: { account: Account, table_id: bigint }) => {
            try {
                return await provider.execute(
                    props.account,
                    contract_name,
                    "get_table",
                    [props.table_id]
                );
            } catch (error) {
                console.error("Error executing spawn:", error);
                throw error;
            }
        };
            

    
        // Call the `dojo_resource` system with the specified Account and calldata
        const dojo_resource = async (props: { account: Account }) => {
            try {
                return await provider.execute(
                    props.account,
                    contract_name,
                    "dojo_resource",
                    []
                );
            } catch (error) {
                console.error("Error executing spawn:", error);
                throw error;
            }
        };
            

        return {
            initialize, is_initialized, set_owner, set_treasury, set_paused, set_table, enable_table, get_config, get_table, dojo_resource
        };
    }

    // System definitions for `pistols::mocks::lords_mock::lords_mock` contract
    function lords_mock() {
        const contract_name = "lords_mock";

        
        // Call the `dojo_resource` system with the specified Account and calldata
        const dojo_resource = async (props: { account: Account }) => {
            try {
                return await provider.execute(
                    props.account,
                    contract_name,
                    "dojo_resource",
                    []
                );
            } catch (error) {
                console.error("Error executing spawn:", error);
                throw error;
            }
        };
            

    
        // Call the `balance_of` system with the specified Account and calldata
        const balance_of = async (props: { account: Account, account: bigint }) => {
            try {
                return await provider.execute(
                    props.account,
                    contract_name,
                    "balance_of",
                    [props.account]
                );
            } catch (error) {
                console.error("Error executing spawn:", error);
                throw error;
            }
        };
            

    
        // Call the `transfer` system with the specified Account and calldata
        const transfer = async (props: { account: Account, recipient: bigint, amount: models.U256 }) => {
            try {
                return await provider.execute(
                    props.account,
                    contract_name,
                    "transfer",
                    [props.recipient,
                props.amount.low,
                    props.amount.high]
                );
            } catch (error) {
                console.error("Error executing spawn:", error);
                throw error;
            }
        };
            

    
        // Call the `transfer_from` system with the specified Account and calldata
        const transfer_from = async (props: { account: Account, sender: bigint, recipient: bigint, amount: models.U256 }) => {
            try {
                return await provider.execute(
                    props.account,
                    contract_name,
                    "transfer_from",
                    [props.sender,
                props.recipient,
                props.amount.low,
                    props.amount.high]
                );
            } catch (error) {
                console.error("Error executing spawn:", error);
                throw error;
            }
        };
            

    
        // Call the `faucet` system with the specified Account and calldata
        const faucet = async (props: { account: Account }) => {
            try {
                return await provider.execute(
                    props.account,
                    contract_name,
                    "faucet",
                    []
                );
            } catch (error) {
                console.error("Error executing spawn:", error);
                throw error;
            }
        };
            

    
        // Call the `name` system with the specified Account and calldata
        const name = async (props: { account: Account }) => {
            try {
                return await provider.execute(
                    props.account,
                    contract_name,
                    "name",
                    []
                );
            } catch (error) {
                console.error("Error executing spawn:", error);
                throw error;
            }
        };
            

    
        // Call the `symbol` system with the specified Account and calldata
        const symbol = async (props: { account: Account }) => {
            try {
                return await provider.execute(
                    props.account,
                    contract_name,
                    "symbol",
                    []
                );
            } catch (error) {
                console.error("Error executing spawn:", error);
                throw error;
            }
        };
            

    
        // Call the `decimals` system with the specified Account and calldata
        const decimals = async (props: { account: Account }) => {
            try {
                return await provider.execute(
                    props.account,
                    contract_name,
                    "decimals",
                    []
                );
            } catch (error) {
                console.error("Error executing spawn:", error);
                throw error;
            }
        };
            

    
        // Call the `allowance` system with the specified Account and calldata
        const allowance = async (props: { account: Account, owner: bigint, spender: bigint }) => {
            try {
                return await provider.execute(
                    props.account,
                    contract_name,
                    "allowance",
                    [props.owner,
                props.spender]
                );
            } catch (error) {
                console.error("Error executing spawn:", error);
                throw error;
            }
        };
            

    
        // Call the `approve` system with the specified Account and calldata
        const approve = async (props: { account: Account, spender: bigint, amount: models.U256 }) => {
            try {
                return await provider.execute(
                    props.account,
                    contract_name,
                    "approve",
                    [props.spender,
                props.amount.low,
                    props.amount.high]
                );
            } catch (error) {
                console.error("Error executing spawn:", error);
                throw error;
            }
        };
            

    
        // Call the `initializer` system with the specified Account and calldata
        const initializer = async (props: { account: Account }) => {
            try {
                return await provider.execute(
                    props.account,
                    contract_name,
                    "initializer",
                    []
                );
            } catch (error) {
                console.error("Error executing spawn:", error);
                throw error;
            }
        };
            

    
        // Call the `is_initialized` system with the specified Account and calldata
        const is_initialized = async (props: { account: Account }) => {
            try {
                return await provider.execute(
                    props.account,
                    contract_name,
                    "is_initialized",
                    []
                );
            } catch (error) {
                console.error("Error executing spawn:", error);
                throw error;
            }
        };
            

    
        // Call the `total_supply` system with the specified Account and calldata
        const total_supply = async (props: { account: Account }) => {
            try {
                return await provider.execute(
                    props.account,
                    contract_name,
                    "total_supply",
                    []
                );
            } catch (error) {
                console.error("Error executing spawn:", error);
                throw error;
            }
        };
            

    
        // Call the `totalSupply` system with the specified Account and calldata
        const totalSupply = async (props: { account: Account }) => {
            try {
                return await provider.execute(
                    props.account,
                    contract_name,
                    "totalSupply",
                    []
                );
            } catch (error) {
                console.error("Error executing spawn:", error);
                throw error;
            }
        };
            

    
        // Call the `balanceOf` system with the specified Account and calldata
        const balanceOf = async (props: { account: Account, account: bigint }) => {
            try {
                return await provider.execute(
                    props.account,
                    contract_name,
                    "balanceOf",
                    [props.account]
                );
            } catch (error) {
                console.error("Error executing spawn:", error);
                throw error;
            }
        };
            

    
        // Call the `transferFrom` system with the specified Account and calldata
        const transferFrom = async (props: { account: Account, sender: bigint, recipient: bigint, amount: models.U256 }) => {
            try {
                return await provider.execute(
                    props.account,
                    contract_name,
                    "transferFrom",
                    [props.sender,
                props.recipient,
                props.amount.low,
                    props.amount.high]
                );
            } catch (error) {
                console.error("Error executing spawn:", error);
                throw error;
            }
        };
            

        return {
            dojo_resource, balance_of, transfer, transfer_from, faucet, name, symbol, decimals, allowance, approve, initializer, is_initialized, total_supply, totalSupply, balanceOf, transferFrom
        };
    }

    // System definitions for `pistols::systems::actions::actions` contract
    function actions() {
        const contract_name = "actions";

        
        // Call the `register_duelist` system with the specified Account and calldata
        const register_duelist = async (props: { account: Account, name: bigint, profile_pic: number }) => {
            try {
                return await provider.execute(
                    props.account,
                    contract_name,
                    "register_duelist",
                    [props.name,
                props.profile_pic]
                );
            } catch (error) {
                console.error("Error executing spawn:", error);
                throw error;
            }
        };
            

    
        // Call the `create_challenge` system with the specified Account and calldata
        const create_challenge = async (props: { account: Account, challenged: bigint, message: bigint, table_id: bigint, wager_value: models.U256, expire_seconds: number }) => {
            try {
                return await provider.execute(
                    props.account,
                    contract_name,
                    "create_challenge",
                    [props.challenged,
                props.message,
                props.table_id,
                props.wager_value.low,
                    props.wager_value.high,
                props.expire_seconds]
                );
            } catch (error) {
                console.error("Error executing spawn:", error);
                throw error;
            }
        };
            

    
        // Call the `reply_challenge` system with the specified Account and calldata
        const reply_challenge = async (props: { account: Account, duel_id: bigint, accepted: boolean }) => {
            try {
                return await provider.execute(
                    props.account,
                    contract_name,
                    "reply_challenge",
                    [props.duel_id,
                props.accepted]
                );
            } catch (error) {
                console.error("Error executing spawn:", error);
                throw error;
            }
        };
            

    
        // Call the `commit_action` system with the specified Account and calldata
        const commit_action = async (props: { account: Account, duel_id: bigint, round_number: number, hash: number }) => {
            try {
                return await provider.execute(
                    props.account,
                    contract_name,
                    "commit_action",
                    [props.duel_id,
                props.round_number,
                props.hash]
                );
            } catch (error) {
                console.error("Error executing spawn:", error);
                throw error;
            }
        };
            

    
        // Call the `reveal_action` system with the specified Account and calldata
        const reveal_action = async (props: { account: Account, duel_id: bigint, round_number: number, salt: number, action_slot1: number, action_slot2: number }) => {
            try {
                return await provider.execute(
                    props.account,
                    contract_name,
                    "reveal_action",
                    [props.duel_id,
                props.round_number,
                props.salt,
                props.action_slot1,
                props.action_slot2]
                );
            } catch (error) {
                console.error("Error executing spawn:", error);
                throw error;
            }
        };
            

    
        // Call the `get_pact` system with the specified Account and calldata
        const get_pact = async (props: { account: Account, duelist_a: bigint, duelist_b: bigint }) => {
            try {
                return await provider.execute(
                    props.account,
                    contract_name,
                    "get_pact",
                    [props.duelist_a,
                props.duelist_b]
                );
            } catch (error) {
                console.error("Error executing spawn:", error);
                throw error;
            }
        };
            

    
        // Call the `has_pact` system with the specified Account and calldata
        const has_pact = async (props: { account: Account, duelist_a: bigint, duelist_b: bigint }) => {
            try {
                return await provider.execute(
                    props.account,
                    contract_name,
                    "has_pact",
                    [props.duelist_a,
                props.duelist_b]
                );
            } catch (error) {
                console.error("Error executing spawn:", error);
                throw error;
            }
        };
            

    
        // Call the `calc_fee` system with the specified Account and calldata
        const calc_fee = async (props: { account: Account, table_id: bigint, wager_value: models.U256 }) => {
            try {
                return await provider.execute(
                    props.account,
                    contract_name,
                    "calc_fee",
                    [props.table_id,
                props.wager_value.low,
                    props.wager_value.high]
                );
            } catch (error) {
                console.error("Error executing spawn:", error);
                throw error;
            }
        };
            

    
        // Call the `simulate_honour_for_action` system with the specified Account and calldata
        const simulate_honour_for_action = async (props: { account: Account, duelist_address: bigint, action: number }) => {
            try {
                return await provider.execute(
                    props.account,
                    contract_name,
                    "simulate_honour_for_action",
                    [props.duelist_address,
                props.action]
                );
            } catch (error) {
                console.error("Error executing spawn:", error);
                throw error;
            }
        };
            

    
        // Call the `simulate_chances` system with the specified Account and calldata
        const simulate_chances = async (props: { account: Account, duelist_address: bigint, duel_id: bigint, round_number: number, action: number }) => {
            try {
                return await provider.execute(
                    props.account,
                    contract_name,
                    "simulate_chances",
                    [props.duelist_address,
                props.duel_id,
                props.round_number,
                props.action]
                );
            } catch (error) {
                console.error("Error executing spawn:", error);
                throw error;
            }
        };
            

    
        // Call the `get_valid_packed_actions` system with the specified Account and calldata
        const get_valid_packed_actions = async (props: { account: Account, round_number: number }) => {
            try {
                return await provider.execute(
                    props.account,
                    contract_name,
                    "get_valid_packed_actions",
                    [props.round_number]
                );
            } catch (error) {
                console.error("Error executing spawn:", error);
                throw error;
            }
        };
            

    
        // Call the `pack_action_slots` system with the specified Account and calldata
        const pack_action_slots = async (props: { account: Account, slot1: number, slot2: number }) => {
            try {
                return await provider.execute(
                    props.account,
                    contract_name,
                    "pack_action_slots",
                    [props.slot1,
                props.slot2]
                );
            } catch (error) {
                console.error("Error executing spawn:", error);
                throw error;
            }
        };
            

    
        // Call the `unpack_action_slots` system with the specified Account and calldata
        const unpack_action_slots = async (props: { account: Account, packed: number }) => {
            try {
                return await provider.execute(
                    props.account,
                    contract_name,
                    "unpack_action_slots",
                    [props.packed]
                );
            } catch (error) {
                console.error("Error executing spawn:", error);
                throw error;
            }
        };
            

    
        // Call the `dojo_resource` system with the specified Account and calldata
        const dojo_resource = async (props: { account: Account }) => {
            try {
                return await provider.execute(
                    props.account,
                    contract_name,
                    "dojo_resource",
                    []
                );
            } catch (error) {
                console.error("Error executing spawn:", error);
                throw error;
            }
        };
            

        return {
            register_duelist, create_challenge, reply_challenge, commit_action, reveal_action, get_pact, has_pact, calc_fee, simulate_honour_for_action, simulate_chances, get_valid_packed_actions, pack_action_slots, unpack_action_slots, dojo_resource
        };
    }

    return {
        admin: admin(),
        lords_mock: lords_mock(),
        actions: actions()
    };
}
