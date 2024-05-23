import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Grid, Table, Modal, Icon } from 'semantic-ui-react'
import { useDojoAccount, useDojoSystemCalls } from '@/lib/dojo/DojoContext'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { useChallenge, useChallengeDescription } from '@/pistols/hooks/useChallenge'
import { useDuelist } from '@/pistols/hooks/useDuelist'
import { useWager } from '@/pistols/hooks/useWager'
import { useTable } from '@/pistols/hooks/useTable'
import { ProfileDescription } from '@/pistols/components/account/ProfileDescription'
import { ProfilePicButton } from '@/pistols/components/account/ProfilePic'
import { ActionButton, BalanceRequiredButton } from '@/pistols/components/ui/Buttons'
import { WagerAndOrFees } from '@/pistols/components/account/LordsBalance'
import { ChallengeState, makeDuelUrl } from '@/pistols/utils/pistols'
import { DuelIconsAsGrid } from '@/pistols/components/DuelIcons'
import { ChallengeTime } from '@/pistols/components/ChallengeTime'
import { AddressShort } from '@/lib/ui/AddressShort'
import { Divider } from '@/lib/ui/Divider'

const Row = Grid.Row
const Col = Grid.Column
const Cell = Table.HeaderCell


export default function ChallengeModal() {
  const router = useRouter()
  const { reply_challenge } = useDojoSystemCalls()
  const { account, isThisAccount } = useDojoAccount()

  const { duelId, dispatchSelectDuel, dispatchSelectDuelist } = usePistolsContext()
  const isOpen = useMemo(() => (duelId > 0), [duelId])

  const _close = () => { dispatchSelectDuel(0n) }

  const { state, tableId, message, duelistA, duelistB, isLive, isFinished, needToSyncExpired } = useChallenge(duelId)
  const { value, fee } = useWager(duelId)
  const { description: tableDescription }= useTable(tableId)

  const { challengeDescription } = useChallengeDescription(duelId)

  const { profilePic: profilePicA } = useDuelist(duelistA)
  const { profilePic: profilePicB } = useDuelist(duelistB)

  const isChallenger = useMemo(() => isThisAccount(duelistA), [duelistA, isThisAccount])
  const isChallenged = useMemo(() => isThisAccount(duelistB), [duelistB, isThisAccount])
  const isYou = (isChallenger || isChallenged)

  const [isSubmitting, setIsSubmitting] = useState(false)

  const _reply = (accepted: boolean) => {
    const _submit = async () => {
      setIsSubmitting(true)
      await reply_challenge(account, duelId, accepted)
      setIsSubmitting(false)
    }
    _submit()
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
            <Col width={4} textAlign='left'>
              Challenge
            </Col>
            <Col width={8} textAlign='center' className='NoBreak Important'>
              {tableDescription}
            </Col>
            <Col width={1} textAlign='right'>
              <Icon className='Anchor IconClick' name='database' size={'small'} onClick={() => window?.open(`/dueldata/${duelId}`, '_blank')} />
            </Col>
            <Col width={3} textAlign='right'>
              <AddressShort address={duelId} />
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
                <Divider content='challenged' nomargin />
              </Col>
            </Row>
            <Row columns='equal' textAlign='right'>
              <Col>
                <ProfileDescription address={duelistB} displayAddress />
              </Col>
            </Row>
            <Row columns='equal' textAlign='right'>
              <Col>
                <Divider content='for a duel' nomargin />
              </Col>
            </Row>
            <Row columns='equal' textAlign='center'>
              <Col>
                <h3 className='Quote'>{`“${message}”`}</h3>
              </Col>
            </Row>

            {(value || (isYou && fee)) && <>
              <Row columns='equal' textAlign='right'>
                <Col>
                  <Divider content={value ? 'Placing a wager of' : 'Fees'} nomargin />
                </Col>
              </Row>
              <Row columns='equal' textAlign='center'>
                <Col>
                  <WagerAndOrFees big tableId={tableId} value={value} fee={isYou ? fee : 0} />
                </Col>
              </Row>
            </>}

            {(isLive || isFinished) && <>
              <Row columns='equal' textAlign='right'>
                <Col>
                  <Divider content='actions' nomargin />
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
                <Divider content='status' nomargin />
              </Col>
            </Row>
            <Row columns='equal' textAlign='center'>
              <Col>
                <h3 className=''>{challengeDescription}</h3>
                <span className='Code'><ChallengeTime duelId={duelId} prefixed /></span>
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
                <ActionButton fill label='Cowardly Withdraw' disabled={isSubmitting} onClick={() => _reply(false)} confirm confirmMessage='This action will cancel this Challenge' />
              </Col>
            }
            {(state == ChallengeState.Awaiting && isChallenged) &&
              <Col>
                <ActionButton fill label='Cowardly Refuse' disabled={isSubmitting} onClick={() => _reply(false)} confirm confirmMessage='This action will cancel this Challenge' />
              </Col>
            }
            {(state == ChallengeState.Awaiting && isChallenged) &&
              <Col>
                <BalanceRequiredButton label='Accept Challenge!' disabled={isSubmitting} onClick={() => _reply(true)} tableId={tableId} wagerValue={value} fee={fee} />
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
                <ActionButton fill important label='Withdraw Expired Fees' disabled={isSubmitting} onClick={() => _reply(false)} />
              </Col>
            }
          </Row>
        </Grid>
      </Modal.Actions>
    </Modal>
  )
}
