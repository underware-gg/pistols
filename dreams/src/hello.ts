#!/usr/bin/env ts-node

import chalk from "chalk";

async function main() {
  console.log(chalk.cyan("Hello, world!"));
}

// Application entry point with error handling
main().catch((error) => {
  console.error(chalk.red("Fatal error:"), error);
  process.exit(1);
});
