import { useEffect, useMemo } from 'react'
import { useAccount } from '@starknet-react/core';
import { useMounted } from '@underware/pistols-sdk/utils/hooks';
import { useSdkSqlQuery } from '@underware/pistols-sdk/dojo/sql';
import { useTokenContracts } from '/src/hooks/useTokenContracts'
import { useDuelistTokenStore, useDuelTokenStore, usePackTokenStore, useRingTokenStore, useTournamentTokenStore } from '/src/stores/tokenStore'
import { useFameCoinStore, useLordsCoinStore, useFoolsCoinStore } from '/src/stores/coinStore'
import { bigintToAddress, bigintToHex, isPositiveBigint } from '@underware/pistols-sdk/utils';
import { debug } from '@underware/pistols-sdk/pistols'
import { BigNumberish } from 'starknet';
import * as torii from '@dojoengine/torii-client'

// format returned by sql query
type QueryResponseRaw = Array<{
  contract_address: string;
  account_address: string;
  balance: string;
  token_id: string;
}>;
// format we need
function formatFn(rows: QueryResponseRaw): torii.TokenBalance[] {
  return rows.map((row) => ({
    contract_address: bigintToHex(row.contract_address),
    account_address: bigintToHex(row.account_address),
    balance: bigintToHex(row.balance),
    token_id: bigintToHex(row.token_id.split(':')[1] ?? 0n),
  }));
}

//---------------------------------
// Get initial token balances 
// (to be used use only once, at app start)
//
export const useFetchInitialTokenBalancesQuery = () => {
  const mounted = useMounted()
  const { address } = useAccount();
  const { erc20Tokens, erc721Tokens } = useTokenContracts()

  const query = useMemo(() => {
    if (!mounted || !address) return '';
    const _getAlllBalances = [
      erc721Tokens.duelistContractAddress,
      erc721Tokens.ringContractAddress,
      erc20Tokens.fameContractAddress,
    ].map(a => `'${bigintToHex(a)}'`);
    const _getPlayerBalances = [
      erc721Tokens.packContractAddress,
      erc20Tokens.foolsContractAddress,
      erc20Tokens.lordsContractAddress,
    ].map(a => `'${bigintToHex(a)}'`);
    let queries = [
      `select contract_address, account_address, balance, token_id from token_balances where contract_address in (${Object.values(_getAlllBalances).join(',')}) and balance!='${bigintToAddress(0n)}'`,
      `union all`,
      `select contract_address, account_address, balance, token_id from token_balances where contract_address in (${Object.values(_getPlayerBalances).join(',')}) and account_address='${bigintToHex(address)}'`,
      // `order by 3, 2`,
    ];
    return queries.join(' ');
  }, [mounted, address, erc20Tokens, erc721Tokens])

  const { data, isLoading } = useSdkSqlQuery({
    query,
    formatFn,
  });

  // useEffect(() => debug.log('SQL BALANCES query', query), [query])
  // useEffect(() => debug.log('SQL BALANCES data', data), [data])
  useEffect(() => debug.log('SQL BALANCES:', data.length, query), [data])

  // add balances to token stores
  useAddBalancesToTokenStores(data);

  return {
    initialTokenBalances: data,
    isLoading,
  }
}


//---------------------------------
// Get token balances of an account
// (admin/internal use only)
//
export const useFetchTokenBalancesOwnedByAccount = (accountAddress: BigNumberish) => {
  const query = useMemo(() => {
    if (!isPositiveBigint(accountAddress)) return '';
    return `select contract_address, account_address, balance, token_id from token_balances where account_address='${bigintToHex(accountAddress)}'`;
  }, [accountAddress])
  const { data, isLoading } = useSdkSqlQuery({
    query,
    formatFn,
  });
  useEffect(() => debug.log('SQL ACCOUNT TOKENS:', data.length, query), [data])
  // add balances to token stores
  useAddBalancesToTokenStores(data);
  return {
    tokenBalances: data,
    isLoading,
  }
}



//----------------------------------------
// Fetching tokens of accounts
//

function useAddBalancesToTokenStores(balances: torii.TokenBalance[]) {
  const { allTokens } = useTokenContracts()
  // token stores
  const duelist_state = useDuelistTokenStore((state) => state)
  const duel_state = useDuelTokenStore((state) => state)
  const pack_state = usePackTokenStore((state) => state)
  const ring_state = useRingTokenStore((state) => state)
  const tournament_state = useTournamentTokenStore((state) => state)
  // coin stores
  const lords_state = useLordsCoinStore((state) => state)
  const fame_state = useFameCoinStore((state) => state)
  const fools_state = useFoolsCoinStore((state) => state)

  useEffect(() => {
    const pageNumber = (balances.length == 0 ? 0 : 1)
    balances.forEach(balance => {
      if (balance.contract_address === allTokens.lordsContractAddress) {
        lords_state.updateBalance(balance)
      } else if (balance.contract_address === allTokens.fameContractAddress) {
        fame_state.updateBalance(balance)
      } else if (balance.contract_address == allTokens.foolsContractAddress) {
        fools_state.updateBalance(balance)
      } else if (balance.contract_address == allTokens.duelistContractAddress) {
        duelist_state.updateBalance(balance)
      } else if (balance.contract_address == allTokens.packContractAddress) {
        pack_state.updateBalance(balance)
      } else if (balance.contract_address == allTokens.ringContractAddress) {
        ring_state.updateBalance(balance)
      } else if (balance.contract_address == allTokens.duelContractAddress) {
        duel_state.updateBalance(balance)
      } else if (balance.contract_address == allTokens.tournamentContractAddress) {
        tournament_state.updateBalance(balance)
      }
    })
  }, [balances])
  return {}
}
