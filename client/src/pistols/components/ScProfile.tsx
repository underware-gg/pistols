import React, { useEffect, useMemo, useState } from 'react'
import { Grid, Tab } from 'semantic-ui-react'
import { RowDivider, VStack } from '@/lib/ui/Stack'
import { useAccount } from '@starknet-react/core'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { useDuelistCalcPrice } from '@/pistols/hooks/useDuelistToken'
import { useDuelistsOfOwner } from '@/pistols/hooks/useDuelistToken'
import { useDuelist } from '@/pistols/hooks/useDuelist'
import { usePistolsContext, usePistolsScene, SceneName } from '@/pistols/hooks/PistolsContext'
import { ProfilePicSquare } from '@/pistols/components/account/ProfilePic'
import { ProfileName } from '@/pistols/components/account/ProfileDescription'
import { FameBalanceDuelist } from '@/pistols/components/account/LordsBalance'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { ConnectButton, CurrentChainHint, EnterAsGuestButton } from '@/pistols/components/ScGate'
import { SocialsList } from '@/pistols/components/SocialsList'
import { Divider } from '@/lib/ui/Divider'
import { IconClick } from '@/lib/ui/Icons'
import { Header } from '@/pistols/components/Header'
import DuelistEditModal from '@/pistols/components/DuelistEditModal'
import DuelistModal from '@/pistols/components/DuelistModal'
import WalletHeader from '@/pistols/components/account/WalletHeader'
import { BigNumberish } from 'starknet'

const Row = Grid.Row
const Col = Grid.Column

export default function ScProfile() {
  const { isConnected, address } = useAccount()
  const { duelistEditOpener } = usePistolsContext()
  const { fromGate } = usePistolsScene()
  const { duelistBalance } = useDuelistsOfOwner(address)
  // console.log(`DUELIST BALANCE`, duelistBalance)

  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    if (!loaded) {
      setLoaded(true)
      if (fromGate && duelistBalance === 0) {
        duelistEditOpener.open({ mintNew: true })
      }
    }
  }, [fromGate, duelistBalance])

  return (
    <div id='Gate'>
      <Header account={false} tables={false} />
      <div className='UIContainer'>
        <WalletHeader />
        <Tab
          menu={{ secondary: true, pointing: true, attached: true }}
          panes={[
            {
              menuItem: 'Duelists',
              render: () => isConnected ? <DuelistsList /> : <DuelistsConnect />,
            },
            {
              menuItem: 'Connections',
              render: () => <SocialsList />,
            },
          ]}
        >
        </Tab>
      </div>

      <DuelistEditModal opener={duelistEditOpener} />
      <DuelistModal duelButton />
      <CurrentChainHint />
    </div>
  )
}


//------------------------------------
// Duelists
//


function DuelistsConnect() {
  return (
    <VStack className='Faded FillWidth'>
      <Divider />
      <span className='Title'>
        Create or Log In with your
        <br />
        Controller Account
      </span>

      <Divider />
      <ConnectButton />

      <Divider content='OR' />
      <EnterAsGuestButton />
    </VStack>
  )
}


function DuelistsList() {
  const { address } = useAccount()
  const { duelistId } = useSettings()
  const { duelistEditOpener } = usePistolsContext()
  const { dispatchSetScene } = usePistolsScene()
  const { duelistBalance, duelistIds } = useDuelistsOfOwner(address)
  const { amount } = useDuelistCalcPrice(address)

  const _mintDuelist = () => {
    duelistEditOpener.open({ mintNew: true })
  }

  const _goToTavern = () => {
    dispatchSetScene(SceneName.Tavern)
  }

  const rows = useMemo(() => (
    duelistIds.map((duelistId) => {
      return <DuelistItem key={`i${duelistId}`} duelistId={duelistId} />
    })
  ), [address, duelistBalance])

  return (
    <VStack className='Faded FillWidth'>
      <Divider hidden />
      <Grid className='Faded FillWidth UIAccountsListScroller'>
        {duelistBalance > 0 &&
          <Row columns={'equal'} className='Title'>
            <Col>
              Pick A Duelist To Play
            </Col>
          </Row>
        }
        {rows}
        {duelistBalance == 0 &&
          <Row columns={'equal'} className='Title'>
            <Col>
              You need a Duelist to Play
            </Col>
          </Row>
        }
      </Grid>
      <Divider />
      <ActionButton fill important disabled={!duelistId} onClick={() => _goToTavern()} label={!duelistId ? 'Select A Duelist' : 'Enter The Tavern'} />
      <Divider content={'OR'} />
      <ActionButton fill disabled={false} onClick={() => _mintDuelist()} label='Create New Duelist' />
    </VStack>
  )
}


function DuelistItem({
  duelistId,
}: {
  duelistId: BigNumberish
}) {
  const { duelistId: selectedDuelistId } = useSettings()
  const { exists, profilePic } = useDuelist(duelistId)
  const isSelected = (duelistId && duelistId == selectedDuelistId)

  const _canPlay = (exists)

  const { duelistEditOpener, dispatchSelectDuelistId } = usePistolsContext()
  const { dispatchDuelistId } = useSettings()

  const _manage = () => {
    dispatchDuelistId(duelistId)
    duelistEditOpener.open({ mintNew: !Boolean(duelistId) })
  }

  const { dispatchSetScene } = usePistolsScene()
  const _duel = () => {
    dispatchDuelistId(duelistId)
    dispatchSetScene(SceneName.YourDuels)
  }

  const classNames = useMemo(() => {
    const result = ['Anchor', 'Padded']
    if (isSelected) result.push('BgImportant')
    return result
  }, [isSelected])

  return (
    <>
      <RowDivider />
      <Row textAlign='center' verticalAlign='top'
        className={classNames.join(' ')}
        onClick={() => dispatchDuelistId(duelistId)}
      >
        <Col width={3} verticalAlign='middle'>
          <div>
            <ProfilePicSquare medium
              profilePic={profilePic ?? 0}
            />
          </div>
        </Col>
        <Col width={8} textAlign='left' verticalAlign='middle'>
          <h4>
            <IconClick name='edit' size={'small'} onClick={() => _manage()} />
            &nbsp;
            <ProfileName duelistId={duelistId} />
          </h4>
          <h5>
            <FameBalanceDuelist duelistId={duelistId} />
          </h5>
        </Col>
        <Col width={5} textAlign='left' verticalAlign='middle'>
          <ActionButton fill disabled={!_canPlay} onClick={() => dispatchSelectDuelistId(duelistId)} label='Status' />
          <ActionButton fill important disabled={!_canPlay} onClick={() => _duel()} label='Duel!' />
        </Col>
      </Row>
    </>
  )
}

