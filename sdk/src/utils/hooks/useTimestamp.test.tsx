// @vitest-environment happy-dom

import { act, renderHook } from '@testing-library/react'
import { expect, test } from 'vitest'
import { useClientTimestamp } from './useTimestamp'

test('keeps updateTimestamp stable after forcing a clock update', () => {
  const { result } = renderHook(() => useClientTimestamp())
  const initialUpdateTimestamp = result.current.updateTimestamp

  act(() => result.current.updateTimestamp())

  expect(result.current.updateTimestamp).toBe(initialUpdateTimestamp)
})
