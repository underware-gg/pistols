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

# # admin::set_treasury
# # admin::set_realms_address
# # https://github.com/BibliothecaDAO/lordship-stREALMS/blob/96c3185b88408a129823ceb92d83f30b77055ff4/veLords/README.md?plain=1#L13
# sozo -P $PROFILE execute --world $WORLD_ADDRESS --wait admin set_treasury 0x57994b6a75fad550ca18b41ee82e2110e158c59028c4478109a67965a0e5b1e
# sozo -P $PROFILE execute --world $WORLD_ADDRESS --wait admin set_realms_address 0x045c587318c9ebcf2fbe21febf288ee2e3597a21cd48676005a5770a50d433c5
# sozo -P $PROFILE model get pistols-Config 1

# {
#     key             : 1,
#     treasury_address: 0x057994b6a75fad550ca18b41ee82e2110e158c59028c4478109a67965a0e5b1e,
#     lords_address   : 0x044e6bcc627e6201ce09f781d1aae44ea4c21c2fdef299e34fce55bef2d02210,
#     vrf_address     : 0x051fea4450da9d6aee758bdeba88b2f665bcbf549d2c61421aa724e9ac0ced8f,
#     current_season_id: 5,
#     is_paused       : 1,
#     realms_address  : 0x045c587318c9ebcf2fbe21febf288ee2e3597a21cd48676005a5770a50d433c5
# }

# # FIX!!!
# sozo -P $PROFILE execute --world $WORLD_ADDRESS --wait admin set_treasury 0x029211ae4f53126082017b1C69B7d9D7CCBA2bA3bc67710884B4Bf55d79Ef8F4
# sozo -P $PROFILE execute --world $WORLD_ADDRESS --wait admin set_realms_address 0x045c587318c9ebcf2fbe21febf288ee2e3597a21cd48676005a5770a50d433c5
# sozo -P $PROFILE model get pistols-Config 1

# {
#     key             : 1,
#     treasury_address: 0x029211ae4f53126082017b1c69b7d9d7ccba2ba3bc67710884b4bf55d79ef8f4,
#     lords_address   : 0x044e6bcc627e6201ce09f781d1aae44ea4c21c2fdef299e34fce55bef2d02210,
#     vrf_address     : 0x051fea4450da9d6aee758bdeba88b2f665bcbf549d2c61421aa724e9ac0ced8f,
#     current_season_id: 5,
#     is_paused       : 1,
#     realms_address  : 0x045c587318c9ebcf2fbe21febf288ee2e3597a21cd48676005a5770a50d433c5
# }


# #------------------------------------------------------------------------------
# # POOLS
# # 
# sozo -P $PROFILE execute --world $WORLD_ADDRESS --wait admin velords_migrate_pools
# sozo -P sepolia model get pistols-Pool 1
# sozo -P sepolia model get pistols-Pool 2

# {
#     pool_id         : PoolType::Purchases,
#     balance_lords   : 0x000000000000001c30731cec03200000,
#     balance_fame    : 0x00000000000000000000000000000000
# }
# {
#     pool_id         : PoolType::FamePeg,
#     balance_lords   : 0x0000000000000203cd87352a5026ad75,
#     balance_fame    : 0x0000000000025ac34466ea94c50aaaa9
# }


# #------------------------------------------------------------------------------
# # PACKS
# # 
# # SELECT pack_id, lords_amount, pegged_lords_amount
# # FROM "pistols-Pack"
# # where is_open=0
# #
# export PACK_IDS="\
# 0x008e,\
# 0x0087,\
# 0x008a,\
# 0x008f,\
# 0x00ac,\
# 0x00b0,\
# 0x00ad,\
# 0x00ae,\
# 0x00af,\
# 0x00b1,\
# 0x00b4,\
# 0x00b9,\
# 0x00ba,\
# 0x00c5,\
# 0x00cf,\
# 0x00d2,\
# 0x00c9,\
# 0x00ce,\
# 0x00cd,\
# 0x00d4,\
# 0x00d3,\
# 0x00d5,\
# 0x00c8,\
# 0x00cc,\
# 0x00cb,\
# 0x00d0,\
# 0x00d1,\
# 0x00f0,\
# 0x00f2,\
# 0x00f1,\
# 0x00f5,\
# 0x00ff,\
# 0x0100"
# sozo -P $PROFILE execute --world $WORLD_ADDRESS --wait admin velords_migrate_packs arr:$PACK_IDS



# #------------------------------------------------------------------------------
# # CHALLENGES
# # 
# # SELECT duel_id, duel_type, state, season_id
# # FROM "pistols-Challenge"
# # where duel_type="Ranked"
# # and season_id=0
# # --and (state="InProgress" OR state="Awaiting")
# #
# export DUEL_IDS="\
# 0x006c,\
# 0x0096,\
# 0x0097,\
# 0x0099"
# sozo -P $PROFILE execute --world $WORLD_ADDRESS --wait admin velords_migrate_ranked_challenges arr:$DUEL_IDS


# #------------------------------------------------------------------------------
# # DUELISTS
# # 
# # SELECT duelist_id, queue_id
# # FROM "pistols-DuelistAssignment"
# # where queue_id="Ranked"
# #
# export DUELIST_IDS="\
# 0x01d8,\
# 0x0277,\
# 0x027a,\
# 0x0290,\
# 0x028f,\
# 0x028e,\
# 0x028c,\
# 0x0353,\
# 0x028d,\
# 0x0133,\
# 0x0134,\
# 0x0329,\
# 0x0351,\
# 0x012e,\
# 0x012f,\
# 0x0138,\
# 0x0136,\
# 0x034a,\
# 0x037a,\
# 0x037b,\
# 0x0376,\
# 0x037c,\
# 0x0384,\
# 0x03ae,\
# 0x03ad,\
# 0x03b2,\
# 0x03b5"
# sozo -P $PROFILE execute --world $WORLD_ADDRESS --wait admin velords_migrate_ranked_duelists arr:$DUELIST_IDS

