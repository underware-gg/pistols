# set -euo pipefail
# source scripts/setup.sh

#
# needs:
# npm install -g get-graphql-schema
#

export TORII_URL="https://api.cartridge.gg/x/pistols-sepolia/torii/graphql"

echo "> GraphQL shema from: $TORII_URL"

get-graphql-schema "$TORII_URL" > ../../client/src/games/pistols/generated/schema.graphql
