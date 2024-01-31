import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Grid } from 'semantic-ui-react'
import { useDojo } from '@/dojo/DojoContext'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { AccountShort } from '@/pistols/components/ui/Account'
import { useDuelist } from '@/pistols/hooks/useDuelist'
import { ProfilePicSquareButton } from '@/pistols/components/account/ProfilePic'

const Row = Grid.Row
const Col = Grid.Column

export default function AccountHeader({
}) {
  const router = useRouter()
  const { account: { account, isMasterAccount } } = useDojo()

  const { name, profilePic } = useDuelist(account?.address)

  useEffect(() => {
    if (isMasterAccount) {
      // router.push('/gate')
    }
  }, [isMasterAccount])

  return (
    <Grid>
      <Row className='ProfilePicHeight' textAlign='center' verticalAlign='middle'>
        <Col width={12} textAlign='right'>
          <h3>{isMasterAccount ? 'MASTER ACCOUNT' : name}</h3>
          <AccountShort address={account?.address} />
        </Col>
        <Col width={4}>
          <ProfilePicSquareButton profilePic={profilePic} onClick={() => { router.push('/gate') }} />
        </Col>
      </Row>
    </Grid>
  );
}

