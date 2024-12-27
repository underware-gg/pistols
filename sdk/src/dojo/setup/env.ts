//@ts-nocheck

// import { loadEnv } from 'vite'
// const env = loadEnv(mode, process.cwd(), '')

// required
export const CHAIN_ID = (import.meta.env.VITE_CHAIN_ID || undefined);

// optional
export const NODE_URL = (import.meta.env.VITE_NODE_URL || undefined);
export const TORII = (import.meta.env.VITE_TORII || undefined);
export const RELAY_URL = (import.meta.env.VITE_RELAY_URL || undefined);
export const MASTER_ADDRESS = (import.meta.env.VITE_MASTER_ADDRESS || undefined);
export const MASTER_PRIVATE_KEY = (import.meta.env.VITE_MASTER_PRIVATE_KEY || undefined);
