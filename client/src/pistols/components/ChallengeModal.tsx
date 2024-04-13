import React, { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Grid, Table, Modal, Divider, Header, Icon } from 'semantic-ui-react'
import { useDojoAccount, useDojoSystemCalls } from '@/lib/dojo/DojoContext'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { useChallenge, useChallengeDescription } from '@/pistols/hooks/useChallenge'
import { useDuelist } from '@/pistols/hooks/useDuelist'
import { useWager } from '@/pistols/hooks/useWager'
import { ProfileDescription } from '@/pistols/components/account/ProfileDescription'
import { ProfilePicButton } from '@/pistols/components/account/ProfilePic'
import { ActionButton, BalanceRequiredButton } from '@/pistols/components/ui/Buttons'
import { WagerAndOrFees } from '@/pistols/components/account/LordsBalance'
import { ChallengeState, makeDuelUrl } from '@/pistols/utils/pistols'
import { DuelIconsAsGrid } from '@/pistols/components/DuelIcons'
import { AddressShort } from '@/lib/ui/AddressShort'
import { ChallengeTime } from './ChallengeTime'

const Row = Grid.Row
const Col = Grid.Column
const Cell = Table.HeaderCell

function DividerText({
  text = '',
}) {
  return (
    <Divider horizontal className='NoMargin'>
      <Header as='h4'>{text}</Header>
    </Divider>
  )
}

export default function ChallengeModal() {
  const router = useRouter()
  const { reply_challenge } = useDojoSystemCalls()
  const { account } = useDojoAccount()

  const { duelId, dispatchSelectDuel, dispatchSelectDuelist } = usePistolsContext()

  const { state, message, duelistA, duelistB, isLive, isFinished, needToSyncExpired } = useChallenge(duelId)
  const { coin, value, fee } = useWager(duelId)

  const { challengeDescription } = useChallengeDescription(duelId)

  const { profilePic: profilePicA } = useDuelist(duelistA)
  const { profilePic: profilePicB } = useDuelist(duelistB)

  const isOpen = useMemo(() => (duelId > 0), [duelId])

  const isChallenger = useMemo(() => (duelistA == BigInt(account.address)), [duelistA, account])
  const isChallenged = useMemo(() => (duelistB == BigInt(account.address)), [duelistB, account])
  const isYou = (isChallenger || isChallenged)

  const _close = () => { dispatchSelectDuel(0n) }
  const _reply = (accepted: boolean) => {
    reply_challenge(account, duelId, accepted)
  }
  const _watch = () => {
    router.push(makeDuelUrl(duelId))
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
            <Col width={8} textAlign='left'>
              Challenge
              &nbsp;&nbsp;&nbsp;
              <AddressShort address={duelId} />
            </Col>
            <Col width={7} textAlign='right'>
              <span className='Code'><ChallengeTime duelId={duelId} prefixed /></span>
            </Col>
            <Col width={1} textAlign='right'>
              <Icon className='Anchor IconClick' name='database' size={'small'} onClick={() => window?.open(`/dueldata/${duelId}`, '_blank')} />
            </Col>
          </Row>
        </Grid>
      </Modal.Header>
      <Modal.Content image>
        <ProfilePicButton profilePic={profilePicA} onClick={() => dispatchSelectDuelist(duelistA)} />
        <Modal.Description className='Padded' style={{ width: '550px' }}>
          <Grid style={{ width: '350px' }}>
            <Row columns='equal' textAlign='left'>
              <Col>
                <ProfileDescription address={duelistA} displayAddress />
              </Col>
            </Row>
            <Row columns='equal' textAlign='right'>
              <Col>
                <DividerText text='challenged' />
              </Col>
            </Row>
            <Row columns='equal' textAlign='right'>
              <Col>
                <ProfileDescription address={duelistB} displayAddress />
              </Col>
            </Row>
            <Row columns='equal' textAlign='right'>
              <Col>
                <DividerText text='for a duel' />
              </Col>
            </Row>
            <Row columns='equal' textAlign='center'>
              <Col>
                <h3 className='Quote'>{`“${message}”`}</h3>
              </Col>
            </Row>

            {(value > 0 || isYou) && <>
              <Row columns='equal' textAlign='right'>
                <Col>
                  <DividerText text={value > 0 ? 'Placing a wager of' : 'Fees'} />
                </Col>
              </Row>
              <Row columns='equal' textAlign='center'>
                <Col>
                  <WagerAndOrFees big coin={coin} value={value} fee={isYou ? fee : 0} />
                </Col>
              </Row>
            </>}

            {(isLive || isFinished) && <>
              <Row columns='equal' textAlign='right'>
                <Col>
                  <DividerText text='actions' />
                </Col>
              </Row>
              <Row textAlign='center'>
                <Col width={16} textAlign='right'>
                  <DuelIconsAsGrid duelId={duelId} duelistA={duelistA} duelistB={duelistB} size='big' />
                </Col>
              </Row>
            </>}

            <Row columns='equal' textAlign='right'>
              <Col>
                <DividerText text='status' />
              </Col>
            </Row>
            <Row columns='equal' textAlign='center'>
              <Col>
                <h3 className=''>{challengeDescription}</h3>
                {/* <Divider className='NoMargin' /> */}
              </Col>
            </Row>

          </Grid>
        </Modal.Description>
        <ProfilePicButton profilePic={profilePicB} onClick={() => dispatchSelectDuelist(duelistB)} />
      </Modal.Content>
      <Modal.Actions className='NoPadding'>
        <Grid className='FillParent Padded' textAlign='center'>
          <Row columns='equal'>
            <Col>
              <ActionButton fill label='Close' onClick={() => _close()} />
            </Col>
            {(state == ChallengeState.Awaiting && isChallenger) &&
              <Col>
                <ActionButton fill label='Cowardly withdraw' onClick={() => _reply(false)} confirm confirmMessage='This action will cancel this Challenge' />
              </Col>
            }
            {(state == ChallengeState.Awaiting && isChallenged) &&
              <Col>
                <ActionButton fill label='Cowardly refuse' onClick={() => _reply(false)} confirm confirmMessage='This action will cancel this Challenge' />
              </Col>
            }
            {(state == ChallengeState.Awaiting && isChallenged) &&
              <Col>
                <BalanceRequiredButton label='Accept Challenge!' onClick={() => _reply(true)} coin={coin} wagerValue={value} fee={fee} />
              </Col>
            }
            {(state == ChallengeState.InProgress) &&
              <Col>
                <ActionButton fill important label='Go to Live Duel!' onClick={() => _watch()} />
              </Col>
            }
            {(state > ChallengeState.InProgress) &&
              <Col>
                <ActionButton fill important label='Replay Duel!' onClick={() => _watch()} />
              </Col>
            }
            {(needToSyncExpired && (isChallenger || isChallenged)) &&
              <Col>
                <ActionButton fill important label='Withdraw Expired Fees' onClick={() => _reply(false)} />
              </Col>
            }
          </Row>
        </Grid>
      </Modal.Actions>
    </Modal>
  )
}
