#!/usr/bin/env node
// import { RpcProvider } from 'starknet';
// import { getContractByName } from '@dojoengine/core';
import {
  NetworkId,
  getNetworkConfig,
  getDuelistTokenAddress,
  getRingTokenAddress,
  getManifest,
  NAMESPACE,
} from '../pistols_config.js';
import { bigintToAddress, bigintToNumber } from '../utils.js';
import { getTokenBalances, getControllerAccounts } from './lib_sql.mjs';
import { _log, _error, _stringify } from './lib.mjs';
import * as path from 'path';
import * as fs from 'fs';

//--------------------------------
// run with:
// turbo build && npm exec test - get - events
// 
const networkId = NetworkId.MAINNET;
const networkConfig = getNetworkConfig(networkId);
// const provider = new RpcProvider({ nodeUrl: networkConfig.rpcUrl });

const player_data = {};

//--------------------------------
// Get metadata per contract
//
// const duelistsContractAddress = getDuelistTokenAddress(networkId);
// const manifest = getManifest({ networkId });
// const abi = getContractByName(manifest, NAMESPACE, 'duelist_token').abi
// let token_metadata = [];
// try {
//   token_metadata = await getTokensMetadata(duelistsContractAddress, networkConfig.sqlUrl);
// } catch (error) {
//   _error(`[cachePlayers] error: ${error.toString()}`);
// }
// _log(`[cachePlayers] token_metadata:`, token_metadata.length);


//--------------------------------
// Get balances per contract
//
async function cacheTokenBalances(contractAddress, arrayName) {
  let token_balances = [];
  try {
    token_balances = await getTokenBalances(contractAddress, networkConfig.sqlUrl);
  } catch (error) {
    _error(`[cacheTokenBalances/${arrayName}] error: ${error.toString()}`);
  }
  _log(`[cacheTokenBalances/${arrayName}] token_balances:`, token_balances.length);
  //
  // sort by player...
  for (const token_balance of token_balances) {
    let player_address = bigintToAddress(token_balance.account_address);
    if (!player_data[player_address]) {
      player_data[player_address] = {
        username: null,
        duelist_ids: [],
        ring_ids: [],
        iso_timestamp: '',
      };
    }
    player_data[player_address][arrayName].push(bigintToNumber(token_balance.token_id));
    if (token_balance.iso_timestamp > player_data[player_address].iso_timestamp) {
      player_data[player_address].iso_timestamp = token_balance.iso_timestamp;
    }
  }
}

async function cacheControllerAccounts() {
  let controller_accounts = [];
  try {
    controller_accounts = await getControllerAccounts(networkConfig.sqlUrl);
  } catch (error) {
    _error(`[cacheControllerAccounts] error: ${error.toString()}`);
  }
  _log(`[cacheControllerAccounts] controller_accounts:`, controller_accounts.length);
  //
  // fill in players...
  for (const controller_account of controller_accounts) {
    let player_address = bigintToAddress(controller_account.address);
    if (player_data[player_address]) {
      player_data[player_address].username = controller_account.username;
    }
  }
}


//--------------------------------
// Cache data...
//
await cacheTokenBalances(
  getDuelistTokenAddress(networkId),
  'duelist_ids',
);
await cacheTokenBalances(
  getRingTokenAddress(networkId),
  'ring_ids',
);
await cacheControllerAccounts();

// console.log(`[cachePlayers] player_data:`, player_data);
console.log(`[cachePlayers] players:`, Object.keys(player_data).length);
console.log(`[cachePlayers] controllers:`, Object.values(player_data).filter(player => player.username !== null).length);



//--------------------------------
// Save...
//
const playerDataPath = path.resolve('./src/games/pistols/cached/data/player_data.json');
fs.writeFile(playerDataPath, _stringify(player_data), (err) => {
  if (err) {
    console.error("ERROR: error writing file:", err);
  } else {
    console.log("Constants file generated successfully:", playerDataPath);
  }
});

