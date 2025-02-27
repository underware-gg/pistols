import React, { useMemo, useState, useRef } from 'react'
import { BigNumberish } from 'starknet'
import { Divider, Grid, Modal } from 'semantic-ui-react'
import { useAccount } from '@starknet-react/core'
import { usePistolsContext, usePistolsScene } from '/src/hooks/PistolsContext'
import { useIsMyAccount } from '/src/hooks/useIsYou'
import { useDuelistsOfOwner } from '/src/hooks/useTokenDuelists'
import { usePlayerBookmarkSignedMessage } from '/src/hooks/useSignedMessages'
import { useIsBookmarked, usePlayer } from '/src/stores/playerStore'
import { useSettings } from '/src/hooks/SettingsContext'
import { usePact } from '/src/hooks/usePact'
import { PlayerDescription } from '/src/components/account/PlayerDescription'
import { ProfilePic } from '/src/components/account/ProfilePic'
import { ActionButton } from '/src/components/ui/Buttons'
import { AddressShort } from '/src/components/ui/AddressShort'
import { DuelistCard, DuelistCardHandle } from '/src/components/cards/DuelistCard'
import { BookmarkIcon } from '/src/components/ui/Icons'
import { SceneName } from '/src/data/assets'
import { useTableId } from '/src/stores/configStore'
import { DUELIST_CARD_HEIGHT, DUELIST_CARD_WIDTH } from '/src/data/cardConstants'
import { useGameAspect } from '/src/hooks/useGameApect'

const Row = Grid.Row
const Col = Grid.Column

export default function PlayerModal() {
  const { dispatchSetScene } = usePistolsScene()
  const { selectedPlayerAddress, dispatchSelectPlayerAddress, dispatchSelectDuelistId } = usePistolsContext()
  const { name } = usePlayer(selectedPlayerAddress)
  const { isMyAccount } = useIsMyAccount(selectedPlayerAddress)

  const { aspectWidth } = useGameAspect()

  const isOpen = useMemo(() => (selectedPlayerAddress > 0), [selectedPlayerAddress])

  const _close = () => {
    dispatchSelectPlayerAddress(0n)
  }

  const _gotoProfile = () => {
    dispatchSetScene(SceneName.Profile)
    _close()
  }

  const _gotoDuelist = (duelistId: bigint) => {
    dispatchSelectDuelistId(duelistId)
  }

  const { duelistIds, isLoading } = useDuelistsOfOwner(selectedPlayerAddress)
  const [pageNumber, setPageNumber] = useState(0)
  const cardRefs = useRef<{ [key: number]: DuelistCardHandle }>({})

  const duelistsPerPage = 3
  const pageCount = useMemo(() => Math.ceil(duelistIds.length / duelistsPerPage), [duelistIds])
  const paginatedDuelistIds = useMemo(() => (
    duelistIds.slice(
      pageNumber * duelistsPerPage,
      (pageNumber + 1) * duelistsPerPage
    )
  ), [duelistIds, pageNumber])

  const handlePrev = () => {
    setPageNumber(prev => Math.max(0, prev - 1))
  }

  const handleNext = () => {
    setPageNumber(prev => Math.min(Math.max(0, pageCount - 1), prev + 1))
  }

  // bookmark
  const { isBookmarked } = useIsBookmarked(selectedPlayerAddress)
  const { publish } = usePlayerBookmarkSignedMessage(selectedPlayerAddress, 0, !isBookmarked)

  return (
    <Modal
      basic
      size='fullscreen'
      onClose={() => _close()}
      open={isOpen}
      className=''
    >
      <div className='WantedPoster'>
        <div className='WantedText'>WANTED</div>
        
        <div className='ProfileSection'>
          <ProfilePic profilePic={0} duelistId={0n} square className='ProfilePicWanted' />
          <div className='PlayerName'>{name}</div>
          <div className='PlayerAddress'><AddressShort address={selectedPlayerAddress} /></div>
        </div>

        <div className='TextDivider WantedDivider'>Duelists:</div>

        <div className='DuelistsSection' style={{ height: `${aspectWidth(DUELIST_CARD_HEIGHT * 0.7)}px` }}>
          <button 
            className='NavButton' 
            onClick={handlePrev}
            disabled={pageNumber === 0}
          >←</button>
          {isLoading ? (
            <div className='DuelistCard'>Loading...</div>
          ) : duelistIds.length === 0 ? (
            <div className='DuelistCard'>No Duelists</div>
          ) : (
            [...Array(3)].map((_, i) => {
              const duelistId = paginatedDuelistIds[i]
              return (
                <div 
                  key={duelistId ? duelistId.toString() : `empty-${i}`}
                  className='DuelistCard'
                  style={{ width: `${aspectWidth(DUELIST_CARD_WIDTH * 0.7)}px`, height: `${aspectWidth(DUELIST_CARD_HEIGHT * 0.7)}px` }}
                  onClick={duelistId ? () => _gotoDuelist(duelistId) : undefined}
                >
                  {duelistId && (
                    <DuelistCard
                      ref={(ref: DuelistCardHandle | null) => {
                        if (ref) cardRefs.current[Number(duelistId)] = ref
                      }}
                      duelistId={Number(duelistId)}
                      isLeft={true}
                      isVisible={true}
                      isFlipped={true}
                      instantFlip={true}
                      isHighlightable={true}
                      width={DUELIST_CARD_WIDTH * 0.7}
                      height={DUELIST_CARD_HEIGHT * 0.7}
                      onClick={() => _gotoDuelist(duelistId)}
                    />
                  )}
                </div>
              )
            })
          )}
          <button 
            className='NavButton'
            onClick={handleNext}
            disabled={pageNumber >= pageCount - 1}
          >→</button>
        </div>

        <div className='TextDivider WantedDivider'></div>

        <div className='Spacer5' />

        <Grid className='ButtonSection' textAlign='center'>
          <Row columns='equal'>
            <Col>
              <ActionButton large fill label='Close' onClick={() => _close()} />
            </Col>
            <Col>
              {isMyAccount ? <ActionButton large fill important label='Manage Profile' onClick={() => _gotoProfile()} />
                : <ChallengeButton challengedPlayerAddress={selectedPlayerAddress} />
              }
            </Col>
          </Row>
        </Grid>
      </div>
    </Modal>
  )
}

export function ChallengeButton({
  challengedPlayerAddress,
}: {
  challengedPlayerAddress: BigNumberish,
}) {
  const { dispatchChallengingPlayerAddress, dispatchSetDuel } = usePistolsContext()
  const { address } = useAccount()
  const { duelistId } = useSettings()
  const { tableId } = useTableId()
  const { isMyAccount } = useIsMyAccount(challengedPlayerAddress)
  const { hasPact, pactDuelId } = usePact(tableId, address, challengedPlayerAddress)
  const canChallenge = (duelistId > 0n && !hasPact && !isMyAccount)

  if (!hasPact) {
    return <ActionButton large fill disabled={!canChallenge} label='Challenge for a Duel!' onClick={() => dispatchChallengingPlayerAddress(challengedPlayerAddress)} />
  } else {
    return <ActionButton large fill important label='Challenge In Progress!' onClick={() => dispatchSetDuel(pactDuelId)} />
  }
}
