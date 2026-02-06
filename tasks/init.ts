import { exists } from "@std/fs";
import { Command } from "@cliffy/command";
import * as path from "@std/path";
import { type GlobalOptions, searchNotebooks } from "../lib/index.ts"
export const command = new Command<GlobalOptions>()
.description("initialize zk notebooks for use task")
.action(async (opts) => {
  await init(opts.notebookDir);
})
;

export async function init(
  notebookDir?: string
) {
  const notebooks = await searchNotebooks(notebookDir)
  if (!notebooks) {
    throw new Error(`${notebooks} is not zk notebooks`);
  }
  const src = path.join(import.meta.dirname!, "..", "templates", "tasks.md");
  const dest = path.join(notebooks, ".zk", "templates", "tasks.md");
  if (!(await exists(dest))) {
    await Deno.copyFile(src, dest);
  }
  // TODO: set up `zk task` alias
};
