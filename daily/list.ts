import { Command } from "@cliffy/command";
import { GlobalOptions, searchNotebooks } from "../lib/index.ts";
import { CommandName, DailyDir, Zk } from "../lib/const.ts";
/**
 * Note of zk
 */

export function list() {
  return new Command<GlobalOptions>()
    .description(`list daily notes.

You can pass zk options after \`--\`.

Example: ${CommandName} task list --zk -- --format=json
`)
    .action(async function (opts) {
      const zkArgs = this.getLiteralArgs();

      const notebookDir = await searchNotebooks(opts.notebookDir);
      if (!notebookDir) {
        throw new Error("Notebooks not found");
      }

      await listNotes(notebookDir, zkArgs);
    });
}

/**
 * @param taskStatus - status for filtering
 */
async function listNotes(
  notebookDir: string,
  zkArgs: string[] = [],
): Promise<void> {
  const command = new Deno.Command(Zk, {
    args: [
      "--notebook-dir",
      notebookDir,
      "list",
      DailyDir,
      ...zkArgs,
    ],
  });
  const process = command.spawn();
  const status = await process.status;
  Deno.exitCode = status.code;
}
