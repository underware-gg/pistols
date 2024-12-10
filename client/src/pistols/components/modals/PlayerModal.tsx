import React, { useMemo } from 'react'
import { Divider, Grid, Modal } from 'semantic-ui-react'
import { SceneName, usePistolsContext, usePistolsScene } from '@/pistols/hooks/PistolsContext'
import { useIsMyAccount } from '@/pistols/hooks/useIsYou'
import { usePlayer } from '@/pistols/stores/playerStore'
import { ProfilePic } from '@/pistols/components/account/ProfilePic'
import { PlayerDescription } from '@/pistols/components/account/PlayerDescription'
import { ChallengeTableSelectedDuelist } from '@/pistols/components/ChallengeTable'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { AddressShort } from '@/lib/ui/AddressShort'
import { useDuelistsOfOwner } from '@/pistols/hooks/useDuelistToken'

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

  // const { duelistIds } = useDuelistsOfOwner(selectedPlayerAddress)
  // const duelists = useMemo(() => {
  //   return []
  // }, [duelistIds])
  const duelists = <>DUELISTS...</>

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
            <div className='TableInModal'>
              {duelists}
            </div>
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
