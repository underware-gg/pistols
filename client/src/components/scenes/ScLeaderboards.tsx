import React, { useState, useRef, useEffect } from 'react';
import { Container, Grid, Header, Table, Button, Segment, Pagination, Icon, Divider } from 'semantic-ui-react';
import { POSTER_HEIGHT_SMALL, POSTER_WIDTH_SMALL, ProfilePoster, ProfilePosterHandle } from '/src/components/ui/ProfilePoster';
import { useGameAspect } from '/src/hooks/useGameAspect';
import { usePlayer } from '/src/stores/playerStore';
import { useDuelist } from '/src/stores/duelistStore';
import { ProfilePic } from '../account/ProfilePic';
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { BigNumberish } from 'starknet';
import { usePistolsContext, usePistolsScene } from '/src/hooks/PistolsContext';
import { DuelistCard } from '/src/components/cards/DuelistCard';
import { DUELIST_CARD_HEIGHT, DUELIST_CARD_WIDTH } from '/src/data/cardConstants';

interface Season {
  id: string;
  name: string;
  participants: number;
  highScore: number;
  timeLeft: string;
  winner?: string;
}

export default function ScLeaderboards() {
  const { aspectWidth, aspectHeight } = useGameAspect()
  const [selectedSeason, setSelectedSeason] = useState<string | null>('current');
  const [activePage, setActivePage] = useState(1);
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');
  const { dispatchSelectPlayerAddress, dispatchSelectDuelistId } = usePistolsContext()

  function SeasonRow({ season, isSelected, onClick }: { season: Season, isSelected: boolean, onClick: () => void }) {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <div 
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ 
          padding: aspectWidth(0.2),
          cursor: 'pointer',
          backgroundColor: isHovered 
            ? (isSelected ? 'rgba(255,223,0,0.15)' : 'rgba(255,255,255,0.05)')
            : (isSelected ? 'rgba(255,223,0,0.1)' : 'transparent'),
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
              {season.name}
            </div>
          </Grid.Column>

          <Grid.Column width={4}>
            <div style={{ fontSize: aspectWidth(0.9), color: '#888' }}>Participants:</div>
            <div style={{ fontSize: aspectWidth(1.1), fontWeight: 'bold', color: 'white' }}>{season.participants}</div>
          </Grid.Column>
          
          <Grid.Column width={4}>
            <div style={{ fontSize: aspectWidth(0.9), color: '#888' }}>High Score:</div>
            <div style={{ fontSize: aspectWidth(1.1), fontWeight: 'bold', color: 'white' }}>{season.highScore}</div>
          </Grid.Column>
          
          <Grid.Column width={4}>
            <div style={{ fontSize: aspectWidth(0.9), color: '#888' }}>
              {season.winner ? 'Winner:' : 'Time Left:'}
            </div>
            <div style={{ fontSize: aspectWidth(1.1), fontWeight: 'bold', color: season.winner ? 'gold' : 'white' }}>
              {season.winner ? season.winner : season.timeLeft}
            </div>
          </Grid.Column>
        </Grid>
      </div>
    );
  }

  function PlayerRow({ playerId, duelistId, rank, isMe = false }: { playerId: BigNumberish, duelistId: BigNumberish, rank: number, isMe?: boolean }) {
    const [isHovered, setIsHovered] = useState(false);
    const { name: playerName } = usePlayer(playerId);
    const { name: duelistName, profilePic: duelistProfilePic } = useDuelist(duelistId);

    // TODO: Implement real season stats
    const seasonStats = {
      score: 2450,
      wins: 32, 
      losses: 4,
      reward: 1000
    };

    return (
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          padding: aspectWidth(0.2),
          backgroundColor: isMe 
            ? (isHovered ? 'rgba(0,255,0,0.1)' : 'rgba(0,255,0,0.05)')
            : (isHovered ? 'rgba(255,255,255,0.05)' : 'transparent'),
          marginBottom: aspectWidth(0.4),
          borderRadius: aspectWidth(0.3),
          transition: 'all 0.2s ease-in-out',
          transform: isHovered ? 'scale(1.01)' : 'scale(1)',
          marginRight: aspectWidth(0.4),
          marginLeft: aspectWidth(0.4),
          border: isMe ? '1px solid rgba(0,255,0,0.2)' : '1px solid transparent',
          borderBottom: !isMe ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,255,0,0.2)',
        }}
        
      >
        <Grid columns={9}>
          <Grid.Column width={1} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ fontSize: aspectWidth(1.2), color: 'white' }}>#{rank}</div>
          </Grid.Column>
          
          <Grid.Column width={4} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => dispatchSelectPlayerAddress(playerId)}>
            <ProfilePic profilePic={0} width={2.5} removeBorder circle />
            <div style={{ marginLeft: aspectWidth(1), fontSize: aspectWidth(1.2), color: isMe ? '#00ff00' : 'lightskyblue', overflow: 'hidden', textOverflow: 'ellipsis' }}>{playerName}</div>
          </Grid.Column>

          <Grid.Column width={3} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => dispatchSelectDuelistId(duelistId)}>
            <div style={{ width: aspectWidth(0.05), height: '100%', backgroundColor: 'white', opacity: 0.3, marginRight: aspectWidth(0.6) }} />
            <ProfilePic profilePic={duelistProfilePic} profileType={constants.ProfileType.Duelist} width={2.5} />
            <div style={{ marginLeft: aspectWidth(1), fontSize: aspectWidth(0.8), color: '#888', overflow: 'hidden', textOverflow: 'ellipsis' }}>{duelistName}</div>
          </Grid.Column>

          <Grid.Column width={2}>
            <div style={{ fontSize: aspectWidth(0.9), color: '#888' }}>Score:</div>
            <div style={{ fontSize: aspectWidth(1.3), fontWeight: 'bold', color: 'gold' }}>{seasonStats.score}</div>
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
            <div style={{ fontSize: aspectWidth(1.3), fontWeight: 'bold', color: 'white' }}>{seasonStats.reward}</div>
          </Grid.Column>
        </Grid>
      </div>
    );
  }

  const handleSeasonSelect = (seasonId: string) => {
    setSelectedSeason(seasonId);
  };

  const leaderboardEntries = [
    3, 2, 4, 1, 5, 2, 3, 1, 4, 5,
    2, 4, 1, 3, 5, 1, 2, 4, 3, 5,
    4, 1, 3, 5, 2, 3, 4, 1, 5, 2,
    1, 5, 2, 4, 3, 5, 1, 2, 4, 3,
    2, 4, 5, 1, 3, 4, 2, 5, 3, 1
  ];

  const itemsPerPage = activePage === 1 ? 3 : 7;
  const startIndex = activePage === 1 ? 0 : 3 + ((activePage - 2) * 7);
  const paginatedEntries = leaderboardEntries.slice(startIndex, startIndex + itemsPerPage);

  const LeaderboardPodium = ({
    rank,
    color,
    height,
    playerAddress,
    duelistId,
    score,
    wins,
    losses,
    reward,
    cardScale = 0.6
  }: {
    rank: '1ˢᵀ' | '2ᴺᴰ' | '3ᴿᴰ',
    color: string,
    height: number,
    playerAddress: bigint,
    duelistId: number,
    score: number,
    wins: number,
    losses: number,
    reward: number,
    cardScale?: number
  }) => {
    const isMe = playerAddress === 0x1234567890123456789012345678901234567890n;
    const posterRef = useRef<ProfilePosterHandle>(null);
    //TODO get score and stuff from season stats here not through params

    useEffect(() => {
      if (posterRef.current) {
        setTimeout(() => {
          posterRef.current.toggleHighlight(true, false, 'green');
        }, 50);
      }
    }, [isMe]);

    return (
      <div style={{ position: 'relative', width: aspectWidth(17) }}>
        <Header as="h1" style={{ 
          color: color,
          position: 'absolute',
          top: aspectHeight(-6),
          width: '100%',
          textAlign: 'center',
          fontSize: aspectWidth(rank === '1ˢᵀ' ? 2.2 : 2),
          textShadow: `0 0 10px ${color}80`,
          zIndex: 1
        }}>{rank}</Header>
        
        <div style={{ 
          height: aspectHeight(height),
          backgroundColor: 'rgba(255,255,255,0.15)',
          border: `2px solid ${color}`,
          borderRadius: aspectWidth(1),
          boxShadow: `0 0 20px ${color}4D`,
          padding: aspectWidth(1),
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <div style={{ position: 'relative', width: aspectWidth(POSTER_WIDTH_SMALL * 0.9), backgroundColor: 'blue' }}>
            <ProfilePoster 
              ref={posterRef}
              playerAddress={playerAddress}
              _close={() => {}}
              isSmall={true}
              width={POSTER_WIDTH_SMALL * 0.9}
              height={POSTER_HEIGHT_SMALL * 0.9}
              isVisible={true}
              instantVisible={true}
              isHighlightable={false}
              onClick={() => dispatchSelectPlayerAddress(playerAddress)}
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
              margin: `0 ${aspectWidth(1)}`
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
            padding: aspectWidth(0.5),
            width: '100%',
            position: 'absolute',
            bottom: 0,
            left: 0
          }}>
            <div style={{
              width: '100%',
              height: '2px',
              background: `linear-gradient(to right, transparent, ${color}, transparent)`,
              marginBottom: aspectHeight(0.5)
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
                {reward}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, width: aspectWidth(100), height: aspectHeight(100), display: 'flex' }}>
      <CommingSoon />
    </div>
  )

  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, width: aspectWidth(100), height: aspectHeight(84), display: 'flex' }}>
      {/* Left Side - Seasons */}
      <div style={{ flex: '1', padding: aspectWidth(1) }}>
        <Segment style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Header as="h3" style={{ color: 'white', textAlign: 'center', marginBottom: '20px' }}>CURRENT SEASON</Header>
          
          {/* <SeasonRow 
            season={currentSeason}
            isSelected={selectedSeason === currentSeason.id}
            onClick={() => setSelectedSeason(currentSeason.id)}
          /> */}
          
          <div className='TextDivider bright LeaderboardsDivider EqualMargin'>Past Seasons</div>
          
          <div style={{ overflow: 'auto', flex: 1 }}>
            {/* {pastSeasons.map(season => (
              <SeasonRow
                key={season.id}
                season={season}
                isSelected={selectedSeason === season.id}
                onClick={() => setSelectedSeason(season.id)}
              />
            ))} */}
          </div>
        </Segment>
      </div>

      {/* Right Side - Leaderboard */}
      <div style={{ flex: '1.5', padding: aspectWidth(1) }}>
        <Segment style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Header as="h2" style={{ color: 'white', marginBottom: aspectHeight(4) }}>Standings:</Header>
          
          {activePage === 1 && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: aspectWidth(1), marginBottom: aspectHeight(7) }}>
              <LeaderboardPodium
                rank="2ᴺᴰ"
                color="silver"
                height={60}
                playerAddress={0x1234567890123456789012345678901234567890n}
                duelistId={leaderboardEntries[1]}
                score={2320}
                wins={28}
                losses={5}
                reward={800}
              />

              <LeaderboardPodium
                rank="1ˢᵀ"
                color="gold"
                height={63}
                playerAddress={0x1234567890123456789012345678901234567890n}
                duelistId={leaderboardEntries[0]}
                score={2450}
                wins={32}
                losses={4}
                reward={1000}
                cardScale={0.6}
              />

              <LeaderboardPodium
                rank="3ᴿᴰ"
                color="#cd7f32"
                height={57}
                playerAddress={0x1234567890123456789012345678901234567890n}
                duelistId={leaderboardEntries[2]}
                score={2180}
                wins={25}
                losses={7}
                reward={600}
              />
            </div>
          )}

          {activePage > 1 && (
            <div style={{ flex: 1 }}>
              {paginatedEntries.map((entry, index) => (
                <PlayerRow 
                  key={index} 
                  playerId={entry}
                  duelistId={entry}
                  rank={startIndex + index + 1}
                  isMe={index === 2} // Example condition - replace with actual logic
                />
              ))}
            </div>
          )}

          <div style={{ position: 'absolute', bottom: aspectHeight(2), left: 0, right: 0, textAlign: 'center' }}>
            <Pagination
              activePage={activePage}
              totalPages={Math.ceil((leaderboardEntries.length - 3) / 7) + 1}
              firstItem={{ content: '<', key: 'first' }}
              lastItem={{ content: '>', key: 'last' }}
              onPageChange={(_, data) => setActivePage(Number(data.activePage))}
              size="large"
              boundaryRange={0}
              siblingRange={1}
              ellipsisItem={null}
            />
          </div>
        </Segment>
      </div>
    </div>
  );
};

const CommingSoon = () => {
  const {aspectWidth, aspectHeight} = useGameAspect();
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
      width: '100%',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Enhanced animated background with noise effect */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, rgba(30,8,0,1) 0%, rgba(60,20,5,1) 35%, rgba(80,30,10,1) 50%, rgba(60,20,5,1) 65%, rgba(30,8,0,1) 100%)',
        backgroundSize: '400% 400%',
        animation: 'gradientAnimation 12s ease infinite',
        zIndex: 1
      }} className="noiseOverlay" />
      
      {/* Additional background elements */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at center, transparent 30%, rgba(120,60,10,0.4) 70%)',
        zIndex: 2,
        animation: 'pulseBackground 8s ease-in-out infinite'
      }} />
      
      {/* Enhanced glowing lines */}
      <div style={{
        position: 'absolute',
        width: '200%',
        height: '2px',
        background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.8), transparent)',
        top: '40%',
        left: '-50%',
        transform: 'rotate(-5deg)',
        boxShadow: '0 0 15px rgba(255,215,0,0.8), 0 0 30px rgba(255,215,0,0.5)',
        zIndex: 2,
        animation: 'lineShift 10s ease-in-out infinite'
      }} />
      
      <div style={{
        position: 'absolute',
        width: '200%',
        height: '2px',
        background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.8), transparent)',
        top: '60%',
        left: '-50%',
        transform: 'rotate(5deg)',
        boxShadow: '0 0 15px rgba(255,215,0,0.8), 0 0 30px rgba(255,215,0,0.5)',
        zIndex: 2,
        animation: 'lineShift 10s ease-in-out infinite reverse'
      }} />
      
      {/* Additional diagonal lines */}
      <div style={{
        position: 'absolute',
        width: '150%',
        height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(255,165,0,0.6), transparent)',
        top: '30%',
        left: '-25%',
        transform: 'rotate(-15deg)',
        boxShadow: '0 0 8px rgba(255,165,0,0.6), 0 0 16px rgba(255,165,0,0.3)',
        zIndex: 2,
        animation: 'lineShift 15s ease-in-out infinite 2s'
      }} />
      
      <div style={{
        position: 'absolute',
        width: '150%',
        height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(255,165,0,0.6), transparent)',
        top: '70%',
        left: '-25%',
        transform: 'rotate(15deg)',
        boxShadow: '0 0 8px rgba(255,165,0,0.6), 0 0 16px rgba(255,165,0,0.3)',
        zIndex: 2,
        animation: 'lineShift 15s ease-in-out infinite 2s reverse'
      }} />
      
      {/* Main text */}
      <div style={{
        fontSize: aspectWidth(8),
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        textTransform: 'uppercase',
        textShadow: `
          0 0 10px rgba(255,255,255,0.8),
          0 0 20px rgba(255,215,0,0.8),
          0 0 30px rgba(255,215,0,0.6),
          0 0 40px rgba(255,215,0,0.4),
          0 0 50px rgba(255,215,0,0.2)
        `,
        letterSpacing: aspectWidth(0.5),
        position: 'relative',
        zIndex: 30,
        transform: 'perspective(500px) rotateX(10deg)',
        animation: 'textPulse 2s ease-in-out infinite alternate',
        marginBottom: aspectHeight(0)  // Added space between text elements
      }}>
        COMING
      </div>
      
      <div style={{
        fontSize: aspectWidth(8),
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        textTransform: 'uppercase',
        textShadow: `
          0 0 10px rgba(255,255,255,0.8),
          0 0 20px rgba(255,215,0,0.8),
          0 0 30px rgba(255,215,0,0.6),
          0 0 40px rgba(255,215,0,0.4),
          0 0 50px rgba(255,215,0,0.2)
        `,
        letterSpacing: aspectWidth(0.5),
        marginTop: aspectHeight(0),  // Increased space between text elements
        position: 'relative',
        zIndex: 30,
        transform: 'perspective(500px) rotateX(10deg)',
        animation: 'textPulse 2s ease-in-out infinite alternate-reverse',
        marginBottom: aspectHeight(2)  // Added space below second text
      }}>
        SOON
      </div>
      
      {/* Enhanced decorative elements with pulsating animation */}
      <div style={{
        position: 'absolute',
        width: aspectWidth(30),
        height: aspectWidth(30),
        border: '2px solid rgba(255,215,0,0.3)',
        borderRadius: '50%',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        boxShadow: 'inset 0 0 30px rgba(255,215,0,0.3), 0 0 20px rgba(255,215,0,0.2)',
        zIndex: 2,
        animation: 'rotate 20s linear infinite, circlePulsate 4s ease-in-out infinite'
      }} />
      
      <div style={{
        position: 'absolute',
        width: aspectWidth(20),
        height: aspectWidth(20),
        border: '1px solid rgba(255,165,0,0.2)',
        borderRadius: '50%',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        boxShadow: 'inset 0 0 20px rgba(255,165,0,0.2), 0 0 15px rgba(255,165,0,0.1)',
        zIndex: 2,
        animation: 'rotate 15s linear infinite reverse, circlePulsate 6s ease-in-out infinite 1s'
      }} />
      
      <div style={{
        position: 'absolute',
        width: aspectWidth(40),
        height: aspectWidth(40),
        border: '1px solid rgba(255,215,0,0.1)',
        borderRadius: '50%',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        boxShadow: 'inset 0 0 40px rgba(255,215,0,0.1), 0 0 25px rgba(255,215,0,0.05)',
        zIndex: 2,
        animation: 'rotate 25s linear infinite, circlePulsate 8s ease-in-out infinite 2s'
      }} />
      
      {/* Crossed pistols in the center - larger size */}
      <div style={{
        position: 'absolute',
        width: aspectWidth(30),
        height: aspectWidth(30),
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 3,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <img 
          src="/images/ui/pistol.png" 
          style={{
            width: aspectWidth(30),
            height: 'auto',
            position: 'absolute',
            filter: 'drop-shadow(0 0 5px rgba(255,215,0,0.4)) brightness(0.7) contrast(0.8) blur(1px)',
          }}
        />
        <img 
          src="/images/ui/pistol.png" 
          style={{
            width: aspectWidth(30),
            height: 'auto',
            position: 'absolute',
            transform: 'scaleX(-1)',
            filter: 'drop-shadow(0 0 5px rgba(255,215,0,0.4)) brightness(0.7) contrast(0.8) blur(1px)',
          }}
        />
      </div>
      
      {/* Animated floating particles with fade in/out */}
      <div className="particles-container">
        {Array.from({ length: 30 }).map((_, i) => (
          <div 
            key={i} 
            className="particle"
            style={{
              position: 'absolute',
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              backgroundColor: `rgba(255, 215, 0, ${Math.random() * 0.5 + 0.2})`,
              borderRadius: '50%',
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              boxShadow: '0 0 4px rgba(255, 215, 0, 0.8)',
              opacity: 0,
              animation: `particleAnimation ${Math.random() * 8 + 7}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
              zIndex: 4
            }}
          />
        ))}
      </div>
      
      {/* @ts-ignore */}
      <style jsx>{`
        @keyframes gradientAnimation {
          0% { background-position: 0% 50% }
          50% { background-position: 100% 50% }
          100% { background-position: 0% 50% }
        }
        
        @keyframes textPulse {
          0% { opacity: 0.8; transform: perspective(500px) rotateX(10deg) scale(1); }
          100% { opacity: 1; transform: perspective(500px) rotateX(10deg) scale(1.05); }
        }
        
        @keyframes rotate {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        
        @keyframes circlePulsate {
          0% { transform: translate(-50%, -50%) rotate(0deg) scale(1); opacity: 0.7; }
          50% { transform: translate(-50%, -50%) rotate(180deg) scale(1.1); opacity: 1; }
          100% { transform: translate(-50%, -50%) rotate(360deg) scale(1); opacity: 0.7; }
        }
        
        @keyframes lineShift {
          0% { transform: translateX(-10%) rotate(-5deg); opacity: 0.5; }
          50% { transform: translateX(10%) rotate(-5deg); opacity: 1; }
          100% { transform: translateX(-10%) rotate(-5deg); opacity: 0.5; }
        }
        
        @keyframes pulseBackground {
          0% { opacity: 0.3; }
          50% { opacity: 0.7; }
          100% { opacity: 0.3; }
        }
        
        @keyframes particleAnimation {
          0% {
            transform: translate(0, 0);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            transform: translate(${Math.random() > 0.5 ? '+' : '-'}${Math.random() * 150 + 50}px, ${Math.random() > 0.5 ? '+' : '-'}${Math.random() * 150 + 50}px);
            opacity: 0;
          }
        }
        
        .noiseOverlay::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          opacity: 0.15;
          mix-blend-mode: overlay;
        }
        
        .particles-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          pointer-events: none;
        }
        
        .particle {
          will-change: transform, opacity;
        }
      `}</style>
    </div>
  );
};