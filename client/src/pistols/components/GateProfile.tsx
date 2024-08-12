import React, { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Grid } from 'semantic-ui-react'
import { VStack, VStackRow } from '@/lib/ui/Stack'
import { useAccount } from '@starknet-react/core'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { useCanMintDuelist } from '../hooks/useTokenDuelist'
import { useDuelistBalanceOf, useDuelistOfOwnerByIndex, useDuelistTokenCount } from '@/pistols/hooks/useTokenDuelist'
import { useDuelist } from '@/pistols/hooks/useDuelist'
import { AccountMenuKey, usePistolsContext, initialState } from '@/pistols/hooks/PistolsContext'
import { ProfilePicSquareButton } from '@/pistols/components/account/ProfilePic'
import { ProfileName } from '@/pistols/components/account/ProfileDescription'
import { WagerBalance } from '@/pistols/components/account/LordsBalance'
import { makeTavernUrl } from '@/pistols/utils/pistols'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { Divider } from '@/lib/ui/Divider'
import { CurrentChainHint } from './Gate'
import UIContainer from '@/pistols/components/UIContainer'
import OnboardingModal from '@/pistols/components/account/OnboardingModal'
import WalletHeader from './account/WalletHeader'
import { tables } from '@/games/pistols/generated/constants'
import { IconClick } from '@/lib/ui/Icons'

const Row = Grid.Row
const Col = Grid.Column

export default function GateProfile() {
  const { isConnected } = useAccount()
  return (
    <div id='Gate'>
      <UIContainer>
        <WalletHeader />
        {isConnected && 
          <ConnectedGate />
        }
      </UIContainer>

      <CurrentChainHint />
    </div>
  )
}


function ConnectedGate() {
  const { accountSetupOpener, dispatchSetAccountMenu } = usePistolsContext()
  const { tableId, dispatchDuelistId } = useSettings()
  const { address } = useAccount()
  const { canMint } = useCanMintDuelist(address)

  const _mintDuelist = () => {
    dispatchDuelistId(0n)
    dispatchSetAccountMenu(AccountMenuKey.Profile)
    accountSetupOpener.open()
  }

  return (
    <>
      <VStack className='Faded FillWidth UIAccountsListScroller_XX'>
        <AccountsList />
        <Divider />
        <ActionButton fill disabled={!canMint} onClick={() => _mintDuelist()} label='Create New Duelist' />
      </VStack>

      <OnboardingModal opener={accountSetupOpener} />
    </>
  )
}



export function AccountsList() {
  const { address } = useAccount()
  const { duelistBalance: duelistCount } = useDuelistBalanceOf(address)

  const rows = useMemo(() => {
    let result = []
    for (let index = 0; index < duelistCount; ++index) {
      result.push(<AccountItem key={`i${index}`} index={index} />)
    }
    return result
  }, [address, duelistCount])

  return (
    <Grid className='Faded FillWidth'>
      {duelistCount > 0 &&
        <Row columns={'equal'} className='Title'>
          <Col>
            Pick Your Duelist
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
            <ProfilePicSquareButton medium
              profilePic={profilePic ?? 0}
              onClick={() => (_canPlay ? _duel : _manage)()}
            />
          </div>
        </Col>
        <Col width={8} textAlign='left'>

          <IconClick name='edit' onClick={() => _manage()} />
          <span className='H4 Bold'>
            <ProfileName duelistId={duelistId} />
          </span>
          <h5>
            <WagerBalance tableId={tables.LORDS} duelistId={duelistId} />
          </h5>
        </Col>
        <Col width={5} textAlign='left'>
          <ActionButton fill important disabled={!_canPlay} onClick={() => _duel()} label='Duel!' />
        </Col>
      </Row>
    </>
  )
}
