import * as path from "@std/path";

export const NotebookEnv = "ZK_NOTEBOOK_DIR";
/**
 * command name of this program.
 */
export const CommandName = "my-zk-ext";
/**
 * command name of zk
 */
export const Zk = "zk";
export const TemplatesDir = path.join(import.meta.dirname!, "..", "templates");
export const ProjectsDir = "Projects";
export const EmulateZeroNote = ["--exclude",ProjectsDir,ProjectsDir];
