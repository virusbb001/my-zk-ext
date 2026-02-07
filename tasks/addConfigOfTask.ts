import { CommandName } from "../lib/const.ts";
import { ZkConfig } from "../lib/type.ts";

/**
 * add subcommands of zk
 * - task: alias of `${this} task`
 * - task-new: add task note of projects
 *
 * @param zkConfig - zk config object. This function overwrites argument object.
 */

export function addConfigOfTask(zkConfig: ZkConfig): ZkConfig {
  const group = zkConfig.group ?? {};
  group["task"] = group["task"] ?? {
    path: ["Projects/*"],
    template: "tasks.md",
  };
  zkConfig.group = group;

  const alias = zkConfig.alias ?? {};
  alias["task"] = alias["task"] ?? `${CommandName} task "$@"`;
  /** zk task new <ProjectName> ${other arguments}*/
  alias["task-new"] = alias["task-new"] ??
    `zk new "$ZK_NOTEBOOK_DIR/Projects/$1" \${@:2}`;
  zkConfig.alias = alias;

  return zkConfig;
}
