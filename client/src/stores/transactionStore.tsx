import { useMemo } from 'react'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import Dexie, { Table } from 'dexie'
import { emitter, useDojoSystemCalls } from '@underware/pistols-sdk/dojo'
import { useAccount } from '@starknet-react/core'

export type TransactionStatus = 'pending' | 'completed' | 'failed'

export interface Transaction {
  key: string
  hash?: string
  status: TransactionStatus
  createdAt: number
  meta?: any
  result?: any
  error?: string
}

interface TransactionState {
  [key: string]: Transaction
}

interface State {
  transactions: TransactionState
  resetStore: () => void
  startTransaction: (key: string, meta?: any) => void
  setTransactionHash: (key: string, hash: string) => void
  setTransactionResult: (key: string, result: any) => void
  setTransactionError: (key: string, error: string) => void
  removeTransaction: (key: string) => void
  getTransaction: (key: string) => Transaction | undefined
  getRecentTransactions: () => Transaction[]
  cleanupOldTransactions: () => void
  checkPendingTransactions: (checkTransactionStatus: any, signer: any) => Promise<void>
}

// IndexedDB for persistence
class TransactionDatabase extends Dexie {
  transactions!: Table<Transaction>

  constructor() {
    super('TransactionDB')
    this.version(1).stores({
      transactions: 'key,hash,createdAt,status',
    })
  }
}

const db = new TransactionDatabase()

const createStore = () => {
  const store = create<State>()(immer((set, get) => ({
    transactions: {},

    resetStore: () => {
      set((state: State) => {
        state.transactions = {}
      })
    },

    startTransaction: (key: string, meta?: any) => {
      const transaction: Transaction = {
        key,
        status: 'pending',
        createdAt: Date.now(),
        meta,
      }
      
      set((state: State) => {
        state.transactions[key] = transaction
      })
      
      // Persist to IndexedDB
      db.transactions.put(transaction)
    },

    setTransactionHash: (key: string, hash: string) => {
      set((state: State) => {
        if (state.transactions[key]) {
          state.transactions[key].hash = hash
        }
      })
      
      // Update in IndexedDB
      db.transactions.update(key, { hash })
    },

    setTransactionResult: (key: string, result: any) => {
      set((state: State) => {
        if (state.transactions[key]) {
          state.transactions[key].status = 'completed'
          state.transactions[key].result = result
        }
      })
      
      // Update in IndexedDB
      db.transactions.update(key, { status: 'completed', result })
    },

    setTransactionError: (key: string, error: string) => {
      set((state: State) => {
        if (state.transactions[key]) {
          state.transactions[key].status = 'failed'
          state.transactions[key].error = error
        }
      })
      
      // Update in IndexedDB
      db.transactions.update(key, { status: 'failed', error })
    },

    removeTransaction: (key: string) => {
      set((state: State) => {
        delete state.transactions[key]
      })
      
      // Remove from IndexedDB
      db.transactions.delete(key)
    },

    getTransaction: (key: string) => {
      return get().transactions[key]
    },

    getRecentTransactions: () => {
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
      return Object.values(get().transactions).filter(tx => tx.createdAt >= oneDayAgo)
    },

    cleanupOldTransactions: () => {
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
      const oldKeys = Object.values(get().transactions)
        .filter(tx => tx.createdAt < oneDayAgo)
        .map(tx => tx.key)
      
      set((state: State) => {
        oldKeys.forEach(key => {
          delete state.transactions[key]
        })
      })
      
      // Clean up IndexedDB
      oldKeys.forEach(key => db.transactions.delete(key))
    },

    checkPendingTransactions: async (checkTransactionStatus: any, signer: any) => {
      const pendingTxs = Object.values(get().transactions).filter(tx => 
        tx.status === 'pending' && tx.hash
      )

      console.log(`Checking ${pendingTxs.length} pending transactions`)

      for (const tx of pendingTxs) {
        try {
          await checkTransactionStatus(signer, tx.hash, undefined, tx.key, false)
        } catch (error) {
          console.warn(`Failed to check transaction [${tx.key}]:`, error)
          get().setTransactionError(tx.key, 'Failed to check transaction status')
        }
      }
    },
  })))

  // Load transactions from IndexedDB on store creation
  db.transactions.toArray().then((transactions) => {
    const transactionState: TransactionState = {}
    transactions.forEach(tx => {
      transactionState[tx.key] = tx
    })
    store.setState({ transactions: transactionState })
    
    // Clean up old transactions
    store.getState().cleanupOldTransactions()
  })

  emitter.on('transaction_hash', (data: { key: string; hash: string }) => {
    store.getState().setTransactionHash(data.key, data.hash)
  })

  emitter.on('transaction_completed', (data: { key: string; result: any }) => {
    store.getState().setTransactionResult(data.key, data.result)
  })

  emitter.on('transaction_failed', (data: { key: string; error: string }) => {
    store.getState().setTransactionError(data.key, data.error)
  })

  return store
}

export const useTransactionStore = createStore()

//----------------------------------------
// consumer hooks
//

export const useTransaction = (key: string) => {
  const state = useTransactionStore((state) => state)
  const transaction = useMemo(() => state.getTransaction(key), [state.transactions, key])
  return transaction
}

export const useAllTransactions = () => {
  const state = useTransactionStore((state) => state)
  return useMemo(() => state.getRecentTransactions(), [state.transactions])
}

// Simple hook - call this anywhere to check pending transactions
export const useCheckPendingTransactions = () => {
  const { account, isConnected } = useAccount()
  const { checkTransactionStatus } = useDojoSystemCalls()
  const checkPendingTransactions = useTransactionStore((state) => state.checkPendingTransactions)

  useMemo(() => {
    if (isConnected && account && checkTransactionStatus) {
      checkPendingTransactions(checkTransactionStatus, account)
    }
  }, [isConnected, account, checkTransactionStatus, checkPendingTransactions])
} 