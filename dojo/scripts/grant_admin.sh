#!/bin/bash
set -euo pipefail
source scripts/setup.sh

if [ $# -ge 3 ]; then
  export ACCOUNT=$2
  export GRANT=$3
else
  # export PROFILE="dev"
  echo "usage: $0 <PROFILE> <ACCOUNT> <0|1>"
  exit 1
fi

# move down to /dojo
pushd $(dirname "$0")/..

echo "Account  : $ACCOUNT"
echo "Grant    : $GRANT"
echo "------------------------------------------------------------------------------"

if [[ "$ACCOUNT" != "0x"* ]]; then
  echo "! Bad account 👎"
  exit 1
fi

# sozo execute --world <WORLD_ADDRESS> <CONTRACT> <ENTRYPOINT>
# sozo -P $PROFILE execute --world $WORLD_ADDRESS --wait \
#   admin grant_admin \
#   --calldata $ACCOUNT,$GRANT

if [[ "$GRANT" == "0" ]]; then
  echo "* REVOKING admin powers to $ACCOUNT..."
  sozo -P $PROFILE auth revoke --world $WORLD_ADDRESS --wait writer \
    model:pistols-Config,$ACCOUNT \
    model:pistols-TableConfig,$ACCOUNT \
    model:pistols-TableWager,$ACCOUNT \
    model:pistols-TokenConfig,$ACCOUNT
else
  echo "* GRANTING admin powers to $ACCOUNT..."
  sozo -P $PROFILE auth grant --world $WORLD_ADDRESS --wait writer \
    model:pistols-Config,$ACCOUNT \
    model:pistols-TableConfig,$ACCOUNT \
    model:pistols-TableWager,$ACCOUNT \
    model:pistols-TokenConfig,$ACCOUNT
fi

