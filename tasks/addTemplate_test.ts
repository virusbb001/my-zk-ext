import { addTemplate } from "./addTemplate.ts";
import { assertEquals, assertRejects } from "@std/assert";
import { Permissions, syncDirectory } from "../lib/for_testing.ts";
import { TestTemplates } from "../lib/test_consts.ts";

import { join } from "@std/path";
import { assertNotEquals } from "@std/assert/not-equals";

const permissions = {
  ...Permissions,
  env: ["ZK_NOTEBOOK_DIR"]
}

Deno.test({
  name: "addTemplate should setup for task",
  permissions,
  async fn () {
    const tmpDir = await Deno.makeTempDir();
    try {
    await syncDirectory(TestTemplates.Notebooks, tmpDir);
    await addTemplate(tmpDir);
    const originalContent = await Deno.readTextFile(join(import.meta.dirname!, "..", "templates", "tasks.md"));
    const taskTemplateContent = await Deno.readTextFile(join(tmpDir, ".zk", "templates", "tasks.md"));
      assertEquals(taskTemplateContent, originalContent);
      await Deno.remove(tmpDir, { recursive: true });
    } catch (e) {
      console.log(`Check ${tmpDir}`);
      throw e;
    }
  }
});

Deno.test({
  name: "addTemplate should throw when passed not zk directory",
  permissions: Permissions,
  async fn () {
    const tmpDir = await Deno.makeTempDir();
    await syncDirectory(TestTemplates.NotNotebook, tmpDir);
    await assertRejects(() => addTemplate(tmpDir));
    await Deno.remove(tmpDir, { recursive: true });
  }
});

Deno.test({
  name: "addTemplate should not overwrite files",
  permissions,
  async fn () {
    const tmpDir = await Deno.makeTempDir();
    try {
      await syncDirectory(TestTemplates.SetUp, tmpDir);
      const customizedTemplate = await Deno.readTextFile(join(tmpDir, ".zk", "templates", "tasks.md"));
      await addTemplate(tmpDir);
      const originalContent = await Deno.readTextFile(join(import.meta.dirname!, "..", "templates", "tasks.md"));
      const taskTemplateContent = await Deno.readTextFile(join(tmpDir, ".zk", "templates", "tasks.md"));
      assertNotEquals(taskTemplateContent, originalContent);
      assertEquals(taskTemplateContent, customizedTemplate);
      await Deno.remove(tmpDir, { recursive: true });
    } catch (e) {
      console.log(`Check ${tmpDir}`);
      throw e;
    }
    
  }
});
