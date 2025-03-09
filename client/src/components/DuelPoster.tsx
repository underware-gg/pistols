import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState, useMemo } from 'react'
import { useChallengeDescription } from '/src/hooks/useChallengeDescription'
import { useChallenge } from '/src/stores/challengeStore'
import { useDuel } from '/src/hooks/useDuel'
import { useGameAspect } from '/src/hooks/useGameAspect'
import { DUELIST_CARD_WIDTH, DUELIST_CARD_HEIGHT } from '/src/data/cardConstants'
import { DuelistCard } from '/src/components/cards/DuelistCard'
import { DuelIconsAsGrid } from '/src/components/DuelIcons'
import { InteractibleComponent, InteractibleComponentHandle } from '/src/components/InteractibleComponent'
import { CardColor } from '/src/data/cardAssets'
import { ProfilePic } from '/src/components/account/ProfilePic'
import { useIsBookmarked, usePlayer } from '/src/stores/playerStore'
import { useIsMyAccount, useIsYou } from '/src/hooks/useIsYou'
import { Grid } from 'semantic-ui-react'
import { constants } from '@underware_gg/pistols-sdk/pistols/gen'
import { useTable } from '/src/stores/tableStore'
import { makeDuelDataUrl } from '/src/utils/pistols'
import { BookmarkIcon, IconClick } from '/src/components/ui/Icons'
import { ChallengeTime } from '/src/components/ChallengeTime'
import { ActionButton, BalanceRequiredButton } from '/src/components/ui/Buttons'
import { useDuelist } from '/src/stores/duelistStore'
import { usePistolsScene } from '/src/hooks/PistolsContext'
import { usePistolsContext } from '/src/hooks/PistolsContext'
import { useAccount } from '@starknet-react/core'
import { useSettings } from '/src/hooks/SettingsContext'
import { useDojoSystemCalls } from '@underware_gg/pistols-sdk/dojo'
import { usePlayerBookmarkSignedMessage } from '/src/hooks/useSignedMessages'
import { useDuelTokenContract } from '/src/hooks/useTokenContract'
import { SceneName } from '/src/data/assets'

const Row = Grid.Row
const Col = Grid.Column

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
  const { aspectWidth, aspectHeight } = useGameAspect()
  const { dispatchSetScene } = usePistolsScene()
  const { dispatchSelectPlayerAddress, dispatchSelectDuelistId } = usePistolsContext()

  const { duel_token } = useDojoSystemCalls()
  const { duelistId } = useSettings()
  const { account } = useAccount()

  const {
    state,
    tableId,
    duelistAddressA,
    duelistAddressB,
    duelistIdA,
    duelistIdB,
    isLive,
    isFinished,
    premise,
    quote,
    winnerDuelistId,
    isDraw,
    livesStaked,
    needToSyncExpired,
  } = useChallenge(props.duelId)
  const { challengeDescription } = useChallengeDescription(props.duelId)
  const { description: tableDescription, isSeason, isTutorial } = useTable(tableId)
  
  const { name: playerNameA } = usePlayer(duelistAddressA)
  const { name: playerNameB } = usePlayer(duelistAddressB)

  const { turnA, turnB } = useDuel(props.duelId)
  const { isYou: isYouA } = useIsYou(duelistIdA)
  const { isYou: isYouB } = useIsYou(duelistIdB)

  const displayDuelId = (!isTutorial)
  const linkToDuelist = (!isTutorial)

  const { isYou: isChallenger } = useIsYou(duelistIdA)
  const { isMyAccount: isChallenged } = useIsMyAccount(duelistAddressB)

  const { isInAction } = useDuelist(duelistIdB)

  const { duelContractAddress } = useDuelTokenContract()
  const { isBookmarked } = useIsBookmarked(duelContractAddress, props.duelId)
  const { publish } = usePlayerBookmarkSignedMessage(duelContractAddress, props.duelId, !isBookmarked)

  const baseRef = useRef<InteractibleComponentHandle>(null)
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [ cardColor, setCardColor ] = useState(CardColor.WHITE)

  

  const _reply = (accepted: boolean) => {
    const _submit = async () => {
      setIsSubmitting(true)
      await duel_token.reply_duel(account, duelistId, props.duelId, accepted)
      if (accepted) _gotoDuel()
      setIsSubmitting(false)
    }
    _submit()
  }

  const _gotoDuel = () => {
    dispatchSetScene(SceneName.Duel, { duelId: props.duelId })
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
  }));
  
  const isDead = (duelistId: number) => {
    return duelistId !== Number(winnerDuelistId) && isFinished
  }

  useEffect(() => {
    if (!props.isSmall) return

    if ((isYouA && turnA) || (isYouB && turnB)) {
      setCardColor(CardColor.ORANGE)
      baseRef.current?.toggleBlink(true)
    } else {
      setCardColor(CardColor.WHITE)
      baseRef.current?.toggleBlink(false)
    }
  }, [isYouA, isYouB, turnA, turnB, props.isSmall])

  return (
    <InteractibleComponent
      width={aspectWidth(props.isSmall ? 13 : 40)}
      height={aspectHeight(props.isSmall ? 30 : 90)}
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
      mouseDisabled={!props.isSmall}
      onHover={props.onHover}
      onClick={props.onClick}
      ref={baseRef}
      childrenInFront={
        props.isSmall ? (
          <div className='Poster'>
            <div className='PlayerNameB'>
              <p className='NoMargin Overflow NoBreak Bold Black'>{playerNameB}</p>
            </div>
            <div className='ProfilePicContainer'>
              <div className='ProfilePicChallengeContainer Left Small'>
                <ProfilePic profilePic={0} width={6} disabled={isDead(Number(duelistIdA))}  removeBorder removeCorners className='ProfilePicChallenge Left' />
                <img id='DefeatedOverlay' className={ `Left ${isDead(Number(duelistIdA)) ? 'visible' : ''}`} src='/textures/cards/card_disabled.png' />
              </div>
              <div className='ProfilePicChallengeContainer Right Small'>
                <ProfilePic profilePic={0} width={6} disabled={isDead(Number(duelistIdB))}  removeBorder removeCorners className='ProfilePicChallenge Right' />
                <img id='DefeatedOverlay' className={ `Right ${isDead(Number(duelistIdB)) ? 'visible' : ''}`} src='/textures/cards/card_disabled.png' />
              </div>
            </div>
            <div className='PlayerNameA'>
              <p className='NoMargin Overflow NoBreak Bold Black'>{playerNameA}</p>
              <div className='DuelIconsContainer NoMouse NoDrag'>
                <DuelIconsAsGrid duelId={props.duelId} duelistIdA={duelistIdA} duelistIdB={duelistIdB} size='big' />
              </div>
            </div>
            <div className='TableDescriptionFooter'>
              {tableDescription}
            </div>
          </div>
        ) : (
          <div className='Poster'>
            <div className='TableDescriptionTitle Important'>
              {tableDescription.toUpperCase()}
              <IconClick name='database' className='AbsoluteRight' style={{ marginTop: aspectWidth(1.4), marginRight: aspectWidth(1.4) }} size={'small'} onClick={() => window?.open(makeDuelDataUrl(props.duelId), '_blank')} />
            </div>
            <div className='BookmarkSection DuelPoster'>
              <BookmarkIcon isBookmarked={isBookmarked} size='big' fitted onClick={publish} />
            </div>

            <div className='PlayerNameB Large'>
              <p className='NoMargin Overflow NoBreak Bold Black'>{playerNameB}</p>
            </div>
            <div className='ProfilePicContainer Large'>
              <div className='ProfilePicChallengeContainer Left Large'>
                <ProfilePic profilePic={0} width={15} height={13} disabled={isDead(Number(duelistIdA))}  removeBorder removeCorners className='ProfilePicChallenge Left' onClick={() => dispatchSelectPlayerAddress(duelistAddressA)} />
                <img id='DefeatedOverlay' className={ `Left ${isDead(Number(duelistIdA)) ? 'visible' : ''}`} src='/textures/cards/card_disabled.png' />
              </div>
              <div className='VS'>
                VS
              </div>
              <div className='ProfilePicChallengeContainer Right Large'>
                <ProfilePic profilePic={0} width={15} height={13} disabled={isDead(Number(duelistIdB))}  removeBorder removeCorners className='ProfilePicChallenge Right' onClick={() => dispatchSelectPlayerAddress(duelistAddressB)} />
                <img id='DefeatedOverlay' className={ `Right ${isDead(Number(duelistIdB)) ? 'visible' : ''}`} src='/textures/cards/card_disabled.png' />
              </div>
            </div>
            <div className='PlayerNameA Large'>
              <p className='NoMargin Overflow NoBreak Bold Black'>{playerNameA}</p>
            </div>
            
            <div className='DuelInfoContainer'>
              <div className='DuelistCard' style={{ width: aspectWidth(DUELIST_CARD_WIDTH / 2), height: aspectWidth(DUELIST_CARD_HEIGHT) }}>
                {duelistIdA ? (
                  <DuelistCard
                    duelistId={Number(duelistIdA)}
                    isSmall={true}
                    isLeft={true}
                    isVisible={true}
                    isFlipped={true}
                    instantFlip={true}
                    isHanging={true}
                    isHighlightable={true}
                    isDisabled={isDead(Number(duelistIdA))}
                    width={DUELIST_CARD_WIDTH}
                    height={DUELIST_CARD_HEIGHT}
                    onClick={() => dispatchSelectDuelistId(duelistId)}
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
                    <h3 className='Quote Darkest'>{`“${quote}”`}</h3>
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
                      <DuelIconsAsGrid duelId={props.duelId} duelistIdA={duelistIdA} duelistIdB={duelistIdB} size='big' />
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
              <div className='DuelistCard' style={{ width: aspectWidth(DUELIST_CARD_WIDTH / 2), height: aspectWidth(DUELIST_CARD_HEIGHT) }}>
                {duelistIdB ? (
                  <DuelistCard
                    duelistId={Number(duelistIdB)}
                    isSmall={true}
                    isLeft={false}
                    isVisible={true}
                    isFlipped={true}
                    instantFlip={true}
                    isHanging={true}
                    isHighlightable={true}
                    width={DUELIST_CARD_WIDTH}
                    height={DUELIST_CARD_HEIGHT}
                    onClick={() => dispatchSelectDuelistId(duelistId)}
                  />
                ) : null}
              </div>
            </div>

            <Grid className='Padded YesMouse' textAlign='center' style={{ width: '90%' }}>
              <Row columns='equal'>
                <Col>
                  <ActionButton large fillParent label='Close' className='FillParent' onClick={props._close} />
                </Col>
                {(state == constants.ChallengeState.Awaiting && isChallenger) &&
                  <>
                    <Col>
                      <ActionButton large fillParent negative label='Cowardly Withdraw' disabled={isSubmitting} onClick={() => _reply(false)} confirm confirmMessage='This action will cancel this Challenge' />
                    </Col>
                    <Col>
                      <ActionButton large fillParent important label='Go to Live Duel!' onClick={() => _gotoDuel()} />
                    </Col>
                  </>
                }
                {(state == constants.ChallengeState.Awaiting && isChallenged) &&
                  <Col>
                    <ActionButton large fillParent negative label='Cowardly Refuse' disabled={isSubmitting} onClick={() => _reply(false)} confirm confirmMessage='This action will cancel this Challenge' />
                  </Col>
                }
                {(state == constants.ChallengeState.Awaiting && isChallenged) &&
                  (!isInAction ?
                    <Col>
                      <BalanceRequiredButton label='Accept Challenge!' disabled={isSubmitting} onClick={() => _reply(true)} fee={0} />
                    </Col>
                    :
                    <Col>
                      <ActionButton large fillParent label='Select another duelist!' disabled={true} onClick={() => {}} />
                    </Col>
                  )
                }
                {(state == constants.ChallengeState.InProgress) &&
                  <Col>
                    <ActionButton large fillParent important label='Go to Live Duel!' onClick={() => _gotoDuel()} />
                  </Col>
                }
                {isFinished &&
                  <Col>
                    <ActionButton large fillParent important label='Replay Duel!' onClick={() => _gotoDuel()} />
                  </Col>
                }
                {(needToSyncExpired && (isChallenger || isChallenged)) &&
                  <Col>
                    <ActionButton large fillParent important label='Withdraw Expired Fees' disabled={isSubmitting} onClick={() => _reply(false)} />
                  </Col>
                }
              </Row>
            </Grid>
            
          </div>
        )
      }
    />
  )
})
