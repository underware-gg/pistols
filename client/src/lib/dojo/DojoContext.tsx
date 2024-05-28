import { ReactNode, createContext, useCallback, useContext, useMemo } from 'react'
import { BurnerAccount, useBurnerManager, useBurnerWindowObject, usePredeployedWindowObject } from '@dojoengine/create-burner'
import { SetupResult } from '@/lib/dojo/setup/useSetup'
import { dummyAccount } from '../utils/starknet';
import { bigintEquals } from '@/lib/utils/types';
import { Account, BigNumberish } from 'starknet'

interface DojoContextType {
  isInitialized: boolean;
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

  const { burnerManager, predeployedManager, dojoProvider } = value ?? {}

  // const masterAccount = burnerManager?.masterAccount ?? dummyAccount()
  const masterAccount = burnerManager?.masterAccount as Account
  const burner: BurnerAccount = useBurnerManager({ burnerManager })

  // create injected connectors asynchronously
  useBurnerWindowObject(burnerManager);
  usePredeployedWindowObject(predeployedManager);

  return (
    <DojoContext.Provider
      value={{
        isInitialized: Boolean(value),
        setup: value ?? {} as SetupResult,
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

export const useDojoAccount = (): BurnerAccount & {
  masterAccount: Account
  account: Account
  accountAddress: bigint
  isGuest: boolean
  isThisAccount: (address: BigNumberish) => boolean
} => {
  const { burner, account, masterAccount } = useDojo()
  const accountAddress = useMemo(() => BigInt(account?.address ?? 0), [account])
  const isGuest = useMemo(() => (accountAddress == 0n), [accountAddress])
  const isThisAccount = useCallback((address: BigNumberish) => (!isGuest && bigintEquals(address, accountAddress)), [accountAddress, isGuest])
  return {
    ...burner,
    masterAccount,
    account,          // can be null (guest)
    accountAddress,   // can be 0n (guest)
    isGuest,
    isThisAccount,
  }
}

