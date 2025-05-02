import React, { forwardRef, useImperativeHandle, useMemo, useRef } from 'react'
import { BigNumberish } from 'starknet'
import { useDuelist, useDuelistStack } from '/src/stores/duelistStore'
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
import { ProfileBadge } from '/src/components/account/ProfileDescription'
import { Grid, GridRow, GridColumn } from 'semantic-ui-react'
import { usePistolsContext } from '/src/hooks/PistolsContext'
import { ActionButton } from '/src/components/ui/Buttons'
import { ChallengeTableSelectedDuelist } from '/src/components/ChallengeTable'
import { DUELIST_CARD_WIDTH } from '/src/data/cardConstants'

interface DuelistCardProps extends InteractibleComponentProps {
  duelistId: number
  address?: BigNumberish
  isSmall?: boolean
  isAnimating?: boolean

  showBack?: boolean
  animateFlip?: (showBack: boolean) => void
}

export interface DuelistCardHandle extends InteractibleComponentHandle {
  duelistId: number
}

export const DuelistCard = forwardRef<DuelistCardHandle, DuelistCardProps>((props: DuelistCardProps, ref: React.Ref<DuelistCardHandle>) => {
  const { aspectWidth } = useGameAspect()
  const { dispatchSelectPlayerAddress } = usePistolsContext()
  
  const { nameAndId: name, profilePic, profileType, isInAction, status } = useDuelist(props.duelistId)
  const {isAlive} = useDuelistFameBalance(props.duelistId)

  // const { activeDuelistId, stackedDuelistIds, level } = useDuelistStack(props.duelistId)
  // console.log('DUELSIT STACK:', props.duelistId, level, activeDuelistId, stackedDuelistIds)

  const { owner } = useOwnerOfDuelist(props.duelistId)
  const { name: playerName } = usePlayer(isPositiveBigint(props.address) ? props.address : owner)
  
  const archetypeImage = useMemo(() => {
    let imageName = 'card_circular_' + (ArchetypeNames[status.archetype].toLowerCase() == 'undefined' ? 'honourable' : ArchetypeNames[status.archetype].toLowerCase())
    return '/textures/cards/' + imageName + '.png'
  }, [status])

  const winPercentage = useMemo(() => {
    if (!status.total_duels || status.total_duels === 0) return '0%'
    return `${((status.total_wins / status.total_duels) * 100).toFixed(1)}%`
  }, [status.total_duels, status.total_wins])

  const lossPercentage = useMemo(() => {
    if (!status.total_duels || status.total_duels === 0) return '0%'
    return `${(((status.total_losses + status.total_draws) / status.total_duels) * 100).toFixed(1)}%`
  }, [status.total_duels, status.total_losses, status.total_draws])

  const baseRef = useRef<InteractibleComponentHandle>(null);

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
    
    duelistId: props.duelistId
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
          <ProfilePic profileType={profileType} profilePic={profilePic} width={(props.width ?? DUELIST_CARD_WIDTH) * 0.7} disabled={!isAlive} removeBorder removeCorners removeShadow className='duelist-card-image-drawing'/>
          <img id='DuelistDeadOverlay' className={ `Left ${!isAlive ? 'visible' : ''}`} src='/textures/cards/card_disabled.png' />
        </>
      }
      childrenInFront={
        <>
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
            {isInAction &&
              <EmojiIcon emoji={EMOJIS.IN_ACTION} size={props.isSmall ? 'small' : 'big'} />
            }
            {!isAlive &&
              <EmojiIcon emoji={EMOJIS.DEAD} size={props.isSmall ? 'small' : 'big'} />
            }
          </div>
          <div className='HounourCircle'>
            <ProfileBadge duelistId={props.duelistId} />
          </div>
          <div className="duelist-card-details">
            {props.isSmall ? (
              <>
                <div className="duelist-fame">
                  <FameLivesDuelist duelistId={props.duelistId} />
                </div>
                <FameProgressBar duelistId={props.duelistId} width={props.width * 0.8} height={props.height * 0.1} hideValue />
                <div className="duelist-name small" data-contentlength={_nameLength(playerName)}>{playerName}</div>
              </>
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
                        <GridColumn textAlign='right' width={10}>{status.honour}/10</GridColumn>
                      </GridRow>
                      <GridRow>
                        <GridColumn className='Bold' textAlign='left' width={6}>Archetype:</GridColumn>
                        <GridColumn textAlign='right' width={10}>{ArchetypeNames[status.archetype]}</GridColumn>
                      </GridRow>
                    </Grid>
                  </GridColumn>
                  
                  <GridColumn>
                    <Grid className='NoMargin'>
                      <GridRow>
                        <GridColumn className='Bold' textAlign='left' width={6}>Duels:</GridColumn>
                        <GridColumn textAlign='right' width={10}>{status.total_duels}</GridColumn>
                      </GridRow>
                      <GridRow>
                        <GridColumn className='Bold' textAlign='left' width={6}>Wins:</GridColumn>
                        <GridColumn textAlign='right' width={10}>{status.total_wins} ({winPercentage})</GridColumn>
                      </GridRow>
                      <GridRow>
                        <GridColumn className='Bold' textAlign='left' width={6}>Losses:</GridColumn>
                        <GridColumn textAlign='right' width={10}>{status.total_losses + status.total_draws} ({lossPercentage})</GridColumn>
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