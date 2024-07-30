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
export ACTIONS_TAG="pistols-actions"
export MINTER_TAG="pistols-minter"
export DUELISTS_TAG="pistols-token_duelist"


echo "------------------------------------------------------------------------------"
echo "Profile     : $PROFILE"
echo "Manifest    : $MANIFEST_FILE_PATH"
echo "Account     : $ACCOUNT_ADDRESS"
echo "World       : $WORLD_ADDRESS"
echo "::admin     : $ADMIN_TAG"
echo "::actions   : $ACTIONS_TAG"
echo "::minter    : $MINTER_TAG"
echo "::duelists  : $DUELISTS_TAG"
echo "------------------------------------------------------------------------------"

if [[
  -z "$PROFILE" ||
  -z "$MANIFEST_FILE_PATH" ||
  "$ACCOUNT_ADDRESS" != "0x"* || # for testing profile
  "$WORLD_ADDRESS" != "0x"* ||
  -z "$ADMIN_TAG" ||
  -z "$ACTIONS_TAG" ||
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
  model:pistols-TableAdmittance,$ADMIN_TAG

echo ">>> Game auth..."
sozo -P $PROFILE auth grant --world $WORLD_ADDRESS --wait writer \
  model:pistols-Duelist,$ACTIONS_TAG \
  model:pistols-Scoreboard,$ACTIONS_TAG \
  model:pistols-Challenge,$ACTIONS_TAG \
  model:pistols-Snapshot,$ACTIONS_TAG \
  model:pistols-Wager,$ACTIONS_TAG \
  model:pistols-Pact,$ACTIONS_TAG \
  model:pistols-Round,$ACTIONS_TAG

echo ">>> Minter auth..."
sozo -P $PROFILE auth grant --world $WORLD_ADDRESS --wait writer \
  model:pistols-TokenConfig,$MINTER_TAG \

echo ">>> Duelists auth..."
sozo -P $PROFILE auth grant --world $WORLD_ADDRESS --wait writer \
  model:origami_token-InitializableModel,$DUELISTS_TAG \
  model:origami_token-SRC5Model,$DUELISTS_TAG \
  model:origami_token-ERC721MetaModel,$DUELISTS_TAG \
  model:origami_token-ERC721OperatorApprovalModel,$DUELISTS_TAG \
  model:origami_token-ERC721TokenApprovalModel,$DUELISTS_TAG \
  model:origami_token-ERC721BalanceModel,$DUELISTS_TAG \
  model:origami_token-ERC721EnumerableIndexModel,$DUELISTS_TAG \
  model:origami_token-ERC721EnumerableOwnerIndexModel,$DUELISTS_TAG \
  model:origami_token-ERC721EnumerableOwnerTokenModel,$DUELISTS_TAG \
  model:origami_token-ERC721EnumerableTokenModel,$DUELISTS_TAG \
  model:origami_token-ERC721EnumerableTotalModel,$DUELISTS_TAG \
  model:origami_token-ERC721OwnerModel,$DUELISTS_TAG \

# # execute ref: https://book.dojoengine.org/toolchain/sozo/world-commands/execute
# echo ">>> Initializing Game World..."
# INITIALIZED=$(sozo --profile $PROFILE call --world $WORLD_ADDRESS $ADMIN_ADDRESS is_initialized)
# if [[ $INITIALIZED == *"0x1"* ]]; then
#   echo "Already initialized"
# else
#   sozo --profile $PROFILE execute --world $WORLD_ADDRESS --wait $ADMIN_ADDRESS initialize --calldata 0x0,0x0,$LORDS_ADDRESS,$DUELISTS_ADDRESS,$MINTER_ADDRESS || true
# fi

echo "👍"
