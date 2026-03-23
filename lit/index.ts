import { Command } from "@cliffy/command";
import { GlobalOptions } from "../lib/index.ts";

export function lit() {
  return new Command<GlobalOptions>()
    .description("literature note management")
    .action(function () {
      this.showHelp();
    });
}
