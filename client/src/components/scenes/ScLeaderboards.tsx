import React, { useState } from 'react';
import { Container, Grid, Header, Table, Button, Segment, Pagination, Icon } from 'semantic-ui-react';
import { ProfilePoster } from '/src/components/ui/ProfilePoster';
import { useGameAspect } from '/src/hooks/useGameAspect';

interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  wins: number;
  losses: number;
  avatar: string;
}

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

  function PlayerRow({ player, rank }: { player: LeaderboardEntry, rank: number }) {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          padding: aspectWidth(0.2),
          backgroundColor: isHovered ? 'rgba(255,255,255,0.05)' : 'transparent',
          marginBottom: aspectWidth(0.4),
          borderRadius: aspectWidth(0.3),
          transition: 'all 0.2s ease-in-out',
          transform: isHovered ? 'scale(1.01)' : 'scale(1)',
        }}
      >
        <Grid columns={5}>
          <Grid.Column width={2} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ fontSize: aspectWidth(1.2), color: 'white' }}>#{rank}</div>
          </Grid.Column>
          
          <Grid.Column width={5}>
            <div style={{ fontSize: aspectWidth(1.2), color: 'lightskyblue' }}>{player.name}</div>
          </Grid.Column>

          <Grid.Column width={3}>
            <div style={{ fontSize: aspectWidth(0.9), color: '#888' }}>Score:</div>
            <div style={{ fontSize: aspectWidth(1.1), fontWeight: 'bold', color: 'gold' }}>{player.score}</div>
          </Grid.Column>

          <Grid.Column width={3}>
            <div style={{ fontSize: aspectWidth(0.9), color: '#888' }}>Wins:</div>
            <div style={{ fontSize: aspectWidth(1.1), fontWeight: 'bold', color: 'green' }}>{player.wins}</div>
          </Grid.Column>

          <Grid.Column width={3}>
            <div style={{ fontSize: aspectWidth(0.9), color: '#888' }}>Losses:</div>
            <div style={{ fontSize: aspectWidth(1.1), fontWeight: 'bold', color: 'red' }}>{player.losses}</div>
          </Grid.Column>
        </Grid>
      </div>
    );
  }

  const currentSeason: Season = {
    id: 'current',
    name: 'Season 8',
    participants: 256,
    highScore: 2450,
    timeLeft: '3d 12h',
  };

  const pastSeasons: Season[] = [
    { id: 'season7', name: 'Season 7', participants: 248, highScore: 2320, timeLeft: '0', winner: 'DragonMaster' },
    { id: 'season6', name: 'Season 6', participants: 210, highScore: 2180, timeLeft: '0', winner: 'ShadowHunter' },
    { id: 'season5', name: 'Season 5', participants: 185, highScore: 2050, timeLeft: '0', winner: 'MysticWizard' },
    { id: 'season4', name: 'Season 4', participants: 160, highScore: 1920, timeLeft: '0', winner: 'ElectricKnight' },
    { id: 'season3', name: 'Season 3', participants: 135, highScore: 1790, timeLeft: '0', winner: 'FlameBringer' },
    { id: 'season2', name: 'Season 2', participants: 110, highScore: 1660, timeLeft: '0', winner: 'AquaPhoenix' },
    { id: 'season1', name: 'Season 1', participants: 85, highScore: 1530, timeLeft: '0', winner: 'EarthShaker' },
  ];

  const topPlayers: LeaderboardEntry[] = [
    { id: 'player1', name: 'DragonMaster', score: 2450, wins: 32, losses: 4, avatar: '/avatars/1.png' },
    { id: 'player2', name: 'ShadowHunter', score: 2380, wins: 29, losses: 8, avatar: '/avatars/2.png' },
    { id: 'player3', name: 'MysticWizard', score: 2315, wins: 27, losses: 10, avatar: '/avatars/3.png' },
  ];

  const leaderboardEntries: LeaderboardEntry[] = [
    { id: 'player4', name: 'ElectricKnight', score: 2280, wins: 25, losses: 12, avatar: '/avatars/4.png' },
    { id: 'player5', name: 'FlameBringer', score: 2245, wins: 24, losses: 13, avatar: '/avatars/5.png' },
    { id: 'player6', name: 'AquaPhoenix', score: 2210, wins: 23, losses: 15, avatar: '/avatars/6.png' },
    { id: 'player7', name: 'EarthShaker', score: 2175, wins: 22, losses: 16, avatar: '/avatars/7.png' },
    { id: 'player8', name: 'WindWalker', score: 2140, wins: 21, losses: 18, avatar: '/avatars/8.png' },
    { id: 'player9', name: 'NightOwl', score: 2105, wins: 20, losses: 19, avatar: '/avatars/9.png' },
    { id: 'player10', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player11', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player12', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player13', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player14', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player15', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player16', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player17', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player18', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player19', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player20', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player21', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player22', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player23', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player24', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player25', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player4', name: 'ElectricKnight', score: 2280, wins: 25, losses: 12, avatar: '/avatars/4.png' },
    { id: 'player5', name: 'FlameBringer', score: 2245, wins: 24, losses: 13, avatar: '/avatars/5.png' },
    { id: 'player6', name: 'AquaPhoenix', score: 2210, wins: 23, losses: 15, avatar: '/avatars/6.png' },
    { id: 'player7', name: 'EarthShaker', score: 2175, wins: 22, losses: 16, avatar: '/avatars/7.png' },
    { id: 'player8', name: 'WindWalker', score: 2140, wins: 21, losses: 18, avatar: '/avatars/8.png' },
    { id: 'player9', name: 'NightOwl', score: 2105, wins: 20, losses: 19, avatar: '/avatars/9.png' },
    { id: 'player10', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player11', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player12', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player13', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player14', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player15', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player16', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player17', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player18', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player19', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player20', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player21', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player22', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player23', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player24', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player25', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player4', name: 'ElectricKnight', score: 2280, wins: 25, losses: 12, avatar: '/avatars/4.png' },
    { id: 'player5', name: 'FlameBringer', score: 2245, wins: 24, losses: 13, avatar: '/avatars/5.png' },
    { id: 'player6', name: 'AquaPhoenix', score: 2210, wins: 23, losses: 15, avatar: '/avatars/6.png' },
    { id: 'player7', name: 'EarthShaker', score: 2175, wins: 22, losses: 16, avatar: '/avatars/7.png' },
    { id: 'player8', name: 'WindWalker', score: 2140, wins: 21, losses: 18, avatar: '/avatars/8.png' },
    { id: 'player9', name: 'NightOwl', score: 2105, wins: 20, losses: 19, avatar: '/avatars/9.png' },
    { id: 'player10', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player11', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player12', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player13', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player14', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player15', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player16', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player17', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player18', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player19', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player20', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player21', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player22', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player23', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player24', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player25', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player4', name: 'ElectricKnight', score: 2280, wins: 25, losses: 12, avatar: '/avatars/4.png' },
    { id: 'player5', name: 'FlameBringer', score: 2245, wins: 24, losses: 13, avatar: '/avatars/5.png' },
    { id: 'player6', name: 'AquaPhoenix', score: 2210, wins: 23, losses: 15, avatar: '/avatars/6.png' },
    { id: 'player7', name: 'EarthShaker', score: 2175, wins: 22, losses: 16, avatar: '/avatars/7.png' },
    { id: 'player8', name: 'WindWalker', score: 2140, wins: 21, losses: 18, avatar: '/avatars/8.png' },
    { id: 'player9', name: 'NightOwl', score: 2105, wins: 20, losses: 19, avatar: '/avatars/9.png' },
    { id: 'player10', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player11', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player12', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player13', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player14', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player15', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player16', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player17', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player18', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player19', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player20', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player21', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player22', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player23', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player24', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    { id: 'player25', name: 'DuskRider', score: 2070, wins: 19, losses: 21, avatar: '/avatars/10.png' },
    
  ];

  const handleSeasonSelect = (seasonId: string) => {
    setSelectedSeason(seasonId);
  };

  const itemsPerPage = 10;
  const startIndex = (activePage - 1) * itemsPerPage;
  const paginatedEntries = leaderboardEntries.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, width: aspectWidth(100), height: aspectHeight(84), display: 'flex' }}>
      {/* Left Side - Seasons */}
      <div style={{ flex: '1', padding: aspectWidth(1) }}>
        <Segment style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Header as="h3" style={{ color: 'white', textAlign: 'center', marginBottom: '20px' }}>CURRENT SEASON</Header>
          
          <SeasonRow 
            season={currentSeason}
            isSelected={selectedSeason === currentSeason.id}
            onClick={() => setSelectedSeason(currentSeason.id)}
          />
          
          <div className='TextDivider bright LeaderboardsDivider EqualMargin'>Past Seasons</div>
          
          <div style={{ overflow: 'auto', flex: 1 }}>
            {pastSeasons.map(season => (
              <SeasonRow
                key={season.id}
                season={season}
                isSelected={selectedSeason === season.id}
                onClick={() => setSelectedSeason(season.id)}
              />
            ))}
          </div>
        </Segment>
      </div>

      {/* Right Side - Leaderboard */}
      <div style={{ flex: '1.3', padding: aspectWidth(1) }}>
        <Segment style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Header as="h2" style={{ color: 'white', marginBottom: aspectHeight(2) }}>Standings:</Header>
          
          {/* Top 3 players podium - 40% height */}
          <div style={{ height: '40%', position: 'relative', marginBottom: aspectHeight(2), display: 'flex', justifyContent: 'space-evenly', flexDirection: 'row' }}>
            {/* 2nd place */}
            <div style={{ height: '85%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <ProfilePoster 
                playerAddress={0x1234567890123456789012345678901234567890n}
                _close={() => {}}
                isSmall={true}
                isVisible={true}
                isFlipped={true}
                instantVisible={true}
                isHighlightable={false}
              />
              <Header as="h3" style={{ color: 'silver', margin: aspectHeight(1) }}>2ᴺᴰ</Header>
            </div>

            {/* 1st place */}
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <ProfilePoster 
                playerAddress={0x1234567890123456789012345678901234567890n}
                _close={() => {}}
                isSmall={true}
                isVisible={true}
                isFlipped={true}
                instantVisible={true}
                isHighlightable={false}
              />
              <Header as="h3" style={{ color: 'gold', margin: aspectHeight(1) }}>1ˢᵀ</Header>
            </div>

            {/* 3rd place */}
            <div style={{ height: '70%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <ProfilePoster 
                playerAddress={0x1234567890123456789012345678901234567890n}
                _close={() => {}}
                isSmall={true}
                isVisible={true}
                isFlipped={true}
                instantVisible={true}
                isHighlightable={false}
              />
              <Header as="h3" style={{ color: '#cd7f32', margin: aspectHeight(1) }}>3ᴿᴰ</Header>
            </div>
          </div>

          {/* Scrollable leaderboard - 60% height */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            {paginatedEntries.map((entry, index) => (
              <PlayerRow 
                key={entry.id} 
                player={entry} 
                rank={startIndex + index + 4}
              />
            ))}
          </div>

          {/* Pagination */}
          <div style={{ padding: aspectHeight(2), textAlign: 'center' }}>
            <Pagination
              activePage={activePage}
              totalPages={Math.ceil(leaderboardEntries.length / itemsPerPage)}
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