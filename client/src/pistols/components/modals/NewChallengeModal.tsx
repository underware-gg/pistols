import React, { useEffect, useMemo, useState } from 'react'
import { Grid, Modal, Form, Dropdown } from 'semantic-ui-react'
import { useAccount } from '@starknet-react/core'
import { useDojoSystemCalls } from '@/lib/dojo/DojoContext'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { useDuelist } from '@/pistols/stores/duelistStore'
import { useTable } from '@/pistols/stores/tableStore'
import { usePact } from '@/pistols/hooks/usePact'
import { useCalcFeeDuel } from '@/pistols/hooks/useContractCalls'
import { ActionButton, BalanceRequiredButton } from '@/pistols/components/ui/Buttons'
import { ProfilePic } from '@/pistols/components/account/ProfilePic'
import { ProfileDescription } from '@/pistols/components/account/ProfileDescription'
import { FormInput } from '@/pistols/components/ui/Form'
import { FameBalanceDuelist, FeesToPay } from '@/pistols/components/account/LordsBalance'
import { PremisePrefix } from '@/pistols/utils/pistols'
import { Divider } from '@/lib/ui/Divider'
import { Premise } from '@/games/pistols/generated/constants'

const Row = Grid.Row
const Col = Grid.Column

export default function NewChallengeModal() {
  const { create_duel } = useDojoSystemCalls()
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

  const [args, setArgs] = useState(null)

  const { fee } = useCalcFeeDuel(tableId)
  const { tableIsOpen } = useTable(tableId)

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

  const _create_duel = () => {
    const _submit = async () => {
      setIsSubmitting(true)
      await create_duel(account, duelistId, challengingId, args.premise, args.quote, tableId, args.expire_hours)
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
        <ProfilePic profilePic={profilePicA} onClick={() => dispatchSelectDuelistId(duelistIdA)} displayBountyValue={0} />

        <Modal.Description className='Padded' style={{ width: '550px' }}>
          <Grid style={{ width: '350px' }}>
            <Row columns='equal' textAlign='left'>
              <Col>
                <ProfileDescription duelistId={duelistIdA} displayOwnerAddress={false} />
                <h5><FameBalanceDuelist duelistId={duelistIdA} /></h5>
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
                <h5><FameBalanceDuelist duelistId={duelistIdB} /></h5>
              </Col>
            </Row>
            <Row columns='equal' textAlign='right'>
              <Col>
                <Divider content='for a duel' nomargin />
              </Col>
            </Row>
            <Row columns='equal' textAlign='left'>
              <Col>
                <NewChallengeForm setArgs={setArgs} />
              </Col>
            </Row>
          </Grid>
        </Modal.Description>

        <ProfilePic profilePic={profilePicB} onClick={() => dispatchSelectDuelistId(duelistIdB)} displayBountyValue={0} />
      </Modal.Content>
      <Modal.Actions className='NoPadding'>
        <Grid className='FillParent Padded' textAlign='center'>
          <Row columns='equal'>
            <Col>
              <ActionButton large fill label='Nevermind!' onClick={() => _close()} />
            </Col>
            <Col>
              {tableIsOpen &&
                <BalanceRequiredButton
                  fee={fee}
                  disabled={!args || isSubmitting}
                  label='Submit Challenge!'
                  onClick={() => _create_duel()}
                />
              }
              {!tableIsOpen && <ActionButton large fill disabled negative label='Table is Closed!' onClick={() => { }} />}
            </Col>
          </Row>
        </Grid>
      </Modal.Actions>
    </Modal>
  )
}

function NewChallengeForm({
  setArgs,
}) {
  const { tableId } = useSettings()
  const [premise, setPremise] = useState(Premise.Honour)
  const [quote, setQuote] = useState('')
  const [days, setDays] = useState(7)
  const [hours, setHours] = useState(0)
  const { fee } = useCalcFeeDuel(tableId)

  const canSubmit = useMemo(() => (quote.length > 3 && (days + hours) > 0), [quote, days, hours])

  useEffect(() => {
    setArgs(canSubmit ? {
      premise,
      quote,
      expire_hours: ((days * 24 * 60 * 60) + hours),
      table_id: tableId,
    } : null)
  }, [premise, quote, days, hours])

  const premiseOptions: any[] = useMemo(() => Object.keys(Premise).slice(1).map((premise, index) => ({
    key: `${premise}`,
    value: `${premise}`,
    text: `${premise}`,
  })), [])

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
          <span className='FormLabel'>&nbsp;Premise</span>
          <Dropdown
            options={premiseOptions}
            placeholder={null}
            selection
            fluid
            value={premise}
            onChange={(e, { value }) => {
              setPremise(value as Premise)
            }}
          />
        </Form.Field>

        <Form.Field>
          <FormInput
            label={PremisePrefix[premise]}
            placeholder={'DESCRIBE YOUR REASONING'}
            value={quote}
            setValue={(newValue) => {
              setQuote(newValue)
            }}
            maxLength={31}
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

        <FeesToPay big value={0} fee={fee} prefixed />

      </Form>
    </div>
  )
}

