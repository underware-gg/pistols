


import React, { useMemo } from 'react'
import { Checkbox, Dropdown, Input } from 'semantic-ui-react'
import { getObjectKeyByValue } from '@underware_gg/pistols-sdk/utils'

export function FormInput({
  label,
  placeholder = null,
  value,
  setValue,
  maxLength,
  code = false,
  fluid = true,
  disabled = false,
}: {
  label: string
  placeholder?: string
  value: string,
  setValue: (v: string) => void
  maxLength: number
  code?: boolean
  fluid?: boolean
  disabled?: boolean
}) {
  const classNames = useMemo(() => {
    let classNames = ['FormInput']
    if (code) classNames.push('Number')
    return classNames
  }, [code])

  return (
    <>
      <span className='FormLabel TitleCase'>{label}</span>
      <Input
        className={classNames.join(' ')}
        fluid={fluid}
        maxLength={maxLength}
        placeholder={placeholder}
        value={value ?? ''}
        disabled={disabled}
        onChange={(e) => setValue(e.target.value)}
      />
    </>
  )
}

export function FormCheckbox({
  label,
  value,
  setValue,
  disabled = false,
}: {
  label?: string
  value: boolean,
  setValue: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <>
      {label && <span className='FormLabel TitleCase'>{label}</span>}
      <Checkbox label={null}
        checked={value}
        disabled={disabled}
        onChange={(e, data) => setValue(data.checked)}
      />
    </>
  )
}

export function FormSelectFromMap({
  map,
  label,
  value,
  setValue,
  disabled = false,
}: {
  map: Record<string, number>
  label: string
  value: number
  setValue: (v: number) => void
  disabled?: boolean
}) {
  return (
    <Dropdown
      className='Padded'
      text={getObjectKeyByValue(map, value)}
      disabled={disabled}
      button
      fluid
    >
      <Dropdown.Menu>
        {Object.keys(map).map(key => (
          <Dropdown.Item key={key}
            selected={value == map[key]}
            onClick={() => setValue(map[key])}>{key}</Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  )
}

