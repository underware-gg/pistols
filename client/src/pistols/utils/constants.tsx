import packages from '../../../package.json'

export const PACKAGE_VERSION = packages.version

// in sync with /public/profiles image count
export const PROFILE_PIC_COUNT = 15

// must be in sync with constants.cairo
// export const HASH_SALT_MASK = 0xffffffffffffffffn // 64 bits
export const HASH_SALT_MASK = 0x1fffffffffffffn   // 53 bits (Number.MAX_SAFE_INTEGER, 9007199254740991)
