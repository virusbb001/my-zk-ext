import { CommandName, ProjectsDir } from "../lib/const.ts";
import { GroupConfiguration, ZkConfig } from "../lib/type.ts";

/**
 * add subcommands of zk
 * - project: alias of `${this} task`
 * add project group.
 *
 * @param zkConfig - zk config object. This function overwrites argument object.
 */
export function addConfigOfProject(zkConfig: ZkConfig): ZkConfig {
  const group = zkConfig.group ?? {};
  group["project"] = group["project"] ?? ({
    paths: [ProjectsDir],
    note: {
      filename: "{{slug title}}",
      template: "tasks.md",
    },
  } satisfies GroupConfiguration);
  zkConfig.group = group;

  const alias = zkConfig.alias ?? {};
  alias["project"] = alias["project"] ?? `${CommandName} project "$@"`;
  zkConfig.alias = alias;

  return zkConfig;
}
