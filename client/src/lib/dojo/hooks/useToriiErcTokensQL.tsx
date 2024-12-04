import { useMemo } from 'react'
import { gql } from '@apollo/client'
import { BigNumberish } from 'starknet'
import { useSelectedChain } from '@/lib/dojo/hooks/useChain'
import { useGraphQLQuery } from '@/lib/utils/hooks/useGraphQL'
import { bigintEquals, bigintToHex, isPositiveBigint } from '@/lib/utils/types'


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

export function useToriiTokensByOwner(owner: BigNumberish, watch: boolean = false) {
  const { selectedChainConfig } = useSelectedChain()
  const variables = useMemo(() => ({
    address: bigintToHex(owner).toLowerCase(),
  }), [owner]);
  const toriiUrl = useMemo(() => `${selectedChainConfig.toriiUrl}/graphql`, [selectedChainConfig.toriiUrl])
  const { data, refetch } = useGraphQLQuery(
    toriiUrl,
    tokenBalances,
    variables,
    !isPositiveBigint(owner),
    watch,
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
    refetch,
  }
}

export function useErc721TokenIdsByOwner(contractAddress: BigNumberish, owner: BigNumberish, watch: boolean = false) {
  const { tokens, refetch } = useToriiTokensByOwner(owner, watch)
  const tokenIds = useMemo<bigint[]>(() =>
    tokens.ERC721[bigintToHex(contractAddress)]?.tokenIds ?? [],
  [tokens, contractAddress])
  // console.log(`>>> useErc721TokenIdsByOwner():`, tokenIds)
  return {
    tokenIds,
    refetch,
  }
}
