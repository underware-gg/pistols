import React, { useEffect, useMemo, useState } from 'react'
import { Table } from 'semantic-ui-react'
import { Component, Entity } from '@dojoengine/recs'
import { useAccount } from '@starknet-react/core'
import { useComponentValue } from '@dojoengine/react'
import { useDojoComponents, useDojoSystemCalls } from '@/lib/dojo/DojoContext'
import { useAdminAmIOwner, useAdminIsOwner } from '@/pistols/hooks/useContractCalls'
import { FormInput, FormCheckbox, FormSelectFromMap } from '@/pistols/components/ui/Form'
import { TableSwitcher } from '@/pistols/components/TableModal'
import { Balance } from '@/pistols/components/account/Balance'
import { bigintToEntity, bigintToHex, getObjectKeyByValue, isBigint, isNumeric } from '@/lib/utils/types'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { feltToString, STARKNET_ADDRESS_LENGTHS, stringToFelt } from '@/lib/utils/starknet'
import { getTableType, TableTypeNameToValue, CONFIG } from '@/games/pistols/generated/constants'
import { useValidateWalletAddress } from '@/lib/utils/hooks/useValidateWalletAddress'

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
  const { set_owner } = useDojoSystemCalls()
  const { IAmOwner } = useAdminAmIOwner()

  const canGrant = (IAmOwner && isStarknetAddress && !isOwner)
  const canRevoke = (IAmOwner && isStarknetAddress && isOwner)

  const _grant = (granted: boolean) => {
    set_owner(account, validatedAddress, granted)
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
