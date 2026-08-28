import { Account, AccountInterface, RpcProvider, Signer } from 'starknet'
import {
  Permission,
  type AddInvokeTransactionParameters,
  type RequestFn,
  type RequestFnCall,
  type RpcMessage,
  type RpcTypeToMessageMap,
  type SwitchStarknetChainParameters,
  type TypedData,
} from '@starknet-io/types-js'
import {
  StandardConnect,
  StandardDisconnect,
  StandardEvents,
  StarknetWalletApi,
  type StandardEventsListeners,
  type StandardEventsNames,
  type StandardEventsOnMethod,
} from '@starknet-io/get-starknet-core'
import { stringToFelt } from 'src/starknet/starknet'
import { PredeployedAccount } from 'src/games/pistols/config/networks'
import type { Connector } from 'src/starknet/wallet'

export const PREDEPLOYED_ID = 'predeployed';
export const PREDEPLOYED_NAME = 'Predeployed Account';
export const katanaIcon = 'data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMzYgMjQiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xOC4yNzk4IDEzLjU4NzNDMTkuNjE5OCAxMy41ODczIDIwLjcwNjEgMTIuNTAwOCAyMC43MDYxIDExLjE2MDVDMjAuNzA2MSA5LjgyMDE3IDE5LjYxOTggOC43MzM2NCAxOC4yNzk4IDguNzMzNjRDMTYuOTM5OCA4LjczMzY0IDE1Ljg1MzUgOS44MjAxNyAxNS44NTM1IDExLjE2MDVDMTUuODUzNSAxMi41MDA4IDE2LjkzOTggMTMuNTg3MyAxOC4yNzk4IDEzLjU4NzNaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNNS40MTAxNiAyLjc5NDhIMzEuMTUzOVYzLjg4NTEyQzMxLjE1MzkgNC4wODA0NiAzMS4wNzE4IDQuMjY0MjMgMzAuOTMxMiA0LjM5MzEyTDI4LjYyNiA2LjQ2NDRDMjguMzI1MSA2LjgwMDQxIDI3LjkxMSA2Ljk5MTk0IDI3LjQ4MTIgNi45OTE5NEgyNS42NTI3QzI1LjY1MjcgNi45OTE5NCAyNS42NDg4IDguNTA3NTUgMjUuNjQ4OCA5LjM5MjY1QzI1LjY0ODggMTAuMjc3NiAyNS4yODY1IDExLjIzMzIgMjUuMjg2NSAxMS4yMzMyTDI1LjUzMzQgMTEuNDgwMkMyNS43OTc5IDExLjExNyAyNi45NjY4IDkuNjc2NjQgMjcuNzQzIDkuNjc2NjRMMzAuNjc3MiA5LjY2MTA0VjEzLjQwNDhMMjUuNjQ4OCAxMy40NjM1VjIwLjc5NDhMMjQuNzY5NyAxOS45MTk0QzIzLjc2NzggMTguOTIzMyAyMi43NjQyIDE3LjkyODkgMjEuNzY1MiAxNi45Mjk5VjkuOTE1MDlDMjEuNzY1MiA4Ljg3MDU2IDIxLjk5NjkgOC4wMjA4MiAyMi4yMTAxIDcuMDg3NTlMMjIuMjEwNSA3LjA4NTY4TDIyLjIxMTkgNy4wNzk3NEwyMi4yMTM0IDcuMDczOUMyMi4yMTU0IDcuMDY2NjggMjIuMjE3MSA3LjA2MDMxIDIyLjIxNjcgNy4wNTM0MUMyMi4yMTY0IDcuMDQ3NzggMjIuMjE0NyA3LjA0MTgzIDIyLjIxMDUgNy4wMzQ5M0MyMi4xODQgNi45OTUwMiAyMi4wNzQ3IDYuOTU1MiAyMS45NzA2IDYuOTM1MjRDMjEuODkxIDYuOTIwMDYgMjEuODE0NyA2LjkxNjQ1IDIxLjc4MDggNi45MzMzM0MyMS4yMjMxIDcuMjA1MiAyMC42MzA4IDcuMzA2NjcgMjAuMDE2NiA3LjMxNzEyQzE4Ljg2MDcgNy4zMzY2MyAxNy43MDIgNy4zMzY0NSAxNi41NDYgNy4zMTcxMkMxNS45MzIzIDcuMzA2NjQgMTUuMzQwNCA3LjIwNDk2IDE0Ljc4MzIgNi45MzMzM0MxNC43MDUxIDYuODk0MjYgMTQuNDAwMyA2Ljk2NDU1IDE0LjM1MzUgNy4wMzQ5M0MxNC4zNDE3IDcuMDU0NDcgMTQuMzQ5NSA3LjA2NjE1IDE0LjM1MzUgNy4wODU2OEwxNC4zNTM5IDcuMDg3NTlDMTQuNTY3IDguMDIwNDIgMTQuNzk4OCA4Ljg3OTY5IDE0Ljc5ODggOS45MTUwOVYxNi45Mjk5QzEzLjUwNzQgMTguMjIxMyAxMi4yMDkzIDE5LjUwNiAxMC45MTUyIDIwLjc5NDhWMTMuNDYzNUw1Ljg4Njg0IDEzLjQwNDhWOS42NjEwNEw4LjgyMTAzIDkuNjc2NjRDOS41OTcyMSA5LjY3NjY0IDEwLjc2NjEgMTEuMTE3IDExLjAzMDYgMTEuNDgwMkwxMS4yNzc1IDExLjIzMzJDMTEuMjc3NSAxMS4yMzMyIDEwLjkxNTIgMTAuMjc3NiAxMC45MTUyIDkuMzkyNjVDMTAuOTE1MiA4LjUwNzU1IDEwLjkxMTMgNi45OTE5NCAxMC45MTEzIDYuOTkxOTRIOS4wODI3OEM4LjY1MzAzIDYuOTkxOTQgOC4yMzg4OCA2LjgwMDQxIDcuOTM4MDYgNi40NjQ0TDUuNjMyODQgNC4zOTMxMkM1LjQ5MjIyIDQuMjY0MjMgNS40MTAxNiA0LjA4MDQ2IDUuNDEwMTYgMy44ODUxMlYyLjc5NDhaIiBmaWxsPSIjRkYyRjQyIi8+Cjwvc3ZnPgo=';

type IdentifierString = `${string}:${string}`

export class PredeployedConnector implements Connector {
  readonly version = '1.0.0' as const
  readonly name: string = PREDEPLOYED_NAME;
  readonly icon = katanaIcon as `data:image/svg+xml;base64,${string}`

  private _account: AccountInterface;
  private _chainId: bigint;
  private _connected = false
  private _listeners: {
    [E in StandardEventsNames]?: StandardEventsListeners[E][]
  } = {}

  constructor(rpcUrl: string, chainId: string, predeployedAccounts: PredeployedAccount[]) {
    const account: PredeployedAccount = predeployedAccounts.find((e) => e.active === true)
    if (!account) {
      throw new Error('PredeployedConnector: missing account')
    }
    this._chainId = BigInt(stringToFelt(chainId))
    this._account = new Account({
      provider: new RpcProvider({ nodeUrl: rpcUrl }),
      address: account.address,
      signer: new Signer(account.privateKey),
      // transactionVersion: SupportedTransactionVersion,
    });
  }

  get chains(): readonly IdentifierString[] {
    return [this._walletChainId]
  }

  get accounts() {
    return this._connected ? [this._walletAccount] : []
  }

  get features(): Connector['features'] {
    return {
      [StandardConnect]: {
        version: '1.0.0',
        connect: this._connect,
      },
      [StandardDisconnect]: {
        version: '1.0.0',
        disconnect: this._disconnect,
      },
      [StandardEvents]: {
        version: '1.0.0',
        on: this._on,
      },
      [StarknetWalletApi]: {
        id: PREDEPLOYED_ID,
        version: '1.0.0',
        walletVersion: '1.0.0',
        request: this.request,
      },
    }
  }

  private get _walletChainId(): IdentifierString {
    return `starknet:0x${this._chainId.toString(16)}`
  }

  private get _walletAccount() {
    return {
      address: this._account.address,
      publicKey: new Uint8Array(),
      chains: [this._walletChainId],
      features: [StarknetWalletApi] as IdentifierString[],
    }
  }

  private _connect: Connector['features'][typeof StandardConnect]['connect'] = async () => {
    this._connected = true
    this._emit('change', { accounts: this.accounts })
    return { accounts: this.accounts }
  }

  private _disconnect: Connector['features'][typeof StandardDisconnect]['disconnect'] = async () => {
    this._connected = false
    this._emit('change', { accounts: [] })
  }

  private _on: StandardEventsOnMethod = (event, listener) => {
    if (!this._listeners[event]) this._listeners[event] = []
    this._listeners[event]?.push(listener)
    return () => {
      this._listeners[event] = this._listeners[event]?.filter((candidate) => candidate !== listener)
    }
  }

  private _emit<E extends StandardEventsNames>(
    event: E,
    ...args: Parameters<StandardEventsListeners[E]>
  ) {
    this._listeners[event]?.forEach((listener) => listener.apply(null, args))
  }

  request: RequestFn = async <T extends RpcMessage['type']>(
    call: RequestFnCall<T>,
  ): Promise<RpcTypeToMessageMap[T]['result']> => {
    switch (call.type) {
      case 'wallet_requestAccounts': {
        return [this._account.address]
      }
      case 'wallet_getPermissions': {
        return this._connected ? [Permission.ACCOUNTS] : []
      }
      case 'wallet_addInvokeTransaction': {
        const params = call.params as AddInvokeTransactionParameters
        return await this._account.execute(
          params.calls.map((call) => ({
            contractAddress: call.contract_address,
            entrypoint: call.entry_point,
            calldata: call.calldata,
          })),
        );
      }
      case 'wallet_requestChainId': {
        return `0x${this._chainId.toString(16)}`
      }
      case 'wallet_switchStarknetChain': {
        const params = call.params as SwitchStarknetChainParameters
        return BigInt(params.chainId) === this._chainId
      }
      case 'wallet_addStarknetChain':
      case 'wallet_watchAsset': {
        return true
      }
      case 'wallet_signTypedData': {
        const params = call.params as TypedData
        return await this._account.signMessage(params) as string[]
      }
      default:
        throw new Error(`PredeployedConnector: request not implemented [${call.type}]`)
    }
  }
}
