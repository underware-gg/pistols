import React, { useEffect, useMemo, useRef, useState } from 'react'
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
import { ConnectButton, CurrentChainHint, EnterAsGuestButton } from '@/pistols/components/scenes/ScDoor'
import { Divider } from '@/lib/ui/Divider'
import { IconClick } from '@/lib/ui/Icons'
import { BigNumberish } from 'starknet'
import { DuelistCard, DuelistCardHandle } from '../cards/DuelistCard'
import { DUELIST_CARD_HEIGHT, DUELIST_CARD_WIDTH } from '@/pistols/data/cardConstants'
import { SocialsList } from '../SocialsList'
import DuelistEditModal from '../modals/DuelistEditModal'
import DuelistModal from '../modals/DuelistModal'
import useGameAspect from '@/pistols/hooks/useGameApect'

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
    <div id='Profile'>
      <div className='UIContainer'>
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
  const { duelistId, dispatchDuelistId } = useSettings()
  const { duelistEditOpener } = usePistolsContext()
  const { dispatchSetScene } = usePistolsScene()
  const { duelistBalance, duelistIds } = useDuelistsOfOwner(address)
  
  const { aspectWidth } = useGameAspect()

  const [pageNumber, setPageNumber] = useState(0)
  const cardRefs = useRef<{[key: number]: DuelistCardHandle}>({})

  const _mintDuelist = () => {
    duelistEditOpener.open({ mintNew: true })
  }

  const _goToTavern = () => {
    dispatchSetScene(SceneName.Tavern)
  }

  const duelistsPerPage = 8
  const pageCount = useMemo(() => Math.ceil(duelistIds.length / duelistsPerPage), [duelistIds])
  const paginatedDuelistIds = useMemo(() => (
    duelistIds.slice(
      pageNumber * duelistsPerPage,
      (pageNumber + 1) * duelistsPerPage
    )
  ), [duelistIds, pageNumber])

  const unSelectCard = () => {
    if (!duelistId) return
    const selectedCard = cardRefs.current[Number(duelistId)]
    if (selectedCard) {
      selectedCard.toggleHighlight(false)
    }
  }

  useEffect(() => {
    paginatedDuelistIds.forEach(cardDuelistId => {
      if (cardRefs.current[Number(cardDuelistId)]) {
        cardRefs.current[Number(cardDuelistId)].toggleVisibility(true)
        cardRefs.current[Number(cardDuelistId)].playHangingCard()
        if (cardDuelistId == duelistId) {
          cardRefs.current[Number(cardDuelistId)].toggleHighlight(true)
        }
      }
    })
  }, [cardRefs, paginatedDuelistIds, duelistId, duelistIds])

  return (
    <div className='FillWidth'>
      <Divider hidden />
      {duelistBalance > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className='Title'>Pick A Duelist To Play</div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gridTemplateRows: 'repeat(2, 1fr)',
            gap: '20px',
            width: '100%',
            height: aspectWidth(DUELIST_CARD_HEIGHT * 2.2),
            padding: '20px'
          }}>
            {paginatedDuelistIds.map((cardDuelistId) => (
              <div key={cardDuelistId}>
                <DuelistCard
                  ref={(ref: DuelistCardHandle | null) => {
                    if (ref) cardRefs.current[Number(cardDuelistId)] = ref
                  }}
                  duelistId={Number(cardDuelistId)}
                  isLeft={true}
                  isVisible={true}
                  isFlipped={true}
                  instantFlip={true}
                  isHanging={true}
                  isHighlightable={true}
                  isSelected={duelistId == cardDuelistId}
                  width={DUELIST_CARD_WIDTH}
                  height={DUELIST_CARD_HEIGHT}
                  onClick={() => {
                    if (duelistId !== cardDuelistId) {
                      unSelectCard()
                      dispatchDuelistId(cardDuelistId)
                    }
                  }}
                />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '10px', marginBottom: '10px', width: '50%' }}>
            <ActionButton
              fill
              disabled={pageNumber === 0}
              onClick={() => setPageNumber(prev => prev - 1)}
              label='Previous Page'
            />
            <ActionButton
              fill
              disabled={pageNumber >= pageCount - 1}
              onClick={() => setPageNumber(prev => prev + 1)}
              label='Next Page'
            />
          </div>
        </div>
      ) : (
        <div className='Title'>You need a Duelist to Play</div>
      )}
      {/* <Divider /> */}
      <ActionButton fill important disabled={!duelistId} onClick={() => _goToTavern()} label={!duelistId ? 'Select A Duelist' : 'Enter The Tavern'} />
      <Divider content={'OR'} />
      <ActionButton fill disabled={false} onClick={() => _mintDuelist()} label='Create New Duelist' />
    </div>
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
    dispatchSetScene(SceneName.Duels)
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

