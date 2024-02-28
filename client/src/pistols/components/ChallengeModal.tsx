import React, { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Grid, Table, Modal, Divider, Header, Icon } from 'semantic-ui-react'
import { useDojoAccount, useDojoSystemCalls } from '@/dojo/DojoContext'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { useChallenge, useChallengeDescription } from '@/pistols/hooks/useChallenge'
import { useDuelist } from '@/pistols/hooks/useDuelist'
import { ProfileDescription } from '@/pistols/components/account/ProfileDescription'
import { ProfilePicButton } from '@/pistols/components/account/ProfilePic'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { ChallengeState, makeDuelUrl } from '@/pistols/utils/pistols'
import { AccountShort } from '@/pistols/components/ui/Account'
import { DuelIcons } from '@/pistols/components/DuelIcons'
import { ChallengeTime } from './ChallengeTime'
import Link from 'next/link'

const Row = Grid.Row
const Col = Grid.Column
const Cell = Table.HeaderCell

export default function ChallengeModal() {
  const router = useRouter()
  const { reply_challenge } = useDojoSystemCalls()
  const { account } = useDojoAccount()

  const { duelId, dispatchSelectDuel, dispatchSelectDuelist } = usePistolsContext()

  const { state, message, duelistA, duelistB, lords, isLive, isFinished, isAwaiting } = useChallenge(duelId)

  const { challengeDescription } = useChallengeDescription(duelId)

  const { profilePic: profilePicA } = useDuelist(duelistA)
  const { profilePic: profilePicB } = useDuelist(duelistB)

  const isOpen = useMemo(() => (duelId > 0), [duelId])

  const isChallenger = useMemo(() => (duelistA == BigInt(account.address)), [duelistA, account])
  const isChallenged = useMemo(() => (duelistB == BigInt(account.address)), [duelistB, account])

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
        <Grid className='PaddedLeft PaddedRight'>
          <Row>
            <Col width={8} textAlign='left'>
              Challenge
              &nbsp;&nbsp;&nbsp;
              <AccountShort address={duelId} suffix='' />
            </Col>
            <Col width={7} textAlign='right'>
              <span className='Code'><ChallengeTime duelId={duelId} prefixed /></span>
            </Col>
            <Col width={1} textAlign='right'>
              <Icon className='Anchor IconClick' name='database' size={'small'} onClick={() => window.open(`/dueldata/${duelId}`, '_blank')} />
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
                <ProfileDescription address={duelistA} />
              </Col>
            </Row>
            <Row columns='equal' textAlign='right'>
              <Col>
                <Divider horizontal className='NoMargin'>
                  <Header as='h4'>challenged</Header>
                </Divider>
              </Col>
            </Row>
            <Row columns='equal' textAlign='right'>
              <Col>
                <ProfileDescription address={duelistB} />
              </Col>
            </Row>
            <Row columns='equal' textAlign='right'>
              <Col>
                <Divider horizontal className='NoMargin'>
                  <Header as='h4'>for a duel</Header>
                </Divider>
              </Col>
            </Row>
            <Row columns='equal' textAlign='center'>
              <Col>
                <h3 className='Quote'>{`“${message}”`}</h3>
              </Col>
            </Row>

            <Row columns='equal' textAlign='right'>
              <Col>
                {lords > 0 &&
                  <>
                    <Divider horizontal className='NoMargin'>
                      <Header as='h3'>for <span className='Bold'>{lords} $LORDS</span> each</Header>
                    </Divider>
                  </>
                }
              </Col>
            </Row>

            <Row columns='equal' textAlign='center'>
              <Col>
                <Divider className='NoMargin' />
                <h3 className='TitleCase'>{challengeDescription}</h3>
                {/* <Divider className='NoMargin' /> */}
              </Col>
            </Row>

            {(isLive || isFinished) &&
              <>
                <Row columns='equal' textAlign='right'>
                  <Col>
                    <Divider horizontal className='NoMargin'>
                      <Header as='h4'>actions</Header>
                    </Divider>
                  </Col>
                </Row>
                <Row textAlign='center'>
                  <Col width={7} textAlign='right'>
                    <DuelIcons duelId={duelId} account={duelistA} size='big' />
                  </Col>
                  <Col width={2} verticalAlign='middle'>
                    vs
                  </Col>
                  <Col width={7} textAlign='left'>
                    <DuelIcons duelId={duelId} account={duelistB} size='big' />
                  </Col>
                </Row>
              </>
            }

          </Grid>
        </Modal.Description>
        <ProfilePicButton profilePic={profilePicB} onClick={() => dispatchSelectDuelist(duelistB)} />
      </Modal.Content>
      <Modal.Actions>
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
                <ActionButton fill attention label='Accept Challenge!' onClick={() => _reply(true)} />
              </Col>
            }
            {(state == ChallengeState.InProgress) &&
              <Col>
                <ActionButton fill attention label='Go to Live Duel!' onClick={() => _watch()} />
              </Col>
            }
            {(state > ChallengeState.InProgress) &&
              <Col>
                <ActionButton fill attention label='Replay Duel!' onClick={() => _watch()} />
              </Col>
            }
          </Row>
        </Grid>
      </Modal.Actions>
    </Modal>
  )
}
