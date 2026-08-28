import { useEffect, useMemo, useState } from 'react'
import { useAccount } from '@underware/pistols-sdk/utils/hooks';
import { useMounted } from '@underware/pistols-sdk/utils/hooks';
import { useSdkSqlQuery, useSqlQuery } from '@underware/pistols-sdk/dojo/sql';
import { useTokenContracts } from '/src/hooks/useTokenContracts'
import { useDuelistTokenStore, useDuelTokenStore, usePackTokenStore, useRingTokenStore, useTournamentTokenStore } from '/src/stores/tokenStore'
import { useFameCoinStore, useLordsCoinStore, useFoolsCoinStore } from '/src/stores/coinStore'
import { bigintToAddress, bigintToHex, bigintToDecimal, isPositiveBigint } from '@underware/pistols-sdk/utils';
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
    contract_address: bigintToAddress(row.contract_address),
    account_address: bigintToAddress(row.account_address),
    balance: bigintToHex(row.balance),
    token_id: bigintToDecimal(row.token_id.split(':')[1] ?? 0n),
  }));
}

//---------------------------------
// Get initial token balances 
// (to be used use only once, at app start)
//
export const useFetchInitialTokenBalancesQuery = (last_iso_timestamp: string) => {
  const mounted = useMounted()
  const { address } = useAccount();
  const { erc20Tokens, erc721Tokens } = useTokenContracts()
  const [fetched, setFetched] = useState(false);

  const query = useMemo(() => {
    if (!mounted || !address || fetched || !last_iso_timestamp) return '';
    const _getAlllBalances = [
      `'${erc721Tokens.duelistContractAddress}'`,
      `'${erc721Tokens.ringContractAddress}'`,
    ];
    const _getPlayerBalances = [
      `'${erc721Tokens.packContractAddress}'`,
      `'${erc20Tokens.foolsContractAddress}'`,
      `'${erc20Tokens.lordsContractAddress}'`,
    ];
    let queries = [
      // balances needed for all players (not previously cached)
      `select contract_address, account_address, balance, token_id`,
      `from token_balances`,
      `where contract_address in (${Object.values(_getAlllBalances).join(',')})`,
      `and balance!='${bigintToAddress(0n)}'`,
      `and token_id in (select token_id from token_transfers where contract_address in (${Object.values(_getAlllBalances).join(',')}) and executed_at>'${last_iso_timestamp}')`,
      // balances needed for current player
      `union all`,
      `select contract_address, account_address, balance, token_id`,
      `from token_balances`,
      `where contract_address in (${Object.values(_getPlayerBalances).join(',')})`,
      `and account_address='${bigintToAddress(address)}'`,
      // `order by 3, 2`,
    ];
    return queries.join(' ');
  }, [mounted, address, erc20Tokens, erc721Tokens, fetched, last_iso_timestamp])

  // const { data, isLoading } = useSdkSqlQuery({ // dojo.js / tanstack
  const { data, isLoading } = useSqlQuery({ // pistols
    query,
    formatFn,
  });

  useEffect(() => debug.log('SQL BALANCES:', last_iso_timestamp, isLoading, fetched, data?.length, query, data), [last_iso_timestamp, isLoading, fetched, data, query])

  // add balances to token stores
  useAddBalancesToTokenStores(data);

  // avoid running this more than once
  useEffect(() => {
    if (data?.length > 0) {
      setFetched(true);
    }
  }, [data])

  return {
    initialTokenBalances: data,
    isLoading,
    address,
  }
}


//---------------------------------
// Get token balances of an account
// (admin/internal use only)
//
export const useFetchTokenBalancesOwnedByAccount = (accountAddress: BigNumberish) => {
  const query = useMemo(() => {
    if (!isPositiveBigint(accountAddress)) return '';
    return `select contract_address, account_address, balance, token_id from token_balances where account_address='${bigintToAddress(accountAddress)}'`;
  }, [accountAddress])
  const { data, isLoading } = useSdkSqlQuery({
    query,
    formatFn,
  });
  useEffect(() => debug.log('SQL ACCOUNT TOKENS:', data.length, data.length > 0 && query), [data, query])
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
  const updateDuelistBalance = useDuelistTokenStore((state) => state.updateBalance)
  const updateDuelBalance = useDuelTokenStore((state) => state.updateBalance)
  const updatePackBalance = usePackTokenStore((state) => state.updateBalance)
  const updateRingBalance = useRingTokenStore((state) => state.updateBalance)
  const updateTournamentBalance = useTournamentTokenStore((state) => state.updateBalance)
  // coin stores
  const updateLordsBalance = useLordsCoinStore((state) => state.updateBalance)
  const updateFameBalance = useFameCoinStore((state) => state.updateBalance)
  const updateFoolsBalance = useFoolsCoinStore((state) => state.updateBalance)

  useEffect(() => {
    // const pageNumber = (balances?.length == 0 ? 0 : 1)
    balances?.forEach(balance => {
      if (balance.contract_address === allTokens.lordsContractAddress) {
        updateLordsBalance(balance)
      } else if (balance.contract_address === allTokens.fameContractAddress) {
        updateFameBalance(balance)
      } else if (balance.contract_address == allTokens.foolsContractAddress) {
        updateFoolsBalance(balance)
      } else if (balance.contract_address == allTokens.duelistContractAddress) {
        updateDuelistBalance(balance)
      } else if (balance.contract_address == allTokens.packContractAddress) {
        updatePackBalance(balance)
      } else if (balance.contract_address == allTokens.ringContractAddress) {
        updateRingBalance(balance)
      } else if (balance.contract_address == allTokens.duelContractAddress) {
        updateDuelBalance(balance)
      } else if (balance.contract_address == allTokens.tournamentContractAddress) {
        updateTournamentBalance(balance)
      }
    })
  }, [allTokens.duelContractAddress, allTokens.duelistContractAddress, allTokens.fameContractAddress, allTokens.foolsContractAddress, allTokens.lordsContractAddress, allTokens.packContractAddress, allTokens.ringContractAddress, allTokens.tournamentContractAddress, balances, updateDuelBalance, updateDuelistBalance, updateFameBalance, updateFoolsBalance, updateLordsBalance, updatePackBalance, updateRingBalance, updateTournamentBalance])
  return {}
}
