import React, { useEffect, useMemo, useState } from 'react'
import { Grid, Modal, Form, Dropdown } from 'semantic-ui-react'
import { BigNumberish } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { useDojoSystemCalls } from '@underware/pistols-sdk/dojo'
import { usePistolsContext } from '/src/hooks/PistolsContext'
import { useTableId } from '/src/stores/configStore'
import { useTable } from '/src/stores/tableStore'
import { usePact } from '/src/hooks/usePact'
import { useCalcFeeDuel, useCalcSeasonReward, useCanJoin } from '/src/hooks/usePistolsContractCalls'
import { ActionButton, BalanceRequiredButton } from '/src/components/ui/Buttons'
import { formatOrdinalNumber } from '@underware/pistols-sdk/utils'
import { POSTER_HEIGHT_SMALL, POSTER_WIDTH_SMALL, ProfilePoster } from '/src/components/ui/ProfilePoster'
import { DuelistCard } from '/src/components/cards/DuelistCard';
import { FormInput } from '/src/components/ui/Form'
import { FeesToPay } from '/src/components/account/LordsBalance'
import { Balance } from '/src/components/account/Balance'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { useDuelistFameBalance } from '/src/stores/coinStore'
import { DUELIST_CARD_HEIGHT } from '/src/data/cardConstants'
import { DUELIST_CARD_WIDTH } from '/src/data/cardConstants'
import { useGameAspect } from '/src/hooks/useGameAspect'

const Row = Grid.Row
const Col = Grid.Column

export default function NewChallengeModal() {
  const { challengingAddress, challengingDuelistId } = usePistolsContext()
  const isOpen = useMemo(() => (challengingAddress > 0n && challengingDuelistId > 0n), [challengingDuelistId, challengingDuelistId])
  return (<>{isOpen && <_NewChallengeModal isOpen={isOpen} />}</>)
}

function _NewChallengeModal({
  isOpen,
}: {
  isOpen: boolean
}) {
  const { duel_token } = useDojoSystemCalls()
  const { account, address } = useAccount()
  const { tableId } = useTableId()
  const { aspectWidth, aspectHeight } = useGameAspect()

  const { 
    duelistSelectOpener, 
    challengingAddress, 
    challengingDuelistId, 
    dispatchChallengingPlayerAddress, 
    dispatchChallengingDuelistId, 
    dispatchSelectPlayerAddress, 
    dispatchSelectDuelistId, 
    dispatchSelectDuel 
  } = usePistolsContext()

  const addressA = address
  const addressB = challengingAddress

  const _close = () => { 
    dispatchChallengingPlayerAddress(0n) 
    dispatchChallengingDuelistId(0n)
    duelistSelectOpener.close()
  }

  const { hasPact, pactDuelId } = usePact(tableId, addressA, addressB, isOpen)
  const { description: tableDescription } = useTable(tableId)
  const [args, setArgs] = useState<any>(null)
  const { fee } = useCalcFeeDuel(tableId)
  const { canJoin } = useCanJoin(tableId, challengingDuelistId)
  const { rewards } = useCalcSeasonReward(tableId, challengingDuelistId, args?.lives_staked)
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
      await duel_token.create_duel(account, challengingDuelistId, challengingAddress, args.premise, args.quote, tableId, args.expire_hours, args.lives_staked)
      setIsSubmitting(false)
    }
    if (args?.canSubmit) _submit()
  }

  return (
    <>
      <Modal open={isOpen} onClose={() => _close()}>
        <Modal.Header>
          <Grid>
            <Row>
              <Col width={4} textAlign='left' className='NoBreak'>
                New Challenge
              </Col>
              <Col width={8} textAlign='center' className='NoBreak Important'>
                {tableDescription}
              </Col>
            </Row>
          </Grid>
        </Modal.Header>

        <Modal.Content>
          <Grid>
            <Row>
              <Col width={4} style={{  }}>
                <div style={{ width: '100%', height: aspectHeight(POSTER_HEIGHT_SMALL), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ProfilePoster
                    playerAddress={addressA}
                    _close={() => {}}
                    isSmall={true}
                    isVisible={true}
                    instantVisible={true}
                    isHighlightable={false}
                    onClick={() => dispatchSelectPlayerAddress(challengingAddress)}
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
                    onClick={() => duelistSelectOpener.open()}
                  />
                </div>
              </Col>
              
              <Col width={8}>
                <div className='TextDivider bright NewChallengeDivider'>
                  Terms of Combat
                </div>
                <div className='Spacer5' />

                <NewChallengeForm duelistId={challengingDuelistId} setArgs={setArgs} />

                {fee > 0n && (
                  <div style={{margin: '1em 0'}}>
                    <FeesToPay size='big' value={0} fee={fee} prefixed />
                  </div>
                )}

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
                          }}/>
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
                          }}/>
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
                    _close={() => {}}
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
    </>
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
  const { lives } = useDuelistFameBalance(duelistId)

  const { aspectWidth } = useGameAspect()
  
  const [premise, setPremise] = useState(constants.Premise.Honour)
  const [quote, setQuote] = useState('')
  const [days, setDays] = useState(7)
  const [hours, setHours] = useState(0)
  const [lives_staked, setLivesStaked] = useState(Math.min(1, lives))

  const canSubmit = useMemo(() => (quote.length > 3 && (days + hours) > 0 && lives_staked > 0), [quote, days, hours, lives_staked])

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

  const premiseOptions = useMemo(() => Object.keys(constants.Premise).slice(1).map((premise) => ({
    key: `${premise}`,
    value: `${premise}`,
    text: `${premise}`,
  })), [])

  const daysOptions = useMemo(() => Array.from(Array(8).keys()).map(index => ({
    key: `${index}d`,
    value: `${index}`,
    text: `${index} days`,
  })), [])

  const hoursOptions = useMemo(() => Array.from(Array(24).keys()).map(index => ({
    key: `${index}h`,
    value: `${index}`,
    text: `${index} hours`,
  })), [])

  const livesOptions = useMemo(() => [...Array(lives).keys()].map(index => ({
    key: `${index + 1}`,
    value: `${index + 1}`,
    text: `${index + 1} lives`,
  })), [lives])

  return (
    <Form style={{ width: '80%', marginLeft: '10%' }}>
      <Form.Field>
        <div className='NewChallengeDivider Small VerticalSpacing Centered'>PREMISE</div>
        <Dropdown
          options={premiseOptions}
          placeholder={null}
          selection
          fluid
          value={constants.PREMISES[premise].name}
          onChange={(e, { value }) => setPremise(value as constants.Premise)}
        />
      </Form.Field>

      <Form.Field>
        <div className={`NewChallengeDivider Small VerticalSpacing Centered ${quote.length > 3 ? '' : 'Warning'}`}>{constants.PREMISES[premise].prefix.toUpperCase()}</div>
        <FormInput
          placeholder={'DESCRIBE YOUR REASONING'}
          value={quote}
          fluid
          setValue={setQuote}
          code={true}
          disabled={false}
          maxLength={31}
        />
      </Form.Field>

      <div className={`NewChallengeDivider Small VerticalSpacing Centered ${(days + hours) > 0 ? '' : 'Warning'}`}>DURATION</div>
      <Grid>
        <Row>
          <Col width={8}>
            <Dropdown className='FillWidth' defaultValue='7' placeholder='Days' selection options={daysOptions} onChange={(e, { value }) => setDays(parseInt(value as string))} />
          </Col>
          <Col width={8}>
            <Dropdown className='FillWidth' defaultValue='0' placeholder='Hours' selection options={hoursOptions} onChange={(e, { value }) => setHours(parseInt(value as string))} />
          </Col>
        </Row>
      </Grid>

      <div className={`NewChallengeDivider Small VerticalSpacing Centered ${lives_staked > 0 ? '' : 'Warning'}`}>STAKES</div>
       <Dropdown className='FillWidth' defaultValue='1' placeholder='Lives' selection options={livesOptions} onChange={(e, { value }) => setLivesStaked(parseInt(value as string))} />
    </Form>
  )
}
