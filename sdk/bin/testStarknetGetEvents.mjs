#!/usr/bin/env node
import { RpcProvider, num, hash } from 'starknet';

//--------------------------------
// run with:
// turbo build && npm exec test - get - events
// 

const provider = new RpcProvider({ nodeUrl: `https://api.cartridge.gg/x/starknet/mainnet/rpc/v0_8` });
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

const pistolsDeployBlock = 1376382;
const duelistsContractAddress = '0x7aaa9866750a0db82a54ba8674c38620fa2f967d2fbb31133def48e0527c87f';

//
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

console.log(`events (${eventsList.events.length}):`, JSON.stringify(eventsList, null, 2));
