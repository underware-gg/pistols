import { placeholderMissingSvgBase64 } from '../../components/loadingSvg'

export type AssetFolder = {
  [key: string]: () => Promise<string>
}

export const getAsset = async (assets: AssetFolder, url: string): Promise<string> => {
  const extension = url.split('.').at(-1);
  const assetName = url.replaceAll('/', '_').replaceAll('.', '_');
  let data: string;
  try {
    data = await assets[assetName]();
    // console.log(`getAsset()`, url, assetName, data);
  } catch (error) {
    console.error(`getAsset() ERROR`, url, assetName, error);
    // throw error;
    console.warn(`getAsset() ERROR >>`, placeholderMissingSvgBase64);
    return placeholderMissingSvgBase64;
  }
  return `data:image/${extension};base64,${data}`;
};
