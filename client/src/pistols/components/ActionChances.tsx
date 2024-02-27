import React, { useMemo } from 'react'
import { Grid } from 'semantic-ui-react'
import { useDojoAccount } from '@/dojo/DojoContext'
import { useCalcHitBonus, useCalcCritChances, useCalcHitChances, useCalcGlanceChances, useCalcHonourForAction } from '@/pistols/hooks/useContractCalls'
import { useDuel } from '@/pistols/hooks/useDuel'
import { Blades } from '@/pistols/utils/pistols'
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
  const { account } = useDojoAccount()
  const { hitBonus } = useCalcHitBonus(BigInt(account.address))
  const { hitChances } = useCalcHitChances(BigInt(account.address), duelId, roundNumber, action)
  const { critChances } = useCalcCritChances(BigInt(account.address), duelId, roundNumber, action)
  const { glanceChances } = useCalcGlanceChances(BigInt(account.address), duelId, roundNumber, action)
  const { honourForAction } = useCalcHonourForAction(BigInt(account.address), action, 0)
  const { round1 } = useDuel(duelId)
  const execution = useMemo(() => {
    if ([Blades.Flee, Blades.Steal, Blades.Seppuku].includes(action)) {
      return 'Success'
    } else if ([Blades.Fast, Blades.Block].includes(action)) {
      return 'Crit'
    } else {
      return 'Execution'
    }
  }, [action])
  const _honourValue = (honourForAction > 0 ? honourForAction : isA ? round1?.shot_a.honour : isB ? round1?.shot_b.honour : null) ?? 0
  const _honourWarning = (honourForAction == 10)
  const _honourNegative = (honourForAction == 1)
  return (
    <>
      <ProgressBar disabled={!action} label={`${execution}:`} percent={critChances} className='ChancesBar' />
      <ProgressBar disabled={!action} label={glanceChances ? <span>Hit / <span className='Warning'>Glance</span>:</span> : 'Hit:'} percent={hitChances} glancePercent={glanceChances} className='ChancesBar' />
      <ProgressBar disabled={!action} label='Honour:' value={_honourValue} total={10} className='ChancesBar' warning={_honourWarning} negative={_honourNegative} color={honourForAction == 0 ? 'grey' : null} />

      <p className=' AlignCenter'>&nbsp;
        {hitBonus > 0 && <>(Includes Honourable <b>{hitBonus}%</b> crit bonus)</>}
        {hitBonus === 0 && <>Keep your Honour <b>{'>'} 9.0</b> for a crit bonus</>}
      </p>
    </>
  )
}
