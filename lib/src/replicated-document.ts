export enum ReplicatedDocumentFlag {
  DELETED = "DELETED",
  ACCESS_REMOVED = "ACCESS_REMOVED",
}

export class ReplicatedDocument {
  constructor(
    protected id: string,
    protected flags: ReplicatedDocument[],
    protected error: string = null
  ) {}

  getId(): string {
    return this.id;
  }

  getFlags(): ReplicatedDocument[] {
    return this.flags;
  }

  getError(): string {
    return this.error;
  }
}
