import React, { useMemo } from 'react'
import { Container, Table } from 'semantic-ui-react'
import { constants } from '@underware_gg/pistols-sdk/pistols'
import App from '/src/components/App'
import { makeProfilePicUrl } from '/src/components/account/ProfilePic'

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

export default function DuelistProfilesPage() {
  return (
    <App>
      <Container>
        <br />
        <Profiles name='Duelists' profiles={constants.DUELIST_PROFILES as unknown as Profiles} />
        <br />
        <Profiles name='Bots' profiles={constants.BOT_PROFILES as unknown as Profiles} isBot />
        <br />
      </Container>
    </App>
  );
}


function Profiles({
  name,
  profiles,
  isBot = false,
}: {
  name: string,
  profiles: Profiles,
  isBot?: boolean,
}) {
  const style = { width: 'auto', height: '100px', backgroundColor: 'black' }

  const rows = useMemo(() => {
    return Object.entries(profiles).map(([key, profile]) => {
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
            <img src={makeProfilePicUrl(profile.profile_id, false, isBot)} style={style} />
            {` `}
            <img src={makeProfilePicUrl(profile.profile_id, true, isBot)} style={style} />
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
            <h3 className='Important'>Key</h3>
          </HeaderCell>
          <HeaderCell>
            <h3 className='Important'>Name</h3>
          </HeaderCell>
          <HeaderCell>
            <h3 className='Important'>Profile Pic</h3>
          </HeaderCell>
        </Row>
      </Header>

      <Body>
        {rows}
      </Body>
    </Table>
  )
}
