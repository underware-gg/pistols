#!/bin/bash
set -euo pipefail
pushd $(dirname "$0")/..

export RPC_URL="http://localhost:5050"

export WORLD_ADDRESS=$(cat ./target/dev/manifest.json | jq -r '.world.address')
export ACTIONS_ADDRESS=$(cat ./target/dev/manifest.json | jq -r '.contracts[] | select(.name == "pistols::systems::actions::actions" ).address')

echo "---------------------------------------------------------------------------"
echo "auth writer"
echo "world   : $WORLD_ADDRESS"
echo "actions : $ACTIONS_ADDRESS"
echo "RPC     : $RPC_URL"
echo "---------------------------------------------------------------------------"

# enable system -> component authorizations
COMPONENTS=("Duelist" "Challenge" "Pact" "Move" "Round")

for component in ${COMPONENTS[@]}; do
  sozo auth writer --world $WORLD_ADDRESS --rpc-url $RPC_URL $component $ACTIONS_ADDRESS
  # SLOT
  # sozo auth writer --world $WORLD_ADDRESS --rpc-url https://api.cartridge.gg/x/pistols/katana $component 0x78af18db6887ee0eb2b339f95619e88b65aa47c7025ad42dc81c7be43b631ff --account-address 0x3de8cead289fe145cfea143ac58ced6c83e518a758469df850e5c37445c95ae
done

echo "Default authorizations have been successfully set."
