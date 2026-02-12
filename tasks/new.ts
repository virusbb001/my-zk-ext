import { Command } from "@cliffy/command";
import { GlobalOptions, searchNotebooks } from "../lib/index.ts";
import { CommandName, ProjectsDir, Zk } from "../lib/const.ts";
import * as path from "@std/path";

export function newCommand() {
  return new Command<GlobalOptions>()
    .description(`create tasks.

You can pass zk options after \`--\`.
If set title, pass \`--title <title>\` to zk.

Example: ${CommandName} task new --project my-project -- --format=json
`)
    .option("--project <project:string>", "Related project slug", {
      required: true,
    })
    .arguments("[title]")
    .action(async function (opts, title) {
      const zkOpts = this.getLiteralArgs();
      const notebook = await searchNotebooks(opts.notebookDir);
      if (!notebook) {
        throw new Error("notebook not found");
      }
      const code = await createNewTask(notebook, opts.project, title, zkOpts);
      Deno.exitCode = code;
    });
}

/**
 * @param project - project directory name.
 * @param [zkOpts=[]] - options of zk.
 */
export async function createNewTask(
  notebook: string,
  project: string,
  title?: string,
  zkOpts: string[] = [],
) {
  const projectsDir = path.join(ProjectsDir, project);
  const absoluteProjectDir = path.join(notebook, projectsDir);

  await Deno.mkdir(absoluteProjectDir, { recursive: true });

  const command = new Deno.Command(Zk, {
    args: [
      "--notebook-dir",
      notebook,
      "new",
      absoluteProjectDir,
      ...(title ? ["--title", title] : []),
      ...zkOpts,
    ],
  });
  const process = command.spawn();
  const status = await process.status;
  return status.code;
}
