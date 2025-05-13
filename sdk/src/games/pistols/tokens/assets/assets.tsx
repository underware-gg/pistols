
export type AssetFolder = {
  [key: string]: () => Promise<string>
}

export const getAsset = async (assets: AssetFolder, url: string): Promise<string> => {
  const extension = url.split('.').at(-1);
  const name = url.replaceAll('/', '_').replaceAll('.', '_');
  let data: string;
  try {
    data = await assets[name]();
    // console.log(`getAsset()`, url, name, data);
  } catch (error) {
    console.error(`getAsset() ERROR`, url, name, error);
    throw error;
  }
  return `data:image/${extension};base64,${data}`;
};
