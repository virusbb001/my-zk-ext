import { Command } from "@cliffy/command";
import { GlobalOptions, searchNotebooks } from "../lib/index.ts";
import * as path from "@std/path";
import { CommandName, ProjectsDir } from "../lib/const.ts";
import { zkList } from "../lib/zk.ts";

export function list() {
  return new Command<GlobalOptions>()
    .description(`List projects.\n

You can pass zk options after \`--\`.

Example: ${CommandName} project list --zk -- --format=json

`)
    .option("--zk", "Use `zk list`")
    .action(async function (opts) {
      const zkOpts = this.getLiteralArgs();
      const files = await getProjects(opts.notebookDir);
      const projects = files.map((file) => path.basename(file, ".md"));
      if (opts.zk) {
        // TODO: emulate 0 files
        await zkList(files, zkOpts);
      } else {
        console.log(projects.join("\n"));
      }
    });
}

/**
 * return absolute paths of project files.
 */
export async function getProjects(notebooks?: string): Promise<string[]> {
  const notebookDir = await searchNotebooks(notebooks);
  if (!notebookDir) {
    throw new Error("Notebooks not found");
  }
  const projectDir = path.join(notebookDir, ProjectsDir);
  const entries = await Array.fromAsync(Deno.readDir(projectDir));
  const files = entries.filter((entry) => entry.isFile).map((entry) =>
    path.join(projectDir, entry.name)
  );
  return files;
}
