import React, { ReactNode, useMemo } from 'react'
import { Dropdown, Grid } from 'semantic-ui-react'
import { useAccount } from '@starknet-react/core'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { usePistolsScene, SceneName } from '@/pistols/hooks/PistolsContext'
import { useDuelist } from '@/pistols/stores/duelistStore'
import { ProfilePicSquare, ProfilePicSquareButton } from '@/pistols/components/account/ProfilePic'
import { FameBalanceDuelist } from '@/pistols/components/account/LordsBalance'
import { useDuelistsOfOwner } from '@/pistols/hooks/useDuelistToken'
import { BigNumberish } from 'starknet'
import { ProfileName } from './ProfileDescription'
import useGameAspect from '@/pistols/hooks/useGameApect'

const Row = Grid.Row
const Col = Grid.Column

export default function AccountHeader() {
  const { address, isConnected } = useAccount()
  const { isAnon, duelistId } = useSettings()
  const { dispatchSetScene } = usePistolsScene()
  const { aspectWidth } = useGameAspect()

  const { nameDisplay, profilePic } = useDuelist(duelistId)

  const _click = () => {
    dispatchSetScene(SceneName.Profile)
  }

  return (
     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ flex: 1, textAlign: 'right' }}>
        {!isConnected ? <h3>Guest</h3>
          : <>
            <h3>{nameDisplay}</h3>
            <div style={{ lineHeight: 0 }}>
              <h5><FameBalanceDuelist duelistId={duelistId} big /></h5>
            </div>
            {/* //TODO replace with fame */}
          </>}
      </div>
      <div style={{ padding: aspectWidth(0.6) }}>
        <DuelistsNavigationMenu>
          <ProfilePicSquareButton profilePic={profilePic ?? 0} onClick={() => _click()} medium />
        </DuelistsNavigationMenu>
      </div>
    </div>
  );
}

export function DuelistsNavigationMenu({
  children,
}: {
  children: ReactNode,
}) {
  const { address } = useAccount()
  const { dispatchSetScene } = usePistolsScene()
  const { duelistIds } = useDuelistsOfOwner(address)
  const { duelistId: selectedDuelistId } = useSettings()
  const { dispatchDuelistId } = useSettings()
  const { aspectWidth } = useGameAspect()

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
  ), [address, duelistIds.length, selectedDuelistId])

  return (
    <Dropdown
      className='NoPadding NoMargin'
      direction='left'
      simple
      icon={null}
      closeOnEscape
      fluid
      trigger={children}
      style={{ width: aspectWidth(4), height: aspectWidth(4) }}
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

