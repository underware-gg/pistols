
const _env = (name: string) => (
  // vite
  //@ts-ignore
  import.meta.env ? import.meta.env[name]
    // node
    : process.env?.[name]
);

// required
export const CLIENT_URL = _env('VITE_CLIENT_URL') || 'https://play.pistols.gg';
// optional
export const DEFAULT_NETWORK_ID = _env('VITE_NETWORK_ID') || _env('VITE_DEFAULT_NETWORK_ID') ||  'MAINNET';
export const PUBLISH_ONLINE_STATUS = _env('VITE_PUBLISH_ONLINE_STATUS') === 'true';
export const MAINTENANCE_MODE = _env('VITE_MAINTENANCE_MODE') === 'true';
// dojo config overrides
export const ASSETS_SERVER_URL = _env('VITE_ASSETS_SERVER_URL') || null;
export const SLOT_NAME = _env('VITE_SLOT_NAME') || null;
export const RPC_URL = _env('VITE_RPC_URL') || null;
export const TORII_URL = _env('VITE_TORII_URL') || null;
export const TORII_GRAPHQL_URL = _env('VITE_TORII_GRAPHQL_URL') || null;
export const TORII_SQL_URL = _env('VITE_TORII_SQL_URL') || null;
// social links
export const DISCORD_CLIENT_ID = _env('VITE_DISCORD_CLIENT_ID') || null;
export const DISCORD_REDIRECT_URL = _env('VITE_DISCORD_REDIRECT_URL') || null;
// node
export const NODE_ENV = _env('NODE_ENV');
