#!/bin/bash
set -euo pipefail
pushd $(dirname "$0")/..

if ! [ -x "$(command -v toml)" ]; then
  echo 'Error: toml not instlaled! Instal with: cargo install toml-cli'
  exit 1
fi

export TX_SLEEP=0.2

export RPC_URL=$(toml get Scarb.toml --raw tool.dojo.env.rpc_url)
export ACCOUNT_ADDRESS=$(toml get Scarb.toml --raw tool.dojo.env.account_address)
export WORLD_ADDRESS=$(toml get Scarb.toml --raw tool.dojo.env.world_address)
export ADMIN_ADDRESS=$(cat ./target/dev/manifest.json | jq -r '.contracts[] | select(.name == "pistols::systems::admin::admin" ).address')
export ACTIONS_ADDRESS=$(cat ./target/dev/manifest.json | jq -r '.contracts[] | select(.name == "pistols::systems::actions::actions" ).address')

export ADMIN_COMPONENTS=("Config", "Coin")
export GAME_COMPONENTS=("Duelist" "Challenge" "Wager" "Pact" "Shot" "Round")

# Use mocked Lords if lords_address not defined in Scarb
export LORDS_ADDRESS=$(toml get Scarb.toml --raw tool.dojo.env.lords_address)
if [[ -z "$LORDS_ADDRESS" ]]; then
  echo "* using mock \$LORDS 👑"
  export LORDS_ADDRESS=$(cat ./target/dev/manifest.json | jq -r '.contracts[] | select(.name == "pistols::mocks::lords_mock::lords_mock" ).address')
  export LORDS_COMPONENTS=("ERC20MetadataModel" "ERC20BalanceModel" "ERC20AllowanceModel" "ERC20BridgeableModel")
fi

echo "------------------------------------------------------------------------------"
echo "sozo auth writer"
echo "RPC        : $RPC_URL"
echo "account    : $ACCOUNT_ADDRESS"
echo "world      : $WORLD_ADDRESS"
echo "admin      : $ADMIN_ADDRESS"
echo "actions    : $ACTIONS_ADDRESS"
echo "\$LORDS     : $LORDS_ADDRESS"
echo "admin comps: ${ADMIN_COMPONENTS[*]}"
echo "game comps : ${GAME_COMPONENTS[*]}"
echo "lords comps: ${LORDS_COMPONENTS[*]}"
echo "------------------------------------------------------------------------------"

echo "* Game auth..."
for component in ${GAME_COMPONENTS[@]}; do
  sozo auth writer --world $WORLD_ADDRESS --rpc-url $RPC_URL $component $ACTIONS_ADDRESS --account-address $ACCOUNT_ADDRESS
  sleep $TX_SLEEP
done

echo "* Admin auth..."
for component in ${ADMIN_COMPONENTS[@]}; do
  sozo auth writer --world $WORLD_ADDRESS --rpc-url $RPC_URL $component $ADMIN_ADDRESS --account-address $ACCOUNT_ADDRESS
  sleep $TX_SLEEP
done

# Mocked Lords
if [[ ! -z "$LORDS_COMPONENTS" ]]; then
  echo "* Mock Lords auth..."
  for component in ${LORDS_COMPONENTS[@]}; do
    sozo auth writer --world $WORLD_ADDRESS --rpc-url $RPC_URL $component $LORDS_ADDRESS --account-address $ACCOUNT_ADDRESS
    sleep $TX_SLEEP
  done
  
  echo "* Initializing Mock Lords..."
  sozo execute $LORDS_ADDRESS initializer > /dev/null || true
  sleep $TX_SLEEP
fi

echo "* Initializing Game World..."
sozo execute $ADMIN_ADDRESS initialize --calldata 0x0,0x0,$LORDS_ADDRESS > /dev/null || true
sleep $TX_SLEEP

echo "* All set! 👍"
