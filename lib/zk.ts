import { EmulateZeroNote, Zk } from "./const.ts";

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
