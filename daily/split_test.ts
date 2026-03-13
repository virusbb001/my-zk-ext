import { assertEquals } from "@std/assert";
import { unified } from "unified";
import remarkParse from "remark-parse";
import {
  Hashtag,
  nameGenerator,
  num2chr,
  parseWithCorrection,
  remarkZk,
  setCardNames,
  splitNote,
  WikiLink,
} from "./split.ts";
import { Paragraph, Root, Text } from "mdast";

Deno.test("remarkZk - should parse hashtags and wikilinks", async () => {
  const processor = unified().use(remarkParse).use(remarkZk);
  const markdown = "Hello #tag1 and [[wiki-link]] also #tag2 [[another link]]";

  const ast = processor.parse(markdown) as Root;
  await processor.run(ast);

  const paragraph = ast.children[0];
  if (paragraph.type !== "paragraph") {
    throw new Error("Expected a paragraph");
  }

  const children = paragraph.children;

  // 1. "Hello " (text)
  assertEquals(children[0].type, "text");
  assertEquals((children[0] as Text).value, "Hello ");

  // 2. "#tag1" (zk-hashtag)
  assertEquals(children[1].type, "zk-hashtag");
  assertEquals((children[1] as Hashtag).value, "#tag1");

  // 3. " and " (text)
  assertEquals(children[2].type, "text");
  assertEquals((children[2] as Text).value, " and ");

  // 4. "[[wiki-link]]" (zk-wikilink)
  assertEquals(children[3].type, "zk-wikilink");
  assertEquals((children[3] as WikiLink).value, "[[wiki-link]]");

  // 5. " also " (text)
  assertEquals(children[4].type, "text");
  assertEquals((children[4] as Text).value, " also ");

  // 6. "#tag2" (zk-hashtag)
  assertEquals(children[5].type, "zk-hashtag");
  assertEquals((children[5] as Hashtag).value, "#tag2");

  // 7. " " (text)
  assertEquals(children[6].type, "text");
  assertEquals((children[6] as Text).value, " ");

  // 8. "[[another link]]" (zk-wikilink)
  assertEquals(children[7].type, "zk-wikilink");
  assertEquals((children[7] as WikiLink).value, "[[another link]]");
});

Deno.test("remarkZk - should handle no matches", async () => {
  const processor = unified().use(remarkParse).use(remarkZk);
  const markdown = "Just normal text without any tags or links.";

  const ast = processor.parse(markdown) as Root;
  await processor.run(ast);

  const paragraph = ast.children[0];
  if (paragraph.type !== "paragraph") {
    throw new Error("Expected a paragraph");
  }

  assertEquals(paragraph.children.length, 1);
  assertEquals(paragraph.children[0].type, "text");
  assertEquals(
    (paragraph.children[0] as Text).value,
    "Just normal text without any tags or links.",
  );
});

Deno.test("remarkZk - edge cases: should not parse hashtags in URLs or links", async () => {
  const processor = unified().use(remarkParse).use(remarkZk);
  const markdown =
    "Check this [link](http://example.com/#anchor) and raw http://example.com/#anchor";

  const ast = processor.parse(markdown) as Root;
  await processor.run(ast);

  const paragraph = ast.children[0];
  if (paragraph.type !== "paragraph") throw new Error("Expected a paragraph");

  // [link](http://example.com/#anchor) は 'link' ノードになるため、
  // remarkZk (visit 'text') は干渉するべきでない。
  const linkNode = paragraph.children[1];
  assertEquals(linkNode.type, "link");

  console.log(paragraph.children);
  const rawUrlText = paragraph.children[2];
  console.log(rawUrlText);
  assertEquals(rawUrlText.type, "text");
});

Deno.test("remarkZk - edge cases: should not parse tags inside code blocks", async () => {
  const processor = unified().use(remarkParse).use(remarkZk);
  const markdown =
    "Here is `inline #code` and [[not a link]].\n\n```\n#block\n[[wikilink]]\n```";

  const ast = processor.parse(markdown) as Root;
  await processor.run(ast);

  // インラインコード内のチェック
  const p1 = ast.children[0];
  if (p1.type !== "paragraph") throw new Error("Expected a paragraph");

  const inlineCode = p1.children[1];
  assertEquals(inlineCode.type, "inlineCode");
  // inlineCode ノードの中身は 'text' ノードではないので remarkZk は触らない

  // コードブロック内のチェック
  const codeBlock = ast.children[1];
  assertEquals(codeBlock.type, "code");
  // code ノードも同様に remarkZk は触らない
});

Deno.test("num2str", () => {
  assertEquals(num2chr(0), "0");
  assertEquals(num2chr(9), "9");
  assertEquals(num2chr(10), "A");
  assertEquals(num2chr(35), "Z");
  assertEquals(num2chr(36), "a");
  assertEquals(num2chr(61), "z");
});

Deno.test("splitNote - should split note by thematic breaks", async () => {
  const content = `# 2026-01-01

---

Title
First section.

---

Second section with #tag.

---

Third section with [[link]].`;

  const [dailyNote, cards] = splitNote(
    await parseWithCorrection(content, "2026-01-01"),
  );

  // First section should be in dailyNote
  assertEquals(dailyNote.children.length, 1);
  assertEquals(dailyNote.children[0].type, "heading");

  // Other sections should be in cards
  assertEquals(cards.length, 3);
  assertEquals(cards[0].children[0].type, "paragraph");
  assertEquals(cards[1].children[0].type, "paragraph");
});

Deno.test("nameGenerator - should generate string of specified length", () => {
  const name4 = nameGenerator(4);
  assertEquals(name4.length, 4);
  const name8 = nameGenerator(8);
  assertEquals(name8.length, 8);

  // Check if it only contains valid characters [0-9A-Za-z]
  const validChars = /^[0-9A-Za-z]+$/;
  assertEquals(validChars.test(name4), true);
  assertEquals(validChars.test(name8), true);
});

Deno.test("parseWithCorrection - should add header if not starting with heading", async () => {
  const content = "This is a card without heading.";
  const header = "2026-03-14";
  const ast = await parseWithCorrection(content, header);

  // Should have: heading, paragraph, thematicBreak
  assertEquals(ast.children.length, 3);
  assertEquals(ast.children[0].type, "heading");
  assertEquals((ast.children[0] as any).depth, 1);
  assertEquals((ast.children[0] as any).children[0].value, header);
  assertEquals(ast.children[1].type, "paragraph");
  assertEquals(ast.children[2].type, "thematicBreak");
});

Deno.test("parseWithCorrection - should NOT add header if starting with heading", async () => {
  const content = "# Existing Heading\n\nContent";
  const header = "2026-03-14";
  const ast = await parseWithCorrection(content, header);

  // Should NOT have the added header
  assertEquals(ast.children[0].type, "heading");
  assertEquals((ast.children[0] as any).children[0].value, "Existing Heading");
  assertEquals(ast.children.length, 2); // heading and paragraph
});

Deno.test("parseWithCorrection - should handle empty content", async () => {
  const content = "";
  const header = "2026-03-14";
  const ast = await parseWithCorrection(content, header);

  assertEquals(ast.children.length, 0);
});

Deno.test("setCardNames - should add links to root and return map", async () => {
  const content = `# Root

---

Card 1

---

Card 2`;
  const [root, cards] = splitNote(await parseWithCorrection(content, "Root"));

  const dailyDir = "Daily/2026-03-13";
  const usedNames: string[] = ["used"];

  const cardMap = setCardNames(root, cards, dailyDir, usedNames);

  // cardMap check
  assertEquals(cardMap.size, 2);
  for (const name of cardMap.keys()) {
    assertEquals(name.length, 4);
    assertEquals(name !== "used", true);
  }

  // root check (should have a new paragraph with links)
  // Original root had 1 paragraph. setCardNames adds 1 paragraph.
  assertEquals(root.children.length, 2);
  const lastChild = root.children[1];
  assertEquals(lastChild.type, "paragraph");

  // The added paragraph should contain zk-wikilink nodes and newlines
  const children = (lastChild as Paragraph).children;
  assertEquals(children.length, 4); // 2 links + 2 newlines

  const wikiLinks = children.filter((c) => c.type === "zk-wikilink");
  assertEquals(wikiLinks.length, 2);
  wikiLinks.forEach((link) => {
    assertEquals(link.value.startsWith(`[[${dailyDir}/`), true);
  });
});
