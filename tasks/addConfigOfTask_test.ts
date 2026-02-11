import { addConfigOfTask } from "./addConfigOfTask.ts";
import { assert, assertEquals } from "@std/assert";

Deno.test({
  name: "addConfigOfTask add extranal props",
  fn() {
    const actual = addConfigOfTask({});
    assertEquals(actual.group, {
      task: {
        paths: ["Projects/*"],
        note: {
          template: "tasks.md",
        },
      },
    });
    // just check defined
    assert(actual.alias?.task);
  },
});

Deno.test({
  name: "addConfigOfTask doesn't overwrite original aliases",
  fn() {
    const actual = addConfigOfTask({
      alias: {
        task: "some-external-task-command",
        "task-new": "my-new-task",
      },
    });
    assertEquals(actual.alias?.task, "some-external-task-command");
    assertEquals(actual.alias?.["task-new"], "my-new-task");
  },
});

Deno.test({
  name: "addConfigOfTask doesn't overwrite original groups",
  fn() {
    const actual = addConfigOfTask({
      group: {
        task: {
          paths: ["MyTask/*"],
          note: {
            template: "my-tasks.md",
          },
        },
      },
    });
    assertEquals(actual.group, {
      task: {
        paths: ["MyTask/*"],
        note: {
          template: "my-tasks.md",
        },
      },
    });
  },
});
