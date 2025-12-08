# set -euo pipefail
# source scripts/setup.sh

#
# needs:
# npm install -g get-graphql-schema
#

# export TORII_URL="https://api.cartridge.gg/x/pistols-sepolia/torii/graphql"
export TORII_URL="http://127.0.0.1:8080/graphql"

echo "> GraphQL shema from: $TORII_URL"

get-graphql-schema "$TORII_URL" > ../../sdk/src/games/pistols/generated/schema.graphql
