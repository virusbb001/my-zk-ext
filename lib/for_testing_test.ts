import { syncDirectory, diffDirectory, isDiffEmpty, Permissions } from "./for_testing.ts";
import { TestTemplates } from "./test_consts.ts";
import * as path from "@std/path";
import { emptyDir } from "@std/fs";
import { assertEquals, assert } from "@std/assert";

const TmpDir = Deno.env.get("TMPDIR") ?? "/tmp";

Deno.test({
  name: "isDiffEmpty",
  fn () {
    assert(isDiffEmpty({
      added: [],
      removed: [],
      edited: []
    }), "empty")
    assert(!isDiffEmpty({
      added: ["/a/1.txt"],
      removed: [],
      edited: []
    }), "added")
    assert(!isDiffEmpty({
      added: [],
      removed: ["/a/1.txt"],
      edited: []
    }), "removed")
    assert(!isDiffEmpty({
      added: [],
      removed: [],
      edited: ["/a/1.txt"]
    }), "edited")
  }
});

Deno.test({
  name: "diffDirectory should return empty diff",
  permissions: {
    ...Permissions
  },
  async fn () {
    await emptyDir(TmpDir);
    const oldDir = path.join(TmpDir, "old");
    await Deno.mkdir(oldDir);
    const newDir = path.join(TmpDir, "new");
    await Deno.mkdir(newDir);

    await Deno.mkdir(path.join(oldDir, "a"));
    await Deno.writeTextFile(path.join(oldDir, "a", "1.txt"), "a-1");
    await Deno.mkdir(path.join(oldDir, "a", "b"));
    await Deno.writeTextFile(path.join(oldDir, "a", "b", "2.txt"), "a/b-2");

    await Deno.mkdir(path.join(newDir, "a"));
    await Deno.writeTextFile(path.join(newDir, "a", "1.txt"), "a-1");
    await Deno.mkdir(path.join(newDir, "a", "b"));
    await Deno.writeTextFile(path.join(newDir, "a", "b", "2.txt"), "a/b-2");

    const result = await diffDirectory(oldDir, newDir);
    assertEquals(result.added.length, 0);
    assertEquals(result.removed.length, 0);
    assertEquals(result.edited.length, 0);
  }
});

Deno.test({
  name: "diffDirectory should return removed files",
  permissions: {
    ...Permissions
  },
  async fn () {
    await emptyDir(TmpDir);
    const oldDir = path.join(TmpDir, "old");
    await Deno.mkdir(oldDir);
    const newDir = path.join(TmpDir, "new");
    await Deno.mkdir(newDir);

    await Deno.mkdir(path.join(oldDir, "a"));
    await Deno.writeTextFile(path.join(oldDir, "a", "1.txt"), "a-1");
    await Deno.mkdir(path.join(oldDir, "a", "b"));
    await Deno.writeTextFile(path.join(oldDir, "a", "b", "2.txt"), "a/b-2");

    await Deno.mkdir(path.join(newDir, "a"));
    await Deno.writeTextFile(path.join(newDir, "a", "1.txt"), "a-1");
    await Deno.mkdir(path.join(newDir, "a", "b"));

    const result = await diffDirectory(oldDir, newDir);
    assertEquals(result.added.length, 0);
    assertEquals(result.removed, ["/a/b/2.txt"]);
    assertEquals(result.edited.length, 0);
  }
});

Deno.test({
  name: "diffDirectory should return added files",
  permissions: {
    ...Permissions
  },
  async fn () {
    await emptyDir(TmpDir);
    const oldDir = path.join(TmpDir, "old");
    await Deno.mkdir(oldDir);
    const newDir = path.join(TmpDir, "new");
    await Deno.mkdir(newDir);

    await Deno.mkdir(path.join(oldDir, "a"));
    await Deno.writeTextFile(path.join(oldDir, "a", "1.txt"), "a-1");
    await Deno.mkdir(path.join(oldDir, "a", "b"));

    await Deno.mkdir(path.join(newDir, "a"));
    await Deno.writeTextFile(path.join(newDir, "a", "1.txt"), "a-1");
    await Deno.mkdir(path.join(newDir, "a", "b"));
    await Deno.writeTextFile(path.join(newDir, "a", "b", "2.txt"), "a/b-2");

    const result = await diffDirectory(oldDir, newDir);
    assertEquals(result.added, ["/a/b/2.txt"]);
    assertEquals(result.removed.length, 0);
    assertEquals(result.edited.length, 0);
  }
});

Deno.test({
  name: "diffDirectory should return edited files",
  permissions: {
    ...Permissions
  },
  async fn () {
    const tmpDir = await Deno.makeTempDir();
    await emptyDir(tmpDir);
    const oldDir = path.join(tmpDir, "old");
    await Deno.mkdir(oldDir);
    const newDir = path.join(tmpDir, "new");
    await Deno.mkdir(newDir);

    await Deno.mkdir(path.join(oldDir, "a"));
    await Deno.writeTextFile(path.join(oldDir, "a", "1.txt"), "a-1");
    await Deno.mkdir(path.join(oldDir, "a", "b"));
    await Deno.writeTextFile(path.join(oldDir, "a", "b", "2.txt"), "a/b-2");

    await Deno.mkdir(path.join(newDir, "a"));
    await Deno.writeTextFile(path.join(newDir, "a", "1.txt"), "a-1-edited");
    await Deno.mkdir(path.join(newDir, "a", "b"));
    await Deno.writeTextFile(path.join(newDir, "a", "b", "2.txt"), "a/b-2");

    const result = await diffDirectory(oldDir, newDir);
    assertEquals(result.added.length, 0);
    assertEquals(result.removed.length, 0);
    assertEquals(result.edited, ["/a/1.txt"]);

    await Deno.remove(tmpDir, { recursive: true })
  }
});


Deno.test({
  name: "syncDirectory",
  ignore: false,
  permissions: {
    ...Permissions
  },
  async fn () {
    const tmpDir = await Deno.makeTempDir();
    const notebooksTemplate = path.join(TestTemplates, "notebooks");
    try {
      await syncDirectory(notebooksTemplate, tmpDir + "/");
      const diff = await diffDirectory(notebooksTemplate, tmpDir);
      assert(isDiffEmpty(diff));

      await Deno.remove(tmpDir, { recursive: true });
    } catch (e) {
      console.log(`Remove ${tmpDir}`);
      throw e;
    }
  }
});
