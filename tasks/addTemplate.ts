import { exists } from "@std/fs/exists";
import * as path from "@std/path";
import { TemplatesDir } from "../lib/const.ts";

export async function addTemplate(notebooks: string): Promise<void> {
  const src = path.join(TemplatesDir, "tasks.md");
  const dest = path.join(notebooks, ".zk", "templates", "tasks.md");
  if (!(await exists(dest))) {
    await Deno.copyFile(src, dest);
  }
}
