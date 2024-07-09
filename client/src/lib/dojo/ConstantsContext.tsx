import React, { ReactNode, createContext, useContext, useEffect, useMemo } from 'react'
import { useSelectedChain } from '@/lib/dojo/hooks/useChain'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { DojoAppConfig } from '@/lib/dojo/Dojo'
import { HASH_SALT_MASK } from '@/pistols/utils/constants'

interface ConstantsContextType {
  constants: any
}

export const ConstantsContext = createContext<ConstantsContextType>(null)

export const ConstantsProvider = ({
  dojoAppConfig,
  children,
}: {
  dojoAppConfig: DojoAppConfig
  children: ReactNode
}) => {
  const currentValue = useContext(ConstantsContext)
  if (currentValue) throw new Error('ConstantsProvider can only be used once')

  const { selectedChainId } = useSelectedChain()

  const constants = useMemo(() => {
    return dojoAppConfig.constants[selectedChainId] ?? {}
  }, [dojoAppConfig, selectedChainId])
  // console.log(constants)

  // initialize default table
  const { dispatchTableId, tableId, initialized } = useSettings()
  useEffect(() => {
    if (initialized && !tableId && constants.tables?.LORDS) {
      dispatchTableId(constants.tables.LORDS)
    }
  }, [initialized, tableId, constants.tables])

  // assert mask is correct
  useEffect(() => {
    const _MASK = constants.constants?.HASH_SALT_MASK
    if (_MASK && _MASK != HASH_SALT_MASK) {
      throw new Error(`HASH_SALT_MASK should be not [${_MASK}]`)
    }
  }, [constants])
  
  return (
    <ConstantsContext.Provider value={{ constants }}>
      {children}
    </ConstantsContext.Provider>
  )
}

export const useDojoConstants = (): any => {
  const context = useContext(ConstantsContext)
  if (!context) {
    throw new Error('The `useDojoConstants` hook must be used within a `ConstantsProvider`')
  }
  return {
    ...context.constants
  }
}
