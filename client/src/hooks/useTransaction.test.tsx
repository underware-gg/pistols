import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const { showWaitingMessage } = vi.hoisted(() => ({ showWaitingMessage: vi.fn() }))

vi.mock('@underware/pistols-sdk/dojo', () => ({
  emitter: { on: vi.fn() },
  useDojoSystemCalls: vi.fn(),
}))

vi.mock('dexie', () => {
  class DexieMock {
    version() {
      return {
        stores: vi.fn(() => {
          Object.assign(this, {
            transactions: {
              put: vi.fn(),
              update: vi.fn(),
              delete: vi.fn(),
              toArray: vi.fn(async () => []),
            },
          })
          return this
        }),
      }
    }
  }

  return { default: DexieMock }
})

vi.mock('../components/ui/ElementPopupNotification', () => ({
  showElementPopupNotification: showWaitingMessage,
}))

import { useTransactionHandler, useTransactionObserver } from './useTransaction'
import { useTransactionStore } from '../stores/transactionStore'

beforeEach(() => {
  useTransactionStore.getState().resetStore()
  showWaitingMessage.mockReset()
})

describe('useTransactionHandler', () => {
  test('completes exactly once with the latest callback after the indexer catches up', async () => {
    const firstOnComplete = vi.fn()
    const latestOnComplete = vi.fn()
    const transactionCall = vi.fn(async (_duelistId: bigint, key: string) => {
      useTransactionStore.getState().setTransactionResult(key, { accepted: true })
    })
    let indexerCheck = false
    let onComplete = firstOnComplete

    const { result, rerender } = renderHook(() => useTransactionHandler({
      key: 'accept-duel',
      transactionCall,
      indexerCheck,
      onComplete,
    }))

    await act(async () => result.current.call(42n))
    await waitFor(() => expect(result.current.isWaitingForIndexer).toBe(true))
    expect(firstOnComplete).not.toHaveBeenCalled()

    onComplete = latestOnComplete
    rerender()
    indexerCheck = true
    rerender()

    await waitFor(() => expect(latestOnComplete).toHaveBeenCalledOnce())
    expect(latestOnComplete).toHaveBeenCalledWith({ accepted: true }, [42n])
    expect(firstOnComplete).not.toHaveBeenCalled()
    expect(useTransactionStore.getState().getTransaction('accept-duel')).toBeUndefined()
  })

  test('reports a rejected call once and removes the failed transaction', async () => {
    const error = new Error('wallet rejected')
    const onComplete = vi.fn()
    const transactionCall = vi.fn(async () => {
      throw error
    })
    const { result } = renderHook(() => useTransactionHandler({
      key: 'reject-duel',
      transactionCall,
      onComplete,
    }))

    await act(async () => result.current.call())

    await waitFor(() => expect(onComplete).toHaveBeenCalledOnce())
    expect(onComplete.mock.calls[0][0]).toMatchObject({ message: 'wallet rejected' })
    expect(onComplete.mock.calls[0][1]).toEqual([])
    expect(useTransactionStore.getState().getTransaction('reject-duel')).toBeUndefined()
  })
})

describe('useTransactionObserver', () => {
  test('cancels a delayed waiting message when unmounted', async () => {
    vi.useFakeTimers()
    const target = document.createElement('button')
    const messageTargetRef = { current: target }
    useTransactionStore.getState().startTransaction('observed')
    useTransactionStore.getState().setTransactionResult('observed', { accepted: true })

    const { unmount } = renderHook(() => useTransactionObserver({
      key: 'observed',
      indexerCheck: false,
      messageTargetRef,
      waitingMessage: 'Waiting for indexer',
      messageDelay: 1_000,
    }))

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    unmount()
    await vi.advanceTimersByTimeAsync(1_000)

    expect(showWaitingMessage).not.toHaveBeenCalled()
    vi.useRealTimers()
  })
})
