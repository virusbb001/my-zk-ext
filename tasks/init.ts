import { Command } from "@cliffy/command";
import * as path from "@std/path";
import { parse, stringify } from "@std/toml";
import { type GlobalOptions, searchNotebooks } from "../lib/index.ts"
import { ZkConfig } from "../lib/type.ts";
import { addTemplate } from "./addTemplate.ts";
import { addConfigOfTask } from "./addConfigOfTask.ts";
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
    throw new Error("Failed to find zk directory");
  }
  await addTemplate(notebooks);
  const configPath = path.join(notebooks, ".zk", "config.toml");
  const zkConfig = parse(await Deno.readTextFile(configPath)) as ZkConfig;
  const modifiedConfig = addConfigOfTask(zkConfig);
  await Deno.writeTextFile(configPath, stringify(modifiedConfig));
};
