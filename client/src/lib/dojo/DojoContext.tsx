import { ReactNode, createContext, useContext } from 'react'
import { BurnerAccount, useBurnerManager, useBurnerWindowObject, usePredeployedWindowObject, PredeployedManager } from '@dojoengine/create-burner'
import { getMasterPredeployedAccount } from '@/lib/dojo/setup/chainConfig'
import { bigintEquals } from '@/lib/utils/types'
import { SetupResult } from '@/lib/dojo/setup/setup'
import { feltToString } from '@/lib/utils/starknet'
import { CHAIN_ID } from '@/lib/dojo/setup/chains'
import { Account } from 'starknet'

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

  const { burnerManager, selectedChainConfig, rpcProvider } = value

  const masterAccount = burnerManager.masterAccount as Account
  const burner: BurnerAccount = useBurnerManager({ burnerManager, })

  const masterPredeployedAccount = getMasterPredeployedAccount(feltToString(selectedChainConfig.chain.id) as CHAIN_ID)
  const predeployedManager = new PredeployedManager({
    rpcProvider: rpcProvider,
    predeployedAccounts: [...masterPredeployedAccount, ...selectedChainConfig.predeployedAccounts],
  })

  useBurnerWindowObject(burnerManager);
  usePredeployedWindowObject(predeployedManager);

  return (
    <DojoContext.Provider
      value={{
        setup: value,
        masterAccount,
        account: burner.account ? (burner.account as Account) : masterAccount,
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


//
// NEW
//

export const useDojoAccount = (): BurnerAccount & {
  masterAccount: Account
  account: Account
  accountAddress: bigint
  isMasterAccount: boolean
} => {
  const { burner, account, masterAccount } = useDojo()
  // account: { create, list, select, account, isDeploying }
  return {
    ...burner,
    masterAccount,
    account,
    accountAddress: BigInt(account?.address ?? 0),
    isMasterAccount: bigintEquals(masterAccount.address, account.address),
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
