
const _env = (name: string) => (
  // vite
  //@ts-ignore
  import.meta.env ? import.meta.env[name]
    // node
    : process.env?.[name]
);

// required
export const DEFAULT_NETWORK_ID = _env('VITE_NETWORK_ID') || _env('VITE_DEFAULT_NETWORK_ID') || _env('DEFAULT_NETWORK_ID') || 'MAINNET';
export const ACADEMY_NETWORK_ID = _env('VITE_ACADEMY_NETWORK_ID') || _env('ACADEMY_NETWORK_ID') || 'ACADEMY';
export const ASSETS_SERVER_URL = _env('VITE_ASSETS_SERVER_URL') || _env('ASSETS_SERVER_URL') || 'https://assets.underware.gg';
export const SALT_SERVER_URL = _env('VITE_SALT_SERVER_URL') || _env('SALT_SERVER_URL') || 'https://assets.underware.gg';
// dojo config overrides
export const RPC_URL = _env('VITE_RPC_URL') || _env('RPC_URL') || null;
export const TORII_URL = _env('VITE_TORII_URL') || _env('TORII_URL') || null;
export const TORII_RELAY_URL = _env('VITE_TORII_RELAY_URL') || _env('TORII_RELAY_URL') || null;
// node
export const NODE_ENV = _env('NODE_ENV');
