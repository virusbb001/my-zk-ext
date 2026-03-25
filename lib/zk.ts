import { EmulateZeroNote, Zk } from "./const.ts";

interface Note {
  absPath: string;
  metadata: {
    url: string;
  };
}

export async function zkList(files: string[], zkArgs: string[] = []) {
  const command = new Deno.Command(Zk, {
    args: [
      "list",
      ...zkArgs,
      ...(files.length > 0 ? files : EmulateZeroNote),
    ],
  });
  const process = command.spawn();
  const status = await process.status;
  Deno.exitCode = status.code;
}

export async function zkListJSON(files: string[] = [], zkArgs: string[] = []) {
  const args = ["-q", "--format=json"];
  const command = new Deno.Command(Zk, {
    args: [
      "list",
      ...args,
      ...zkArgs,
      ...(files.length > 0 ? files : EmulateZeroNote),
    ],
  });
  const output = await command.output();
  const stdout = new TextDecoder().decode(output.stdout);
  if (stdout === "") {
    return [];
  }
  const notes = JSON.parse(stdout) as Note[];
  return notes;
}
