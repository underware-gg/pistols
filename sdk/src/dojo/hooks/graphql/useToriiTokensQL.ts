import { useEffect, useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { gql } from '@apollo/client'
import { useDojoSetup } from 'src/dojo/contexts/DojoContext'
import { useGraphQLQuery } from 'src/dojo/hooks/graphql/useGraphQL'
import { bigintToHex, isPositiveBigint } from 'src/utils/misc/types'


//---------------------------
// Queries
//
const tokenBalances = gql`
query tokenBalances(
  $address: String
){
  tokenBalances(
    accountAddress: $address
    first: 1000
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
            metadata
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
  tokens: {
    tokenId: bigint,
    metadata: string,
  }[]
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

function useToriiTokenBalancesQL(variables: any, enabled: boolean, watch: boolean) {
  const { selectedNetworkConfig } = useDojoSetup()
  const { data, isLoading, refetch } = useGraphQLQuery({
    graphqlUrl: selectedNetworkConfig.graphqlUrl,
    query: tokenBalances,
    variables,
    enabled,
    watch,
    pollInterval: 1000,
  });
  // console.log(`QL_QUERY:`, isLoading, variables, data)
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
            tokens: [],
          }
        }
        tokens.ERC721[contractAddress].tokens.push({
          tokenId: BigInt(token.tokenId),
          metadata: token.metadata,
        })
      }
    })
    return tokens;
  }, [data])
  useEffect(() => console.log(`>>> QL TOKENS:`, tokens), [tokens])
  return {
    tokens,
    isLoading,
    refetch,
  }
}


//----------------------------------------
// Queries
//

export function useToriiTokensByOwnerQL(contractAddress: BigNumberish, owner: BigNumberish, watch: boolean) {
  const variables = useMemo(() => ({
    address: owner ? bigintToHex(owner).toLowerCase() : undefined,
  }), [owner]);
  const enabled = useMemo(() => isPositiveBigint(owner), [owner])

  const { tokens: rawTokens, isLoading, refetch } = useToriiTokenBalancesQL(variables, enabled, watch)

  const tokens = useMemo(() => (
    rawTokens.ERC721[bigintToHex(contractAddress)]?.tokens ?? []
  ), [rawTokens, contractAddress])
  
  return {
    tokens,
    isLoading,
    refetch,
  }
}

export function useToriiBalancesByContractQL(contractAddress: BigNumberish, watch: boolean) {
  const variables = useMemo(() => ({
    contractAddress: bigintToHex(contractAddress).toLowerCase(),
  }), [contractAddress]);
  const enabled = useMemo(() => isPositiveBigint(contractAddress), [contractAddress])

  const { tokens, isLoading, refetch } =  useToriiTokenBalancesQL(variables, enabled, watch)

  const balances = useMemo(() =>
    tokens.ERC20[bigintToHex(contractAddress)],
  [tokens, contractAddress])
  // console.log(`>>> useToriiBalancesByContractQL():`, watch, contractAddress, balances)

  return {
    balances,
    isLoading,
    refetch,
  }
}