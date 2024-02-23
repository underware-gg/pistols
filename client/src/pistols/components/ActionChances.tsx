import React, { useMemo } from 'react'
import { Grid } from 'semantic-ui-react'
import { useDojoAccount } from '@/dojo/DojoContext'
import { useReadActionHonour, useReadCritChance, useReadHitBonus, useReadHitChance } from '@/pistols/hooks/useReadOnly'
import ProgressBar from '@/pistols/components/ui/ProgressBar'
import constants from '@/pistols/utils/constants'
import { Blades } from '@/pistols/utils/pistols'

const Row = Grid.Row
const Col = Grid.Column

export function ActionChances({
  action,
}) {
  const { account } = useDojoAccount()
  const { hitBonus } = useReadHitBonus(BigInt(account.address))
  const { hitChance } = useReadHitChance(BigInt(account.address), action, constants.FULL_HEALTH)
  const { critChance } = useReadCritChance(BigInt(account.address), action, constants.FULL_HEALTH)
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
      <ProgressBar disabled={!action} label={`${execution} Chance:`} percent={critChance} className='ChancesBar' />
      <ProgressBar disabled={!action} label='Hit Chance:' percent={hitChance} className='ChancesBar' />
      <ProgressBar disabled={!action} label='Honour:' value={actionHonour ?? 0} total={10} className='ChancesBar' />

      <p className='ModalText AlignCenter'>&nbsp;
        {hitBonus > 0 && <>(Includes Honourable <b>{hitBonus}%</b> hit bonus)</>}
        {hitBonus === 0 && <>Keep your Honour <b>{'>'} 9.0</b> for a hit bonus</>}
      </p>
    </>
  )
}
