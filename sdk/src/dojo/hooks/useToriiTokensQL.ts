import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { gql } from '@apollo/client'
import { useSelectedChain } from 'src/dojo/hooks/useChain'
import { useGraphQLQuery } from 'src/hooks/useGraphQL'
import { bigintToHex, isPositiveBigint } from 'src/utils/types'


//---------------------------
// Queries
//
const tokenBalances = gql`
query tokenBalances(
  $address: String
){
  tokenBalances(
    accountAddress: $address
  ){
    totalCount
    edges {
      node {
        tokenMetadata {
          __typename
          ... on ERC20__Token {
            contractAddress
            #name
            symbol
            decimals
            amount
          }
          ... on ERC721__Token {
            contractAddress
            #name
            symbol
            tokenId
            #metadata
            #metadataName
            #metadataDescription
            #metadataAttributes
            #imagePath
          }
        }
      }
    }
  }
}
`;

// const tokenTransfers = gql`
// query tokenTransfers($address: String, $limit: Int){
//   tokenTransfers(
//     accountAddress: $address
//     limit: $limit
//   ){
//   	type
//     from
//     to
//     amount
//     executedAt
//     transactionHash
//     tokenMetadata{
//       name
//       symbol
//       tokenId
//       decimals
//       contractAddress
//     }
//   }
// }
// `;


//---------------------------
// Torii data
//

export type ERC_typename = 'ERC20__Token' | 'ERC721__Token'

export type ERC20_Token = {
  symbol: string;
  decimals: number
  balance: bigint
  balance_eth: bigint
}
export type ERC721_Token = {
  symbol: string;
  tokenIds: bigint[]
}
export type ERC_Token = ERC20_Token | ERC721_Token

export type ERC_Tokens = {
  ERC20: {
    [contractAddress: string]: ERC20_Token
  },
  ERC721: {
    [contractAddress: string]: ERC721_Token
  },
}

function useToriiTokenBalancesQL(variables: any, skip: boolean, watch: boolean) {
  const { selectedChainConfig } = useSelectedChain()
  const toriiUrl = useMemo(() => `${selectedChainConfig.toriiUrl}/graphql`, [selectedChainConfig.toriiUrl])
  const { data, isLoading, refetch } = useGraphQLQuery(
    toriiUrl,
    tokenBalances,
    variables,
    skip,
    watch,
    1000,
  );
  const tokens = useMemo(() => {
    let tokens: ERC_Tokens = {
      ERC20: {},
      ERC721: {},
    }
    // console.log(`QL_DATA:`, data)
    data?.tokenBalances?.edges.forEach((e: any, index: number) => {
      const token = e.node.tokenMetadata
      const typename = token.__typename as ERC_typename
      // console.log(`QL_TOKEN[${index}][${typename}]:`, token)
      const contractAddress = bigintToHex(token.contractAddress)
      if (typename === 'ERC20__Token') {
        if (!tokens.ERC20[contractAddress]) {
          tokens.ERC20[contractAddress] = {
            symbol: token.symbol,
            decimals: token.decimals,
            balance: 0n,
            balance_eth: 0n,
          }
        }
        tokens.ERC20[contractAddress].balance += BigInt(token.amount)
        tokens.ERC20[contractAddress].balance_eth = (tokens.ERC20[contractAddress].balance / (10n ** BigInt(tokens.ERC20[contractAddress].decimals)))
      } else if (typename === 'ERC721__Token') {
        if (!tokens.ERC721[contractAddress]) {
          tokens.ERC721[contractAddress] = {
            symbol: token.symbol,
            tokenIds: [],
          }
        }
        tokens.ERC721[contractAddress].tokenIds.push(BigInt(token.tokenId))
      }
    })
    // console.log(`>>> QL TOKENS:`, tokens)
    return tokens;
  }, [data])
  return {
    tokens,
    isLoading,
    refetch,
  }
}


//----------------------------------------
// Queries
//

export function useToriiTokenIdsByOwnerQL(contractAddress: BigNumberish, owner: BigNumberish, watch: boolean) {
  const variables = useMemo(() => ({
    address: bigintToHex(owner).toLowerCase(),
  }), [owner]);
  const skip = useMemo(() => (!isPositiveBigint(owner)), [owner])

  const { tokens, isLoading, refetch } = useToriiTokenBalancesQL(variables, skip, watch)

  const tokenIds = useMemo<bigint[]>(() =>
    tokens.ERC721[bigintToHex(contractAddress)]?.tokenIds ?? [],
  [tokens, contractAddress])
  // console.log(`>>> useToriiTokenIdsByOwnerQL():`, bigintToHex(owner), tokenIds)
  
  return {
    tokenIds,
    isLoading,
    refetch,
  }
}

export function useToriiBalancesByContractQL(contractAddress: BigNumberish, watch: boolean) {
  const variables = useMemo(() => ({
    contractAddress: bigintToHex(contractAddress).toLowerCase(),
  }), [contractAddress]);
  const skip = useMemo(() => (!isPositiveBigint(contractAddress)), [contractAddress])

  const { tokens, isLoading, refetch } =  useToriiTokenBalancesQL(variables, skip, watch)

  const balances = useMemo(() =>
    tokens.ERC20[bigintToHex(contractAddress)],
  [tokens, contractAddress])
  console.log(`>>> useToriiBalancesByContractQL():`, contractAddress, balances)

  return {
    balances,
    isLoading,
    refetch,
  }
}