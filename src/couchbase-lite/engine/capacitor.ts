import { MutableDocument } from '../mutable-document';
import { ConcurrencyControl, Database } from '../database';
import { ICouchbaseLitePlugin } from '../definitions';
import { DatabaseConfiguration } from '../database-configuration';
import { ResultSet } from '../result-set';
import { Result } from '../result';
import { Query } from '../query';
import { Document } from '../document';
import { ReplicatorConfiguration } from '../replicator-configuration';
import { AbstractIndex } from '../abstract-index';
import { ReplicatorStatus } from '../replicator';
import { Blob } from '../blob';
import { DatabaseFileLoggingConfiguration } from '../database-logging';

import { IonicCouchbaseLite } from '../../index';
import { DatabaseSaveArgs } from '../../definitions';
import { PluginListenerHandle } from '@capacitor/core';

export interface EngineDatabaseSaveResult {
  _id: string;
}

export interface EngineReplicatorStartResult {
  replicatorId: string;
}

export class CapacitorEngine {
  constructor(config: any = {}) {
    this.Plugin_Configure(config);
  }

  async Plugin_Configure(config: any): Promise<void> {
    return IonicCouchbaseLite.pluginConfigure({
      config,
    });
  }

  async Database_Open(
    name: string,
    config: DatabaseConfiguration,
  ): Promise<void> {
    return IonicCouchbaseLite.databaseOpen({
      name,
      config,
    });
  }

  async Database_Save(
    database: Database,
    document: MutableDocument,
    concurrencyControl: ConcurrencyControl,
  ): Promise<EngineDatabaseSaveResult> {
    var args: DatabaseSaveArgs = {
      name: database.getName(),
      id: document.getId(),
      document: document.toDictionary(),
    };
    if (concurrencyControl) {
      args['concurrencyControl'] = concurrencyControl;
    }
    return IonicCouchbaseLite.databaseSave(args);
  }

  Database_AddChangeListener(
    database: Database,
    cb: (data: any, err: any) => void,
  ): Promise<PluginListenerHandle> {
    //this\.log('Database_AddChangeListener', database.getName());
    return IonicCouchbaseLite.databaseAddChangeListener(
      {
        name: database.getName(),
      },
      cb,
    );
  }

  async Database_GetCount(database: Database): Promise<{ count: number }> {
    //this\.log('Database_GetCount');
    return IonicCouchbaseLite.databaseGetCount({
      name: database.getName(),
    });
  }

  async Database_GetPath(database: Database): Promise<{ path: string }> {
    //this\.log('Database_GetPath');
    return IonicCouchbaseLite.databaseGetPath({
      name: database.getName(),
    });
  }

  async Database_Copy(
    database: Database,
    path: string,
    name: string,
    config: DatabaseConfiguration,
  ): Promise<void> {
    //this\.log('Database_Copy');
    return IonicCouchbaseLite.databaseCopy({
      name: database.getName(),
      path,
      newName: name,
      config,
    });
  }

  async Database_CreateIndex(
    database: Database,
    name: string,
    index: AbstractIndex,
  ): Promise<void> {
    //this\.log('Database_CreateIndex');
    return IonicCouchbaseLite.databaseCreateIndex({
      name: database.getName(),
      indexName: name,
      index: index.toJson(),
    });
  }

  async Database_DeleteIndex(database: Database, name: string): Promise<void> {
    //this\.log('Database_DeleteIndex');
    return IonicCouchbaseLite.databaseDeleteIndex({
      name: database.getName(),
      indexName: name,
    });
  }

  async Database_GetIndexes(
    database: Database,
  ): Promise<{ indexes: string[] }> {
    //this\.log('Database_GetIndexes');
    return IonicCouchbaseLite.databaseGetIndexes({
      name: database.getName(),
    });
  }

  async Database_Exists(
    database: Database,
    name: string,
    directory: string,
  ): Promise<{ exists: boolean }> {
    //this\.log('Database_Exists');
    return IonicCouchbaseLite.databaseExists({
      name: database.getName(),
      existsName: name,
      directory,
    });
  }

  async Database_Close(database: Database): Promise<void> {
    //this\.log('Database_Close');
    return IonicCouchbaseLite.databaseClose({
      name: database.getName(),
    });
  }

  async Database_Compact(database: Database): Promise<void> {
    //this\.log('Database_Compact');
    return IonicCouchbaseLite.databaseCompact({
      name: database.getName(),
    });
  }

  async Database_Delete(database: Database): Promise<void> {
    //this\.log('Database_Delete');
    return IonicCouchbaseLite.databaseDelete({
      name: database.getName(),
    });
  }

  async Database_PurgeDocument(
    database: Database,
    document: Document | string,
  ): Promise<void> {
    const docId = typeof document === 'string' ? document : document.getId();
    return IonicCouchbaseLite.databasePurgeDocument({
      name: database.getName(),
      docId,
    });
  }

  async Database_DeleteDocument(
    database: Database,
    document: Document,
    concurrencyControl: ConcurrencyControl,
  ): Promise<void> {
    //this\.log('Database_DeleteDocument', document.getId());
    return IonicCouchbaseLite.databaseDeleteDocument({
      name: database.getName(),
      docId: document.getId(),
      document: document.toDictionary(),
      concurrencyControl,
    });
  }

  async Database_GetDocument(
    database: Database,
    documentId: string,
  ): Promise<{ document: Document }> {
    //this\.log('Database_GetDocument', documentId);
    return IonicCouchbaseLite.databaseGetDocument({
      name: database.getName(),
      docId: documentId,
    });
  }

  async Database_SetLogLevel(
    database: Database,
    domain: string,
    logLevel: number,
  ): Promise<void> {
    //this\.log('Database_SetLogLevel', domain, logLevel);
    return IonicCouchbaseLite.databaseSetLogLevel({
      name: database.getName(),
      domain,
      logLevel,
    });
  }

  async Database_SetFileLoggingConfig(
    database: Database,
    config: DatabaseFileLoggingConfiguration,
  ): Promise<void> {
    return IonicCouchbaseLite.databaseSetFileLoggingConfig({
      name: database.getName(),
      config,
    });
  }

  async Document_GetBlobContent(
    database: Database,
    documentId: string,
    key: string,
  ): Promise<ArrayBuffer> {
    const data = await IonicCouchbaseLite.databaseGetBlobContent({
      name: database.getName(),
      documentId,
      key,
    });
    return new Uint8Array(data.data).buffer;
  }

  async Query_Execute(database: Database, query: Query): Promise<ResultSet> {
    //this\.log('Query_Execute', JSON.stringify(query.toJson()));
    const ret = await IonicCouchbaseLite.queryExecute({
      name: database.getName(),
      query: query.toJson(),
    });
    return new ResultSet(query, ret.id, query.getColumnNames());
  }

  async ResultSet_Next(
    database: Database,
    resultSetId: string,
  ): Promise<Result> {
    //this\.log('ResultSet_Next');
    return IonicCouchbaseLite.resultSetNext({
      name: database.getName(),
      resultSetId,
    });
  }

  async ResultSet_NextBatch(
    database: Database,
    resultSetId: string,
  ): Promise<{ results: Result[] }> {
    //this\.log('ResultSet_Next');
    return IonicCouchbaseLite.resultSetNextBatch({
      name: database.getName(),
      resultSetId,
    });
  }

  /*
  async ResultSet_AllResults(database: Database, resultSetId: string): Promise<Result[]> {
    //this\.log('ResultSet_AllResults');
    const args: any[] = [database.getName(), resultSetId];
    return IonicCouchbaseLite.exec(EngineActionTypes.ResultSet_AllResults, args);
  }
  */

  ResultSet_AllResults(
    database: Database,
    resultSetId: string,
    cb: (data: any, err: any) => void,
  ): Promise<PluginListenerHandle> {
    return IonicCouchbaseLite.resultSetAllResults(
      {
        name: database.getName(),
        resultSetId,
      },
      cb,
    );
  }

  async ResultSet_Cleanup(
    database: Database,
    resultSetId: string,
  ): Promise<void> {
    //this\.log('ResultSet_Cleanup');
    return IonicCouchbaseLite.resultSetCleanup({
      name: database.getName(),
      resultSetId,
    });
  }

  async Replicator_Create(
    database: Database,
    config: ReplicatorConfiguration,
  ): Promise<EngineReplicatorStartResult> {
    return IonicCouchbaseLite.replicatorCreate({
      name: database.getName(),
      config: config.toJson(),
    });
  }

  async Replicator_Start(replicatorId: string): Promise<void> {
    //this\.log('Replicator_Start');
    return IonicCouchbaseLite.replicatorStart({
      replicatorId,
    });
  }

  async Replicator_Restart(replicatorId: string): Promise<void> {
    return IonicCouchbaseLite.replicatorRestart({
      replicatorId,
    });
  }

  Replicator_AddChangeListener(
    replicatorId: string,
    cb: (data: any, err: any) => void,
  ): Promise<PluginListenerHandle> {
    //this\.log('Replicator_AddChangeListener');
    return IonicCouchbaseLite.replicatorAddChangeListener(
      {
        replicatorId,
      },
      cb,
    );
  }

  Replicator_AddDocumentListener(
    replicatorId: string,
    cb: (data: any, err: any) => void,
  ): Promise<PluginListenerHandle> {
    //this\.log('Replicator_AddDocumentListener');
    return IonicCouchbaseLite.replicatorAddDocumentListener(
      {
        replicatorId,
      },
      cb,
    );
  }

  async Replicator_Stop(replicatorId: string): Promise<void> {
    //this\.log('Replicator_Stop');
    return IonicCouchbaseLite.replicatorStop({
      replicatorId,
    });
  }

  async Replicator_ResetCheckpoint(replicatorId: string): Promise<void> {
    //this\.log('Replicator_ResetCheckpoint');
    return IonicCouchbaseLite.replicatorResetCheckpoint({
      replicatorId,
    });
  }

  async Replicator_GetStatus(replicatorId: string): Promise<void> {
    //this\.log('Replicator_GetStatus');
    return IonicCouchbaseLite.replicatorGetStatus({
      replicatorId,
    });
  }

  async Replicator_Cleanup(replicatorId: string): Promise<void> {
    //this\.log('Replicator_Stop');
    return IonicCouchbaseLite.replicatorCleanup({
      replicatorId,
    });
  }
}
