
#-------------------
# validate arguments
#
if [ $# -lt 1 ]; then
  echo "❌ Error: Missing profile!"
  echo "usage: $0 <PROFILE> [--scarb] [--offline] [--inspect] [--bindings] [--verbose]"
  exit 1
fi

# initialize argument variables
export SOZO=sozo
export PROFILE=
export ARG_BINDINGS=
export ARG_OFFLINE=
export ARG_INSPECT=
export ARG_VERBOSE=

# parse arguments
for arg in "$@"
do
  echo ":$arg"
  if [[ -z "$PROFILE" ]]; then # if not set
    # $1: Profile
    export PROFILE=$1
    export DOJO_PROFILE_FILE="../dojo_$PROFILE.toml"
    if [ ! -f $DOJO_PROFILE_FILE ]; then
      echo "❌ Error: Missing profile config file: $DOJO_PROFILE_FILE"
      exit 1
    fi
  elif [[ $arg == "--offline" ]]; then
    export ARG_OFFLINE="--offline"
  elif [[ $arg == "--inspect" ]]; then
    export ARG_INSPECT="--stats.by-tag"
  elif [[ $arg == "--bindings" ]]; then
    if [[ "$PROFILE" == "dev" ]]; then
      export ARG_BINDINGS="--typescript"
    else
      echo "⚠️ Warning: --bindings is only supported for dev profile"
    fi
  elif [[ $arg == "--verbose" ]]; then
    export ARG_VERBOSE="-vvv"
  elif [[ $arg == "--scarb" ]]; then
    export SOZO="scarb"
  else
    echo "❌ Error: Invalid argument: $arg"
    exit 1
  fi
done


#-----------------
# check tools
#
if ! [ -x "$(command -v toml)" ]; then
  echo '❌ Error: toml not installed!'
  echo 'Instal with: cargo install toml-cli'
  exit 1
fi
if ! [ -x "$(command -v starkli)" ]; then
  echo '❌ Error: starkli not installed!'
  echo 'Instal with: curl https://get.starkli.sh | sh'
  exit 1
fi


#-----------------
# helper functions
#

get_profile_env () {
  local ENV_NAME=$1
  local RESULT=$(toml get $DOJO_PROFILE_FILE --raw env.$ENV_NAME)
  if [[ -z "$RESULT" ]]; then # if not set
    >&2 echo "get_profile_env($ENV_NAME) not found! 👎"
  fi
  echo $RESULT
}

get_contract_address () {
  local TAG=$1
  local RESULT=$(cat $MANIFEST_FILE_PATH | jq -r ".contracts[] | select(.tag == \"$TAG\" ).address")
  if [[ -z "$RESULT" ]]; then # if not set
    >&2 echo "get_contract_address($TAG) not found! 👎"
  fi
  echo $RESULT
}

execute_command () {
  local COMMAND=$1
  echo "🚦 execute: $COMMAND"
  $COMMAND
}


#-----------------
# env setup
#
export GAME_SLUG="pistols"
export PROJECT_NAME=$(toml get $DOJO_PROFILE_FILE --raw world.name)
export WORLD_ADDRESS=$(get_profile_env "world_address")
export WORLD_BLOCK=$(get_profile_env "world_block")
export LORDS_ADDRESS=$(get_profile_env "lords_address")
export TORII_CONFIG_TEMPLATE_PATH="./torii_TEMPLATE.toml"
export TORII_CONFIG_PATH="./torii_$PROFILE.toml"
# use $DOJO_ACCOUNT_ADDRESS else read from profile
export ACCOUNT_ADDRESS=${DOJO_ACCOUNT_ADDRESS:-$(get_profile_env "account_address")}
# use $STARKNET_RPC_URL else read from profile
export RPC_URL=${STARKNET_RPC_URL:-$(get_profile_env "rpc_url")}

export MANIFEST_FILE_PATH="../manifest_$PROFILE.json"
export BINDINGS_PATH="./bindings"
export SDK_GAME_PATH="../sdk/src/games/$GAME_SLUG"
export SDK_MANIFEST_PATH="$SDK_GAME_PATH/config/manifests"

# contracts
export ADMIN_ADDRESS=$(get_contract_address "pistols-admin")
export GAME_ADDRESS=$(get_contract_address "pistols-game")

# match rpc chain id with profile
export CHAIN_ID=$(starkli chain-id --no-decode --rpc $RPC_URL | xxd -r -p)
export PROFILE_CHAIN_ID=$(get_profile_env "chain_id")

if [[ -z "$ARG_OFFLINE" ]]; then # if not set
  if [[ "$PROFILE_CHAIN_ID" != "$CHAIN_ID" ]]; then
    echo "PROFILE CHAIN ID: [$PROFILE_CHAIN_ID]"
    echo "RPC CHAIN ID: [$CHAIN_ID]"
    echo "❌ Chain mismatch! 👎"
    exit 1
  fi
fi


echo "------------------------------------------------------------------------------"
echo "Profile    : $PROFILE"
echo "Project    : $PROJECT_NAME"
echo "RPC Url    : $RPC_URL"
echo "Chain Id   : $CHAIN_ID"
echo "World      : $WORLD_ADDRESS"
echo "Account    : $ACCOUNT_ADDRESS"
echo "LORDS      : $LORDS_ADDRESS"
# echo "::game     : $GAME_ADDRESS"
# echo "::admin    : $ADMIN_ADDRESS"
# echo "::duels    : $DUEL_TOKEN_ADDRESS"
# echo "::duelists : $DUELIST_TOKEN_ADDRESS"
echo "Torii CFG  : $TORII_CONFIG_PATH"
echo "------------------------------------------------------------------------------"
