import { Command } from "@cliffy/command";
import { GlobalOptions } from "../lib/index.ts";
import { newCommand } from "./new.ts";
import { list } from "./list.ts";
import { split } from "./split.ts";

export function daily() {
  return new Command<GlobalOptions>()
    .description("daily note management")
    .action(function () {
      this.showHelp();
    })
    .command("new", newCommand())
    .command("list", list())
    .command("split", split());
}
