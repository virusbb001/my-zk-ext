import { Command } from "@cliffy/command";
import { GlobalOptions, searchNotebooks } from "../lib/index.ts";
import { CommandName, DailyDir } from "../lib/const.ts";
import { join } from "@std/path";
import { expandGlob } from "@std/fs";
import { Plugin, unified } from "unified";
import remarkParse from "remark-parse";
import { Literal, Root, RootContent } from "mdast";
import remarkStringify from "remark-stringify";
import { u } from "unist-builder";
import { visit } from "unist-util-visit";

export function split() {
  return new Command<GlobalOptions>()
    .description(`split a daily note.

Split daily notes to ${DailyDir}/YYYY-MM-DD/
Generated file name is random.

Daily notes should be in ${DailyDir} of notebooks.

Example: ${CommandName} daily split YYYY-MM-DD.
  `)
    .arguments("<date:string>")
    .action(async function (opts, date) {
      await action(date, opts.notebookDir);
    });
}

async function action(date: string, notebookDir?: string) {
  const notebook = await searchNotebooks(notebookDir);
  if (!notebook) {
    throw new Error("notebook not found");
  }
  const entries = await Array.fromAsync(
    expandGlob(join(notebook, DailyDir, `${date}\.*`)),
  );
  const paths = entries.map((entry) => entry.path);
  if (paths.length === 0) {
    console.log(`Daily Note Not Found: ${date}`);
  }
  if (paths.length !== 1) {
    console.log(`Ambiguous spec detected:\n${paths.join("\n")}`);
    return;
  }
  await splitNote(paths[0]);
}

export interface Hashtag extends Literal {
  type: "zk-hashtag";
}
export interface WikiLink extends Literal {
  type: "zk-wikilink";
}

declare module "mdast" {
  interface RootContentMap {
    zkHashtag: Hashtag;
    zkWikiLink: WikiLink;
  }
  interface PhrasingContentMap {
    zkHashtag: Hashtag;
    zkWikiLink: WikiLink;
  }
}

export const remarkZk: Plugin<[], Root> = function () {
  // NOTE: zkとパターンが異なっている可能性がある
  const hashtagPattern = /(?<=^|\s)#(?:[^\s#]+)/;
  const wikiLinkPattern = /\[\[[^\]]+\]\]/;
  const combinedPattern = new RegExp(
    `(?<hashtag>${hashtagPattern.source})|(?<wikilink>${wikiLinkPattern.source})`,
    "g",
  );

  return function (tree: Root) {
    visit(tree, "text", function (node, index, parent) {
      if (!parent || index === undefined) return;

      const value = node.value;
      const nodes: RootContent[] = [];
      let lastIndex = 0;
      let match;

      combinedPattern.lastIndex = 0;
      while ((match = combinedPattern.exec(value)) !== null) {
        if (match.index > lastIndex) {
          nodes.push(u("text", value.slice(lastIndex, match.index)));
        }

        if (match.groups?.hashtag) {
          nodes.push(u("zk-hashtag", match[0]) as RootContent);
        } else if (match.groups?.wikilink) {
          nodes.push(u("zk-wikilink", match[0]) as RootContent);
        }

        lastIndex = combinedPattern.lastIndex;
      }

      if (nodes.length > 0) {
        if (lastIndex < value.length) {
          nodes.push(u("text", value.slice(lastIndex)));
        }
        parent.children.splice(index, 1, ...nodes);
        return index + nodes.length;
      }
    });
  };
};

export async function splitNote(filePath: string) {
  const content = await Deno.readTextFile(filePath);
  const processor = unified().use(remarkParse).use(remarkZk);
  const ast = processor.parse(content);
  await processor.run(ast);

  const stringifier = unified().use(remarkStringify, {
    handlers: {
      "zk-hashtag": (node: Hashtag) => node.value,
      "zk-wikilink": (node: WikiLink) => node.value,
    },
  });

  const cards: RootContent[][] = [];
  let card: RootContent[] = [];
  for (const child of ast.children) {
    if (child.type === "thematicBreak") {
      if (card.length > 0) {
        cards.push(card);
      }
      card = [];
      continue;
    }
    card.push(child);
  }
  if (card.length > 0) {
    cards.push(card);
  }

  const dailyNoteContents = cards.shift();
  const newDailyNote = u("root", dailyNoteContents ?? []);
  const newCards = cards.map((children) => {
    return u("root", children);
  });

  console.log(stringifier.stringify(newDailyNote));
  newCards.forEach((card) => {
    console.log(stringifier.stringify(card));
  });
}
