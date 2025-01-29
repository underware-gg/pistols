import React, { useMemo } from 'react'
import { Container, Table } from 'semantic-ui-react'
import { makeProfilePicUrl } from '/src/components/account/ProfilePic'
import { constants } from '@underware_gg/pistols-sdk/pistols'
import { BackToTestPageIndex } from '/src/pages/tests/TestPageIndex'
import CurrentChainHint from '/src/components/CurrentChainHint'
import AppDojo from '/src/components/AppDojo'

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
    <AppDojo>
      <Container>
        <BackToTestPageIndex />
        <CurrentChainHint />
        <br />
        <Profiles profiles={constants.DUELIST_PROFILES as unknown as Profiles} profileType={constants.ProfileType.Duelist} />
        <br />
        <Profiles profiles={constants.CHARACTER_PROFILES as unknown as Profiles} profileType={constants.ProfileType.Character} />
        <br />
        <Profiles profiles={constants.BOT_PROFILES as unknown as Profiles} profileType={constants.ProfileType.Bot} />
        <br />
      </Container>
    </AppDojo>
  );
}


function Profiles({
  profiles,
  profileType,
}: {
  profiles: Profiles,
  profileType: constants.ProfileType,
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
            <img src={makeProfilePicUrl(profile.profile_id, false, profileType)} style={style} />
            {` `}
            <img src={makeProfilePicUrl(profile.profile_id, true, profileType)} style={style} />
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
