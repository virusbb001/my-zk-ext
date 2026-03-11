/**
 * Copy templates from this to notebooks.
 */

import { exists } from "@std/fs/exists";
import * as path from "@std/path";
import { TemplatesDir } from "../lib/const.ts";

export async function addTemplate(notebooks: string, template: string): Promise<void> {
  const src = path.join(TemplatesDir, template);
  const dest = path.join(notebooks, ".zk", "templates", template);
  if (!(await exists(dest))) {
    await Deno.copyFile(src, dest);
  }
}
