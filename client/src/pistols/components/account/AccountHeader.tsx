import React, { ReactNode, useMemo } from 'react'
import { Dropdown, Grid } from 'semantic-ui-react'
import { useAccount } from '@starknet-react/core'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { usePistolsScene, SceneName } from '@/pistols/hooks/PistolsContext'
import { useDuelist } from '@/pistols/hooks/useDuelist'
import { ProfilePicSquare, ProfilePicSquareButton } from '@/pistols/components/account/ProfilePic'
import { FameBalanceDuelist } from '@/pistols/components/account/LordsBalance'
import { useDuelistsOfOwner } from '@/pistols/hooks/useDuelistToken'
import { BigNumberish } from 'starknet'
import { ProfileName } from './ProfileDescription'

const Row = Grid.Row
const Col = Grid.Column

export default function AccountHeader() {
  const { address, isConnected } = useAccount()
  const { isAnon, duelistId } = useSettings()
  const { dispatchSetScene } = usePistolsScene()
  // const { dispatchSelectDuelistId } = usePistolsContext()

  const { nameDisplay, profilePic } = useDuelist(duelistId)

  const _click = () => {
    // if (isAnon) {
    //   dispatchSetScene(SceneName.Profile)
    // } else {
    //   dispatchSetScene(SceneName.Profile)
    // }
  }

  return (
    <Grid>
      <Row className='ProfilePicHeight' textAlign='center'>
        <Col width={4} textAlign='center' verticalAlign='middle' className='NoPadding'>
          <DuelistsNavigationMenu>
            <ProfilePicSquareButton profilePic={profilePic ?? 0}onClick={() => _click()} />
          </DuelistsNavigationMenu>
        </Col>
        <Col width={12} textAlign='left' verticalAlign='top'>
          {!isConnected ? <h3>Guest</h3>
            : <>
              <h2>{nameDisplay}</h2>
              {/* <AddressShort address={address} copyLink={'left'} /> */}
              {/* <h5><FameBalance address={address} big /></h5> */}
              <h5><FameBalanceDuelist duelistId={duelistId} big /></h5>
            </>}
        </Col>
      </Row>
    </Grid>
  );
}

export function DuelistsNavigationMenu({
  children,
}: {
  children: ReactNode,
}) {
  const { address } = useAccount()
  const { dispatchSetScene } = usePistolsScene()
  const { duelistBalance, duelistIds } = useDuelistsOfOwner(address)
  const { duelistId: selectedDuelistId } = useSettings()
  const { dispatchDuelistId } = useSettings()

  const _goToProfile = () => {
    dispatchSetScene(SceneName.Profile)
  }

  const _switchDuelist = (duelistId: BigNumberish) => {
    dispatchDuelistId(duelistId)
  }

  const maxItems = 6

  const rows = useMemo(() => (
    duelistIds.map((duelistId, index) => {
      if (index > maxItems) return undefined
      if (index == maxItems) return <Dropdown.Item key='more' text={'More Duelists...'} onClick={() => _goToProfile()} />
      return (
        <Dropdown.Item key={`i${duelistId}`}
          onClick={() => _switchDuelist(duelistId)}
          className={`NoPadding ${duelistId == selectedDuelistId ? 'BgImportant' : ''}`}
        >
          <DuelistItem duelistId={duelistId} />
        </Dropdown.Item>
      )
    })
  ), [address, duelistBalance, selectedDuelistId])

  return (
    <Dropdown
      className='huge NoPadding AutoMargin'
      direction='right'
      button
      simple
      closeOnEscape
      fluid
      trigger={children}
      style={{ width: '82px', height: '82px' }}
    >
      <Dropdown.Menu>
        {rows}
        <Dropdown.Item icon={'setting'} text={'Profile...'} onClick={() => _goToProfile()} />
      </Dropdown.Menu>
    </Dropdown>
  )
}

function DuelistItem({
  duelistId,
}: {
  duelistId: BigNumberish
}) {
  const { duelistId: selectedDuelistId } = useSettings()
  const { profilePic } = useDuelist(duelistId)
  const isSelected = (duelistId && duelistId == selectedDuelistId)

  return (
    <div className={'FlexInline'}>
      <ProfilePicSquare small profilePic={profilePic ?? 0} />
      <div className='PaddedSides'>
        <ProfileName duelistId={duelistId} />
        <br/>
        <div className='Smaller'>
          <FameBalanceDuelist duelistId={duelistId} />
        </div>
      </div>
    </div>
  )
}

