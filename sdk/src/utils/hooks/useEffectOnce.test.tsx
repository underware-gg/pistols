// @vitest-environment happy-dom

import { renderHook } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { useEffectOnce } from './useEffectOnce'

test('retains and invokes the effect cleanup on unmount', () => {
  const cleanup = vi.fn()
  const effect = vi.fn(() => cleanup)

  const { unmount } = renderHook(() => useEffectOnce(effect, []))

  expect(effect).toHaveBeenCalledOnce()
  unmount()
  expect(cleanup).toHaveBeenCalledOnce()
})
