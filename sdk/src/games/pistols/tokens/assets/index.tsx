
export const getAsset = (assets: any, url: string): string => {
  const extension = url.split('.').at(-1)
  const name = url.replaceAll('/', '_').replaceAll('.', '_');
  const data = assets[name]
  // console.log(`getAsset()`, url, name, data?.slice(0, 100))
  return `data:image/${extension};base64,${data}`
}
