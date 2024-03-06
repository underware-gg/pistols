#!/bin/bash
set -euo pipefail
pushd $(dirname "$0")/..

if [ $# -ge 1 ]; then
    export PROFILE=$1
else
    export PROFILE="dev"
fi

TX_SLEEP=0.5

export WORLD_ADDRESS=$(cat ./target/dev/manifest.json | jq -r '.world.address')
export LORDS_MOCK_ADDRESS=$(cat ./target/dev/manifest.json | jq -r '.contracts[] | select(.name == "lords_mock::lords_mock::lords_mock" ).address')

echo "---------------------------------------------------------------------------"
echo profile    : $PROFILE
echo "---------------------------------------------------------------------------"
echo world      : $WORLD_ADDRESS
echo "---------------------------------------------------------------------------"
echo lords mock : $LORDS_MOCK_ADDRESS
echo "---------------------------------------------------------------------------"

sozo -P $PROFILE auth grant --world $WORLD_ADDRESS --wait writer \
 ERC20MetadataModel,$LORDS_MOCK_ADDRESS \
 ERC20BalanceModel,$LORDS_MOCK_ADDRESS \
 ERC20AllowanceModel,$LORDS_MOCK_ADDRESS \
 ERC20BridgeableModel,$LORDS_MOCK_ADDRESS \
 > /dev/null

echo "Default authorizations have been successfully set."

echo "Initializing..."
sozo -P $PROFILE execute  --world $WORLD_ADDRESS $LORDS_MOCK_ADDRESS initializer --wait > /dev/null
echo "Initialized LORDS MOCK!"
sleep $TX_SLEEP
