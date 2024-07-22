


import React from 'react'
import { Input } from 'semantic-ui-react'

export function FormInput({
  label,
  placeholder = null,
  value,
  setValue,
  maxLength,
  fluid = true,
  disabled = false,
}: {
  label: string
  placeholder?: string
  value: string,
  setValue: (v: string) => void
  maxLength: number
  fluid?: boolean
  disabled?: boolean
}) {
  return (
    <>
      <span className='FormLabel TitleCase'>{label}</span>
      <Input
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

