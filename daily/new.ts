import { Command } from "@cliffy/command";
import { GlobalOptions, searchNotebooks } from "../lib/index.ts";
import { Zk } from "../lib/const.ts";

export function newCommand() {
  return new Command<GlobalOptions>()
    .description(`create today's daily note
[args...] is arguments of zk

Example: daily new -- -p
`)
    .stopEarly()
    .action(async function (opts) {
      const args = this.getLiteralArgs();
      await actions(opts.notebookDir, args);
    });
}

/**
 * @param notebookDir - notebook dir
 * @param project - project name
 * @param args - zk arguments
 */
export async function actions(
  notebookDir: string | undefined,
  args: string[],
) {
  const notebook = await searchNotebooks(notebookDir);
  if (!notebook) {
    throw new Error("notebook not found");
  }
  const command = new Deno.Command(Zk, {
    args: [
      "daily-new",
      ...args,
    ],
  });
  const process = command.spawn();
  const status = await process.status;
  Deno.exitCode = status.code;
}
