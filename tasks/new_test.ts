import { assertEquals } from "@std/assert";
import { Permissions, syncDirectory } from "../lib/for_testing.ts";
import { TestTemplates } from "../lib/test_consts.ts";
import { createNewTask } from "./new.ts";

import { join } from "@std/path";
import { ProjectsDir } from "../lib/const.ts";

const permissions = {
  ...Permissions,
  run: ["zk"],
};

Deno.test({
  name: "create new task in project directory",
  permissions,
  async fn() {
    const tmpDir = await Deno.makeTempDir();
    const projectName = "proj-1";
    try {
      await syncDirectory(TestTemplates.HasSomeTasks, tmpDir);
      const projectDir = join(tmpDir, ProjectsDir, projectName);

      const code = await createNewTask(tmpDir, projectName, undefined, ["-p"]);
      assertEquals(code, 0);
      const entries = await Array.fromAsync(Deno.readDir(projectDir));
      assertEquals(entries.length, 2);

      await Deno.remove(tmpDir, { recursive: true });
    } catch (e) {
      console.log(`Check ${tmpDir}`);
      throw e;
    }
  },
});
