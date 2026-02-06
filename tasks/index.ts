import { Command } from "jsr:@cliffy/command@1.0.0-rc.8";

import { command as initCommand } from "./init.ts";
import { GlobalOptions } from "../lib/index.ts";

export const command = new Command<GlobalOptions>()
.command("init", initCommand);
