import { Command } from "@cliffy/command";
import { GlobalOptions, searchNotebooks } from "../lib/index.ts";
import { getMetaDataFromURL, WebMetaData } from "./lib/getMetaData.ts";
import { LiteratureDir, Zk } from "../lib/const.ts";
import { join } from "@std/path";
import { zkListJSON } from "../lib/zk.ts";

export function newCommand() {
  return new Command<GlobalOptions>()
    .description(`
new literature note.
  `)
    .option("--url <url:string>", "create from url", {
      required: true,
    })
    .stopEarly()
    .action(async function (opts) {
      const zkArgs = this.getLiteralArgs();
      const notebook = await searchNotebooks(opts.notebookDir);
      if (!notebook) {
        console.log("notebook not found");
        return;
      }
      await action(notebook, opts.url, zkArgs);
    });
}

async function action(
  notebookDir: string,
  url: string,
  args: string[],
) {
  // check already created
  // TODO: should I create database?
  const literatureNotes = await zkListJSON([LiteratureDir]);
  const matchedNotes = literatureNotes.filter((note) =>
    note.metadata.url === url
  );
  const zkPrintPath = ["-p", "--print-path"];
  if (matchedNotes.length > 0) {
    const printPath = args.some((arg) => zkPrintPath.includes(arg));
    if (printPath) {
      console.log(matchedNotes[0].absPath);
      return;
    }
    const command = new Deno.Command(Zk, {
      args: [
        "edit",
        matchedNotes[0].absPath,
      ],
    });
    const process = command.spawn();
    const status = await process.status;
    Deno.exitCode = status.code;
  }

  // const metadata = await getMetaDataFromURL(url);
  const metadata: WebMetaData = {
    author: "Article-Author,Article-Author3",
    description: "Article Description Lorem Ipsum",
    title: "Article-Title",
  };
  await createNote(notebookDir, url, metadata, args);
}

function escapeToShell(str: string) {
  return str.replaceAll("\\", "\\\\").replaceAll(",", "\\,");
}

async function createNote(
  notebookDir: string,
  url: string,
  metadata: WebMetaData,
  args: string[],
) {
  const additionalArgs: string[] = [];
  const extras = [
    `url=${url}`,
  ];
  if (metadata.author) {
    extras.push(`author="${escapeToShell(metadata.author)}"`);
  }
  if (metadata.description) {
    extras.push(`description="${escapeToShell(metadata.description)}"`);
  }
  if (extras.length > 0) {
    additionalArgs.push(`--extra=${extras.join(",")}`);
  }
  const command = new Deno.Command(Zk, {
    args: [
      "new",
      "--template=literature-web.md",
      "--no-input",
      "--title=" + metadata.title,
      ...additionalArgs,
      join(notebookDir, "Literature"),
      ...args,
    ],
  });
  const process = command.spawn();
  const status = await process.status;
  Deno.exitCode = status.code;
}
