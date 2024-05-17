
export const PROFILE_PIC_COUNT = 15

//------------------------------------------
/// Cairo constants
// must be in sync with CONSTANTS from constants.cairo
//
export const constants = {
  ROUND_COUNT: 3,
  FULL_HEALTH: 3,
  DOUBLE_DAMAGE: 2,
  SINGLE_DAMAGE: 1,

  HASH_SALT_MASK: 0xffffffffffffffffn, // 64 bits
  // HASH_SALT_MASK: 0x1fffffffffffffn,   // 53 bits (Number.MAX_SAFE_INTEGER, 9007199254740991)
}

//------------------------------------------
// Tables
// must be in sync with table.cairo
//
export const tables = {
  LORDS: 'Lords',
  COMMONERS: 'Commoners',
}
