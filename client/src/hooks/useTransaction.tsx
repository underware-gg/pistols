import { useState, useCallback, useEffect, useRef } from 'react';
import { useTransactionStore, useTransaction as useTransactionState, Transaction } from '../stores/transactionStore';

interface UseTransactionHandlerProps<T, Args extends any[] = []> {
  key: string;
  transactionCall: (...args: [...Args, string]) => Promise<T>;
  indexerCheck?: boolean;
  onComplete?: (result: T | Error, args: Args) => void;
}

interface UseTransactionHandlerReturn<T, Args extends any[] = []> {
  call: (...args: Args) => Promise<void>;
  isLoading: boolean;
  isWaitingForIndexer: boolean;
  meta: Args;
  transaction?: Transaction;
}

export function useTransactionHandler<T, Args extends any[] = []>({
  key,
  transactionCall,
  indexerCheck,
  onComplete,
}: UseTransactionHandlerProps<T, Args>): UseTransactionHandlerReturn<T, Args> {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isWaitingForIndexer, setIsWaitingForIndexer] = useState<boolean>(false);
  const [meta, setMeta] = useState<Args>([] as Args);
  const transactionStore = useTransactionStore((state) => state);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const transaction = useTransactionState(key);

  useEffect(() => {
    let mounted = true

    const checkPersisted = async () => {
      if (!transaction) {
        setIsLoading(false)
        return
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      setIsLoading(true)
      setMeta(transaction.meta)

      if (transaction.status === 'completed' && mounted) {
        const canComplete = indexerCheck === undefined ? true : indexerCheck
        
        if (canComplete) {
          setIsLoading(false)
          setIsWaitingForIndexer(false)
          onComplete?.(transaction.result as T, transaction.meta?.args as Args || [] as Args)
          transactionStore.removeTransaction(key)
        } else {
          setIsLoading(true)
          if (!isWaitingForIndexer) {
            timeoutRef.current = setTimeout(() => {
              if (mounted) {
                setIsWaitingForIndexer(true)
              }
            }, 1000)
          }
        }
      } else if (transaction.status === 'failed' && mounted) {
        setIsLoading(false)
        setIsWaitingForIndexer(false)
        onComplete?.(new Error(transaction.error || 'Transaction failed'), transaction.meta?.args as Args || [] as Args)
        transactionStore.removeTransaction(key)
      } else if (transaction.status === 'pending' && mounted) {
        setIsLoading(true)
      }
    }
    
    checkPersisted()

    return () => {
      mounted = false
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [transaction, indexerCheck, onComplete, key, transactionStore])

  const call = useCallback(async (...args: Args) => {
    setIsLoading(true)
    setIsWaitingForIndexer(false)
    
    setMeta(args)

    try {
      transactionStore.startTransaction(key, args)
      await transactionCall(...args, key)
    } catch (error) {
      transactionStore.setTransactionError(key, error instanceof Error ? error.message : 'Transaction failed')
      setIsLoading(false)
      setIsWaitingForIndexer(false)
      onComplete?.(error as Error, args)
    }
  }, [transactionCall, key, onComplete, transactionStore])

  return { call, isLoading, isWaitingForIndexer, meta, transaction };
}

// useTransactionObserver.ts
interface UseTransactionObserverProps {
  key: string;
  indexerCheck?: boolean;
}

interface UseTransactionObserverReturn {
  isLoading: boolean;
  isWaitingForIndexer: boolean;
  meta: any;
  transaction?: Transaction;
}

export function useTransactionObserver({ key, indexerCheck }: UseTransactionObserverProps): UseTransactionObserverReturn {
  const transactionStore = useTransactionStore((state) => state);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isWaitingForIndexer, setIsWaitingForIndexer] = useState<boolean>(false);
  const [meta, setMeta] = useState<any>(null);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const transaction = useTransactionState(key);

  useEffect(() => {
    let mounted = true

    const check = async () => {
      if (!transaction) {
        setIsLoading(false)
        return
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      setIsLoading(true)
      setMeta(transaction.meta)

      if (transaction.status === 'completed' && mounted) {
        const canComplete = indexerCheck === undefined ? true : indexerCheck
        
        if (canComplete) {
          transactionStore.removeTransaction(key)
          setIsLoading(false)
          setIsWaitingForIndexer(false)
        } else {
          setIsLoading(true)
          if (!isWaitingForIndexer) {
            timeoutRef.current = setTimeout(() => {
              if (mounted) {
                setIsWaitingForIndexer(true)
              }
            }, 1000)
          }
        }
      } else if (transaction.status === 'failed' && mounted) {
        transactionStore.removeTransaction(key)
        setIsLoading(false)
        setIsWaitingForIndexer(false)
      }
    }

    check()

    return () => {
      mounted = false
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [transaction, indexerCheck, key, transactionStore])

  return { isLoading, isWaitingForIndexer, meta, transaction };
}