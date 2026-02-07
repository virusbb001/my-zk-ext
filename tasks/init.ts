import { exists } from "@std/fs";
import { Command } from "@cliffy/command";
import * as path from "@std/path";
import { parse } from "@std/toml";
import { type GlobalOptions, searchNotebooks } from "../lib/index.ts"
import { CommandName, TemplatesDir } from "../lib/const.ts";
export const command = new Command<GlobalOptions>()
.description("initialize zk notebooks for use task")
.action(async (opts) => {
  await init(opts.notebookDir);
})
;

async function addTemplate(notebooks: string) {
  const src = path.join(TemplatesDir, "tasks.md");
  const dest = path.join(notebooks, ".zk", "templates", "tasks.md");
  if (!(await exists(dest))) {
    await Deno.copyFile(src, dest);
  }
}

export async function init(
  notebookDir?: string
) {
  const notebooks = await searchNotebooks(notebookDir)
  if (!notebooks) {
    throw new Error("Failed to find zk directory");
  }
  addTemplate(notebooks);
  // TODO: set up `zk task` alias
};
