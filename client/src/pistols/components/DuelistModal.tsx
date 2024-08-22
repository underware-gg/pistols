import React, { useMemo } from 'react'
import { Grid, Modal } from 'semantic-ui-react'
import { useSettings } from '../hooks/SettingsContext'
import { usePistolsContext, usePistolsScene, SceneName } from '@/pistols/hooks/PistolsContext'
import { useDuelist } from '@/pistols/hooks/useDuelist'
import { usePact } from '@/pistols/hooks/usePact'
import { useDuelistOwner } from '@/pistols/hooks/useTokenDuelist'
import { useIsMyDuelist, useIsYou } from '@/pistols/hooks/useIsYou'
import { ProfilePic } from '@/pistols/components/account/ProfilePic'
import { ProfileDescription } from '@/pistols/components/account/ProfileDescription'
import { ChallengeTableSelectedDuelist } from '@/pistols/components/ChallengeTable'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { AddressShort } from '@/lib/ui/AddressShort'
import { IconClick } from '@/lib/ui/Icons'

const Row = Grid.Row
const Col = Grid.Column

export default function DuelistModal() {
  const { tableId, duelistId, isAnon, dispatchDuelistId } = useSettings()
  const { dispatchSetScene } = usePistolsScene()

  const { selectedDuelistId, dispatchSelectDuel, dispatchSelectDuelistId, dispatchChallengingDuelistId } = usePistolsContext()
  const { owner } = useDuelistOwner(selectedDuelistId)
  const isOpen = useMemo(() => (selectedDuelistId > 0), [selectedDuelistId])
  const { isYou } = useIsYou(selectedDuelistId)
  const isMyDuelist = useIsMyDuelist(selectedDuelistId)

  const _close = () => { dispatchSelectDuelistId(0n) }

  const { profilePic } = useDuelist(selectedDuelistId)
  const { hasPact, pactDuelId } = usePact(tableId, duelistId, selectedDuelistId)

  const _switch = () => {
    if (isYou) {
      dispatchSetScene(SceneName.Gate)
    } else if (isMyDuelist) {
      dispatchDuelistId(selectedDuelistId)
    }
  }

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
              Duelist
            </Col>
            <Col textAlign='center'>
              {/* {(isYou || isMyDuelist) &&
                <div className='Anchor' onClick={() => _switch()} >
                  <span className='Smaller'>{isYou ? 'Exit to Gate' : 'Switch Duelist'}</span>
                  &nbsp;
                  <Icon name={isYou ? 'sign out' : 'sync alternate'} size={'small'} />
                </div>
              } */}
              <span className='Smaller Important'>
                {isYou ? <>Current</>
                  : isMyDuelist ? <>Yours <IconClick important name='sync alternate' size='small' onClick={() => _switch()} /></>
                    : <></>
                }
              </span>
            </Col>
            <Col textAlign='right'>
              <AddressShort address={owner} />
            </Col>
          </Row>
        </Grid>
      </Modal.Header>
      <Modal.Content image className='DuelistModal Relative'>
        <ProfilePic profilePic={profilePic} duelistId={selectedDuelistId} />
        <Modal.Description className='FillParent'>
          <div className='DuelistModalDescription'>
            <ProfileDescription duelistId={selectedDuelistId} tableId={tableId} displayBalance displayStats />
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
              <ActionButton fill label='Close' onClick={() => _close()} />
            </Col>
            {!isYou &&
              <Col>
                {hasPact && <ActionButton fill important label='Challenge In Progress!' onClick={() => dispatchSelectDuel(pactDuelId)} />}
                {!hasPact && <ActionButton fill disabled={isAnon} label='Challenge for a Duel!' onClick={() => dispatchChallengingDuelistId(selectedDuelistId)} />}
              </Col>
            }
          </Row>
        </Grid>
      </Modal.Actions>
    </Modal>
  )
}
