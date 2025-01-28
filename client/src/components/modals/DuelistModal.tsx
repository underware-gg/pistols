import React, { useMemo } from 'react'
import { Grid, Modal } from 'semantic-ui-react'
import { useSettings } from '/src/hooks/SettingsContext'
import { usePistolsContext, usePistolsScene } from '/src/hooks/PistolsContext'
import { useIsMyDuelist, useIsYou } from '/src/hooks/useIsYou'
import { useOwnerOfDuelist } from '/src/hooks/useTokenDuelists'
import { useDuelist } from '/src/stores/duelistStore'
import { useDuelistTokenContract } from '/src/hooks/useTokenContract'
import { usePlayerBookmarkSignedMessage } from '/src/hooks/useSignedMessages'
import { useIsBookmarked, usePlayer } from '/src/stores/playerStore'
import { ProfilePic } from '/src/components/account/ProfilePic'
import { ProfileDescription } from '/src/components/account/ProfileDescription'
import { ChallengeTableSelectedDuelist } from '/src/components/ChallengeTable'
import { ActionButton } from '/src/components/ui/Buttons'
import { ChallengeButton } from './PlayerModal'
import { BookmarkIcon, IconClick } from '/src/components/ui/Icons'
import { SceneName } from '/src/data/assets'

const Row = Grid.Row
const Col = Grid.Column

export default function DuelistModal() {
  const { dispatchDuelistId } = useSettings()
  const { atProfile, dispatchSetScene } = usePistolsScene()

  const { selectedDuelistId, dispatchSelectDuelistId, dispatchSelectPlayerAddress } = usePistolsContext()
  const { owner } = useOwnerOfDuelist(selectedDuelistId)
  const { name: ownerName } = usePlayer(owner)
  const isOpen = useMemo(() => (selectedDuelistId > 0), [selectedDuelistId])
  const { isYou } = useIsYou(selectedDuelistId)
  const isMyDuelist = useIsMyDuelist(selectedDuelistId)
  const { profilePic, profileType, duelistIdDisplay } = useDuelist(selectedDuelistId)

  const _close = () => {
    dispatchSelectDuelistId(0n)
  }

  const _switch = () => {
    if (isYou) {
      dispatchSetScene(SceneName.Gate)
    } else if (isMyDuelist) {
      dispatchDuelistId(selectedDuelistId)
    }
  }

  const _gotoOwner = () => {
    dispatchSelectPlayerAddress(owner)
  }

  const _duel = () => {
    dispatchSetScene(SceneName.DuelsBoard)
    _close()
  }

  // bookmark
  const { duelistContractAddress } = useDuelistTokenContract()
  const { isBookmarked } = useIsBookmarked(duelistContractAddress, selectedDuelistId)
  const { publish } = usePlayerBookmarkSignedMessage(duelistContractAddress, selectedDuelistId, !isBookmarked)

  return (
    <Modal
      // size='large'
      // dimmer='inverted'
      onClose={() => _close()}
      open={isOpen}
      className='modal'
    >
      <Modal.Header>
        <Grid>
          <Row>
            <Col width={1} textAlign='center'>
              <BookmarkIcon isBookmarked={isBookmarked} onClick={publish} />
            </Col>
            <Col width={5} textAlign='left'>
              {duelistIdDisplay}
              {' '}
              {(isYou || isMyDuelist) &&
                <span className='Smaller Important'>
                  {isYou ? <>(Current)</>
                    : <>(Yours <IconClick important name='sync alternate' size='small' onClick={() => _switch()} />)</>
                  }
                </span>
              }
            </Col>
            <Col width={10} textAlign='right'>
              <div className='Anchor Important' onClick={() => _gotoOwner()}>{ownerName}</div>
            </Col>
          </Row>
        </Grid>
      </Modal.Header>
      <Modal.Content image className='DuelistModal Relative'>
        <ProfilePic profilePic={profilePic} profileType={profileType} duelistId={selectedDuelistId} />
        <Modal.Description className='FillParent'>
          <div className='DuelistModalDescription'>
            <ProfileDescription duelistId={selectedDuelistId} displayFameBalance displayStats />
            <div className='Spacer10' />
            <div className='TableInModal'>
              <ChallengeTableSelectedDuelist compact />
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
            {!isYou &&
              <Col>
                <ChallengeButton challengedPlayerAddress={owner} />
              </Col>
            }
            {atProfile &&
              <Col>
                <ActionButton large fill important label='Duel!' onClick={() => _duel()} />
              </Col>
            }
          </Row>
        </Grid>
      </Modal.Actions>
    </Modal>
  )
}
