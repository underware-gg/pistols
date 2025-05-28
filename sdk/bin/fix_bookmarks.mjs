#!/usr/bin/env node

import * as bookmarks from '../../assets/pistols-PlayerBookmark-sepolia.json' with { type: "json" };

// const PROFILE = 'sepolia';
// const WORLD_ADDRESS = '0x8b4838140a3cbd36ebe64d4b5aaf56a30cc3753c928a79338bf56c53f506c5';

bookmarks.default.forEach(bookmark => {
  if (bookmark.enabled) {
    const cmd = `sozo -P $PROFILE execute --world $WORLD_ADDRESS --wait admin fix_player_bookmark ${bookmark.identity} ${bookmark.target_address} ${bookmark.target_id} ${bookmark.enabled}`
    console.log(cmd)
  }
})

process.exit(0)
