# Profile
if [ $# -ge 1 ]; then
  export PROFILE=$1
else
  # export PROFILE="dev"
  echo "basic usage: $0 <PROFILE>"
  exit 1
fi
export DOJO_PROFILE_FILE="dojo_$PROFILE.toml"

if ! [ -x "$(command -v toml)" ]; then
  echo 'Error: toml not instlaled! Instal with: cargo install toml-cli'
  exit 1
fi

get_profile_env () {
  local ENV_NAME=$1
  local RESULT=$(toml get $DOJO_PROFILE_FILE --raw env.$ENV_NAME)
  if [[ -z "$RESULT" ]]; then
    >&2 echo "get_profile_env($ENV_NAME) not found! 👎"
  fi
  echo $RESULT
}

get_contract_address () {
  local TAG=$1
  local RESULT=$(cat $MANIFEST_FILE_PATH | jq -r ".contracts[] | select(.tag == \"$TAG\" ).address")
  if [[ -z "$RESULT" ]]; then
    >&2 echo "get_contract_address($TAG) not found! 👎"
  fi
  echo $RESULT
}

#-----------------
# env setup
#
export GAME_SLUG="pistols"
export PROJECT_NAME=$(toml get $DOJO_PROFILE_FILE --raw world.name)
export WORLD_ADDRESS=$(get_profile_env "world_address")
export TORII_CONFIG_PATH="./torii.toml"
# use $DOJO_ACCOUNT_ADDRESS else read from profile
export ACCOUNT_ADDRESS=${DOJO_ACCOUNT_ADDRESS:-$(get_profile_env "account_address")}
# use $STARKNET_RPC_URL else read from profile
export RPC_URL=${STARKNET_RPC_URL:-$(get_profile_env "rpc_url")}

export MANIFEST_FILE_PATH="./manifest_$PROFILE.json"
export BINDINGS_PATH="./bindings"
export CLIENT_GAME_PATH="../client/src/games/$GAME_SLUG"
export CLIENT_MANIFEST_PATH="$CLIENT_GAME_PATH/manifests"

# contracts
export ADMIN_ADDRESS=$(get_contract_address "pistols-admin")
export GAME_ADDRESS=$(get_contract_address "pistols-game")

# match rpc chain id with profile
export CHAIN_ID=$(starkli chain-id --no-decode --rpc $RPC_URL | xxd -r -p)
export PROFILE_CHAIN_ID=$(get_profile_env "chain_id")

if [[ "$PROFILE_CHAIN_ID" != "$CHAIN_ID" ]]; then
  echo "PROFILE CHAIN ID: [$PROFILE_CHAIN_ID]"
  echo "RPC CHAIN ID: [$CHAIN_ID]"
  echo "Chain mismatch! 👎"
  exit 1
fi


echo "------------------------------------------------------------------------------"
echo "Profile    : $PROFILE"
echo "Project    : $PROJECT_NAME"
echo "PC Url     : $RPC_URL"
echo "Chain Id   : $CHAIN_ID"
echo "World      : $WORLD_ADDRESS"
echo "Account    : $ACCOUNT_ADDRESS"
# echo "::game     : $GAME_ADDRESS"
# echo "::admin    : $ADMIN_ADDRESS"
# echo "::duels    : $DUEL_TOKEN_ADDRESS"
# echo "::duelists : $DUELIST_TOKEN_ADDRESS"
echo "Torii CFG  : $TORII_CONFIG_PATH"
echo "------------------------------------------------------------------------------"
