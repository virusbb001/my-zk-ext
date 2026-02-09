
import { Command } from "@cliffy/command";
import { GlobalOptions, searchNotebooks } from "../lib/index.ts";
import { CommandName, ProjectsDir, Zk } from "../lib/const.ts";
import * as path from "@std/path";

export function newCommand () {
  return new Command<GlobalOptions>()
    .description(`create tasks.

You can pass zk options after \`--\`.
If set title, pass \`--title <title>\` to zk.

Example: ${CommandName} task new --project my-project -- --format=json
`)
    .option("--project <project:string>", "Related project slug", {
      required: true
    })
    .arguments("[title]")
    .action(async function(opts, title) {
      const zkOpts = this.getLiteralArgs();
      await createNewTask(opts.notebookDir, opts.project, title, zkOpts)
    });
}

/**
 * @param project - project directory name.
 * @param [zkOpts=[]] - options of zk.
 */
export async function createNewTask (notebookDir: string | undefined, project: string, title?: string, zkOpts: string[] = []) {
  const notebook = await searchNotebooks(notebookDir);
  if (!notebook) {
    throw new Error("notebook not found");
  }
  const projectsDir = path.join(ProjectsDir, project);
  const absoluteProjectDir = path.join(notebook, projectsDir);

  await Deno.mkdir(absoluteProjectDir, { recursive: true })

  const command = new Deno.Command(Zk, {
    args: [
      "new",
      absoluteProjectDir,
      ...(title ? ["--title", title] : []),
      ...zkOpts,
    ],
  });
  const process = command.spawn();
  const status = await process.status;
  Deno.exitCode = status.code;
}
