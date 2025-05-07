#!/bin/bash
set -euo pipefail
source scripts/setup.sh

# move down to /dojo
pushd $(dirname "$0")/..

if [[ "$ACCOUNT_ADDRESS" != "0x"* ]]; then
  echo "! Bad account 👎"
  exit 1
fi
if [[ "$WORLD_ADDRESS" != "0x"* ]]; then
  echo "! Bad world address 👎"
  exit 1
fi

#
# sozo execute --world <WORLD_ADDRESS> <CONTRACT> <ENTRYPOINT> <CALLDATA>
#


#------------------------------------------------------------------------------
# admin::
# sozo -P mainnet model get pistols-Config 1
#

# admin::urgent_update
# sozo -P $PROFILE execute --world $WORLD_ADDRESS --wait admin urgent_update
# sozo -P $PROFILE model get pistols-Config 1

# admin::set_treasury
# sozo -P $PROFILE execute --world $WORLD_ADDRESS --wait admin set_treasury 0x04D92577856263bDe8E7601Ee189b6dbe52aCb879462489B92c0789f6c157E6c
# sozo -P $PROFILE model get pistols-Config 1



#------------------------------------------------------------------------------
# game::
#

# game::create_trophies
# sozo -P $PROFILE execute --world $WORLD_ADDRESS --wait game create_trophies

