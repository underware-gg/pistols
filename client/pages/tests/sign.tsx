import React, { useEffect, useState } from 'react'
import { Container, Grid } from 'semantic-ui-react'
import { useDojoAccount } from '@/dojo/DojoContext'
import { createTypedMessage } from '@/lib/utils/starknet'
import AppPistols from '@/pistols/components/AppPistols'
import { Account, typedData } from 'starknet'

const Row = Grid.Row
const Col = Grid.Column

export default function IndexPage() {
  return (
    <AppPistols>
      <Container text>
        <Grid>
          <ValidateMessage />
        </Grid>
      </Container>
    </AppPistols>
  );
}

function ValidateMessage() {
  const { account } = useDojoAccount()

  const [validated, setValidated] = useState(false)
  useEffect(() => {
    const _validate = async () => {
      const td = await testTypedData(account)
      setValidated(td)
    }
    _validate()
  }, [])

  return (
    <Row columns={'equal'}>
      <Col>
        [{validated ? 'true' : 'false'}]
      </Col>
    </Row>
  )
}


export async function testTypedData(account: Account) {
  const typedMessage0 = createTypedMessage(['0x01111'])
  const typedMessage1 = createTypedMessage(['0x1111'])
  const typedMessage2 = createTypedMessage(['0x1112'])
  const signature0 = await account.signMessage(typedMessage0)
  const signature1 = await account.signMessage(typedMessage1)
  const signature2 = await account.signMessage(typedMessage2)
  console.log(`typedMessage0`, typedMessage0)
  console.log(`typedMessage1`, typedMessage1)
  console.log(`typedMessage2`, typedMessage2)
  console.log(`messageHash0`, typedData.getMessageHash(typedMessage0, account.address))
  console.log(`messageHash1`, typedData.getMessageHash(typedMessage1, account.address))
  console.log(`messageHash2`, typedData.getMessageHash(typedMessage2, account.address))
  console.log(`signature0`, signature0)
  console.log(`signature1`, signature1)
  console.log(`signature2`, signature2)
  console.log(`verifyMessage 0 > 0 (true)`, await account.verifyMessage(typedMessage0, signature0))
  console.log(`verifyMessage 0 > 1 (true)`, await account.verifyMessage(typedMessage0, signature1))
  console.log(`verifyMessage 0 > 2 (false)`, await account.verifyMessage(typedMessage0, signature2))
  console.log(`verifyMessage 1 > 0 (true)`, await account.verifyMessage(typedMessage1, signature0))
  console.log(`verifyMessage 1 > 1 (true)`, await account.verifyMessage(typedMessage1, signature1))
  console.log(`verifyMessage 1 > 2 (false)`, await account.verifyMessage(typedMessage1, signature2))
  console.log(`verifyMessage 2 > 0 (false)`, await account.verifyMessage(typedMessage2, signature0))
  console.log(`verifyMessage 2 > 1 (false)`, await account.verifyMessage(typedMessage2, signature1))
  console.log(`verifyMessage 2 > 2 (true)`, await account.verifyMessage(typedMessage2, signature2))
  let result: boolean = await account.verifyMessage(typedMessage1, signature1)
  return result
}
