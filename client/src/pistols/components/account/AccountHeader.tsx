import React from 'react'
import { Grid } from 'semantic-ui-react'
import { useAccount } from '@starknet-react/core'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { useDuelist } from '@/pistols/hooks/useDuelist'
import { ProfilePicSquareButton } from '@/pistols/components/account/ProfilePic'
import { AddressShort } from '@/lib/ui/AddressShort'
import { LordsBalance } from '@/pistols/components/account/LordsBalance'
import { useRouter } from 'next/navigation'

const Row = Grid.Row
const Col = Grid.Column

export default function AccountHeader() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const { isAnon, duelistId } = useSettings()
  // const { dispatchSelectDuelistId } = usePistolsContext()

  const { nameDisplay, profilePic } = useDuelist(duelistId)

  const _click = () => {
    if (isAnon) {
      router.push(`/account`)
    } else {
      router.push(`/account`)
    }
  }

  return (
    <Grid>
      <Row className='ProfilePicHeight' textAlign='center'>
        <Col width={11} textAlign='right' verticalAlign='top'>
          {!isConnected ? <h3>Guest</h3>
            : <>
              <h3>{nameDisplay}</h3>
              <AddressShort address={address} copyLink={'left'} />
              <br />
              <LordsBalance address={address} big />
            </>}
        </Col>
        <Col width={5} verticalAlign='middle'>
          <ProfilePicSquareButton profilePic={profilePic ?? 0} onClick={() => _click()} />
        </Col>
      </Row>
    </Grid>
  );
}

