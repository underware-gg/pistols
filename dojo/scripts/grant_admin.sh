#!/bin/bash
set -euo pipefail
source scripts/setup.sh

if [ "$#" -ne 3 ]; then
  echo "usage: grant_admin <PROFILE> <ACCOUNT> <0|1>"
  exit 1
fi

export ACCOUNT=$2
export GRANT=$3

echo "------------------------------------------------------------------------------"
echo "Profile  : $PROFILE"
echo "Account  : $ACCOUNT"
echo "Grant    : $GRANT"

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
    model:pistols-TokenConfig,$ACCOUNT
else
  echo "* GRANTING admin powers to $ACCOUNT..."
  sozo -P $PROFILE auth grant --world $WORLD_ADDRESS --wait writer \
    model:pistols-Config,$ACCOUNT \
    model:pistols-TableConfig,$ACCOUNT \
    model:pistols-TokenConfig,$ACCOUNT
fi

