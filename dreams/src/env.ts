import 'dotenv/config';
import { z } from "zod";
import { DEFAULT_NETWORK_ID, pistolsNetworkConfigs } from "@underware_gg/pistols-sdk/pistols";
import chalk from "chalk";

const networkConfig = pistolsNetworkConfigs[DEFAULT_NETWORK_ID];
const account = networkConfig.predeployedAccounts.at(-1);

const envSchema = z.object({
  CHROMA_URL: z.string().transform(v => v || "http://localhost:8000"),
  STARKNET_RPC_URL: z.string().transform(v => v || networkConfig.rpcUrl),
  STARKNET_ADDRESS: z.string().transform(v => v || account?.address || '0x0'),
  STARKNET_PRIVATE_KEY: z.string().transform(v => v || account?.privateKey || '0x0'),
  GRAPHQL_URL: z.string().transform(v => v || networkConfig.graphqlUrl),
  //
  TWITTER_USERNAME: z.string(),
  TWITTER_PASSWORD: z.string(),
  TWITTER_EMAIL: z.string(),
  OPENAI_API_KEY: z.string(),
  OPENROUTER_API_KEY: z.string(),
  DISCORD_TOKEN: z.string(),
  TELEGRAM_TOKEN: z.string(),
  TELEGRAM_API_ID: z.string(),
  TELEGRAM_API_HASH: z.string(),
  TELEGRAM_STARTUP_CHAT_ID: z.string().optional(),
  TELEGRAM_USER_SESSION: z.string().optional(),
  HYPERLIQUID_MAIN_ADDRESS: z.string(),
  HYPERLIQUID_WALLET_ADDRESS: z.string(),
  HYPERLIQUID_PRIVATE_KEY: z.string(),
  WEBSOCKET_URL: z.string().default("ws://localhost:8080"),
  DRY_RUN: z
    .preprocess((val) => val === "1" || val === "true", z.boolean())
    .default(true),
});
export const env = envSchema.parse(process.env);
console.log(`DEFAULT_NETWORK_ID:`, chalk.cyan(DEFAULT_NETWORK_ID));
console.log(`env.STARKNET_RPC_URL:`, chalk.green(env.STARKNET_RPC_URL));
console.log(`env.STARKNET_ADDRESS:`, chalk.green(env.STARKNET_ADDRESS));
console.log(`env.STARKNET_PRIVATE_KEY:`, chalk.green(env.STARKNET_PRIVATE_KEY ? 'Yes': 'No'));
console.log(`env.GRAPHQL_URL:`, chalk.green(env.GRAPHQL_URL));
console.log(`env.CHROMA_URL:`, chalk.green(env.CHROMA_URL));
// console.log(`env:`, process.env.TWITTER_USERNAME, env);
