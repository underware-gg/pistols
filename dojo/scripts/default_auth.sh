#!/bin/bash
set -euo pipefail
pushd $(dirname "$0")/..

if ! [ -x "$(command -v toml)" ]; then
  echo 'Error: toml not instlaled! Instal with: cargo install toml-cli'
  exit 1
fi

# Profile
if [ $# -ge 1 ]; then
    export PROFILE=$1
else
    export PROFILE="dev"
fi

export MANIFEST_FILE_PATH="./manifests/$PROFILE/manifest.json"
export RPC_URL=$(toml get Scarb.toml --raw profile.$PROFILE.tool.dojo.env.rpc_url)
export WORLD_ADDRESS=$(toml get Scarb.toml --raw tool.dojo.env.world_address)
export ADMIN_ADDRESS=$(cat $MANIFEST_FILE_PATH | jq -r '.contracts[] | select(.name == "pistols::systems::admin::admin" ).address')
export ACTIONS_ADDRESS=$(cat $MANIFEST_FILE_PATH | jq -r '.contracts[] | select(.name == "pistols::systems::actions::actions" ).address')

# Use mocked Lords if lords_address not defined in Scarb
export LORDS_ADDRESS=$(toml get Scarb.toml --raw profile.$PROFILE.tool.dojo.env.lords_address)
if [[ -z "$LORDS_ADDRESS" ]]; then
  echo "* using mock \$LORDS 👑"
  export LORDS_ADDRESS=$(cat $MANIFEST_FILE_PATH | jq -r '.contracts[] | select(.name == "pistols::mocks::lords_mock::lords_mock" ).address')
  export LORDS_MOCK="Yes"
fi

echo "------------------------------------------------------------------------------"
echo "Profile     : $PROFILE"
echo "RPC         : $RPC_URL"
echo "Manifest    : $MANIFEST_FILE_PATH"
echo "WORLD       : $WORLD_ADDRESS"
echo "::admin     : $ADMIN_ADDRESS"
echo "::actions   : $ACTIONS_ADDRESS"
echo "\$LORDS      : $LORDS_ADDRESS"
echo "\$LORDS Mock : $LORDS_MOCK"
echo "------------------------------------------------------------------------------"

if [[
  -z "$PROFILE" ||
  -z "$RPC_URL" || # for testing profile
  -z "$MANIFEST_FILE_PATH" ||
  "$WORLD_ADDRESS" != "0x"* ||
  "$ADMIN_ADDRESS" != "0x"* ||
  "$ACTIONS_ADDRESS" != "0x"* ||
  "$LORDS_ADDRESS" != "0x"*
]]; then
  echo "! Missing data 👎"
  exit 1
fi

# auth ref: https://book.dojoengine.org/toolchain/sozo/world-commands/auth
echo "* Admin auth..."
sozo -P $PROFILE auth grant --world $WORLD_ADDRESS --wait writer \
  Config,$ADMIN_ADDRESS \
  Coin,$ADMIN_ADDRESS

echo "* Game auth..."
sozo -P $PROFILE auth grant --world $WORLD_ADDRESS --wait writer \
  Duelist,$ACTIONS_ADDRESS \
  Challenge,$ACTIONS_ADDRESS \
  Wager,$ACTIONS_ADDRESS \
  Pact,$ACTIONS_ADDRESS \
  Round,$ACTIONS_ADDRESS

# Mocked Lords
if [[ ! -z "$LORDS_MOCK" ]]; then
  echo "* Mock Lords auth..."
  sozo -P $PROFILE auth grant --world $WORLD_ADDRESS --wait writer \
    ERC20MetadataModel,$LORDS_ADDRESS \
    ERC20BalanceModel,$LORDS_ADDRESS \
    ERC20AllowanceModel,$LORDS_ADDRESS \
    InitializableModel,$LORDS_ADDRESS

  echo "* Initializing Mock Lords..."
  sozo --profile $PROFILE execute --world $WORLD_ADDRESS --wait $LORDS_ADDRESS initializer > /dev/null || true
fi

# execute ref: https://book.dojoengine.org/toolchain/sozo/world-commands/execute
echo "* Initializing Game World..."
sozo --profile $PROFILE execute --world $WORLD_ADDRESS --wait $ADMIN_ADDRESS initialize --calldata 0x0,0x0,$LORDS_ADDRESS > /dev/null || true

echo "* All set! 👍"
