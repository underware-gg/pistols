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

# admin::set_paused
# sozo -P $PROFILE execute --world $WORLD_ADDRESS --wait admin set_paused 1
# sozo -P $PROFILE model get pistols-Config 1

# admin::set_treasury
# sozo -P $PROFILE execute --world $WORLD_ADDRESS --wait admin set_treasury 0x04D92577856263bDe8E7601Ee189b6dbe52aCb879462489B92c0789f6c157E6c
# sozo -P $PROFILE model get pistols-Config 1

# admin::set_is_team_member
# export MEMBER_ACCOUNT=0x0550212d3f13a373dfe9e3ef6aa41fba4124bde63fd7955393f879de19f3f47f
# sozo -P $PROFILE execute --world $WORLD_ADDRESS --wait admin set_is_team_member $MEMBER_ACCOUNT 1 1
# sozo -P $PROFILE model get pistols-PlayerTeamFlags $MEMBER_ACCOUNT

# admin::set_is_blocked
# export PLAYER_ACCOUNT=0x1234
# sozo -P $PROFILE execute --world $WORLD_ADDRESS --wait admin set_is_blocked $PLAYER_ACCOUNT 1
# sozo -P $PROFILE model get pistols-PlayerFlags $PLAYER_ACCOUNT

# admin::disqualify_duelist
# export SEASON_ID=1
# export DUELIST_ID=457
# export BLOCK_DUELIST=0
# sozo -P $PROFILE execute --world $WORLD_ADDRESS --wait admin disqualify_duelist $SEASON_ID $DUELIST_ID $BLOCK_DUELIST

# admin::qualify_duelist
# export SEASON_ID=1
# export DUELIST_ID=457
# sozo -P $PROFILE execute --world $WORLD_ADDRESS --wait admin qualify_duelist $SEASON_ID $DUELIST_ID

# admin::urgent_update
# sozo -P $PROFILE execute --world $WORLD_ADDRESS --wait admin urgent_update
# sozo -P $PROFILE model get pistols-Config 1

# admin::fix_player_bookmark
# sozo -P $PROFILE execute --world $WORLD_ADDRESS --wait admin fix_player_bookmark 0x550212d3f13a373dfe9e3ef6aa41fba4124bde63fd7955393f879de19f3f47f 0x7e268203c670265e8af497a201d568947db4087438c7fdac2be3b956de73811 0x0 1
# sozo -P $PROFILE execute --world $WORLD_ADDRESS --wait admin fix_player_bookmark 0x550212d3f13a373dfe9e3ef6aa41fba4124bde63fd7955393f879de19f3f47f 0x2e9c711b1a7e2784570b1bda5082a92606044e836ba392d2b977d280fb74b3c 0x2e 1
# sozo -P $PROFILE execute --world $WORLD_ADDRESS --wait admin fix_player_bookmark 0x550212d3f13a373dfe9e3ef6aa41fba4124bde63fd7955393f879de19f3f47f 0x2e9c711b1a7e2784570b1bda5082a92606044e836ba392d2b977d280fb74b3c 0x1e 1
# sozo -P $PROFILE execute --world $WORLD_ADDRESS --wait admin fix_player_bookmark 0x550212d3f13a373dfe9e3ef6aa41fba4124bde63fd7955393f879de19f3f47f 0x2e9c711b1a7e2784570b1bda5082a92606044e836ba392d2b977d280fb74b3c 0x2c 1
# sozo -P $PROFILE execute --world $WORLD_ADDRESS --wait admin fix_player_bookmark 0x550212d3f13a373dfe9e3ef6aa41fba4124bde63fd7955393f879de19f3f47f 0x6ed4b727bcb51e12553e40c981936916e897a027450adfa7750573637753f4a 0x0 1
# sozo -P $PROFILE execute --world $WORLD_ADDRESS --wait admin fix_player_bookmark 0x550212d3f13a373dfe9e3ef6aa41fba4124bde63fd7955393f879de19f3f47f 0x5409f66a48dd7b1b078e01f55155f89e5da57e2f31b592d3704b03e0ef03e4 0x0 1
# sozo -P $PROFILE execute --world $WORLD_ADDRESS --wait admin fix_player_bookmark 0x550212d3f13a373dfe9e3ef6aa41fba4124bde63fd7955393f879de19f3f47f 0x458f10bf89dfd916eaeabbf6866870bd5bb8b05c6df7de0ad36bb8ad66dce69 0x0 1
# sozo -P $PROFILE execute --world $WORLD_ADDRESS --wait admin fix_player_bookmark 0x550212d3f13a373dfe9e3ef6aa41fba4124bde63fd7955393f879de19f3f47f 0x0256d696f908f2748efcc6931c1bca88f269394ab80b91c691d7916f04af3d8c 0x0 1


#------------------------------------------------------------------------------
# game::
#

# game::create_trophies
# sozo -P $PROFILE execute --world $WORLD_ADDRESS --wait game create_trophies

