import React, { useMemo } from 'react'
import { Container, Table } from 'semantic-ui-react'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { makeProfilePicUrl } from '@underware/pistols-sdk/pistols'
import { duelist_token, duel_token } from '@underware/pistols-sdk/pistols/tokens'
import { DuelistTokenImage, DuelTokenImage } from '@underware/pistols-sdk/pistols/components'
import { map } from '@underware/pistols-sdk/utils'
import { TestPageMenu } from '/src/pages/tests/TestPageIndex'
import App from '/src/components/App'

// const Row = Grid.Row
// const Col = Grid.Column
const Row = Table.Row
const Cell = Table.Cell
const Body = Table.Body
const Header = Table.Header
const HeaderCell = Table.HeaderCell

type Profiles = {
  [key: string]: constants.ProfileDescriptor,
}

export default function ProfilesTestPage() {
  return (
    <App subtitle='Test: Profiles'>
      <Container>
        <TestPageMenu />
        <br />
        <Profiles profiles={constants.GENESIS_PROFILES as unknown as Profiles} profileType={constants.DuelistProfile.Genesis} />
        <br />
        <Profiles profiles={constants.LEGENDS_PROFILES as unknown as Profiles} profileType={constants.DuelistProfile.Legends} />
        <br />
        <Profiles profiles={constants.PIRATES_PROFILES as unknown as Profiles} profileType={constants.DuelistProfile.Pirates} />
        <br />
        <Profiles profiles={constants.CHARACTER_PROFILES as unknown as Profiles} profileType={constants.DuelistProfile.Character} />
        <br />
        <Profiles profiles={constants.BOT_PROFILES as unknown as Profiles} profileType={constants.DuelistProfile.Bot} />
        <br />
      </Container>
    </App>
  );
}


const USERNAMES = [
  'Patron', 'Lord Stirling', 'Captain Blood', 'Ser Walker', 'Lady Vengeance',
  'Duke of Iron', 'Annie Oakley', 'Wild Bill', 'Doc Holliday', 'Billy the Kid',
  'Baron von Dueling', 'Red Jack', 'Whiskey Joe', 'Madame Rouge', 'El Bandido',
  'Blackbeard', 'Quick Draw McGhee', 'Silver Bullet', 'The Undertaker', 'Mataleone',
  'Recipromancer', 'The Outlaw', 'Grim Reaper', 'Calico Jack', 'Lone Ranger',
  'Copperhead', 'Dead-Eye Dan', 'Sheriff Stone', 'Baroness Raven', 'Marshal Dillon',
];

const _randomUsername = () => USERNAMES[Math.floor(Math.random() * USERNAMES.length)];

const _randomFame = (archetype: constants.Archetype) => {
  const rookie = (archetype == constants.Archetype.Undefined);
  const dead = (Math.random() > 0.8);
  const fame = dead ? 0 : rookie ? 3000 : Math.floor(100 + Math.random() * 500) * 10;
  return {
    rookie,
    dead,
    fame,
    lives: Math.floor(fame / 1000),
  }
}

const _randomArchetype = () => {
  const archetype = constants.getArchetypeFromValue(Math.floor(Math.random() * Object.keys(constants.Archetype).length))
  const honour =
    archetype == constants.Archetype.Honourable ? Math.floor(map(Math.random(), 0, 1, constants.HONOUR.LORD_START, 100) + 1)
      : archetype == constants.Archetype.Trickster ? Math.floor(map(Math.random(), 0, 1, constants.HONOUR.TRICKSTER_START, constants.HONOUR.LORD_START))
        : archetype == constants.Archetype.Villainous ? Math.floor(map(Math.random(), 0, 1, 0, constants.HONOUR.TRICKSTER_START))
          : 0
  return { archetype, honour }
}

const PREMISES = [
  constants.Premise.Honour,
  constants.Premise.Debt,
  constants.Premise.Dispute,
  constants.Premise.Hatred,
  constants.Premise.Blood,
  constants.Premise.Matter,
  constants.Premise.Nothing,
  constants.Premise.Tournament,
  constants.Premise.Treaty,
  constants.Premise.Lesson,
];

const _randomPremise = () => {
  return PREMISES[Math.floor(Math.random() * PREMISES.length)];
}

const DUEL_TYPES = [
  constants.DuelType.Seasonal,
  constants.DuelType.Ranked,
  constants.DuelType.Unranked,
  constants.DuelType.Tournament,
  constants.DuelType.Practice,
  constants.DuelType.BotPlayer,
];

const _randomDuelType = () => DUEL_TYPES[Math.floor(Math.random() * DUEL_TYPES.length)];

const _randomSeasonId = (duelType: constants.DuelType) => {
  if (duelType === constants.DuelType.Practice || duelType === constants.DuelType.Unranked) {
    return Math.random() > 0.5 ? 0 : Math.floor(1 + Math.random() * 3);
  }
  return Math.floor(1 + Math.random() * 4);
};

const QUOTES = [
  "Choose your steps, quick!",
  "Decide on your steps now!",
  "What's your plan? Choose fast!",
  "Make your move, no delay!",
  "Pick your steps, time's short!",
  "I demand satisfaction for your insolence!",
  "Ten paces, then turn and fire.",
  "You will regret crossing me!",
  "Pay what you owe, coward.",
  "Your honour is worth nothing to me.",
  "May your aim be true, for you'll need it.",
  "At dawn, one of us will not walk away.",
  "Draw!",
];

const _randomQuote = () => {
  if (Math.random() < 0.60) return ''; // ~60% of duels do not include a message
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}

const _randomChallengeStateAndWinner = () => {
  const rand = Math.random();
  if (rand < 0.35) {
    return { state: constants.ChallengeState.Resolved, winner: 1 };
  } else if (rand < 0.65) {
    return { state: constants.ChallengeState.Resolved, winner: 2 };
  } else if (rand < 0.76) {
    return { state: constants.ChallengeState.Draw, winner: 0 };
  } else if (rand < 0.85) {
    return { state: constants.ChallengeState.Awaiting, winner: 0 };
  } else if (rand < 0.92) {
    return { state: constants.ChallengeState.InProgress, winner: 0 };
  } else if (rand < 0.96) {
    return { state: constants.ChallengeState.Expired, winner: 0 };
  } else {
    return {
      state: Math.random() > 0.5 ? constants.ChallengeState.Withdrawn : constants.ChallengeState.Refused,
      winner: 0
    };
  }
};

const PROFILE_TYPES = [
  constants.DuelistProfile.Genesis,
  constants.DuelistProfile.Legends,
  constants.DuelistProfile.Pirates,
  constants.DuelistProfile.Character,
  constants.DuelistProfile.Bot,
];
const _randomProfileType = () => PROFILE_TYPES[Math.floor(Math.random() * PROFILE_TYPES.length)];

function Profiles({
  profiles,
  profileType,
}: {
  profiles: Profiles,
  profileType: constants.DuelistProfile,
}) {
  const style = { width: 'auto', height: '300px', backgroundColor: 'black' }

  const props = useMemo(() => {
    return Object.entries(profiles).map(([key, profile], index) => {
      const { archetype, honour } = _randomArchetype()
      const { fame, lives, rookie, dead } = _randomFame(archetype)
      const is_dueling = (honour > 0 && !dead && Math.random() > 0.25);
      const prop: duelist_token.DuelistSvgProps = {
        // base_uri: 'https://localhost:5173',
        duelist_id: 10 + index,
        owner: `0x05736129784523893${index}`,
        username: _randomUsername(),
        honour,
        archetype,
        profile_type: profileType,
        profile_id: index,
        total_duels: rookie ? 0 : 10,
        total_wins: rookie ? 0 : 4,
        total_losses: rookie ? 0 : 3,
        total_draws: rookie ? 0 : 3,
        fame,
        lives,
        is_memorized: false,
        duel_id: (is_dueling) ? Math.floor(100 + Math.random() * 900) : 0,
        pass_id: (is_dueling) ? (Math.random() > 0.5 ? 100 : 0) : 0,
        timestamp_registered: 0x1,
        timestamp_active: 0x6814fbaa,
        level: (1 + Math.floor(Math.random() * 4)),
      };
      return { profile, prop }
    })
  }, [profiles])

  const rows = useMemo(() => {
    return props.map((e, index) => {
      const { profile, prop } = e;
      const { state, winner } = _randomChallengeStateAndWinner();
      const duel_type = _randomDuelType();
      const season_id = _randomSeasonId(duel_type);
      const nextProfileIndex = (index < props.length - 1) ? index + 1 : 0;
      const oppProfileType = Math.random() > 0.4 ? _randomProfileType() : props[nextProfileIndex].prop.profile_type;
      const oppProfileId = Math.random() > 0.4 ? Math.floor(Math.random() * 12) : props[nextProfileIndex].prop.profile_id;
      const oppUsername = _randomUsername();

      const duel_prop: duel_token.DuelSvgProps = {
        // base_uri: 'https://localhost:5173',
        duel_id: Math.floor(100 + Math.random() * 900),
        duel_type,
        premise: _randomPremise(),
        message: _randomQuote(),
        state,
        winner,
        season_id,
        profile_type_a: prop.profile_type,
        profile_type_b: oppProfileType,
        profile_id_a: prop.profile_id,
        profile_id_b: oppProfileId,
        username_a: prop.username,
        username_b: oppUsername,
        address_a: prop.owner,
        address_b: `0x09876543210123456${index}`,
      };

      return (
        <Row key={`${profileType}-${prop.profile_id}`} className='ModalText'>
          <Cell className='Code'>
            {prop.profile_id}
          </Cell>
          <Cell className='Inactive'>
            {profileType}
          </Cell>
          <Cell>
            {profile.name}
          </Cell>
          <Cell>
            <img src={makeProfilePicUrl(prop.profile_id, profileType)} style={style} />
          </Cell>
          <Cell>
            <DuelistTokenImage props={prop} style={style} />
          </Cell>
          <Cell>
            <DuelTokenImage props={duel_prop} style={style} />
          </Cell>
        </Row>
      )
    })
  }, [props])

  return (
    <Table attached>
      <Header fullWidth>
        <Row>
          <HeaderCell>
            <h3 className='Important'>#</h3>
          </HeaderCell>
          <HeaderCell>
            <h3 className='Important'>{profileType}</h3>
          </HeaderCell>
          <HeaderCell>
            <h3 className='Important'>Name</h3>
          </HeaderCell>
          <HeaderCell>
            <h3 className='Important'>Profile Pic</h3>
          </HeaderCell>
          <HeaderCell>
            <h3 className='Important'>Duelist Token</h3>
          </HeaderCell>
          <HeaderCell>
            <h3 className='Important'>Random Duel Token</h3>
          </HeaderCell>
        </Row>
      </Header>

      <Body>
        {rows}
      </Body>
    </Table>
  )
}
