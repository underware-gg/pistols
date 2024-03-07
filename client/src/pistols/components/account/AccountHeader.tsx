import React, { useEffect } from 'react'
import { Grid } from 'semantic-ui-react'
import { useDojoAccount } from '@/dojo/DojoContext'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { useDuelist } from '@/pistols/hooks/useDuelist'
import { ProfilePicSquareButton } from '@/pistols/components/account/ProfilePic'
import { AccountShort } from '@/pistols/components/account/Account'
import { LordsBalance } from '../wallet/LordsBalance'

const Row = Grid.Row
const Col = Grid.Column

export default function AccountHeader({
}) {
  const { account, isMasterAccount } = useDojoAccount()
  const { dispatchSelectDuelist } = usePistolsContext()

  const { name, profilePic } = useDuelist(account?.address)

  useEffect(() => {
    if (isMasterAccount) {
      // router.push('/gate')
    }
  }, [isMasterAccount])

  return (
    <Grid>
      <Row className='ProfilePicHeight' textAlign='center' verticalAlign='middle'>
        <Col width={11} textAlign='right'>
          <h3>{isMasterAccount ? 'Guest' : name}</h3>
          <AccountShort address={account?.address} />
          <h3><LordsBalance address={account.address}/></h3>
        </Col>
        <Col width={5} verticalAlign='middle'>
          <ProfilePicSquareButton profilePic={profilePic} onClick={() => { dispatchSelectDuelist(BigInt(account.address)) }} />
        </Col>
      </Row>
    </Grid>
  );
}

