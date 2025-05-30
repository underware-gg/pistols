#!/usr/bin/env node

import * as bookmarks from '../../assets/pistols-PlayerBookmark-2025-05-30.json' with { type: "json" };
import { bigintToHex } from '../dist/utils.js';

// const PROFILE = 'sepolia';
// const WORLD_ADDRESS = '0x8b4838140a3cbd36ebe64d4b5aaf56a30cc3753c928a79338bf56c53f506c5';

bookmarks.default.forEach(bookmark => {
  if (bookmark.enabled) {
    const player_address = bookmark.identity;
    const target_address = bookmark.target_address;
    const target_id = bookmark.target_id;
    const enabled = bookmark.enabled;
    const cmd = `sozo -P $PROFILE execute --world $WORLD_ADDRESS --wait admin fix_player_bookmark ${player_address} ${target_address} ${bigintToHex(target_id)} ${enabled}`
    console.log(cmd)
  }
})

process.exit(0)
