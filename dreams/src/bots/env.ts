import { z } from "zod";
import 'dotenv/config';

const envSchema = z.object({
  TWITTER_USERNAME: z.string(),
  TWITTER_PASSWORD: z.string(),
  TWITTER_EMAIL: z.string(),
  OPENAI_API_KEY: z.string(),
  CHROMA_URL: z.string().default("http://localhost:8000"),
  STARKNET_RPC_URL: z.string().default("http://127.0.0.1:5050"),
  STARKNET_ADDRESS: z.string().default("0x6677fe62ee39c7b07401f754138502bab7fac99d2d3c5d37df7d1c6fab10819"),
  STARKNET_PRIVATE_KEY: z.string().default("0x3e3979c1ed728490308054fe357a9f49cf67f80f9721f44cc57235129e090f4"),
  OPENROUTER_API_KEY: z.string(),
  GRAPHQL_URL: z.string().default("http://0.0.0.0:8080/graphql"),
  DISCORD_TOKEN: z.string(),
  HYPERLIQUID_MAIN_ADDRESS: z.string(),
  HYPERLIQUID_WALLET_ADDRESS: z.string(),
  HYPERLIQUID_PRIVATE_KEY: z.string(),
  WEBSOCKET_URL: z.string().default("ws://localhost:8080"),
  DRY_RUN: z
    .preprocess((val) => val === "1" || val === "true", z.boolean())
    .default(true),
});
export const env = envSchema.parse(process.env);
// console.log(`ENV:`, process.env.TWITTER_USERNAME, env);
