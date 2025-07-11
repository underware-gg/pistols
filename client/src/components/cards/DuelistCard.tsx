import React, { forwardRef, useImperativeHandle, useMemo, useRef, useState, useEffect } from 'react'
import { BigNumberish } from 'starknet'
import { useDuelist, useDuelistStack, useFetchDuelist } from '/src/stores/duelistStore'
import { useGameAspect } from '/src/hooks/useGameAspect'
import { useOwnerOfDuelist } from '/src/hooks/useTokenDuelists'
import { useDuelistFameBalance } from '/src/stores/coinStore'
import { usePlayer } from '/src/stores/playerStore'
import { isPositiveBigint } from '@underware/pistols-sdk/utils'
import { ArchetypeNames } from '/src/utils/pistols'
import { FameLivesDuelist, FameProgressBar } from '/src/components/account/LordsBalance'
import { ProfilePic } from '/src/components/account/ProfilePic'
import { EmojiIcon } from '/src/components/ui/Icons'
import { EMOJIS } from '@underware/pistols-sdk/pistols/constants'
import { InteractibleComponent, InteractibleComponentHandle, InteractibleComponentProps } from '/src/components/InteractibleComponent'
import { ProfileBadge } from '/src/components/account/ProfileDescriptor'
import { Grid, GridRow, GridColumn } from 'semantic-ui-react'
import { usePistolsContext } from '/src/hooks/PistolsContext'
import { ActionButton } from '/src/components/ui/Buttons'
import { ChallengeTableSelectedDuelist } from '/src/components/ChallengeTable'
import { DUELIST_CARD_WIDTH } from '/src/data/cardConstants'
import { emitter } from '/src/three/game'
import { useDuelistCurrentSeasonScore } from '/src/stores/scoreboardStore'

interface DuelistCardProps extends InteractibleComponentProps {
  duelistId: number
  address?: BigNumberish
  isSmall?: boolean
  overrideFame?: boolean
  fame?: bigint
  isAnimating?: boolean
  showQuote?: boolean
  hideSouls?: boolean
  shouldAnimateIncrease?: boolean

  showBack?: boolean
  animateFlip?: (showBack: boolean) => void
  showSouls?: (duelistId: number, stackedDuelistIds: number[]) => void
}

export interface DuelistCardHandle extends InteractibleComponentHandle {
  duelistId: number
  animateSoulsIncrease: () => void
}

export const DuelistCard = forwardRef<DuelistCardHandle, DuelistCardProps>((props: DuelistCardProps, ref: React.Ref<DuelistCardHandle>) => {
  const { aspectWidth } = useGameAspect()
  const { dispatchSelectPlayerAddress, dispatchSelectDuel } = usePistolsContext()
  
  useFetchDuelist(props.duelistId)
  const { nameAndId: name, profilePic, profileType, isInAction, totals, quote, currentDuelId } = useDuelist(props.duelistId)
  const { isAlive } = useDuelistFameBalance(props.duelistId)
  const { stackedDuelistIds, level } = useDuelistStack(props.duelistId)

  const { points, position } = useDuelistCurrentSeasonScore(props.duelistId)
  // console.log(`DUELIST SCORE:`, props.duelistId, position, points)

  // Animation states
  const [isAnimatingSouls, setIsAnimatingSouls] = useState(false)
  const [displayLevel, setDisplayLevel] = useState(props.shouldAnimateIncrease ? (level - 1) || 0 : level || 0)
  const [soulsAnimationClass, setSoulsAnimationClass] = useState('')
  const [numberAnimationClass, setNumberAnimationClass] = useState('')
  const [newBadgeAnimationClass, setNewBadgeAnimationClass] = useState('')
  
  // Fixed useEffect to ensure displayLevel stays at incremented value after animation
  useEffect(() => {
    if (!isAnimatingSouls) {
      setDisplayLevel(props.shouldAnimateIncrease && !isAnimatingSouls ? (level - 1) || 0 : level || 0)
    }
  }, [level, isAnimatingSouls, props.shouldAnimateIncrease])

  // Don't show souls for dead duelists
  const showSouls = useMemo(() => !props.hideSouls && isAlive, [props.hideSouls, isAlive])

  // Show NEW badge ONLY when level is 0 or 1 AND shouldAnimateIncrease is true
  const isNewDuelist = props.shouldAnimateIncrease && (level === 0 || level === 1)

  // Added a flag to track when animation is complete
  const [animationCompleted, setAnimationCompleted] = useState(false)
  useEffect(() => {
    if (animationCompleted) {
      setDisplayLevel(level || 0)
      setAnimationCompleted(false)
    }
  }, [animationCompleted, level])

  const { owner } = useOwnerOfDuelist(props.duelistId)
  const { name: playerName } = usePlayer(isPositiveBigint(props.address) ? props.address : owner)
  
  const archetypeImage = useMemo(() => {
    let imageName = 'card_circular_' + (ArchetypeNames[totals.archetype].toLowerCase() == 'undefined' || ArchetypeNames[totals.archetype].toLowerCase() == 'neutral' ? 'neutral' : ArchetypeNames[totals.archetype].toLowerCase())
    return '/textures/cards/' + imageName + '.png'
  }, [totals])

  

  const winPercentage = useMemo(() => {
    if (!totals.total_duels || totals.total_duels === 0) return '0%'
    return `${((totals.total_wins / totals.total_duels) * 100).toFixed(1)}%`
  }, [totals.total_duels, totals.total_wins])

  const lossPercentage = useMemo(() => {
    if (!totals.total_duels || totals.total_duels === 0) return '0%'
    return `${(((totals.total_losses + totals.total_draws) / totals.total_duels) * 100).toFixed(1)}%`
  }, [totals.total_duels, totals.total_losses, totals.total_draws])

  const baseRef = useRef<InteractibleComponentHandle>(null);

  const animateSoulsIncrease = () => {
    if (isAnimatingSouls) return
    
    setIsAnimatingSouls(true)
    
    if (isNewDuelist) {
      // Special NEW badge animation
      setNewBadgeAnimationClass('new-badge-pop')
      
      // After animation, reset
      setTimeout(() => {
        setIsAnimatingSouls(false)
        setNewBadgeAnimationClass('')
        // Mark animation as completed so we can set final level
        setAnimationCompleted(true)
      }, 800)
    } else {
      // Regular souls animation for higher levels
      setSoulsAnimationClass('souls-increasing')
      
      // Scale up the soul emblem first - more concise timing for better sync
      setTimeout(() => {
        // Apply the number scale-out animation
        setNumberAnimationClass('number-scale-out')
        
        // Shorter delay to increment for better sync
        setTimeout(() => {
          // Increment the number while it's scaled down
          setDisplayLevel(prevLevel => prevLevel + 1)
          
          // Quicker transition to slam for better flow
          setTimeout(() => {
            setSoulsAnimationClass('souls-impact')
            setNumberAnimationClass('number-slam')
            
            // After impact, play final pulse with shorter delay
            setTimeout(() => {
              setSoulsAnimationClass('souls-final-pulse')
              setNumberAnimationClass('number-settle')
              
              // Reset animation state - longer settle time for satisfaction
              setTimeout(() => {
                setIsAnimatingSouls(false)
                setSoulsAnimationClass('')
                setNumberAnimationClass('')
                // Mark animation as completed so we can set final level
                setAnimationCompleted(true)
              }, 800)
            }, 200)
          }, 80)
        }, 300)
      }, 200)
    }
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
    
    duelistId: props.duelistId,
    animateSoulsIncrease,
  }));

  const _nameLength = (name: string) => {
    return name ? Math.floor(name.length / 10) : 31
  }

  //Just works this way, ask @mataleone why hahaha - stolen from duelist.tsx
  const SVG_WIDTH = 771;
  const SVG_HEIGHT = 1080;

  return (
    <InteractibleComponent
      width={aspectWidth(props.width)}
      height={aspectWidth(props.height)}
      isLeft={props.isLeft}
      isFlipped={props.isFlipped}
      isVisible={props.isVisible}
      isSelected={props.isSelected}
      isDisabled={props.isDisabled}
      isDraggable={props.isDraggable}
      isHighlightable={props.isHighlightable}
      isHanging={props.isHanging}
      isHangingLeft={props.isHangingLeft}
      shouldSwing={props.shouldSwing}
      instantFlip={props.instantFlip}
      instantVisible={props.instantVisible}
      hasBorder={true}
      mouseDisabled={!props.isSmall}
      hasCenteredOrigin={props.hasCenteredOrigin}
      onHover={props.onHover}
      onClick={props.onClick}
      frontImagePath={archetypeImage}
      backgroundImagePath={"/textures/cards/card_back.png"}
      defaultHighlightColor={props.defaultHighlightColor}
      startPosition={props.startPosition}
      startRotation={props.startRotation}
      startScale={props.startScale}
      ref={baseRef}
      childrenBehindFront={
        <>
          <div 
            className='duelist-card-image-drawing YesMouse NoDrag'
            style={{ 
              position: 'absolute',
              cursor: quote ? 'cursor' : 'default'
            }}
            onMouseEnter={() => !props.isSmall && quote && emitter.emit('hover_description', quote)}
            onMouseLeave={() => !props.isSmall && emitter.emit('hover_description', null)}
          >
            <ProfilePic 
              profileType={profileType} 
              profilePic={profilePic} 
              width={(props.width ?? DUELIST_CARD_WIDTH) * 0.7} 
              disabled={!isAlive} 
              removeBorder 
              removeCorners 
              removeShadow 
            />
          </div>
          <img id='DuelistDeadOverlay' className={ `Left ${!isAlive ? 'visible' : ''}`} src='/textures/cards/card_disabled.png' />
        </>
      }
      childrenInFront={
        <>
          {showSouls && (
            isNewDuelist ? (
              <div 
                className={`duelist-new-badge YesMouse ${newBadgeAnimationClass}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  transform: 'translate(-30%, -30%) rotate(-40deg)',
                  zIndex: 10,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  cursor: !props.isSmall ? 'pointer' : 'default',
                }}
                onMouseEnter={() => !props.isSmall && emitter.emit('hover_description', 'This is a new duelist!')}
                onMouseLeave={() => !props.isSmall && emitter.emit('hover_description', null)}
                onClick={() => {
                  if (!props.isSmall) {
                    if (props.showSouls && stackedDuelistIds.length > 0) {
                      props.showSouls(props.duelistId, stackedDuelistIds);
                    }
                  }
                }}
              >
                <span style={{
                  fontWeight: '900',
                  fontSize: aspectWidth(props.width * 0.12),
                  color: '#ffd700',
                  textShadow: '0 0 5px #ffd700, -2px -2px 0 #421, 2px -2px 0 #421, -2px 2px 0 #421, 2px 2px 0 #421',
                  fontFamily: 'Garamond',
                  letterSpacing: '0.5px',
                  WebkitTextStroke: '1.5px #421',
                  animation: 'new-text-pulse 2s ease-in-out infinite'
                }}>
                  NEW
                </span>
              </div>
            ) : (
              <div 
                className={`duelist-card-top-right YesMouse ${soulsAnimationClass}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  transform: 'translate(-30%, -35%)',
                  zIndex: 10,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: aspectWidth(props.width * 0.25),
                  height: aspectWidth(props.width * 0.25),
                  backgroundImage: 'url("/images/ui/card_souls.png")',
                  backgroundSize: 'contain',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                  filter: isAnimatingSouls 
                    ? 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.9)) brightness(1.3)' 
                    : 'drop-shadow(0 0 5px rgba(255, 215, 0, 0.7))',
                  textShadow: '0px 0px 2px #000, 0px 0px 4px #000',
                  cursor: !props.isSmall ? 'pointer' : 'default',
                  transition: 'filter 0.3s ease, transform 0.5s ease'
                }}
                onMouseEnter={() => !props.isSmall && emitter.emit('hover_description', 'Souls bound to this duelist. Click to see them.')}
                onMouseLeave={() => !props.isSmall && emitter.emit('hover_description', null)}
                onClick={() => {
                  if (!props.isSmall) {
                    if (props.showSouls && stackedDuelistIds.length > 0) {
                      props.showSouls(props.duelistId, stackedDuelistIds);
                    }
                  }
                }}
              >
                <span className={numberAnimationClass} style={{
                  fontWeight: 'bold',
                  fontSize: aspectWidth(props.width * 0.1),
                  color: 'white',
                  textShadow: isAnimatingSouls 
                    ? '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 0 10px #ffd700'
                    : '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
                  fontFamily: 'Garamond',
                  position: 'relative',
                  top: aspectWidth(props.width * 0.02),
                  display: 'inline-block',
                  transformOrigin: 'center center',
                  transition: 'text-shadow 0.3s ease, color 0.3s ease',
                }}>
                  {displayLevel}
                </span>

                {/* Impact shockwave effect for when number lands */}
                {isAnimatingSouls && soulsAnimationClass === 'souls-impact' && (
                  <div className="shockwave-container" style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none'
                  }}>
                    <div className="shockwave" />
                  </div>
                )}

                {/* Soul particles during animation */}
                {isAnimatingSouls && (
                  <div className="soul-particles" style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none'
                  }}>
                    {[...Array(12)].map((_, i) => (
                      <div key={i} className="soul-particle" style={{
                        position: 'absolute',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#ffd700',
                        opacity: 0,
                        animation: `soul-particle-${i % 8} 1.2s ease-out forwards`,
                        animationDelay: `${i * 0.1}s`,
                        boxShadow: '0 0 5px #ffd700, 0 0 10px #ffd700'
                      }} />
                    ))}
                  </div>
                )}
              </div>
            )
          )}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            preserveAspectRatio="xMinYMin meet"
          >
            <style>
              {`
                text{
                  fill:#200;
                  text-shadow:0.05rem 0.05rem 2px #2008;
                  font-size:28px;
                  font-family:Garamond;
                  dominant-baseline:middle;
                  text-anchor:middle;
                  -webkit-user-select:none;
                  -moz-user-select:none;
                  -ms-user-select:none;
                  user-select:none;
                }
                .DuelistNameSVG{
                  font-weight:bold;
                  font-variant-caps:small-caps;
                }
              `}
            </style>
            <path id="circle" d={`M${92},350a200,200 0 1,1 ${SVG_WIDTH - 184},0`} fill="none" stroke="none" />
            <text 
              className="DuelistNameSVG" 
              style={{
                fontSize: `${Math.min(60, 460 / (name.length * 0.5))}px`
              }}
            >
              <textPath startOffset="50%" xlinkHref="#circle">
                {name}
              </textPath>
            </text>
          </svg>

          {/* <DuelistTokenArt duelistId={props.duelistId} className='Absolute' /> */}
          <div className='InDuelEmoji'>
            {isInAction && (
              <div 
                className="YesMouse"
                onClick={() => {
                  if (currentDuelId && currentDuelId > 0n) {
                    dispatchSelectDuel(currentDuelId);
                    setTimeout(() => {
                      !props.isSmall && emitter.emit('hover_description', null)
                    }, 100);
                  }
                }}
                onMouseEnter={() => !props.isSmall && emitter.emit('hover_description', 'Click to view active duel')}
                onMouseLeave={() => !props.isSmall && emitter.emit('hover_description', null)}
                style={{ cursor: 'pointer' }}
              >
                <EmojiIcon 
                  emoji={EMOJIS.IN_ACTION} 
                  size={props.isSmall ? 'small' : 'big'} 
                />
              </div>
            )}
            {!isAlive &&
              <EmojiIcon emoji={EMOJIS.DEAD} size={props.isSmall ? 'small' : 'big'} />
            }
          </div>
          <div className='HounourCircle'>
            <ProfileBadge duelistId={props.duelistId} />
          </div>
          <div className="duelist-card-details">
            {props.isSmall ? (
              props.showQuote ? (
                <div className="duelist-quote" style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  height: '100%',
                  padding: '0.5rem',
                  fontSize: aspectWidth(1),
                  lineHeight: '1.2',
                  overflow: 'hidden',
                  fontStyle: 'italic',
                  color: '#200'
                }}>
                  {quote}
                </div>
              ) : (
                <>
                <div className="duelist-fame">
                  <FameLivesDuelist duelistId={props.duelistId} overrideFame={props.overrideFame} fame={props.fame} />
                </div>
                <FameProgressBar duelistId={props.duelistId} width={props.width * 0.8} height={props.height * 0.1} hideValue overrideFame={props.overrideFame} fame={props.fame} />
                <div className="duelist-name small" data-contentlength={_nameLength(playerName)}>{playerName}</div>
                </>
              )
            ) : (
              <>
                <div className="duelist-fame">
                  <FameLivesDuelist duelistId={props.duelistId} size='huge' />
                </div>
                <FameProgressBar duelistId={props.duelistId} width={props.width * 0.8} />
                
                <div className="TextDivider CardDivider">Stats</div>
                
                <Grid className='NoMargin' columns={2} divided style={{ width: '96%' }}>
                  <GridColumn>
                    <Grid className='NoMargin'>
                      <GridRow>
                        <GridColumn className='Bold' textAlign='left' width={5}>Owner:</GridColumn>
                        <GridColumn className="Anchor Black" textAlign='right' width={11} onClick={() => {
                          dispatchSelectPlayerAddress(owner)
                        }}>{playerName}</GridColumn>
                      </GridRow>
                      <GridRow>
                        <GridColumn className='Bold' textAlign='left' width={6}>Honour:</GridColumn>
                        <GridColumn textAlign='right' width={10}>{totals.honour}/10</GridColumn>
                      </GridRow>
                      <GridRow>
                        <GridColumn className='Bold' textAlign='left' width={6}>Archetype:</GridColumn>
                        <GridColumn textAlign='right' width={10}>{ArchetypeNames[totals.archetype]}</GridColumn>
                      </GridRow>
                    </Grid>
                  </GridColumn>
                  
                  <GridColumn>
                    <Grid className='NoMargin'>
                      <GridRow>
                        <GridColumn className='Bold' textAlign='left' width={6}>Duels:</GridColumn>
                        <GridColumn textAlign='right' width={10}>{totals.total_duels}</GridColumn>
                      </GridRow>
                      <GridRow>
                        <GridColumn className='Bold' textAlign='left' width={6}>Wins:</GridColumn>
                        <GridColumn textAlign='right' width={10}>{totals.total_wins} ({winPercentage})</GridColumn>
                      </GridRow>
                      <GridRow>
                        <GridColumn className='Bold' textAlign='left' width={6}>Losses:</GridColumn>
                        <GridColumn textAlign='right' width={10}>{totals.total_losses + totals.total_draws} ({lossPercentage})</GridColumn>
                      </GridRow>
                    </Grid>
                  </GridColumn>
                </Grid>
                <div className={`duels-button-container padded ${props.isAnimating ? '' : 'visible'}`}>
                  <ActionButton 
                    className='NoMargin YesMouse' 
                    large 
                    fillParent 
                    important
                    label='Show Duels'
                    onClick={() => {
                      props.animateFlip(true)
                    }} 
                  />
                </div>
              </>
            )}
          </div>
        </>
      }
      childrenInBack={(props.showBack || props.isAnimating) && (
        !props.isSmall ? (
          <>
            <div className={`duels-button-container ${props.isAnimating ? '' : 'visible'}`}>
              <ActionButton 
                className='NoMargin YesMouse' 
                large 
                fillParent 
                important={false}
                label='Hide Duels'
                onClick={() => {
                  props.animateFlip(false)
                }} 
              />
            </div>
            <div className="duelist-card-overlay YesMouse">
              <ChallengeTableSelectedDuelist compact />
            </div>
          </>
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(59, 42, 35, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: aspectWidth(6),
            color: '#ffd700',
            borderRadius: aspectWidth(0.5),
            border: '2px dashed rgba(255, 215, 0, 0.6)',
            boxShadow: '0 0 20px rgba(255, 215, 0, 0.3), inset 0 0 30px rgba(0,0,0,0.5)',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              width: '200%',
              height: '200%',
              background: 'radial-gradient(circle, rgba(255,215,0,0.05) 0%, transparent 70%)',
            }}/>
            ?
          </div>
        )
      )}
    />
  )
})