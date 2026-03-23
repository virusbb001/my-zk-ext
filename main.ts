#!/usr/bin/env -S deno --allow-run --allow-read

import { Command } from "@cliffy/command";
import { CompletionsCommand } from "@cliffy/command/completions";

import { init } from "./init.ts";
import { task } from "./tasks/index.ts";
import { projects } from "./projects/index.ts";
import { daily } from "./daily/index.ts";
import { lit } from "./lit/index.ts";
import { CommandName } from "./lib/const.ts";

function makeCommand() {
  const command = new Command()
    .name(CommandName)
    .description("external zk command")
    .globalOption("--notebook-dir <path>", "notebook directory. Same of zk.")
    .action(function () {
      this.showHelp();
    })
    .command("completions", new CompletionsCommand())
    .command("daily", daily())
    .command("task", task())
    .command("project", projects())
    .command("lit", lit())
    .command("init", init());

  return command;
}

async function main() {
  const command = makeCommand();
  await command.parse(Deno.args);
}

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  await main();
}
