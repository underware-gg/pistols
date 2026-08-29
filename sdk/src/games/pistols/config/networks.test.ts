import { describe, expect, test } from 'vitest'

import { getNetworkConfig, NetworkId } from './networks'

describe.each([
  NetworkId.SEPOLIA,
  NetworkId.MAINNET,
])('getNetworkConfig(%s)', (networkId) => {
  test('uses the Torii protocol endpoints beneath the configured base URL', () => {
    const config = getNetworkConfig(networkId)

    expect(config.graphqlUrl).toBe(`${config.toriiUrl}/graphql`)
    expect(config.sqlUrl).toBe(`${config.toriiUrl}/sql`)
  })

  test('routes every Torii protocol to an overridden base URL', () => {
    const config = getNetworkConfig(networkId, {
      TORII_URL: 'http://127.0.0.1:8080',
    })

    expect(config.toriiUrl).toBe('http://127.0.0.1:8080')
    expect(config.graphqlUrl).toBe('http://127.0.0.1:8080/graphql')
    expect(config.sqlUrl).toBe('http://127.0.0.1:8080/sql')
  })

  test('allows individual protocol endpoints to be overridden', () => {
    const config = getNetworkConfig(networkId, {
      TORII_URL: 'http://127.0.0.1:8080',
      TORII_GRAPHQL_URL: 'https://graphql.example.test',
      TORII_SQL_URL: 'https://sql.example.test',
    })

    expect(config.graphqlUrl).toBe('https://graphql.example.test')
    expect(config.sqlUrl).toBe('https://sql.example.test')
  })
})
