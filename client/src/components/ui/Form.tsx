


import React, { useMemo } from 'react'
import { Checkbox, Dropdown, Input } from 'semantic-ui-react'
import { getObjectKeyByValue, isNumber } from '@underware/pistols-sdk/utils'

export function FormInput({
  label,
  placeholder = null,
  value,
  setValue,
  maxLength,
  code = false,
  fluid = true,
  disabled = false,
  className = null,
  style = null,
}: {
  label?: string
  placeholder?: string
  value: string,
  setValue: (v: string) => void
  maxLength: number
  code?: boolean
  fluid?: boolean
  disabled?: boolean
  className?: string
  style?: React.CSSProperties
}) {
  const classNames = useMemo(() => {
    let classNames = className ? [className] : []
    classNames.push('FormInput')
    if (code) classNames.push('Number')
    return classNames
  }, [code])

  return (
    <>
      {label && <span className='FormLabel TitleCase'>{label}</span>}
      <Input
        className={classNames.join(' ')}
        style={style}
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

export function FormInputNumber({
  label,
  placeholder,
  value,
  setValue,
  minValue,
  maxValue,
  code = true,
  fluid = true,
  disabled = false,
  className = null,
}: {
  label?: string
  placeholder?: string
  value: number,
  setValue: (v: number) => void
  minValue: number
  maxValue: number
  code?: boolean
  fluid?: boolean
  disabled?: boolean
  className?: string
}) {
  const maxLength = useMemo(() => (maxValue.toString().length), [maxValue])
  const style = useMemo(() => ({ width: `${maxLength+1}em` }), [maxLength])
  const _setValue = (v: string) => {
    if (isNumber(v)) {
      const n = parseInt(v)
      if (n >= minValue && n <= maxValue) {
        setValue(n)
      }
    }
  }
  return (
    <FormInput
      label={label}
      placeholder={placeholder}
      value={value.toString()}
      setValue={_setValue}
      maxLength={maxLength}
      code={code}
      fluid={fluid}
      disabled={disabled}
      className={className}
      style={style}
    />
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

