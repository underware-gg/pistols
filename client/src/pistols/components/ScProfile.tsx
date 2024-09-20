import React, { useEffect, useMemo, useState } from 'react'
import { Grid, Tab } from 'semantic-ui-react'
import { RowDivider, VStack } from '@/lib/ui/Stack'
import { useAccount } from '@starknet-react/core'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { useCanMintDuelist } from '@/pistols/hooks/useTokenDuelist'
import { useDuelistBalanceOf, useDuelistOfOwnerByIndex } from '@/pistols/hooks/useTokenDuelist'
import { useDuelist } from '@/pistols/hooks/useDuelist'
import { usePistolsContext, usePistolsScene, SceneName } from '@/pistols/hooks/PistolsContext'
import { ProfilePicSquare } from '@/pistols/components/account/ProfilePic'
import { ProfileName } from '@/pistols/components/account/ProfileDescription'
import { WagerBalance } from '@/pistols/components/account/LordsBalance'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { ConnectButton, CurrentChainHint, EnterAsGuestButton } from '@/pistols/components/ScGate'
import { SocialsList } from '@/pistols/components/SocialsList'
import { Divider } from '@/lib/ui/Divider'
import { IconClick } from '@/lib/ui/Icons'
import WalletHeader from '@/pistols/components/account/WalletHeader'
import DuelistEditModal from '@/pistols/components/DuelistEditModal'

const Row = Grid.Row
const Col = Grid.Column

export default function ScProfile() {
  const { isConnected, address } = useAccount()
  const { duelistEditOpener } = usePistolsContext()
  const { fromGate } = usePistolsScene()
  const { duelistBalance } = useDuelistBalanceOf(address)
  console.log(`DUELIST BALANCE`, duelistBalance)

  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    if (!loaded) {
      setLoaded(true)
      console.log(`FROM`, fromGate, duelistBalance)
      if (fromGate && duelistBalance === 0) {
        duelistEditOpener.open({ mintNew: true })
      }
    }
  }, [fromGate, duelistBalance])

  return (
    <div id='Gate'>
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
      <CurrentChainHint />
    </div>
  )
}


//------------------------------------
// Duelists
//


function DuelistsConnect() {
  return (
    <VStack className='Faded FillWidth UIAccountsListScroller_XX'>
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
  const { duelistEditOpener } = usePistolsContext()
  const { duelistBalance } = useDuelistBalanceOf(address)
  const { canMint } = useCanMintDuelist(address)

  const _mintDuelist = () => {
    duelistEditOpener.open({ mintNew: true })
  }

  const rows = useMemo(() => {
    let result = []
    for (let index = 0; index < duelistBalance; ++index) {
      result.push(<DuelistItem key={`i${index}`} index={index} />)
    }
    return result
  }, [address, duelistBalance])

  return (
    <VStack className='Faded FillWidth UIAccountsListScroller_XX'>
      <Divider hidden />
      <Grid className='Faded FillWidth'>
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
      <ActionButton fill disabled={!canMint} onClick={() => _mintDuelist()} label='Create New Duelist' />
      <Divider content={'OR'} />
      <EnterAsGuestButton />
    </VStack>
  )
}


function DuelistItem({
  index,
}: {
  index: number
}) {
  const { address } = useAccount()
  const { duelistId: seletedDuelistId } = useSettings()
  const { duelistId } = useDuelistOfOwnerByIndex(address, index)
  const { exists, profilePic } = useDuelist(duelistId)
  const isSelected = (duelistId && duelistId == seletedDuelistId)

  const _canPlay = (exists)

  const { duelistEditOpener } = usePistolsContext()
  const { dispatchDuelistId } = useSettings()

  const _manage = () => {
    dispatchDuelistId(duelistId)
    duelistEditOpener.open({ mintNew: !Boolean(duelistId) })
  }

  const { dispatchSetScene } = usePistolsScene()
  const _duel = () => {
    dispatchDuelistId(duelistId)
    dispatchSetScene(SceneName.Tavern)
  }

  const classNames = useMemo(() => {
    const result = ['Anchor']
    if (isSelected) result.push('BgImportant')
    return result
  }, [isSelected])

  return (
    <>
      <RowDivider />
      <Row textAlign='center' verticalAlign='top' className={classNames.join(' ')}
        onClick={() => dispatchDuelistId(duelistId)}
      >
        <Col width={3} className='NoPadding'>
          <div>
            <ProfilePicSquare medium
              profilePic={profilePic ?? 0}
            />
          </div>
        </Col>
        <Col width={8} textAlign='left'>

          <h4>
            <IconClick name='edit' size={'small'} onClick={() => _manage()} />
            &nbsp;
            <ProfileName duelistId={duelistId} />
          </h4>
          <h5>
            <WagerBalance duelistId={duelistId} />
          </h5>
        </Col>
        <Col width={5} textAlign='left' verticalAlign='bottom'>
          <ActionButton fill disabled={!_canPlay} onClick={() => _duel()} label='Duel!' />
        </Col>
      </Row>
    </>
  )
}

