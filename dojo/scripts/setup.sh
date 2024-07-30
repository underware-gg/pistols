# Profile
if [ $# -ge 1 ]; then
  export PROFILE=$1
else
  export PROFILE="dev"
fi

if ! [ -x "$(command -v toml)" ]; then
  echo 'Error: toml not instlaled! Instal with: cargo install toml-cli'
  exit 1
fi

get_profile_env () {
  local ENV_NAME=$1
  local RESULT=$(toml get Scarb.toml --raw profile.$PROFILE.tool.dojo.env.$ENV_NAME)
  if [[ -z "$RESULT" ]]; then
    local RESULT=$(toml get Scarb.toml --raw tool.dojo.env.$ENV_NAME)
    if [[ -z "$RESULT" ]]; then
      >&2 echo "get_profile_env($ENV_NAME) not found! 👎"
    fi
  fi
  echo $RESULT
}

#-----------------
# env setup
#
export GAME_SLUG="pistols"
export PROJECT_NAME=$(toml get Scarb.toml --raw tool.dojo.world.name)
export WORLD_ADDRESS=$(get_profile_env "world_address")
# use $DOJO_ACCOUNT_ADDRESS else read from profile
export ACCOUNT_ADDRESS=${DOJO_ACCOUNT_ADDRESS:-$(get_profile_env "account_address")}

export MANIFEST_FILE_PATH="./manifests/$PROFILE/deployment/manifest.json"
export BINDINGS_PATH="./bindings/typescript"
export CLIENT_GEN_PATH="../client/src/games/$GAME_SLUG/generated"
export PROFILE_GEN_PATH="$CLIENT_GEN_PATH/$PROFILE"
# use $STARKNET_RPC_URL else read from profile
export RPC_URL=${STARKNET_RPC_URL:-$(get_profile_env "rpc_url")}

# echo "------------------------------------------------------------------------------"
# echo "PROJECT: $PROJECT_NAME"
# echo "PROFILE: $PROFILE"
# echo "RPC_URL: $RPC_URL"
# echo "WORLD_ADDRESS: $WORLD_ADDRESS"
# echo "CLIENT_GEN_PATH: $CLIENT_GEN_PATH"
# echo "PROFILE_GEN_PATH: $PROFILE_GEN_PATH"
# echo "BINDINGS_PATH: $BINDINGS_PATH"
# echo ""
