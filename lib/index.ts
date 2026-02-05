/**
 * https://github.com/zk-org/zk/blob/10d93d5d6419941420e7775d409e530a7de59cbc/main.go#L210
 * Released under GPL-3.0.
 *
 * This source code was derived from zk-org/zk.
 */

import * as path from "@std/path";
import { exists } from "@std/fs/exists";

const ZkDir = ".zk";

/**
 */
async function lookupZk(dir: string): Promise<string | undefined> {
  const root = path.parse(dir).root;
  let current = dir;
  while(root !== current) {
    if (await exists(path.join(current, ZkDir), { isDirectory: true})) {
      return current;
    }
    current = path.dirname(current);
  };
  return undefined;
}


/**
 * search notebooks directory.
 *
 */
export async function searchNotebooks (): Promise<string | undefined> {
  // TODO: options
  const notebookDir = Deno.env.get("ZK_NOTEBOOK_DIR");
  if (notebookDir && await exists(path.join(notebookDir,ZkDir))) {
    return notebookDir;
  }
  return lookupZk(Deno.cwd());
}
