// import { decodeIpfsUrl } from '@/hooks/web3/IpfsHook'
import { Buffer } from 'buffer';

export function decodeMetadata(encodedMetadata: string): {
  metadata: string,
  json: any,
  image: string,
  animation?: string,
} {
  let metadata: string | undefined = undefined;	  // the metadata, decoded if base64
  let json: any = {};				                      // decoded, as a json object
  let image: string | undefined = undefined;			// image field, encoded, if present
  let animation: string | undefined = undefined;	// animation field, encoded, if present
  if (encodedMetadata) {
    metadata = decodeMimeData(encodedMetadata); // decode, IF base64, else copy
    try {
      try {
        json = JSON.parse(decodeMimeData(metadata));
      } catch (e) {
        console.error(`decodeMetadata() error:`, e);
        console.error(`decodeMetadata() metadata:`, metadata);
        throw e;
      }
      image = json.image ?? json.image_url ?? null;
      // image = decodeMediaUrl(image);
      animation = json.animation_url ? decodeMediaUrl(json.animation_url) : null;
      Object.keys(json).forEach(key => {
        if (typeof json[key] == 'string') {
          json[key] = decodeMimeData(json[key]);
        }
      });
      metadata = JSON.stringify(json);
    } catch (error) {
      console.error(`decodeMetadata() error:`, error);
    }
  }
  return {
    metadata,		// json string
    json,				// json object
    image,			// original (url or encoded), good for using as src
    animation,	// original (url or encoded), good for using as src
  };
}

// examples:
// data:application/json,
// data:application/json;base64,
// data:image/svg+xml,
// data:image/svg+xml;base64,
export function decodeMimeData(data: string): string {
  let result = data;
  if (typeof (data) == 'string' && data.startsWith('data:')) {
    // extract data
    const terminatorIndex = data.indexOf(',');
    result = data.slice(terminatorIndex + 1);
    // split [data]:[mime]
    const [_, mime] = data.slice(0, terminatorIndex).split(':')
    // split [applicatio/json];[base64]
    const [mimeType, base64] = mime.slice(5).split(';');
    if (base64) {
      if (mimeType == 'application/octet-stream') {
        // mimeData = [...decodeBase64Buffer(result)];
      } else {
        // mimeData = atob(result); // deprecated
        result = decodeBase64(result);
      }
    }
  }
  return result;
}

export function decodeMediaUrl(url: string) {
  // return decodeIpfsUrl(url) ?? url;
  return url;
}


//-----------------------------------
// Base64
//
export function decodeBase64(data: string) {
  return Buffer.from(data, 'base64').toString('utf8');
}
export function decodeBase64Buffer(data: string) {
  return Buffer.from(data, 'base64');
}

export type MimeTypes = 'svg' | 'html' | 'json';
export function encodeBase64(data: string | undefined, mimeType?: MimeTypes): string | undefined {
  if (data == undefined) {
    return undefined;
  }
  const result = Buffer.from(data).toString('base64');
  if (mimeType == 'svg') {
    return `data:image/svg+xml;base64,${result}`;
  } else if (mimeType == 'html') {
    return `data:text/html;base64,${result}`;
  } else if (mimeType == 'json') {
    return `data:application/json;base64,${result}`;
  }
  return result;
}


