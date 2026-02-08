import { addConfigOfProject } from "./addConfigOfProject.ts";
import { assert, assertEquals } from "@std/assert";

Deno.test({
  name: "addConfigOfProject add extranal props",
  fn() {
    const actual = addConfigOfProject({});
    assertEquals(actual.group, {
      project: {
        paths: ["Projects"],
        note: {
          template: "tasks.md",
        },
      },
    });
    // just check defined
    assert(actual.alias?.project);
  },
});

Deno.test({
  name: "addConfigOfProject doesn't overwrite original aliases",
  fn() {
    const actual = addConfigOfProject({
      alias: {
        project: "some-external-project-command",
      },
    });
    assertEquals(actual.alias?.project, "some-external-project-command");
  },
});

Deno.test({
  name: "addConfigOfProject doesn't overwrite original groups",
  fn() {
    const actual = addConfigOfProject({
      group: {
        project: {
          paths: ["MyTask"],
          note: {
            template: "my-tasks.md",
            filename: "{{ slug title }}",
          },
        },
      },
    });
    assertEquals(actual.group, {
      project: {
        paths: ["MyTask"],
        note: {
          template: "my-tasks.md",
        },
      },
    });
  },
});
