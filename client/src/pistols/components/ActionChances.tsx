import React, { useMemo } from 'react'
import { Grid } from 'semantic-ui-react'
import { useDojoAccount } from '@/dojo/DojoContext'
import { useCalcHitBonus, useCalcCritChances, useCalcHitChances, useCalcGlanceChances, useCalcHonourForAction } from '@/pistols/hooks/useContractCalls'
import { Blades } from '@/pistols/utils/pistols'
import ProgressBar from '@/pistols/components/ui/ProgressBar'

const Row = Grid.Row
const Col = Grid.Column

export function ActionChances({
  duelId,
  roundNumber,
  action,
}) {
  const { account } = useDojoAccount()
  const { hitBonus } = useCalcHitBonus(BigInt(account.address))
  const { hitChances } = useCalcHitChances(BigInt(account.address), duelId, roundNumber, action)
  const { critChances } = useCalcCritChances(BigInt(account.address), duelId, roundNumber, action)
  const { glanceChances } = useCalcGlanceChances(BigInt(account.address), duelId, roundNumber, action)
  const { honourForAction } = useCalcHonourForAction(BigInt(account.address), action)
  const execution = useMemo(() => {
    if ([Blades.Fast, Blades.Block].includes(action)) {
      return 'Crit'
    } else {
      return 'Execution'
    }
  }, [action])
  return (
    <>
      <ProgressBar disabled={!action} label={`${execution}:`} percent={critChances} className='ChancesBar' />
      <ProgressBar disabled={!action} label={glanceChances ? <span>Hit / <span className='Warning'>Glance</span>:</span> : 'Hit:'} percent={hitChances} glancePercent={glanceChances} className='ChancesBar' />
      <ProgressBar disabled={!action} label='Honour:' value={honourForAction ?? 0} total={10} className='ChancesBar' />

      <p className=' AlignCenter'>&nbsp;
        {hitBonus > 0 && <>(Includes Honourable <b>{hitBonus}%</b> crit bonus)</>}
        {hitBonus === 0 && <>Keep your Honour <b>{'>'} 9.0</b> for a crit bonus</>}
      </p>
    </>
  )
}
