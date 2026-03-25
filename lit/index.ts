import { Command } from "@cliffy/command";
import { GlobalOptions } from "../lib/index.ts";
import { newCommand } from "./new.ts";

export function lit() {
  return new Command<GlobalOptions>()
    .description("literature note management")
    .action(function () {
      this.showHelp();
    })
    .command("new", newCommand());
}
