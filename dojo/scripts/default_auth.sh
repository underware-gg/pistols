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
COMPONENTS=("Duelist" "Challenge" "Pact" "Duel")

for component in ${COMPONENTS[@]}; do
  sozo auth writer --world $WORLD_ADDRESS --rpc-url $RPC_URL $component $ACTIONS_ADDRESS
  # SLOT
  # sozo auth writer --world $WORLD_ADDRESS --rpc-url https://api.cartridge.gg/x/pistols/katana $component 0x78af18db6887ee0eb2b339f95619e88b65aa47c7025ad42dc81c7be43b631ff --account-address 0x355df606ef197ceacb60212996047efbef81828f918c8490ac950802dd602b5
done

echo "Default authorizations have been successfully set."
