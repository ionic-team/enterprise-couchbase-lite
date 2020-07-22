import { ReplicatorConfiguration } from "./replicator-configuration";
import { ReplicatorChange } from "./replicator-change";
import { CouchbaseLiteException } from "./couchbase-lite-exception";
import { ReplicatedDocument, ReplicatedDocumentFlag } from './replicated-document';
import { DocumentReplication, ReplicationDirection } from './document-replication';
import { Dictionary } from './definitions'

import { v4 } from './util/uuid';

export enum ReplicatorActivityLevel {
  STOPPED = 0,
  OFFLINE = 1,
  CONNECTING = 2,
  IDLE = 3,
  BUSY = 4
}

export class Replicator {
  readonly ActivityLevel = ReplicatorActivityLevel;

  private replicatorId: string = null;

  private status: ReplicatorStatus;

  private changeListenerTokens: ReplicatorChangeListener[] = [];

  private documentListenerTokens: ReplicatorDocumentListener[] = [];

  private didStartChangeListener = false;

  private didStartDocumentListener = false;

  /**
   * Initializes a replicator with the given configuration.
   *
   * @param config
   */
  constructor(private config: ReplicatorConfiguration) {
    this.replicatorId = v4();
  }

  setId(replicatorId: string) {
    this.replicatorId = replicatorId;
  }

  async start(): Promise<void> {
    const db = this.config.getDatabase();

    if (
      this.replicatorId != null &&
      this.didStartChangeListener &&
      this.didStartDocumentListener
    ) {
      await db.getEngine().Replicator_Restart(this.replicatorId);
      return;
    }

    const ret = await db.getEngine().Replicator_Start(db, this.config);
    this.replicatorId = ret.replicatorId;

    if (!this.didStartChangeListener) {
      db.getEngine().Replicator_AddChangeListener(
        this.replicatorId,
        (data: any) => {
          this.status = new ReplicatorStatus(
            data.activityLevel,
            data.progress,
            data.error
          );
          this.notifyChangeListeners(data);
        },
        (err: any) => {
          console.warn("Replicator ERROR ", err);
        }
      );
      this.didStartChangeListener = true;
    }

    if (!this.didStartDocumentListener) {
      db.getEngine().Replicator_AddDocumentListener(
        this.replicatorId,
        (data: any) => {
          this.notifyDocumentListeners(data);
        },
        (err: any) => {
          console.warn("Replicator ERROR ", err);
        }
      );
      this.didStartDocumentListener = true;
    }
  }

  private notifyChangeListeners(data: any) {
    this.changeListenerTokens.forEach((l) => l(data));
  }

  private notifyDocumentListeners(data: Dictionary) {
    const documentList = data["documents"];
    var documents: ReplicatedDocument[] = []
    for (const document of documentList["documents"] as [Dictionary]) {
      var flags: ReplicatedDocumentFlag[] = []
      for (const flag of document["flags"] as string[]) {
        if (flag == "DELETED") {
          flags.push(ReplicatedDocumentFlag.DELETED)
        }
        else if (flag == "ACCESS_REMOVED") {
          flags.push(ReplicatedDocumentFlag.DELETED)
        }
      }
      documents.push(new ReplicatedDocument(document["id"], flags, document["error"]));
    }
    const event = new DocumentReplication((data["direction"] == "PUSH") ? ReplicationDirection.PUSH : ReplicationDirection.PULL, documents);

    this.documentListenerTokens.forEach((l) => l(event));
  }

  async cleanup() {
    this.changeListenerTokens = [];

    const db = this.config.getDatabase();
    await db.getEngine().Replicator_Cleanup(this.replicatorId);
    this.replicatorId = null;
  }

  stop() {
    const db = this.config.getDatabase();
    return db.getEngine().Replicator_Stop(this.replicatorId);
  }

  resetCheckpoint() {
    const db = this.config.getDatabase();
    return db.getEngine().Replicator_ResetCheckpoint(this.replicatorId);
  }

  getStatus() {
    const db = this.config.getDatabase();
    return db.getEngine().Replicator_GetStatus(this.replicatorId);
  }

  addChangeListener(listener: ReplicatorChangeListener) {
    this.changeListenerTokens.push(listener);
  }

  removeChangeListener(listener: ReplicatorChangeListener) {
    this.changeListenerTokens = this.changeListenerTokens.filter(
      (l) => l !== listener
    );
  }

  addDocumentListener(listener: ReplicatorDocumentListener) {
    this.documentListenerTokens.push(listener);
  }

  removeDocumentListener(listener: ReplicatorDocumentListener) {
    this.documentListenerTokens = this.documentListenerTokens.filter(
      (l) => l !== listener
    );
  }
}

export type ReplicatorChangeListener = (change: ReplicatorChange) => void;
export type ReplicatorDocumentListener = (doc: DocumentReplication) => void;

export class ReplicatorProgress {
  constructor(private completed: number, private total: number) {
  }

  getCompleted() {
    return this.completed;
  }

  getTotal() {
    return this.total;
  }

  toString() {
    return `Progress{completed=${this.completed}, total=${this.total}}`;
  }

  copy() {
    return new ReplicatorProgress(this.completed, this.total);
  }
}

export class ReplicatorStatus {
  constructor(private activityLevel: ReplicatorActivityLevel, private progress: ReplicatorProgress, private error: CouchbaseLiteException) {
  }

  getActivityLevel() {
    return this.activityLevel;
  }

  getProgress() {
    return this.progress;
  }

  getError() {
    return this.error;
  }

  toString() {
    return `Status{activityLevel=${this.activityLevel}, progress=${this.progress}, error=${this.error}}`;
  }

  copy() {
    return new ReplicatorStatus(this.activityLevel, this.progress, this.error);
  }
}
