import { MutableDocument } from '../mutable-document';
import { ConcurrencyControl, Database } from '../database';
import { DatabaseConfiguration } from '../database-configuration';
import { ResultSet } from '../result-set';
import { Result } from '../result';
import { Query } from '../query';
import { Document } from '../document';
import { ReplicatorConfiguration } from '../replicator-configuration';
import { Dictionary } from '../definitions';
import { AbstractIndex } from '../abstract-index';
import { ReplicatorStatus } from '../replicator';
import { DatabaseFileLoggingConfiguration } from '../database-logging';

export interface EngineDatabaseSaveResult {
  _id: string;
}

export interface EngineReplicatorStartResult {
  replicatorId: string;
}

export enum EngineActionTypes {
  Database_Open = 'Database_Open',
  Database_Save = 'Database_Save',
  Database_Close = 'Database_Close',
  Database_Compact = 'Database_Compact',
  Database_Delete = 'Database_Delete',
  Database_AddChangeListener = 'Database_AddChangeListener',
  Database_RemoveChangeListener = 'Database_RemoveChangeListener',
  Database_GetCount = 'Database_GetCount',
  Database_GetPath = 'Database_GetPath',
  Database_Copy = 'Database_Copy',
  Database_CreateIndex = 'Database_CreateIndex',
  Database_DeleteIndex = 'Database_DeleteIndex',
  Database_GetIndexes = 'Database_GetIndexes',
  Database_Exists = 'Database_Exists',
  Database_PurgeDocument = 'Database_PurgeDocument',
  Database_DeleteDocument = 'Database_DeleteDocument',
  Database_GetDocument = 'Database_GetDocument',
  Database_SetLogLevel = 'Database_SetLogLevel',
  Database_SetFileLoggingConfig = 'Database_SetFileLoggingConfig',
  Document_GetBlobContent = 'Document_GetBlobContent',
  Query_Execute = 'Query_Execute',
  Query_ExecuteWithListener = 'Query_ExecuteWithListener',
  ResultSet_Next = 'ResultSet_Next',
  ResultSet_NextBatch = 'ResultSet_NextBatch',
  ResultSet_AllResults = 'ResultSet_AllResults',
  ResultSet_Cleanup = 'ResultSet_Cleanup',
  Replicator_Start = 'Replicator_Start',
  Replicator_Stop = 'Replicator_Stop',
  Replicator_ResetCheckpoint = 'Replicator_ResetCheckpoint',
  Replicator_AddChangeListener = 'Replicator_AddChangeListener',
  Replicator_GetStatus = 'Replicator_GetStatus',
  Replicator_Cleanup = 'Replicator_Cleanup',
  Replicator_Restart = 'Replicator_Restart'
}

export abstract class Engine {
  static readonly ActionType = EngineActionTypes;

  // Database operations
  abstract async Plugin_Configure(config: any): Promise<void>;
  abstract async Database_Open(name: string, config: DatabaseConfiguration): Promise<void>;
  abstract async Database_Save(database: Database, document: MutableDocument, concurrencyControl: ConcurrencyControl): Promise<EngineDatabaseSaveResult>;
  abstract Database_AddChangeListener(database: Database, cb: (data: any) => void, err: (err: any) => void): void;
  abstract async Database_RemoveChangeListener(database: Database): Promise<void>;
  abstract async Database_GetCount(database: Database): Promise<number>;
  abstract async Database_GetPath(database: Database): Promise<string>;
  abstract async Database_Copy(database: Database, path: string, name: string, config: DatabaseConfiguration): Promise<void>;
  abstract async Database_CreateIndex(database: Database, name: string, index: AbstractIndex): Promise<void>;
  abstract async Database_DeleteIndex(database: Database, name: string): Promise<void>;
  abstract async Database_GetIndexes(database: Database): Promise<string[]>;
  abstract async Database_Exists(database: Database, name: string, directory: string): Promise<boolean>;
  abstract async Database_Close(database: Database): Promise<void>;
  abstract async Database_Compact(database: Database): Promise<void>;
  abstract async Database_Delete(database: Database): Promise<void>;
  abstract async Database_PurgeDocument(database: Database, document: Document): Promise<void>;
  abstract async Database_DeleteDocument(database: Database, document: Document, concurrencyControl: ConcurrencyControl): Promise<void>;
  abstract async Database_GetDocument(database: Database, documentId: string): Promise<Dictionary>;
  abstract async Database_SetLogLevel(database: Database, domain: string, logLevel: number): Promise<void>;
  abstract async Database_SetFileLoggingConfig(database: Database, config: DatabaseFileLoggingConfiguration): Promise<void>;
  abstract async Document_GetBlobContent(database: Database, documentId: string, key: string): Promise<ArrayBuffer>;
  abstract async Query_Execute(database: Database, query: Query): Promise<ResultSet>;
  abstract async Query_ExecuteWithListener(database: Database, query: Query, cb: (data: any) => any, err: (err: any) => void): Promise<void>;
  abstract async ResultSet_Next(database: Database, resultSetId: string): Promise<Result>;
  // abstract ResultSet_AllResults(database: Database, resultSetId: string): Promise<Result[]>;
  abstract ResultSet_AllResults(database: Database, resultSetId: string, cb: (data: any[]) => void, err: (err: any) => void): void;
  abstract async ResultSet_NextBatch(database: Database, resultSetId: string): Promise<Result[]>;
  abstract async ResultSet_Cleanup(database: Database, resultSetId: string): Promise<void>;
  abstract async Replicator_Start(database: Database, replicatorConfiguration: ReplicatorConfiguration): Promise<EngineReplicatorStartResult>;
  abstract async Replicator_Stop(replicatorId: string): Promise<void>;
  abstract async Replicator_ResetCheckpoint(replicatorId: string): Promise<void>;
  abstract async Replicator_GetStatus(replicatorId: string): Promise<ReplicatorStatus>;
  abstract async Replicator_Cleanup(replicatorId: string): Promise<void>;
  abstract async Replicator_Restart(replicatorId: string): Promise<void>;
  abstract Replicator_AddChangeListener(replicatorId: string, cb: (data: any) => void, err: (err: any) => void): void;
}
