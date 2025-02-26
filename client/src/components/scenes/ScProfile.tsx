import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useAccount } from '@starknet-react/core'
import { useSettings } from '/src/hooks/SettingsContext'
import { useDuelistsOfPlayer } from '/src/hooks/useTokenDuelists'
import { usePistolsContext, usePistolsScene } from '/src/hooks/PistolsContext'
import { useCanClaimStarterPack } from '/src/hooks/usePistolsContractCalls'
import { useMintMockLords } from '/src/hooks/useMintMockLords'
import { useGameAspect } from '/src/hooks/useGameApect'
import { ActionButton } from '/src/components/ui/Buttons'
import { ConnectButton, EnterAsGuestButton } from '/src/components/scenes/ScDoor'
import { DuelistCard, DuelistCardHandle } from '/src/components/cards/DuelistCard'
import { DUELIST_CARD_HEIGHT, DUELIST_CARD_WIDTH } from '/src/data/cardConstants'
import { PublishOnlineStatusButton } from '/src/stores/sync/PlayerOnlineSync'
import { TutorialProgressDebug } from '/src/components/TutorialProgressDebug'
import { SceneName } from '/src/data/assets'
import { Divider } from '/src/components/ui/Divider'
import { VStack } from '/src/components/ui/Stack'
import ShopModal from '/src/components/modals/ShopModal'
import { constants } from '@underware_gg/pistols-sdk/pistols/gen'
import { useDojoSystemCalls } from '@underware_gg/pistols-sdk/dojo'
import { DuelistsBook } from '../ui/DuelistsBook'
import { useGameEvent } from '/src/hooks/useGameEvent'
import { _currentScene } from '/src/three/game'
import { InteractibleScene } from '/src/three/InteractibleScene'

export default function ScProfile() {
  const { isConnected } = useAccount()
  const { debugMode } = useSettings()
  const { shopOpener, bookOpener, cardPackOpener } = usePistolsContext()

  const { value: itemClicked, timestamp } = useGameEvent('scene_click', null)
  const { dispatchSetScene } = usePistolsScene()

  useEffect(() => {
    if (itemClicked) {
      switch (itemClicked) {
        case 'book':
          bookOpener.open();
          (_currentScene as InteractibleScene).setClickable(false);
          break
        case 'chest':
          console.log('chest')
          shopOpener.open({ packType: constants.PackType.Duelists5x })
          break
      }
    }
  }, [itemClicked, timestamp])

  useEffect(() => {
    if (bookOpener.isOpen || shopOpener.isOpen) {
      (_currentScene as InteractibleScene).setClickable(false);
    } else {
      (_currentScene as InteractibleScene).setClickable(true);
    }
  }, [bookOpener.isOpen, shopOpener.isOpen])

  // auto mint mock lords on testnets
  useMintMockLords()

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
        {/* {isConnected ? <DuelistsList /> : <DuelistsConnect />} */}
        <DuelistsBook 
          opener={bookOpener}
          width={30} 
          height={40}
          bookTranslateXClosed={-16}
          bookTranslateYClosed={18}
          bookRotateXClosed={60}
          bookRotateYClosed={0}
          bookRotateZClosed={-30}
          bookRotateXOpen={20}
        />
      </div>

      <ShopModal opener={shopOpener} />

      {(debugMode || true) && <>
        <PublishOnlineStatusButton />
        {/* <TutorialProgressDebug /> */}
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
  const { shopOpener, dispatchSelectDuelistId } = usePistolsContext()
  const { dispatchSetScene } = usePistolsScene()
  const { duelistIds } = useDuelistsOfPlayer()
  const { canClaimStarterPack } = useCanClaimStarterPack(duelistIds.length)

  const { aspectWidth } = useGameAspect()

  const [pageNumber, setPageNumber] = useState(0)
  const cardRefs = useRef<{ [key: number]: DuelistCardHandle }>({})

  const _mintDuelists = () => {
    shopOpener.open({ packType: constants.PackType.Duelists5x })
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
        {canClaimStarterPack
          ? <ClaimDuelistsButton />
          : <ActionButton fill
            disabled={false}
            onClick={() => _mintDuelists()}
            label='Purchase Duelists'
          />
        }
        <div style={{ fontSize: '1.2em', fontWeight: 'bold' }}>OR</div>
        <ActionButton fill important
          disabled={!duelistId}
          onClick={() => _goToTavern()}
          label={!duelistId ? 'Select A Duelist' : 'Enter Tavern with Duelist'}
        />
      </div>
    </div>
  )
}

export function ClaimDuelistsButton() {
  const { account } = useAccount()
  const { pack_token } = useDojoSystemCalls()
  const { dispatchDuelistId } = useSettings()
  const { dispatchSetScene } = usePistolsScene()
  const { duelistIds } = useDuelistsOfPlayer()
  const { canClaimStarterPack } = useCanClaimStarterPack(duelistIds.length)
  const [isClaiming, setIsClaiming] = useState(false)

  const _claim = async () => {
    if (canClaimStarterPack) {
      setIsClaiming(true)
      await pack_token.claim_starter_pack(account)
    }
  }

  useEffect(() => {
    if (canClaimStarterPack === false && isClaiming) {
      dispatchDuelistId(duelistIds[0])
      dispatchSetScene(SceneName.Profile)
    }
  }, [canClaimStarterPack, duelistIds, isClaiming])

  return <ActionButton large fill important disabled={false} onClick={_claim} label='Claim your Duelists' />
}