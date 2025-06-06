import React, { forwardRef, useImperativeHandle, useRef, useState, useMemo, useEffect } from 'react'
import { BigNumberish } from 'starknet'
import { useGameAspect } from '/src/hooks/useGameAspect'
import { DUELIST_CARD_WIDTH, DUELIST_CARD_HEIGHT } from '/src/data/cardConstants'
import { DuelistCard, DuelistCardHandle } from '/src/components/cards/DuelistCard'
import { InteractibleComponent, InteractibleComponentHandle } from '/src/components/InteractibleComponent'
import { CardColor } from '@underware/pistols-sdk/pistols/constants'
import { ProfilePic } from '/src/components/account/ProfilePic'
import { useIsBookmarked, usePlayer, getPlayerOnlineStatus } from '/src/stores/playerStore'
import { useIsMyAccount } from '/src/hooks/useIsYou'
import { Grid } from 'semantic-ui-react'
import { BookmarkIcon } from '/src/components/ui/Icons'
import { ActionButton } from '/src/components/ui/Buttons'
import { usePistolsScene } from '/src/hooks/PistolsContext'
import { usePistolsContext } from '/src/hooks/PistolsContext'
import { SceneName } from '/src/data/assets'
import { useDuelistsOfOwner } from '/src/hooks/useTokenDuelists'
import { useExecuteEmitPlayerBookmark } from '/src/hooks/usePistolsSystemCalls'
import { Address } from './Address'
import { ChallengeButton } from '/src/components/ui/Buttons'
import { useDiscordSocialLink } from '/src/stores/eventsModelStore'

const Row = Grid.Row
const Col = Grid.Column

export const POSTER_WIDTH_BIG = 40
export const POSTER_HEIGHT_BIG = 90
export const POSTER_WIDTH_SMALL = 13
export const POSTER_HEIGHT_SMALL = 32

interface ProfilePosterProps {
  playerAddress?: BigNumberish
  isSmall?: boolean
  isVisible?: boolean
  isHighlightable?: boolean
  instantVisible?: boolean
  
  width?: number
  height?: number
  
  startPosition?: { x: number, y: number }
  startRotation?: number
  startScale?: number

  onHover?: (isHovered: boolean) => void
  onClick?: (e: React.MouseEvent) => void
  _close?: () => void
}

export interface ProfilePosterHandle extends InteractibleComponentHandle {}

// Shared data hook between small and full components
const useProfilePosterData = (playerAddress?: BigNumberish) => {
  const { name, isBlocked } = usePlayer(playerAddress)
  const { isMyAccount } = useIsMyAccount(playerAddress)
  const isOnline = getPlayerOnlineStatus(playerAddress)
  const { isLinked, avatarUrl } = useDiscordSocialLink(playerAddress)

  return {
    name,
    isMyAccount,
    isOnline,
    isBlocked,
    isLinked,
    avatarUrl
  }
}

// Small version of the ProfilePoster
const ProfilePosterSmall = forwardRef<ProfilePosterHandle, ProfilePosterProps>((props, ref) => {
  const { aspectWidth, aspectHeight } = useGameAspect()
  const { name, isOnline, isBlocked, isLinked, avatarUrl } = useProfilePosterData(props.playerAddress)

  const baseRef = useRef<InteractibleComponentHandle>(null)

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
      width={aspectWidth(props.width || POSTER_WIDTH_SMALL)}
      height={aspectHeight(props.height || POSTER_HEIGHT_SMALL)}
      isLeft={false}
      isFlipped={true}
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
      mouseDisabled={!props.isSmall}
      onHover={props.onHover}
      onClick={props.onClick}
      ref={baseRef}
      childrenInFront={
        <div className='Poster'>
          <div className='WantedText Small'>WANTED</div>
          
          <div className='ProfileSection Small'>
            <ProfilePic 
              profilePic={isLinked ? undefined : 0} 
              profilePicUrl={isLinked ? avatarUrl : undefined} 
              width={9} 
              removeCorners 
              borderColor='#201a18' 
              borderWidth={0.3} 
            />
            <div className='PlayerName Small'>{name}</div>
          </div>

          {isBlocked && <div className='BlockedOverlay ProfileSmall Right' />}

          <div className={`OnlineStatusSection ${ props.width && props.width !== POSTER_WIDTH_SMALL ? 'Smaller' : 'Small'}`}>
            <div className={`OnlineStatus Small ${isOnline ? 'Online' : 'Offline'}`} />
          </div>
        </div>
      }
    />
  )
})

// Full version of the ProfilePoster
const ProfilePosterFull = forwardRef<ProfilePosterHandle, ProfilePosterProps>((props, ref) => {
  const { aspectWidth, aspectHeight } = useGameAspect()
  const { dispatchSetScene } = usePistolsScene()
  const { dispatchSelectDuelistId } = usePistolsContext()
  const { name, isMyAccount, isOnline, isBlocked, isLinked, avatarUrl } = useProfilePosterData(props.playerAddress)
  
  // Full-specific data
  const { duelistIds, isLoading } = useDuelistsOfOwner(props.playerAddress)
  const { isBookmarked } = useIsBookmarked(props.playerAddress)
  const { emit_player_bookmark, isDisabled: emitIsDisabled } = useExecuteEmitPlayerBookmark(props.playerAddress, 0, !isBookmarked)

  const baseRef = useRef<InteractibleComponentHandle>(null)
  const cardRefs = useRef<{ [key: number]: DuelistCardHandle }>({})

  const [pageNumber, setPageNumber] = useState(0)
  const [deferredLoading, setDeferredLoading] = useState(isLoading)

  const duelistsPerPage = 3
  const pageCount = useMemo(() => Math.ceil(duelistIds.length / duelistsPerPage), [duelistIds])
  const paginatedDuelistIds = useMemo(() => (
    duelistIds.slice(
      pageNumber * duelistsPerPage,
      (pageNumber + 1) * duelistsPerPage
    )
  ), [duelistIds, pageNumber])

  const handlePrev = () => {
    setPageNumber(prev => Math.max(0, prev - 1))
  }

  const handleNext = () => {
    setPageNumber(prev => Math.min(Math.max(0, pageCount - 1), prev + 1))
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setDeferredLoading(isLoading && duelistIds.length == 0)
    }, 300)
    
    return () => clearTimeout(timer)
  }, [isLoading, duelistIds])

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

  const renderDuelistCards = useMemo(() => {
    return [...Array(3)].map((_, i) => {
      const duelistId = paginatedDuelistIds[i]
      return (
        <div 
          key={duelistId ? duelistId.toString() : `empty-${i}`}
          style={{ width: `${aspectWidth(DUELIST_CARD_WIDTH * 0.7)}px`, height: `${aspectWidth(DUELIST_CARD_HEIGHT * 0.7)}px` }}
          onClick={duelistId ? () => dispatchSelectDuelistId(duelistId) : undefined}
        >
          {duelistId && (
            <DuelistCard
              ref={(ref: DuelistCardHandle | null) => {
                if (ref) cardRefs.current[Number(duelistId)] = ref
              }}
              duelistId={Number(duelistId)}
              isSmall={true}
              isLeft={true}
              isVisible={true}
              isFlipped={true}
              instantFlip={true}
              isHighlightable={true}
              width={DUELIST_CARD_WIDTH * 0.7}
              height={DUELIST_CARD_HEIGHT * 0.7}
              onClick={() => dispatchSelectDuelistId(duelistId)}
            />
          )}
        </div>
      )
    })
  }, [paginatedDuelistIds, aspectWidth, dispatchSelectDuelistId])

  return (
    <InteractibleComponent
      width={aspectWidth(props.width || POSTER_WIDTH_BIG)}
      height={aspectHeight(props.height || POSTER_HEIGHT_BIG)}
      isLeft={false}
      isFlipped={true}
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
          <div className='WantedText'>WANTED</div>
          
          <div className='ProfileSection'>
            <ProfilePic 
              profilePic={isLinked ? undefined : 0} 
              profilePicUrl={isLinked ? avatarUrl : undefined} 
              width={22} 
              height={22} 
              removeCorners 
              borderColor='#201a18' 
              borderWidth={0.4} 
            />
            <div className='PlayerName'>{name}</div>
            <div className='PlayerAddress'><Address address={props.playerAddress} /></div>
          </div>

          <div className='BookmarkSection'>
            <BookmarkIcon isBookmarked={isBookmarked} size='big' fitted disabled={emitIsDisabled} onClick={emit_player_bookmark} />
          </div>

          {isBlocked && <div className='BlockedOverlay ProfileLarge Right' />}

          <div className='OnlineStatusSection'>
            <div className={`OnlineStatus ${isOnline ? 'Online' : 'Offline'}`} />
          </div>

          <div className='TextDivider WantedDivider'>Duelists:</div>

          <div className='DuelistsSection' style={{ height: `${aspectWidth(DUELIST_CARD_HEIGHT * 0.7)}px` }}>
            <button 
              className='NavButton YesMouse' 
              onClick={handlePrev}
              disabled={pageNumber === 0}
            >←</button>
            {deferredLoading ? (
              <div className='DuelistCard'>Loading...</div>
            ) : duelistIds.length === 0 ? (
              <div className='DuelistCard'>No Duelists</div>
            ) : renderDuelistCards}
            <button 
              className='NavButton YesMouse'
              onClick={handleNext}
              disabled={pageNumber >= pageCount - 1}
            >→</button>
          </div>

          <div className='TextDivider WantedDivider'></div>

          <Grid className='ButtonSection YesMouse' textAlign='center'>
            <Row columns='equal'>
              <Col>
                <ActionButton large fillParent label='Close' onClick={props._close} />
              </Col>
              <Col>
                {isMyAccount ? <ActionButton large fillParent important label='Manage Profile' onClick={() => dispatchSetScene(SceneName.Profile)} />
                  : <ChallengeButton challengedPlayerAddress={props.playerAddress} fillParent={true} />
                }
              </Col>
            </Row>
          </Grid>
        </div>
      }
    />
  )
})

// Main wrapper component
export const ProfilePoster = forwardRef<ProfilePosterHandle, ProfilePosterProps>((props: ProfilePosterProps = {
  isSmall: true,
  isVisible: false,
  isHighlightable: false,
  instantVisible: false,
  width: null,
  height: null,
  startPosition: { x: 0, y: 0 },
  startRotation: 0,
  startScale: 1
}, ref: React.Ref<ProfilePosterHandle>) => {
  return props.isSmall ? (
    <ProfilePosterSmall {...props} ref={ref} />
  ) : (
    <ProfilePosterFull {...props} ref={ref} />
  )
})
