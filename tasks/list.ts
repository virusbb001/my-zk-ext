import { Command } from "@cliffy/command";
import { GlobalOptions, searchNotebooks } from "../lib/index.ts";
import { CommandName, ProjectsDir, Zk } from "../lib/const.ts";
import { getProjects } from "../projects/list.ts";
import * as path from "@std/path";
import { StatusType } from "./StatusType.ts";
import { zkList } from "../lib/zk.ts";
/**
 * Note of zk
 */
// deno-lint-ignore no-explicit-any
type Note = any;

export function list() {
  return new Command<GlobalOptions>()
    .type("status", new StatusType())
    .description(`list tasks.

You can pass zk options after \`--\`.

Example: ${CommandName} task list --zk -- --format=json
`)
    .option(
      "--project <projects:string[]>",
      "projects for filtering ex: proj-1,proj-2",
    )
    .option("--status <status:status[]>", "status")
    .action(async function (opts) {
      const zkArgs = this.getLiteralArgs();

      const notebookDir = await searchNotebooks(opts.notebookDir);
      if (!notebookDir) {
        throw new Error("Notebooks not found");
      }

      await listTasks(notebookDir, opts.project, opts.status, zkArgs);
    });
}

/**
 * @param taskStatus - status for filtering
 */
async function listTasks(
  notebookDir: string,
  projects: string[] = [],
  taskStatus: string[] = [],
  zkArgs: string[] = [],
): Promise<void> {
  const projectFiles = await getProjects(notebookDir);
  const allProjectDirs = projectFiles.map((p) => p.replace(/\.md$/, ""));
  const projectsDir = projects.map((p) =>
    path.join(notebookDir!, ProjectsDir, p)
  );
  const dirs = projectsDir.length > 0 ? projectsDir : allProjectDirs;

  if (taskStatus.length > 0) {
    const notes = await getTasksByStatus(
      taskStatus,
      dirs,
      projectFiles,
    );
    const notePaths = notes.map((note) => note.absPath);
    await zkList(notePaths, zkArgs);
    return;
  }

  await zkList(dirs, ["--exclude", projectFiles.join(","), ...zkArgs]);
}

async function getTasksByStatus(
  taskStatus: string[],
  projectDirs: string[],
  projectFiles: string[],
) {
  const command = new Deno.Command(Zk, {
    args: [
      "list",
      "--exclude",
      projectFiles.join(","),
      "--format=json",
      ...projectDirs,
    ],
  });
  const result = await command.output();
  if (!result.success) {
    await Deno.stderr.write(result.stderr);
    Deno.exitCode = result.code;
    throw new Error(`Zk failed with ${result.code}`);
  }
  const notes = JSON.parse(new TextDecoder().decode(result.stdout)) as Note[];
  const filtered = notes.filter((note) =>
    taskStatus.includes(note.metadata.status)
  );
  return filtered;
}
