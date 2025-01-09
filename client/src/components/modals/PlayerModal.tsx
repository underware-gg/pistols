import React, { useMemo } from 'react'
import { Divider, Grid, Modal } from 'semantic-ui-react'
import { useAccount } from '@starknet-react/core'
import { usePistolsContext, usePistolsScene } from '/src/hooks/PistolsContext'
import { useIsMyAccount } from '/src/hooks/useIsYou'
import { useDuelistsOfOwner } from '/src/hooks/useDuelistToken'
import { usePlayerBookmarkSignedMessage } from '/src/hooks/useSignedMessages'
import { useIsBookmarked, usePlayer } from '/src/stores/playerStore'
import { useSettings } from '/src/hooks/SettingsContext'
import { usePact } from '/src/hooks/usePact'
import { PlayerDescription } from '/src/components/account/PlayerDescription'
import { ProfilePic } from '/src/components/account/ProfilePic'
import { ActionButton } from '/src/components/ui/Buttons'
import { AddressShort } from '/src/components/ui/AddressShort'
import { DuelistItem } from '/src/components/account/AccountHeader'
import { BookmarkIcon } from '/src/components/ui/Icons'
import { SceneName } from '/src/data/assets'

const Row = Grid.Row
const Col = Grid.Column

export default function PlayerModal() {
  const { dispatchSetScene } = usePistolsScene()

  const { tableId, isAnon } = useSettings()
  const { selectedPlayerAddress, dispatchSelectPlayerAddress, dispatchSelectDuelistId, dispatchChallengingPlayerAddress, dispatchSelectDuel } = usePistolsContext()
  const { name } = usePlayer(selectedPlayerAddress)
  const { isMyAccount } = useIsMyAccount(selectedPlayerAddress)
  const profilePic = 0

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

  const { address } = useAccount()
  const { hasPact, pactDuelId } = usePact(tableId, address, selectedPlayerAddress)

  const { duelistIds, isLoading } = useDuelistsOfOwner(selectedPlayerAddress)
  const duelists = useMemo(() => {
    if (isLoading) {
      return <h3 key='loading'>Loading duelists...</h3>
    }
    if (duelistIds.length === 0) {
      return <h3 key='no-duelists'>This player has no duelists.</h3>
    }
    return duelistIds.map((duelistId) => (
      <Row key={`duelist-${duelistId}`} columns='equal'>
        <Col className='H3 Anchor DuelistItem' onClick={() => _gotoDuelist(duelistId)} >
          <DuelistItem duelistId={duelistId} />
        </Col>
      </Row>
    ))
  }, [duelistIds, isLoading])

  // bookmark
  const { isBookmarked } = useIsBookmarked(selectedPlayerAddress)
  const { publish } = usePlayerBookmarkSignedMessage(selectedPlayerAddress, 0, !isBookmarked)

  return (
    <Modal
      // size='large'
      // dimmer='inverted'
      onClose={() => _close()}
      open={isOpen}
      className=''
    >
      <Modal.Header>
        <Grid>
          <Row>
            <Col width={1} textAlign='center'>
              <BookmarkIcon isBookmarked={isBookmarked} onClick={publish} />
            </Col>
            <Col width={12} textAlign='left'>
              {name}
            </Col>
            <Col width={3} textAlign='right'>
              <AddressShort address={selectedPlayerAddress} />
            </Col>
          </Row>
        </Grid>
      </Modal.Header>
      <Modal.Content image className='DuelistModal Relative'>
        <ProfilePic profilePic={profilePic} duelistId={0n} />
        <Modal.Description className='FillParent'>
          <div className='DuelistModalDescription'>
            <PlayerDescription address={selectedPlayerAddress} displayFameBalance />
            <Divider />
            <div className='Spacer10' />
            <Grid className='TableInModal'>
              {duelists}
            </Grid>
          </div>
        </Modal.Description>
      </Modal.Content>
      <Modal.Actions className='NoPadding'>
        <Grid className='FillParent Padded' textAlign='center'>
          <Row columns='equal'>
            <Col>
              <ActionButton large fill label='Close' onClick={() => _close()} />
            </Col>
            {isMyAccount 
              ? <Col>
                <ActionButton large fill important label='Manage Profile' onClick={() => _gotoProfile()} />
              </Col>
              : <Col>
                {hasPact && <ActionButton large fill important label='Challenge In Progress!' onClick={() => dispatchSelectDuel(pactDuelId)} />}
                {!hasPact && <ActionButton large fill disabled={isAnon} label='Challenge for a Duel!' onClick={() => dispatchChallengingPlayerAddress(selectedPlayerAddress)} />}
              </Col>
            }
          </Row>
        </Grid>
      </Modal.Actions>
    </Modal>
  )
}
