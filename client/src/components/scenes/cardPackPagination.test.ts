import { describe, expect, test } from 'vitest'
import {
  getCardPackPageCount,
  getRenderedCardPackIds,
  getVisibleCardPackIds,
} from './cardPackPagination'

describe('card-pack pagination', () => {
  test('reserves the first slot for a starter pack without changing page capacity', () => {
    const packIds = Array.from({ length: 25 }, (_, index) => index + 1)

    expect(getCardPackPageCount(packIds.length, true)).toBe(2)
    expect(getVisibleCardPackIds({ packIds, currentPage: 0, canClaimStarterPack: true }))
      .toEqual([-1, ...packIds.slice(0, 19)])
    expect(getVisibleCardPackIds({ packIds, currentPage: 1, canClaimStarterPack: true }))
      .toEqual(packIds.slice(19))
  })

  test('retains one off-page selection without creating unstable derived state', () => {
    const visible = [1, 2, 3]

    expect(getRenderedCardPackIds(visible, 9)).toEqual([1, 2, 3, 9])
    expect(getRenderedCardPackIds(visible, 2)).toBe(visible)
    expect(getRenderedCardPackIds(visible, null)).toBe(visible)
  })
})
