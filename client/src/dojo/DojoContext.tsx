import { ReactNode, createContext, useContext, useMemo } from 'react'
import { BurnerAccount, useBurnerManager } from "@dojoengine/create-burner"
import { Account } from "starknet";
import { SetupResult } from "./setup";
import { bigintEquals } from "@/lib/utils/type";

interface DojoContextType extends SetupResult {
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
  if (currentValue) throw new Error("DojoProvider can only be used once");

  const {
    config: { masterAddress, masterPrivateKey },
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

  const {
    get,
    list,
    select,
    create,
    listConnectors,
    clear,
    account,
    isDeploying,
    count,
    copyToClipboard,
    applyFromClipboard,
  } = useBurnerManager({
    burnerManager,
  });

  return (
    <DojoContext.Provider
      value={{
        ...value,
        masterAccount,
        account: account ?? masterAccount,
        burner: {
          get,
          list,
          select,
          create,
          // listConnectors,
          clear,
          account,
          isDeploying,
          count,
          copyToClipboard,
          applyFromClipboard,
        },
      }}
    >
      {children}
    </DojoContext.Provider>
  );
};



export const useDojo = () => {
  const context = useContext(DojoContext);
  if (!context)
    throw new Error("The `useDojo` hook must be used within a `DojoProvider`");

  return {
    setup: context,
    burner: context.burner,
    account: context.account,
    dojoProvider: context.dojoProvider,
  };
};


//
// NEW
//

export const useDojoAccount = () => {
  const { setup, burner, account } = useDojo()
  // account: { create, list, select, account, isDeploying }
  return {
    ...burner,
    account,
    accountAddress: BigInt(account?.address ?? 0),
    masterAccount: setup.masterAccount,
    isMasterAccount: bigintEquals(setup.masterAccount.address, account.address),
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
