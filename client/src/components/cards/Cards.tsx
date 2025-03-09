import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { useGameAspect } from '/src/hooks/useGameAspect'
import { CardColor, CardData, FireCardsTextures } from '/src/data/cardAssets'
import { constants } from '@underware_gg/pistols-sdk/pistols/gen'
import * as TWEEN from '@tweenjs/tween.js'
import * as Constants from '/src/data/cardConstants'
import { InteractibleComponent, InteractibleComponentHandle, InteractibleComponentProps } from '/src/components/InteractibleComponent'

interface CardProps extends InteractibleComponentProps {
  isMiniature?: boolean
}

export interface CardHandle extends InteractibleComponentHandle {
  setCardData: (data: CardData) => void
}

export enum DuelistCardType {
  TACTICS,
  FIRE,
  DODGE,
  BLADE,
}

export const Card = forwardRef<CardHandle, CardProps>((props: CardProps, ref: React.Ref<CardHandle>) => {
  const { aspectWidth } = useGameAspect()

  const [cardData, setCardData] = useState<CardData>(FireCardsTextures.None)

  const baseRef = useRef<InteractibleComponentHandle>(null);

  // Expose the base component's functions to the outside via the forwarded ref
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
    
    setCardData
  }));

  const titleClass = useMemo(() => (cardData.titleShort?.length < 4 ? 'title-small' : ''), [cardData])

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
      hasCenteredOrigin={props.hasCenteredOrigin}
      onHover={props.onHover}
      onClick={props.onClick}
      frontImagePath={cardData.cardFrontPath}
      backgroundImagePath={"/textures/cards/card_back.png"}
      defaultHighlightColor={cardData.color}
      ref={baseRef}
      childrenBehindFront={
        <img className='card-image-drawing NoMouse NoDrag' src={cardData.path} alt="Card Background" />
      }
      childrenInFront={
        props.isMiniature ? (
          <div className="card-details-mini">
            <div className={`card-title-mini ${titleClass}`}>{cardData.titleShort ? cardData.titleShort : cardData.title}</div>
          </div>
        ) : (
          <div className="card-details">
            <div className="card-title">{cardData.title}</div>
            <div className="card-rarity">{cardData.rarity == constants.Rarity.None ? '   ' : cardData.rarity}</div>
            <div className="card-description" dangerouslySetInnerHTML={{ __html: cardData.description }} />
          </div>
        )
      }
    />
  )
})
