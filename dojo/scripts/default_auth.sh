#!/bin/bash
set -euo pipefail
pushd $(dirname "$0")/..

# Profile
if [ $# -ge 1 ]; then
  export PROFILE=$1
else
  export PROFILE="dev"
fi

if ! [ -x "$(command -v toml)" ]; then
  echo 'Error: toml not instlaled! Instal with: cargo install toml-cli'
  exit 1
fi
if ! [ -x "$(command -v jq)" ]; then
  echo 'Error: jq not instlaled! Instal with: brew install jq'
  exit 1
fi

get_profile_env () {
  local ENV_NAME=$1
  local RESULT=$(toml get Scarb.toml --raw profile.$PROFILE.tool.dojo.env.$ENV_NAME)
  if [[ -z "$RESULT" ]]; then
    local RESULT=$(toml get Scarb.toml --raw tool.dojo.env.$ENV_NAME)
    if [[ -z "$RESULT" ]]; then
      >&2 echo "get_profile_env($ENV_NAME) not found! 👎"
    fi
  fi
  echo $RESULT
}

export MANIFEST_FILE_PATH="./manifests/$PROFILE/manifest.json"
export WORLD_ADDRESS=$(get_profile_env "world_address")
export ADMIN_ADDRESS=$(cat $MANIFEST_FILE_PATH | jq -r '.contracts[] | select(.name == "pistols::systems::admin::admin" ).address')
export ACTIONS_ADDRESS=$(cat $MANIFEST_FILE_PATH | jq -r '.contracts[] | select(.name == "pistols::systems::actions::actions" ).address')
export DUELISTS_ADDRESS=$(cat $MANIFEST_FILE_PATH | jq -r '.contracts[] | select(.name == "pistols::systems::token_duelist::token_duelist" ).address')
export MINTER_ADDRESS=$(cat $MANIFEST_FILE_PATH | jq -r '.contracts[] | select(.name == "pistols::systems::minter::minter" ).address')
# use $DOJO_ACCOUNT_ADDRESS else read from profile
export ACCOUNT_ADDRESS=${DOJO_ACCOUNT_ADDRESS:-$(get_profile_env "account_address")}


# Use mocked Lords if lords_address not defined in Scarb
export LORDS_MOCK=
export LORDS_ADDRESS=$(get_profile_env "lords_address")
if [[ -z "$LORDS_ADDRESS" ]]; then
  echo "- using mock \$LORDS 👑"
  export LORDS_ADDRESS=$(cat $MANIFEST_FILE_PATH | jq -r '.contracts[] | select(.name == "pistols::mocks::lords_mock::lords_mock" ).address')
  export LORDS_MOCK="Yes"
fi

echo "------------------------------------------------------------------------------"
echo "Profile     : $PROFILE"
echo "Manifest    : $MANIFEST_FILE_PATH"
echo "Account     : $ACCOUNT_ADDRESS"
echo "World       : $WORLD_ADDRESS"
echo "::admin     : $ADMIN_ADDRESS"
echo "::actions   : $ACTIONS_ADDRESS"
echo "::duelists  : $DUELISTS_ADDRESS"
echo "::minter    : $MINTER_ADDRESS"
echo "\$LORDS      : $LORDS_ADDRESS"
echo "\$LORDS Mock : $LORDS_MOCK"
echo "------------------------------------------------------------------------------"

if [[
  -z "$PROFILE" ||
  -z "$MANIFEST_FILE_PATH" ||
  "$ACCOUNT_ADDRESS" != "0x"* || # for testing profile
  "$WORLD_ADDRESS" != "0x"* ||
  "$ADMIN_ADDRESS" != "0x"* ||
  "$ACTIONS_ADDRESS" != "0x"* ||
  "$DUELISTS_ADDRESS" != "0x"* ||
  "$LORDS_ADDRESS" != "0x"*
]]; then
  echo "! Missing data 👎"
  exit 1
fi

# auth ref: https://book.dojoengine.org/toolchain/sozo/world-commands/auth
echo ">>> Admin auth..."
sozo -P $PROFILE auth grant --world $WORLD_ADDRESS --wait writer \
  Config,$ADMIN_ADDRESS \
  TableConfig,$ADMIN_ADDRESS \
  TableAdmittance,$ADMIN_ADDRESS

echo ">>> Game auth..."
sozo -P $PROFILE auth grant --world $WORLD_ADDRESS --wait writer \
  Duelist,$ACTIONS_ADDRESS \
  Scoreboard,$ACTIONS_ADDRESS \
  Challenge,$ACTIONS_ADDRESS \
  Snapshot,$ACTIONS_ADDRESS \
  Wager,$ACTIONS_ADDRESS \
  Pact,$ACTIONS_ADDRESS \
  Round,$ACTIONS_ADDRESS

echo ">>> Minter auth..."
sozo -P $PROFILE auth grant --world $WORLD_ADDRESS --wait writer \
  TokenConfig,$MINTER_ADDRESS \

echo ">>> Duelists auth..."
sozo -P $PROFILE auth grant --world $WORLD_ADDRESS --wait writer \
  InitializableModel,$DUELISTS_ADDRESS \
  SRC5Model,$DUELISTS_ADDRESS \
  ERC721MetaModel,$DUELISTS_ADDRESS \
  ERC721OperatorApprovalModel,$DUELISTS_ADDRESS \
  ERC721TokenApprovalModel,$DUELISTS_ADDRESS \
  ERC721BalanceModel,$DUELISTS_ADDRESS \
  ERC721EnumerableIndexModel,$DUELISTS_ADDRESS \
  ERC721EnumerableOwnerIndexModel,$DUELISTS_ADDRESS \
  ERC721EnumerableOwnerTokenModel,$DUELISTS_ADDRESS \
  ERC721EnumerableTokenModel,$DUELISTS_ADDRESS \
  ERC721EnumerableTotalModel,$DUELISTS_ADDRESS \
  ERC721OwnerModel,$DUELISTS_ADDRESS \

# Mocked Lords
if [[ ! -z "$LORDS_MOCK" ]]; then
  echo ">>> Mock Lords auth..."
  sozo -P $PROFILE auth grant --world $WORLD_ADDRESS --wait writer \
    ERC20MetadataModel,$LORDS_ADDRESS \
    ERC20BalanceModel,$LORDS_ADDRESS \
    ERC20AllowanceModel,$LORDS_ADDRESS \
    InitializableModel,$LORDS_ADDRESS

  echo ">>> Initializing Mock Lords..."
  INITIALIZED=$(sozo --profile $PROFILE call --world $WORLD_ADDRESS $LORDS_ADDRESS is_initialized)
  if [[ $INITIALIZED == *"0x1"* ]]; then
    echo "Already initialized"
  else
    sozo --profile $PROFILE execute --world $WORLD_ADDRESS --wait $LORDS_ADDRESS initializer || true
  fi
fi

# execute ref: https://book.dojoengine.org/toolchain/sozo/world-commands/execute
echo ">>> Initializing Game World..."
INITIALIZED=$(sozo --profile $PROFILE call --world $WORLD_ADDRESS $ADMIN_ADDRESS is_initialized)
if [[ $INITIALIZED == *"0x1"* ]]; then
  echo "Already initialized"
else
  sozo --profile $PROFILE execute --world $WORLD_ADDRESS --wait $ADMIN_ADDRESS initialize --calldata 0x0,0x0,$LORDS_ADDRESS,$DUELISTS_ADDRESS,$MINTER_ADDRESS || true
fi

echo "👍"
