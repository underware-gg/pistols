import React, { useMemo } from 'react'
import { Divider, Grid, Modal } from 'semantic-ui-react'
import { SceneName, usePistolsContext, usePistolsScene } from '@/pistols/hooks/PistolsContext'
import { useIsMyAccount } from '@/pistols/hooks/useIsYou'
import { usePlayer } from '@/pistols/stores/playerStore'
import { useDuelistsOfOwner } from '@/pistols/hooks/useDuelistToken'
import { PlayerDescription } from '@/pistols/components/account/PlayerDescription'
import { ProfilePic } from '@/pistols/components/account/ProfilePic'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { AddressShort } from '@/lib/ui/AddressShort'
import { DuelistItem } from '../account/AccountHeader'

const Row = Grid.Row
const Col = Grid.Column

export default function PlayerModal() {
  const { dispatchSetScene } = usePistolsScene()

  const { selectedPlayerAddress, dispatchSelectPlayerAddress, dispatchSelectDuelistId } = usePistolsContext()
  const { name } = usePlayer(selectedPlayerAddress)
  const { isMyAccount } = useIsMyAccount(selectedPlayerAddress)
  const profilePic = 0

  const isOpen = useMemo(() => (selectedPlayerAddress > 0), [selectedPlayerAddress])

  const _close = () => { dispatchSelectPlayerAddress(0n) }

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
      return <h3>Loading duelists...</h3>
    }
    if (duelistIds.length === 0) {
      return <h3>This player has no duelists.</h3>
    }
    return duelistIds.map((duelistId) => (
      <Row columns='equal'>
        <Col className='H3 Anchor DuelistItem' onClick={() => _gotoDuelist(duelistId)} >
          <DuelistItem duelistId={duelistId}/>
        </Col>
      </Row>
    ))
  }, [duelistIds, isLoading])

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
          <Row columns={'equal'}>
            <Col textAlign='left'>
              {name}
            </Col>
            <Col textAlign='right'>
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
            {isMyAccount &&
              <Col>
                <ActionButton large fill important label='Manage Profile' onClick={() => _gotoProfile()} />
              </Col>
            }
          </Row>
        </Grid>
      </Modal.Actions>
    </Modal>
  )
}
