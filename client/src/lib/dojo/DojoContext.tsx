import { ReactNode, createContext, useContext, useMemo } from 'react'
import { BurnerAccount, useBurnerManager } from "@dojoengine/create-burner"
import { DojoChainConfig } from '@/lib/dojo/setup/chainConfig';
import { bigintEquals } from "@/lib/utils/types";
import { SetupResult } from "./setup/setup";
import { Account } from "starknet";

interface DojoContextType {
  setup: SetupResult;
  masterAccount: Account;
  account: Account | null;
  burner: BurnerAccount;
  dojoChainConfig: DojoChainConfig,
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
  if (currentValue) throw new Error("DojoProvider can only be used once");

  const {
    dojoChainConfig: { masterAddress, masterPrivateKey },
    burnerManager,
    dojoProvider,
  } = value;

  const masterAccount = useMemo(
    () =>
      new Account(
        dojoProvider.provider,
        masterAddress,
        masterPrivateKey,
        "1"
      ),
    [masterAddress, masterPrivateKey, dojoProvider.provider]
  );

  const burner: BurnerAccount = useBurnerManager({
    burnerManager,
  });

  return (
    <DojoContext.Provider
      value={{
        setup: value,
        masterAccount,
        account: burner.account ? (burner.account as Account) : masterAccount,
        burner,
        dojoChainConfig: value.dojoChainConfig,
      }}
    >
      {children}
    </DojoContext.Provider>
  );
};



export const useDojo = (): DojoContextType => {
  const context = useContext(DojoContext);
  if (!context)
    throw new Error("The `useDojo` hook must be used within a `DojoProvider`");

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
