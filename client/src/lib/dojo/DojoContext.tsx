import { ReactNode, createContext, useContext, useMemo } from 'react'
import { BurnerAccount, useBurnerManager, useBurnerWindowObject, usePredeployedWindowObject } from '@dojoengine/create-burner'
import { SetupResult } from '@/lib/dojo/setup/useSetup'
import { Account } from 'starknet'
import { dummyAccount } from '../utils/starknet';

interface DojoContextType {
  setup: SetupResult;
  masterAccount: Account;
  account: Account | null;
  burner: BurnerAccount;
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

  const { burnerManager, predeployedManager, dojoProvider } = value

  const masterAccount = burnerManager?.masterAccount as Account
  const burner: BurnerAccount = useBurnerManager({ burnerManager })

  // create injected connectors asynchronously
  useBurnerWindowObject(burnerManager);
  usePredeployedWindowObject(predeployedManager);

  return (
    <DojoContext.Provider
      value={{
        setup: value,
        masterAccount,
        account: (burner.account as Account) ?? undefined,
        burner,
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
  const { setup: { status } } = useDojo()
  return {
    ...status,
  }
}

export const useDojoAccount = (): BurnerAccount & {
  masterAccount: Account
  account: Account
  accountAddress: bigint
  isGuest: boolean
} => {
  const { burner, account, masterAccount } = useDojo()
  const accountAddress = useMemo(() => BigInt(account?.address ?? 0), [account])
  return {
    ...burner,
    masterAccount,
    account,
    accountAddress,
    isGuest: (accountAddress == 0n),
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
