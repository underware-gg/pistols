import Cookies from 'universal-cookie';
import { AccountInterface, StarknetDomain } from 'starknet'
import { CommitMoveMessage, GeneralPurposeMessage } from 'src/games/pistols/config/typed_data'
import { make_moves_hash, restore_moves_from_hash } from 'src/games/pistols/cairo/moves_hash'
import { signMessages, Messages } from 'src/starknet/starknet_sign'
import { bigintToHex, shortAddress } from 'src/utils/misc/types'
import { apiGenerateControllerSalt } from 'src/api/salt'

const cookies = new Cookies(null, { path: '/' });


//------------------------------------------
// salt generation from salt (assets) server
//

/** @returns a salt from account signature, or 0 if fails */
const signAndGenerateSalt = async (
  serverUrl: string,
  account: AccountInterface, 
  starknetDomain: StarknetDomain, 
  messageToSign: Messages,
): Promise<bigint> => {
  let salt = 0n
  if (messageToSign) {
    try {
      //
      // 2: try hashed signature (non-controller wallets)...
      //
      const { signatureHash, signature, messageHash } = await signMessages(account, starknetDomain, messageToSign)
      if (signatureHash > 0n) {
        console.log(`SALT HASHED:`, shortAddress(salt))
        salt = signatureHash
      } else if (signature.length > 0 && serverUrl) {
        //
        // 3: generate controller signed salt...
        //
        salt = await apiGenerateControllerSalt(
          serverUrl,
          account.address,
          starknetDomain,
          messageHash,
          signature,
        )
        console.log(`SALT GENERATED(${serverUrl}):`, shortAddress(salt))
      }
      if (salt == 0n) {
        throw new Error('unable to generate salt!')
      }
    } catch (e) {
      console.warn(`signAndGenerateSalt() exception:`, e, messageToSign)
    }
  }
  return salt
}


//------------------------------------------
// moves commit salt
//

/** @returns a salt from account signature, or 0 if fails */
const signAndGenerateMovesSalt = async (
  serverUrl: string,
  account: AccountInterface,
  starknetDomain: StarknetDomain,
  messageToSign: CommitMoveMessage,
): Promise<bigint> => {
  let salt = 0n
  if (messageToSign) {
    //
    // 1: try to restore from cookie...
    //
    const cookieKey = `salt[${bigintToHex(messageToSign.duelId)},${bigintToHex(messageToSign.duelistId)}]`;
    salt = BigInt(cookies.get(cookieKey) || '0');
    console.log(`SALT COOKIE [${cookieKey}]:`, shortAddress(salt))
    if (salt == 0n) {
      salt = await signAndGenerateSalt(serverUrl, account, starknetDomain, messageToSign)
      // save cookie backup
      if (salt > 0n) {
        cookies.set(cookieKey, bigintToHex(salt));
        console.log(`SALT backup to cookie[${cookieKey}]:`, shortAddress(salt))
      }
    }
  }
  return salt
}

/** @returns the felt252 hash for an action, or 0 if fail */
export const signAndGenerateMovesHash = async (
  serverUrl: string,
  account: AccountInterface, 
  starknetDomain: StarknetDomain, 
  messageToSign: CommitMoveMessage,
  moves: number[]
): Promise<{ hash: bigint, salt: bigint }> => {
  const salt = await signAndGenerateMovesSalt(serverUrl, account, starknetDomain, messageToSign)
  const hash = make_moves_hash(salt, moves)
  console.log(`signAndGenerateMovesHash():`, messageToSign, moves, bigintToHex(salt), bigintToHex(hash))
  return { hash, salt }
}

/** @returns the original action from an action hash, or 0 if fail */
export const signAndRestoreMovesFromHash = async (
  serverUrl: string,
  account: AccountInterface, 
  starknetDomain: StarknetDomain, 
  messageToSign: CommitMoveMessage,
  hash: bigint, 
  decks: number[][]
): Promise<{ salt: bigint, moves: number[] }> => {
  const salt: bigint = await signAndGenerateMovesSalt(serverUrl, account, starknetDomain, messageToSign)
  console.log(`___RESTORE decks:`, decks)
  console.log(`___RESTORE message:`, messageToSign, '\nsalt:', bigintToHex(salt), '\nhash:', bigintToHex(hash))
  let moves: number[] = restore_moves_from_hash(salt, hash, decks)
  if (moves.length == decks.length) {
    console.log(`___RESTORED ALL MOVES:`, moves)
  } else {
    console.log(`___RESTORED: moves.length != decks.length`, moves, decks)
    moves = []
  }
  return {
    salt,
    moves,
  }
}

//------------------------------------------
// general purpose salt
//

/** @returns the felt252 hash for an action, or 0 if fail */
export const signAndGenerateGeneralPurposeSalt = async (
  serverUrl: string,
  account: AccountInterface,
  starknetDomain: StarknetDomain,
  messageToSign: GeneralPurposeMessage,
): Promise<{ salt: bigint }> => {
  const salt = await signAndGenerateSalt(serverUrl, account, starknetDomain, messageToSign)
  console.log(`signAndGenerateGeneralPurposeSalt():`, messageToSign, bigintToHex(salt))
  return {
    salt,
  }
}
