/**
 * https://github.com/zk-org/zk/blob/10d93d5d6419941420e7775d409e530a7de59cbc/main.go#L210
 * Released under GPL-3.0.
 *
 * This source code was derived from zk-org/zk.
 */

import * as path from "@std/path";
import { exists } from "@std/fs/exists";

// Global Options
export type GlobalOptions = {
  notebookDir?: string;
};

const ZkDir = ".zk";

/**
 * look up .zk directory.
 * @returns - path of nearest .zk, or undefined when not found.
 */
async function lookupZk(dir: string): Promise<string | undefined> {
  const root = path.parse(dir).root;
  let current = dir;
  while (root !== current) {
    if (await exists(path.join(current, ZkDir), { isDirectory: true })) {
      return current;
    }
    current = path.dirname(current);
  }
  return undefined;
}

/**
 * search notebooks directory.
 * Mostly same of zk-org/zk `notebookSearchDirs`
 */
export async function searchNotebooks(
  notebookDir?: string,
): Promise<string | undefined> {
  if (notebookDir && await exists(path.join(notebookDir, ZkDir))) {
    return notebookDir;
  }
  const notebookEnvDir = Deno.env.get("ZK_NOTEBOOK_DIR");
  if (notebookEnvDir && await exists(path.join(notebookEnvDir, ZkDir))) {
    return notebookEnvDir;
  }
  return lookupZk(Deno.cwd());
}
