import { ReplicatedDocument } from "./replicated-document";

export enum ReplicationDirection {
  PUSH = "PUSH",
  PULL = "PULL",
}

export class DocumentReplication {
  constructor(
    protected direction: ReplicationDirection,
    protected documents: [ReplicatedDocument]
  ) {}

  getDirection(): ReplicationDirection {
    return this.direction;
  }

  getDocuments(): [ReplicatedDocument] {
    return this.documents;
  }
}
