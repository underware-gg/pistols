import { queryToriiSql } from '../utils.js';

//------------------------------------------------------------------------
// misc functions
//
export const _log = (...args) => {
  console.log(`--- `, ...args);
}
export const _error = (message) => {
  console.error(`>>> ${message}`);
}
export const _exit = (messages = 'Bye') => {
  console.error(``);
  console.error(`>>> EXIT...`);
  (Array.isArray(messages) ? messages : [messages]).forEach(m => {
    if (m) console.error(`>>> ${m}`);
  });
  console.error(``);
  process.exit(0);
}


//------------------------------------------------
// Tokens Metadata
//

// export interface torii_Token {
//   contract_address: string;
//   token_id: string;
//   name: string;
//   symbol: string;
//   decimals: number;
//   metadata: string;
// }

// function formatFnToken(rows: torii_Token[]): torii_Token[] {
function formatFnToken(rows) {
  return rows
    .filter(row => BigInt(row?.token_id ?? 0) > 0n)
    .map(row => ({
      ...row,
      token_id: BigInt(row.token_id).toString(),
    }));
}

// export const getTokensMetadata = async (contractAddress: string, networkId: NetworkId): Promise<torii_Token[] | null> => {
export const getTokensMetadata = async (contractAddress, sqlUrl) => {
  const query = `
select contract_address,token_id,metadata
from tokens
where contract_address="${contractAddress}"
order by token_id asc
`;
  // console.log(`getTokensMetadata(${contractAddress}):`, query);
  const response = await queryToriiSql(sqlUrl, query, formatFnToken);
  // console.log(`getTokensMetadata(${contractAddress}):`, response);
  return response;
};



//------------------------------------------------
// Tokens Balances
//

// export interface torii_TokenBalance {
//   balance: string;
//   account_address: string;
//   contract_address: string;
//   token_id: string;
// }

// function formatFnTokenBalance(rows: torii_TokenBalance[]): torii_TokenBalance[] {
function formatFnTokenBalance(rows) {
  return rows.map(row => {
    // console.log(`formatFnTokenBalance(${row.token_id}):`, row);
    const balance = BigInt(row.balance).toString();
    const token_id = BigInt(row.token_id.split(':')[1] ?? 0);
    // console.log(`formatFnTokenBalance()...`, token_id, balance);
    if (token_id == 0n) return undefined;
      return {
      ...row,
      balance,
      token_id,
    };
  }).filter(Boolean);
}

// export const getTokenBalances = async (contractAddress: string, networkId: NetworkId): Promise<torii_TokenBalance[] | null> => {
export const getTokenBalances = async (contractAddress, sqlUrl) => {
  const query = `
select contract_address,account_address,token_id,balance
from token_balances
where contract_address="${contractAddress}"
and balance!="0x0000000000000000000000000000000000000000000000000000000000000000"
order by token_id asc
`;
  // console.log(`getTokenBalances(${contractAddress}):`, query);
  const response = await queryToriiSql(sqlUrl, query, formatFnTokenBalance);
  // console.log(`getTokenBalances(${contractAddress}):`, response);
  return response;
};
