import * as path from "@std/path";
import { copy } from "@std/fs/copy";
import { assertEquals } from "@std/assert";

import { NotebookEnv } from "./const.ts";
import { searchNotebooks } from "./index.ts";

const testTemplates = path.join(import.meta.dirname!, "..", "test");

async function copyTemplates (dest: string): Promise<void> {
  await copy(testTemplates, dest);
}

Deno.test("searchNotebooks", async t => {
  const tmpDir = await Deno.makeTempDir();
  const templatePath = path.join(tmpDir, "templates");
  await copyTemplates(templatePath);
  const notebookPath = path.join(templatePath, "notebooks")
  const wrongPath = path.join(templatePath, "not-notebook")
  await t.step({
    name: "options",
    ignore: true,
    fn () {
      Deno.env.delete(NotebookEnv);
      // not implemented yet.
    }
  });

  await t.step({
    name: "correct ZK",
    async fn () {
      Deno.env.set(NotebookEnv, notebookPath);
      const path = await searchNotebooks();
      assertEquals(path, notebookPath);
    }
  });

  await t.step({
    name: "wrong ZK",
    async fn () {
      Deno.env.set(NotebookEnv, wrongPath);
      const path = await searchNotebooks();
      assertEquals(path, undefined);
    }
  });
  await Deno.remove(tmpDir, { recursive: true });
});
