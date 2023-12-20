import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Grid } from 'semantic-ui-react'
import { useDojo } from '@/dojo/DojoContext'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { AccountShort } from '@/pistols/components/ui/Account'
import { useDuelist } from '@/pistols/hooks/useDuelist'
import { ProfilePicButton } from '@/pistols/components/account/ProfilePic'

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
    <div className='AccountHeader'>
      <Grid>
        <Row textAlign='center' verticalAlign='middle'>
          <Col width={15} textAlign='right'>
            <h3>{isMasterAccount ? 'MASTER ACCOUNT' : name}</h3>
            <AccountShort address={account?.address} />
          </Col>
          <Col width={1}>
            <ProfilePicButton profilePic={profilePic} onSelect={() => { router.push('/gate') }} />
          </Col>
        </Row>
      </Grid>
    </div>
  );
}

