import React, { useMemo } from 'react'
import { Grid, Tab } from 'semantic-ui-react'
import { VStack } from '@/lib/ui/Stack'
import { useAccount } from '@starknet-react/core'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { useCanMintDuelist } from '../hooks/useTokenDuelist'
import { useDuelistBalanceOf, useDuelistOfOwnerByIndex } from '@/pistols/hooks/useTokenDuelist'
import { useDuelist } from '@/pistols/hooks/useDuelist'
import { usePistolsContext, initialState, usePistolsScene, SceneName } from '@/pistols/hooks/PistolsContext'
import { ProfilePicSquareButton } from '@/pistols/components/account/ProfilePic'
import { ProfileName } from '@/pistols/components/account/ProfileDescription'
import { WagerBalance } from '@/pistols/components/account/LordsBalance'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { Divider } from '@/lib/ui/Divider'
import { IconClick } from '@/lib/ui/Icons'
import { CurrentChainHint } from '@/pistols/components/Gate'
import { SocialsList } from '@/pistols/components/SocialsList'
import WalletHeader from '@/pistols/components/account/WalletHeader'
import DuelistEditModal from '@/pistols/components/DuelistEditModal'
import UIContainer from '@/pistols/components/UIContainer'

const Row = Grid.Row
const Col = Grid.Column

export default function GateProfile() {
  const { isConnected } = useAccount()
  const { accountSetupOpener } = usePistolsContext()

  return (
    <div id='Gate'>
      <UIContainer>
        <WalletHeader />
        {isConnected &&
          <Tab
            menu={{ secondary: true, pointing: true, attached: true }}
            panes={[
              {
                menuItem: 'Duelists',
                render: () => <DuelistsList />,
              },
              {
                menuItem: 'Socials',
                render: () => <SocialsList />,
              },
            ]}
          >
          </Tab>
        }
      </UIContainer>

      <DuelistEditModal opener={accountSetupOpener} />
      <CurrentChainHint />
    </div>
  )
}


//------------------------------------
// Duelists
//

function DuelistsList() {
  const { address } = useAccount()
  const { dispatchDuelistId } = useSettings()
  const { accountSetupOpener } = usePistolsContext()
  const { duelistBalance: duelistCount } = useDuelistBalanceOf(address)
  const { canMint } = useCanMintDuelist(address)

  const _mintDuelist = () => {
    dispatchDuelistId(0n)
    accountSetupOpener.open()
  }

  const rows = useMemo(() => {
    let result = []
    for (let index = 0; index < duelistCount; ++index) {
      result.push(<DuelistItem key={`i${index}`} index={index} />)
    }
    return result
  }, [address, duelistCount])

  return (
    <VStack className='Faded FillWidth UIAccountsListScroller_XX'>
      <Divider />
      <Grid className='Faded FillWidth'>
        {duelistCount > 0 &&
          <Row columns={'equal'} className='Title'>
            <Col>
              Pick A Duelist To Play
            </Col>
          </Row>
        }
        {rows}
        {duelistCount == 0 &&
          <Row columns={'equal'} className='Title'>
            <Col>
              You need a Duelist to Play
            </Col>
          </Row>
        }
      </Grid>
      <Divider />
      <ActionButton fill disabled={!canMint} onClick={() => _mintDuelist()} label='Create New Duelist' />
    </VStack>
  )
}


function DuelistItem({
  index,
}: {
  index: number
}) {
  const { address } = useAccount()
  const { duelistId } = useDuelistOfOwnerByIndex(address, index)
  const { exists, profilePic } = useDuelist(duelistId)

  const _canPlay = (exists)

  const { accountSetupOpener } = usePistolsContext()
  const { dispatchDuelistId } = useSettings()

  const _manage = () => {
    dispatchDuelistId(BigInt(duelistId ?? 0))
    accountSetupOpener.open()
  }

  const { dispatchSetLastScene } = usePistolsScene()
  const _duel = () => {
    dispatchDuelistId(BigInt(duelistId ?? 0))
    dispatchSetLastScene()
  }

  return (
    <>
      <Row columns={1} className='NoPadding'>
        <Col><Divider /></Col>
      </Row>
      <Row textAlign='center' verticalAlign='top'>
        <Col width={3} className='NoPadding'>
          <div>
            <ProfilePicSquareButton medium
              profilePic={profilePic ?? 0}
              onClick={() => (_canPlay ? _duel : _manage)()}
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
          <ActionButton fill important disabled={!_canPlay} onClick={() => _duel()} label='Duel!' />
        </Col>
      </Row>
    </>
  )
}
