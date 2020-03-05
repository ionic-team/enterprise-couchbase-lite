import { Engine, EngineDatabaseSaveResult, EngineReplicatorStartResult, EngineActionTypes } from "./index";
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

declare var IonicCouchbaseLite: ICouchbaseLitePlugin;

export class CordovaEngine extends Engine {
  constructor(config: any = {}) {
    super();
    this.Plugin_Configure(config);
  }

  log(...args: any[]) {
    // console.log('[cordova]', args.join(' '));
  }
  
  async Plugin_Configure(config: any): Promise<void> {
    const args: any[] = [config];
    return IonicCouchbaseLite.exec('Plugin_Configure', args);
  }

  async Database_Open(name: string, config: DatabaseConfiguration): Promise<void> {
    // //this\.log('Database_Open', name);
    const args: any[] = [name];
    config && args.push(config);
    return IonicCouchbaseLite.exec('Database_Open', args);
  }

  async Database_Save(database: Database, document: MutableDocument, concurrencyControl: ConcurrencyControl): Promise<EngineDatabaseSaveResult> {
    // //this\.log('Database_Save', document.getId());
    const args: any[] = [database.getName(), document.getId(), document.toDictionary()];
    concurrencyControl && args.push(concurrencyControl);
    return IonicCouchbaseLite.exec('Database_Save', args);
  }

  Database_AddChangeListener(database: Database, cb: (data: any) => void, err: (err: any) => void): void {
    //this\.log('Database_AddChangeListener', database.getName());
    const args: any[] = [database.getName()];
    return IonicCouchbaseLite.watch(EngineActionTypes.Database_AddChangeListener, args, cb, err);
  }

  async Database_RemoveChangeListener(database: Database): Promise<void> {
    const args: any[] = [database.getName()];
    return IonicCouchbaseLite.exec(EngineActionTypes.Database_RemoveChangeListener, args) as any;
  }

  async Database_GetCount(database: Database): Promise<number> {
    //this\.log('Database_GetCount');
    const args: any[] = [database.getName()];
    return IonicCouchbaseLite.exec(EngineActionTypes.Database_GetCount, args) as any;
  }

  async Database_GetPath(database: Database): Promise<string> {
    //this\.log('Database_GetPath');
    const args: any[] = [database.getName()];
    return IonicCouchbaseLite.exec(EngineActionTypes.Database_GetPath, args) as any;
  }

  async Database_Copy(database: Database, path: string, name: string, config: DatabaseConfiguration): Promise<void> {
    //this\.log('Database_Copy');
    const args: any[] = [database.getName(), path, name, config];
    return IonicCouchbaseLite.exec(EngineActionTypes.Database_Copy, args) as any;
  }

  async Database_CreateIndex(database: Database, name: string, index: AbstractIndex): Promise<void> {
    //this\.log('Database_CreateIndex');
    const args: any[] = [database.getName(), name, index.toJson()];
    return IonicCouchbaseLite.exec(EngineActionTypes.Database_CreateIndex, args) as any;
  }

  async Database_DeleteIndex(database: Database, name: string): Promise<void> {
    //this\.log('Database_DeleteIndex');
    const args: any[] = [database.getName(), name];
    return IonicCouchbaseLite.exec(EngineActionTypes.Database_DeleteIndex, args) as any;
  }

  async Database_GetIndexes(database: Database): Promise<string[]> {
    //this\.log('Database_GetIndexes');
    const args: any[] = [database.getName()];
    return IonicCouchbaseLite.exec(EngineActionTypes.Database_GetIndexes, args) as any;
  }

  async Database_Exists(database: Database, name: string, directory: string): Promise<boolean> {
    //this\.log('Database_Exists');
    const args: any[] = [database.getName(), name, directory];
    return IonicCouchbaseLite.exec(EngineActionTypes.Database_Exists, args) as any;
  }

  async Database_Close(database: Database): Promise<void> {
    //this\.log('Database_Close');
    const args: any[] = [database.getName()];
    return IonicCouchbaseLite.exec(EngineActionTypes.Database_Close, args) as any;
  }

  async Database_Compact(database: Database): Promise<void> {
    //this\.log('Database_Compact');
    const args: any[] = [database.getName()];
    return IonicCouchbaseLite.exec(EngineActionTypes.Database_Compact, args) as any;
  }

  async Database_Delete(database: Database): Promise<void> {
    //this\.log('Database_Delete');
    const args: any[] = [database.getName()];
    return IonicCouchbaseLite.exec(EngineActionTypes.Database_Delete, args) as any;
  }

  async Database_PurgeDocument(database: Database, document: Document): Promise<void> {
    //this\.log('Database_PurgeDocument', document.getId());
    const args: any[] = [database.getName(), document.getId(), document.toDictionary()];
    return IonicCouchbaseLite.exec(EngineActionTypes.Database_PurgeDocument, args);
  }

  async Database_DeleteDocument(database: Database, document: Document): Promise<void> {
    //this\.log('Database_DeleteDocument', document.getId());
    const args: any[] = [database.getName(), document.getId(), document.toDictionary()];
    return IonicCouchbaseLite.exec(EngineActionTypes.Database_DeleteDocument, args);
  }

  async Database_GetDocument(database: Database, documentId: string): Promise<Document> {
    //this\.log('Database_GetDocument', documentId);
    const args: any[] = [database.getName(), documentId];
    return IonicCouchbaseLite.exec(EngineActionTypes.Database_GetDocument, args);
  }

  async Database_SetLogLevel(database: Database, domain: string, logLevel: number): Promise<void> {
    //this\.log('Database_SetLogLevel', domain, logLevel);
    const args: any[] = [database.getName(), domain, logLevel];
    return IonicCouchbaseLite.exec(EngineActionTypes.Database_SetLogLevel, args);
  }

  async Database_SetFileLoggingConfig(database: Database, config: DatabaseFileLoggingConfiguration): Promise<void> {
    const args: any[] = [database.getName(), config];
    return IonicCouchbaseLite.exec(EngineActionTypes.Database_SetFileLoggingConfig, args);
  }

  async Document_GetBlobContent(database: Database, documentId: string, key: string): Promise<ArrayBuffer> {
    const args: any[] = [database.getName(), documentId, key];
    const data = await IonicCouchbaseLite.exec(EngineActionTypes.Document_GetBlobContent, args);
    return new Uint8Array(data).buffer;
  }

  async Query_Execute(database: Database, query: Query): Promise<ResultSet> {
    //this\.log('Query_Execute', JSON.stringify(query.toJson()));
    const args: any[] = [database.getName(), JSON.stringify(query.toJson())];
    const ret = await IonicCouchbaseLite.exec(EngineActionTypes.Query_Execute, args) as any;
    return new ResultSet(query, ret.id, query.getColumnNames());
  }

  async ResultSet_Next(database: Database, resultSetId: string): Promise<Result> {
    //this\.log('ResultSet_Next');
    const args: any[] = [database.getName(), resultSetId];
    return IonicCouchbaseLite.exec(EngineActionTypes.ResultSet_Next, args);
  }

  async ResultSet_NextBatch(database: Database, resultSetId: string): Promise<Result[]> {
    //this\.log('ResultSet_Next');
    const args: any[] = [database.getName(), resultSetId];
    return IonicCouchbaseLite.exec(EngineActionTypes.ResultSet_NextBatch, args);
  }

  /*
  async ResultSet_AllResults(database: Database, resultSetId: string): Promise<Result[]> {
    //this\.log('ResultSet_AllResults');
    const args: any[] = [database.getName(), resultSetId];
    return IonicCouchbaseLite.exec(EngineActionTypes.ResultSet_AllResults, args);
  }
  */

  ResultSet_AllResults(database: Database, resultSetId: string, cb: (data: any) => void, err: (err: any) => void): void {
    const args: any[] = [database.getName(), resultSetId];
    return IonicCouchbaseLite.watch(EngineActionTypes.ResultSet_AllResults, args, cb, err);
  }

  async ResultSet_Cleanup(database: Database, resultSetId: string): Promise<void> {
    //this\.log('ResultSet_Cleanup');
    const args: any[] = [database.getName(), resultSetId];
    return IonicCouchbaseLite.exec(EngineActionTypes.ResultSet_Cleanup, args);
  }

  async Replicator_Start(database: Database, config: ReplicatorConfiguration): Promise<EngineReplicatorStartResult> {
    //this\.log('Replicator_Start');
    const args: any[] = [database.getName(), config.toJson()];
    return IonicCouchbaseLite.exec(EngineActionTypes.Replicator_Start, args);
  }

  async Replicator_Restart(replicatorId: string): Promise<void> {
    const args: any[] = [replicatorId];
    return IonicCouchbaseLite.exec(EngineActionTypes.Replicator_Restart, args);
  }

  Replicator_AddChangeListener(replicatorId: string, cb: (data: any) => void, err: (err: any) => void): void {
    //this\.log('Replicator_AddChangeListener');
    const args: any[] = [replicatorId];
    return IonicCouchbaseLite.watch(EngineActionTypes.Replicator_AddChangeListener, args, cb, err);
  }

  async Replicator_Stop(replicatorId: string): Promise<void> {
    //this\.log('Replicator_Stop');
    const args: any[] = [replicatorId];
    return IonicCouchbaseLite.exec(EngineActionTypes.Replicator_Stop, args);
  }

  async Replicator_ResetCheckpoint(replicatorId: string): Promise<void> {
    //this\.log('Replicator_ResetCheckpoint');
    const args: any[] = [replicatorId];
    return IonicCouchbaseLite.exec(EngineActionTypes.Replicator_ResetCheckpoint, args);
  }

  async Replicator_GetStatus(replicatorId: string): Promise<ReplicatorStatus> {
    //this\.log('Replicator_GetStatus');
    const args: any[] = [replicatorId];
    return IonicCouchbaseLite.exec(EngineActionTypes.Replicator_GetStatus, args);
  }

  async Replicator_Cleanup(replicatorId: string): Promise<void> {
    //this\.log('Replicator_Stop');
    const args: any[] = [replicatorId];
    return IonicCouchbaseLite.exec(EngineActionTypes.Replicator_Cleanup, args);
  }
}
