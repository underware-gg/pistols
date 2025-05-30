import { Account, AccountInterface, RpcProvider } from 'starknet'
import { Connector } from '@starknet-react/core'
import { stringToFelt } from 'src/starknet/starknet'
import { ExternalWallet } from "@cartridge/controller";
import { PredeployedAccount } from 'src/games/pistols/config/networks'

export const PREDEPLOYED_ID = 'predeployed';
export const PREDEPLOYED_NAME = 'Predeployed Account';
export const katanaIcon = 'data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMzYgMjQiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xOC4yNzk4IDEzLjU4NzNDMTkuNjE5OCAxMy41ODczIDIwLjcwNjEgMTIuNTAwOCAyMC43MDYxIDExLjE2MDVDMjAuNzA2MSA5LjgyMDE3IDE5LjYxOTggOC43MzM2NCAxOC4yNzk4IDguNzMzNjRDMTYuOTM5OCA4LjczMzY0IDE1Ljg1MzUgOS44MjAxNyAxNS44NTM1IDExLjE2MDVDMTUuODUzNSAxMi41MDA4IDE2LjkzOTggMTMuNTg3MyAxOC4yNzk4IDEzLjU4NzNaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNNS40MTAxNiAyLjc5NDhIMzEuMTUzOVYzLjg4NTEyQzMxLjE1MzkgNC4wODA0NiAzMS4wNzE4IDQuMjY0MjMgMzAuOTMxMiA0LjM5MzEyTDI4LjYyNiA2LjQ2NDRDMjguMzI1MSA2LjgwMDQxIDI3LjkxMSA2Ljk5MTk0IDI3LjQ4MTIgNi45OTE5NEgyNS42NTI3QzI1LjY1MjcgNi45OTE5NCAyNS42NDg4IDguNTA3NTUgMjUuNjQ4OCA5LjM5MjY1QzI1LjY0ODggMTAuMjc3NiAyNS4yODY1IDExLjIzMzIgMjUuMjg2NSAxMS4yMzMyTDI1LjUzMzQgMTEuNDgwMkMyNS43OTc5IDExLjExNyAyNi45NjY4IDkuNjc2NjQgMjcuNzQzIDkuNjc2NjRMMzAuNjc3MiA5LjY2MTA0VjEzLjQwNDhMMjUuNjQ4OCAxMy40NjM1VjIwLjc5NDhMMjQuNzY5NyAxOS45MTk0QzIzLjc2NzggMTguOTIzMyAyMi43NjQyIDE3LjkyODkgMjEuNzY1MiAxNi45Mjk5VjkuOTE1MDlDMjEuNzY1MiA4Ljg3MDU2IDIxLjk5NjkgOC4wMjA4MiAyMi4yMTAxIDcuMDg3NTlMMjIuMjEwNSA3LjA4NTY4TDIyLjIxMTkgNy4wNzk3NEwyMi4yMTM0IDcuMDczOUMyMi4yMTU0IDcuMDY2NjggMjIuMjE3MSA3LjA2MDMxIDIyLjIxNjcgNy4wNTM0MUMyMi4yMTY0IDcuMDQ3NzggMjIuMjE0NyA3LjA0MTgzIDIyLjIxMDUgNy4wMzQ5M0MyMi4xODQgNi45OTUwMiAyMi4wNzQ3IDYuOTU1MiAyMS45NzA2IDYuOTM1MjRDMjEuODkxIDYuOTIwMDYgMjEuODE0NyA2LjkxNjQ1IDIxLjc4MDggNi45MzMzM0MyMS4yMjMxIDcuMjA1MiAyMC42MzA4IDcuMzA2NjcgMjAuMDE2NiA3LjMxNzEyQzE4Ljg2MDcgNy4zMzY2MyAxNy43MDIgNy4zMzY0NSAxNi41NDYgNy4zMTcxMkMxNS45MzIzIDcuMzA2NjQgMTUuMzQwNCA3LjIwNDk2IDE0Ljc4MzIgNi45MzMzM0MxNC43MDUxIDYuODk0MjYgMTQuNDAwMyA2Ljk2NDU1IDE0LjM1MzUgNy4wMzQ5M0MxNC4zNDE3IDcuMDU0NDcgMTQuMzQ5NSA3LjA2NjE1IDE0LjM1MzUgNy4wODU2OEwxNC4zNTM5IDcuMDg3NTlDMTQuNTY3IDguMDIwNDIgMTQuNzk4OCA4Ljg3OTY5IDE0Ljc5ODggOS45MTUwOVYxNi45Mjk5QzEzLjUwNzQgMTguMjIxMyAxMi4yMDkzIDE5LjUwNiAxMC45MTUyIDIwLjc5NDhWMTMuNDYzNUw1Ljg4Njg0IDEzLjQwNDhWOS42NjEwNEw4LjgyMTAzIDkuNjc2NjRDOS41OTcyMSA5LjY3NjY0IDEwLjc2NjEgMTEuMTE3IDExLjAzMDYgMTEuNDgwMkwxMS4yNzc1IDExLjIzMzJDMTEuMjc3NSAxMS4yMzMyIDEwLjkxNTIgMTAuMjc3NiAxMC45MTUyIDkuMzkyNjVDMTAuOTE1MiA4LjUwNzU1IDEwLjkxMTMgNi45OTE5NCAxMC45MTEzIDYuOTkxOTRIOS4wODI3OEM4LjY1MzAzIDYuOTkxOTQgOC4yMzg4OCA2LjgwMDQxIDcuOTM4MDYgNi40NjQ0TDUuNjMyODQgNC4zOTMxMkM1LjQ5MjIyIDQuMjY0MjMgNS40MTAxNiA0LjA4MDQ2IDUuNDEwMTYgMy44ODUxMlYyLjc5NDhaIiBmaWxsPSIjRkYyRjQyIi8+Cjwvc3ZnPgo=';

export class PredeployedConnector extends Connector {
  readonly id: string = PREDEPLOYED_ID;
  readonly name: string = PREDEPLOYED_NAME;

  private _account: AccountInterface;
  private _chainId: bigint;

  constructor(rpcUrl: string, chainId: string, predeployedAccounts: PredeployedAccount[]) {
    super();
    const account: PredeployedAccount = predeployedAccounts.find((e) => e.active === true)
    if (!account) {
      throw new Error('PredeployedConnector: missing account')
    }
    this._chainId = BigInt(stringToFelt(chainId))
    this._account = new Account(
      new RpcProvider({ nodeUrl: rpcUrl }),
      account.address,
      account.privateKey,
      '1',
    )
  }

  readonly icon = {
    dark: katanaIcon,
    light: katanaIcon,
  };

  async chainId(): Promise<bigint> {
    return Promise.resolve(this._chainId)
  }

  available(): boolean {
    return (this._account != null)
  }

  ready(): Promise<boolean> {
    return Promise.resolve(this._account != null);
  }

  async connect() {
    return {
      account: this._account.address,
      chainId: this._chainId,
    };
  }

  disconnect(): Promise<void> {
    return Promise.resolve();
  }

  account() {
    if (!this._account) {
      throw new Error('PredeployedConnector: no account')
    }
    return Promise.resolve(this._account);
  }

  username() {
    return PREDEPLOYED_NAME;
  }

  static getName() {
    return PREDEPLOYED_NAME;
  }

  async externalDetectWallets(): Promise<ExternalWallet[]> {
    return [];
  }

  // example:
  // https://github.com/argentlabs/starknetkit/blob/develop/src/connectors/webwallet/starknetWindowObject/argentStarknetWindowObject.ts#L56
  async request(call: any) {
    switch (call.type) {
      case 'wallet_requestAccounts': {
        return [this._account.address]
      }
      // case 'wallet_signTypedData': {
      // }
      // case 'wallet_getPermissions': {
      // }
      // case 'wallet_addInvokeTransaction': {
      // }
      // case 'wallet_requestChainId': {
      // }
      // case 'wallet_addStarknetChain': {
      // }
      // case 'wallet_switchStarknetChain': {
      // }
      // case 'wallet_watchAsset': {
      // }
      // case 'wallet_deploymentData': {
      // }
      default:
        throw new Error(`PredeployedConnector: request not implemented [${call.type}]`)
    }
  }
}
