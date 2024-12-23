import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useAccount } from '@starknet-react/core'
import { useSettings } from '@/hooks/SettingsContext'
import { useDuelistsOfPlayer } from '@/hooks/useDuelistToken'
import { usePistolsContext, usePistolsScene } from '@/hooks/PistolsContext'
import { useGameAspect } from '@/hooks/useGameApect'
import { ActionButton } from '@/components/ui/Buttons'
import { ConnectButton, CurrentChainHint, EnterAsGuestButton } from '@/components/scenes/ScDoor'
import { DuelistCard, DuelistCardHandle } from '@/components/cards/DuelistCard'
import { DUELIST_CARD_HEIGHT, DUELIST_CARD_WIDTH } from '@/data/cardConstants'
import { PublishOnlineStatusButton } from '@/stores/sync/PlayerOnlineSync'
import { TutorialProgressDebug } from '@/components/TutorialProgressDebug'
import { SceneName } from '@/data/assets'
import { Divider } from '@/components/ui/Divider'
import { VStack } from '@/components/ui/Stack'
import DuelistEditModal from '@/components/modals/DuelistEditModal'

export default function ScProfile() {
  const { isConnected } = useAccount()
  const { debugMode } = useSettings()
  const { duelistEditOpener } = usePistolsContext()
  const { fromGate } = usePistolsScene()
  const { duelistIds } = useDuelistsOfPlayer()
  // console.log(`DUELIST BALANCE`, duelistIds.length)

  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    if (!loaded) {
      setLoaded(true)
      if (fromGate && duelistIds.length === 0) {
        duelistEditOpener.open({ mintNew: true })
      }
    }
  }, [fromGate, duelistIds.length])

  return (
    <div id='Profile'>
      <div className='UIContainer'>
        {/* <Tab
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
        </Tab> */}
        {isConnected ? <DuelistsList /> : <DuelistsConnect />}
      </div>

      <DuelistEditModal opener={duelistEditOpener} />
      <CurrentChainHint />

      {(debugMode || true) && <>
        <PublishOnlineStatusButton />
        <TutorialProgressDebug />
      </>}
    </div>
  )
}


//------------------------------------
// Duelists
//


function DuelistsConnect() {
  const { aspectWidth } = useGameAspect()

  return (
    <VStack className='Faded FillWidth' style={{ marginTop: aspectWidth(10) }}>
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
  const { duelistId, dispatchDuelistId } = useSettings()
  const { duelistEditOpener, dispatchSelectDuelistId } = usePistolsContext()
  const { dispatchSetScene } = usePistolsScene()
  const { duelistIds } = useDuelistsOfPlayer()
  
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
        if (cardDuelistId == duelistId) {
          cardRefs.current[Number(cardDuelistId)].toggleHighlight(true)
        }
      }
    })
  }, [cardRefs, paginatedDuelistIds, duelistId, duelistIds])

  return (
    <div className='FillWidth' style={{ marginLeft: aspectWidth(1) }}>
      <Divider hidden />
      {duelistIds.length > 0 ? (
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
                    } else {
                      dispatchSelectDuelistId(cardDuelistId)
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
      <Divider />
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <ActionButton fill disabled={false} onClick={() => _mintDuelist()} label='Create New Duelist' />
        <div style={{ fontSize: '1.2em', fontWeight: 'bold' }}>OR</div>
        <ActionButton fill important disabled={!duelistId} onClick={() => _goToTavern()} label={!duelistId ? 'Select A Duelist' : 'Enter Tavern with Duelist'} />
      </div>
    </div>
  )
}
