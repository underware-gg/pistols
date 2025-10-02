#!/usr/bin/env node
// import { RpcProvider } from 'starknet';
import { getContractByName } from '@dojoengine/core';
import { NetworkId, getNetworkConfig, getDuelistTokenAddress, getManifest, NAMESPACE } from '../pistols_config.js';
import { bigintToAddress, bigintToNumber } from '../utils.js';
import { _log, _error, getTokenBalances } from './lib.mjs';
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
async function cacheTokenBalances(contractName, contractAddress) {
  let token_balances = [];
  try {
    token_balances = await getTokenBalances(contractAddress, networkConfig.sqlUrl);
  } catch (error) {
    _error(`[cachePlayers/${contractName}] error: ${error.toString()}`);
  }
  _log(`[cachePlayers/${contractName}] token_balances:`, token_balances.length);
  //
  // sort by player...
  for (const token_balance of token_balances) {
    let player_address = bigintToAddress(token_balance.account_address);
    if (!player_data[player_address]) {
      player_data[player_address] = {
        username: undefined,
        duelist_ids: [],
      };
    }
    player_data[player_address].duelist_ids.push(bigintToNumber(token_balance.token_id));
  }
}


//--------------------------------
// Cache data...
//
await cacheTokenBalances(
  'duelist_token',
  getDuelistTokenAddress(networkId),
);

// console.log(`[cachePlayers] player_data:`, player_data);
console.log(`[cachePlayers] player_data:`, Object.keys(player_data).length);



//--------------------------------
// Save...
//
const outputPath = path.resolve('./src/games/pistols/cached/data/player_data.json');
fs.writeFile(outputPath, _stringify(player_data), (err) => {
  if (err) {
    console.error("ERROR: error writing file:", err);
  } else {
    console.log("Constants file generated successfully:", outputPath);
  }
});

function _stringify(obj) {
  return JSON.stringify(obj, function (k, v) {
    if (v instanceof Array)
      return JSON.stringify(v);
    return v;
  }, 2).replace(/\\/g, '')
    .replace(/\"\[/g, '[')
    .replace(/\]\"/g, ']')
    .replace(/\"\{/g, '{')
    .replace(/\}\"/g, '}');
}
