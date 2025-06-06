#!/bin/bash
set -e # exit on error

export NETWORK="mainnet"

export MANIFEST_FILE_PATH="../../dojo/manifest_$NETWORK.json"
export SCARB_PROJECT_PATH="../../dojo"

get_contract_class_hash () {
  local CONTRACT_NAME=$1
  local RESULT=$(cat $MANIFEST_FILE_PATH | jq -r ".contracts[] | select(.tag == \"pistols-$CONTRACT_NAME\" ).class_hash")
  if [[ -z "$RESULT" ]]; then # if not set
    >&2 echo "get_contract_class_hash($CONTRACT_NAME) not found! 👎"
  fi
  echo $RESULT
}

verify_contract () {
  # find contract address
  local CONTRACT_NAME=$1
  export CLASS_HASH=$(get_contract_class_hash "$CONTRACT_NAME")
  echo "[$CONTRACT_NAME] submitting... class_hash:$CLASS_HASH"
  # verify
  export EXECUTE_RESULT=$(cargo run -- --network $NETWORK submit --contract "$CONTRACT_NAME" --hash "$CLASS_HASH" --path "$SCARB_PROJECT_PATH" --execute)
  export JOB_ID=$(echo $EXECUTE_RESULT | cut -d ':' -f 2 | xargs)
  echo "[$CONTRACT_NAME] waiting... job_id:$JOB_ID"
  cargo run -- --network $NETWORK status --job "$JOB_ID"
}

#-----------------
# verify
#
cd starknet-contract-verifier
verify_contract "game"
# verify_contract "game_loop"
# verify_contract "tutorial"
# verify_contract "admin"
# verify_contract "bank"
# verify_contract "fame_coin"
# verify_contract "fools_coin"
# verify_contract "duel_token"
# verify_contract "duelist_token"
# verify_contract "pack_token"

