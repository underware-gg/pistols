import { useEffect, useMemo } from 'react'
import { useCookies } from 'react-cookie'
import { bigintToHex, makeRandomHash, pedersen } from '@/pistols/utils/utils'

export const useCommitMove = (duelId: bigint, roundNumber: number) => {
  const key = bigintToHex(duelId)
  const [cookies] = useCookies([key]);

  const { hash, salt, move } = useMemo(() => {
    const currentValue = (cookies[key] ?? {})
    return currentValue[roundNumber] ?? {}
  }, [cookies])

  return {
    hash,
    salt,
    move,
  }
}

export const useMakeCommitMove = (duelId: bigint, roundNumber: number, selectedMove: number | string) => {
  const key = bigintToHex(duelId)
  const [cookies, setCookie] = useCookies([key]);

  useEffect(() => {
    const _move = BigInt(selectedMove ?? 0n)
    if (_move) {
      const _value = cookies[key] ?? {}
      const _salt = BigInt(makeRandomHash(12)) // < MAX_SAFE_INTEGER (52 bits)
      const _hash = pedersen(_salt, _move)
      _value[roundNumber] = {
        move: Number(_move),
        salt: Number(_salt),
        hash: '0x' + _hash.toString(16),
      }
      setCookie(key, JSON.stringify(_value))
    }
  }, [selectedMove])

  return useCommitMove(duelId, roundNumber)
}

