import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Grid } from 'semantic-ui-react'
import { useDojo } from '@/dojo/DojoContext'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { AccountShort } from '@/pistols/components/ui/Account'
import { useDuelist } from '@/pistols/hooks/useDuelist'

const Row = Grid.Row
const Col = Grid.Column

export default function AccountHeader({
}) {
  const router = useRouter()
  const { account: { account, isMasterAccount } } = useDojo()

  const { name } = useDuelist(account?.address)

  useEffect(() => {
    if (isMasterAccount) {
      // router.push('/gate')
    }
  }, [isMasterAccount])

  return (
    <Grid>
      <Row textAlign='center'>
        <Col width={4}>
          <AccountShort address={account?.address} />
        </Col>
        <Col width={8}>
          <h3>{isMasterAccount ? 'MASTER ACCOUNT' : name}</h3>
        </Col>
        <Col width={4}>
          <ActionButton label='Switch Account' onClick={() => router.push('/gate')} />
        </Col>
      </Row>
    </Grid>
  );
}

