import { Command } from "@cliffy/command";
import { GlobalOptions, searchNotebooks } from "../lib/index.ts";
import { Zk, ProjectsDir } from "../lib/const.ts";

export function newCommand() {
  return new Command<GlobalOptions>()
    .description(`create new <project> project.
[args...] is arguments of zk

Example: project new my-new-task -p
`)
    .stopEarly()
    .arguments("<project:string> [...args]")
    .action(async (opts, project, ...args) => {
      await actions(opts.notebookDir, project, args);
    });
}

/**
 * @param notebookDir - notebook dir
 * @param project - project name
 * @param args - zk arguments
 */
export async function actions(
  notebookDir: string | undefined,
  project: string,
  args: string[],
) {
  const notebook = await searchNotebooks(notebookDir);
  if (!notebook) {
    throw new Error("notebook not found");
  }
  const command = new Deno.Command(Zk, {
    args: [
      "new",
      ProjectsDir,
      "--title",
      project,
      ...args
    ]
  });
  const process = command.spawn();
  const status = await process.status;
  Deno.exitCode = status.code;
}
