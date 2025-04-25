import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Grid, Segment, Divider } from 'semantic-ui-react'
import { useGameplayContext } from '/src/hooks/GameplayContext'
import { useGetChallenge } from '/src/stores/challengeStore'
import { AnimationState } from '/src/three/game'
import { useChallengeDescription } from '/src/hooks/useChallengeDescription'
import { useGameAspect } from '/src/hooks/useGameAspect'
import { ActionButton, ChallengeButton } from '../Buttons'
import { SceneName } from '/src/data/assets'
import { usePistolsContext, usePistolsScene } from '/src/hooks/PistolsContext'
import { DuelTutorialLevel } from '/src/data/tutorialConstants'
import { SettingsActions, useSettings } from '/src/hooks/SettingsContext'
import { useGetChallengeRewards } from '/src/hooks/useChallengeRewards'
import { usePlayer } from '/src/stores/playerStore'
import { Balance } from '../../account/Balance'
import AnimatedText from '../AnimatedText'
import { useIsMyAccount } from '/src/hooks/useIsYou'
import { makeDuelTweetUrl } from '/src/utils/pistols'

const Row = Grid.Row
const Col = Grid.Column

export default function DuelStateDisplay({ duelId }: { duelId: bigint }) {
  const { aspectWidth, aspectHeight } = useGameAspect()

  const { animated } = useGameplayContext()

  const { dispatchSetting } = useSettings()
  const { dispatchSetScene, dispatchSceneBack } = usePistolsScene()
  const { dispatchSetTutorialLevel } = usePistolsContext()

  const { challengeDescription } = useChallengeDescription(duelId)
  const { isFinished, isTutorial, tutorialLevel, duelistIdA, duelistIdB, winnerDuelistId, duelistAddressA, duelistAddressB, isCanceled, isExpired, quote, premise, livesStaked } = useGetChallenge(duelId)

  const { name: playerNameA } = usePlayer(duelistAddressA)
  const { name: playerNameB } = usePlayer(duelistAddressB)

  const { isMyAccount: isYouA } = useIsMyAccount(duelistAddressA)
  const { isMyAccount: isYouB } = useIsMyAccount(duelistAddressB)
  const rewardsA = useGetChallengeRewards(isFinished ? duelId : 0n, duelistIdA)
  const rewardsB = useGetChallengeRewards(isFinished ? duelId : 0n, duelistIdB)

  // Determine if we need to swap the display (if player B is the current user)
  const shouldSwap = isYouB
  
  // Define the actual display order based on whether we should swap
  const leftPlayerName = shouldSwap ? playerNameB : playerNameA
  const rightPlayerName = shouldSwap ? playerNameA : playerNameB
  const leftDuelistId = shouldSwap ? duelistIdB : duelistIdA
  const rightDuelistId = shouldSwap ? duelistIdA : duelistIdB
  const leftRewards = shouldSwap ? rewardsB : rewardsA
  const rightRewards = shouldSwap ? rewardsA : rewardsB
  const isLeftMe = shouldSwap ? isYouB : isYouA
  const isRightMe = shouldSwap ? isYouA : isYouB

  const winnerIsLeft = useMemo(() => (winnerDuelistId == leftDuelistId), [winnerDuelistId, leftDuelistId])
  const winnerIsRight = useMemo(() => (winnerDuelistId == rightDuelistId), [winnerDuelistId, rightDuelistId])

  const [animatedText, setAnimatedText] = useState("")
  const [showOutcome, setShowOutcome] = useState(false)
  const [showRewards, setShowRewards] = useState(false)
  const [showDisplay, setShowDisplay] = useState(false)
  const animationSequenceStarted = useRef(false)

  // Text to display based on duel state
  const statusText = useMemo(() => {
    if (isCanceled) return "Duel was canceled"
    if (isExpired) return "Duel has expired"
    return challengeDescription
  }, [challengeDescription, isCanceled, isExpired])

  const handleContinue = useCallback(() => {
    if (tutorialLevel === 1) {
      dispatchSetting(SettingsActions.TUTORIAL_LEVEL, 1)
      dispatchSetScene(SceneName.TutorialScene3)
      dispatchSetTutorialLevel(DuelTutorialLevel.NONE)
    } else {
      dispatchSetting(SettingsActions.TUTORIAL_LEVEL, 2)
      dispatchSetScene(SceneName.TutorialScene4)
      dispatchSetTutorialLevel(DuelTutorialLevel.NONE)
    }
  }, [tutorialLevel, dispatchSetTutorialLevel, dispatchSetScene, dispatchSetting])

  // Reset animation states when duel state changes
  useEffect(() => {
    const callFinished = () => {
      if (animationSequenceStarted.current) return;
      animationSequenceStarted.current = true;

      setTimeout(() => {
        setShowDisplay(true);
        setTimeout(() => {
          setAnimatedText(statusText);
        }, 500);
      }, 300);
    }
    
    if (isCanceled || isExpired) {
      callFinished()
    } else if (animated !== AnimationState.Finished) {
      setAnimatedText("")
      setShowOutcome(false)
      setShowRewards(false)
      setShowDisplay(false)
      animationSequenceStarted.current = false;
    } else if (!isTutorial && (isFinished || isCanceled || isExpired)) {
      callFinished()
    }
  }, [animated, isTutorial, isFinished, isCanceled, isExpired, statusText]);

  const RewardRow = ({ show, delay, children, animation = 'fadeIn' }) => {
    const baseStyle = {
      width: '60%',
      margin: '0 auto',
      minHeight: aspectHeight(2)
    }
    
    return show ? (
      <div 
        className={animation} 
        style={{
          ...baseStyle,
          animationDelay: `${delay}s`
        }}
      >
        {children}
      </div>
    ) : (
      <div style={{
        ...baseStyle,
        visibility: 'hidden'
      }}>
        {children}
      </div>
    )
  }

  return (
    <>
      {(!isTutorial && (isFinished || isCanceled || isExpired) && showDisplay) &&
        <div className='NoMouse NoDrag' style={{ 
          position: 'absolute', 
          left: 0, 
          width: '100%', 
          height: '100%',
          background: 'radial-gradient(ellipse at center, rgba(89, 44, 12, 0.8) 0%, rgba(10, 5, 1, 0.8) 70%, rgba(0, 0, 0, 0.7) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0,
          animation: 'fadeIn 0.5s ease-in forwards'
        }}>
          <div style={{
            display: 'inline-flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: aspectWidth(1),
            width: aspectWidth(42),
            marginTop: '-10%',
          }}>
            <h2 className='Important Relative' style={{ 
              fontSize: aspectWidth(2.5),
              textAlign: 'center',
              marginBottom: aspectHeight(1),
              margin: '0 auto',
              width: '100%',
            }}>
              <AnimatedText
                text={animatedText}
                slideDirection='top'
                delayPerCharacter={20}
                onAnimationComplete={() => {
                  // Don't show outcome for canceled/expired duels
                  if (!isCanceled && !isExpired) {
                    setTimeout(() => setShowOutcome(true), 300);
                  } else {
                    // Skip directly to the end for canceled/expired duels
                    setTimeout(() => setShowRewards(true), 300);
                  }
                }}
              />
            </h2>

            {(!isCanceled && !isExpired) && (
              <>
                <div className={`TextDivider DuelDivider bright ${showOutcome ? 'DividerAnimation' : ''}`} ></div>

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginBottom: aspectHeight(2),
                  fontSize: aspectWidth(1.6),
                  height: aspectHeight(4),
                  width: '100%',
                }}>
                  <div style={{ flex: 5, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <AnimatedText
                      text={showOutcome ? leftPlayerName : ''}
                      delayPerCharacter={50}
                      style={{color: isLeftMe ? '#00ff00' : '#ff4444'}}
                    />
                  </div>
                  <div style={{ flex: 2, textAlign: 'center' }}>
                    <AnimatedText
                      text={showOutcome ? 'VS' : ''}
                      delayPerCharacter={0}
                      slideDirection='top' 
                      style={{fontSize: aspectWidth(2)}}
                    />
                  </div>
                  <div style={{ flex: 5, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <AnimatedText
                      text={showOutcome ? rightPlayerName : ''}
                      delayPerCharacter={50}
                      reverse
                      style={{color: isRightMe ? '#00ff00' : '#ff4444'}}
                      onAnimationComplete={() => {
                        // Ensure we only trigger this once
                        if (!showRewards) {
                          setTimeout(() => setShowRewards(true), 300);
                        }
                      }}
                    />
                  </div>
                </div>
              </>
            )}

            {(!isCanceled && !isExpired) && (
              <Grid style={{width: '100%', height: aspectHeight(25)}}>
                <Row>
                  <Col width={7} textAlign='center'>
                    <RewardRow show={showRewards} delay={0} animation='slideInFromTop'>
                      <div className={winnerIsLeft ? 'H3 Important' : 'H3 Negative'} style={{
                        fontSize: aspectWidth(2),
                        color: winnerIsLeft ? '#FFD700' : '#FF4444',
                        textShadow: `0 0 10px ${winnerIsLeft ? '#FFD70080' : '#FF444480'}`,
                        marginBottom: aspectHeight(1)
                      }}>{winnerIsLeft ? 'Victory' : 'Defeat'}</div>
                    </RewardRow>

                    <div style={{fontSize: aspectWidth(1.2)}}>
                      <RewardRow show={showRewards} delay={0.3} animation='slideInFromTop'>
                        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: aspectHeight(0.5)}}>
                          <div style={{textAlign: 'left'}}>{winnerIsLeft ? '+' : '-'}</div>
                          <div style={{textAlign: 'right'}}>
                            <Balance fame wei={winnerIsLeft ? leftRewards?.fame_gained_wei : leftRewards?.fame_lost_wei || 0n} size='large' />
                          </div>
                        </div>
                      </RewardRow>

                      <RewardRow show={showRewards} delay={0.6} animation='slideInFromTop'>
                        <div style={{display: 'flex', justifyContent: winnerIsLeft ? 'space-between' : 'flex-end', marginBottom: aspectHeight(0.5)}}>
                          {winnerIsLeft ? (
                            <>
                              <div style={{textAlign: 'left'}}>+</div>
                              <div style={{textAlign: 'right'}}>
                                <Balance fools wei={leftRewards?.fools_gained_wei || 0n} size='large' />
                              </div>
                            </>
                          ) : (
                            <div>-</div>
                          )}
                        </div>
                      </RewardRow>

                      <RewardRow show={showRewards} delay={0.9} animation='slideInFromTop'>
                        <div style={{display: 'flex', justifyContent: winnerIsLeft ? 'space-between' : 'flex-end', marginBottom: aspectHeight(0.5)}}>
                          {winnerIsLeft ? (
                            <>
                              <div style={{textAlign: 'left'}}>+</div>
                              <div style={{textAlign: 'right', fontSize: aspectWidth(1)}}>
                                {Number(leftRewards?.points_scored || 0)} Points
                              </div>
                            </>
                          ) : (
                            <div>-</div>
                          )}
                        </div>
                      </RewardRow>

                      <RewardRow show={showRewards} delay={1.2} animation='slideInFromTop'>
                        <Divider className="Brightest" style={{ width: '120%', marginLeft: '-10%' }} />
                      </RewardRow>

                      <RewardRow show={showRewards} delay={1.5} animation='slideInFromTop'>
                        <div style={{
                          fontSize: aspectWidth(1.6),
                          color: winnerIsLeft ? '#FFD700' : '#FF4444',
                          textShadow: `0 0 10px ${winnerIsLeft ? '#FFD70080' : '#FF444480'}`
                        }}>
                          {winnerIsLeft ? leftRewards?.position_string : (leftRewards?.survived ? 'Duelist Survived' : 'Duelist Died')}
                        </div>
                      </RewardRow>

                    </div>
                  </Col>

                  <Col width={2}>
                    <RewardRow show={showRewards} delay={0}>
                      <Divider vertical className="Brightest">Rewards</Divider>
                    </RewardRow>
                  </Col>

                  <Col width={7} textAlign='center'>
                    <RewardRow show={showRewards} delay={0} animation='slideInFromTop'>
                      <div className={winnerIsRight ? 'H3 Important' : 'H3 Negative'} style={{
                        fontSize: aspectWidth(2),
                        color: winnerIsRight ? '#FFD700' : '#FF4444',
                        textShadow: `0 0 10px ${winnerIsRight ? '#FFD70080' : '#FF444480'}`,
                        marginBottom: aspectHeight(1)
                      }}>{winnerIsRight ? 'Victory' : 'Defeat'}</div>
                    </RewardRow>

                    <div style={{fontSize: aspectWidth(1.2)}}>
                      <RewardRow show={showRewards} delay={0.3} animation='slideInFromTop'>
                        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: aspectHeight(0.5)}}>
                          <div style={{textAlign: 'left'}}>{winnerIsRight ? '+' : '-'}</div>
                          <div style={{textAlign: 'right'}}>
                            <Balance fame wei={winnerIsRight ? rightRewards?.fame_gained_wei : rightRewards?.fame_lost_wei || 0n} size='large' />
                          </div>
                        </div>
                      </RewardRow>

                      <RewardRow show={showRewards} delay={0.6} animation='slideInFromTop'>
                        <div style={{display: 'flex', justifyContent: winnerIsRight ? 'space-between' : 'flex-end', marginBottom: aspectHeight(0.5)}}>
                          {winnerIsRight ? (
                            <>
                              <div style={{textAlign: 'left'}}>+</div>
                              <div style={{textAlign: 'right'}}>
                                <Balance fools wei={rightRewards?.fools_gained_wei || 0n} size='large' />
                              </div>
                            </>
                          ) : (
                            <div>-</div>
                          )}
                        </div>
                      </RewardRow>

                      <RewardRow show={showRewards} delay={0.9} animation='slideInFromTop'>
                        <div style={{display: 'flex', justifyContent: winnerIsRight ? 'space-between' : 'flex-end', marginBottom: aspectHeight(0.5)}}>
                          {winnerIsRight ? (
                            <>
                              <div style={{textAlign: 'left'}}>+</div>
                              <div style={{textAlign: 'right', fontSize: aspectWidth(1)}}>
                                {Number(rightRewards?.points_scored || 0)} Points
                              </div>
                            </>
                          ) : (
                            <div>-</div>
                          )}
                        </div>
                      </RewardRow>

                      <RewardRow show={showRewards} delay={1.2} animation='slideInFromTop'>
                        <Divider className="Brightest" style={{ width: '120%', marginLeft: '-10%' }} />
                      </RewardRow>

                      <RewardRow show={showRewards} delay={1.5} animation='slideInFromTop'>
                        <div style={{
                          fontSize: aspectWidth(1.6),
                          color: winnerIsRight ? '#FFD700' : '#FF4444',
                          textShadow: `0 0 10px ${winnerIsRight ? '#FFD70080' : '#FF444480'}`
                        }}>
                          {winnerIsRight ? rightRewards?.position_string : (rightRewards?.survived ? 'Duelist Survived' : 'Duelist Died')}
                        </div>
                      </RewardRow>
                    </div>
                  </Col>
                </Row>
              </Grid>
            )}

            {/* TODO: Handle expired and canceled properly as there might be some deductions and rewards given */}
            {(isCanceled || isExpired) && showRewards && (
              <div className='fadeIn' style={{ 
                width: '100%',
                textAlign: 'center',
                marginTop: aspectHeight(3),
                marginBottom: aspectHeight(3),
                color: '#ff4444',
                fontSize: aspectWidth(2)
              }}>
                <p>{isCanceled ? 'The duel was canceled. No rewards were distributed.' : 'The duel has expired. No rewards were distributed.'}</p>
              </div>
            )}
            
            <div style={{ width: '100%', height: aspectHeight(7), marginTop: aspectHeight(2) }}>
              {showRewards && (
                <div className='fadeIn' style={{ animationDelay: '2s', width: '100%', height: '100%' }}>
                  <Grid className='YesMouse' textAlign='center' style={{ width: '100%' }}>
                    <Row columns='equal'>
                      <Col width={5}>
                        <ActionButton large fillParent label='Leave Duel' className='FillParent' onClick={() => dispatchSceneBack()} />
                      </Col>
                      <Col width={6}>
                        <ActionButton large fillParent label='Share' className='FillParent' onClick={() => {
                          const tweetUrl = makeDuelTweetUrl(
                            duelId, 
                            quote, 
                            premise, 
                            livesStaked, 
                            isYouA, 
                            isYouB, 
                            leftPlayerName, 
                            rightPlayerName,
                            true
                          );
                          window.open(tweetUrl, '_blank');
                        }} />
                      </Col>
                      <Col width={5}>
                        {!isCanceled && !isExpired && (
                          <ChallengeButton challengedPlayerAddress={isYouA ? duelistAddressB : duelistAddressA} customLabel={isYouA || isYouB ? 'Rematch!' : null} fillParent />
                        )}
                      </Col>
                    </Row>
                  </Grid>
                </div>
              )}
            </div>
          </div>
        </div>
      }
      {(isTutorial && isFinished && animated === AnimationState.Finished) &&
        <Segment style={{ position: 'absolute', top: '50%' }}>
          <h3 className='Important' style={{ fontSize: aspectWidth(1.3) }}>{challengeDescription}</h3>
          <ActionButton large fill label='Continue' onClick={() => handleContinue()} />
        </Segment>
      }
    </>
  )
}