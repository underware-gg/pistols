#!/bin/bash
set -euo pipefail
source scripts/setup.sh

# move down to /dojo
pushd $(dirname "$0")/..

if [[ "$PROFILE" != "sepolia" ]]; then
  echo "! Not sepolia!!👎"
  exit 1
fi
if [[ "$CHAIN_ID" != "SN_SEPOLIA" ]]; then
  echo "! Not SN_SEPOLIA!!👎"
  exit 1
fi

if [[ "$ACCOUNT_ADDRESS" != "0x"* ]]; then
  echo "! Bad account 👎"
  exit 1
fi
if [[ "$WORLD_ADDRESS" != "0x"* ]]; then
  echo "! Bad world address 👎"
  exit 1
fi


#------------------------------------------------------------------------------
# admin::
# select * from "event_messages_historical" where data like "%LeaderboardPrize%"
#
export SEASON_ID=1
export DUELIST_IDS="\
0x00f1,\
0x0100"
export POINTS="\
110,\
100"
export PLAYER_ADDRESSES="\
0x00f1,\
0x00f5"
export LORDS_AMOUNT="\
10_000,\
1_000"
sozo -P $PROFILE execute --world $WORLD_ADDRESS --wait admin emit_past_season_leaderboard_event $SEASON_ID array:$DUELIST_IDS array:$POINTS array:$PLAYER_ADDRESSES array:$LORDS_AMOUNT

