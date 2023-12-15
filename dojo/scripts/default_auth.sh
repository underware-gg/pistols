#!/bin/bash
set -euo pipefail
pushd $(dirname "$0")/..

export RPC_URL="http://localhost:5050"

export WORLD_ADDRESS=$(cat ./target/dev/manifest.json | jq -r '.world.address')
export ACTIONS_ADDRESS=$(cat ./target/dev/manifest.json | jq -r '.contracts[] | select(.name == "actions" ).address')

echo "---------------------------------------------------------------------------"
echo "auth writer"
echo "world   : $WORLD_ADDRESS"
echo "actions : $ACTIONS_ADDRESS"
echo "RPC     : $RPC_URL"
echo "---------------------------------------------------------------------------"

# enable system -> component authorizations
COMPONENTS=("Duelist" "Duel")

for component in ${COMPONENTS[@]}; do
    sozo auth writer $component $ACTIONS_ADDRESS --world $WORLD_ADDRESS --rpc-url $RPC_URL
    # SLOT
    # sozo auth writer $component 0x3da4bf86342c340fd1dd590cd5505248af77006db7d74912ac50d7e7374496b --world $WORLD_ADDRESS --rpc-url https://api.cartridge.gg/x/underdark/katana --account-address 0x35d0cdaf12e6816f4a1a5c074befbddd08abf61bbea87765342289b48b4bc16
done

echo "Default authorizations have been successfully set."
