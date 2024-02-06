import React, { useEffect, useMemo, useState } from 'react'
import { Grid, Table, Modal, Form, Divider, Dropdown } from 'semantic-ui-react'
import { useDojoAccount, useDojoSystemCalls } from '@/dojo/DojoContext'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { useDuelist } from '@/pistols/hooks/useDuelist'
import { ProfileDescription } from '@/pistols/components/account/ProfileDescription'
import { ProfilePic } from '@/pistols/components/account/ProfilePic'
import { ChallengeTableByDuelist } from '@/pistols/components/ChallengeTable'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { ChallengeMessages } from '@/pistols/utils/pistols'
import { useEffectOnce } from '@/pistols/hooks/useEffectOnce'
import { randomArrayElement } from '@/pistols/utils/utils'
import { validateCairoString } from '@/pistols/utils/starknet'
import { usePact } from '@/pistols/hooks/usePact'

const Row = Grid.Row
const Col = Grid.Column
const Cell = Table.HeaderCell

export default function DuelistModal() {
  const { create_challenge } = useDojoSystemCalls()
  const { account, isMasterAccount } = useDojoAccount()

  const { atDuelists, duelistAddress, dispatchSelectDuelist, dispatchSelectDuel } = usePistolsContext()
  const { name, profilePic } = useDuelist(duelistAddress)
  const { hasPact, pactDuelId } = usePact(account.address, duelistAddress)
  const [isChallenging, setIsChallenging] = useState(false)
  const [challengeArgs, setChallengeArgs] = useState(null)

  const isYou = useMemo(() => (duelistAddress == BigInt(account.address)), [duelistAddress, account])
  const isOpen = useMemo(() => (duelistAddress > 0), [duelistAddress])

  useEffect(() => {
    setIsChallenging(false)
  }, [isOpen])

  useEffect(() => {
    if (hasPact) {
      dispatchSelectDuel(pactDuelId)
    }
  }, [hasPact])

  const _close = () => { dispatchSelectDuelist(0n) }
  const _challenge = () => {
    if (challengeArgs) {
      create_challenge(account, duelistAddress, '', challengeArgs.message, challengeArgs.expire_seconds)
    }
  }

  return (
    <Modal
      // size='small'
      // dimmer='inverted'
      onClose={() => _close()}
      // onOpen={() => setIsChallenging(false)}
      open={isOpen}
    >
      <Modal.Header>Duelist</Modal.Header>
      <Modal.Content image>
        <ProfilePic profilePic={profilePic} />
        <Modal.Description className='FillParent'>
          <ProfileDescription address={duelistAddress} displayStats />
          <Divider />
          {!isChallenging && <div className='TableInModal'><ChallengesList duelistAddress={duelistAddress} /></div>}
          {isChallenging && <CreateChallenge setChallengeArgs={setChallengeArgs} />}
        </Modal.Description>
      </Modal.Content>
      <Modal.Actions>
        <Grid className='FillParent Padded' textAlign='center'>
          <Row columns='equal'>
            <Col>
              {!isChallenging && <ActionButton fill label='Close' onClick={() => _close()} />}
              {isChallenging && <ActionButton fill label='Back Out' onClick={() => setIsChallenging(false)} />}
            </Col>
            {!isYou &&
              <Col>
                {
                  hasPact ? <ActionButton fill attention label='Existing Challenge!' onClick={() => dispatchSelectDuel(pactDuelId)} />
                    : isChallenging ? <ActionButton fill disabled={!challengeArgs} label='Submit Challenge!' onClick={() => _challenge()} />
                      : <ActionButton fill disabled={isMasterAccount} label='Challenge for a Duel!' onClick={() => setIsChallenging(true)} />
                }
              </Col>
            }
          </Row>
        </Grid>
      </Modal.Actions>
    </Modal>
  )
}

function ChallengesList({
  duelistAddress
}) {
  return (
    <div style={{ width: '620px' }}>
      <ChallengeTableByDuelist address={duelistAddress} compact />
    </div>
  )
}

function CreateChallenge({
  setChallengeArgs
}) {
  const [message, setMessage] = useState('')
  const [days, setDays] = useState(7)
  const [hours, setHours] = useState(0)
  const [lords, setLords] = useState(0)

  useEffectOnce(() => {
    setMessage(randomArrayElement(ChallengeMessages))
  }, [])

  const canSubmit = useMemo(() => (message.length > 3 && (days + hours) > 0), [message, days, hours, lords])

  useEffect(() => {
    setChallengeArgs(canSubmit ? {
      message,
      expire_seconds: (days * 24 * 60 * 60) + (hours * 60 * 60),
      lords,
    } : null)
  }, [message, days, hours, lords])
  // console.log(canSubmit, days, hours, lords, message)

  const [customMessage, setCustomMessage] = useState('')
  const messageOptions: any[] = useMemo(() =>
    (ChallengeMessages.includes(customMessage) ? ChallengeMessages : [customMessage, ...ChallengeMessages]).map(msg => ({
      key: msg.replace(' ', '_'),
      value: msg,
      text: msg,
    })), [customMessage])
  const daysOptions: any[] = useMemo(() => Array.from(Array(8).keys()).map(index => ({
    key: `${index}d`,
    value: `${index}`,
    text: `${index} days`,
  })), [])
  const hoursOptions: any[] = useMemo(() => Array.from(Array(24).keys()).map(index => ({
    key: `${index}h`,
    value: `${index}`,
    text: `${index} hours`,
  })), [])

  return (
    <div style={{width: '430px'}}>
      <h1>Challenge Conditions</h1>
      <br />

      <Form>
        <Form.Field>
          <span className='FormLabel'>What do you have to say?</span>
          {/* <input placeholder={_defaultMessage} value={message} maxLength={31} onChange={(e) => setMessage(e.target.value)} /> */}
          <Dropdown
            options={messageOptions}
            placeholder={'say something!'}
            search
            selection
            fluid
            allowAdditions
            value={message}
            onAddItem={() => { }}
            onChange={(e, { value }) => {
              const _msg = validateCairoString(value as string)
              if (!ChallengeMessages.includes(_msg)) {
                setCustomMessage(_msg)
              }
              setMessage(_msg)
            }}
          />
        </Form.Field>
        <Form.Field>
          <span className='FormLabel'>Expiry</span>
          <Grid className='NoMargin' columns={'equal'}>
            <Row>
              <Col>
                <Dropdown defaultValue='7' placeholder='Days' selection options={daysOptions} onChange={(e, { value }) => setDays(parseInt(value as string))} />
              </Col>
              <Col>
                <Dropdown defaultValue='0' placeholder='Hours' selection options={hoursOptions} onChange={(e, { value }) => setHours(parseInt(value as string))} />
              </Col>
            </Row>
          </Grid>
        </Form.Field>
        <Form.Field>
          <span className='FormLabel'>Stake $LORDS (disabled)</span>
          <input placeholder={'$LORDS'} value={lords} maxLength={6} onChange={(e) => {
            const _lords = parseInt(e.target.value as string)
            if (!isNaN(_lords)) {
              setLords(_lords)
            }
          }} />
        </Form.Field>

      </Form>


    </div>
  )
}

