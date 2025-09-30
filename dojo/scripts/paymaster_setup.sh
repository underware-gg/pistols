#!/bin/bash
set -euo pipefail

# add policy from presets
slot paymaster pistols policy add-from-preset --name pistols

# ADMIN functions
slot paymaster pistols policy add --contract 0x0610423526de7adfd8c18bd027111fcb7d1bc0de329f28fb651a34752273328a --entrypoint set_paused
slot paymaster pistols policy add --contract 0x0610423526de7adfd8c18bd027111fcb7d1bc0de329f28fb651a34752273328a --entrypoint set_treasury
slot paymaster pistols policy add --contract 0x0610423526de7adfd8c18bd027111fcb7d1bc0de329f28fb651a34752273328a --entrypoint set_is_team_member
slot paymaster pistols policy add --contract 0x0610423526de7adfd8c18bd027111fcb7d1bc0de329f28fb651a34752273328a --entrypoint set_is_blocked
slot paymaster pistols policy add --contract 0x0610423526de7adfd8c18bd027111fcb7d1bc0de329f28fb651a34752273328a --entrypoint disqualify_duelist
slot paymaster pistols policy add --contract 0x0610423526de7adfd8c18bd027111fcb7d1bc0de329f28fb651a34752273328a --entrypoint qualify_duelist
slot paymaster pistols policy add --contract 0x0610423526de7adfd8c18bd027111fcb7d1bc0de329f28fb651a34752273328a --entrypoint fix_player_bookmark
slot paymaster pistols policy add --contract 0x0610423526de7adfd8c18bd027111fcb7d1bc0de329f28fb651a34752273328a --entrypoint urgent_update

# add LORDS approve
slot paymaster pistols policy add --contract 0x0124aeb495b947201f5fac96fd1138e326ad86195b98df6dec9009158a533b49 --entrypoint approve
