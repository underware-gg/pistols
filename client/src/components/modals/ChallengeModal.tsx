import React, { useMemo, useState } from 'react'
import { Grid, Modal } from 'semantic-ui-react'
import { useAccount } from '@starknet-react/core'
import { useSettings } from '/src/hooks/SettingsContext'
import { usePistolsContext, usePistolsScene } from '/src/hooks/PistolsContext'
import { useDojoSystemCalls } from '@underware_gg/pistols-sdk/dojo'
import { useChallengeDescription } from '/src/hooks/useChallengeDescription'
import { useChallenge } from '/src/stores/challengeStore'
import { useDuelist } from '/src/stores/duelistStore'
import { useTable } from '/src/stores/tableStore'
import { useIsMyAccount, useIsYou } from '/src/hooks/useIsYou'
import { usePlayerBookmarkSignedMessage } from '/src/hooks/useSignedMessages'
import { useDuelTokenContract } from '/src/hooks/useTokenContract'
import { useIsBookmarked } from '/src/stores/playerStore'
import { ProfileDescription } from '/src/components/account/ProfileDescription'
import { ProfilePic } from '/src/components/account/ProfilePic'
import { ActionButton, BalanceRequiredButton } from '/src/components/ui/Buttons'
import { DuelIconsAsGrid } from '/src/components/DuelIcons'
import { ChallengeTime } from '/src/components/ChallengeTime'
import { BookmarkIcon, IconClick } from '/src/components/ui/Icons'
import { Divider } from '/src/components/ui/Divider'
import { makeDuelDataUrl, PremisePrefix } from '/src/utils/pistols'
import { SceneName } from '/src/data/assets'
import { constants } from '@underware_gg/pistols-sdk/pistols'

const Row = Grid.Row
const Col = Grid.Column

export default function ChallengeModal() {
  const { reply_duel } = useDojoSystemCalls()
  const { duelistId } = useSettings()
  const { account } = useAccount()

  const { atDuel, dispatchSetScene } = usePistolsScene()
  const { selectedDuelId, dispatchSelectDuel, dispatchSelectDuelistId } = usePistolsContext()
  const isOpen = useMemo(() => (selectedDuelId > 0 && !atDuel), [selectedDuelId, atDuel])

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

  const _gotoDuel = () => {
    dispatchSetScene(SceneName.Duel)
  }

  // bookmark
  const { duelContractAddress } = useDuelTokenContract()
  const { isBookmarked } = useIsBookmarked(duelContractAddress, selectedDuelId)
  const { publish } = usePlayerBookmarkSignedMessage(duelContractAddress, selectedDuelId, !isBookmarked)

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
            <Col width={1} textAlign='center'>
              <BookmarkIcon isBookmarked={isBookmarked} onClick={publish} />
            </Col>
            <Col width={3} textAlign='left'>
              Duel #{selectedDuelId.toString()}
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
            {(state == constants.ChallengeState.Awaiting && isChallenger) &&
              <>
                <Col>
                  <ActionButton large fill negative label='Cowardly Withdraw' disabled={isSubmitting} onClick={() => _reply(false)} confirm confirmMessage='This action will cancel this Challenge' />
                </Col>
                <Col>
                  <ActionButton large fill important label='Go to Live Duel!' onClick={() => _gotoDuel()} />
                </Col>
              </>
            }
            {(state == constants.ChallengeState.Awaiting && isChallenged) &&
              <Col>
                <ActionButton large fill negative label='Cowardly Refuse' disabled={isSubmitting} onClick={() => _reply(false)} confirm confirmMessage='This action will cancel this Challenge' />
              </Col>
            }
            {(state == constants.ChallengeState.Awaiting && isChallenged) &&
              <Col>
                <BalanceRequiredButton label='Accept Challenge!' disabled={isSubmitting} onClick={() => _reply(true)} fee={0} />
              </Col>
            }
            {(state == constants.ChallengeState.InProgress) &&
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
