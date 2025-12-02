#!/bin/bash
set -e # exit on error

export NETWORK="mainnet"

export MANIFEST_FILE_PATH="../manifest_$NETWORK.json"
export SCARB_PROJECT_PATH="../dojo"

get_contract_class_hash () {
  local CONTRACT_NAME=$1
  local RESULT=$(cat $MANIFEST_FILE_PATH | jq -r ".contracts[] | select(.tag == \"pistols-$CONTRACT_NAME\" ).class_hash")
  if [[ -z "$RESULT" ]]; then # if not set
    >&2 echo "get_contract_class_hash($CONTRACT_NAME) not found! 👎"
  fi
  echo $RESULT
}

execute_command () {
  local COMMAND=$1
  echo "🚦 execute: $COMMAND"
  $COMMAND
}

verify_contract () {
  # voyager verify --help
  # exit 1

  # find contract address
  local CONTRACT_NAME=$1
  export CLASS_HASH=$(get_contract_class_hash "$CONTRACT_NAME")
  echo ">>> [$CONTRACT_NAME] class_hash:[$CLASS_HASH]"
  if [[ -z "$CLASS_HASH" ]]; then # if not set
    echo "❌ Missing class hash! 👎"
    exit 1
  fi
  
  # verify
  execute_command "voyager verify --network $NETWORK --contract-name $CONTRACT_NAME --class-hash $CLASS_HASH --path $SCARB_PROJECT_PATH --license CC0-1.0 --lock-file --watch --verbose"


  # verify
  # export EXECUTE_RESULT=$(execute_command "voyager verify --network $NETWORK --contract-name $CONTRACT_NAME --class-hash $CLASS_HASH --path $SCARB_PROJECT_PATH --license CC0-1.0")
  # echo "$EXECUTE_RESULT\n"
  # export JOB_ID=$(echo $EXECUTE_RESULT | cut -d ':' -f 2 | xargs)
  # if [[ -z "$JOB_ID" ]]; then # if not set
  #   echo "❌ Missing job ID! 👎"
  #   exit 1
  # fi
  # # wait...
  # echo "[$CONTRACT_NAME] waiting... job_id:$JOB_ID"
  # execute_command "voyager status --network $NETWORK --job $JOB_ID"
}

#-----------------
# verify
#
voyager --version
verify_contract "game" # verified 2025-11-04
verify_contract "game_loop" # verified 2025-11-04
verify_contract "tutorial" # verified 2025-11-04
verify_contract "admin" # verified 2025-11-04
# verify_contract "bank"
# verify_contract "fame_coin" # verified 2025-11-04
# verify_contract "fools_coin" # verified 2025-11-04
verify_contract "duel_token" # verified 2025-11-04
# verify_contract "duelist_token" # verified 2025-11-04
verify_contract "pack_token" # verified 2025-11-04

