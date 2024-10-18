import { useMemo } from 'react'
import { gql } from '@apollo/client'
import { BigNumberish } from 'starknet'
import { useGraphQLQuery } from '@/lib/utils/hooks/useGraphQL'
import { useSelectedChain } from '@/lib/dojo/hooks/useChain'
import { bigintEquals, bigintToHex, isPositiveBigint } from '@/lib/utils/types'


//---------------------------
// Queries
//
const ercBalance = gql`
query erc_balance(
  $address: String
){
  ercBalance(
    accountAddress: $address
  ){
  	type
    balance
    tokenMetadata{
      name
      symbol
      tokenId
      decimals
      contractAddress
    }
  }
}
`;

const ercTransfer = gql`
query erc_transfer($address: String, $limit: Int){
  ercTransfer(
    accountAddress: $address
    limit: $limit
  ){
  	type
    from
    to
    amount
    executedAt
    transactionHash
    tokenMetadata{
      name
      symbol
      tokenId
      decimals
      contractAddress
    }
  }
}
`;


//---------------------------
// Torii data
//

export type ERC_Type = 'ERC20' | 'ERC721'

export interface ERC_Token {
  name: string;
  symbol: string;
  decimals: number;
  contractAddress: bigint;
}
export type ERC20_Token = ERC_Token & {
  balance: bigint;
  balance_eth: bigint;
}
export type ERC721_Token = ERC_Token & {
  balance: number
  tokenIds: bigint[]
}
export type ERC_Tokens = {
  ERC20: ERC20_Token[],
  ERC721: ERC721_Token[],
}

export function useToriiTokensByOwner(owner: BigNumberish) {
  const { selectedChainConfig } = useSelectedChain()
  const variables = useMemo(() => ({
    address: bigintToHex(owner).toLowerCase(),
  }), [owner]);
  const { data, refetch } = useGraphQLQuery(
    selectedChainConfig.toriiUrl + '/graphql',
    ercBalance,
    variables,
    !isPositiveBigint(owner)
  );
  const tokens = useMemo(() => {
    let tokens: ERC_Tokens = {
      ERC20: [],
      ERC721: [],
    }
    data?.ercBalance?.forEach((token: any) => {
      const type = token.type as ERC_Type
      const contractAddress = BigInt(token.tokenMetadata.contractAddress)
      let tokenIndex = tokens[type].findIndex(t => t.contractAddress === contractAddress)
      if (type === 'ERC20') {
        if (tokenIndex == -1) {
          tokens[type].push({
            name: token.tokenMetadata.name,
            symbol: token.tokenMetadata.symbol,
            decimals: Number(token.tokenMetadata.decimals),
            contractAddress,
            balance: 0n,
            balance_eth: 0n,
          })
          tokenIndex = tokens[type].length - 1
        }
        tokens[type][tokenIndex].balance += BigInt(token.balance)
        tokens[type][tokenIndex].balance_eth = (tokens[type][tokenIndex].balance / (10n ** BigInt(tokens[type][tokenIndex].decimals)))
      } else if (type === 'ERC721') {
        if (tokenIndex == -1) {
          tokens[type].push({
            name: token.tokenMetadata.name,
            symbol: token.tokenMetadata.symbol,
            decimals: Number(token.tokenMetadata.decimals),
            contractAddress,
            balance: 0,
            tokenIds: [],
          })
          tokenIndex = tokens[type].length - 1
        }
        tokens[type][tokenIndex].balance++
        tokens[type][tokenIndex].tokenIds.push(BigInt(token.tokenMetadata.tokenId))
      }
    })
    // console.log(`>>> TOKENS:`, tokens)
    return tokens;
  }, [data])
  return {
    tokens,
    refetch,
  }
}

export function useToriiErc721TokenByOwner(contractAddress: BigNumberish, owner: BigNumberish) {
  const { tokens, refetch } = useToriiTokensByOwner(owner)
  const token = useMemo(() => 
    tokens.ERC721.find(token => bigintEquals(token.contractAddress, contractAddress)),
  [tokens, contractAddress])
  return {
    token,
    refetch,
  }
}
