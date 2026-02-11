import { Command } from "@cliffy/command";
import { GlobalOptions } from "../lib/index.ts";
import { StatusType } from "./StatusType.ts";
import { remark } from "remark";
import remarkFrontmatter from "remark-frontmatter";
import { parse, stringify } from "@std/yaml";
import { Root } from "mdast";

export function mark() {
  return new Command<GlobalOptions>()
    .type("status", new StatusType())
    .description(`change task status`)
    .arguments("<task:file> <status:status>")
    .action(async function (_opts, task, status) {
      await action(task, status);
    });
}

export async function action(task: string, status: string) {
  const content = await Deno.readTextFile(task);

  const file = await remark()
    .use(remarkFrontmatter)
    .use<[], Root, void>(function () {
      return function (tree) {
        const yamlNode = tree.children.find((node) => node.type === "yaml");
        if (!yamlNode) {
          return;
        }
        const yaml = parse(yamlNode.value);
        if (typeof yaml !== "object" || yaml === null) {
          return;
        }
        if (!("status" in yaml)) {
          return;
        }
        yaml.status = status;
        yamlNode.value = stringify(yaml).trim();
      };
    })
    .process(content);
  const modifiedContent = String(file);
  await Deno.writeTextFile(task, modifiedContent);
  console.log(`Uodated ${task} to ${status}`);
}
