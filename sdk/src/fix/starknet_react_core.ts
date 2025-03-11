// import { useCallback, useEffect, useState } from "react";
// import { Connector, useAccount, useConnect, useProvider, } from '@starknet-react/core'


// version 3 wont work with the controller:
// https://github.com/apibara/starknet-react/blob/main/packages/core/src/hooks/use-account.ts

// based on version 2.9:
// https://github.com/apibara/starknet-react/blob/%40starknet-react/core%402.9.0/packages/core/src/hooks/useAccount.ts


// export function _useConnector(): { connector: Connector | undefined } {
//   const { account, address, isConnected } = useAccount()
//   const { connectors } = useConnect();
//   const { provider } = useProvider()
//   const [state, setState] = useState<Connector>();

//   const refreshState = useCallback(async () => {
//     if (!isConnected) {
//       return setState(undefined);
//     }

//     for (const connector of connectors) {
//       if (!connector.available()) continue;
//       let connAccount;
//       try {
//         connAccount = await connector.account(provider)
//       } catch { }
//       if (connAccount && connAccount?.address === account?.address) {
//         return setState(connector);
//       }
//     }
//   }, [account, connectors]);

//   useEffect(() => {
//     refreshState();
//   }, [refreshState]);

//   return { connector: state };
// }