import React, { useMemo } from 'react'
import { Grid, Divider } from 'semantic-ui-react'
import { useRouter } from 'next/navigation'
import { useAccount } from '@starknet-react/core'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { usePistolsContext, initialState } from '@/pistols/hooks/PistolsContext'
import { useDuelistBalanceOf, useDuelistOfOwnerByIndex, useDuelistTokenCount } from '@/pistols/hooks/useTokenDuelist'
import { useDuelist } from '@/pistols/hooks/useDuelist'
import { ProfilePicSquareButton } from '@/pistols/components/account/ProfilePic'
import { ProfileName } from '@/pistols/components/account/ProfileDescription'
import { WagerBalance } from '@/pistols/components/account/LordsBalance'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { makeTavernUrl } from '@/pistols/utils/pistols'
import { tables } from '@/games/pistols/generated/constants'

const Row = Grid.Row
const Col = Grid.Column

export function AccountsList() {
  const { address } = useAccount()
  const { duelistBalance } = useDuelistBalanceOf(address)
  const { tokenCount } = useDuelistTokenCount()

  const rows = useMemo(() => {
    let result = []
    for (let index = 0; index < duelistBalance; ++index) {
      result.push(<AccountItem key={`i${index}`} index={index} />)
    }
    if (result.length == 0) {
      result.push(
        <Row key='empty' columns={'equal'} textAlign='center'>
          <Col>
            <Divider hidden />
            <h3 className='TitleCase Important'>Create a Duelist to Play</h3>
          </Col>
        </Row>
      )
    }
    return result
  }, [address, duelistBalance])

  return (
    <Grid className='Faded FillWidth'>
      {rows}
    </Grid>
  )
}


function AccountItem({
  index,
}: {
  index: number
}) {
  const router = useRouter()
  const { address } = useAccount()
  const { duelistId } = useDuelistOfOwnerByIndex(address, index)
  const { exists, profilePic } = useDuelist(duelistId)

  const _canPlay = (exists)

  const { accountSetupOpener, dispatchSetMenu } = usePistolsContext()
  const { dispatchDuelistId } = useSettings()

  const _manage = () => {
    dispatchDuelistId(BigInt(duelistId ?? 0))
    accountSetupOpener.open()
  }

  const { tableId } = useSettings()
  const _duel = (menuKey = initialState.menuKey) => {
    dispatchDuelistId(BigInt(duelistId ?? 0))
    dispatchSetMenu(menuKey)
    router.push(makeTavernUrl(tableId))
  }

  return (
    <>
      <Row columns={1} className='NoPadding'>
        <Col><Divider /></Col>
      </Row>
      <Row textAlign='center' verticalAlign='top'>
        <Col width={3} className='NoPadding'>
          <div>
            <ProfilePicSquareButton
              profilePic={profilePic ?? 0}
              onClick={() => (_canPlay ? _duel : _manage)()}
            />
          </div>
        </Col>
        <Col width={8} textAlign='left'>
          <h3><ProfileName duelistId={duelistId} /></h3>
          {/* <AddressShort address={address} /> */}
          <h5>
            <WagerBalance tableId={tables.LORDS} duelistId={duelistId} />
          </h5>
        </Col>
        <Col width={5} textAlign='left'>
          <ActionButton fill onClick={() => _manage()} label='Edit' />
          <div className='Spacer5' />
          <ActionButton fill important disabled={!_canPlay} onClick={() => _duel()} label='Duel!' />
        </Col>
      </Row>
    </>
  )
}
