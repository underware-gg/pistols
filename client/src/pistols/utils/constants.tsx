//------------------------------------------
// must be in sync with CONSTANTS from constants.cairo
//

const constants = {
  ROUND_COUNT: 3,
  FULL_HONOUR: 100,
  FULL_HEALTH: 3,
  DOUBLE_DAMAGE: 2,
  SINGLE_DAMAGE: 1,

  // HASH_SALT_MASK: 0xffffffffffffffffn, // 64 bits
  HASH_SALT_MASK: 0x1fffffffffffffn,   // 53 bits (Number.MAX_SAFE_INTEGER, 9007199254740991)
}

export default constants
