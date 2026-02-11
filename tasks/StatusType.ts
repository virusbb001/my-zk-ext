import { ArgumentValue, Type } from "@cliffy/command";

/**
 * Task status type
 */
export class StatusType extends Type<string> {
  private readonly status = ["not-started", "doing", "pending", "complete"];

  override complete (): Array<string> {
    return this.status;
  }

  public override parse(type: ArgumentValue): string {
    return type.value;
  }
}
