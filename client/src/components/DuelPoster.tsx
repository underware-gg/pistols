import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState, useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { useChallengeDescription } from '/src/hooks/useChallengeDescription'
import { useChallenge, useRound } from '/src/stores/challengeStore'
import { useDuel } from '/src/hooks/useDuel'
import { useGameAspect } from '/src/hooks/useGameAspect'
import { DUELIST_CARD_WIDTH, DUELIST_CARD_HEIGHT } from '/src/data/cardConstants'
import { DuelistCard } from '/src/components/cards/DuelistCard'
import { DuelIconsAsGrid } from '/src/components/DuelIcons'
import { InteractibleComponent, InteractibleComponentHandle } from '/src/components/InteractibleComponent'
import { CardColor } from '@underware/pistols-sdk/pistols/constants'
import { ProfilePic } from '/src/components/account/ProfilePic'
import { useIsBookmarked, usePlayer } from '/src/stores/playerStore'
import { useIsMyAccount } from '/src/hooks/useIsYou'
import { Grid } from 'semantic-ui-react'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { useCurrentSeason } from '/src/stores/seasonStore'
import { makeDuelDataUrl, makeDuelTweetUrl } from '/src/utils/pistols'
import { BookmarkIcon, IconClick } from '/src/components/ui/Icons'
import { ChallengeTime } from '/src/components/ChallengeTime'
import { ActionButton, BalanceRequiredButton } from '/src/components/ui/Buttons'
import { useDuelist } from '/src/stores/duelistStore'
import { usePistolsScene } from '/src/hooks/PistolsContext'
import { usePistolsContext } from '/src/hooks/PistolsContext'
import { useAccount } from '@starknet-react/core'
import { useDojoSystemCalls } from '@underware/pistols-sdk/dojo'
import { usePlayerBookmarkSignedMessage } from '/src/hooks/useSignedMessages'
import { useTokenContracts } from '/src/hooks/useTokenContracts'
import { useCanCollectDuel } from '/src/hooks/usePistolsContractCalls'
import { useDuelCallToAction } from '/src/stores/eventsModelStore'
import { useDuelistFameBalance } from '/src/stores/coinStore'
import { SceneName } from '/src/data/assets'
import { useDuelistFameOnDuel } from '../queries/useDuelistFameOnDuel'

const Row = Grid.Row
const Col = Grid.Column

const POSTER_WIDTH_BIG = 40
const POSTER_HEIGHT_BIG = 90
const POSTER_WIDTH_SMALL = 13
const POSTER_HEIGHT_SMALL = 30

interface DuelPosterProps {
  duelId?: bigint
  isSmall?: boolean
  isFlipped?: boolean
  isVisible?: boolean
  isHighlightable?: boolean
  instantVisible?: boolean

  startPosition?: { x: number, y: number }
  startRotation?: number
  startScale?: number

  onHover?: (isHovered: boolean) => void
  onClick?: (e: React.MouseEvent) => void
  _close?: () => void
}

export interface DuelPosterHandle extends InteractibleComponentHandle {}

// Only shared data between small and full components
const useDuelPosterData = (duelId?: bigint) => {
  const {
    duelistAddressA,
    duelistAddressB,
    duelistIdA,
    duelistIdB,
    isFinished,
    winnerDuelistId,
  } = useChallenge(duelId)
  
  const { name: playerNameA, isBlocked: isBlockedA } = usePlayer(duelistAddressA)
  const { name: playerNameB, isBlocked: isBlockedB } = usePlayer(duelistAddressB)
  const { isMyAccount: isYouA } = useIsMyAccount(duelistAddressA)
  const { isMyAccount: isYouB } = useIsMyAccount(duelistAddressB)
  
  const [leftDuelistId, leftDuelistAddress, leftPlayerName, leftIsBlocked] = useMemo(() => {
    if (isYouB) {
      return [duelistIdB, duelistAddressB, playerNameB, isBlockedB]
    }
    return [duelistIdA, duelistAddressA, playerNameA, isBlockedA]
  }, [isYouB, duelistIdA, duelistIdB, duelistAddressA, duelistAddressB, playerNameA, playerNameB, isBlockedA, isBlockedB])
  
  const [rightDuelistId, rightDuelistAddress, rightPlayerName, rightIsBlocked] = useMemo(() => {
    if (isYouB) {
      return [duelistIdA, duelistAddressA, playerNameA, isBlockedA]
    }
    return [duelistIdB, duelistAddressB, playerNameB, isBlockedB]
  }, [isYouB, duelistIdA, duelistIdB, duelistAddressA, duelistAddressB, playerNameA, playerNameB, isBlockedA, isBlockedB])

  const isDead = (duelistId: number) => {
    return duelistId !== Number(winnerDuelistId) && isFinished
  }

  const { fameBefore: fameBeforeA, fameAfter: fameAfterA } = useDuelistFameOnDuel(duelId, duelistIdA)
  const { fameBefore: fameBeforeB, fameAfter: fameAfterB } = useDuelistFameOnDuel(duelId, duelistIdB)
  
  return {
    leftDuelistId,
    leftDuelistAddress,
    leftPlayerName,
    leftIsBlocked,
    rightDuelistId,
    rightDuelistAddress,
    rightPlayerName,
    rightIsBlocked,
    isDead,
    isYouA,
    isYouB,
    fameBeforeA,
    fameAfterA,
    fameBeforeB,
    fameAfterB,
  }
}

// Small version of the DuelPoster
const DuelPosterSmall = forwardRef<DuelPosterHandle, DuelPosterProps>((props, ref) => {
  const { aspectWidth, aspectHeight } = useGameAspect()
  const { leftDuelistId, rightDuelistId, leftPlayerName, rightPlayerName, isDead, isYouA, isYouB, leftIsBlocked, rightIsBlocked } = useDuelPosterData(props.duelId)
  const { turnA, turnB } = useDuel(props.duelId)
  const isCallToAction = useDuelCallToAction(props.duelId)
  const { seasonName, isFinished } = useChallenge(props.duelId)
  const { seasonName: currentSeasonName } = useCurrentSeason()
  const seasonDescription = useMemo(() => (seasonName ?? currentSeasonName), [seasonName, currentSeasonName])

  const baseRef = useRef<InteractibleComponentHandle>(null)
  const [cardColor, setCardColor] = useState(CardColor.WHITE)

  useImperativeHandle(ref, () => ({
    flip: (flipped, isLeft, duration, easing, interpolation) =>
      baseRef.current?.flip(flipped, isLeft, duration, easing, interpolation),
    setPosition: (x, y, duration, easing, interpolation) =>
      baseRef.current?.setPosition(x, y, duration, easing, interpolation),
    setScale: (scale, duration, easing, interpolation) =>
      baseRef.current?.setScale(scale, duration, easing, interpolation),
    setRotation: (rotation, duration, easing, interpolation) =>
      baseRef.current?.setRotation(rotation, duration, easing, interpolation),
    setZIndex: (index, backgroundIndex) =>
      baseRef.current?.setZIndex(index, backgroundIndex),
    toggleVisibility: (isVisible) =>
      baseRef.current?.toggleVisibility(isVisible),
    toggleHighlight: (isHighlighted, shouldBeWhite, color) =>
      baseRef.current?.toggleHighlight(isHighlighted, shouldBeWhite, color),
    toggleDefeated: (isDefeated) =>
      baseRef.current?.toggleDefeated(isDefeated),
    playHanging: () => baseRef.current?.playHanging(),
    toggleIdle: (isPlaying) => baseRef.current?.toggleIdle(isPlaying),
    toggleBlink: (isBlinking, duration) => baseRef.current?.toggleBlink(isBlinking, duration),
    getStyle: () => baseRef.current?.getStyle() || { translateX: 0, translateY: 0, rotation: 0, scale: 1 },
  }))

  useEffect(() => {
    if ((isYouA && turnA) || (isYouB && turnB)) {
      setCardColor(CardColor.PURPLE)
      baseRef.current?.toggleBlink(true)
    } else if (isFinished && isCallToAction) {
      setCardColor(CardColor.PURPLE)
      baseRef.current?.toggleBlink(true)
    } else {
      setCardColor(CardColor.WHITE)
      baseRef.current?.toggleBlink(false)
    }
  }, [isYouA, isYouB, turnA, turnB, isFinished, isCallToAction])

  return (
    <InteractibleComponent
      width={aspectWidth(POSTER_WIDTH_SMALL)}
      height={aspectHeight(POSTER_HEIGHT_SMALL)}
      isLeft={false}
      isFlipped={props.isFlipped}
      isVisible={props.isVisible}
      isHighlightable={props.isHighlightable}
      instantFlip={true}
      instantVisible={props.instantVisible}
      hasBorder={false}
      frontImagePath={"/images/ui/duel_paper.png"}
      defaultHighlightColor={cardColor}
      startPosition={props.startPosition}
      startRotation={props.startRotation}
      startScale={props.startScale}
      hasCenteredOrigin={true}
      mouseDisabled={false}
      onHover={props.onHover}
      onClick={props.onClick}
      ref={baseRef}
      childrenInFront={
        <div className='Poster'>
          <div className='PlayerNameB'>
            <p className='NoMargin Overflow NoBreak Bold Black'>{rightPlayerName}</p>
          </div>
          <div className='ProfilePicContainer'>
            <div className='ProfilePicChallengeContainer Left Small'>
              <ProfilePic profilePic={0} width={6} disabled={isDead(Number(leftDuelistId))} removeBorder removeCorners className='ProfilePicChallenge Left' />
              <img id='DefeatedOverlay' className={`Left ${isDead(Number(leftDuelistId)) ? 'visible' : ''}`} src='/textures/cards/card_disabled.png' />
            </div>
            {leftIsBlocked && <div className='BlockedOverlay DuelSmall Left' />}
            <div className='ProfilePicChallengeContainer Right Small'>
              <ProfilePic profilePic={0} width={6} disabled={isDead(Number(rightDuelistId))} removeBorder removeCorners className='ProfilePicChallenge Right' />
              <img id='DefeatedOverlay' className={`Right ${isDead(Number(rightDuelistId)) ? 'visible' : ''}`} src='/textures/cards/card_disabled.png' />
            </div>
            {rightIsBlocked && <div className='BlockedOverlay DuelSmall Right' />}
          </div>
          <div className='PlayerNameA'>
            <p className='NoMargin Overflow NoBreak Bold Black'>{leftPlayerName}</p>
            <div className='DuelIconsContainer NoMouse NoDrag'>
              <DuelIconsAsGrid duelId={props.duelId} duelistIdA={leftDuelistId} duelistIdB={rightDuelistId} size='big' />
            </div>
          </div>
          <div className='TableDescriptionFooter'>
            {seasonDescription}
          </div>
        </div>
      }
    />
  )
})

// Full version of the DuelPoster
const DuelPosterFull = forwardRef<DuelPosterHandle, DuelPosterProps>((props, ref) => {
  const { aspectWidth, aspectHeight } = useGameAspect()
  const { dispatchSetScene } = usePistolsScene()
  const { challengingDuelistId, dispatchSelectPlayerAddress, dispatchSelectDuelistId, dispatchChallengingDuelistId } = usePistolsContext()
  const { duel_token, game } = useDojoSystemCalls()
  const { account } = useAccount()
  const isCallToAction = useDuelCallToAction(props.duelId)
  const { duelistSelectOpener } = usePistolsContext()
  const { leftDuelistId, rightDuelistId, leftDuelistAddress, rightDuelistAddress, leftPlayerName, rightPlayerName, isDead, isYouA, isYouB, leftIsBlocked, rightIsBlocked } = useDuelPosterData(props.duelId)

  const {
    state,
    seasonName,
    isLive,
    isFinished,
    premise,
    message,
    livesStaked,
    needToSyncExpired,
  } = useChallenge(props.duelId)
  const { endedInBlades, endedInPaces } = useRound(props.duelId)
  const { canCollectDuel } = useCanCollectDuel(props.duelId)
  const { challengeDescription } = useChallengeDescription(props.duelId)
  const { seasonName: currentSeasonName } = useCurrentSeason()
  const seasonDescription = useMemo(() => (seasonName ?? currentSeasonName), [seasonName, currentSeasonName])

  const { lives } = useDuelistFameBalance(challengingDuelistId)
  const isChallenger = useMemo(() => isYouA, [isYouA])
  const isChallenged = useMemo(() => isYouB, [isYouB])
  const { isInAction } = useDuelist(challengingDuelistId)
  const { duelContractAddress } = useTokenContracts()
  const { isBookmarked } = useIsBookmarked(duelContractAddress, props.duelId)
  const { publish } = usePlayerBookmarkSignedMessage(duelContractAddress, props.duelId, !isBookmarked)

  const baseRef = useRef<InteractibleComponentHandle>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const _collectDuel = () => {
    game.collect_duel(account, props.duelId)
  }

  const _reply = (accepted: boolean) => {
    if (accepted) {
      duelistSelectOpener.open()
    } else {
      _submit(0n, accepted)
    }
  }

  const _submit = async (duelistId?: BigNumberish, accepted?: boolean) => {
    setIsSubmitting(true)
    await duel_token.reply_duel(account, props.duelId, duelistId, accepted)
    dispatchChallengingDuelistId(0n)
    if (accepted) _gotoDuel()
    setIsSubmitting(false)
  }

  const _gotoDuel = () => {
    dispatchSetScene(SceneName.Duel, { duelId: props.duelId })
    props._close?.()
  }

  useImperativeHandle(ref, () => ({
    flip: (flipped, isLeft, duration, easing, interpolation) =>
      baseRef.current?.flip(flipped, isLeft, duration, easing, interpolation),
    setPosition: (x, y, duration, easing, interpolation) =>
      baseRef.current?.setPosition(x, y, duration, easing, interpolation),
    setScale: (scale, duration, easing, interpolation) =>
      baseRef.current?.setScale(scale, duration, easing, interpolation),
    setRotation: (rotation, duration, easing, interpolation) =>
      baseRef.current?.setRotation(rotation, duration, easing, interpolation),
    setZIndex: (index, backgroundIndex) =>
      baseRef.current?.setZIndex(index, backgroundIndex),
    toggleVisibility: (isVisible) =>
      baseRef.current?.toggleVisibility(isVisible),
    toggleHighlight: (isHighlighted, shouldBeWhite, color) =>
      baseRef.current?.toggleHighlight(isHighlighted, shouldBeWhite, color),
    toggleDefeated: (isDefeated) =>
      baseRef.current?.toggleDefeated(isDefeated),
    playHanging: () => baseRef.current?.playHanging(),
    toggleIdle: (isPlaying) => baseRef.current?.toggleIdle(isPlaying),
    toggleBlink: (isBlinking, duration) => baseRef.current?.toggleBlink(isBlinking, duration),
    getStyle: () => baseRef.current?.getStyle() || { translateX: 0, translateY: 0, rotation: 0, scale: 1 },
  }))

  return (
    <InteractibleComponent
      width={aspectWidth(POSTER_WIDTH_BIG)}
      height={aspectHeight(POSTER_HEIGHT_BIG)}
      isLeft={false}
      isFlipped={props.isFlipped}
      isVisible={props.isVisible}
      isHighlightable={props.isHighlightable}
      instantFlip={true}
      instantVisible={props.instantVisible}
      hasBorder={false}
      frontImagePath={"/images/ui/duel_paper.png"}
      defaultHighlightColor={CardColor.WHITE}
      startPosition={props.startPosition}
      startRotation={props.startRotation}
      startScale={props.startScale}
      hasCenteredOrigin={true}
      mouseDisabled={true}
      onHover={props.onHover}
      onClick={props.onClick}
      ref={baseRef}
      childrenInFront={
        <div className='Poster'>
          <div className='TableDescriptionTitle Important'>
            {seasonDescription.toUpperCase()}
            <IconClick name='database' className='AbsoluteRight' style={{ marginTop: aspectWidth(1.4), marginRight: aspectWidth(1.4) }} size={'small'} onClick={() => window?.open(makeDuelDataUrl(props.duelId), '_blank')} />
            <IconClick name='share' className='AbsoluteRight' style={{ marginTop: aspectWidth(1.4), marginRight: aspectWidth(4.4) }} size={'small'} onClick={() => {
              const twitterUrl = makeDuelTweetUrl(props.duelId, message, premise, livesStaked, isYouA, isYouB, leftPlayerName, rightPlayerName)
              window?.open(twitterUrl, '_blank');
            }} />
          </div>
          <div className='BookmarkSection'>
            <BookmarkIcon isBookmarked={isBookmarked} size='big' fitted onClick={publish} />
          </div>

          <div className='PlayerNameB Large'>
            <p className='NoMargin Overflow NoBreak Bold Black'>{rightPlayerName}</p>
          </div>
          <div className='ProfilePicContainer Large'>
            <div className='ProfilePicChallengeContainer Left Large'>
              <ProfilePic profilePic={0} width={15} height={13} dimmed={isDead(Number(leftDuelistId))} removeBorder removeCorners className='ProfilePicChallenge Left' onClick={() => dispatchSelectPlayerAddress(leftDuelistAddress)} />
              <img id='DefeatedOverlay' className={`NoMouse NoDrag Left ${isDead(Number(leftDuelistId)) ? 'visible' : ''}`} src='/textures/cards/card_disabled.png' />
            </div>
            {leftIsBlocked && <div className='BlockedOverlay DuelLarge Left' />}
            <div className='VS'>
              VS
            </div>
            <div className='ProfilePicChallengeContainer Right Large'>
              <ProfilePic profilePic={0} width={15} height={13} dimmed={isDead(Number(rightDuelistId))} removeBorder removeCorners className='ProfilePicChallenge Right' onClick={() => dispatchSelectPlayerAddress(rightDuelistAddress)} />
              <img id='DefeatedOverlay' className={`NoMouse NoDrag Right ${isDead(Number(rightDuelistId)) ? 'visible' : ''}`} src='/textures/cards/card_disabled.png' />
            </div>
            {rightIsBlocked && <div className='BlockedOverlay DuelLarge Right' />}
          </div>
          <div className='PlayerNameA Large'>
            <p className='NoMargin Overflow NoBreak Bold Black'>{leftPlayerName}</p>
          </div>
          
          <div className='DuelInfoContainer'>
            <div className='DuelistCard Left' style={{ width: aspectWidth(DUELIST_CARD_WIDTH / 2), height: aspectWidth(DUELIST_CARD_HEIGHT) }}>
              {leftDuelistId || challengingDuelistId ? (
                <DuelistCard
                  duelistId={Number(leftDuelistId || challengingDuelistId)}
                  isSmall={true}
                  isLeft={true}
                  isVisible={true}
                  isFlipped={true}
                  instantFlip={true}
                  isHanging={true}
                  isHangingLeft={true}
                  isHighlightable={true}
                  width={DUELIST_CARD_WIDTH}
                  height={DUELIST_CARD_HEIGHT}
                  onClick={() => {
                    if ((leftDuelistId && state != constants.ChallengeState.Awaiting) || isChallenger) {
                      dispatchSelectDuelistId(leftDuelistId)
                    } else {
                      duelistSelectOpener.open()
                    }
                  }}
                />
              ) : null}
            </div>
            <Grid className='InfoGrid'>
              <Row columns='equal' textAlign='right'>
                <Col>
                  <div className='TextDivider WantedDivider EqualMargin'>{constants.PREMISES[premise].prefix.toUpperCase()}</div>
                </Col>
              </Row>
              <Row columns='equal' textAlign='center'>
                <Col>
                  <h3 className='Quote Darkest'>{`"${message}"`}</h3>
                  <h3 className='Quote Darkest'>~ Staking {livesStaked} {livesStaked == 1 ? 'life' : 'lives!'} ~</h3>
                </Col>
              </Row>

              {(isLive || isFinished) && <>
                <Row columns='equal' textAlign='right'>
                  <Col>
                    <div className='TextDivider WantedDivider EqualMargin'>ACTIONS</div>
                  </Col>
                </Row>
                <Row textAlign='center'>
                  <Col width={16} textAlign='right' className='Darkest'>
                    <DuelIconsAsGrid duelId={props.duelId} duelistIdA={leftDuelistId} duelistIdB={rightDuelistId} size='big' />
                  </Col>
                </Row>
              </>}

              <Row columns='equal' textAlign='right'>
                <Col>
                  <div className='TextDivider WantedDivider EqualMargin'>STATUS</div>
                </Col>
              </Row>
              <Row columns='equal' textAlign='center'>
                <Col>
                  <h5 className='Darkest'>{challengeDescription}</h5>
                  <span className='Code Darkest'><ChallengeTime duelId={props.duelId} prefixed /></span>
                </Col>
              </Row>
            </Grid>
            <div className='DuelistCard Right' style={{ width: aspectWidth(DUELIST_CARD_WIDTH / 2), height: aspectWidth(DUELIST_CARD_HEIGHT) }}>
              {rightDuelistId ? (
                <DuelistCard
                  duelistId={Number(rightDuelistId)}
                  isSmall={true}
                  isLeft={false}
                  isVisible={true}
                  isFlipped={true}
                  instantFlip={true}
                  isHanging={true}
                  isHangingLeft={false}
                  isHighlightable={true}
                  width={DUELIST_CARD_WIDTH}
                  height={DUELIST_CARD_HEIGHT}
                  onClick={() => dispatchSelectDuelistId(rightDuelistId)}
                />
              ) : null}
            </div>
          </div>

          <Grid className='Padded YesMouse' textAlign='center' style={{ width: '90%' }}>
            <Row columns='equal'>
              <Col>
                <ActionButton large fillParent label='Close' className='FillParent' onClick={props._close} />
              </Col>
              {(state == constants.ChallengeState.InProgress && canCollectDuel) &&
                <Col>
                  <ActionButton large fill important label='Timed Out, Collect Duel' onClick={() => _collectDuel()} />
                </Col>
              }
              {(state == constants.ChallengeState.Awaiting && isChallenger) &&
                <>
                  <Col>
                    <ActionButton large fillParent negative label='Cowardly Withdraw' disabled={isSubmitting} onClick={() => _reply(false)} confirm confirmMessage='This action will cancel this Challenge' />
                  </Col>
                </>
              }
              {(state == constants.ChallengeState.Awaiting && isChallenged) &&
                <Col>
                  <ActionButton large fillParent negative label='Cowardly Refuse' disabled={isSubmitting} onClick={() => _reply(false)} confirm confirmMessage='This action will cancel this Challenge' />
                </Col>
              }
              {(state == constants.ChallengeState.Awaiting && isChallenged) &&
                (!challengingDuelistId ? (
                    <Col>
                      <ActionButton large fillParent important label='Select Duelist' disabled={isSubmitting} onClick={() => duelistSelectOpener.open()} />
                    </Col>
                  ) : (
                    isInAction || lives < livesStaked ? (
                      <Col>
                        <ActionButton large fillParent label='Select another duelist!' onClick={() => duelistSelectOpener.open()} />
                      </Col>
                    ) : (
                      <Col>
                        <BalanceRequiredButton label='Accept Challenge!' fillParent fill={false} disabled={isSubmitting} onClick={() => _submit(challengingDuelistId, true)} fee={0} />
                      </Col>
                    )
                  ))
              }
              {((state == constants.ChallengeState.Awaiting && isChallenger) || state == constants.ChallengeState.InProgress || (state !== constants.ChallengeState.Awaiting && isCallToAction)) &&
                <Col>
                  <ActionButton large fillParent important label='Go to Live Duel!' onClick={() => _gotoDuel()} />
                </Col>
              }
              {isFinished && !isCallToAction && (endedInBlades || endedInPaces) &&
                <Col>
                  <ActionButton large fillParent important label='Replay Duel!' onClick={() => _gotoDuel()} />
                </Col>
              }
              {(needToSyncExpired && (isChallenger || isChallenged)) &&
                <Col>
                  <ActionButton large fillParent important label='Expired, Collect Duel' disabled={isSubmitting} onClick={() => _reply(false)} />
                </Col>
              }
            </Row>
          </Grid>
        </div>
      }
    />
  )
})

// Main wrapper component
export const DuelPoster = forwardRef<DuelPosterHandle, DuelPosterProps>((props: DuelPosterProps = {
  isSmall: true,
  isFlipped: true,
  isVisible: false,
  isHighlightable: false,
  instantVisible: false,
  startPosition: { x: 0, y: 0 },
  startRotation: 0,
  startScale: 1
}, ref: React.Ref<DuelPosterHandle>) => {
  return props.isSmall ? (
    <DuelPosterSmall {...props} ref={ref} />
  ) : (
    <DuelPosterFull {...props} ref={ref} />
  )
})
