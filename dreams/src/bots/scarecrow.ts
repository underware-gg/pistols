#!/usr/bin/env node

// based on 
// https://github.com/daydreamsai/daydreams/blob/f558745f1a6ff9f1e7fafcc6c1af7141a4932b65/examples/example-basic.ts

/**
 * Basic example demonstrating the Daydreams package functionality.
 * This example creates an interactive CLI agent that can:
 * - Execute tasks using the ChainOfThought system
 * - Interact with Starknet blockchain
 * - Query data via GraphQL
 * - Maintain conversation memory using ChromaDB
 */

import {
  LLMClient,
  ChainOfThought,
  ChromaVectorDB,
  Providers,
  Chains,
  Types,
} from "@daydreamsai/core";
import { PISTOLS_CONTEXT, PROVIDER_GUIDE } from "../context/pistols";
import { env } from "./env";
import { z } from "zod";
import chalk from "chalk";
import * as readline from "readline";

/**
 * Helper function to get user input from CLI
 */
async function getCliInput(prompt: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  console.log(chalk.yellow("🎃🎃🎃🎃🎃🎃🎃🎃🎃🎃"));

  // Initialize core components
  const llmClient = new LLMClient({
    model: "openrouter:deepseek/deepseek-r1", // High performance model
  });

  const memory = new ChromaVectorDB("agent_memory");
  await memory.purge(); // Clear previous session data

  const starknetChain = new Chains.StarknetChain({
    rpcUrl: env.STARKNET_RPC_URL,
    address: env.STARKNET_ADDRESS,
    privateKey: env.STARKNET_PRIVATE_KEY,
  });

  // Load initial context documents
  await memory.storeDocument({
    title: "Game Rules",
    content: PISTOLS_CONTEXT,
    category: "rules",
    tags: ["game-mechanics", "rules"],
    lastUpdated: new Date(),
  });

  await memory.storeDocument({
    title: "Provider Guide",
    content: PROVIDER_GUIDE,
    category: "actions",
    tags: ["actions", "provider-guide"],
    lastUpdated: new Date(),
  });

  // Initialize the main reasoning engine
  const dreams = new ChainOfThought(
    llmClient,
    memory,
    {
      worldState: PISTOLS_CONTEXT,
    },
    {
      logLevel: Types.LogLevel.DEBUG,
    }
  );

  // Register available outputs
  dreams.registerOutput({
    name: "EXECUTE_TRANSACTION",
    role: Types.HandlerRole.OUTPUT,
    execute: async (data: any) => {
      const result = await starknetChain.write(data.payload);
      return `Transaction: ${JSON.stringify(result, null, 2)}`;
    },
    outputSchema: z
      .object({
        contractAddress: z
          .string()
          .describe(
            "The address of the contract to execute the transaction on"
          ),
        entrypoint: z
          .string()
          .describe("The entrypoint to call on the contract"),
        calldata: z
          .array(z.union([z.number(), z.string()]))
          .describe("The calldata to pass to the entrypoint"),
      })
      .describe(
        "The payload to execute the transaction, never include slashes or comments"
      ),
  });

  dreams.registerOutput({
    name: "GRAPHQL_FETCH",
    role: Types.HandlerRole.OUTPUT,
    execute: async (data: any) => {
      const { query, variables } = data.payload ?? {};
      const result = await Providers.fetchGraphQL(
        env.GRAPHQL_URL + "/graphql",
        query,
        variables
      );
      const resultStr = [
        `query: ${query}`,
        `result: ${JSON.stringify(result, null, 2)}`,
      ].join("\n\n");
      return `GraphQL data fetched successfully: ${resultStr}`;
    },
    outputSchema: z
      .object({
        query: z.string()
          .describe(`"query GetRealmInfo { eternumRealmModels(where: { realm_id: 42 }) { edges { node { ... on eternum_Realm { 
          entity_id level } } } }"`),
      })
      .describe(
        "The payload to fetch data from the Eternum GraphQL API, never include slashes or comments"
      ),
  });

  // Set up event logging
  dreams.on("think:start", ({ query }) => {
    console.log(chalk.blue("\n🧠 Thinking about:"), query);
  });

  dreams.on("action:start", (action) => {
    console.log(chalk.yellow("\n🎬 Executing action:"), {
      type: action.type,
      payload: action.payload,
    });
  });

  dreams.on("action:complete", ({ action, result }) => {
    console.log(chalk.green("\n✅ Action completed:"), {
      type: action.type,
      result,
    });
  });

  dreams.on("action:error", ({ action, error }) => {
    console.log(chalk.red("\n❌ Action failed:"), {
      type: action.type,
      error,
    });
  });

  // Main interaction loop
  while (true) {
    console.log(
      chalk.cyan(
        "\n🤖 What would you like me to do? (type 'exit' to quit):"
      )
    );
    const userInput = await getCliInput("> ");

    if (userInput.toLowerCase() === "exit") {
      console.log(chalk.yellow("Goodbye! 👋"));
      break;
    }

    try {
      console.log(chalk.cyan("\n🎯 Processing your request..."));
      const result = await dreams.think(userInput);
      console.log(chalk.green("\n✨ Task completed successfully!"));
      console.log("Result:", result);
    } catch (error) {
      console.error(chalk.red("Error processing request:"), error);
    }
  }

  // Graceful shutdown handler
  process.on("SIGINT", async () => {
    console.log(chalk.yellow("\nShutting down..."));
    process.exit(0);
  });
}

// Application entry point with error handling
main().catch((error) => {
  console.error(chalk.red("Fatal error:"), error);
  process.exit(1);
});
