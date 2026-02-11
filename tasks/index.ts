import { Command } from "@cliffy/command";
import { GlobalOptions } from "../lib/index.ts";
import { newCommand } from "./new.ts";
import { list } from "./list.ts";
import { mark } from "./mark.ts";

export function task() {
  return new Command<GlobalOptions>()
    .description("task management")
    .action(function () {
      this.showHelp();
    })
    .command("new", newCommand())
    .command("list", list())
    .command("mark", mark());
}
