import React, { useMemo } from 'react'
import { BigNumberish } from 'starknet'
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
import { bigintEquals, bigintToHex } from '@underware_gg/pistols-sdk/utils'
import { useTableId } from '/src/stores/configStore'

const Row = Grid.Row
const Col = Grid.Column

export default function PlayerModal() {
  const { dispatchSetScene } = usePistolsScene()
  const { selectedPlayerAddress, dispatchSelectPlayerAddress, dispatchSelectDuelistId } = usePistolsContext()
  const { name } = usePlayer(selectedPlayerAddress)
  const { isMyAccount } = useIsMyAccount(selectedPlayerAddress)

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
        <ProfilePic profilePic={0} duelistId={0n} />
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
            <Col>
              {isMyAccount ? <ActionButton large fill important label='Manage Profile' onClick={() => _gotoProfile()} />
                : <ChallengeButton challengedPlayerAddress={selectedPlayerAddress} />
              }
            </Col>
          </Row>
        </Grid>
      </Modal.Actions>
    </Modal>
  )
}

export function ChallengeButton({
  challengedPlayerAddress,
}: {
  challengedPlayerAddress: BigNumberish,
}) {
  const { dispatchChallengingPlayerAddress, dispatchSelectDuel } = usePistolsContext()
  const { address } = useAccount()
  const { duelistId } = useSettings()
  const { tableId } = useTableId()
  const { isMyAccount } = useIsMyAccount(challengedPlayerAddress)
  const { hasPact, pactDuelId } = usePact(tableId, address, challengedPlayerAddress)
  const canChallenge = (duelistId > 0n && !hasPact && !isMyAccount)

  if (!hasPact) {
    return <ActionButton large fill disabled={!canChallenge} label='Challenge for a Duel!' onClick={() => dispatchChallengingPlayerAddress(challengedPlayerAddress)} />
  } else {
    return <ActionButton large fill important label='Challenge In Progress!' onClick={() => dispatchSelectDuel(pactDuelId)} />
  }
}
