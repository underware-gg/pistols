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

export MANIFEST_FILE_PATH="./manifests/$PROFILE/manifest.json"
export WORLD_ADDRESS=$(toml get Scarb.toml --raw profile.$PROFILE.tool.dojo.env.world_address)
export ADMIN_ADDRESS=$(cat $MANIFEST_FILE_PATH | jq -r '.contracts[] | select(.name == "pistols::systems::admin::admin" ).address')
export ACTIONS_ADDRESS=$(cat $MANIFEST_FILE_PATH | jq -r '.contracts[] | select(.name == "pistols::systems::actions::actions" ).address')
# use $DOJO_ACCOUNT_ADDRESS else read from profile
export ACCOUNT_ADDRESS=${DOJO_ACCOUNT_ADDRESS:-$(toml get Scarb.toml --raw profile.$PROFILE.tool.dojo.env.account_address)}



# Use mocked Lords if lords_address not defined in Scarb
export LORDS_MOCK=
export LORDS_ADDRESS=$(toml get Scarb.toml --raw profile.$PROFILE.tool.dojo.env.lords_address)
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
  "$LORDS_ADDRESS" != "0x"*
]]; then
  echo "! Missing data 👎"
  exit 1
fi

# auth ref: https://book.dojoengine.org/toolchain/sozo/world-commands/auth
echo "- Admin auth..."
sozo -P $PROFILE auth grant --world $WORLD_ADDRESS --wait writer \
  Config,$ADMIN_ADDRESS \
  TTable,$ADMIN_ADDRESS

echo "- Game auth..."
sozo -P $PROFILE auth grant --world $WORLD_ADDRESS --wait writer \
  Duelist,$ACTIONS_ADDRESS \
  Scoreboard,$ACTIONS_ADDRESS \
  Challenge,$ACTIONS_ADDRESS \
  Snapshot,$ACTIONS_ADDRESS \
  Wager,$ACTIONS_ADDRESS \
  Pact,$ACTIONS_ADDRESS \
  Round,$ACTIONS_ADDRESS

# Mocked Lords
if [[ ! -z "$LORDS_MOCK" ]]; then
  echo "- Mock Lords auth..."
  sozo -P $PROFILE auth grant --world $WORLD_ADDRESS --wait writer \
    ERC20MetadataModel,$LORDS_ADDRESS \
    ERC20BalanceModel,$LORDS_ADDRESS \
    ERC20AllowanceModel,$LORDS_ADDRESS \
    InitializableModel,$LORDS_ADDRESS

  echo "- Initializing Mock Lords..."
  INITIALIZED=$(sozo --profile $PROFILE call --world $WORLD_ADDRESS $LORDS_ADDRESS is_initialized)
  if [[ $INITIALIZED == *"0x1"* ]]; then
    echo "Already initialized"
  else
    sozo --profile $PROFILE execute --world $WORLD_ADDRESS --wait $LORDS_ADDRESS initializer || true
  fi
fi

# execute ref: https://book.dojoengine.org/toolchain/sozo/world-commands/execute
echo "- Initializing Game World..."
INITIALIZED=$(sozo --profile $PROFILE call --world $WORLD_ADDRESS $ADMIN_ADDRESS is_initialized)
if [[ $INITIALIZED == *"0x1"* ]]; then
    echo "Already initialized"
else
  sozo --profile $PROFILE execute --world $WORLD_ADDRESS --wait $ADMIN_ADDRESS initialize --calldata 0x0,0x0,$LORDS_ADDRESS || true
fi

echo "--- Auth ok! 👍"
