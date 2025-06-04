
const _env = (name: string) => (
  // vite
  //@ts-ignore
  import.meta.env ? import.meta.env[name]
    // node
    : process.env?.[name]
);

// required
export const SERVER_URL = _env('VITE_SERVER_URL') || 'https://play.pistols.gg';
export const DEFAULT_NETWORK_ID = _env('VITE_NETWORK_ID') || _env('VITE_DEFAULT_NETWORK_ID') ||  'MAINNET';
export const ACADEMY_NETWORK_ID = _env('VITE_ACADEMY_NETWORK_ID') || _env('ACADEMY_NETWORK_ID') || 'ACADEMY';
export const ASSETS_SERVER_URL = _env('VITE_ASSETS_SERVER_URL') || 'https://assets.underware.gg';
export const SALT_SERVER_URL = _env('VITE_SALT_SERVER_URL') || 'https://assets.underware.gg';
// dojo config overrides
export const SLOT_NAME = _env('VITE_SLOT_NAME') || null;
export const RPC_URL = _env('VITE_RPC_URL') || null;
export const TORII_URL = _env('VITE_TORII_URL') || null;
export const TORII_RELAY_URL = _env('VITE_TORII_RELAY_URL') || null;
// social links
export const DISCORD_CLIENT_ID = _env('VITE_DISCORD_CLIENT_ID') || null;
export const DISCORD_REDIRECT_URL = _env('VITE_DISCORD_REDIRECT_URL') || null;
// node
export const NODE_ENV = _env('NODE_ENV');
