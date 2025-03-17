import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Grid, Segment, Divider } from 'semantic-ui-react'
import { useGameplayContext } from '/src/hooks/GameplayContext'
import { useGetChallenge } from '/src/stores/challengeStore'
import { AnimationState } from '/src/three/game'
import { useChallengeDescription } from '/src/hooks/useChallengeDescription'
import { useGameAspect } from '/src/hooks/useGameAspect'
import { ActionButton } from '../Buttons'
import { SceneName } from '/src/data/assets'
import { usePistolsContext, usePistolsScene } from '/src/hooks/PistolsContext'
import { DuelTutorialLevel } from '/src/data/tutorialConstants'
import { SettingsActions, useSettings } from '/src/hooks/SettingsContext'
import { useGetChallengeRewards } from '/src/hooks/useChallengeRewards'
import { usePlayer } from '/src/stores/playerStore'
import { Balance } from '../../account/Balance'
import AnimatedText from '../AnimatedText'

const Row = Grid.Row
const Col = Grid.Column

export default function DuelStateDisplay({ duelId }: { duelId: bigint }) {
  const { aspectWidth, aspectHeight } = useGameAspect()

  const { animated } = useGameplayContext()

  const { dispatchSetting } = useSettings()
  const { dispatchSetScene } = usePistolsScene()
  const { dispatchSetTutorialLevel } = usePistolsContext()

  const { challengeDescription } = useChallengeDescription(duelId)
  const { isFinished, isTutorial, tutorialLevel, duelistIdA, duelistIdB, winnerDuelistId, duelistAddressA, duelistAddressB } = useGetChallenge(duelId)

  const { name: playerNameA } = usePlayer(duelistAddressA)
  const { name: playerNameB } = usePlayer(duelistAddressB)

  const rewardsA = useGetChallengeRewards(isFinished ? duelId : 0n, duelistIdA)
  const rewardsB = useGetChallengeRewards(isFinished ? duelId : 0n, duelistIdB)

  const winnerIsA = useMemo(() => (winnerDuelistId == duelistIdA), [winnerDuelistId, duelistIdA])
  const winnerIsB = useMemo(() => (winnerDuelistId == duelistIdB), [winnerDuelistId, duelistIdB])

  const [animatedText, setAnimatedText] = useState("")
  const [showOutcome, setShowOutcome] = useState(false)
  const [showRewards, setShowRewards] = useState(false)

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
  }, [tutorialLevel, dispatchSetTutorialLevel, dispatchSetScene])

  useEffect(() => {
    if (!isTutorial && isFinished && animated === AnimationState.Finished) {
      setAnimatedText(challengeDescription)
    }
  }, [isTutorial, isFinished, animated])

  const RewardRow = ({delay, children, animation = 'fadeIn'}) => (
    showRewards ? (
      <div className={animation} style={{
        animationDelay: `${delay}s`,
        width: '60%',
        margin: '0 auto',
        minHeight: aspectHeight(2)
      }}>
        {children}
      </div>
    ) : (
      <div style={{
        width: '60%',
        margin: '0 auto',
        minHeight: aspectHeight(2),
        visibility: 'hidden'
      }}>
        {children}
      </div>
    )
  )

  return (
    <>
      {(!isTutorial && isFinished && animated == AnimationState.Finished) &&
        <div className='NoMouse NoDrag' style={{ 
          position: 'absolute', 
          top: 0, 
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
            padding: '1rem',
            width: aspectWidth(40),
          }}>
            <h2 className='Important' style={{ 
              fontSize: aspectWidth(2.5),
              textAlign: 'center',
              marginBottom: aspectHeight(1),
              margin: '0 auto',
            }}>
              <AnimatedText
                text={animatedText}
                slideDirection='top'
                delayPerCharacter={20}
                onAnimationComplete={() => setShowOutcome(true)}
              />
            </h2>

            <div className={`TextDivider DuelDivider bright ${showOutcome ? 'DividerAnimation' : ''}`} ></div>

            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-evenly', 
              alignItems: 'center', 
              marginBottom: aspectHeight(2),
              fontSize: aspectWidth(1.6),
              height: aspectHeight(4),
              width: '100%',
            }}>
              <AnimatedText
                text={showOutcome ? playerNameA : ''}
                delayPerCharacter={50}
                style={{color: winnerIsA ? '#00ff00' : '#ff4444'}}
              />
              <AnimatedText
                text={showOutcome ? 'VS' : ''}
                delayPerCharacter={0}
                slideDirection='top' 
                style={{fontSize: aspectWidth(2)}}
              />
              <AnimatedText
                text={showOutcome ? playerNameB : ''}
                delayPerCharacter={50}
                reverse
                style={{color: winnerIsB ? '#00ff00' : '#ff4444'}}
                onAnimationComplete={() => setShowRewards(true)}
              />
            </div>

            <Grid style={{width: '100%', height: aspectHeight(25)}}>
              <Row>
                <Col width={7} textAlign='center'>
                  <RewardRow delay={0} animation='slideInFromTop'>
                    <div className={winnerIsA ? 'H3 Important' : 'H3 Negative'} style={{
                      fontSize: aspectWidth(2),
                      color: winnerIsA ? '#FFD700' : '#FF4444',
                      textShadow: `0 0 10px ${winnerIsA ? '#FFD70080' : '#FF444480'}`,
                      marginBottom: aspectHeight(1)
                    }}>{winnerIsA ? 'Victory' : 'Defeat'}</div>
                  </RewardRow>

                  <div style={{fontSize: aspectWidth(1.2)}}>
                    <RewardRow delay={0.3} animation='slideInFromTop'>
                      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: aspectHeight(0.5)}}>
                        <div style={{textAlign: 'left'}}>{winnerIsA ? '+' : '-'}</div>
                        <div style={{textAlign: 'right'}}>
                          <Balance fame wei={winnerIsA ? rewardsA?.fame_gained_wei : rewardsA?.fame_lost_wei || 0n} size='large' />
                        </div>
                      </div>
                    </RewardRow>

                    <RewardRow delay={0.6} animation='slideInFromTop'>
                      <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: aspectHeight(0.5)}}>
                        {winnerIsA ? (
                          <>
                            <div style={{textAlign: 'left'}}>+</div>
                            <Balance fools wei={rewardsA?.fools_gained_wei || 0n} size='large' />
                          </>
                        ) : (
                          <div>-</div>
                        )}
                      </div>
                    </RewardRow>

                    <RewardRow delay={0.9} animation='slideInFromTop'>
                      <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: aspectHeight(0.5)}}>
                        {winnerIsA ? (
                          <>
                            <div style={{textAlign: 'left'}}>+</div>
                            <div style={{fontSize: aspectWidth(1)}}>
                              {Number(rewardsA?.points_scored || 0)} Points
                            </div>
                          </>
                        ) : (
                          <div>-</div>
                        )}
                      </div>
                    </RewardRow>

                    <RewardRow delay={1.2} animation='slideInFromTop'>
                      <Divider className="Brightest" style={{ width: '120%', marginLeft: '-10%' }} />
                    </RewardRow>

                    <RewardRow delay={1.5} animation='slideInFromTop'>
                      <div style={{
                        fontSize: aspectWidth(1.6),
                        color: winnerIsA ? '#FFD700' : '#FF4444',
                        textShadow: `0 0 10px ${winnerIsA ? '#FFD70080' : '#FF444480'}`
                      }}>
                        {winnerIsA ? rewardsA?.position_string : (rewardsA?.survived ? 'Duelist Survived' : 'Duelist Died')}
                      </div>
                    </RewardRow>

                  </div>
                </Col>

                <Col width={2}>
                  <RewardRow delay={0}>
                    <Divider vertical className="Brightest">Rewards</Divider>
                  </RewardRow>
                </Col>

                <Col width={7} textAlign='center'>
                  <RewardRow delay={0} animation='slideInFromTop'>
                    <div className={winnerIsB ? 'H3 Important' : 'H3 Negative'} style={{
                      fontSize: aspectWidth(2),
                      color: winnerIsB ? '#FFD700' : '#FF4444',
                      textShadow: `0 0 10px ${winnerIsB ? '#FFD70080' : '#FF444480'}`,
                      marginBottom: aspectHeight(1)
                    }}>{winnerIsB ? 'Victory' : 'Defeat'}</div>
                  </RewardRow>

                  <div style={{fontSize: aspectWidth(1.2)}}>
                    <RewardRow delay={0.3} animation='slideInFromTop'>
                      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: aspectHeight(0.5)}}>
                        <div style={{textAlign: 'left'}}>{winnerIsB ? '+' : '-'}</div>
                        <div style={{textAlign: 'right'}}>
                          <Balance fame wei={winnerIsB ? rewardsB?.fame_gained_wei : rewardsB?.fame_lost_wei || 0n} size='large' />
                        </div>
                      </div>
                    </RewardRow>

                    <RewardRow delay={0.6} animation='slideInFromTop'>
                      <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: aspectHeight(0.5)}}>
                        {winnerIsB ? (
                          <>
                            <div style={{textAlign: 'left'}}>+</div>
                            <Balance fools wei={rewardsB?.fools_gained_wei || 0n} size='large' />
                          </>
                        ) : (
                          <div>-</div>
                        )}
                      </div>
                    </RewardRow>

                    <RewardRow delay={0.9} animation='slideInFromTop'>
                      <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: aspectHeight(0.5)}}>
                        {winnerIsB ? (
                          <>
                            <div style={{textAlign: 'left'}}>+</div>
                            <div style={{fontSize: aspectWidth(1)}}>
                              {Number(rewardsB?.points_scored || 0)} Points
                            </div>
                          </>
                        ) : (
                          <div>-</div>
                        )}
                      </div>
                    </RewardRow>

                    <RewardRow delay={1.2} animation='slideInFromTop'>
                      <Divider className="Brightest" style={{ width: '120%', marginLeft: '-10%' }} />
                    </RewardRow>

                    <RewardRow delay={1.5} animation='slideInFromTop'>
                      <div style={{
                        fontSize: aspectWidth(1.6),
                        color: winnerIsB ? '#FFD700' : '#FF4444',
                        textShadow: `0 0 10px ${winnerIsB ? '#FFD70080' : '#FF444480'}`
                      }}>
                        {winnerIsB ? rewardsB?.position_string : (rewardsB?.survived ? 'Duelist Survived' : 'Duelist Died')}
                      </div>
                    </RewardRow>
                  </div>
                </Col>
              </Row>
            </Grid>            
          </div>
        </div>
      }
      {(isTutorial && isFinished && animated == AnimationState.Finished) &&
        <Segment style={{ position: 'absolute', top: '50%' }}>
          <h3 className='Important' style={{ fontSize: aspectWidth(1.3) }}>{challengeDescription}</h3>
          <ActionButton large fill label='Continue' onClick={() => handleContinue()} />
        </Segment>
      }
    </>
  )
}