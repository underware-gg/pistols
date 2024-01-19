import { BurnerProvider, useBurner } from "@dojoengine/create-burner";
import { ReactNode, createContext, useContext, useMemo } from "react";
import { Account, RpcProvider } from "starknet";
import { SetupResult } from "./setup";

interface DojoContextType extends SetupResult {
  masterAccount: Account;
}

const DojoContext = createContext<DojoContextType | null>(null);

if (!process.env.NEXT_PUBLIC_MASTER_ADDRESS) throw (`NEXT_PUBLIC_MASTER_ADDRESS is not set`)
if (!process.env.NEXT_PUBLIC_MASTER_PRIVATE_KEY) throw (`NEXT_PUBLIC_MASTER_PRIVATE_KEY is not set`)
if (!process.env.NEXT_PUBLIC_ACCOUNT_CLASS_HASH) throw (`NEXT_PUBLIC_ACCOUNT_CLASS_HASH is not set`)
// if (!process.env.NEXT_PUBLIC_NODE_URL) throw (`NEXT_PUBLIC_NODE_URL is not set`)

type DojoProviderProps = {
  children: ReactNode;
  value: SetupResult;
};

export const DojoProvider = ({ children, value }: DojoProviderProps) => {
  const currentValue = useContext(DojoContext);
  if (currentValue) throw new Error("DojoProvider can only be used once");

  const rpcProvider = useMemo(
    () =>
      new RpcProvider({
        nodeUrl:
          process.env.NEXT_PUBLIC_NODE_URL ||
          "http://localhost:5050",
      }),
    []
  );

  const masterAddress = process.env.NEXT_PUBLIC_MASTER_ADDRESS;
  const privateKey = process.env.NEXT_PUBLIC_MASTER_PRIVATE_KEY;
  const accountClassHash = process.env.NEXT_PUBLIC_ACCOUNT_CLASS_HASH;
  const masterAccount = useMemo(
    () => new Account(rpcProvider, masterAddress, privateKey),
    [rpcProvider, masterAddress, privateKey]
  );

  return (
    <BurnerProvider
      initOptions={{ masterAccount, accountClassHash, rpcProvider }}
    >
      <DojoContext.Provider value={{ ...value, masterAccount }}>
        {children}
      </DojoContext.Provider>
    </BurnerProvider>
  );
};

export const useDojo = () => {
  const contextValue = useContext(DojoContext);
  if (!contextValue)
    throw new Error(
      "The `useDojo` hook must be used within a `DojoProvider`"
    );

  const {
    create,
    list,
    get,
    account,
    select,
    isDeploying,
    clear,
    copyToClipboard,
    applyFromClipboard,
  } = useBurner();

  return {
    setup: contextValue,
    account: {
      create,
      list,
      get,
      select,
      clear,
      account: account ?? contextValue.masterAccount,
      masterAccount: contextValue.masterAccount,
      isMasterAccount: (!account),
      isDeploying,
      copyToClipboard,
      applyFromClipboard,
    },
  };
}; 



//
// NEW
//

export const useDojoAccount = () => {
  const { account } = useDojo()
  // account: { create, list, select, account, isDeploying }
  return {
    ...account,
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
