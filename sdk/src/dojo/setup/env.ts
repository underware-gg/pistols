//@ts-nocheck

// import { loadEnv } from 'vite'
// const env = loadEnv(mode, process.cwd(), '')

const _env = (name: string) => (import.meta.env?.[name] || undefined);

// required
export const DEFAULT_CHAIN_ID = _env('VITE_CHAIN_ID') || 'SN_MAIN';
export const TUTORIAL_CHAIN_ID = _env('VITE_TUTORIAL_CHAIN_ID') || 'WP_PISTOLS_KATANA';

// optional
export const NODE_URL = _env('VITE_NODE_URL');
export const TORII = _env('VITE_TORII');
export const RELAY_URL = _env('VITE_RELAY_URL');
export const MASTER_ADDRESS = _env('VITE_MASTER_ADDRESS');
export const MASTER_PRIVATE_KEY = _env('VITE_MASTER_PRIVATE_KEY');
