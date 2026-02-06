import { join } from "@std/path";
import { emptyDir, copy, walk } from "@std/fs";
import { TestTemplates } from "./test_consts.ts";

export interface EntriesDiff {
  added: string[],
  removed: string[],
  edited: string[],
}

const TmpDir = Deno.env.get("TMPDIR") ?? "/tmp";

/**
 * Permission objects for testing.
 */
export const Permissions: Deno.PermissionOptionsObject = {
  read: true,
  write: [TmpDir]
}

export function isDiffEmpty (diff: EntriesDiff) {
  return (diff.added.length + diff.removed.length + diff.edited.length) === 0;
}

/**
 * Detect diff of directory.
 */
export async function diffDirectory (oldDir: string, newDir: string): Promise<EntriesDiff> {
  const aEntries = await Array.fromAsync(walk(oldDir));
  const bEntries = await Array.fromAsync(walk(newDir));
  const oldEntriesMap = new Map(aEntries.map(entry => [entry.path, entry]));
  const newEntriesMap = new Map(bEntries.map(entry => [entry.path, entry]));

  const oldPath = new Set(aEntries.map(entry => entry.path.replace(oldDir, "")));
  const newPath = new Set(bEntries.map(entry => entry.path.replace(newDir, "")))
  const added = Array.from(newPath.difference(oldPath));
  const removed = Array.from(oldPath.difference(newPath));
  const samePath = Array.from(newPath.intersection(oldPath));
  const editedFlag = await Promise.all(samePath.map(async path => {
    const oldEntry = oldEntriesMap.get(join(oldDir, path))!;
    const newEntry = newEntriesMap.get(join(newDir, path))!;
    if (oldEntry.isDirectory && newEntry.isDirectory) {
      return false;
    }
    if (oldEntry.isDirectory || newEntry.isDirectory) {
      return true;
    }

    const oldContent = await Deno.readFile(join(oldDir, path));
    const newContent = await Deno.readFile(join(newDir, path));
    if (oldContent.length !== newContent.length) {
      return true;
    }
    return oldContent.some((value, index) => value !== newContent[index]);
  }));
  const edited = samePath.filter((_, index) => editedFlag[index]);

  return {
    added,
    removed,
    edited
  };
};

// simply, delete and copy
export async function syncDirectory (src: string, dest: string) {
  await emptyDir(dest);
  await copy(src, dest, { overwrite: true });
}

if(import.meta.main) {
  console.log(await Array.fromAsync(walk(join(TestTemplates, "notebooks"))));

  // const tmpDir = await Deno.makeTempDir();
  // try {
  //   await syncDirectory(TestTemplates, tmpDir);
  //   await Deno.remove(tmpDir, { recursive: true });
  // } catch(e) {
  //   console.log(e);
  //   console.log(`Please remove ${tmpDir}`);
  // }
}
