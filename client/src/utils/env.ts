
const _env = (name: string) => (
  // vite
  //@ts-ignore
  import.meta.env ? import.meta.env[name]
    // node
    : process.env?.[name]
);

// required
export const DEFAULT_NETWORK_ID = _env('VITE_NETWORK_ID') || _env('DEFAULT_NETWORK_ID') || 'MAINNET';
export const ACADEMY_NETWORK_ID = _env('VITE_ACADEMY_NETWORK_ID') || _env('ACADEMY_NETWORK_ID') || 'ACADEMY';
export const NODE_ENV = _env('NODE_ENV');
