import React, { useEffect, useMemo, useState } from 'react'
import { Table } from 'semantic-ui-react'
import { useAccount } from '@starknet-react/core'
import { useDojoSystemCalls } from '@underware_gg/pistols-sdk/dojo'
import { useAdminAmIOwner } from '/src/hooks/usePistolsContractCalls'
import { FormInput, FormCheckbox, FormSelectFromMap } from '/src/components/ui/Form'
import { TableSwitcher } from '/src/components/modals/TableModal'
import { Balance } from '/src/components/account/Balance'
import { bigintToHex, isBigint, isNumeric, feltToString, STARKNET_ADDRESS_LENGTHS, stringToFelt } from '@underware_gg/pistols-sdk/utils'
import { ActionButton } from '/src/components/ui/Buttons'
import { constants } from '@underware_gg/pistols-sdk/pistols/gen'

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
  RulesType,
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
  description: { type: FieldType.ShortString },
  rules: { type: FieldType.RulesType },
}

export const ConfigForm = ({
}: {
  }) => {
  const { account } = useAccount()
  const { admin } = useDojoSystemCalls()
  const storeComponent = (values: any) => {
    admin.set_config(account, values)
  }

  return (
    <div>
      {/* <ComponentForm
        schema={config_schema}
        component={Config}
        entityKey={entityKey}
        storeComponent={storeComponent}
      /> */}
    </div>
  )
}

export const TableConfigForm = ({
}: {
  }) => {
  const [tableId, setTableId] = useState<string>()

  const { account } = useAccount()
  const { admin } = useDojoSystemCalls()
  const storeComponent = (values: any) => {
    admin.set_table(account, values)
  }

  return (
    <div>
      <TableSwitcher selectedTableId={tableId} setSelectedTableId={setTableId} />
      {/* <ComponentForm
        schema={table_config_schema}
        component={TableConfig}
        entityKey={entityKey}
        storeComponent={storeComponent}
      /> */}
    </div>
  )
}




// export const ComponentForm = ({
//   schema,
//   component,
//   entityKey,
//   storeComponent,
// }: {
//   schema: FormSchema
//   component: Component
//   entityKey: Entity
//   storeComponent: (values: any) => void
// }) => {
//   const [input_values, setTableInput] = useState({})

//   const { IAmOwner } = useAdminAmIOwner()
//   const comp_values = useComponentValue(component, entityKey)
//   const component_values = useMemo(() => {
//     let result = { ...comp_values }
//     return result
//   }, [comp_values])

//   useEffect(() => {
//     setTableInput({ ...component_values })
//   }, [component_values])

//   const canEdit = (component != null && entityKey != null && IAmOwner)

//   const tag = useMemo<string>(() => (component?.metadata?.name as string), [component])
//   const fields = useMemo(() => {
//     return (component) ? Object.keys(component.schema).map((key) => {
//       const fieldType = schema[key].type
//       const readOnly = schema[key].isKey || !canEdit
//       let value: any = input_values[key]
//       const warning = (value != component_values?.[key])
//       if (fieldType == FieldType.ShortString) value = feltToString(value ?? 0)
//       else if (fieldType == FieldType.Address) value = bigintToHex(value ?? 0)
//       else if (fieldType == FieldType.Wei || fieldType == FieldType.Number) value = value?.toString() ?? '00'
//       // console.log(`F:`, key, fieldType, value)
//       return (
//         <Field key={key}
//           name={key}
//           fieldType={fieldType}
//           readOnly={readOnly}
//           value={value}
//           code={fieldType == FieldType.Address || fieldType == FieldType.Wei || fieldType == FieldType.Number}
//           warning={warning}
//           setValue={(newValue) => {
//             if (fieldType == FieldType.Address && !isBigint(newValue)) return
//             if (fieldType == FieldType.Number && !isNumeric(newValue)) return
//             if (fieldType == FieldType.Wei && !isNumeric(newValue)) return
//             const _value =
//               fieldType == FieldType.ShortString ? stringToFelt(newValue)
//                 : newValue
//             console.log(`input:`, key, _value)
//             setTableInput({
//               ...input_values,
//               [key]: _value,
//             })
//           }} />
//       )
//     }) : []
//   }, [input_values, canEdit])


//   return (
//     <div>
//       {/* <h3>{tag}</h3> */}
//       <Table celled striped color='orange' size='small'>
//         <Header>
//           <Row>
//             <HeaderCell width={4}><h3>{tag}</h3></HeaderCell>
//             <HeaderCell></HeaderCell>
//           </Row>
//         </Header>
//         <Body>
//           {fields}
//           <Row>
//             <Cell></Cell>
//             <Cell>
//               <ActionButton important fill label={!IAmOwner ? 'NOT ADMIN' : 'STORE'} disabled={!canEdit} onClick={() => storeComponent(input_values)} />
//             </Cell>
//           </Row>
//         </Body>
//       </Table>
//     </div>
//   )
// }

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
            : fieldType == FieldType.RulesType ? <>
              {value}
              <FormSelectFromMap
                map={constants.getRulesTypeMap()}
                label={name}
                disabled={readOnly}
                value={value}
                setValue={setValue}
              />
            </> : fieldType == FieldType.DeckType ? <>
              {value}
              <FormSelectFromMap
                map={constants.getDeckTypeMap()}
                label={name}
                disabled={readOnly}
                value={value}
                setValue={setValue}
              />
            </> : <>
              {fieldType == FieldType.Wei && <Balance lords wei={value ?? 0} decimals={18} />}
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

