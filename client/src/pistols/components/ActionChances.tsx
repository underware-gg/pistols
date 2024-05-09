import React, { useMemo } from 'react'
import { Grid } from 'semantic-ui-react'
import { useDojoAccount } from '@/lib/dojo/DojoContext'
import { useCalcHitBonus, useCalcCritChances, useCalcHitChances, useCalcCriticalChances, useCalcHonourForAction } from '@/pistols/hooks/useContractCalls'
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
  const { hitBonus } = useCalcHitBonus(accountAddress)
  const { hitChances } = useCalcHitChances(accountAddress, duelId, roundNumber, action)
  const { critChances } = useCalcCritChances(accountAddress, duelId, roundNumber, action)
  const { criticalChances } = useCalcCriticalChances(accountAddress, duelId, roundNumber, action)
  const { honourForAction } = useCalcHonourForAction(accountAddress, action, 0)
  const { critChances: otherCritChances } = useCalcCritChances(isA ? duelistB : duelistA, duelId, roundNumber, Action.Strong)

  const executionLabel = useMemo(() => {
    if ([Action.Flee, Action.Steal, Action.Seppuku].includes(action)) {
      return 'Success'
    } else if ([Action.Fast, Action.Block].includes(action)) {
      return 'Crit'
    } else {
      return 'Execution'
    }
  }, [action])

  const _critChances = critChances == 100 ? (critChances - otherCritChances) : critChances
  const _honourValue = (honourForAction > 0 ? honourForAction : isA ? round1?.shot_a.honour : isB ? round1?.shot_b.honour : null) ?? 0
  const _honourWarning = (honourForAction == 10)
  const _honourNegative = (honourForAction == 1)
  return (
    <>
      <ProgressBar disabled={!action} label={hitBonus ? <span>{executionLabel} / <span className='Warning'>Bonus</span>:</span> : `${executionLabel}:`} percent={_critChances} includedBonusPercent={hitBonus} className='ChancesBar' />
      <ProgressBar disabled={!action} label={criticalChances ? <span>Hit / <span className='Warning'>Critical</span>:</span> : 'Hit:'} percent={hitChances} includedBonusPercent={criticalChances} className='ChancesBar' />
      <ProgressBar disabled={!action} label='Honour:' value={_honourValue} total={10} className='ChancesBar' warning={_honourWarning} negative={_honourNegative} color={honourForAction == 0 ? 'grey' : null} />

      <p className=' AlignCenter'>&nbsp;
        {hitBonus > 0 && <>(Includes Honourable <b>{hitBonus}%</b> crit bonus)</>}
        {hitBonus === 0 && <>Keep your Honour <b>{'>'} 9.0</b> for a crit bonus</>}
      </p>
    </>
  )
}
