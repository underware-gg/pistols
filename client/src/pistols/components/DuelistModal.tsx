import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Grid, Modal, Form, Divider, Dropdown, Icon } from 'semantic-ui-react'
import { useDojoAccount, useDojoSystemCalls } from '@/dojo/DojoContext'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { useDuelist } from '@/pistols/hooks/useDuelist'
import { usePact } from '@/pistols/hooks/usePact'
import { useCalcFee } from '@/pistols/hooks/useContractCalls'
import { useEffectOnce } from '@/pistols/hooks/useEffectOnce'
import { ethToWei, validateCairoString } from '@/pistols/utils/starknet'
import { ProfileDescription } from '@/pistols/components/account/ProfileDescription'
import { ProfilePic } from '@/pistols/components/account/ProfilePic'
import { ChallengeTableByDuelist } from '@/pistols/components/ChallengeTable'
import { ActionButton, BalanceRequiredButton } from '@/pistols/components/ui/Buttons'
import { ChallengeMessages } from '@/pistols/utils/pistols'
import { randomArrayElement } from '@/pistols/utils/utils'
import { AccountShort } from '@/pistols/components/account/Account'
import { WagerAndOrFees } from '@/pistols/components/account/Wager'
import { COIN_LORDS, useCoin } from '@/pistols/hooks/useConfig'

const Row = Grid.Row
const Col = Grid.Column

export default function DuelistModal() {
  const { create_challenge } = useDojoSystemCalls()
  const { account, isMasterAccount } = useDojoAccount()
  const router = useRouter()

  const { duelistAddress, dispatchSelectDuelist, dispatchSelectDuel } = usePistolsContext()
  const { name, profilePic } = useDuelist(duelistAddress)
  const { hasPact, pactDuelId } = usePact(account.address, duelistAddress)
  const [isChallenging, setIsChallenging] = useState(false)
  const [args, setArgs] = useState(null)

  const wagerValue = useMemo(() => (args?.wager_value ?? 0n), [args])
  const { fee } = useCalcFee(COIN_LORDS, wagerValue)

  const isYou = useMemo(() => (duelistAddress == BigInt(account.address)), [duelistAddress, account])
  const isOpen = useMemo(() => (duelistAddress > 0), [duelistAddress])

  useEffect(() => {
    setIsChallenging(false)
  }, [isOpen])

  useEffect(() => {
    if (isChallenging && hasPact) {
      dispatchSelectDuel(pactDuelId)
    }
  }, [isChallenging, hasPact])

  const _close = () => {
    dispatchSelectDuelist(0n)
  }
  const _switchDuelist = () => {
    dispatchSelectDuelist(0n)
    router.push(`/gate`)
  }
  const _challenge = () => {
    if (args) {
      create_challenge(account, duelistAddress, args.message, args.wager_coin, args.wager_value, args.expire_seconds)
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
      <Modal.Header>
        <Grid>
          <Row>
            <Col width={8} textAlign='left'>
              Duelist
              &nbsp;&nbsp;&nbsp;
              <AccountShort address={duelistAddress} suffix='' />
            </Col>
            <Col width={7} textAlign='right'>
              {isYou &&
                <span className='Smaller'>switch duelist</span>
              }
            </Col>
            <Col width={1} textAlign='right'>
              {isYou &&
                <Icon className='Anchor IconClick' name='users' size={'small'} onClick={() => _switchDuelist()} />
              }
            </Col>
          </Row>
        </Grid>
      </Modal.Header>
      <Modal.Content image>
        <ProfilePic profilePic={profilePic} />
        <Modal.Description className='FillParent' style={{ width: '200px' }}>
          <ProfileDescription address={duelistAddress} displayStats displayBalance />
          <div className='Spacer10' />
          {!isChallenging && <div className='TableInModal'><ChallengesList duelistAddress={duelistAddress} /></div>}
          {isChallenging && <CreateChallenge setArgs={setArgs} />}
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
                    : isChallenging ? <BalanceRequiredButton disabled={!args} label='Submit Challenge!' onClick={() => _challenge()} wagerValue={wagerValue} fee={fee} />
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
  setArgs
}) {
  const [message, setMessage] = useState('')
  const [days, setDays] = useState(7)
  const [hours, setHours] = useState(0)
  const [coin, setCoin] = useState(COIN_LORDS)
  const [value, setValue] = useState(0)
  const { fee } = useCalcFee(coin, ethToWei(value))

  useEffectOnce(() => {
    setMessage(randomArrayElement(ChallengeMessages))
  }, [])

  const canSubmit = useMemo(() => (message.length > 3 && (days + hours) > 0), [message, days, hours, value])

  useEffect(() => {
    setArgs(canSubmit ? {
      message,
      expire_seconds: (days * 24 * 60 * 60) + (hours * 60 * 60),
      wager_coin: coin,
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
    <div style={{ width: '430px' }}>
      <Divider />
      <h1>Challenge Conditions</h1>

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
          <span className='FormLabel'>&nbsp;wager $LORDS</span>
          <input placeholder={'$LORDS'} value={value} maxLength={12} onChange={(e) => {
            const _input = e.target.value as string
            const _lords = _input ? parseInt(_input) : 0
            if (!isNaN(_lords)) {
              setValue(_lords)
            }
          }} />
        </Form.Field>

        <WagerAndOrFees coin={coin} value={ethToWei(value)} fee={fee} pre={'Cost: '} />

      </Form>

    </div>
  )
}

