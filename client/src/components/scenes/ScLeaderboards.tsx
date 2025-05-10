import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Container, Grid, Header, Table, Button, Segment, Pagination, Icon, Divider } from 'semantic-ui-react';
import { POSTER_HEIGHT_SMALL, POSTER_WIDTH_SMALL, ProfilePoster, ProfilePosterHandle } from '/src/components/ui/ProfilePoster';
import { useGameAspect } from '/src/hooks/useGameAspect';
import { usePlayer } from '/src/stores/playerStore';
import { useDuelist } from '/src/stores/duelistStore';
import { ProfilePic } from '../account/ProfilePic';
import { constants } from '@underware/pistols-sdk/pistols/gen';
import { BigNumberish } from 'starknet';
import { usePistolsContext, usePistolsScene } from '/src/hooks/PistolsContext';
import { DuelistCard } from '/src/components/cards/DuelistCard';
import { DUELIST_CARD_HEIGHT, DUELIST_CARD_WIDTH } from '/src/data/cardConstants';
import { useConfig } from '/src/stores/configStore';
import { formatTimestampDeltaCountdown, formatTimestampLocal } from '@underware/pistols-sdk/utils';
import { useClientTimestamp } from '@underware/pistols-sdk/utils/hooks';
import { useOwnerOfDuelist } from '/src/hooks/useTokenDuelists';
import { useSeasonPool } from '/src/stores/bankStore';
import { Balance } from '../account/Balance';
import { useIsMyAccount } from '/src/hooks/useIsYou';
import { useDuelistSeasonStats } from '/src/stores/challengeQueryStore';
import { useSeason, useAllSeasonIds, useLeaderboard } from '/src/stores/seasonStore';
import { useSeasonTotals } from '/src/hooks/useSeason';
import { ethToWei } from '@underware/pistols-sdk/starknet';

export default function ScLeaderboards() {
  const { aspectWidth, aspectHeight } = useGameAspect();
  const [activePage, setActivePage] = useState(1);
  const { dispatchSelectPlayerAddress, dispatchSelectDuelistId } = usePistolsContext();
  
  // Get season data
  const { seasonIds } = useAllSeasonIds()
  
  // Safely set the selected season to the active season or the first available one
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);

  // Set selected season on first load
  useEffect(() => {
    if (selectedSeasonId) return;
    
    if (seasonIds.length > 0) {
      setSelectedSeasonId(seasonIds[0]);
    }
  }, [seasonIds, selectedSeasonId]);

  function SeasonRow({ season, isSelected, onClick }: { season: number, isSelected: boolean, onClick: () => void }) {
    const [isHovered, setIsHovered] = useState(false);
    const { seasonId, timestamp_start, timestamp_end, isActive } = useSeason(season);
    const { clientTimestamp } = useClientTimestamp(isActive);
    const { accountsCount } = useSeasonTotals(season);
    const poolSeason = useSeasonPool(season);

    useEffect(() => {
      console.log(`SeasonR`, poolSeason)
    }, [poolSeason])
    
    const timeLeft = useMemo(() => {
      if (!timestamp_end) return 'Unknown';
      return formatTimestampDeltaCountdown(clientTimestamp, timestamp_end).result;
    }, [clientTimestamp, timestamp_end]);
    
    const winner = useMemo(() => {
      if (isActive) return null;
      
      // TODO: Get the winner from season data when available
      return "Unknown Winner";
    }, [isActive]);

    // Use the same background as player rows, but always use _mine version
    // For past seasons (not active), use _dead version
    const backgroundImage = `/images/ui/leaderboards/duelist_background_mine${!isActive ? '_dead' : ''}.png`;

    return (
      <div 
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ 
          padding: aspectWidth(0.2),
          cursor: 'pointer',
          backgroundImage: `url("${backgroundImage}")`,
          backgroundSize: '100% 100%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          border: isSelected ? '1px solid orange' : '1px solid transparent',
          marginBottom: aspectWidth(0.8),
          borderRadius: aspectWidth(0.3),
          transition: 'all 0.2s ease-in-out',
          transform: isHovered ? 'scale(1.01)' : 'scale(1)',
          marginRight: aspectWidth(0.4),
          marginLeft: aspectWidth(0.4)
        }}
      >
        <Grid columns={6}>
          <Grid.Column width={4} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ fontSize: aspectWidth(1.4), color: 'lightskyblue' }}>
              {season}
            </div>
          </Grid.Column>

          <Grid.Column width={4}>
            <div style={{ fontSize: aspectWidth(0.9), color: '#888' }}>Participants:</div>
            <div style={{ fontSize: aspectWidth(1.1), fontWeight: 'bold', color: 'white' }}>{accountsCount}</div>
          </Grid.Column>
          
          <Grid.Column width={4}>
            <div style={{ fontSize: aspectWidth(0.9), color: '#888' }}>Prize Pool:</div>
            <div style={{ fontSize: aspectWidth(1.1), fontWeight: 'bold', color: 'white' }}>
              <Balance lords wei={poolSeason.balanceLords + ((poolSeason.balanceFame / 3000n) * 10n)} />
            </div>
          </Grid.Column>
          
          <Grid.Column width={4}>
            <div style={{ fontSize: aspectWidth(0.9), color: '#888' }}>
              {!isActive ? 'Winner:' : 'Time Left:'}
            </div>
            <div style={{ fontSize: aspectWidth(1.1), fontWeight: 'bold', color: !isActive ? 'gold' : 'white' }}>
              {!isActive ? winner : timeLeft}
            </div>
          </Grid.Column>
        </Grid>
      </div>
    );
  }

  function PlayerRow({ duelistId, rank, score }: { 
    duelistId: BigNumberish, 
    rank: number, 
    score: number,
  }) {
    const [isHovered, setIsHovered] = useState(false);
    const { name: duelistName, profilePic: duelistProfilePic, isDead } = useDuelist(duelistId);
    const { owner } = useOwnerOfDuelist(duelistId);
    const { name: playerName } = usePlayer(owner);
    const { isMyAccount: isMe } = useIsMyAccount(owner);

    // TODO: Get actual season stats for this duelist
    const seasonStats = useDuelistSeasonStats(duelistId, selectedSeasonId);

    const backgroundImage = `/images/ui/leaderboards/duelist_background${isMe ? '_mine' : ''}${isDead ? '_dead' : ''}.png`;

    return (
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          padding: aspectWidth(0.2),
          backgroundImage: `url("${backgroundImage}")`,
          backgroundSize: '100% 100%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          marginBottom: aspectWidth(0.7),
          borderRadius: aspectWidth(0.3),
          transition: 'all 0.2s ease-in-out',
          transform: isHovered ? 'scale(1.01)' : 'scale(1)',
          marginRight: aspectWidth(0.4),
          marginLeft: aspectWidth(0.4),
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}
        
      >
        <Grid columns={9}>
          <Grid.Column width={1} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ fontSize: aspectWidth(1.2), color: 'white' }}>#{rank}</div>
          </Grid.Column>
          
          <Grid.Column width={4} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => dispatchSelectPlayerAddress(owner)}>
            <ProfilePic profilePic={0} width={2.5} removeBorder circle />
            <div style={{ marginLeft: aspectWidth(1), fontSize: aspectWidth(1.2), color: isMe ? '#00ff00' : 'lightskyblue', overflow: 'hidden', textOverflow: 'ellipsis' }}>{playerName}</div>
          </Grid.Column>

          <Grid.Column width={3} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => dispatchSelectDuelistId(duelistId)}>
            <div style={{ width: aspectWidth(0.05), height: '100%', backgroundColor: 'white', opacity: 0.3, marginRight: aspectWidth(0.6) }} />
            <ProfilePic profilePic={duelistProfilePic} profileType={constants.DuelistProfile.Genesis} width={2.5} />
            <div style={{ marginLeft: aspectWidth(1), fontSize: aspectWidth(0.8), color: '#888', overflow: 'hidden', textOverflow: 'ellipsis' }}>{duelistName}</div>
            <img id='DuelistDeadOverlayLeaderboard' className={ `${isDead ? 'visible' : ''}`} src='/textures/cards/card_disabled.png' />
            <div id='DuelistDeadOverlayLeaderboard' className={ `${isDead ? 'visible filter' : ''}`} />
          </Grid.Column>

          <Grid.Column width={2}>
            <div style={{ fontSize: aspectWidth(0.9), color: '#888' }}>Score:</div>
            <div style={{ fontSize: aspectWidth(1.3), fontWeight: 'bold', color: 'gold' }}>{score}</div>
          </Grid.Column>

          <Grid.Column width={2}>
            <div style={{ fontSize: aspectWidth(0.9), color: '#888' }}>Wins:</div>
            <div style={{ fontSize: aspectWidth(1.3), fontWeight: 'bold', color: 'green' }}>{seasonStats.wins}</div>
          </Grid.Column>

          <Grid.Column width={2}>
            <div style={{ fontSize: aspectWidth(0.9), color: '#888' }}>Losses:</div>
            <div style={{ fontSize: aspectWidth(1.3), fontWeight: 'bold', color: 'red' }}>{seasonStats.losses}</div>
          </Grid.Column>

          <Grid.Column width={2}>
            <div style={{ fontSize: aspectWidth(0.9), color: '#888' }}>Reward:</div>
            <div style={{ fontSize: aspectWidth(1.3), fontWeight: 'bold', color: 'white' }}>{'-'}</div>
          </Grid.Column>
        </Grid>
      </div>
    );
  }

  const handleSeasonSelect = (seasonId: number) => {
    setSelectedSeasonId(seasonId);
    setActivePage(1); // Reset to first page when changing seasons
  };

  // Get leaderboard data for selected season
  const { maxPositions = 0, scores = [] } = useLeaderboard(selectedSeasonId || 0);
  
  // Calculate pagination
  const itemsPerPage = activePage === 1 ? 3 : 7;
  const startIndex = activePage === 1 ? 0 : 3 + ((activePage - 2) * 7);
  const paginatedScores = scores?.slice(startIndex, startIndex + itemsPerPage) || [];
  const totalPages = Math.ceil(((scores?.length || 0) - 3) / 7) + 1;

  const LeaderboardPodium = ({
    rank,
    color,
    height,
    duelistId,
    score,
    cardScale = 0.6
  }: {
    rank: 1 | 2 | 3,
    color: string,
    height: number,
    duelistId: number,
    score: number,
    cardScale?: number
  }) => {
    const posterRef = useRef<ProfilePosterHandle>(null);
    const { isDead } = useDuelist(duelistId);
    const { owner } = useOwnerOfDuelist(duelistId);
    
    const { wins, losses } = useDuelistSeasonStats(duelistId, selectedSeasonId);
    
    const podiumType = rank === 1 ? 'gold' : rank === 2 ? 'silver' : 'bronze';
    const podiumImage = `/images/ui/leaderboards/podium_${podiumType}${isDead ? '_dead' : ''}.png`;
    
    // Get the correct rank number image
    const rankNumber = rank;
    const rankImage = `/images/ui/leaderboards/podium_number_${rankNumber}.png`;

    // Check if this is the user's duelist (TODO: implement actual check)
    const { isMyAccount: isMe } = useIsMyAccount(owner);

    useEffect(() => {
      if (posterRef.current && isMe) {
        setTimeout(() => {
          posterRef.current?.toggleHighlight(true, false, 'green');
        }, 50);
      }
    }, [isMe]);

    return (
      <div style={{ position: 'relative', width: aspectWidth(17) }}>        
        <div style={{ 
          height: aspectHeight(height),
          backgroundImage: `url("${podiumImage}")`,
          backgroundSize: '100% 100%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          padding: aspectWidth(1),
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>

          <div style={{ 
            width: '100%',
            textAlign: 'center',
            zIndex: 1,
            display: 'flex',
            justifyContent: 'center',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: aspectHeight(1)
          }}>
            <img 
              src={rankImage} 
              alt={`Rank ${rankNumber}`}
              style={{
                height: aspectHeight(4),
                filter: `drop-shadow(0 0 10px ${color}80)`,
                marginBottom: aspectHeight(1)
              }}
            />
            <div style={{
              width: '100%',
              height: '2px',
              background: `linear-gradient(to right, transparent, ${color}, transparent)`,
              marginBottom: aspectHeight(0.5)
            }} />
          </div>
          
          <div style={{ position: 'relative', width: aspectWidth(POSTER_WIDTH_SMALL * 0.9), backgroundColor: 'blue' }}>
            <ProfilePoster 
              ref={posterRef}
              playerAddress={owner}
              _close={() => {}}
              isSmall={true}
              width={POSTER_WIDTH_SMALL * 0.9}
              height={POSTER_HEIGHT_SMALL * 0.9}
              isVisible={true}
              instantVisible={true}
              isHighlightable={false}
              onClick={() => dispatchSelectPlayerAddress(owner)}
              onHover={(hovered) => {
                if (hovered) {
                  posterRef.current?.setScale(1.05, 200)
                } else {
                  posterRef.current?.setScale(1, 200)
                }
              }}
            />
          </div>
          
          <div style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: aspectWidth(1),
            marginTop: aspectHeight(POSTER_HEIGHT_SMALL * 0.9 + 2),
          }}>
            <div style={{ 
              width: aspectWidth(DUELIST_CARD_WIDTH * cardScale),
              height: aspectHeight(DUELIST_CARD_HEIGHT),
              filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.3))',
              flex: 1,
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <DuelistCard 
                width={DUELIST_CARD_WIDTH * cardScale}
                height={DUELIST_CARD_HEIGHT * cardScale}
                isSmall isLeft
                isVisible instantFlip instantVisible 
                isFlipped isHighlightable 
                duelistId={duelistId}
                onClick={() => dispatchSelectDuelistId(duelistId)}
              />
            </div>
            
            <div style={{
              height: '90%',
              width: '2px',
              background: `linear-gradient(transparent, ${color}, transparent)`,
            }} />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: aspectHeight(0.6), flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ color: '#ffffff', fontSize: aspectWidth(1.2), fontWeight: 'bold' }}>SCORE</div>
                <div style={{ color: 'gold', fontSize: aspectWidth(1.8), fontWeight: 'bold', textShadow: '0 0 10px rgba(255,215,0,0.5)' }}>{score}</div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: aspectWidth(1) }}>
                <div style={{ color: '#ffffff', fontSize: aspectWidth(1), fontWeight: 'bold' }}>WINS:</div>
                <div style={{ color: '#00ff00', fontSize: aspectWidth(1), fontWeight: 'bold', textShadow: '0 0 10px rgba(0,255,0,0.5)' }}>{wins}</div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: aspectWidth(1) }}>
                <div style={{ color: '#ffffff', fontSize: aspectWidth(1), fontWeight: 'bold' }}>LOSSES:</div>
                <div style={{ color: '#ff4444', fontSize: aspectWidth(1), fontWeight: 'bold', textShadow: '0 0 10px rgba(255,0,0,0.5)' }}>{losses}</div>
              </div>
            </div>
          </div>

          <div style={{ 
            marginTop: 'auto',
            textAlign: 'center',
            padding: aspectWidth(1.5),
            width: '100%',
            position: 'absolute',
            bottom: 0,
            left: 0
          }}>
            <div style={{
              width: '90%',
              height: '2px',
              background: `linear-gradient(to right, transparent, ${color}, transparent)`,
              marginBottom: aspectHeight(0.5),
              marginLeft: '5%',
            }} />
            <div style={{ 
              color: '#ffffff', 
              fontSize: aspectWidth(1.4), 
              fontWeight: 'bold', 
              textShadow: '0 0 10px rgba(255,255,255,0.5)',
              marginBottom: aspectHeight(0.2)
            }}>
              REWARD
              <div style={{ 
                fontSize: aspectWidth(1.8), 
                color: 'gold', 
                textShadow: '0 0 15px rgba(255,215,0,0.7)',
                marginTop: aspectHeight(0.2)
              }}>
                {'-'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Empty podium component for positions not yet occupied
  const EmptyPodium = ({
    rank,
    color,
    height,
  }: {
    rank: 1 | 2 | 3,
    color: string,
    height: number,
  }) => {
    // Get the correct rank number image
    const rankNumber = rank;
    const rankImage = `/images/ui/leaderboards/podium_number_${rankNumber}.png`;
    const podiumType = rank === 1 ? 'gold' : rank === 2 ? 'silver' : 'bronze';
    const podiumImage = `/images/ui/leaderboards/podium_${podiumType}.png`;

    return (
      <div style={{ position: 'relative', width: aspectWidth(17) }}>
        <div style={{ 
          height: aspectHeight(height),
          backgroundImage: `url("${podiumImage}")`,
          backgroundSize: '100% 100%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          padding: aspectWidth(1),
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          opacity: 0.6
        }}>
          <div style={{ 
            width: '100%',
            textAlign: 'center',
            zIndex: 1,
            display: 'flex',
            justifyContent: 'center',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: aspectHeight(1)
          }}>
            <img 
              src={rankImage} 
              alt={`Rank ${rankNumber}`}
              style={{
                height: aspectHeight(4),
                filter: `drop-shadow(0 0 10px ${color}80)`,
                marginBottom: aspectHeight(1),
                opacity: 0.7
              }}
            />
            <div style={{
              width: '100%',
              height: '2px',
              background: `linear-gradient(to right, transparent, ${color}, transparent)`,
              marginBottom: aspectHeight(0.5),
              opacity: 0.5
            }} />
          </div>
          
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'rgba(255,255,255,0.7)',
            fontSize: aspectWidth(1.5),
            fontWeight: 'bold',
            textAlign: 'center',
            textShadow: '0 0 10px rgba(0,0,0,0.5)',
            padding: aspectWidth(1),
            borderRadius: aspectWidth(0.5),
            background: 'rgba(0,0,0,0.3)',
            width: '80%'
          }}>
            YET TO BE<br/>OCCUPIED
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, width: aspectWidth(100), height: aspectHeight(87), display: 'flex' }}>
      {/* Left Side - Seasons */}
      <div style={{ flex: '1', padding: aspectWidth(3), paddingRight: aspectWidth(1) }}>
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundImage: 'url("/images/ui/leaderboards/seasons_board.png")', backgroundSize: '100% 100%', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', padding: aspectWidth(1.4) }}>
          <Header as="h3" style={{ color: 'white', textAlign: 'center', marginBottom: '20px' }}>SEASONS</Header>
          
          <div className='TextDivider bright LeaderboardsDivider EqualMargin'>Current Season</div>
          
          {seasonIds.length > 0 && (
            <SeasonRow
              key={seasonIds[0]}
              season={seasonIds[0]}
              isSelected={selectedSeasonId === seasonIds[0]}
              onClick={() => handleSeasonSelect(seasonIds[0])}
            />
          )}
          
          <div className='TextDivider bright LeaderboardsDivider EqualMargin'>Past Seasons</div>
          
          {seasonIds.length > 1 && (
            <>
              
              <div style={{ overflow: 'auto', flex: 1 }}>
                {seasonIds.slice(1).map(season => (
                  <SeasonRow
                    key={season}
                    season={season}
                    isSelected={selectedSeasonId === season}
                    onClick={() => handleSeasonSelect(season)}
                  />
                ))}
              </div>
            </>
          )}
          
          {seasonIds.length < 2 && (
            <div style={{ 
              flex: 1, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#888',
              fontSize: aspectWidth(2),
              textAlign: 'center',
              padding: aspectWidth(2)
            }}>
              No seasons available yet
            </div>
          )}
        </div>
      </div>

      {/* Right Side - Leaderboard */}
      <div style={{ flex: '1.5', padding: aspectWidth(3), paddingRight: aspectWidth(4), paddingLeft: aspectWidth(0) }}>
        <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
          {selectedSeasonId ? (
            <>
              {activePage === 1 && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: aspectWidth(1), marginBottom: aspectHeight(7) }}>
                  {scores.length > 1 ? (
                    <LeaderboardPodium
                      rank={2}
                      color="silver"
                      height={67}
                      duelistId={Number(scores[1].duelistId)}
                      score={scores[1].score}
                    />
                  ) : (
                    <EmptyPodium rank={2} color="silver" height={67} />
                  )}

                  {scores.length > 0 ? (
                    <LeaderboardPodium
                      rank={1}
                      color="gold"
                      height={69}
                      duelistId={Number(scores[0].duelistId)}
                      score={scores[0].score}
                      cardScale={0.6}
                    />
                  ) : (
                    <EmptyPodium rank={1} color="gold" height={69} />
                  )}

                  {scores.length > 2 ? (
                    <LeaderboardPodium
                      rank={3}
                      color="#cd7f32"
                      height={65}
                      duelistId={Number(scores[2].duelistId)}
                      score={scores[2].score}
                    />
                  ) : (
                    <EmptyPodium rank={3} color="#cd7f32" height={65} />
                  )}
                </div>
              )}

              {activePage > 1 && paginatedScores.length > 0 && (
                <div style={{ flex: 1 }}>
                  {paginatedScores.map((entry, index) => (
                    <PlayerRow 
                      key={entry.duelistId.toString()} 
                      duelistId={entry.duelistId}
                      rank={startIndex + index + 1}
                      score={entry.score}
                    />
                  ))}
                </div>
              )}

              {(activePage > 1 && paginatedScores.length === 0) && (
                <div style={{ 
                  flex: 1, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: '#888',
                  fontSize: aspectWidth(2)
                }}>
                  No more duelists to display
                </div>
              )}

              {scores.length === 0 && (
                <div style={{ 
                  position: 'absolute', 
                  bottom: aspectHeight(-1), 
                  left: 0, 
                  right: 0, 
                  textAlign: 'center',
                  color: '#a37349',
                  fontSize: aspectWidth(2)
                }}>
                  No leaderboard data available for this season
                </div>
              )}

              {scores.length > 0 && (
                <div style={{ position: 'absolute', bottom: aspectHeight(-3), left: 0, right: 0, textAlign: 'center' }}>
                  <Pagination
                    activePage={activePage}
                    totalPages={Math.max(1, totalPages)}
                    firstItem={{ content: '<<', key: 'first' }}
                    lastItem={{ content: '>>', key: 'last' }}
                    prevItem={{ content: '<', key: 'prev' }}
                    nextItem={{ content: '>', key: 'next' }}
                    onPageChange={(_, data) => setActivePage(Number(data.activePage))}
                    size="large"
                    boundaryRange={0}
                    siblingRange={1}
                    ellipsisItem={null}
                    className="PaginationWood"
                  />
                </div>
              )}
            </>
          ) : (
            <div style={{ 
              flex: 1, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#888',
              fontSize: aspectWidth(2)
            }}>
              Select a season to view leaderboard
            </div>
          )}
        </div>
      </div>
    </div>
  );
}