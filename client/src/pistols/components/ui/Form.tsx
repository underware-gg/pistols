


import React, { useMemo } from 'react'
import { Input } from 'semantic-ui-react'

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

