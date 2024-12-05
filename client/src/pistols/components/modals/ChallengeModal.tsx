import React, { useMemo, useState } from 'react'
import { Grid, Modal } from 'semantic-ui-react'
import { useAccount } from '@starknet-react/core'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { usePistolsContext, usePistolsScene, SceneName } from '@/pistols/hooks/PistolsContext'
import { useDojoSystemCalls } from '@/lib/dojo/DojoContext'
import { useChallengeDescription } from '@/pistols/hooks/useChallengeDescription'
import { useChallenge } from '@/pistols/stores/challengeStore'
import { useDuelist } from '@/pistols/stores/duelistStore'
import { useTable } from '@/pistols/stores/tableStore'
import { useIsMyAccount, useIsYou } from '@/pistols/hooks/useIsYou'
import { ProfileDescription } from '@/pistols/components/account/ProfileDescription'
import { ProfilePic } from '@/pistols/components/account/ProfilePic'
import { ActionButton, BalanceRequiredButton } from '@/pistols/components/ui/Buttons'
import { DuelIconsAsGrid } from '@/pistols/components/DuelIcons'
import { ChallengeTime } from '@/pistols/components/ChallengeTime'
import { IconClick } from '@/lib/ui/Icons'
import { Divider } from '@/lib/ui/Divider'
import { ChallengeState } from '@/games/pistols/generated/constants'
import { makeDuelDataUrl, PremisePrefix } from '@/pistols/utils/pistols'

const Row = Grid.Row
const Col = Grid.Column

export default function ChallengeModal() {
  const { reply_duel } = useDojoSystemCalls()
  const { duelistId } = useSettings()
  const { account } = useAccount()

  const { selectedDuelId, dispatchSelectDuel, dispatchSelectDuelistId } = usePistolsContext()
  const isOpen = useMemo(() => (selectedDuelId > 0), [selectedDuelId])

  const _close = () => { dispatchSelectDuel(0n) }

  const {
    state, tableId, premise, quote,
    duelistIdA, duelistIdB, duelistAddressA, duelistAddressB,
    isLive, isFinished, needToSyncExpired,
  } = useChallenge(selectedDuelId)
  const { description: tableDescription } = useTable(tableId)

  const { challengeDescription } = useChallengeDescription(selectedDuelId)

  const { profilePic: profilePicA } = useDuelist(duelistIdA)
  const { profilePic: profilePicB } = useDuelist(duelistIdB)

  const { isYou: isChallenger } = useIsYou(duelistIdA)
  const { isYou: isChallengedDuelist } = useIsYou(duelistIdB)
  const { isMyAccount: isChallengedAccount } = useIsMyAccount(duelistAddressB)
  const isChallenged = (isChallengedDuelist || isChallengedAccount)
  const isYou = (isChallenger || isChallenged)

  const [isSubmitting, setIsSubmitting] = useState(false)

  const _reply = (accepted: boolean) => {
    const _submit = async () => {
      setIsSubmitting(true)
      await reply_duel(account, duelistId, selectedDuelId, accepted)
      if (accepted) _gotoDuel()
      setIsSubmitting(false)
    }
    _submit()
  }

  const { dispatchSetScene } = usePistolsScene()
  const _gotoDuel = () => {
    dispatchSetScene(SceneName.Duel)
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
              Challenge #{selectedDuelId.toString()}
            </Col>
            <Col width={8} textAlign='center' className='NoBreak Important'>
              {tableDescription}
            </Col>
            <Col width={4} textAlign='right'>
              <IconClick name='database' size={'small'} onClick={() => window?.open(makeDuelDataUrl(selectedDuelId), '_blank')} />
            </Col>
          </Row>
        </Grid>
      </Modal.Header>
      <Modal.Content image className='Relative'>
        <ProfilePic profilePic={profilePicA} duelistId={duelistIdA} floated='left' onClick={() => dispatchSelectDuelistId(duelistIdA)} />

        <Modal.Description className='Padded' style={{ width: '550px' }}>
          <Grid style={{ width: '350px' }}>
            <Row columns='equal' textAlign='left'>
              <Col>
                <ProfileDescription duelistId={duelistIdA} displayOwnerAddress={false} />
              </Col>
            </Row>
            <Row columns='equal' textAlign='right'>
              <Col>
                <Divider content='challenged' nomargin />
              </Col>
            </Row>
            <Row columns='equal' textAlign='right'>
              <Col>
                <ProfileDescription duelistId={duelistIdB} displayOwnerAddress={false} />
              </Col>
            </Row>
            <Row columns='equal' textAlign='right'>
              <Col>
                <Divider content={PremisePrefix[premise]} nomargin />
              </Col>
            </Row>
            <Row columns='equal' textAlign='center'>
              <Col>
                <h3 className='Quote'>{`“${quote}”`}</h3>
              </Col>
            </Row>

            {(isLive || isFinished) && <>
              <Row columns='equal' textAlign='right'>
                <Col>
                  <Divider content='actions' nomargin />
                </Col>
              </Row>
              <Row textAlign='center'>
                <Col width={16} textAlign='right'>
                  <DuelIconsAsGrid duelId={selectedDuelId} duelistIdA={duelistIdA} duelistIdB={duelistIdB} size='big' />
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
                <h5 className=''>{challengeDescription}</h5>
                <span className='Code'><ChallengeTime duelId={selectedDuelId} prefixed /></span>
                {/* <Divider className='NoMargin' /> */}
              </Col>
            </Row>

          </Grid>
        </Modal.Description>

        <ProfilePic profilePic={profilePicB} duelistId={duelistIdB} floated='right' onClick={() => dispatchSelectDuelistId(duelistIdB)} />
      </Modal.Content>
      <Modal.Actions className='NoPadding'>
        <Grid className='FillParent Padded' textAlign='center'>
          <Row columns='equal'>
            <Col>
              <ActionButton large fill label='Close' onClick={() => _close()} />
            </Col>
            {(state == ChallengeState.Awaiting && isChallenger) &&
              <>
                <Col>
                  <ActionButton large fill negative label='Cowardly Withdraw' disabled={isSubmitting} onClick={() => _reply(false)} confirm confirmMessage='This action will cancel this Challenge' />
                </Col>
                <Col>
                  <ActionButton large fill important label='Go to Live Duel!' onClick={() => _gotoDuel()} />
                </Col>
              </>
            }
            {(state == ChallengeState.Awaiting && isChallenged) &&
              <Col>
                <ActionButton large fill negative label='Cowardly Refuse' disabled={isSubmitting} onClick={() => _reply(false)} confirm confirmMessage='This action will cancel this Challenge' />
              </Col>
            }
            {(state == ChallengeState.Awaiting && isChallenged) &&
              <Col>
                <BalanceRequiredButton label='Accept Challenge!' disabled={isSubmitting} onClick={() => _reply(true)} fee={0} />
              </Col>
            }
            {(state == ChallengeState.InProgress) &&
              <Col>
                <ActionButton large fill important label='Go to Live Duel!' onClick={() => _gotoDuel()} />
              </Col>
            }
            {isFinished &&
              <Col>
                <ActionButton large fill important label='Replay Duel!' onClick={() => _gotoDuel()} />
              </Col>
            }
            {(needToSyncExpired && (isChallenger || isChallenged)) &&
              <Col>
                <ActionButton large fill important label='Withdraw Expired Fees' disabled={isSubmitting} onClick={() => _reply(false)} />
              </Col>
            }
          </Row>
        </Grid>
      </Modal.Actions>
    </Modal>
  )
}
