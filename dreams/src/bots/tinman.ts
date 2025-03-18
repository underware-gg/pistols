#!/usr/bin/env node

import { constants } from '@underware/pistols-sdk/pistols/gen';
import { main, BotContext } from "../main";
import chalk from "chalk";

const botContext: BotContext = {
  profile: constants.BotProfile.TinMan,
  description: constants.BOT_PROFILES[constants.BotProfile.TinMan],
  emoji: "🤖",
  context: "You are a villainous duelist, without morals or conscience.",
}

main(botContext).catch((error) => {
  console.error(chalk.red("Fatal error:"), error);
  process.exit(1);
});
