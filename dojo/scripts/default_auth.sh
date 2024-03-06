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

export LORDS_ADDRESS=$(toml get Scarb.toml --raw tool.dojo.env.lords_address)
if [[ -z "$LORDS_ADDRESS" ]]; then
  echo "* use mocked \$LORDS 👑"
  export LORDS_ADDRESS=$(cat ../lords_mock/target/dev/manifest.json | jq -r '.contracts[] | select(.name == "lords_mock::lords_mock::lords_mock" ).address')
fi

export ADMIN_COMPONENTS=("Config")
export GAME_COMPONENTS=("Duelist" "Challenge" "Pact" "Shot" "Round")

echo "------------------------------------------------------------------------------"
echo "sozo auth writer"
echo "RPC        : $RPC_URL"
echo "account    : $ACCOUNT_ADDRESS"
echo "world      : $WORLD_ADDRESS"
echo "admin      : $ADMIN_ADDRESS"
echo "actions    : $ACTIONS_ADDRESS"
echo "admin comps: ${ADMIN_COMPONENTS[*]}"
echo "game comps : ${GAME_COMPONENTS[*]}"
echo "\$LORDS     : $LORDS_ADDRESS"
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

echo "* Initializing..."
sozo execute $ADMIN_ADDRESS initialize --calldata $LORDS_ADDRESS
sleep $TX_SLEEP

echo "* All set! 👍"
