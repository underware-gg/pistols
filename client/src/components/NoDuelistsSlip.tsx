import React, { forwardRef, useImperativeHandle, useRef } from 'react'
import { useDuelistsOfPlayer } from '/src/hooks/useTokenDuelists'
import { InteractibleComponent, InteractibleComponentHandle, InteractibleComponentProps } from '/src/components/InteractibleComponent'
import { CardColor } from '@underware/pistols-sdk/pistols/constants'
import { useGameAspect } from '/src/hooks/useGameAspect'
import { useCanClaimStarterPack } from '/src/hooks/usePistolsContractCalls'


interface NoDuelistsSlipProps extends InteractibleComponentProps {}

export interface NoDuelistsSlipHandle extends InteractibleComponentHandle {}

export const NoDuelistsSlip = forwardRef<NoDuelistsSlipHandle, NoDuelistsSlipProps>((props: NoDuelistsSlipProps, ref: React.Ref<NoDuelistsSlipHandle>) => {
  const { aspectWidth, aspectHeight } = useGameAspect()

  const { duelistIds } = useDuelistsOfPlayer()
  const { canClaimStarterPack } = useCanClaimStarterPack(duelistIds.length)

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
  }));

  return (
    <InteractibleComponent
      width={aspectWidth(props.width)}
      height={aspectHeight(props.height)}
      isLeft={props.isLeft}
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
      mouseDisabled={false}
      onHover={props.onHover}
      onClick={props.onClick}
      ref={baseRef}
      childrenInFront={
        <div className='Poster'>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            width: '100%',
            height: '100%',
            textAlign: 'center',
            fontStyle: 'italic',
            color: '#3b2a23',
            fontWeight: 'bold',
            padding: aspectWidth(1),
          }}>
            {!canClaimStarterPack ? (
              <>
                <p style={{ fontSize: aspectWidth(1.4), marginTop: 0, marginBottom: aspectWidth(1) }}>Note to self:</p>
                <p style={{ fontSize: aspectWidth(1.2) }}>Should probably get a duelist first.. or two.</p>
                <p style={{ fontSize: aspectWidth(1), marginTop: aspectWidth(0.3) }}>Just a thought...</p>
              </>
            ) : (
              <>
                <p style={{ fontSize: aspectWidth(1.4), marginTop: 0, marginBottom: aspectWidth(1) }}>Urgent reminder:</p>
                <p style={{ fontSize: aspectWidth(1.2) }}>No duelists available. I should acquire some more...</p>
                <p style={{ fontSize: aspectWidth(1) }}>...preferably some with good aim.</p>
              </>
            )}
          </div>
        </div>
      }
    />
  )
})
