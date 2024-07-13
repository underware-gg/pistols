import { ReactNode, createContext, useContext } from 'react'
import { usePredeployedWindowObject } from '@dojoengine/create-burner'
import { SetupResult } from '@/lib/dojo/setup/useSetup'

interface DojoContextType {
  isInitialized: boolean;
  setup: SetupResult;
}

export const DojoContext = createContext<DojoContextType | null>(null);

export const DojoProvider = ({
  children,
  value,
}: {
  children: ReactNode;
  value: SetupResult;
}) => {
  const currentValue = useContext(DojoContext);
  if (currentValue) throw new Error('DojoProvider can only be used once');

  const { predeployedManager, dojoProvider } = value ?? {}

  // create injected connectors asynchronously
  usePredeployedWindowObject(predeployedManager);

  return (
    <DojoContext.Provider
      value={{
        isInitialized: Boolean(value),
        setup: value ?? {} as SetupResult,
      }}
    >
      {children}
    </DojoContext.Provider>
  );
};


export const useDojo = (): DojoContextType => {
  const context = useContext(DojoContext);
  if (!context)
    throw new Error('The `useDojo` hook must be used within a `DojoProvider`');
  return context;
};


//-----------------------
// Pistols
//

export const useDojoStatus = () => {
  const { isInitialized, setup: { status } } = useDojo()
  return {
    isInitialized,
    ...status,
  }
}

export const useDojoSystemCalls = () => {
  const { setup: { systemCalls } } = useDojo()
  return {
    ...systemCalls,
  }
}

export const useDojoComponents = () => {
  const { setup: { components } } = useDojo()
  return {
    ...components,
  }
}

export const useDojoConstants = () => {
  const { setup: { constants } } = useDojo()
  return {
    ...constants,
  }
}
