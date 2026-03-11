import { CommandName, DailyDir } from "../lib/const.ts";
import { GroupConfiguration, ZkConfig } from "../lib/type.ts";

export function addConfig(zkConfig: ZkConfig): ZkConfig {
  const group = zkConfig.group ?? {};
  group["daily"] = group["daily"] ?? ({
    paths: [DailyDir],
    note: {
      filename: "{{ format-date now '%Y-%m-%d' }}",
      extension: "md",
      template: "daily.md",
    },
  } satisfies GroupConfiguration);
  zkConfig.group = group;

  const alias = zkConfig.alias ?? {};
  alias["daily"] = alias["daily"] ?? `${CommandName} daily "$@"`;
  alias["daily-new"] = alias["daily-new"] ?? `zk new --no-input \"$ZK_NOTEBOOK_DIR/Daily\" "$@"`
  zkConfig.alias = alias;

  return zkConfig;
}
