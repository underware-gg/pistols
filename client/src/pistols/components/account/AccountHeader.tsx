import React from 'react'
import { Grid } from 'semantic-ui-react'
import { useAccount } from '@starknet-react/core'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { usePistolsScene, SceneName } from '@/pistols/hooks/PistolsContext'
import { useDuelist } from '@/pistols/hooks/useDuelist'
import { ProfilePicSquareButton } from '@/pistols/components/account/ProfilePic'
import { FameBalanceDuelist } from '@/pistols/components/account/LordsBalance'

const Row = Grid.Row
const Col = Grid.Column

export default function AccountHeader() {
  const { address, isConnected } = useAccount()
  const { isAnon, duelistId } = useSettings()
  const { dispatchSetScene } = usePistolsScene()
  // const { dispatchSelectDuelistId } = usePistolsContext()

  const { nameDisplay, profilePic } = useDuelist(duelistId)

  const _click = () => {
    if (isAnon) {
      dispatchSetScene(SceneName.Profile)
    } else {
      dispatchSetScene(SceneName.Profile)
    }
  }

  return (
    <Grid>
      <Row className='ProfilePicHeight' textAlign='center'>
        <Col width={4} textAlign='left' verticalAlign='middle'>
          <ProfilePicSquareButton profilePic={profilePic ?? 0} onClick={() => _click()} />
        </Col>
        <Col width={12} textAlign='left' verticalAlign='top'>
          {!isConnected ? <h3>Guest</h3>
            : <>
              <h2>{nameDisplay}</h2>
              {/* <AddressShort address={address} copyLink={'left'} /> */}
              {/* <h5><FameBalance address={address} big /></h5> */}
              <h5><FameBalanceDuelist duelistId={duelistId} big /></h5>
            </>}
        </Col>
      </Row>
    </Grid>
  );
}

