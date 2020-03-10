import { ListenerToken } from './definitions';
import { Document } from './document';
import { MutableDocument } from './mutable-document';
import { DatabaseConfiguration } from './database-configuration'
import { DatabaseLogging } from './database-logging';

import { CordovaEngine } from './engine/cordova';
import { Engine } from './engine';
import { Index, AbstractIndex } from './abstract-index';

export interface File {
}

export enum ConcurrencyControl {
  LAST_WRITE_WINS = 0,
  FAIL_ON_CONFLICT = 1
}

export interface DatabaseChange {
  documentIDs: string[];
}

export interface DocumentChange {
  documentID: string;
}

export type DatabaseChangeListener = (change: DatabaseChange) => void;
export type DocumentChangeListener = (change: DocumentChange) => void;

export enum LogDomain {
  ALL = "ALL",
  DATABASE = "DATABASE",
  NETWORK = "NETWORK",
  QUERY = "QUERY",
  REPLICATOR = "REPLICATOR"
}

export enum LogLevel {
  DEBUG = 0,
  VERBOSE = 1,
  INFO = 2,
  WARNING = 3,
  ERROR = 4,
  NONE = 5
}

/**
 * A Couchbase Lite database.
 */
export class Database {
  _documents: { [id:string]: Document } = {};

  private changeListenerTokens: DatabaseChangeListener[] = [];

  private _engine: Engine;

  private listeningForChanges = false;

  public log = new DatabaseLogging(this);

  constructor(private name: string, private config: DatabaseConfiguration = null) {
  }

  setEngine(engine: Engine) {
    this._engine = engine;
  }

  getEngine() {
    return this._engine;
  }

  open() {
    return this._engine.Database_Open(this.name, this.config);
  }

  /**
   * Set the given DatabaseChangeListener to the this database.
   */
  addChangeListener(listener: DatabaseChangeListener): ListenerToken {
    this.changeListenerTokens.push(listener);

    if (!this.listeningForChanges) {
      this._engine.Database_AddChangeListener(this, (data: any) => {
        this.notifyDatabaseChangeListeners(data);
      }, (err: any) => {
        console.error('Database change listener error', err);
      });
      this.listeningForChanges = true;
    }

    return listener;
  }

  private notifyDatabaseChangeListeners(data: any) {
    this.changeListenerTokens.forEach(l => l(data));
  }

  /**
   * Add the given DocumentChangeListener to the specified document.
   */
  addDocumentChangeListener(id: string, listener: DocumentChangeListener): Promise<ListenerToken> {
    id; listener;
    return null;
  }

  /**
   * Remove the given DatabaseChangeListener from the this database.
   */
  async removeChangeListener(listener: ListenerToken): Promise<void> {
    this.changeListenerTokens = this.changeListenerTokens.filter(l => l !== listener);

    if (this.changeListenerTokens.length === 0) {
      await this._engine.Database_RemoveChangeListener(this);
      this.listeningForChanges = false;
    }
  }

  /**
   * Closes a database.
   */
  close() {
    return this._engine.Database_Close(this);
  }

  /**
   * Compacts the database file by deleting unused attachment files and vacuuming the SQLite database
   */
  compact(): Promise<void> {
    return this._engine.Database_Compact(this);
  }

  /**
   * 
   */
  copy(path: string, name: string, config: DatabaseConfiguration): Promise<void> {
    path; name; config;
    return this._engine.Database_Copy(this, path, name, config);
  }

  /**
   *
   */
  createIndex(name: string, index: AbstractIndex): Promise<void> {
    name; index;
    return this._engine.Database_CreateIndex(this, name, index);
  } 
 
  /**
   * Deletes a document from the database.
   */
  deleteDocument(document: Document, concurrencyControl: ConcurrencyControl = null): Promise<void> {
    return this._engine.Database_DeleteDocument(this, document, concurrencyControl);
  }

  /**
   * Purges the given document from the database.
   */
  purgeDocument(document: Document) {
    return this._engine.Database_PurgeDocument(this, document);
  }

  /**
   * Deletes a database.
   */
  deleteDatabase() {//name: string = null, directory: File = null): Promise<void> {
    return this._engine.Database_Delete(this);
  }

  /**
   * Deletes an index
   */
  deleteIndex(name: string): Promise<void> {
    return this._engine.Database_DeleteIndex(this, name);
  }

  /**
   * Checks whether a database of the given name exists in the given directory or not.
   */
  exists(name: string, directory: string): Promise<boolean> {
    return this._engine.Database_Exists(this, name, directory);
  }

  /**
   * Returns a READONLY config object which will throw a runtime exception when any setter methods are called.
   */
  getConfig(): DatabaseConfiguration {
    return this.config;
  }

  /**
   * The number of documents in the database.
   */
  async getCount(): Promise<number> {
    const count = await this._engine.Database_GetCount(this);
    return Promise.resolve(count);
  }

  /**
   * Gets an existing Document object with the given ID.
   */
  async getDocument(id: string): Promise<Document> {
    const docJson = await this._engine.Database_GetDocument(this, id);
    if (docJson) {
      const data = docJson['_data'];
      const sequence = docJson['_sequence'];
      const retId = docJson['_id'];
      return Promise.resolve(new Document(retId, sequence, data));
    } else {
      return Promise.resolve(null);
    }
  }

  /**
   * Return the indexes in the database
   */
  getIndexes(): Promise<string[]> {
    return this._engine.Database_GetIndexes(this);
  }

  /**
   * Return the database name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Return the database's path.
   */
  getPath(): Promise<string> {
    return this._engine.Database_GetPath(this);
  }

  /**
   * Runs a group of database operations in a batch.
   */
  inBatch(fn: () => void): Promise<void> {
    fn;
    return Promise.reject(null);
  }

  /**
   * Saves a document to the database
   */
  async save(document: MutableDocument, concurrencyControl: ConcurrencyControl = null): Promise<void> {
    const ret = await this._engine.Database_Save(this, document, concurrencyControl);

    const id = ret._id;
    document.setId(id);
    this._documents[id] = document;
  }

  /**
   * Set log level for the given log domain.
   */
  setLogLevel(domain: LogDomain, level: LogLevel): Promise<void> {
    return this._engine.Database_SetLogLevel(this, domain, level);
  }
}
