import React, { useMemo } from 'react'
import { Grid, Modal } from 'semantic-ui-react'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { usePistolsContext, usePistolsScene } from '@/pistols/hooks/PistolsContext'
import { useIsMyDuelist, useIsYou } from '@/pistols/hooks/useIsYou'
import { useOwnerOfDuelist } from '@/pistols/hooks/useDuelistToken'
import { useDuelist } from '@/pistols/stores/duelistStore'
import { usePact } from '@/pistols/hooks/usePact'
import { useDuelistTokenContract } from '@/pistols/hooks/useTokenContract'
import { usePlayerBookmarkSignedMessage } from '@/pistols/hooks/useSignedMessages'
import { useIsBookmarked, usePlayer } from '@/pistols/stores/playerStore'
import { ProfilePic } from '@/pistols/components/account/ProfilePic'
import { ProfileDescription } from '@/pistols/components/account/ProfileDescription'
import { ChallengeTableSelectedDuelist } from '@/pistols/components/ChallengeTable'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { BookmarkIcon, IconClick } from '@/lib/ui/Icons'
import { SceneName } from '@/pistols/data/assets'

const Row = Grid.Row
const Col = Grid.Column

export default function DuelistModal() {
  const { tableId, duelistId, isAnon, dispatchDuelistId } = useSettings()
  const { atProfile, dispatchSetScene } = usePistolsScene()

  const { selectedDuelistId, dispatchSelectDuel, dispatchSelectDuelistId, dispatchChallengingDuelistId, dispatchSelectPlayerAddress } = usePistolsContext()
  const { owner } = useOwnerOfDuelist(selectedDuelistId)
  const { name: ownerName } = usePlayer(owner)
  const isOpen = useMemo(() => (selectedDuelistId > 0), [selectedDuelistId])
  const { isYou } = useIsYou(selectedDuelistId)
  const isMyDuelist = useIsMyDuelist(selectedDuelistId)

  const _close = () => { dispatchSelectDuelistId(0n) }

  const { profilePic, duelistIdDisplay } = useDuelist(selectedDuelistId)
  const { hasPact, pactDuelId } = usePact(tableId, duelistId, selectedDuelistId)

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
    dispatchSetScene(SceneName.Duels)
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
        <ProfilePic profilePic={profilePic} duelistId={selectedDuelistId} />
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
                {hasPact && <ActionButton large fill important label='Challenge In Progress!' onClick={() => dispatchSelectDuel(pactDuelId)} />}
                {!hasPact && <ActionButton large fill disabled={isAnon} label='Challenge for a Duel!' onClick={() => dispatchChallengingDuelistId(selectedDuelistId)} />}
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
