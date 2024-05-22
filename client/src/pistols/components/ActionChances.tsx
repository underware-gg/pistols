import React, { useMemo } from 'react'
import { Grid } from 'semantic-ui-react'
import { useDojoAccount } from '@/lib/dojo/DojoContext'
import { useSimulateChances, useCalcHonourForAction } from '@/pistols/hooks/useContractCalls'
import { useDuel } from '@/pistols/hooks/useDuel'
import { Action } from '@/pistols/utils/pistols'
import ProgressBar from '@/pistols/components/ui/ProgressBar'
import { ProfileBadge } from './account/ProfileDescription'
import { constants } from '../utils/constants'

const Row = Grid.Row
const Col = Grid.Column

export function ActionChances({
  duelId,
  roundNumber,
  action,
  isA = false,
  isB = false,
}) {
  const { accountAddress } = useDojoAccount()
  const { challenge: { duelistA, duelistB }, round1 } = useDuel(duelId)
  const {
    crit_chances,
    crit_bonus,
    hit_chances,
    hit_bonus,
    lethal_chances,
    lethal_bonus,
  } = useSimulateChances(accountAddress, duelId, roundNumber, action)
  const { action_honour, duelist_honour } = useCalcHonourForAction(accountAddress, action, 0)
  const { crit_chances: other_crit_chances } = useSimulateChances(isA ? duelistB : duelistA, duelId, roundNumber, Action.Strong)
  // console.log(`CHANCES:`, crit_chances, crit_bonus, hit_chances, hit_bonus, lethal_chances, lethal_bonus)

  const executionLabel = useMemo(() => {
    if ([Action.Flee, Action.Steal, Action.Seppuku].includes(action)) {
      return 'Success'
    } else if ([Action.Fast, Action.Block].includes(action)) {
      return 'Crit'
    } else {
      return 'Execution'
    }
  }, [action])

  const _critChances = crit_chances == 100 ? (crit_chances - other_crit_chances) : crit_chances
  const _honourValue = (action_honour >= 0 ? action_honour : isA ? round1?.shot_a.honour : isB ? round1?.shot_b.honour : null) ?? 0
  // console.log(`HONOUR:`, action_honour, _honourValue)
  return (
    <>
      <ProgressBar disabled={!action}
        label={`${executionLabel}:`}
        percent={_critChances}
        includedExtraPercent={crit_bonus}
      />
      <ProgressBar disabled={!action}
        label={lethal_chances ? <span>Hit / <span className='Warning'>Lethal</span>:</span> : 'Hit:'}
        percent={hit_chances}
        includedInnerPercent={lethal_chances}
      />
      <ProgressBar disabled={!action} label='Honour:'
        value={_honourValue} total={10}
        negative={action_honour >= 0 && action_honour < constants.TRICKSTER_START}
        warning={action_honour >= constants.LORD_START}
        neutral={action_honour < 0}
      />

      <br />
      <div className='H5 AlignCenter'>
        {(crit_chances > 0 && crit_bonus > 0) && <div>(Includes <ProfileBadge address={accountAddress} /> <b>{crit_bonus}% Crit Bonus</b>)</div>}
        {(hit_chances > 0 && hit_bonus > 0) && <div>(Includes <ProfileBadge address={accountAddress} /> <b>{hit_bonus}% Hit Bonus</b> )</div>}
        {(lethal_chances > 0 && lethal_bonus > 0) && <div>(Includes <ProfileBadge address={accountAddress} /> <b>{lethal_bonus}% Lethal Bonus</b> )</div>}
      </div>
    </>
  )
}
