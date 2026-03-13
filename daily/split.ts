import { Command } from "@cliffy/command";
import { GlobalOptions, searchNotebooks } from "../lib/index.ts";
import { CommandName, DailyDir } from "../lib/const.ts";
import { join } from "@std/path";
import { expandGlob } from "@std/fs";
import { Plugin, unified } from "unified";
import remarkParse from "remark-parse";
import { Literal, PhrasingContent, Root, RootContent } from "mdast";
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
  const relativeDailyDir = join(DailyDir, date);
  const dailyDir = join(notebook, DailyDir, date);

  const paths = entries.map((entry) => entry.path);
  if (paths.length === 0) {
    console.log(`Daily Note Not Found: ${date}`);
  }
  if (paths.length !== 1) {
    console.log(`Ambiguous spec detected:\n${paths.join("\n")}`);
    return;
  }

  const content = await Deno.readTextFile(paths[0]);
  const ast = await parseWithCorrection(content, date);
  const [newDailyNote, newCards] = splitNote(ast);

  const alreadyCreatedNames =
    (await Array.fromAsync(Deno.readDir(dailyDir)).catch((e) => {
      if (e instanceof Deno.errors.NotFound) {
        return [];
      }
      throw e;
    })).map((entry) => entry.name);
  const cardMap = setCardNames(
    newDailyNote,
    newCards,
    relativeDailyDir,
    alreadyCreatedNames,
  );

  await writeFiles(paths[0], newDailyNote, cardMap);
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

export async function parseWithCorrection(content: string, header: string) {
  const processor = unified().use(remarkParse).use(remarkZk);
  const ast = processor.parse(content);
  await processor.run(ast);

  // When content doesn't start with heading,
  // first chunk may be a card.
  // It should be treat as an other card.
  const shouldAddHeader = ast.children.length > 0 &&
    ast.children[0].type !== "heading";
  if (shouldAddHeader) {
    ast.children.unshift(
      u("heading", { depth: 1 as const }, [
        u("text", { value: header }),
      ]),
    );
    ast.children.push(
      u("thematicBreak"),
    );
  }

  return ast;
}

/**
 * @return - [root, children]
 */
export function splitNote(ast: Root): [Root, Root[]] {
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

  const dailyNoteContents = cards.shift() ?? [];
  const newDailyNote = u("root", dailyNoteContents);
  const newCards = cards.map((children) => {
    return u("root", children);
  });

  return [newDailyNote, newCards];
}

export function num2chr(n: number): string {
  if (n < 0 || 61 < n) {
    throw new Error(`out of range: ${n}`);
  }
  if (n < 10) {
    return n.toString();
  } else if (n < 36) {
    return String.fromCharCode((n - 10) + "A".charCodeAt(0));
  } else {
    return String.fromCharCode((n - 36) + "a".charCodeAt(0));
  }
}

export function nameGenerator(length: number): string {
  return Array.from(
    { length },
    () => num2chr(Math.floor(Math.random() * (10 + 26 + 26))),
  ).join("");
}

/**
 * @param root - root of daiyly note (YYYY-MM-DD.md)
 *      add links to generated cards.
 * @param cards - splitted cards. Placed in YYYY-MM-DD/
 */
export function setCardNames(
  root: Root,
  cards: Root[],
  dailyDir: string,
  usedNames: string[],
): Map<string, Root> {
  const map = new Map<string, Root>();

  function hasAlreadyUsed(name: string) {
    return usedNames.includes(name) || map.has(name);
  }
  const linkParagraph = u("paragraph", {}, [] as PhrasingContent[]);

  cards.forEach((card) => {
    let cardName = nameGenerator(4);
    while (hasAlreadyUsed(cardName)) {
      cardName = nameGenerator(4);
    }
    map.set(cardName, card);
  });

  map.keys().forEach((key) => {
    const link = u("zk-wikilink", {
      value: `[[${dailyDir}/${key}]]`,
    });
    linkParagraph.children.push(link);
    linkParagraph.children.push(u("text", {
      value: "\n",
    }));
  });
  root.children.push(linkParagraph);

  return map;
}

export async function writeFiles(
  filePath: string,
  root: Root,
  cards: Map<string, Root>,
) {
  const stringifier = unified().use(remarkStringify, {
    handlers: {
      "zk-hashtag": (node: Hashtag) => node.value,
      "zk-wikilink": (node: WikiLink) => node.value,
    },
  });

  const lastDotIndex = filePath.lastIndexOf(".");
  const baseDir = lastDotIndex !== -1
    ? filePath.substring(0, lastDotIndex)
    : filePath;
  await Deno.mkdir(baseDir, { recursive: true });
  for (const card of cards) {
    const [id, root] = card;
    const cardPath = join(baseDir, id + ".md");
    console.log(cardPath);
    await Deno.writeTextFile(cardPath, stringifier.stringify(root));
  }
  await Deno.writeTextFile(filePath, stringifier.stringify(root));
}
