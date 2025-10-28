#!/bin/bash
set -euo pipefail
source scripts/setup.sh

# move down to /dojo
pushd $(dirname "$0")/..

if [[ "$PROFILE" != "mainnet" ]]; then
  echo "! Not mainnet!!👎"
  exit 1
fi
if [[ "$CHAIN_ID" != "SN_MAIN" ]]; then
  echo "! Not SN_MAIN!!👎"
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
# echo ">>> config wallets..."
# sozo -P $PROFILE execute --world $WORLD_ADDRESS --wait admin set_treasury 0x029211ae4f53126082017b1C69B7d9D7CCBA2bA3bc67710884B4Bf55d79Ef8F4
# sozo -P $PROFILE execute --world $WORLD_ADDRESS --wait admin set_realms_address 0x045c587318c9ebcf2fbe21febf288ee2e3597a21cd48676005a5770a50d433c5
# sozo -P $PROFILE model get pistols-Config 1

# {
#     key             : 1,
#     treasury_address: 0x029211ae4f53126082017b1c69b7d9d7ccba2ba3bc67710884b4bf55d79ef8f4,
#     lords_address   : 0x0124aeb495b947201f5fac96fd1138e326ad86195b98df6dec9009158a533b49,
#     vrf_address     : 0x051fea4450da9d6aee758bdeba88b2f665bcbf549d2c61421aa724e9ac0ced8f,
#     current_season_id: 13,
#     is_paused       : 1,
#     realms_address  : 0x045c587318c9ebcf2fbe21febf288ee2e3597a21cd48676005a5770a50d433c5
# }


# #------------------------------------------------------------------------------
# # POOLS
# # 
# sozo -P $PROFILE execute --world $WORLD_ADDRESS --wait admin velords_migrate_pools
# sozo -P mainnet model get pistols-Pool 1
# sozo -P mainnet model get pistols-Pool 2

# # {
# #     pool_id         : PoolType::Purchases,
# #     balance_lords   : 0x000000000000008cf23f909c0fa00000,
# #     balance_fame    : 0x00000000000000000000000000000000
# # }
# # {
# #     pool_id         : PoolType::FamePeg,
# #     balance_lords   : 0x00000000000008219661ddc9a883b3ac,
# #     balance_fame    : 0x0000000000098205721e8d5ae751e471
# # }


# #------------------------------------------------------------------------------
# # PACKS
# # 
# # SELECT pack_id, lords_amount, pegged_lords_amount
# # FROM "pistols-Pack"
# # where is_open=0
# #
# export PACK_IDS="\
# 0x006a,\
# 0x0061,\
# 0x0066,\
# 0x0064,\
# 0x006c,\
# 0x0070,\
# 0x0060,\
# 0x0069,\
# 0x0073,\
# 0x0068,\
# 0x006b,\
# 0x0052,\
# 0x006d,\
# 0x0062,\
# 0x0067,\
# 0x0050,\
# 0x005e,\
# 0x006e,\
# 0x0055,\
# 0x006f,\
# 0x0065,\
# 0x0063,\
# 0x0071,\
# 0x005f,\
# 0x0051,\
# 0x00dc,\
# 0x00db,\
# 0x00d9,\
# 0x010f,\
# 0x0152,\
# 0x014d,\
# 0x014e,\
# 0x0144,\
# 0x0151,\
# 0x0150,\
# 0x0153,\
# 0x0143,\
# 0x0140,\
# 0x013f,\
# 0x0142,\
# 0x0141,\
# 0x015a,\
# 0x015e,\
# 0x016b,\
# 0x0154,\
# 0x0161,\
# 0x015c,\
# 0x015f,\
# 0x0162,\
# 0x016a,\
# 0x015b,\
# 0x0155,\
# 0x0160,\
# 0x016c,\
# 0x016f,\
# 0x0156,\
# 0x015d,\
# 0x0158,\
# 0x0157,\
# 0x0159,\
# 0x0183,\
# 0x017c,\
# 0x0245,\
# 0x0282,\
# 0x02ff,\
# 0x0332,\
# 0x03ab,\
# 0x051d,\
# 0x0598,\
# 0x05f3,\
# 0x05f0,\
# 0x05ec,\
# 0x0609,\
# 0x0622,\
# 0x062b,\
# 0x0632,\
# 0x0638,\
# 0x0636,\
# 0x0635,\
# 0x0634,\
# 0x0633,\
# 0x0641,\
# 0x0649,\
# 0x065d,\
# 0x065c,\
# 0x066b,\
# 0x0670,\
# 0x0677,\
# 0x066f,\
# 0x0671,\
# 0x0673,\
# 0x066e,\
# 0x0684,\
# 0x0698,\
# 0x06d0,\
# 0x06e3,\
# 0x06e6,\
# 0x06e5,\
# 0x06e7,\
# 0x06ff,\
# 0x06f7,\
# 0x0702,\
# 0x0700,\
# 0x06f8,\
# 0x0701,\
# 0x0709,\
# 0x0717,\
# 0x071c,\
# 0x0720,\
# 0x0729,\
# 0x072a,\
# 0x0728,\
# 0x072b,\
# 0x073a,\
# 0x0739,\
# 0x0742,\
# 0x0741,\
# 0x073f,\
# 0x0740,\
# 0x0750,\
# 0x076a,\
# 0x0785,\
# 0x0791,\
# 0x0793,\
# 0x079e,\
# 0x079f,\
# 0x07a4,\
# 0x07a3,\
# 0x07a2,\
# 0x07a5,\
# 0x07a8,\
# 0x07a9,\
# 0x07b4,\
# 0x07b5,\
# 0x07b6,\
# 0x07b7,\
# 0x07b8,\
# 0x07b9,\
# 0x07cd,\
# 0x07d4,\
# 0x07dd,\
# 0x07df,\
# 0x07de,\
# 0x07e2,\
# 0x07e0,\
# 0x07e1,\
# 0x07e4,\
# 0x07e7,\
# 0x07e6,\
# 0x07e5,\
# 0x07eb,\
# 0x07ec,\
# 0x07ea,\
# 0x07f3,\
# 0x07f6,\
# 0x07f7,\
# 0x07f8,\
# 0x07f9,\
# 0x07fb,\
# 0x0801,\
# 0x07ff,\
# 0x0800,\
# 0x0803,\
# 0x0802"
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
# 0x2540,\
# 0x2549,\
# 0x25c6,\
# 0x260d,\
# 0x2617,\
# 0x261b,\
# 0x261f,\
# 0x2625,\
# 0x2626"
# sozo -P $PROFILE execute --world $WORLD_ADDRESS --wait admin velords_migrate_ranked_challenges arr:$DUEL_IDS


# #------------------------------------------------------------------------------
# # DUELISTS
# # 
# # SELECT duelist_id, queue_id
# # FROM "pistols-DuelistAssignment"
# # where queue_id="Ranked"
# #
# export DUELIST_IDS_0="0x057f"
# export DUELIST_IDS_1="\
# 0x07da,\
# 0x0954,\
# 0x0955,\
# 0x0594,\
# 0x11ca,\
# 0x11c8,\
# 0x12a5,\
# 0x12f6,\
# 0x126b,\
# 0x122c,\
# 0x0817,\
# 0x126f,\
# 0x11f8,\
# 0x13d3,\
# 0x1272,\
# 0x1348,\
# 0x15a3,\
# 0x149a,\
# 0x15ca,\
# 0x15d1,\
# 0x15a9,\
# 0x15f3,\
# 0x15f9,\
# 0x1577,\
# 0x1541,\
# 0x1535,\
# 0x15fa,\
# 0x1611,\
# 0x1614,\
# 0x1654,\
# 0x1629,\
# 0x1656,\
# 0x1653,\
# 0x162b,\
# 0x1655,\
# 0x1671,\
# 0x165c,\
# 0x13c9,\
# 0x165d,\
# 0x122d,\
# 0x165f,\
# 0x165e,\
# 0x1608,\
# 0x167b,\
# 0x1607,\
# 0x1658,\
# 0x167f,\
# 0x15a1,\
# 0x1565,\
# 0x16ae,\
# 0x15fc,\
# 0x16b8,\
# 0x16ba,\
# 0x16b7,\
# 0x16aa,\
# 0x16c9,\
# 0x16ca,\
# 0x16c8,\
# 0x16cb,\
# 0x16cf,\
# 0x16dd,\
# 0x16c0,\
# 0x15d6,\
# 0x16e9,\
# 0x14ab,\
# 0x130f,\
# 0x133f,\
# 0x156a,\
# 0x156b,\
# 0x131e,\
# 0x131b,\
# 0x11a5,\
# 0x1711,\
# 0x1712,\
# 0x1710,\
# 0x159c,\
# 0x159b,\
# 0x1537,\
# 0x1225,\
# 0x171a,\
# 0x1719,\
# 0x171b,\
# 0x13e0,\
# 0x1627,\
# 0x1702,\
# 0x1703,\
# 0x1706,\
# 0x171d,\
# 0x0ae0,\
# 0x1139,\
# 0x16d8,\
# 0x16d7,\
# 0x16c5,\
# 0x1728,\
# 0x1727,\
# 0x1729,\
# 0x16dc,\
# 0x16d2,\
# 0x16ce"
# export DUELIST_IDS_2="\
# 0x16d0,\
# 0x170e,\
# 0x16ac,\
# 0x170f,\
# 0x16db,\
# 0x13d9,\
# 0x0afc,\
# 0x1664,\
# 0x1713,\
# 0x1745,\
# 0x0953,\
# 0x0952,\
# 0x1749,\
# 0x174a,\
# 0x1694,\
# 0x1693,\
# 0x1691,\
# 0x168d,\
# 0x168e,\
# 0x15ec,\
# 0x16cc,\
# 0x157a,\
# 0x173c,\
# 0x1707,\
# 0x124b,\
# 0x1567,\
# 0x16f6,\
# 0x16f7,\
# 0x1704,\
# 0x13e1,\
# 0x1726,\
# 0x1705,\
# 0x1756,\
# 0x1579,\
# 0x03af,\
# 0x03ac,\
# 0x03ae,\
# 0x13cb,\
# 0x153b,\
# 0x173b,\
# 0x1779,\
# 0x1778,\
# 0x173d,\
# 0x177b,\
# 0x1366,\
# 0x177d,\
# 0x178d,\
# 0x16ee,\
# 0x1568,\
# 0x14b1,\
# 0x177c,\
# 0x126e,\
# 0x136b,\
# 0x1227,\
# 0x17ac,\
# 0x17a9,\
# 0x17a8,\
# 0x17aa,\
# 0x17ad,\
# 0x17ae,\
# 0x17ab,\
# 0x17a7,\
# 0x17a6,\
# 0x17a5,\
# 0x1542,\
# 0x0b7b,\
# 0x16ad,\
# 0x16f8,\
# 0x1793,\
# 0x1794,\
# 0x17ba,\
# 0x17bc,\
# 0x17b8,\
# 0x1782,\
# 0x15f6,\
# 0x177e,\
# 0x17d2,\
# 0x17cb,\
# 0x17cd,\
# 0x17ce,\
# 0x17d1,\
# 0x17d3,\
# 0x17cf,\
# 0x17d9,\
# 0x17da,\
# 0x17d5,\
# 0x17e6,\
# 0x17d6,\
# 0x17ef,\
# 0x17e8,\
# 0x17e7,\
# 0x17ec,\
# 0x1786,\
# 0x1785,\
# 0x17f0,\
# 0x17ee,\
# 0x17e2,\
# 0x1784,\
# 0x1783,\
# 0x17d0,\
# 0x17d4,\
# 0x17db,\
# 0x17e9,\
# 0x17ea,\
# 0x17b9,\
# 0x1606,\
# 0x17f5"
# # sozo -P $PROFILE execute --world $WORLD_ADDRESS --wait admin velords_migrate_ranked_duelists arr:$DUELIST_IDS_0
# # sozo -P $PROFILE execute --world $WORLD_ADDRESS --wait admin velords_migrate_ranked_duelists arr:$DUELIST_IDS_1
# # sozo -P $PROFILE execute --world $WORLD_ADDRESS --wait admin velords_migrate_ranked_duelists arr:$DUELIST_IDS_2



# #------------------------------------------------------------------------------
# # DUELISTS 2 FIX
# # 
# # SELECT duelist_id, queue_id
# # FROM "pistols-DuelistAssignment"
# # where queue_id="Ranked"
# #
# export DUELIST_IDS_0="0x057f"
# export DUELIST_IDS_1="\
# 0x16dc,\
# 0x16cb,\
# 0x16c9,\
# 0x1541,\
# 0x16cf,\
# 0x1348,\
# 0x165f,\
# 0x16ce,\
# 0x16c0,\
# 0x133f,\
# 0x16b7,\
# 0x16d8,\
# 0x1577,\
# 0x0954,\
# 0x15f3,\
# 0x167b,\
# 0x159b,\
# 0x1710,\
# 0x1225,\
# 0x16ba,\
# 0x149a,\
# 0x165c,\
# 0x15a1,\
# 0x0594,\
# 0x16d2,\
# 0x16ca,\
# 0x167f,\
# 0x159c,\
# 0x17bc,\
# 0x17d0,\
# 0x17a6,\
# 0x136b,\
# 0x17b9,\
# 0x1691,\
# 0x03af,\
# 0x17a9,\
# 0x1794,\
# 0x03ac,\
# 0x124b,\
# 0x17ac,\
# 0x174a,\
# 0x17a8,\
# 0x17e8,\
# 0x1606,\
# 0x17d9,\
# 0x0952,\
# 0x1749,\
# 0x177d,\
# 0x1745,\
# 0x0b7b,\
# 0x1713,\
# 0x03ae,\
# 0x17ae,\
# 0x17ab,\
# 0x17ec,\
# 0x1793,\
# 0x17d5,\
# 0x17ad,\
# 0x157a,\
# 0x17d4,\
# 0x17aa,\
# 0x170e,\
# 0x16db,\
# 0x17a7,\
# 0x17f5,\
# 0x1778,\
# 0x0953,\
# 0x1366,\
# 0x16ee,\
# 0x15ec,\
# 0x178d,\
# 0x17ba,\
# 0x17ea,\
# 0x173d,\
# 0x168d,\
# 0x168e,\
# 0x1779,\
# 0x1786,\
# 0x170f,\
# 0x1694,\
# 0x17a5,\
# 0x16d0,\
# 0x1784,\
# 0x16cc,\
# 0x17e9,\
# 0x17db,\
# 0x1693"
# sozo -P $PROFILE execute --world $WORLD_ADDRESS --wait admin velords_migrate_ranked_duelists_2 arr:$DUELIST_IDS_0
# # sozo -P $PROFILE execute --world $WORLD_ADDRESS --wait admin velords_migrate_ranked_duelists_2 arr:$DUELIST_IDS_1




# #------------------------------------------------------------------------------
# # POOLS 2
# # 
# sozo -P $PROFILE execute --world $WORLD_ADDRESS --wait admin velords_migrate_pools_2
# sozo -P mainnet model get pistols-Pool 1
# sozo -P mainnet model get pistols-Pool 2

# # {
# #     pool_id         : PoolType::Purchases,
# #     balance_lords   : 0x000000000000008bdcb14a92fbd00000,
# #     balance_fame    : 0x00000000000000000000000000000000
# # }
# # {
# #     pool_id         : PoolType::FamePeg,
# #     balance_lords   : 0x000000000000045a2e0120ed621209b9,
# #     balance_fame    : 0x0000000000091bcf213db09799249147
# # }
