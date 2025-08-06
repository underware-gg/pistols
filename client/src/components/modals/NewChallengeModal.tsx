import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Grid, Modal, Form, Dropdown } from 'semantic-ui-react'
import { BigNumberish } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { useDojoSystemCalls } from '@underware/pistols-sdk/dojo'
import { usePistolsContext } from '/src/hooks/PistolsContext'
import { usePactSubscription } from '/src/queries/usePact'
import { useCalcSeasonReward, useCanJoin } from '/src/hooks/usePistolsContractCalls'
import { useTokenContracts } from '/src/hooks/useTokenContracts'
import { ActionButton } from '/src/components/ui/Buttons'
import { bigintEquals, formatOrdinalNumber, isPositiveBigint } from '@underware/pistols-sdk/utils'
import { POSTER_HEIGHT_SMALL, POSTER_WIDTH_SMALL, ProfilePoster } from '/src/components/ui/ProfilePoster'
import { DuelistCard } from '/src/components/cards/DuelistCard';
import { FormInput } from '/src/components/ui/Form'
import { Balance } from '/src/components/account/Balance'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { useDuelistFameBalance } from '/src/stores/coinStore'
import { DUELIST_CARD_HEIGHT } from '/src/data/cardConstants'
import { DUELIST_CARD_WIDTH } from '/src/data/cardConstants'
import { useGameAspect } from '/src/hooks/useGameAspect'
import { useCurrentSeason } from '/src/stores/seasonStore'
import { useConfig } from '/src/stores/configStore'
import { COLORS } from '@underware/pistols-sdk/pistols/constants'
import { useTransactionHandler } from '../../hooks/useTransaction'
import { showElementPopupNotification } from '/src/components/ui/ElementPopupNotification'

const Row = Grid.Row
const Col = Grid.Column

export default function NewChallengeModal() {
  const { challengingAddress, challengingDuelistId } = usePistolsContext()
  const isOpen = useMemo(() => (challengingAddress > 0n && challengingDuelistId > 0n), [challengingDuelistId, challengingDuelistId])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen) {
        e.stopPropagation();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [isOpen]);

  return (<>{isOpen && <_NewChallengeModal isOpen={isOpen} />}</>)
}

function _NewChallengeModal({
  isOpen,
}: {
  isOpen: boolean
}) {
  const { duel_token } = useDojoSystemCalls()
  const { account, address } = useAccount()
  const { aspectWidth, aspectHeight, boxH, boxW } = useGameAspect()

  const buttonRef = useRef<HTMLDivElement>(null)

  const {
    duelistSelectOpener,
    challengingAddress,
    challengingDuelistId,
    dispatchChallengingPlayerAddress,
    dispatchChallengingDuelistId,
    dispatchSelectPlayerAddress,
    dispatchSelectDuel
  } = usePistolsContext()

  const { botPlayerContractAddress } = useTokenContracts()
  const isSinglePlayer = useMemo(() => bigintEquals(challengingAddress, botPlayerContractAddress), [challengingAddress, botPlayerContractAddress])
  const duelType = useMemo(() => isSinglePlayer ? constants.DuelType.BotPlayer : constants.DuelType.Seasonal, [isSinglePlayer])

  const addressA = address
  const addressB = challengingAddress

  const _close = () => {
    dispatchChallengingPlayerAddress(0n)
    dispatchChallengingDuelistId(0n)
    duelistSelectOpener.close()
  }

  const { hasPact, pactDuelId } = usePactSubscription(duelType, addressA, addressB, isOpen)
  const { seasonName } = useCurrentSeason()
  const { currentSeasonId } = useConfig()

  const [args, setArgs] = useState<any>(null)

  const { canJoin } = useCanJoin(currentSeasonId, challengingDuelistId)
  const { rewards } = useCalcSeasonReward(currentSeasonId, challengingDuelistId, args?.lives_staked)

  const { call: createDuel, isLoading, isWaitingForIndexer, meta } = useTransactionHandler<boolean, [constants.DuelType, BigNumberish, BigNumberish, number, number, constants.Premise, string]>({
    key: `create_duel${challengingAddress}`,
    transactionCall: (duelType, duelistId, challengedAddr, livesStaked, expireHours, premise, message, key) =>
      duel_token.create_duel(account, duelType, duelistId, challengedAddr, livesStaked, expireHours, premise, message, key),
    indexerCheck: hasPact,
  })

  useEffect(() => {
    if (isWaitingForIndexer) {
      showElementPopupNotification(buttonRef, "Transaction successfull! Waiting for indexer...")
    }
  }, [isWaitingForIndexer])

  useEffect(() => {
    if (hasPact) {
      dispatchSelectDuel(pactDuelId)
    }
  }, [hasPact])

  const _create_duel = () => {
    if (args?.canSubmit) {
      createDuel(
        duelType,
        challengingDuelistId,
        challengingAddress,
        args.lives_staked,
        args.expire_hours,
        args.premise,
        args.message
      )
    }
  }

  return (
    <>
      <Modal open={isOpen} onClose={() => _close()}
        className='NoMargin NoPadding'
        style={{
          width: aspectWidth(60),
          height: aspectHeight(76),
          position: 'absolute',
          top: aspectHeight((100 - 76) / 2) + boxH,
          left: aspectWidth(20) + boxW,
          display: 'flex',
        }}
      >
        <Modal.Header>
          <Grid>
            <Row>
              <Col width={4} textAlign='left' className='NoBreak'>
                New Challenge
              </Col>
              <Col width={8} textAlign='center' className='NoBreak Important'>
                {seasonName}
              </Col>
            </Row>
          </Grid>
        </Modal.Header>

        <Modal.Content>
          <Grid>
            <Row>
              <Col width={4} style={{}}>
                <div style={{ width: '100%', height: aspectHeight(POSTER_HEIGHT_SMALL), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ProfilePoster
                    playerAddress={addressA}
                    _close={() => { }}
                    isSmall={true}
                    isVisible={true}
                    instantVisible={true}
                    isHighlightable={false}
                    onClick={() => dispatchSelectPlayerAddress(addressA)}
                  />
                </div>
                <div style={{ position: 'absolute', left: 0, top: aspectHeight(POSTER_HEIGHT_SMALL * 0.9) }}>
                  <DuelistCard
                    width={DUELIST_CARD_WIDTH}
                    height={DUELIST_CARD_HEIGHT}
                    isSmall isLeft
                    isVisible instantVisible
                    isFlipped instantFlip
                    isHanging shouldSwing isHangingLeft
                    isHighlightable
                    duelistId={Number(challengingDuelistId)}
                    onClick={() => !isLoading && duelistSelectOpener.open()}
                  />
                </div>
              </Col>

              <Col width={8} style={{ minHeight: '400px' }}>
                <div className='TextDivider bright NewChallengeDivider'>
                  Terms of Combat
                </div>
                <div className='Spacer5' />

                <NewChallengeForm
                  duelistId={challengingDuelistId}
                  setArgs={setArgs}
                  isLoading={isLoading}
                  meta={meta}
                  isSinglePlayer={isSinglePlayer}
                />

                <div className='Spacer20' />
                <div className='TextDivider bright NewChallengeDivider'>
                  Potential Outcomes
                </div>

                <div style={{
                  border: '1px solid #C0C0C0',
                  borderRadius: aspectWidth(0.8),
                  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.6)',
                  padding: aspectWidth(0.5),
                  marginTop: aspectWidth(1),
                  position: 'relative'
                }}>
                  <Grid>
                    <Row>
                      <Col width={8} textAlign='center'>
                        <div className='H3 Important' style={{
                          fontSize: aspectWidth(1.8),
                          color: '#FFD700',
                          textShadow: '0 0 10px #FFD70080'
                        }}>Victory</div>
                        <div style={{
                          width: '80%',
                          margin: '0 auto',
                          fontSize: aspectWidth(1.2)
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: aspectHeight(0.5) }}>
                            <div style={{ textAlign: 'left' }}>+</div>
                            <div style={{ textAlign: 'right' }}><Balance fame wei={rewards?.win?.fame_gained} size='large' /></div>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: aspectHeight(0.5) }}>
                            <div style={{ textAlign: 'left' }}>+</div>
                            <div style={{ textAlign: 'right' }}><Balance fools wei={rewards?.win?.fools_gained} size='large' /></div>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: aspectHeight(0.5) }}>
                            <div style={{ textAlign: 'left' }}>+</div>
                            <div style={{ textAlign: 'right', fontSize: aspectWidth(1) }}>{rewards?.win?.points_scored} Points</div>
                          </div>
                          <div style={{
                            width: '110%',
                            marginLeft: '-5%',
                            height: '1px',
                            background: 'rgba(255,255,255,0.2)',
                            margin: `${aspectHeight(1)} 0`
                          }} />
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div style={{ textAlign: 'center', width: '100%' }}>
                              <span style={{ color: rewards?.win?.position > 0 ? '#00ff00' : rewards?.win?.position < 0 ? '#ff4444' : '#ffa500' }}>
                                {rewards?.win?.position > 0 ? '↑' : rewards?.win?.position < 0 ? '↓' : '−'}
                                {formatOrdinalNumber(rewards?.win?.position)} Place
                              </span>
                            </div>
                          </div>
                        </div>
                      </Col>

                      <Col width={8} textAlign='center'>
                        <div className='H3 Negative' style={{
                          fontSize: aspectWidth(1.8),
                          color: '#FF4444',
                          textShadow: '0 0 10px #FF444480'
                        }}>Defeat</div>
                        <div style={{
                          width: '80%',
                          margin: '0 auto',
                          fontSize: aspectWidth(1.2)
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: aspectHeight(0.5) }}>
                            <div style={{ textAlign: 'left' }}>-</div>
                            <div style={{ textAlign: 'right' }}><Balance fame wei={rewards?.lose?.fame_lost} size='large' /></div>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: aspectHeight(0.5) }}>
                            <div style={{ textAlign: 'left' }}>&nbsp;</div>
                            <div style={{ textAlign: 'right' }}>-</div>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: aspectHeight(0.5) }}>
                            <div style={{ textAlign: 'left' }}>&nbsp;</div>
                            <div style={{ textAlign: 'right' }}>-</div>
                          </div>
                          <div style={{
                            width: '110%',
                            marginLeft: '-5%',
                            height: '1px',
                            background: 'rgba(255,255,255,0.2)',
                            margin: `${aspectHeight(1)} 0`
                          }} />
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div style={{ textAlign: 'center', width: '100%' }}>
                              <span style={{ color: rewards?.lose?.survived ? '#ffa500' : '#ff4444' }}>
                                {rewards?.lose?.survived ? 'Survives!' : 'Death Awaits'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </Grid>

                  <div style={{
                    position: 'absolute',
                    left: '50%',
                    top: '0',
                    bottom: '0',
                    width: '2px',
                    background: 'linear-gradient(transparent, #C0C0C0, transparent)',
                    transform: 'translateX(-50%)'
                  }} />
                </div>
              </Col>

              <Col width={4}>
                <div style={{ width: '100%', height: aspectHeight(POSTER_HEIGHT_SMALL), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ProfilePoster
                    playerAddress={challengingAddress}
                    _close={() => { }}
                    isSmall={true}
                    isVisible={true}
                    instantVisible={true}
                    isHighlightable={false}
                    onClick={() => dispatchSelectPlayerAddress(challengingAddress)}
                  />
                </div>
                <div style={{ position: 'absolute', left: aspectWidth(POSTER_WIDTH_SMALL * 0.5), top: aspectHeight(POSTER_HEIGHT_SMALL * 0.9) }} >
                  <DuelistCard
                    width={DUELIST_CARD_WIDTH}
                    height={DUELIST_CARD_HEIGHT}
                    isSmall isLeft={false}
                    isVisible instantVisible
                    isFlipped={false}
                    isHanging shouldSwing isHangingLeft
                    showBack
                    duelistId={0}
                  />
                </div>
              </Col>
            </Row>
          </Grid>
        </Modal.Content>

        <Modal.Actions className='NoPadding'>
          <Grid className='FillParent Padded' textAlign='center'>
            <Row columns='equal'>
              <Col>
                <ActionButton large fill label='Nevermind!' onClick={() => _close()} />
              </Col>
              <Col ref={buttonRef}>
                {canJoin &&
                  <ActionButton
                    large
                    fill
                    loading={isLoading}
                    disabled={!args?.canSubmit}
                    important={args?.canSubmit}
                    label='Submit Challenge!'
                    onClick={() => _create_duel()}
                  />
                }
                {!canJoin && <ActionButton large fill disabled negative label='Not Admitted!' onClick={() => { }} />}
              </Col>
            </Row>
          </Grid>
        </Modal.Actions>
      </Modal>
    </>
  )
}

function NewChallengeForm({
  duelistId,
  setArgs,
  isLoading,
  meta,
  isSinglePlayer,
}: {
  duelistId: BigNumberish
  setArgs: (args: any) => void
  isLoading: boolean
  meta: any
  isSinglePlayer: boolean
}) {
  const { lives } = useDuelistFameBalance(duelistId)
  const { dispatchChallengingDuelistId } = usePistolsContext()

  const { aspectWidth, aspectHeight } = useGameAspect()

  const [premise, setPremise] = useState(isSinglePlayer ? constants.Premise.Nothing : constants.Premise.Honour)
  const [message, setMessage] = useState('')
  const [days, setDays] = useState(7)
  const [hours, setHours] = useState(0)
  const [highStakes, setHighStakes] = useState(false)

  const hasEnoughLives = useMemo(() => (lives >= 3n), [lives])

  const metaData = useMemo(() => {
    if (!meta || !Array.isArray(meta) || meta.every(item => item === undefined)) return null
    return {
      duelType: meta[0] as constants.DuelType,
      duelistId: meta[1] as BigNumberish,
      challengedAddr: meta[2] as BigNumberish,
      livesStaked: meta[3] as number,
      expireHours: meta[4] as number,
      premise: meta[5] as constants.Premise,
      message: meta[6] as string,
    }
  }, [meta])

  useEffect(() => {
    if (metaData && isLoading) {
      setPremise(metaData.premise)
      setMessage(metaData.message)
      setHighStakes(metaData.livesStaked === 3)
      if (isPositiveBigint(metaData.duelistId)) {
        dispatchChallengingDuelistId(metaData.duelistId)
      }
    }
  }, [metaData, isLoading])

  useEffect(() => {
    setArgs({
      premise,
      message,
      expire_hours: ((7 * 24) + 0), //DEFAULT TO 7 DAYS FOR NOW
      lives_staked: highStakes ? 3 : 1,
      canSubmit: true,
    })
  }, [premise, message, days, hours, highStakes])

  const premiseOptions = useMemo(() => Object.keys(constants.Premise).slice(1).map((premise) => ({
    key: `${premise}`,
    value: `${premise}`,
    text: `${premise}`,
  })), [])

  const handleHighStakesToggle = () => {
    if (isLoading) return
    if (hasEnoughLives) {
      setHighStakes(!highStakes)
    }
  }

  return (
    <Form style={{ width: '80%', marginLeft: '10%' }}>
      <Form.Field>
        <div className='NewChallengeDivider Small VerticalSpacing Centered'>PREMISE</div>
        <Dropdown
          options={premiseOptions}
          placeholder={null}
          selection
          fluid
          disabled={isLoading || isSinglePlayer}
          value={constants.PREMISES[premise].name}
          onChange={(e, { value }) => !isLoading && setPremise(value as constants.Premise)}
        />
      </Form.Field>

      <Form.Field style={{ marginTop: aspectHeight(2) }}>
        <div className={`NewChallengeDivider Small VerticalSpacing Centered ${message.length > 3 ? '' : 'Warning'}`}>{constants.PREMISES[premise].prefix.toUpperCase()}</div>
        <FormInput
          placeholder={'OPTIONAL: DESCRIBE YOUR REASONING'}
          value={message}
          fluid
          setValue={(value) => !isLoading && setMessage(value)}
          code={true}
          disabled={isLoading || isSinglePlayer}
          maxLength={128}
        />
      </Form.Field>

      {!isSinglePlayer && (<>
        <div className={`NewChallengeDivider Small VerticalSpacing Centered`} style={{ marginTop: aspectHeight(2) }}>STAKES</div>
        <div
          className={`${!hasEnoughLives ? 'Canceled' : highStakes ? 'Important' : ''}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: aspectHeight(1),
            marginBottom: aspectHeight(1),
            position: 'relative',
            cursor: hasEnoughLives && !isLoading ? 'pointer' : 'not-allowed',
          }}
          onClick={handleHighStakesToggle}
          tabIndex={hasEnoughLives && !isLoading ? 0 : -1}
          onKeyDown={(e) => e.key === 'Enter' && handleHighStakesToggle()}
          aria-label="Toggle high stakes"
        >
          <div
            style={{
              width: aspectWidth(2),
              height: aspectWidth(2),
              border: `2px solid ${highStakes ? COLORS.MEDIUM : COLORS.BRIGHTEST}`,
              borderRadius: aspectWidth(0.4),
              marginRight: aspectWidth(1.2),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: highStakes ? 'rgba(239, 151, 88, 0.2)' : 'transparent',
              boxShadow: highStakes ? '0 0 10px rgba(239, 151, 88, 0.3)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            {highStakes && <div style={{
              width: '60%',
              height: '60%',
              backgroundColor: COLORS.MEDIUM,
              borderRadius: aspectWidth(0.2)
            }} />}
          </div>

          <div style={{
            fontWeight: '600',
            fontSize: aspectWidth(1),
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            HIGH STAKES (3 LIVES AT RISK)
          </div>

          {!hasEnoughLives && (
            <div style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: '50%',
              height: '2px',
              background: 'linear-gradient(to right, transparent 5%, #e34a4a 15%, #e34a4a 85%, transparent 95%)',
              boxShadow: '0 0 8px #e34a4a',
              transform: 'translateY(-50%)'
            }} />
          )}
        </div>
      </>)}
    </Form>
  )
}
