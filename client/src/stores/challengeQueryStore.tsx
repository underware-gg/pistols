import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { useCallToActions } from './eventsModelStore'
import { usePlayer, getPlayerName } from '/src/stores/playerStore'
import { ChallengeColumn, SortDirection } from '/src/stores/queryParamsStore'
import { PistolsEntity } from '@underware/pistols-sdk/pistols/sdk'
import { constants, models } from '@underware/pistols-sdk/pistols/gen'
import { bigintEquals, isPositiveBigint } from '@underware/pistols-sdk/utils'
import { parseEnumVariant } from '@underware/pistols-sdk/starknet'
import { keysToEntityId, getEntityModel, useAllStoreModels } from '@underware/pistols-sdk/dojo'
import { useChallengeStore } from '/src/stores/challengeStore'


//--------------------------------
// SQL query hooks
// use SQL to find Duel IDs and add to challengeStore
//




