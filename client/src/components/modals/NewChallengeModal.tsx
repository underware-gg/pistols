import React, { useEffect, useMemo, useState } from 'react'
import { Grid, Modal, Form, Dropdown } from 'semantic-ui-react'
import { BigNumberish } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { useDojoSystemCalls } from '@underware_gg/pistols-sdk/dojo'
import { usePistolsContext } from '/src/hooks/PistolsContext'
import { useSettings } from '/src/hooks/SettingsContext'
import { useTableId } from '/src/stores/configStore'
import { useDuelist } from '/src/stores/duelistStore'
import { useTable } from '/src/stores/tableStore'
import { usePact } from '/src/hooks/usePact'
import { useCalcFeeDuel, useCalcSeasonReward, useCanJoin } from '/src/hooks/usePistolsContractCalls'
import { ActionButton, BalanceRequiredButton } from '/src/components/ui/Buttons'
import { formatOrdinalNumber } from '@underware_gg/pistols-sdk/utils'
import { ProfilePic } from '/src/components/account/ProfilePic'
import { ProfileDescription } from '/src/components/account/ProfileDescription'
import { FormInput } from '/src/components/ui/Form'
import { FeesToPay } from '/src/components/account/LordsBalance'
import { Divider } from '/src/components/ui/Divider'
import { Balance } from '/src/components/account/Balance'
import { constants } from '@underware_gg/pistols-sdk/pistols/gen'
import { useFameBalanceDuelist } from '/src/hooks/useFame'

const Row = Grid.Row
const Col = Grid.Column

export default function NewChallengeModal() {
  const { duel_token } = useDojoSystemCalls()
  const { account, address } = useAccount()
  const { tableId } = useTableId()
  const { duelistId } = useSettings()

  const { challengingAddress, dispatchChallengingPlayerAddress, dispatchSelectDuelistId, dispatchSelectDuel } = usePistolsContext()
  const isOpen = useMemo(() => (challengingAddress > 0n), [challengingAddress])
  const duelistIdA = duelistId
  const addressA = address
  const addressB = challengingAddress

  const _close = () => { dispatchChallengingPlayerAddress(0n) }

  const { profilePic: profilePicA, profileType: profileTypeA } = useDuelist(duelistIdA)

  const { hasPact, pactDuelId } = usePact(tableId, addressA, addressB)

  const { description: tableDescription } = useTable(tableId)

  const [args, setArgs] = useState<any>(null)

  const { fee } = useCalcFeeDuel(tableId)
  const { canJoin } = useCanJoin(tableId, duelistId)
  const { rewards } = useCalcSeasonReward(tableId, duelistId, args?.lives_staked)

  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setIsSubmitting(false)
  }, [isOpen])

  useEffect(() => {
    if (hasPact) {
      dispatchSelectDuel(pactDuelId)
    }
  }, [hasPact])

  const _create_duel = () => {
    const _submit = async () => {
      setIsSubmitting(true)
      await duel_token.create_duel(account, duelistId, challengingAddress, args.premise, args.quote, tableId, args.expire_hours, args.lives_staked)
      setIsSubmitting(false)
    }
    if (args?.canSubmit) _submit()
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
        <ProfilePic profilePic={profilePicA} profileType={profileTypeA} onClick={() => dispatchSelectDuelistId(duelistIdA)} displayBountyValue={0} />

        <Modal.Description className='Padded' style={{ width: '550px' }}>
          <Grid style={{ width: '350px' }}>
            <Row columns='equal' textAlign='left'>
              <Col>
                <ProfileDescription duelistId={duelistIdA} displayOwnerAddress={false} displayFameBalance />
              </Col>
            </Row>
            <Row columns='equal' textAlign='right'>
              <Col>
                <Divider content='is challenging' nomargin />
              </Col>
            </Row>
            <Row columns='equal' textAlign='right'>
              <Col>
                <ProfileDescription duelistId={0} address={challengingAddress} displayOwnerAddress={false} displayFameBalance />
              </Col>
            </Row>
            <Row columns='equal' textAlign='right'>
              <Col>
                <Divider content='for a duel' nomargin />
              </Col>
            </Row>
            <Row columns='equal' textAlign='left'>
              <Col>
                <NewChallengeForm duelistId={duelistIdA} setArgs={setArgs} />
              </Col>
            </Row>
            {fee > 0n &&
              <Row columns='equal' textAlign='left'>
                <Col>
                  <FeesToPay big value={0} fee={fee} prefixed />
                </Col>
              </Row>
            }
            <Row columns='equal' textAlign='left'>
              <Col className='H3'>
                Winning...
                {' '}
                <Balance fame wei={rewards?.win?.fame_gained} />
                {' / '}
                <Balance fools wei={rewards?.win?.fools_gained} />
                {' / '}
                {rewards?.win?.points_scored} points
                {' / '}
                {formatOrdinalNumber(rewards?.win?.position)} place
              </Col>
            </Row>
            <Row columns='equal' textAlign='left'>
              <Col className='H3'>
                Losing...
                {' '}
                <Balance fame wei={rewards?.lose?.fame_lost} />
                {' and '}
                {rewards?.lose?.survived ? 'survives' : 'dies!'}
              </Col>
            </Row>
          </Grid>
        </Modal.Description>

        <ProfilePic profilePic={0} profileType={profileTypeA} onClick={() => dispatchSelectDuelistId(0, challengingAddress)} displayBountyValue={0} />
      </Modal.Content>
      <Modal.Actions className='NoPadding'>
        <Grid className='FillParent Padded' textAlign='center'>
          <Row columns='equal'>
            <Col>
              <ActionButton large fill label='Nevermind!' onClick={() => _close()} />
            </Col>
            <Col>
              {canJoin &&
                <BalanceRequiredButton
                  fee={fee}
                  disabled={!args?.canSubmit || isSubmitting}
                  label='Submit Challenge!'
                  onClick={() => _create_duel()}
                />
              }
              {!canJoin && <ActionButton large fill disabled negative label='Table is Closed!' onClick={() => { }} />}
            </Col>
          </Row>
        </Grid>
      </Modal.Actions>
    </Modal>
  )
}

function NewChallengeForm({
  duelistId,
  setArgs,
}: {
  duelistId: BigNumberish
  setArgs: (args: any) => void
}) {
  const { tableId } = useTableId()
  const { lives } = useFameBalanceDuelist(duelistId)
  
  const [premise, setPremise] = useState(constants.Premise.Honour)
  const [quote, setQuote] = useState('')
  const [days, setDays] = useState(7)
  const [hours, setHours] = useState(0)
  const [lives_staked, setLivesStaked] = useState(1)

  const canSubmit = useMemo(() => (quote.length > 3 && (days + hours) > 0), [quote, days, hours])

  useEffect(() => {
    setArgs({
      premise,
      quote,
      expire_hours: ((days * 24) + hours),
      lives_staked,
      table_id: tableId,
      canSubmit,
    })
  }, [canSubmit, premise, quote, days, hours, lives_staked])

  const premiseOptions: any[] = useMemo(() => Object.keys(constants.Premise).slice(1).map((premise, index) => ({
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

  const livesOptions: any[] = useMemo(() => [...Array(lives).keys()].map(index => ({
    key: `${index + 1}`,
    value: `${index + 1}`,
    text: `${index + 1} lives`,
  })), [lives])

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
            value={constants.PREMISES[premise].name}
            onChange={(e, { value }) => {
              setPremise(value as constants.Premise)
            }}
          />
        </Form.Field>

        <Form.Field>
          <FormInput
            label={constants.PREMISES[premise].prefix}
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
                Days
                <Dropdown className='FillWidth' defaultValue='7' placeholder='Days' selection options={daysOptions} onChange={(e, { value }) => setDays(parseInt(value as string))} />
              </Col>
              <Col width={5}>
                Hours
                <Dropdown className='FillWidth' defaultValue='0' placeholder='Hours' selection options={hoursOptions} onChange={(e, { value }) => setHours(parseInt(value as string))} />
              </Col>
              <Col width={5}>
                Lives Staked
                <Dropdown className='FillWidth' defaultValue='1' placeholder='Lives' selection options={livesOptions} onChange={(e, { value }) => setLivesStaked(parseInt(value as string))} />
              </Col>
            </Row>
          </Grid>
        </Form.Field>
      </Form>
    </div>
  )
}

