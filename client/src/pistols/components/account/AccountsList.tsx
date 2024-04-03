import React, { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Grid, Divider } from 'semantic-ui-react'
import { useDojoAccount } from '@/dojo/DojoContext'
import { usePistolsContext, initialState } from '@/pistols/hooks/PistolsContext'
import { AddressShort } from '@/lib/ui/AddressShort'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { useDuelist } from '@/pistols/hooks/useDuelist'
import { ProfilePicSquareButton } from '@/pistols/components/account/ProfilePic'
import { BigNumberish } from 'starknet'
import { useBurner, useBurnerAccount, useBurners } from '@/lib/wallet/useBurnerAccount'
import { LordsBalance } from './LordsBalance'
import { bigintToHex } from '@/lib/utils/types'

const Row = Grid.Row
const Col = Grid.Column

export function AccountsList() {
  const { account, masterAccount, isDeploying, count } = useDojoAccount()
  const { burners } = useBurners(masterAccount.address)

  const rows = useMemo(() => {
    let result = []
    Object.values(burners).forEach((burner) => {
      result.push(<AccountItem key={burner.address}
        accountIndex={burner.accountIndex}
        address={burner.address}
      />)
    })
    if (result.length == 0) {
      result.push(
        <Row key='empty' columns={'equal'} textAlign='center'>
          <Col>
            <h4 className='TitleCase Important'>Create a Duelist to Play</h4>
          </Col>
        </Row>
      )
    }
    return result
  }, [account?.address, isDeploying, count])

  return (
    <Grid className='Faded FillWidth'>
      {rows}
    </Grid>
  )
}


function AccountItem({
  accountIndex,
  address,
}: {
  accountIndex: number
  address: BigNumberish
}) {
  const router = useRouter()
  const { select } = useDojoAccount()

  const burner = useBurner(address)
  const { isImported, isProfiled } = useBurnerAccount(accountIndex)
  const _canPlay = (isImported && isProfiled)

  const { name, profilePic } = useDuelist(address)
  const defaultAccountName = useMemo(() => (`Duelist #${accountIndex}`), [accountIndex])

  const { accountSetupOpener, dispatchSetAccountIndex, dispatchSetMenu } = usePistolsContext()

  const _manage = () => {
    dispatchSetAccountIndex(burner?.accountIndex ?? 0)
    accountSetupOpener.open()
  }

  const _duel = (menuKey = initialState.menuKey) => {
    select(bigintToHex(address))
    dispatchSetMenu(menuKey)
    router.push('/tavern')
  }

  return (
    <>

      <Row textAlign='center' verticalAlign='top'>
        <Col width={3} className='NoPadding'>
          <div>
            <ProfilePicSquareButton
              profilePic={profilePic ?? 0}
              onClick={() => _manage()}
            />
          </div>
        </Col>
        <Col width={8} textAlign='left'>
          <h3>{name ?? defaultAccountName}</h3>
          <AddressShort address={address} />
          <h5><LordsBalance address={address} /></h5>
        </Col>
        <Col width={5} textAlign='left'>
          <ActionButton fill onClick={() => _manage()} label='Manage' />
          <div className='Spacer5' />
          <ActionButton fill attention disabled={!_canPlay} onClick={() => _duel()} label='Duel!' />
        </Col>
      </Row>
      <Row columns={1} className='NoPadding'>
        <Col><Divider /></Col>
      </Row>
    </>
  )
}
