#!/usr/bin/env node
import { RpcProvider, num, hash, events, CallData } from 'starknet';
import { NetworkId, getNetworkConfig, getDuelistTokenAddress, getManifest, NAMESPACE } from '../pistols_config.js';
import { getContractByName } from '@dojoengine/core';

//--------------------------------
// run with:
// turbo build && npm exec test - get - events
// 
const networkId = NetworkId.MAINNET;
const networkConfig = getNetworkConfig(networkId);
const provider = new RpcProvider({ nodeUrl: networkConfig.rpcUrl });

const pistolsDeployBlock = 1376382;
const duelistsContractAddress = getDuelistTokenAddress(networkId);
const manifest = getManifest({ networkId });
const abi = getContractByName(manifest, NAMESPACE, 'duelist_token').abi


// get latest block + test RPC
const getBlockData = await provider.getBlock('latest');
if (!getBlockData || !getBlockData.block_number) {
  console.error(`invalid block data:`, getBlockData);
  process.exit(1);
}
const lastBlockNumber = getBlockData.block_number;
console.log(`latest block:`, lastBlockNumber);

// pub struct Transfer {
//     #[key]
//     pub from: ContractAddress,
//     #[key]
//     pub to: ContractAddress,
//     #[key]
//     pub token_id: u256,
// }
const eventName = 'Transfer';
const eventNameHash = num.toHex(hash.starknetKeccak('Transfer'));
console.log(`event:`, eventName, eventNameHash);

// Duelist#1 minted to mataleone
// const keyFilter = [
//   [eventNameHash], // event name
//   ['0x0'], // from
//   ['0x0550212d3f13a373dfe9e3ef6aa41fba4124bde63fd7955393f879de19f3f47f'], // to
//   ['0x1'], // token id low
//   ['0x0'], // token id high
// ];

// All transfers to mataleone
const keyFilter = [
  [eventNameHash], // event name
  [], // from
  ['0x0550212d3f13a373dfe9e3ef6aa41fba4124bde63fd7955393f879de19f3f47f'], // to
  [], // token id low
  [], // token id high
];


//--------------------------------
// provider.getEvents()
// https://starknetjs.com/docs/guides/events/#without-transaction-hash
//
// starknet_getEvents keys specification:
// https://github.com/starknet-io/SNIPs/blob/dfd91b275ea65413f8c8aedb26677a8afff70f37/SNIPS/snip-13.md#specification
//
const eventsList = await provider.getEvents({
  address: duelistsContractAddress,
  from_block: { block_number: pistolsDeployBlock },
  to_block: { block_number: lastBlockNumber },
  keys: keyFilter,
  chunk_size: 100,
});
console.log(`got [${eventsList.events.length}] events...`);
// console.log(`events:`, JSON.stringify(eventsList, null, 2));

// parse events
const abiEvents = events.getAbiEvents(abi);
const abiStructs = CallData.getAbiStruct(abi);
const abiEnums = CallData.getAbiEnum(abi);
const parsed = events.parseEvents(eventsList.events, abiEvents, abiStructs, abiEnums);
console.log('events:', parsed);
