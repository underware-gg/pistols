import React, { useMemo } from 'react'
import { Container, Table } from 'semantic-ui-react'
import { makeProfilePicUrl } from '/src/components/account/ProfilePic'
import { constants } from '@underware_gg/pistols-sdk/pistols/gen'
import { TestPageMenu } from '/src/pages/tests/TestPageIndex'
import { duelist_token } from '@underware_gg/pistols-sdk/pistols/tokens'
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
        <Profiles profiles={constants.DUELIST_PROFILES as unknown as Profiles} profileType={constants.ProfileType.Duelist} />
        <br />
        <Profiles profiles={constants.CHARACTER_PROFILES as unknown as Profiles} profileType={constants.ProfileType.Character} />
        <br />
        <Profiles profiles={constants.BOT_PROFILES as unknown as Profiles} profileType={constants.ProfileType.Bot} />
        <br />
      </Container>
    </App>
  );
}


const _randomHonour = () => {
  return Math.floor(Math.random() * 100) / 10
}

function Profiles({
  profiles,
  profileType,
}: {
  profiles: Profiles,
  profileType: constants.ProfileType,
}) {
  const style = { width: 'auto', height: '300px', backgroundColor: 'black' }

  const rows = useMemo(() => {
    return Object.entries(profiles).map(([key, profile]) => {
      const honour = _randomHonour()
      const archetype = honour <= 3.5 ? constants.Archetype.Villainous : honour < 7.5 ? constants.Archetype.Trickster : constants.Archetype.Honourable
      const duelist_svg = duelist_token.renderSvg({
        // base_uri: 'https://localhost:5173',
        duelist_id: 16,
        owner: '0x0',
        username: 'Patron',
        honour,
        archetype,
        profile_type: profileType,
        profile_id: profile.profile_id,
        total_duels: 10,
        total_wins: 5,
        total_losses: 2,
        total_draws: 3,
        fame: 4250,
        lives: 4,
        is_memorized: false,
        duel_id: 0,
      }, {
        includeMimeType: true,
      })

      return (
        <Row key={key} className='ModalText'>
          <Cell className='Code'>
            {profile.profile_id}
          </Cell>
          <Cell className='Inactive'>
            {key}
          </Cell>
          <Cell>
            {profile.name}
          </Cell>
          <Cell>
            <img src={makeProfilePicUrl(profile.profile_id, false, profileType)} style={style} />
            {` `}
            <img src={makeProfilePicUrl(profile.profile_id, true, profileType)} style={style} />
          </Cell>
          <Cell>
            <img src={duelist_svg} style={style} />
          </Cell>
        </Row>
      )
    })
  }, [profiles])

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
            <h3 className='Important'>Profile Pics</h3>
          </HeaderCell>
          <HeaderCell>
            <h3 className='Important'>Token</h3>
          </HeaderCell>
        </Row>
      </Header>

      <Body>
        {rows}
      </Body>
    </Table>
  )
}
