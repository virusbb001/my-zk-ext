import { Command } from "@cliffy/command";
import { GlobalOptions } from "../lib/index.ts";
import { newCommand } from "./new.ts";
import { list } from "./list.ts";

export function projects() {
  return new Command<GlobalOptions>()
    .description("projects management")
    .action(function () {
      this.showHelp();
    })
    .command("new", newCommand())
    .command("list", list());
}
