import React, { useEffect, useMemo, useState } from 'react'
import { Table } from 'semantic-ui-react'
import { Component, Entity } from '@dojoengine/recs'
import { useAccount } from '@starknet-react/core'
import { useComponentValue } from '@dojoengine/react'
import { useDojoComponents, useDojoSystemCalls } from '@/lib/dojo/DojoContext'
import { useAdminAmIOwner } from '@/pistols/hooks/useContractCalls'
import { FormInput, FormCheckbox, FormSelectFromMap } from '@/pistols/components/ui/Form'
import { TableSwitcher } from '@/pistols/components/TableModal'
import { Balance } from '@/pistols/components/account/Balance'
import { bigintToEntity, bigintToHex, isBigint, isNumeric } from '@/lib/utils/types'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { feltToString, STARKNET_ADDRESS_LENGTHS, stringToFelt } from '@/lib/utils/starknet'
import { TableTypeNameToValue, CONFIG, DeckTypeNameToValue } from '@/games/pistols/generated/constants'

const Row = Table.Row
const Cell = Table.Cell
const Body = Table.Body
const Header = Table.Header
const HeaderCell = Table.HeaderCell

enum FieldType {
  String,
  ShortString,
  Address,
  Wei,
  Number,
  Boolean,
  TableType,
  DeckType,
}

type FormSchema = {
  [key: string]: {
    type: FieldType
    isKey?: boolean
  }
}

const config_schema: FormSchema = {
  key: { type: FieldType.Number, isKey: true },
  treasury_address: { type: FieldType.Address },
  is_paused: { type: FieldType.Boolean },
}

const table_config_schema: FormSchema = {
  table_id: { type: FieldType.ShortString, isKey: true },
  table_type: { type: FieldType.TableType },
  deck_type: { type: FieldType.DeckType },
  description: { type: FieldType.ShortString },
  fee_collector_address: { type: FieldType.Address },
  fee_contract_address: { type: FieldType.Address },
  fee_min: { type: FieldType.Wei },
  is_open: { type: FieldType.Boolean },
}

export const ConfigForm = ({
}: {
  }) => {
  const { Config } = useDojoComponents()
  const entityKey = useMemo(() => bigintToEntity(CONFIG.CONFIG_KEY), [])

  const { account } = useAccount()
  const { admin_set_config } = useDojoSystemCalls()
  const storeComponent = (values: any) => {
    admin_set_config(account, values)
  }

  return (
    <div>
      <ComponentForm
        schema={config_schema}
        component={Config}
        entityKey={entityKey}
        storeComponent={storeComponent}
      />
    </div>
  )
}

export const TableConfigForm = ({
}: {
  }) => {
  const [tableId, setTableId] = useState<string>()

  const { TableConfig } = useDojoComponents()
  const entityKey = useMemo(() => (tableId ? bigintToEntity(stringToFelt(tableId)) : null), [tableId])

  const { account } = useAccount()
  const { admin_set_table } = useDojoSystemCalls()
  const storeComponent = (values: any) => {
    admin_set_table(account, values)
  }

  return (
    <div>
      <TableSwitcher selectedTableId={tableId} setSelectedTableId={setTableId} />
      <ComponentForm
        schema={table_config_schema}
        component={TableConfig}
        entityKey={entityKey}
        storeComponent={storeComponent}
      />
    </div>
  )
}




export const ComponentForm = ({
  schema,
  component,
  entityKey,
  storeComponent,
}: {
  schema: FormSchema
  component: Component
  entityKey: Entity
  storeComponent: (values: any) => void
}) => {
  const [input_values, setTableInput] = useState({})

  const { IAmOwner } = useAdminAmIOwner()
  const comp_values = useComponentValue(component, entityKey)
  const component_values = useMemo(() => {
    let result = { ...comp_values }
    return result
  }, [comp_values])

  useEffect(() => {
    setTableInput({ ...component_values })
  }, [component_values])

  const canEdit = (component != null && entityKey != null && IAmOwner)

  const tag = useMemo<string>(() => (component?.metadata?.name as string), [component])
  const fields = useMemo(() => {
    return (component) ? Object.keys(component.schema).map((key) => {
      const fieldType = schema[key].type
      const readOnly = schema[key].isKey || !canEdit
      let value: any = input_values[key]
      const warning = (value != component_values?.[key])
      if (fieldType == FieldType.ShortString) value = feltToString(value ?? 0)
      else if (fieldType == FieldType.Address) value = bigintToHex(value ?? 0)
      else if (fieldType == FieldType.Wei || fieldType == FieldType.Number) value = value?.toString() ?? '00'
      // console.log(`F:`, key, fieldType, value)
      return (
        <Field key={key}
          name={key}
          fieldType={fieldType}
          readOnly={readOnly}
          value={value}
          code={fieldType == FieldType.Address || fieldType == FieldType.Wei || fieldType == FieldType.Number}
          warning={warning}
          setValue={(newValue) => {
            if (fieldType == FieldType.Address && !isBigint(newValue)) return
            if (fieldType == FieldType.Number && !isNumeric(newValue)) return
            if (fieldType == FieldType.Wei && !isNumeric(newValue)) return
            const _value =
              fieldType == FieldType.ShortString ? stringToFelt(newValue)
                : newValue
            console.log(`input:`, key, _value)
            setTableInput({
              ...input_values,
              [key]: _value,
            })
          }} />
      )
    }) : []
  }, [input_values, canEdit])


  return (
    <div>
      {/* <h3>{tag}</h3> */}
      <Table celled striped color='orange' size='small'>
        <Header>
          <Row>
            <HeaderCell width={4}><h3>{tag}</h3></HeaderCell>
            <HeaderCell></HeaderCell>
          </Row>
        </Header>
        <Body>
          {fields}
          <Row>
            <Cell></Cell>
            <Cell>
              <ActionButton important fill label={!IAmOwner ? 'NOT ADMIN' : 'STORE'} disabled={!canEdit} onClick={() => storeComponent(input_values)} />
            </Cell>
          </Row>
        </Body>
      </Table>
    </div>
  )
}

export const Field = ({
  name,
  fieldType,
  value,
  setValue,
  readOnly = false,
  code = false,
  warning = false,
  maxLength = 31,
}: {
  name: string,
  fieldType: FieldType | null
  value: any,
  setValue: (v: any) => void
  readOnly?: boolean
  code?: boolean
  warning?: boolean
  maxLength?: number
}) => {
  return (
    <Row warning={warning}>
      <Cell>{name}</Cell>
      <Cell>
        {fieldType == null ? <></>
          : fieldType == FieldType.Boolean ?
            <FormCheckbox
              disabled={readOnly}
              value={value}
              setValue={setValue}
            />
            : fieldType == FieldType.TableType ? <>
              {value}
              <FormSelectFromMap
                map={TableTypeNameToValue}
                label={name}
                disabled={readOnly}
                value={value}
                setValue={setValue}
              />
            </> : fieldType == FieldType.DeckType ? <>
              {value}
              <FormSelectFromMap
                map={DeckTypeNameToValue}
                label={name}
                disabled={readOnly}
                value={value}
                setValue={setValue}
              />
            </> : <>
              {fieldType == FieldType.Wei && <Balance wei={value ?? 0} decimals={18} />}
              <FormInput
                label={null}
                placeholder={null}
                value={value}
                setValue={setValue}
                code={code}
                maxLength={STARKNET_ADDRESS_LENGTHS[0]}
                disabled={readOnly}
              />
            </>
        }
      </Cell>
    </Row>
  )
}

