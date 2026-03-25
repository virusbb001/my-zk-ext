import { CommandName, LiteratureDir } from "../lib/const.ts";
import { GroupConfiguration, ZkConfig } from "../lib/type.ts";

export function addConfig(zkConfig: ZkConfig): ZkConfig {
  const group = zkConfig.group ?? {};
  group["literature"] = group["literature"] ?? ({
    paths: [LiteratureDir],
    note: {
      extension: "md",
      template: "literature-web.md",
    },
  } satisfies GroupConfiguration);
  zkConfig.group = group;

  const alias = zkConfig.alias ?? {};
  alias["lit"] = alias["lit"] ?? `${CommandName} lit "$@"`;
  zkConfig.alias = alias;

  return zkConfig;
}
