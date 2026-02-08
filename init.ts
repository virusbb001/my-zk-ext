import { Command } from "@cliffy/command";
import { addConfigOfTask } from "./tasks/addConfigOfTask.ts";
import { addConfigOfProject } from "./projects/addConfigOfProject.ts";
import { addTemplate } from "./tasks/addTemplate.ts";
import { GlobalOptions, searchNotebooks } from "./lib/index.ts";
import * as path from "@std/path";
import { ZkConfig } from "./lib/type.ts";
import { parse, stringify } from "@std/toml";

// I need pipe operator.
function applyConfigs(config: ZkConfig): ZkConfig {
  let cfg = addConfigOfTask(config);
  cfg = addConfigOfProject(cfg);
  return cfg;
}

export async function action(notebookDir?: string) {
  const notebooks = await searchNotebooks(notebookDir);
  if (!notebooks) {
    throw new Error("Failed to find zk directory");
  }
  await addTemplate(notebooks);

  const configPath = path.join(notebooks, ".zk", "config.toml");
  const zkConfig = parse(await Deno.readTextFile(configPath)) as ZkConfig;
  const modifiedConfig = applyConfigs(zkConfig);
  await Deno.writeTextFile(configPath, stringify(modifiedConfig));

  await Deno.mkdir(path.join("Projects"), { recursive: true });
}

export function init() {
  const command = new Command<GlobalOptions>()
    .description("initialize")
    .action(async (opts) => {
      await action(opts.notebookDir);
    });

  return command;
}
