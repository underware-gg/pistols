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

import { makePistolsPolicies } from '../pistols.js'

function buildFileContents() {
  // use development manifest (KATANA_LOCAL)
  const chainId = 'KATANA_LOCAL'
  let result = {
    origin: [
      "pistols.underware.gg",
      "pistols.stage.underware.gg",
      "play.pistols.gg",
    ],
    theme: {
      colors: {
        primary: "#EF9758"
      },
      cover: "cover.png",
      icon: "icon.png",
      name: "Pistols at Dawn"
    },
    policies: makePistolsPolicies(chainId, false, false)
  }
  if (Object.keys(result.policies.contracts).length === 0) {
    console.error(`No contracts found in [${chainId}] manifest!`);
    console.error(`❌ ABORTED`);
    process.exit(1);
  }
  if (Object.keys(result.policies.messages).length === 0) {
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
let arg_out = null
process.argv.forEach(arg => {
  const parts = arg.split(':')
  if (parts[0] == '--out') {
    arg_out = parts[1]
  }
})

if (!arg_out) {
  console.log("Usage: npm run generate-controller-preset --out:<OUTPUT_PATH>");
  console.error(`❌ ABORTED`);
  process.exit(1);
}

const jsFilePath = path.resolve(arg_out);

const fileContents = buildFileContents()
// console.log(fileContents)

fs.writeFile(jsFilePath, fileContents, (err) => {
  if (err) {
    console.error("ERROR: error writing file:", err);
  } else {
    console.log("Preset file generated successfully:", jsFilePath);
  }
});
