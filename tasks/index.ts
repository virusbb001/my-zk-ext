import { Command } from "@cliffy/command";

import { command as initCommand } from "./init.ts";
import { GlobalOptions } from "../lib/index.ts";

export const command = new Command<GlobalOptions>()
.command("init", initCommand);
