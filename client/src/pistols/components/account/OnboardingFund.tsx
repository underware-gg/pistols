import React from 'react'
import { Divider, Grid } from 'semantic-ui-react'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { useBurnerAccount } from '@/lib/dojo/hooks/useBurnerAccount'
import { LockedBalance, LordsBalance } from './LordsBalance'
import { LordsFaucet } from './LordsFaucet'

const Row = Grid.Row
const Col = Grid.Column

export function OnboardingFund({
  isDeployed = false,
}) {
  const { accountIndex } = usePistolsContext()
  const { address } = useBurnerAccount(accountIndex)

  return (
    <div className='Padded H4'>
      <h5>DEPOSIT</h5>
      <Divider />
      <LordsBalance address={address} big />
      <LockedBalance address={address} clean />
      {isDeployed && <><br /><LordsFaucet /></>}
      <Divider />
      <h5>WITHDRAW</h5>
    </div>
  )
}

