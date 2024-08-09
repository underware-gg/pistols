#!/bin/bash
set -euo pipefail
source scripts/setup.sh

if [ "$#" -ne 3 ]; then
  echo "usage: set_owner <PROFILE> <ACCOUNT> <0|1>"
  exit 1
fi

export ACCOUNT=$2
export GRANT=$3

echo "------------------------------------------------------------------------------"
echo "Profile  : $PROFILE"
echo "Account  : $ACCOUNT"
echo "Grant    : $GRANT"

# sozo execute --world <WORLD_ADDRESS> <CONTRACT> <ENTRYPOINT>
sozo -P $PROFILE execute --world $WORLD_ADDRESS --wait \
  admin set_owner \
  --calldata $ACCOUNT,$GRANT
