import React, { useEffect, useMemo, useState } from 'react'
import { Grid, Modal, Form, Dropdown } from 'semantic-ui-react'
import { useAccount } from '@starknet-react/core'
import { useEffectOnce } from '@/lib/utils/hooks/useEffectOnce'
import { useDojoSystemCalls } from '@/lib/dojo/DojoContext'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { useDuelist } from '@/pistols/hooks/useDuelist'
import { useTable, useTableAccountBalance } from '@/pistols/hooks/useTable'
import { usePact } from '@/pistols/hooks/usePact'
import { useCalcFee } from '@/pistols/hooks/useContractCalls'
import { ActionButton, BalanceRequiredButton } from '@/pistols/components/ui/Buttons'
import { ProfilePic } from '@/pistols/components/account/ProfilePic'
import { ProfileDescription } from '@/pistols/components/account/ProfileDescription'
import { WagerAndOrFees } from '@/pistols/components/account/LordsBalance'
import { ethToWei, validateCairoString } from '@/lib/utils/starknet'
import { ChallengeMessages } from '@/pistols/utils/pistols'
import { Divider } from '@/lib/ui/Divider'
import { randomArrayElement } from '@/lib/utils/random'
import { Balance } from './account/Balance'

const Row = Grid.Row
const Col = Grid.Column

export default function NewChallengeModal() {
 const { create_challenge } = useDojoSystemCalls()
  const { account } = useAccount()
  const { tableId, duelistId } = useSettings()

  const { challengingId, dispatchChallengingDuelistId, dispatchSelectDuelistId, dispatchSelectDuel } = usePistolsContext()
  const isOpen = useMemo(() => (challengingId > 0n), [challengingId])
  const duelistIdA = duelistId
  const duelistIdB = challengingId

  const _close = () => { dispatchChallengingDuelistId(0n) }

  const { profilePic: profilePicA } = useDuelist(duelistIdA)
  const { profilePic: profilePicB } = useDuelist(duelistIdB)
  const { hasPact, pactDuelId } = usePact(tableId, duelistIdA, duelistIdB)

  const { description: tableDescription } = useTable(tableId)
  const { balance: balanceA } = useTableAccountBalance(tableId, duelistIdA)
  const { balance: balanceB } = useTableAccountBalance(tableId, duelistIdB)

  const [args, setArgs] = useState(null)

  const wagerValue = useMemo(() => (args?.wager_value ?? 0n), [args])
  const { fee } = useCalcFee(tableId, wagerValue)
  const { canWager, wagerMin, tableIsOpen } = useTable(tableId)

  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setIsSubmitting(false)
  }, [isOpen])

  useEffect(() => {
    if (hasPact) {
      dispatchSelectDuel(pactDuelId)
    }
  }, [hasPact])

  const _create_challenge = () => {
    const _submit = async () => {
      setIsSubmitting(true)
      await create_challenge(account, duelistId, challengingId, args.message, tableId, args.wager_value, args.expire_seconds)
      setIsSubmitting(false)
    }
    if (args) _submit()
  }

  return (
    <Modal
      // size='large'
      // dimmer='inverted'
      onClose={() => _close()}
      onOpen={() => { }}
      open={isOpen}
    >
      <Modal.Header>
        <Grid>
          <Row>
            <Col width={4} textAlign='left' className='NoBreak'>
              New Challenge
            </Col>
            <Col width={8} textAlign='center' className='NoBreak Important'>
              {tableDescription}
            </Col>
            <Col width={4} textAlign='right'>
            </Col>
          </Row>
        </Grid>
      </Modal.Header>
      <Modal.Content image>
        <ProfilePic profilePic={profilePicA} onClick={() => dispatchSelectDuelistId(duelistIdA)} />

        <Modal.Description className='Padded' style={{ width: '550px' }}>
          <Grid style={{ width: '350px' }}>
            <Row columns='equal' textAlign='left'>
              <Col>
                <ProfileDescription duelistId={duelistIdA} displayOwnerAddress={false} />
                {canWager && <h5><Balance tableId={tableId} wei={balanceA} /></h5>}
              </Col>
            </Row>
            <Row columns='equal' textAlign='right'>
              <Col>
                <Divider content='is challenging' nomargin />
              </Col>
            </Row>
            <Row columns='equal' textAlign='right'>
              <Col>
                <ProfileDescription duelistId={duelistIdB} displayOwnerAddress={false} />
                {canWager && <h5><Balance tableId={tableId} wei={balanceB} /></h5>}
              </Col>
            </Row>
            <Row columns='equal' textAlign='right'>
              <Col>
                <Divider content='for a duel' nomargin />
              </Col>
            </Row>
            <Row columns='equal' textAlign='left'>
              <Col>
                <NewChallengeForm setArgs={setArgs} canWager={canWager} />
              </Col>
            </Row>
          </Grid>
        </Modal.Description>

        <ProfilePic profilePic={profilePicB} onClick={() => dispatchSelectDuelistId(duelistIdB)} />
      </Modal.Content>
      <Modal.Actions className='NoPadding'>
        <Grid className='FillParent Padded' textAlign='center'>
          <Row columns='equal'>
            <Col>
              <ActionButton fill label='Nevermind!' onClick={() => _close()} />
            </Col>
            <Col>
              {tableIsOpen &&
                <BalanceRequiredButton
                  tableId={tableId}
                  wagerValue={wagerValue}
                  minWagerValue={wagerMin}
                  fee={fee}
                  disabled={!args || isSubmitting}
                  label='Submit Challenge!'
                  onClick={() => _create_challenge()}
                />
              }
              {!tableIsOpen && <ActionButton fill disabled negative label='Table is Closed!' onClick={() => { }} />}
            </Col>
          </Row>
        </Grid>
      </Modal.Actions>
    </Modal>
  )
}

function NewChallengeForm({
  setArgs,
  canWager,
}) {
  const { tableId } = useSettings()
  const [message, setMessage] = useState('')
  const [days, setDays] = useState(7)
  const [hours, setHours] = useState(0)
  const [value, setValue] = useState(0)
  const { fee } = useCalcFee(tableId, ethToWei(value))

  useEffectOnce(() => {
    setMessage(randomArrayElement(ChallengeMessages))
  }, [])

  const canSubmit = useMemo(() => (message.length > 3 && (days + hours) > 0), [message, days, hours, value])

  useEffect(() => {
    setArgs(canSubmit ? {
      message,
      expire_seconds: (days * 24 * 60 * 60) + (hours * 60 * 60),
      table_id: tableId,
      wager_value: ethToWei(value),
    } : null)
  }, [message, days, hours, value])
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
    <div style={{ width: '350px' }}>
      <Form className=''>
        <Form.Field>
          <span className='FormLabel'>&nbsp;reasoning</span>
          {/* <input placeholder={_defaultMessage} value={message} maxLength={31} onChange={(e) => setMessage(e.target.value)} /> */}
          <Dropdown
            options={messageOptions}
            placeholder={'say something!'}
            search
            selection
            fluid
            allowAdditions
            additionLabel={''}
            value={message}
            onAddItem={() => { }}
            onFocus={(e) => {
              setCustomMessage('')
              setMessage('')
            }}
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
          <span className='FormLabel'>&nbsp;expiration</span>
          <Grid className='NoMargin'>
            <Row>
              <Col width={5}>
                <Dropdown className='FillWidth' defaultValue='7' placeholder='Days' selection options={daysOptions} onChange={(e, { value }) => setDays(parseInt(value as string))} />
              </Col>
              <Col width={5}>
                <Dropdown className='FillWidth' defaultValue='0' placeholder='Hours' selection options={hoursOptions} onChange={(e, { value }) => setHours(parseInt(value as string))} />
              </Col>
            </Row>
          </Grid>
        </Form.Field>

        <Form.Field>
          <span className='FormLabel'>&nbsp;wager (deposit now, winner takes all, minus fee)</span>
          <input
            disabled={!canWager}
            placeholder={'$LORDS'}
            value={canWager ? value : 'No wager in this Table'}
            maxLength={12}
            onChange={(e) => {
              const _input = e.target.value as string
              const _lords = _input ? parseInt(_input) : 0
              if (!isNaN(_lords)) {
                setValue(_lords)
              }
            }}
          />
        </Form.Field>

        <WagerAndOrFees big tableId={tableId} value={ethToWei(value)} fee={fee} prefixed />

      </Form>
    </div>
  )
}

