/**
 * https://zk-org.github.io/zk/config/config-note.html
 */
export interface NoteConfiguration {
  language?: string;
  "default-title"?: string;
  filename?: string;
  extension?: string;
  template?: string;
  exclude?: string[];
  "id-charset"?: string;
  "id-length"?: number;
  "id-case"?: number;
}

/**
 * https://zk-org.github.io/zk/config/config-extra.html
 */
export type ExtraUserVariables = Record<string, unknown>;
/**
 * https://zk-org.github.io/zk/config/config-group.html
 */
export interface GroupConfiguration extends NoteConfiguration {
  path?: string[];
  extra?: ExtraUserVariables;
}

/**
 * https://zk-org.github.io/zk/config/index.html
 */
export type ZkConfig = Partial<{
  /**
   * Command aliases of zk
   * https://zk-org.github.io/zk/config/config-alias.html
   */
  alias: Record<string, string>;
  note: NoteConfiguration;
  group: Record<string, GroupConfiguration>;
}>;
