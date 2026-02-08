import { Command } from "@cliffy/command";
import { GlobalOptions } from "../lib/index.ts";
import { newCommand } from "./new.ts";

export function projects() {
  return new Command<GlobalOptions>()
    .description("projects management")
    .command("new", newCommand());
}
