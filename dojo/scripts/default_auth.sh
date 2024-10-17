#!/bin/bash
set -euo pipefail
source scripts/setup.sh

pushd $(dirname "$0")/..

# if ! [ -x "$(command -v jq)" ]; then
#   echo 'Error: jq not instlaled! Instal with: brew install jq'
#   exit 1
# fi
# export ADMIN_ADDRESS=$(cat $MANIFEST_FILE_PATH | jq -r '.contracts[] | select(.tag == "pistols-admin" ).address')

export ADMIN_TAG="pistols-admin"
export GAME_TAG="pistols-game"
export MINTER_TAG="pistols-minter"
export DUELISTS_TAG="pistols-duelist"


echo "------------------------------------------------------------------------------"
echo "Profile     : $PROFILE"
echo "Manifest    : $MANIFEST_FILE_PATH"
echo "Account     : $ACCOUNT_ADDRESS"
echo "World       : $WORLD_ADDRESS"
echo "::admin     : $ADMIN_TAG"
echo "::game      : $GAME_TAG"
echo "::minter    : $MINTER_TAG"
echo "::duelists  : $DUELISTS_TAG"
echo "------------------------------------------------------------------------------"

if [[
  -z "$PROFILE" ||
  -z "$MANIFEST_FILE_PATH" ||
  "$ACCOUNT_ADDRESS" != "0x"* || # for testing profile
  "$WORLD_ADDRESS" != "0x"* ||
  -z "$ADMIN_TAG" ||
  -z "$GAME_TAG" ||
  -z "$MINTER_TAG" ||
  -z "$DUELISTS_TAG"
]]; then
  echo "! Missing data 👎"
  exit 1
fi

# auth ref: https://book.dojoengine.org/toolchain/sozo/world-commands/auth
echo ">>> Admin auth..."
sozo -P $PROFILE auth grant --world $WORLD_ADDRESS --wait writer \
  model:pistols-Config,$ADMIN_TAG \
  model:pistols-TableConfig,$ADMIN_TAG \
  model:pistols-TableWager,$ADMIN_TAG \
  model:pistols-TableAdmittance,$ADMIN_TAG

echo ">>> Game auth..."
sozo -P $PROFILE auth grant --world $WORLD_ADDRESS --wait writer \
  model:pistols-Duelist,$GAME_TAG \
  model:pistols-Scoreboard,$GAME_TAG \
  model:pistols-Challenge,$GAME_TAG \
  model:pistols-Wager,$GAME_TAG \
  model:pistols-Pact,$GAME_TAG \
  model:pistols-Round,$GAME_TAG

echo ">>> Minter auth..."
sozo -P $PROFILE auth grant --world $WORLD_ADDRESS --wait writer \
  model:pistols-TokenConfig,$MINTER_TAG \

echo ">>> Duelists auth..."
sozo -P $PROFILE auth grant --world $WORLD_ADDRESS --wait writer \
  model:pistols-TokenConfig,$DUELISTS_TAG \
  model:pistols-Duelist,$DUELISTS_TAG \

# # execute ref: https://book.dojoengine.org/toolchain/sozo/world-commands/execute
# echo ">>> Initializing Game World..."
# INITIALIZED=$(sozo --profile $PROFILE call --world $WORLD_ADDRESS $ADMIN_ADDRESS is_initialized)
# if [[ $INITIALIZED == *"0x1"* ]]; then
#   echo "Already initialized"
# else
#   sozo --profile $PROFILE execute --world $WORLD_ADDRESS --wait $ADMIN_ADDRESS initialize --calldata 0x0,0x0,$LORDS_ADDRESS,$DUELISTS_ADDRESS,$MINTER_ADDRESS || true
# fi

echo "👍"
