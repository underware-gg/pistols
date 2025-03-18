#!/bin/bash
set -euo pipefail
source scripts/setup.sh

# move down to /dojo
pushd $(dirname "$0")/..

if [[ "$ACCOUNT_ADDRESS" != "0x"* ]]; then
  echo "! Bad account 👎"
  exit 1
fi

# sozo execute --world <WORLD_ADDRESS> <CONTRACT> <ENTRYPOINT>
sozo -P $PROFILE execute --world $WORLD_ADDRESS --wait game create_trophies
