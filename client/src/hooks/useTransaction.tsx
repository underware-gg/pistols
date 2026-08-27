import { useState, useCallback, useEffect, useRef } from 'react';
import { useTransactionStore, useTransaction as useTransactionState, Transaction } from '../stores/transactionStore';
import { showElementPopupNotification } from '../components/ui/ElementPopupNotification';

interface UseTransactionHandlerProps<T, Args extends any[] = []> {
  key: string;
  transactionCall: (...args: [...Args, string]) => Promise<T>;
  indexerCheck?: boolean;
  onComplete?: (result: T | Error, args: Args) => void;
  messageTargetRef?: React.RefObject<HTMLElement>;
  waitingMessage?: string;
  messageDelay?: number;
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
  messageTargetRef,
  waitingMessage,
  messageDelay,
}: UseTransactionHandlerProps<T, Args>): UseTransactionHandlerReturn<T, Args> {
  const removeTransaction = useTransactionStore((state) => state.removeTransaction)
  const setTransactionError = useTransactionStore((state) => state.setTransactionError)
  const startTransaction = useTransactionStore((state) => state.startTransaction)
  
  const transaction = useTransactionState(key);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isWaitingForIndexer, setIsWaitingForIndexer] = useState<boolean>(false);
  const [meta, setMeta] = useState<Args>([] as Args);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  const reset = useCallback(() => {
    setIsLoading(false)
    setIsWaitingForIndexer(false)
    setMeta([] as Args)
  }, [])

  useEffect(() => {
    if (!transaction) {
      reset()
      return
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    if (!isLoading) {
      setIsLoading(true)
      setMeta(transaction.meta)
    }

    if (transaction.status === 'completed') {
      setIsWaitingForIndexer(true)
    } else if (transaction.status === 'failed') {
      onCompleteRef.current?.(new Error(transaction.error || 'Transaction failed'), transaction.meta as Args || [] as Args)
      removeTransaction(key)
    }    
  }, [transaction, isLoading, key, removeTransaction, reset])

  useEffect(() => {
    if (isWaitingForIndexer) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      
      if (waitingMessage && messageTargetRef) {
        timeoutRef.current = setTimeout(() => {
          showElementPopupNotification(messageTargetRef, waitingMessage)
        }, messageDelay || 0)
      }

      const canComplete = indexerCheck === undefined ? true : indexerCheck
      
      if (canComplete && transaction) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }
        onCompleteRef.current?.(transaction.result as T, transaction.meta as Args || [] as Args)
        removeTransaction(key)
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [isWaitingForIndexer, indexerCheck, transaction, onComplete, messageTargetRef, waitingMessage, messageDelay, key, removeTransaction])

  const call = useCallback(async (...args: Args) => {
    setIsLoading(true)
    setIsWaitingForIndexer(false)
    
    setMeta(args)

    try {
      startTransaction(key, args)
      await transactionCall(...args, key)
    } catch (error) {
      setTransactionError(key, error instanceof Error ? error.message : 'Transaction failed')
      reset()
      onCompleteRef.current?.(error as Error, args)
    }
  }, [key, reset, setTransactionError, startTransaction, transactionCall])

  return { call, isLoading, isWaitingForIndexer, meta, transaction };
}

// useTransactionObserver.ts
interface UseTransactionObserverProps {
  key: string;
  indexerCheck?: boolean;
  messageTargetRef?: React.RefObject<HTMLElement>;
  waitingMessage?: string;
  messageDelay?: number;
}

interface UseTransactionObserverReturn {
  isLoading: boolean;
  isWaitingForIndexer: boolean;
  meta: any;
  transaction?: Transaction;
}

export function useTransactionObserver({ key, indexerCheck, messageTargetRef, waitingMessage, messageDelay }: UseTransactionObserverProps): UseTransactionObserverReturn {
  const removeTransaction = useTransactionStore((state) => state.removeTransaction)
  
  const transaction = useTransactionState(key);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isWaitingForIndexer, setIsWaitingForIndexer] = useState<boolean>(false);
  const [meta, setMeta] = useState<any>(null);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const reset = useCallback(() => {
    setIsLoading(false)
    setIsWaitingForIndexer(false)
    setMeta([] as any)
  }, [])

  useEffect(() => {
    if (!transaction) {
      reset()
      return
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    if (!isLoading) {
      setIsLoading(true)
      setMeta(transaction.meta)
    }

    if (transaction.status === 'completed') {
      setIsWaitingForIndexer(true)
    } else if (transaction.status === 'failed') {
      removeTransaction(key)
    }
  }, [isLoading, key, removeTransaction, reset, transaction])

  useEffect(() => {
    if (isWaitingForIndexer) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      
      if (waitingMessage && messageTargetRef) {
        timeoutRef.current = setTimeout(() => {
          showElementPopupNotification(messageTargetRef, waitingMessage)
        }, messageDelay || 0)
      }

      const canComplete = indexerCheck === undefined ? true : indexerCheck
      
      if (canComplete && transaction) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }
        removeTransaction(key)
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [isWaitingForIndexer, indexerCheck, transaction, messageTargetRef, waitingMessage, messageDelay, key, removeTransaction])

  return { isLoading, isWaitingForIndexer, meta, transaction };
}
