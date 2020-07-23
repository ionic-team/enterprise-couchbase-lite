export enum ReplicatedDocumentFlag {
  DELETED = "DELETED",
  ACCESS_REMOVED = "ACCESS_REMOVED",
}

export class ReplicatedDocument {
  constructor(
    protected id: string,
    protected flags: ReplicatedDocumentFlag[],
    protected error: string = null
  ) {}

  getId(): string {
    return this.id;
  }

  getFlags(): ReplicatedDocumentFlag[] {
    return this.flags;
  }

  getError(): string {
    return this.error;
  }
}

export interface ReplicatedDocumentRepresentation {
  id: string
  flags: string[]
  error: string
}

export function isReplicatedDocumentRepresentation(obj: any): obj is ReplicatedDocumentRepresentation {
  try {
    const object: ReplicatedDocumentRepresentation = obj
    object.flags.forEach(flag => {
      const flagTest: ReplicatedDocumentFlag | undefined = (<any>ReplicatedDocumentFlag)[flag];
      if (flagTest == undefined) {
        return false
      }
    });
    return (object.id != null)
  } catch (e) {
    console.warn("Invalid ReplicatedDocumentRepresentation", e)
    return false
  }
}
