
export const makeRandomInt = (maxNonInclusive: number) => (Math.floor(Math.random() * maxNonInclusive))
export const randomArrayElement = (array: any[]): any => (array.length > 0 ? array[makeRandomInt(array.length)] : null)

export const makeRandomHash = (hashSize = 32, prefix = '0x') => {
  const hexChars = '0123456789abcdef';
  let result = prefix ?? '';
  for (let i = 0; i < hashSize; ++i) {
    result += hexChars[makeRandomInt(hexChars.length)]
  }
  return result
}
