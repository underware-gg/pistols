import React from 'react'
import { useRouter } from 'next/navigation'
import { Grid } from 'semantic-ui-react'
import { useDojoAccount } from '@/lib/dojo/DojoContext'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { useDuelist } from '@/pistols/hooks/useDuelist'
import { ProfilePicSquareButton } from '@/pistols/components/account/ProfilePic'
import { AddressShort } from '@/lib/ui/AddressShort'
import { LordsBalance } from '@/pistols/components/account/LordsBalance'

const Row = Grid.Row
const Col = Grid.Column

export default function AccountHeader({
}) {
  const router = useRouter()
  const { accountAddress, isGuest } = useDojoAccount()
  const { dispatchSelectDuelist } = usePistolsContext()

  const { name, profilePic } = useDuelist(accountAddress)

  const _click = () => {
    if(isGuest) {
      router.push('/gate')
    } else {
      dispatchSelectDuelist(accountAddress) 
    }
  }

  return (
    <Grid>
      <Row className='ProfilePicHeight' textAlign='center'>
        <Col width={11} textAlign='right' verticalAlign='top'>
          {isGuest ?
            <h3>Guest</h3>
            : <>
              <h3>{name}</h3>
              <AddressShort address={accountAddress} copyLink={true} />
              <br />
              <LordsBalance address={accountAddress} big />
            </>}
        </Col>
        <Col width={5} verticalAlign='middle'>
          <ProfilePicSquareButton profilePic={profilePic ?? 0} onClick={() => _click()} />
        </Col>
      </Row>
    </Grid>
  );
}

