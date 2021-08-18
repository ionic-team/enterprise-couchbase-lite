import { PluginCallback, PluginListenerHandle } from '@capacitor/core';
import {
  AbstractIndex,
  ConcurrencyControl,
  DatabaseConfiguration,
  Dictionary,
  Document,
  ReplicatorConfiguration,
  Result,
} from './couchbase-lite';
import { DatabaseFileLoggingConfiguration } from './couchbase-lite/database-logging';

export interface PluginConfigureArgs {
  config: any;
}

export interface DatabaseArgs {
  name: string;
}

export interface DatabaseOpenArgs extends DatabaseArgs {
  config: DatabaseConfiguration;
}

export interface DatabaseSaveArgs extends DatabaseArgs {
  id: string;
  document: Dictionary;
}

export interface DatabaseCopyArgs extends DatabaseArgs {
  path: string;
  newName: string;
  config: DatabaseConfiguration;
}

export interface DatabaseCreateIndexArgs extends DatabaseArgs {
  indexName: string;
  index: any;
}

export interface DatabaseDeleteIndex extends DatabaseArgs {
  indexName: string;
}

export interface DatabaseCreateIndexArgs extends DatabaseArgs {
  indexName: string;
  index: any;
}

export interface DatabaseDeleteIndexArgs extends DatabaseArgs {
  indexName: string;
}

export interface DatabaseExistsArgs extends DatabaseArgs {
  existsName: string;
  directory: string;
}

export interface DatabasePurgeDocumentArgs extends DatabaseArgs {
  docId: string;
}

export interface DatabaseDeleteDocumentArgs extends DatabaseArgs {
  docId: string;
  document: Dictionary;
  concurrencyControl: ConcurrencyControl;
}

export interface DatabaseGetDocumentArgs extends DatabaseArgs {
  docId: string;
}

export interface DatabaseSetLogLevelArgs extends DatabaseArgs {
  domain: string;
  logLevel: number;
}

export interface DatabaseSetFileLoggingConfigArgs extends DatabaseArgs {
  config: DatabaseFileLoggingConfiguration;
}

export interface DatabaseGetBlobContentArgs extends DatabaseArgs {
  documentId: string;
  key: string;
}

export interface QueryExecuteArgs extends DatabaseArgs {
  query: any;
}

export interface ResultSetNextArgs extends DatabaseArgs {
  resultSetId: string;
}

export interface ResultSetNextBatchArgs extends DatabaseArgs {
  resultSetId: string;
}

export interface ResultSetAllResultsArgs extends DatabaseArgs {
  resultSetId: string;
}

export interface ResultSetAllResultsArgs extends DatabaseArgs {
  resultSetId: string;
}

export interface ResultSetCleanupArgs extends DatabaseArgs {
  resultSetId: string;
}

export interface ResultSetCleanupArgs extends DatabaseArgs {
  resultSetId: string;
}

export interface ReplicatorCreateArgs extends DatabaseArgs {
  config: any;
}

export interface ReplicatorArgs {
  replicatorId: string;
}

export interface IonicCouchbaseLitePlugin {
  pluginConfigure(args: PluginConfigureArgs): Promise<void>;
  databaseOpen(args: DatabaseOpenArgs): Promise<void>;
  databaseSave(args: DatabaseSaveArgs): Promise<{ _id: string }>;
  databaseGetCount(
    args: DatabaseArgs,
  ): Promise<{
    count: number;
  }>;
  databaseGetPath(args: DatabaseArgs): Promise<{ path: string }>;
  databaseCopy(args: DatabaseCopyArgs): Promise<void>;
  databaseCreateIndex(args: DatabaseCreateIndexArgs): Promise<void>;
  databaseDeleteIndex(args: DatabaseDeleteIndexArgs): Promise<void>;
  databaseGetIndexes(
    args: DatabaseArgs,
  ): Promise<{
    indexes: string[];
  }>;
  databaseExists(args: DatabaseExistsArgs): Promise<{ exists: boolean }>;
  databaseClose(args: DatabaseArgs): Promise<void>;
  databaseCompact(args: DatabaseArgs): Promise<void>;
  databaseDelete(args: DatabaseArgs): Promise<void>;
  databasePurgeDocument(args: DatabasePurgeDocumentArgs): Promise<void>;
  databaseDeleteDocument(args: DatabaseDeleteDocumentArgs): Promise<void>;
  databaseGetDocument(
    args: DatabaseGetDocumentArgs,
  ): Promise<{
    document: Document;
  }>;
  databaseAddChangeListener(
    args: DatabaseArgs,
    cb: PluginCallback,
  ): Promise<PluginListenerHandle>;
  databaseSetLogLevel(args: DatabaseSetLogLevelArgs): Promise<void>;
  databaseSetFileLoggingConfig(
    args: DatabaseSetFileLoggingConfigArgs,
  ): Promise<void>;
  databaseGetBlobContent(
    args: DatabaseGetBlobContentArgs,
  ): Promise<{
    data: any;
  }>;
  queryExecute(
    args: QueryExecuteArgs,
  ): Promise<{
    id: string;
  }>;
  resultSetNext(
    args: ResultSetNextArgs,
  ): Promise<{
    result: Result;
  }>;
  resultSetNextBatch(
    args: ResultSetNextBatchArgs,
  ): Promise<{
    results: Result[];
  }>;
  resultSetAllResults(
    args: ResultSetAllResultsArgs,
    callback: PluginCallback,
  ): Promise<PluginListenerHandle>;
  resultSetCleanup(args: ResultSetCleanupArgs): Promise<void>;
  replicatorCreate(
    args: ReplicatorCreateArgs,
  ): Promise<{ replicatorId: string }>;
  replicatorStart(args: ReplicatorArgs): Promise<void>;
  replicatorRestart(args: ReplicatorArgs): Promise<void>;
  replicatorAddChangeListener(
    args: ReplicatorArgs,
    cb: PluginCallback,
  ): Promise<PluginListenerHandle>;
  replicatorAddDocumentListener(
    args: ReplicatorArgs,
    cb: PluginCallback,
  ): Promise<PluginListenerHandle>;
  replicatorStop(args: ReplicatorArgs): Promise<void>;
  replicatorResetCheckpoint(args: ReplicatorArgs): Promise<void>;
  replicatorGetStatus(args: ReplicatorArgs): Promise<void>;
  replicatorCleanup(args: ReplicatorArgs): Promise<void>;
}
