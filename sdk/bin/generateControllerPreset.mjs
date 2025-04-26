#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';

//--------------------------------
// Catridge Controller preset generator
//
// https://github.com/cartridge-gg/presets
// https://docs.cartridge.gg/controller/sessions
//
// after generation, needs to upload to:
// https://github.com/cartridge-gg/presets/blob/main/configs/pistols/config.json
//

// const config = await import('../src/games/pistols/config/config')
// const { makePistolsPolicies } = config
// import { ChainId } from '../src/dojo/setup/chains'

import { makePistolsPolicies, NetworkId } from '../pistols.js'

function buildFileContents(chainId, existingContents) {
  let networkId;
  if (chainId == 'SN_SEPOLIA') {
    networkId = NetworkId.SEPOLIA;
  } else if (chainId == 'SN_MAIN') {
    networkId = NetworkId.MAINNET;
  } else {
    console.error(`Unknown NetworkId for chain [${chainId}]!`);
    console.error(`❌ ABORTED`);
    process.exit(1);
  }
  let result = {
    ...existingContents,
    chains: {
      ...existingContents.chains,
      [chainId]: {
        policies: makePistolsPolicies(networkId, false, false)
      }
    }
  }
  if (Object.keys(result.chains?.[chainId]?.policies?.contracts ?? {}).length === 0) {
    console.error(`No contracts found in [${chainId}] manifest!`);
    console.error(`❌ ABORTED`);
    process.exit(1);
  }
  if (Object.keys(result.chains?.[chainId]?.policies?.messages ?? {}).length === 0) {
    console.error(`No messages found in [${chainId}] manifest!`);
    console.error(`❌ ABORTED`);
    process.exit(1);
  }
  return JSON.stringify(result, null, 2)
}

//----------------------
// Execution
//
console.log("executing [generateControllerPreset.mjs]...", process.argv)

// Check for the required arguments...
let chain_id = null
let arg_out = null
process.argv.forEach(arg => {
  const parts = arg.split(':')
  if (parts[0] == '--out') {
    arg_out = parts[1]
  } else if (parts[0] == '--chain_id') {
    chain_id = parts[1]
  }
})

if (!chain_id || !arg_out) {
  console.log("Usage: npm run generate-controller-preset --chain_id:<CHAIN_ID> --out:<OUTPUT_PATH>");
  console.error(`❌ ABORTED`);
  process.exit(1);
}

const jsFilePath = path.resolve(arg_out);

let existingContents = null;
try {
  // Check if file exists and read its contents
  existingContents = fs.readFileSync(jsFilePath, 'utf8');
  // console.log("Existing preset file contents:", existingContents);
} catch (err) {
  if (err.code === 'ENOENT') {
    console.log("No existing preset file found at:", jsFilePath);
  } else {
    console.error("Error reading existing file:", err);
  }
  process.exit(1);
}

const fileContents = buildFileContents(chain_id, JSON.parse(existingContents))
// console.log(fileContents)

fs.writeFile(jsFilePath, fileContents, (err) => {
  if (err) {
    console.error("ERROR: error writing file:", err);
  } else {
    console.log("Preset file generated successfully:", jsFilePath);
  }
});
