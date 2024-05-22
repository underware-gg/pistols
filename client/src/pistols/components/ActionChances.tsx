import React, { useMemo } from 'react'
import { Grid } from 'semantic-ui-react'
import { useDojoAccount } from '@/lib/dojo/DojoContext'
import { useSimulateChances, useCalcHonourForAction } from '@/pistols/hooks/useContractCalls'
import { useDuel } from '@/pistols/hooks/useDuel'
import { Action } from '@/pistols/utils/pistols'
import ProgressBar from '@/pistols/components/ui/ProgressBar'

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
  const _honourValue = (action_honour > 0 ? action_honour : isA ? round1?.shot_a.honour : isB ? round1?.shot_b.honour : null) ?? 0
  const _honourWarning = (action_honour == 10)
  const _honourNegative = (action_honour == 1)
  console.log(`HONOUR:`, action_honour, _honourValue)
  return (
    <>
      <ProgressBar disabled={!action} label={hit_bonus ? <span>{executionLabel} / <span className='Warning'>Bonus</span>:</span> : `${executionLabel}:`} percent={_critChances} includedExtraPercent={hit_bonus} className='ChancesBar' />
      <ProgressBar disabled={!action} label={lethal_chances ? <span>Hit / <span className='Warning'>Lethal</span>:</span> : 'Hit:'} percent={hit_chances} includedInnerPercent={lethal_chances} className='ChancesBar' />
      <ProgressBar disabled={!action} label='Honour:' value={_honourValue} total={10} className='ChancesBar' warning={_honourWarning} negative={_honourNegative} color={action_honour == 0 ? 'grey' : null} />

      <p className=' AlignCenter'>&nbsp;
        {hit_bonus > 0 && <>(Includes Honourable <b>{hit_bonus}%</b> crit bonus)</>}
        {hit_bonus === 0 && <>Keep your Honour <b>{'>'} 9.0</b> for a crit bonus</>}
      </p>
    </>
  )
}
