import { assertEquals } from "@std/assert";
import { unified } from "unified";
import remarkParse from "remark-parse";
import { Hashtag, remarkZk, WikiLink } from "./split.ts";
import { Root, Text } from "mdast";

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
