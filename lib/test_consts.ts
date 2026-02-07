import { join } from "@std/path";
export const TestTemplatesPath = join(import.meta.dirname!, "..", "test");

export const TestTemplates = Object.freeze({
  /**
   * empty notebooks
   */
  Notebooks: join(TestTemplatesPath, "notebooks"),
  /**
   * Already set up but no tasks.
   */
  SetUp: join(TestTemplatesPath, "notebooks-setted-up"),
  /**
   * Already set up and tasks exists.
   */
  HasSomeTasks: join(TestTemplatesPath, "has-some-tasks"),
  /**
   * Not a zk notebook.
   */
  NotNotebook: join(TestTemplatesPath, "not-notebook"),
});
