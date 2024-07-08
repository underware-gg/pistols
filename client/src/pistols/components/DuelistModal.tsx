import React, { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Grid, Modal, Icon } from 'semantic-ui-react'
import { useSettings } from '../hooks/SettingsContext'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { useDuelist } from '@/pistols/hooks/useDuelist'
import { usePact } from '@/pistols/hooks/usePact'
import { useDuelistOwner } from '@/pistols/hooks/useTokenDuelist'
import { useIsMyDuelist, useIsYou } from '@/pistols/hooks/useIsMyDuelist'
import { ProfilePic } from '@/pistols/components/account/ProfilePic'
import { ProfileDescription } from '@/pistols/components/account/ProfileDescription'
import { ChallengeTableByDuelist } from '@/pistols/components/ChallengeTable'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { AddressShort } from '@/lib/ui/AddressShort'

const Row = Grid.Row
const Col = Grid.Column

export default function DuelistModal() {
  const { tableId, duelistId, isGuest, dispatchDuelistId } = useSettings()
  const router = useRouter()

  const { selectedDuelistId, dispatchSelectDuel, dispatchSelectDuelistId, dispatchChallengingDuelistId } = usePistolsContext()
  const { owner } = useDuelistOwner(selectedDuelistId)
  const isOpen = useMemo(() => (selectedDuelistId > 0), [selectedDuelistId])
  const isYou = useIsYou(selectedDuelistId)
  const isMyDuelist = useIsMyDuelist(selectedDuelistId)

  const _close = () => { dispatchSelectDuelistId(0n) }

  const { profilePic } = useDuelist(selectedDuelistId)
  const { hasPact, pactDuelId } = usePact(tableId, duelistId, selectedDuelistId)

  const _switch = () => {
    if (isYou) {
      router.push(`/gate`)
    } else if (isMyDuelist) {
      dispatchDuelistId(selectedDuelistId)
    }
  }

  return (
    <Modal
      // size='small'
      // dimmer='inverted'
      onClose={() => _close()}
      open={isOpen}
    >
      <Modal.Header>
        <Grid>
          <Row columns={'equal'}>
            <Col textAlign='left'>
              Duelist
            </Col>
            <Col textAlign='center'>
              {(isYou || isMyDuelist) &&
                <div className='Anchor' onClick={() => _switch()} >
                  <span className='Smaller'>{isYou ? 'Exit to Gate' : 'Switch Duelist'}</span>
                  &nbsp;
                  <Icon name={isYou ? 'sign out' : 'sync alternate'} size={'small'} />
                </div>
              }
            </Col>
            <Col textAlign='right'>
              <AddressShort address={owner} />
            </Col>
          </Row>
        </Grid>
      </Modal.Header>
      <Modal.Content image>
        <ProfilePic profilePic={profilePic} />
        <Modal.Description className='FillParent'>
          <div className='DuelistModalDescription'>
            <ProfileDescription duelistId={selectedDuelistId} displayStats displayBalance />
            <div className='Spacer10' />
            <div className='TableInModal'>
              <ChallengeTableByDuelist duelistId={selectedDuelistId} compact tableId={tableId} />
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
                {!hasPact && <ActionButton fill disabled={isGuest} label='Challenge for a Duel!' onClick={() => dispatchChallengingDuelistId(selectedDuelistId)} />}
              </Col>
            }
          </Row>
        </Grid>
      </Modal.Actions>
    </Modal>
  )
}
