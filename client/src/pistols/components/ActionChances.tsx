import React, { useMemo } from 'react'
import { Grid } from 'semantic-ui-react'
import { useDojoAccount } from '@/dojo/DojoContext'
import { useReadHitBonus, useReadCritChances, useReadHitChances, useReadGlanceChances, useReadActionHonour } from '@/pistols/hooks/useReadOnly'
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
  const { hitBonus } = useReadHitBonus(BigInt(account.address))
  const { hitChances } = useReadHitChances(BigInt(account.address), duelId, roundNumber, action)
  const { critChances } = useReadCritChances(BigInt(account.address), duelId, roundNumber, action)
  const { glanceChances } = useReadGlanceChances(BigInt(account.address), duelId, roundNumber, action)
  const { actionHonour } = useReadActionHonour(BigInt(account.address), action)
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
      <ProgressBar disabled={!action} label='Honour:' value={actionHonour ?? 0} total={10} className='ChancesBar' />

      <p className='ModalText AlignCenter'>&nbsp;
        {hitBonus > 0 && <>(Includes Honourable <b>{hitBonus}%</b> hit bonus)</>}
        {hitBonus === 0 && <>Keep your Honour <b>{'>'} 9.0</b> for a hit bonus</>}
      </p>
    </>
  )
}
