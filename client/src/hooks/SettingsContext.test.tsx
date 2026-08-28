import React from 'react'
import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { SettingsProvider } from './SettingsContext'

test('supplies the cookie context required by react-cookie', () => {
  render(
    <SettingsProvider>
      <span>Settings mounted</span>
    </SettingsProvider>,
  )

  expect(screen.getByText('Settings mounted')).toBeTruthy()
})
