import React, { useState } from 'react'
import { Table } from 'semantic-ui-react'
import { useAccount } from '@starknet-react/core'
import { useDojoSystemCalls } from '@underware_gg/pistols-sdk/dojo'
import { useAdminAmIOwner, useAdminIsOwner } from '/src/hooks/useContractCalls'
import { FormInput } from '/src/components/ui/Form'
import { ActionButton } from '/src/components/ui/Buttons'
import { useValidateWalletAddress, STARKNET_ADDRESS_LENGTHS } from '@underware_gg/pistols-sdk/utils'

const Row = Table.Row
const Cell = Table.Cell
const Body = Table.Body
const Header = Table.Header
const HeaderCell = Table.HeaderCell

export const OwnerForm = ({
}: {
  }) => {
  const [inputAddress, setInputAddres] = useState('0x123')
  const { validatedAddress, isStarknetAddress } = useValidateWalletAddress(inputAddress)
  const { isOwner } = useAdminIsOwner(validatedAddress)

  const { account } = useAccount()
  const { grant_admin } = useDojoSystemCalls()
  const { IAmOwner } = useAdminAmIOwner()

  const canGrant = (IAmOwner && isStarknetAddress && !isOwner)
  const canRevoke = (IAmOwner && isStarknetAddress && isOwner)

  const _grant = (granted: boolean) => {
    grant_admin(account, validatedAddress, granted)
  }

  return (
    <div>
      {/* <h3>{tag}</h3> */}
      <Table celled striped color='orange' size='small'>
        <Header>
          <Row>
            <HeaderCell width={4}><h3>Grant Admin Permissions</h3></HeaderCell>
            <HeaderCell></HeaderCell>
          </Row>
        </Header>
        <Body>
          <Row>
            <Cell>Account Address</Cell>
            <Cell>
              <FormInput
                label={null}
                placeholder={null}
                value={inputAddress}
                setValue={setInputAddres}
                code={true}
                maxLength={STARKNET_ADDRESS_LENGTHS[0]}
              />
            </Cell>
          </Row>
          <Row>
            <Cell></Cell>
            <Cell>
              <ActionButton important fill label={IAmOwner ? 'GRANT' : 'NOT ADMIN'} disabled={!canGrant} onClick={() => _grant(true)} />
              <ActionButton important fill label={IAmOwner ? 'REVOKE' : 'NOT ADMIN'} disabled={!canRevoke} onClick={() => _grant(false)} />
            </Cell>
          </Row>
        </Body>
      </Table>
    </div>
  )
}
