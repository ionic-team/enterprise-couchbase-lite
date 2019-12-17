import { ReplicatorConfiguration } from "./replicator-configuration";
import { ReplicatorChange } from "./replicator-change";
import { CouchbaseLiteException } from "./couchbase-lite-exception";
import { EngineReplicatorStartResult } from './engine';

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

  private didStartListener = false;

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

    if (this.replicatorId != null && this.didStartListener) {
      await db.getEngine().Replicator_Restart(this.replicatorId);
      return;
    }

    const ret = await db.getEngine().Replicator_Start(db, this.config);
    this.replicatorId = ret.replicatorId;

    if (!this.didStartListener) {
      db.getEngine().Replicator_AddChangeListener(this.replicatorId, (data: any) => {
        this.status = new ReplicatorStatus(data.activityLevel, data.progress, data.error);
        this.notifyListeners(data);
      }, (err: any) => {
        console.warn('Replicator ERROR ', err);
      });
      this.didStartListener = true;
    }
  }

  private notifyListeners(data: any) {
    this.changeListenerTokens.forEach(l => l(data));
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
    this.changeListenerTokens = this.changeListenerTokens.filter(l => l !== listener);
  }
}

export type ReplicatorChangeListener = (change: ReplicatorChange) => void;

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
