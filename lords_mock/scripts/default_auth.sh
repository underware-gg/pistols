#!/bin/bash
set -euo pipefail
pushd $(dirname "$0")/..

if [ $# -ge 1 ]; then
    export PROFILE=$1
else
    export PROFILE="dev"
fi

TX_SLEEP=0.2

export RPC_URL=$(toml get Scarb.toml --raw tool.dojo.env.rpc_url)
export WORLD_ADDRESS=$(cat ./target/dev/manifest.json | jq -r '.world.address')
export LORDS_MOCK_ADDRESS=$(cat ./target/dev/manifest.json | jq -r '.contracts[] | select(.name == "lords_mock::lords_mock::lords_mock" ).address')
export ACCOUNT_ADDRESS=$(toml get Scarb.toml --raw tool.dojo.env.account_address)
export COMPONENTS=("ERC20MetadataModel" "ERC20BalanceModel" "ERC20AllowanceModel" "ERC20BridgeableModel")

echo "---------------------------------------------------------------------------"
echo RPC        : $RPC_URL
echo profile    : $PROFILE
echo world      : $WORLD_ADDRESS
echo lords mock : $LORDS_MOCK_ADDRESS
echo components : ${COMPONENTS[*]}
echo "---------------------------------------------------------------------------"

# Dojo 0.6.0
# sozo -P $PROFILE auth grant --world $WORLD_ADDRESS --wait writer \
#  ERC20MetadataModel,$LORDS_MOCK_ADDRESS \
#  ERC20BalanceModel,$LORDS_MOCK_ADDRESS \
#  ERC20AllowanceModel,$LORDS_MOCK_ADDRESS \
#  ERC20BridgeableModel,$LORDS_MOCK_ADDRESS \
#  > /dev/null

# Dojo 0.5.1
for component in ${COMPONENTS[@]}; do
  sozo auth writer --world $WORLD_ADDRESS --rpc-url $RPC_URL $component $LORDS_MOCK_ADDRESS --account-address $ACCOUNT_ADDRESS
  sleep $TX_SLEEP
done

echo "Default authorizations have been successfully set."

echo "Initializing..."
# Dojo 0.6.0
# sozo -P $PROFILE execute  --world $WORLD_ADDRESS $LORDS_MOCK_ADDRESS initializer --wait > /dev/null
# Dojo 0.5.1
sozo -P $PROFILE execute $LORDS_MOCK_ADDRESS initializer --wait > /dev/null || true
sleep $TX_SLEEP
