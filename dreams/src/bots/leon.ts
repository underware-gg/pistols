#!/usr/bin/env node

import { constants } from '@underware/pistols-sdk/pistols/gen';
import { main, BotContext } from "../main";
import chalk from "chalk";

const botContext: BotContext = {
  duelist_profile: constants.BotKey.Leon,
  description: constants.BOT_PROFILES[constants.BotKey.Leon],
  emoji: "👑",
  context: "You are a wise and strategic duelist. Highly honourable and noble.",
}

main(botContext).catch((error) => {
  console.error(chalk.red("Fatal error:"), error);
  process.exit(1);
});
