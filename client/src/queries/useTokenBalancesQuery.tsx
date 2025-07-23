import { useEffect, useMemo } from 'react'
import { useAccount } from '@starknet-react/core';
import { useMounted } from '@underware/pistols-sdk/utils/hooks';
import { useSdkSqlQuery } from '@underware/pistols-sdk/dojo/sql';
import { useTokenContracts } from '/src/hooks/useTokenContracts'
import { bigintToAddress, bigintToHex } from '@underware/pistols-sdk/utils';
import { debug } from '@underware/pistols-sdk/pistols'

// format returned by sql query
type QueryResponseRaw = Array<{
  contract_address: string;
  account_address: string;
  balance: string;
  token_id: string;
}>;
// format we need
type QueryResponse = {
  contractAddress: bigint;
  accountAddress: bigint;
  balance: bigint;
  tokenId: bigint;
};
function formatFn(rows: QueryResponseRaw): QueryResponse[] {
  return rows.map((row) => ({
    contractAddress: BigInt(row.contract_address),
    accountAddress: BigInt(row.account_address),
    balance: BigInt(row.balance),
    tokenId: BigInt(row.token_id.split(':')[1] ?? 0n),
  }));
}

//---------------------------------
// Get initial token balances 
// (to be used use only once, at app start)
//
export const useTokenBalancesQuery = () => {
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

  return {
    initialTokenBalances: data,
    isLoading,
  }
}
