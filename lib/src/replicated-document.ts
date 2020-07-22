export enum ReplicatedDocumentFlag {
  DELETED = "DELETED",
  ACCESS_REMOVED = "ACCESS_REMOVED",
}

export class ReplicatedDocument {
  constructor(
    protected id: string,
    protected flags: [ReplicatedDocumentFlag],
    protected error: string = null
  ) {}

  getId(): string {
    return this.id;
  }

  getFlags(): [ReplicatedDocumentFlag] {
    return this.flags;
  }

  getError(): string {
    return this.error;
  }
}
