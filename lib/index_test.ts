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
  const hasSomeTasks = path.join(templatePath, "has-some-tasks");
  await t.step({
    name: "options correct path",
    async fn () {
      Deno.env.delete(NotebookEnv);
      const notebook = await searchNotebooks(notebookPath);
      assertEquals(notebook, notebookPath);
    }
  });

  await t.step({
    name: "options wrong path",
    async fn () {
      Deno.env.delete(NotebookEnv);
      const notebook = await searchNotebooks(wrongPath);
      assertEquals(notebook, undefined);
    }
  });

  await t.step({
    name: "ENV correct ZK",
    async fn () {
      Deno.env.set(NotebookEnv, notebookPath);
      const notebook = await searchNotebooks();
      assertEquals(notebook, notebookPath);
    }
  });

  await t.step({
    name: "ENV wrong ZK",
    async fn () {
      Deno.env.set(NotebookEnv, wrongPath);
      const notebook = await searchNotebooks();
      assertEquals(notebook, undefined);
    }
  });

  await t.step({
    name: "PWD correct ZK",
    async fn () {
      Deno.env.delete(NotebookEnv);
      Deno.chdir(notebookPath);
      const notebook = await searchNotebooks();
      assertEquals(notebook, notebookPath);
    }
  });

  await t.step({
    name: "PWD descendants of correct  ZK",
    async fn () {
      Deno.env.delete(NotebookEnv);
      Deno.chdir(path.join(hasSomeTasks, "Tasks"));
      const notebook = await searchNotebooks();
      assertEquals(notebook, hasSomeTasks);
    }
  });
  await Deno.remove(tmpDir, { recursive: true });
});
