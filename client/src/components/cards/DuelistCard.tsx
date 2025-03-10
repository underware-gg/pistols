import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { BigNumberish } from 'starknet'
import { useDuelist } from '/src/stores/duelistStore'
import { useGameAspect } from '/src/hooks/useGameAspect'
import { useOwnerOfDuelist } from '/src/hooks/useTokenDuelists'
import { usePlayer } from '/src/stores/playerStore'
import { isPositiveBigint } from '@underware_gg/pistols-sdk/utils'
import { ArchetypeNames } from '/src/utils/pistols'
import { FameBalanceDuelist, FameProgressBar } from '/src/components/account/LordsBalance'
import { ProfilePic } from '/src/components/account/ProfilePic'
import { EmojiIcon } from '/src/components/ui/Icons'
import { EMOJI } from '/src/data/messages'
import { InteractibleComponent, InteractibleComponentHandle, InteractibleComponentProps } from '/src/components/InteractibleComponent'
import { ProfileBadge } from '/src/components/account/ProfileDescription'
import { Grid, GridRow, GridColumn } from 'semantic-ui-react'
import { usePistolsContext } from '/src/hooks/PistolsContext'
import { ActionButton, ChallengeButton } from '/src/components/ui/Buttons'
import { ChallengeTableSelectedDuelist } from '/src/components/ChallengeTable'
import { useIsYou } from '/src/hooks/useIsYou'
import { useFameBalanceDuelist } from '/src/hooks/useFame'
import { constants } from '@underware_gg/pistols-sdk/pistols/gen'

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
  
  const { name, profilePic, profileType, score, isInAction,  } = useDuelist(props.duelistId)
  const { balance } = useFameBalanceDuelist(props.duelistId)
  const { owner } = useOwnerOfDuelist(props.duelistId)
  const { name: playerName } = usePlayer(isPositiveBigint(props.address) ? props.address : owner)
  const { isYou } = useIsYou(props.duelistId)

  const isDead = useMemo(() => (balance < constants.FAME.ONE_LIFE), [balance])
  
  const archetypeImage = useMemo(() => {
    let imageName = 'card_circular_' + (ArchetypeNames[score.archetype].toLowerCase() == 'undefined' ? 'honourable' : ArchetypeNames[score.archetype].toLowerCase())
    return '/textures/cards/' + imageName + '.png'
  }, [score])

  const winPercentage = useMemo(() => {
    if (!score.total_duels || score.total_duels === 0) return '0%'
    return `${((score.total_wins / score.total_duels) * 100).toFixed(1)}%`
  }, [score.total_duels, score.total_wins])

  const lossPercentage = useMemo(() => {
    if (!score.total_duels || score.total_duels === 0) return '0%'
    return `${(((score.total_losses + score.total_draws) / score.total_duels) * 100).toFixed(1)}%`
  }, [score.total_duels, score.total_losses, score.total_draws])

  const baseRef = useRef<InteractibleComponentHandle>(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: true });
    
    const dpr = Math.max(window.devicePixelRatio || 1, 2);
    const logicalWidth = aspectWidth(props.width);
    const logicalHeight = aspectWidth(props.height * 0.2);
    
    canvas.width = logicalWidth * dpr;
    canvas.height = logicalHeight * dpr;
    
    canvas.style.width = `${logicalWidth}px`;
    canvas.style.height = `${logicalHeight}px`;
    
    ctx.scale(dpr, dpr);
    
    const text = name.toUpperCase();
    const color = "#201a18";
    const fontFamily = "EB Garamond";
    const radius = aspectWidth(props.width * 0.4);
    const rotation = -Math.PI / 2;
    const arcExtent = 1.35;
    const desiredLetterSpacing = aspectWidth(props.width * 0.008);
    
    let fontSize = aspectWidth(props.width * 0.08);
    let letterSpacing = desiredLetterSpacing;
    
    const arcLength = radius * arcExtent;
    
    ctx.font = `1000 ${fontSize}px ${fontFamily}`;
    const mWidth = ctx.measureText('M').width;
    const iWidth = ctx.measureText('I').width;
    const spaceWidth = (mWidth + iWidth) / 2;
    
    const totalTextWidth = (spaceWidth * text.length) + 
                          (desiredLetterSpacing * (text.length - 1));
    
    if (totalTextWidth > arcLength) {
      const scale = arcLength / totalTextWidth;
      fontSize *= scale;
      letterSpacing *= scale;
      ctx.font = `1000 ${fontSize}px ${fontFamily}`;
    }
    
    const finalMWidth = ctx.measureText('M').width;
    const finalIWidth = ctx.measureText('I').width;
    const finalSpaceWidth = (finalMWidth + finalIWidth) / 2;
    const finalTotalWidth = (finalSpaceWidth * text.length) + 
                           (letterSpacing * (text.length - 1));
    
    const startAngle = rotation - (arcExtent / 2);
    const textStartAngle = startAngle + ((arcExtent - (finalTotalWidth / radius)) / 2) + 0.04;
    
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    ctx.lineWidth = aspectWidth(0.02);
    ctx.strokeStyle = color;
    
    ctx.save();
    ctx.translate(logicalWidth / 2 - Math.cos(rotation) * radius, logicalHeight / 2 - Math.sin(rotation) * radius - logicalHeight * 0.25);
    
    let currentAngle = textStartAngle;
    for (let i = 0; i < text.length; i++) {
      const x = Math.cos(currentAngle) * radius;
      const y = Math.sin(currentAngle) * radius;
      
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(currentAngle + Math.PI / 2);
      ctx.strokeText(text[i], 0, 0);
      ctx.fillText(text[i], 0, 0);
      ctx.restore();
      
      currentAngle += (finalSpaceWidth + letterSpacing) / radius;
    }
    
    ctx.restore();
  }, [aspectWidth, props.width, props.height, name]);

  

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
          <ProfilePic profileType={profileType} profilePic={profilePic} width={props.width * 0.7} disabled={isDead} removeBorder removeCorners removeShadow className='duelist-card-image-drawing'/>
          <img id='DuelistDeadOverlay' className={ `Left ${isDead ? 'visible' : ''}`} src='/textures/cards/card_disabled.png' />
        </>
      }
      childrenInFront={
        <>
          <canvas ref={canvasRef} />
          <div className='InDuelEmoji'>
            {isInAction &&
              <EmojiIcon emoji={EMOJI.IN_ACTION} size={props.isSmall ? 'small' : 'big'} />
            }
            {isDead &&
              <EmojiIcon emoji={EMOJI.DEAD} size={props.isSmall ? 'small' : 'big'} />
            }
          </div>
          <div className='HounourCircle'>
            <ProfileBadge duelistId={props.duelistId} />
          </div>
          <div className="duelist-card-details">
            {props.isSmall ? (
              <>
                <div className="duelist-fame">
                  <FameBalanceDuelist duelistId={props.duelistId} />
                </div>
                <FameProgressBar duelistId={props.duelistId} width={props.width * 0.8} height={props.height * 0.1} hideValue />
                <div className="duelist-name small" data-contentlength={_nameLength(playerName)}>{playerName}</div>
              </>
            ) : (
              <>
                <div className="duelist-fame">
                  <FameBalanceDuelist duelistId={props.duelistId} size='huge' />
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
                        <GridColumn textAlign='right' width={10}>{score.honour}/10</GridColumn>
                      </GridRow>
                      <GridRow>
                        <GridColumn className='Bold' textAlign='left' width={6}>Archetype:</GridColumn>
                        <GridColumn textAlign='right' width={10}>{ArchetypeNames[score.archetype]}</GridColumn>
                      </GridRow>
                    </Grid>
                  </GridColumn>
                  
                  <GridColumn>
                    <Grid className='NoMargin'>
                      <GridRow>
                        <GridColumn className='Bold' textAlign='left' width={6}>Duels:</GridColumn>
                        <GridColumn textAlign='right' width={10}>{score.total_duels}</GridColumn>
                      </GridRow>
                      <GridRow>
                        <GridColumn className='Bold' textAlign='left' width={6}>Wins:</GridColumn>
                        <GridColumn textAlign='right' width={10}>{score.total_wins} ({winPercentage})</GridColumn>
                      </GridRow>
                      <GridRow>
                        <GridColumn className='Bold' textAlign='left' width={6}>Losses:</GridColumn>
                        <GridColumn textAlign='right' width={10}>{score.total_losses + score.total_draws} ({lossPercentage})</GridColumn>
                      </GridRow>
                    </Grid>
                  </GridColumn>
                </Grid>
                <div className={`duels-button-container ${isYou ? 'single' : 'double'} ${props.isAnimating ? '' : 'visible'}`}>
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
                  {!isYou && !isDead &&
                  <div className='YesMouse NoDrag'>
                    <ChallengeButton challengedPlayerAddress={owner} />
                  </div>
                  }
                </div>
              </>
            )}
          </div>
        </>
      }
      childrenInBack={(props.showBack || props.isAnimating) &&
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
      }
    />
  )
})