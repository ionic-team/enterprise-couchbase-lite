import { ReplicatedDocument, ReplicatedDocumentRepresentation, isReplicatedDocumentRepresentation } from "./replicated-document";

export enum ReplicationDirection {
  PUSH = "PUSH",
  PULL = "PULL",
}

export class DocumentReplication {
  constructor(
    protected direction: ReplicationDirection,
    protected documents: ReplicatedDocument[]
  ) {}

  getDirection(): ReplicationDirection {
    return this.direction;
  }

  getDocuments(): ReplicatedDocument[] {
    return this.documents;
  }
}

export interface DocumentReplicationRepresentation {
  direction: string
  documents: ReplicatedDocumentRepresentation[]
}

export function isDocumentReplicationRepresentation(obj: any): obj is DocumentReplicationRepresentation {
  try {
    const object: DocumentReplicationRepresentation = obj;
    object.documents.forEach(document => {
      if (!isReplicatedDocumentRepresentation(document)) {
        return false
      }
    });
    const direction: ReplicationDirection | undefined = (<any>ReplicationDirection)[object.direction];
    return (direction != undefined)
  } catch (e) {
    console.warn("Invalid DocumentReplicationRepresentation", e)
    return false
  }
}
