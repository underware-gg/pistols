import React, { useEffect, useMemo, useState } from 'react'
import { Grid, Modal, Image } from 'semantic-ui-react'
import { useMounted } from '@/lib/utils/hooks/useMounted'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { useTable } from '@/pistols/hooks/useTable'
import { Opener } from '@/lib/ui/useOpener'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { useAccount } from '@starknet-react/core'
import { useDojoSystemCalls } from '@/lib/dojo/DojoContext'
import { useChallengeToSelf, useTornaDuelistIds } from './IRLTournamentTab'
import { usePlayerId } from '@/lib/dojo/hooks/usePlayerId'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'

const Row = Grid.Row
const Col = Grid.Column

export default function IRLTournamentModal({
  opener,
  inChallenge,
}: {
  opener: Opener
    inChallenge: boolean
}) {
  // always closed on mount
  const mounted = useMounted(() => {
    opener.close()
  })

  //
  // Select
  const { duelistId, dispatchDuelistId, tableId } = useSettings()
  const [selectedArchetype, setSelectedArchetype] = useState(0)
  useEffect(() => {
    if (opener.isOpen) setSelectedArchetype(0)
  }, [opener.isOpen])

  const { duelistIds, validIds } = useTornaDuelistIds()
  useEffect(() => {
    if (selectedArchetype) {
      dispatchDuelistId(duelistIds[selectedArchetype - 1])
    }
  }, [selectedArchetype, duelistIds])

  //
  // Challenge
  const { create_challenge, reply_challenge } = useDojoSystemCalls()
  const { duelId } = useChallengeToSelf()
  const { account, address } = useAccount()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const wagerValue = 0n;
  const expireSeconds = (60 * 60);
  const isReply = Boolean(duelId)
  const _challenge = () => {
    const _submit = async () => {
      setIsSubmitting(true)
      if (isReply) {
        // accept challenge
        await reply_challenge(account, duelistId, duelId, true)
      } else {
        // challenge self
        await create_challenge(account, duelistId, address, 'For Honour!', tableId, wagerValue, expireSeconds)
      }
      setIsSubmitting(false)
    }
    if (duelistId) {
      _submit()
    }
  }

  return (
    <Modal
      size={'small'}
      // dimmer='inverted'
      onClose={() => opener.close()}
      open={mounted && opener.isOpen && !inChallenge}
    >
      <Modal.Header>
        <Grid>
          <Row columns={'equal'}>
            <Col textAlign='center'>
              Pick Your Archetype
            </Col>
          </Row>
        </Grid>
      </Modal.Header>
      <Modal.Content>
        <Grid>
          <Row columns={'equal'} className='TornaContents'>
            <Col textAlign='center'>
              <Image src={'/images/torna_cards_1.jpg'} className={selectedArchetype == 1 ? 'TornaImageSelected' : 'TornaImage'} onClick={() => setSelectedArchetype(1)} />
            </Col>
            <Col>
              <Image src={'/images/torna_cards_2.jpg'} className={selectedArchetype == 2 ? 'TornaImageSelected' : 'TornaImage'} onClick={() => setSelectedArchetype(2)} />
            </Col>
            <Col>
              <Image src={'/images/torna_cards_3.jpg'} className={selectedArchetype == 3 ? 'TornaImageSelected' : 'TornaImage'} onClick={() => setSelectedArchetype(3)} />
            </Col>
          </Row>
        </Grid>
      </Modal.Content>
      <Modal.Actions className='NoPadding'>
        <Grid className='FillParent Padded' textAlign='center'>
          <Row columns='equal'>
            <Col>
              <ActionButton fill label='Close' onClick={() => opener.close()} />
            </Col>
            <Col>
              <ActionButton fill important label={isReply ? 'Your Opponent is Waiting!' : 'Challenge Your Opponent!'} disabled={!selectedArchetype || isSubmitting} onClick={() => _challenge()} />
            </Col>
          </Row>
        </Grid>
      </Modal.Actions>
    </Modal>
  )
}

