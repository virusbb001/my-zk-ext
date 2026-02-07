#!/usr/bin/env -S deno --allow-run --allow-read

import { Command } from "@cliffy/command";
import { CompletionsCommand } from "@cliffy/command/completions";

import { command as taskCommand } from "./tasks/index.ts";

const command = new Command()
.name("zk-ext")
.description("external zk command")
.globalOption("--notebook-dir <path>", "notebook directory. Same of zk.")
.command("completions", new CompletionsCommand())
.command("task", taskCommand)
;

async function main() {
  await command.parse(Deno.args);
}

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  await main();
}
