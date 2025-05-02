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
  [key: string]: constants.ProfileDescription,
}

export default function ProfilesTestPage() {
  return (
    <App>
      <Container>
        <TestPageMenu />
        <br />
        <Profiles profiles={constants.GENESIS_PROFILES as unknown as Profiles} profileType={constants.DuelistProfile.Genesis} />
        <br />
        <Profiles profiles={constants.CHARACTER_PROFILES as unknown as Profiles} profileType={constants.DuelistProfile.Character} />
        <br />
        <Profiles profiles={constants.BOT_PROFILES as unknown as Profiles} profileType={constants.DuelistProfile.Bot} />
        <br />
      </Container>
    </App>
  );
}


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

const _randomPremise = () => {
  return constants.Premise[Math.floor(Math.random() * Object.keys(constants.Premise).length)] as constants.Premise
}
const _randomQuote = () => {
  const options = [
    "Choose your steps, quick!",
    "Decide on your steps now!",
    "What's your plan? Choose fast!",
    "Make your move, no delay!",
    "Pick your steps, time's short!",
  ];
  return options[Math.floor(Math.random() * options.length)]
}
const _randomChallengeState = () => {
  return constants.getChallengeStateFromValue(Math.floor(Math.random() * Object.keys(constants.ChallengeState).length))
}

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
        duelist_id: 16,
        owner: '0x057361297845238939',
        username: 'Patron',
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
        duel_id: (is_dueling) ? Math.floor(Math.random() * 1000) : 0,
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
      const state = _randomChallengeState()
      const is_finished = (state == constants.ChallengeState.Resolved || state == constants.ChallengeState.Draw);
      const winner = is_finished ? (Math.floor(Math.random() * 3)) : 0;
      let nextProfileIndex = (index < props.length - 1) ? index + 1 : 0;
      const duel_prop: duel_token.DuelSvgProps = {
        // base_uri: 'https://localhost:5173',
        duel_id: Math.floor(Math.random() * 1000),
        duel_type: constants.DuelType.Seasonal,
        premise: _randomPremise(),
        message: _randomQuote(),
        state,
        winner,
        season_id: 1,
        profile_type_a: prop.profile_type,
        profile_type_b: props[nextProfileIndex].prop.profile_type,
        profile_id_a: prop.profile_id,
        profile_id_b: props[nextProfileIndex].prop.profile_id,
        username_a: prop.username,
        username_b: props[nextProfileIndex].prop.username,
        address_a: prop.owner,
        address_b: props[nextProfileIndex].prop.owner,
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
