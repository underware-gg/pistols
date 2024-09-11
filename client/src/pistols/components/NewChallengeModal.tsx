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
import { FormInput } from '@/pistols/components/ui/Form'
import { Balance } from '@/pistols/components/account/Balance'
import { WagerAndOrFees } from '@/pistols/components/account/LordsBalance'
import { ethToWei, validateCairoString } from '@/lib/utils/starknet'
import { ChallengeQuotes } from '@/pistols/utils/pistols'
import { Divider } from '@/lib/ui/Divider'
import { randomArrayElement } from '@/lib/utils/random'

const Row = Grid.Row
const Col = Grid.Column

export default function NewChallengeModal() {
  const { create_challenge } = useDojoSystemCalls()
  const { account, address } = useAccount()
  const { tableId, duelistId } = useSettings()

  const { challengingId, dispatchChallengingDuelistId, dispatchSelectDuelistId, dispatchSelectDuel } = usePistolsContext()
  const isOpen = useMemo(() => (challengingId > 0n), [challengingId])
  const duelistIdA = duelistId
  const duelistIdB = challengingId
  const addressA = address
  const addressB = challengingId

  const _close = () => { dispatchChallengingDuelistId(0n) }

  const { profilePic: profilePicA } = useDuelist(duelistIdA)
  const { profilePic: profilePicB } = useDuelist(duelistIdB)
  const { hasPact: hasPactDuelist, pactDuelId: pactDuelIdDuelist } = usePact(tableId, duelistIdA, duelistIdB)
  const { hasPact: hasPactAddress, pactDuelId: pactDuelIdAddress } = usePact(tableId, addressA, addressB)

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
    if (hasPactDuelist) {
      dispatchSelectDuel(pactDuelIdDuelist)
    } else if (hasPactAddress) {
      dispatchSelectDuel(pactDuelIdAddress)
    }
  }, [hasPactDuelist, hasPactAddress])

  const _create_challenge = () => {
    const _submit = async () => {
      setIsSubmitting(true)
      await create_challenge(account, duelistId, challengingId, args.premise, args.quote, tableId, args.wager_value, args.expire_hours)
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
                <ProfileDescription duelistId={duelistIdA} displayOwnerAddress={true} />
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
                <ProfileDescription duelistId={duelistIdB} address={duelistIdB} displayOwnerAddress={true} />
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
  const [quote, setQuote] = useState('')
  const [days, setDays] = useState(7)
  const [hours, setHours] = useState(0)
  const [value, setValue] = useState(0)
  const { fee } = useCalcFee(tableId, ethToWei(value))

  useEffectOnce(() => {
    setQuote(randomArrayElement(ChallengeQuotes))
  }, [])

  const canSubmit = useMemo(() => (quote.length > 3 && (days + hours) > 0), [quote, days, hours, value])

  useEffect(() => {
    setArgs(canSubmit ? {
      quote,
      expire_hours: ((days * 24 * 60 * 60) + hours),
      table_id: tableId,
      wager_value: ethToWei(value),
    } : null)
  }, [quote, days, hours, value])
  // console.log(canSubmit, days, hours, lords, quote)

  const [customQuote, setCustomQuote] = useState('')
  const quoteOptions: any[] = useMemo(() =>
    (ChallengeQuotes.includes(customQuote) ? ChallengeQuotes : [customQuote, ...ChallengeQuotes]).map(msg => ({
      key: msg.replace(' ', '_'),
      value: msg,
      text: msg,
    })), [customQuote])
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
          <span className='FormLabel'>&nbsp;Quote</span>
          <Dropdown
            options={quoteOptions}
            placeholder={'say something!'}
            search
            selection
            fluid
            allowAdditions
            additionLabel={''}
            value={quote}
            onAddItem={() => { }}
            onFocus={(e) => {
              setCustomQuote('')
              setQuote('')
            }}
            onChange={(e, { value }) => {
              const _msg = validateCairoString(value as string)
              if (!ChallengeQuotes.includes(_msg)) {
                setCustomQuote(_msg)
              }
              setQuote(_msg)
            }}
          />
        </Form.Field>

        <Form.Field>
          <span className='FormLabel'>&nbsp;Expiration</span>
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
          <FormInput
            label='Wager -- deposit now, winner takes all, minus fee'
            placeholder={'$LORDS'}
            value={canWager ? value.toString() : 'No wager in this Table'}
            setValue={(newValue) => {
              const _lords = newValue ? parseInt(newValue) : 0
              if (!isNaN(_lords)) {
                setValue(_lords)
              }
            }}
            maxLength={7}
            disabled={!canWager}
          />
        </Form.Field>

        <WagerAndOrFees big tableId={tableId} value={ethToWei(value)} fee={fee} prefixed />

      </Form>
    </div>
  )
}

