//
//  IonicCBL.m
//  demo
//
//  Created by Max Lynch on 11/8/18.
//

#import <objc/runtime.h>
#import <Foundation/Foundation.h>

#import "IonicCBL.h"

@implementation CustomQuery

-(instancetype) initWithJson:(NSString *)json database:(CBLDatabase*)database {
  NSData *jsonData = [json dataUsingEncoding:NSUTF8StringEncoding];
  SEL sel = NSSelectorFromString(@"initWithDatabase:JSONRepresentation:");
  id queryInstance = [CBLQuery alloc];

  Ivar ivar = class_getInstanceVariable(CBLQuery.self, "_from");
  object_setIvar(queryInstance, ivar, [CBLQueryDataSource database:database]);
  
  id (*method)(id, SEL, id, id) = (void *)[queryInstance methodForSelector:sel];
  return method(queryInstance, sel, database, jsonData);
}


@end


@implementation IonicCouchbaseLite {
  NSMutableDictionary<NSString*, CBLDatabase*> *openDatabases;
  NSMutableDictionary<NSString*, CBLQueryResultSet*> *queryResultSets;
  NSMutableDictionary<NSString*, CBLReplicator*> *replicators;
  NSMutableDictionary<NSString*, id> *replicatorChangeListeners;
  NSMutableDictionary<NSString*, id> *replicatorDocumentListeners;
  NSInteger _queryCount;
  NSInteger _replicatorCount;
  NSInteger _allResultsChunkSize;
}

-(void)pluginInitialize {
  openDatabases = [NSMutableDictionary new];
  queryResultSets = [NSMutableDictionary new];
  replicators = [NSMutableDictionary new];
  replicatorChangeListeners = [[NSMutableDictionary alloc] init];
  replicatorDocumentListeners = [[NSMutableDictionary alloc] init];
  _queryCount = 0;
  _replicatorCount = 0;
  _allResultsChunkSize = 256;
}

-(CBLDatabase*)getDatabase:(NSString *)name {
  @synchronized (openDatabases) {
    return [openDatabases objectForKey:name];
  }
}

-(void)resolve:(CDVInvokedUrlCommand*)command {
  CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
  [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
}

-(void)resolve:(CDVInvokedUrlCommand*)command data:(NSDictionary *)data {
  CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:data];
  [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
}

-(void)resolve:(CDVInvokedUrlCommand*)command array:(NSArray *)data {
  CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsArray:data];
  [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
}

-(void)resolve:(CDVInvokedUrlCommand*)command integer:(NSInteger)integer {
  CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsNSInteger:integer];
  [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
}

-(void)resolve:(CDVInvokedUrlCommand*)command boolean:(BOOL)boolean {
  CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsBool:boolean];
  [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
}

-(void)resolve:(CDVInvokedUrlCommand*)command string:(NSString *)string {
  CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:string];
  [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
}

-(void)reject:(CDVInvokedUrlCommand*)command message:(NSString *)message {
  CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:message];
  [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
}

-(BOOL)checkError:(CDVInvokedUrlCommand*)command error:(NSError *)error message:(NSString *)message {
  if (error != NULL) {
    NSString *msg = [message stringByAppendingString:@": "];
    msg = [msg stringByAppendingString:error.localizedDescription];
    [self reject:command message:msg];
    return TRUE;
  }
  return FALSE;
}

-(NSDictionary *)documentToMap:(CBLDocument *)d {
  NSMutableDictionary *docMap = [[NSMutableDictionary alloc] init];
  NSDictionary *documentAsMap = [d toDictionary];
  for(NSString *key in documentAsMap) {
    id value = documentAsMap[key];
    if ([value isKindOfClass:[CBLBlob class]]) {
      CBLBlob *blobEntry = (CBLBlob *)value;
      [docMap setObject:[blobEntry properties] forKey:key];
    } else {
      [docMap setObject:value forKey:key];
    }
  }
  return docMap;
}

-(NSDictionary *)resultToMap:(CBLQueryResult *)d dbName:(NSString *)dbName {
  
  NSMutableDictionary *dm = [[d toDictionary] mutableCopy];
    
  if ([dm objectForKey:@"_id"]) {
    [dm setObject:[dm objectForKey:@"_id"] forKey:@"id"];
    [dm removeObjectForKey:@"_id"];
  }
  return [self resultDictionaryToMap:dm dbName:dbName];
}

-(NSDictionary *)resultDictionaryToMap:(NSDictionary *)d dbName:(NSString *)dbName {
  NSMutableDictionary *docMap = [[NSMutableDictionary alloc] init];
  for(NSString *key in d) {
    NSString *finalKey = [key isEqualToString:@"*"] ? dbName : key;
    id value = d[key];
    if ([value isKindOfClass:[CBLBlob class]]) {
      CBLBlob *blobEntry = (CBLBlob *)value;
      [docMap setObject:[blobEntry properties] forKey:finalKey];
    } else if ([value isKindOfClass:[NSDictionary class]]) {
      [docMap setObject:[self resultDictionaryToMap:value dbName:dbName] forKey:finalKey];
    } else {
      [docMap setObject:value forKey:finalKey];
    }
  }
  return docMap;
}

-(void)Plugin_Configure:(CDVInvokedUrlCommand*)command {
  NSDictionary *config = [command argumentAtIndex:0];
  id chunkSizeVal = [config objectForKey:@"allResultsChunkSize"];
  if (chunkSizeVal != NULL) {
    _allResultsChunkSize = [chunkSizeVal intValue];
  }
}

-(void)Database_Open:(CDVInvokedUrlCommand*)command {
  NSString *name = [command argumentAtIndex:0];
  NSDictionary *configValue = [command argumentAtIndex:1];
  
  CBLDatabaseConfiguration *config = [self buildDBConfig:configValue];
  NSError *error;
  CBLDatabase *database = [[CBLDatabase alloc] initWithName:name config:config error:&error];
  
  if ([self checkError:command error:error message:@"Unable to open database"]) {
    return;
  }
  
  [openDatabases setObject:database forKey:name];
    
  [self resolve:command];
}

-(CBLDatabaseConfiguration *)buildDBConfig:(NSDictionary *)config {
  CBLDatabaseConfiguration *c = [[CBLDatabaseConfiguration alloc] init];
  NSString *encKey = [config objectForKey:@"encryptionKey"];
  NSString *directory = [config objectForKey:@"directory"];
  if (directory != NULL) {
    [c setDirectory:directory];
  }
  if (encKey != NULL) {
    CBLEncryptionKey *key = [[CBLEncryptionKey alloc] initWithPassword:encKey];
    [c setEncryptionKey:key];
  }
  return c;
}

-(void)Database_Exists:(CDVInvokedUrlCommand*)command {
  NSString *existsName = [command argumentAtIndex:1];
  NSString *directory = [command argumentAtIndex:2];
  [self.commandDelegate runInBackground:^{
    return [self resolve:command boolean:[CBLDatabase databaseExists:existsName inDirectory:directory]];
  }];
}

-(void)Database_Save:(CDVInvokedUrlCommand*)command {
  NSString *name = [command argumentAtIndex:0];
  NSString *docId = [command argumentAtIndex:1];
  NSDictionary *document = [command argumentAtIndex:2];
  int concurrencyControlValue = [[command argumentAtIndex:3] intValue];
  
  [self.commandDelegate runInBackground:^{
    CBLDatabase *db = [self getDatabase:name];
    if (db == NULL) {
      [self reject:command message:@"No such open database"];
      return;
    }
    CBLMutableDocument *m = nil;
    
    if (docId != NULL) {
      m = [[CBLMutableDocument alloc] initWithID:docId data:[self toMap:document]];
    } else {
      m = [[CBLMutableDocument alloc] initWithData:[self toMap:document]];
    }
    
    NSError *error;
    [db saveDocument:m concurrencyControl:concurrencyControlValue error:&error];
    
    if ([self checkError:command error:error message:@"Unable to save document"]) {
      return;
    }
    
    [self resolve:command data:@{ @"_id": m.id }];
  }];
}

-(NSDictionary *)toMap:(NSDictionary *)o {
  NSMutableDictionary *doc = [[NSMutableDictionary alloc] initWithCapacity:[o count]];
  for (NSString *key in o) {
    id value = o[key];
    if ([value isKindOfClass:[NSDictionary class]]) {
      NSDictionary *object = (NSDictionary *) value;
      NSString *type = [object valueForKey:@"_type"];
      if (type != NULL && [type isEqualToString:@"blob"]) {
        NSDictionary *blobData = object[@"data"];
        NSString *contentType = blobData[@"contentType"];
        NSArray *bytes = blobData[@"data"];
        NSRange copyRange = NSMakeRange(0, [bytes count]);
        unsigned char bytesCArray[[bytes count]];
        int i = 0;
        for (NSNumber *item in bytes) {
          bytesCArray[i++] = [item unsignedCharValue];
        }
        
        NSData *data = [NSData dataWithBytes:bytesCArray  length:copyRange.length];
        CBLBlob *blob = [[CBLBlob alloc] initWithContentType:contentType data:data];
        [doc setObject:blob forKey:key];
        continue;
      }
    }
    
    [doc setObject:value forKey:key];
  }
  return doc;
}

-(void)Database_GetCount:(CDVInvokedUrlCommand*)command {
  NSString *name = [command argumentAtIndex:0];
  [self.commandDelegate runInBackground:^{
    CBLDatabase *db = [self getDatabase:name];
    if (db == NULL) {
      [self reject:command message:@"No such open database"];
      return;
    }
    [self resolve: command integer:[db count]];
  }];
}

-(void)Database_GetPath:(CDVInvokedUrlCommand*)command {
  NSString *name = [command argumentAtIndex:0];
  [self.commandDelegate runInBackground:^{
    CBLDatabase *db = [self getDatabase:name];
    if (db == NULL) {
      [self reject:command message:@"No such open database"];
      return;
    }
    [self resolve:command string:[db path]];
  }];
}

-(void)Database_Copy:(CDVInvokedUrlCommand*)command {

  [self.commandDelegate runInBackground:^{
    NSString *path = [command argumentAtIndex:1];
    NSString *name2 = [command argumentAtIndex:2];
    NSDictionary *configValue = [command argumentAtIndex:3];
    
    CBLDatabaseConfiguration *config = [self buildDBConfig:configValue];
    
    NSError *error;
    [CBLDatabase copyFromPath:path toDatabase:name2 withConfig:config error:&error];
    
    [self resolve: command];
  }];
}

-(void)Database_CreateIndex:(CDVInvokedUrlCommand*)command {
  
  [self.commandDelegate runInBackground:^{
    NSString *name = [command argumentAtIndex:0];
    NSString *indexName = [command argumentAtIndex:1];
    CBLDatabase *db = [self getDatabase:name];
    if (db == NULL) {
      [self reject:command message:@"No such open database"];
      return;
    }
    NSDictionary *indexData = [command argumentAtIndex:2];
    
    NSString *type = [indexData objectForKey:@"type"];
    NSArray *items = [indexData objectForKey:@"items"];
    
    CBLIndex *index;
    
    if ([type isEqualToString:@"value"]) {
      index = [CBLIndexBuilder valueIndexWithItems:[self makeValueIndexItems:items]];
    } else if ([type isEqualToString:@"full-text"]) {
      index = [CBLIndexBuilder fullTextIndexWithItems:[self makeFullTextIndexItems:items]];
    }
    
    NSError *error;
    [db createIndex:index withName:indexName error:&error];
    
    [self resolve: command];
  }];
}

-(NSArray<CBLValueIndexItem *> *)makeValueIndexItems:(NSArray *)items {
  NSMutableArray<CBLValueIndexItem *> *valueItems = [[NSMutableArray alloc] init];
  [items enumerateObjectsUsingBlock:^(id  _Nonnull obj, NSUInteger idx, BOOL * _Nonnull stop) {
    NSArray *entry = (NSArray *) obj;
    NSString *strEntry = (NSString *) entry[0];
    NSString *propName = [strEntry substringFromIndex:1];
    [valueItems addObject:[CBLValueIndexItem property:propName]];
  }];
  return valueItems;
}

-(NSArray<CBLFullTextIndexItem *> *)makeFullTextIndexItems:(NSArray *)items {
  NSMutableArray<CBLFullTextIndexItem *> *valueItems = [[NSMutableArray alloc] init];
  [items enumerateObjectsUsingBlock:^(id  _Nonnull obj, NSUInteger idx, BOOL * _Nonnull stop) {
    NSArray *entry = (NSArray *) obj;
    NSString *strEntry = (NSString *) entry[0];
    NSString *propName = [strEntry substringFromIndex:1];
    [valueItems addObject:[CBLFullTextIndexItem property:propName]];
  }];
  return valueItems;
}

-(void)Database_DeleteIndex:(CDVInvokedUrlCommand*)command {
  [self.commandDelegate runInBackground:^{
    NSString *name = [command argumentAtIndex:0];
    CBLDatabase *db = [self getDatabase:name];
    if (db == NULL) {
      [self reject:command message:@"No such open database"];
      return;
    }
    NSString *indexName = [command argumentAtIndex:1];
    
    
    NSError *error;
    [db deleteIndexForName:indexName error:&error];
    [self resolve:command string:[db path]];
  }];
}

-(void)Database_GetIndexes:(CDVInvokedUrlCommand*)command {
  NSString *name = [command argumentAtIndex:0];
  CBLDatabase *db = [self getDatabase:name];
  if (db == NULL) {
    [self reject:command message:@"No such open database"];
    return;
  }
  [self.commandDelegate runInBackground:^{
    [self resolve:command array:[db indexes]];
  }];
}

-(void)Database_AddChangeListener:(CDVInvokedUrlCommand*)command {
  [self.commandDelegate runInBackground:^{
    NSString *name = [command argumentAtIndex:0];
    CBLDatabase *db = [self getDatabase:name];
    if (db == NULL) {
      [self reject:command message:@"No such open database"];
      return;
    }
    
    [db addChangeListener:^(CBLDatabaseChange *change) {
      NSArray<NSString *> *docIds = [change documentIDs];
      NSDictionary *data = @{
        @"documentIDs": docIds
      };
      CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:data];
      [result setKeepCallbackAsBool:TRUE];
      [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
    }];
  }];
}

-(void)Database_Close:(CDVInvokedUrlCommand*)command {
  [self.commandDelegate runInBackground:^{
    NSString *name = [command argumentAtIndex:0];
    CBLDatabase *db = [self getDatabase:name];
    if (db == NULL) {
      [self reject:command message:@"No such open database"];
      return;
    }
    
    NSError *error;
    [db close:&error];
    
    [self->openDatabases removeObjectForKey:name];
    
    if ([self checkError:command error:error message:@"Unable to close database"]) {
      return;
    }
    
    [self resolve:command];
  }];
}

-(void)Database_Delete:(CDVInvokedUrlCommand*)command {
  NSString *name = [command argumentAtIndex:0];
  CBLDatabase *db = [self getDatabase:name];
  if (db == NULL) {
    [self reject:command message:@"No such open database"];
    return;
  }
  NSError *error;
  [db delete:&error];
  
  if ([self checkError:command error:error message:@"Unable to delete database"]) {
    return;
  }
  
  [self resolve:command];
}

-(void)Database_DeleteDocument:(CDVInvokedUrlCommand*)command {
  [self.commandDelegate runInBackground:^{
    NSString *name = [command argumentAtIndex:0];
    NSString *docId = [command argumentAtIndex:1];
    int concurrencyControlValue = [[command argumentAtIndex:3] intValue];
    CBLDatabase *db = [self getDatabase:name];
    if (db == NULL) {
      [self reject:command message:@"No such open database"];
      return;
    }
    
    CBLDocument *doc = [db documentWithID:docId];
    
    NSError *error;
    [db deleteDocument:doc concurrencyControl:concurrencyControlValue error:&error];
    if ([self checkError:command error:error message:@"Unable to delete document"]) {
      return;
    }
    
    [self resolve:command];
  }];
}

-(void)Database_PurgeDocument:(CDVInvokedUrlCommand*)command {
  [self.commandDelegate runInBackground:^{
    NSString *name = [command argumentAtIndex:0];
    NSString *docId = [command argumentAtIndex:1];
    CBLDatabase *db = [self getDatabase:name];
    if (db == NULL) {
      [self reject:command message:@"No such open database"];
      return;
    }
        
    NSError *error;
    [db purgeDocumentWithID:docId error:&error];
    
    if ([self checkError:command error:error message:@"Unable to purge document"]) {
      return;
    }
    
    [self resolve:command];
  }];
}

-(void)Database_Compact:(CDVInvokedUrlCommand*)command {
  [self.commandDelegate runInBackground:^{
    NSString *name = [command argumentAtIndex:0];
    CBLDatabase *db = [self getDatabase:name];
    if (db == NULL) {
      [self reject:command message:@"No such open database"];
      return;
    }
    
    NSError *error;
    [db compact:&error];
    
    if ([self checkError:command error:error message:@"Unable to compact database"]) {
      return;
    }
    
    [self resolve:command];
  }];
}

-(void)Database_GetDocument:(CDVInvokedUrlCommand*)command {
  [self.commandDelegate runInBackground:^{
    NSString *name = [command argumentAtIndex:0];
    NSString *docId = [command argumentAtIndex:1];
    CBLDatabase *db = [self getDatabase:name];
    if (db == NULL) {
      [self reject:command message:@"No such open database"];
      return;
    }
    
    CBLDocument *doc = [db documentWithID:docId];
    
    if (doc != NULL) {
      NSMutableDictionary *data = [NSMutableDictionary new];
      NSDictionary *documentMap = [self documentToMap:doc];
      [data setObject:documentMap forKey:@"_data"];
      [data setObject:docId forKey:@"_id"];
      [data setObject:@([doc sequence]) forKey:@"_sequence"];
      [self resolve:command data:data];
      return;
    }
    
    [self resolve:command data:@{}];
  }];
}

-(void)Database_SetLogLevel:(CDVInvokedUrlCommand*)command {
  [self.commandDelegate runInBackground:^{
    NSString *domainValue = [command argumentAtIndex:1];
    int logLevelValue = [[command argumentAtIndex:2] intValue];
    CBLLogDomain domain = kCBLLogDomainAll;
    
    if ([domainValue isEqualToString:@"ALL"]) domain = kCBLLogDomainAll;
    else if ([domainValue isEqualToString:@"DATABASE"]) domain = kCBLLogDomainDatabase;
    else if ([domainValue isEqualToString:@"NETWORK"]) domain = kCBLLogDomainNetwork;
    else if ([domainValue isEqualToString:@"QUERY"]) domain = kCBLLogDomainQuery;
    else if ([domainValue isEqualToString:@"REPLICATOR"]) domain = kCBLLogDomainReplicator;
    
    [CBLDatabase setLogLevel:logLevelValue domain:domain];
    
    return [self resolve:command];
  }];
}

-(void)Database_SetFileLoggingConfig:(CDVInvokedUrlCommand*)command {
  [self.commandDelegate runInBackground:^{
    NSString *name = [command argumentAtIndex:0];
    CBLDatabase *db = [self getDatabase:name];
    if (db == NULL) {
      [self reject:command message:@"No such open database"];
      return;
    }
    NSDictionary *configObject = [command argumentAtIndex:1];
    id logLevelValue = [configObject objectForKey:@"level"];
    NSString *directory = [configObject objectForKey:@"directory"];
    NSString *rawDir = [directory stringByReplacingOccurrencesOfString:@"file://" withString:@""];
    CBLLogFileConfiguration* config = [[CBLLogFileConfiguration alloc] initWithDirectory:rawDir];
    
    id maxRotateCount = [configObject objectForKey:@"maxRotateCount"];
    id maxSize = [configObject objectForKey:@"maxSize"];
    id usePlaintext = [configObject objectForKey:@"usePlaintext"];
    
    [CBLDatabase.log.file setConfig:config];
    
    if (maxRotateCount != NULL) {
      [config setMaxRotateCount:(NSInteger) maxRotateCount];
    }
    if (maxSize != NULL) {
      [config setMaxSize:(NSInteger) maxSize];
    }
    if (usePlaintext != NULL) {
      [config setUsePlainText:(NSInteger) maxRotateCount];
    }
    if (logLevelValue != NULL) {
      [CBLDatabase.log.file setLevel:(NSInteger) logLevelValue];
    }
    return [self resolve:command];
  }];
}

-(void)Document_GetBlobContent:(CDVInvokedUrlCommand*)command {
  [self.commandDelegate runInBackground:^{
    NSString *name = [command argumentAtIndex:0];
    NSString *documentId = [command argumentAtIndex:1];
    NSString *key = [command argumentAtIndex:2];
    CBLDatabase *db = [self getDatabase:name];
    if (db == NULL) {
      [self reject:command message:@"No such open database"];
      return;
    }
    
    CBLDocument *d = [db documentWithID:documentId];
    if (d != NULL) {
      CBLBlob *blob = [d blobForKey:key];
      NSData *data = [blob content];

      NSMutableArray *content = [[NSMutableArray alloc] initWithCapacity:[data length]];
      const char *bytes = [data bytes];
      for (int i = 0; i < [data length]; i++) {
        [content addObject:@(bytes[i])];
      }
      [self resolve:command array:content];
    } else {
      [self resolve:command data:@{}];
    }
  }];
}

-(void)Query_Execute:(CDVInvokedUrlCommand*)command {

  //[self.commandDelegate runInBackground:^{
    NSString *name = [command argumentAtIndex:0];
    CBLDatabase *db = [self getDatabase:name];
    if (db == NULL) {
      [self reject:command message:@"No such open database"];
      return;
    }
    NSString *queryJson = [command argumentAtIndex:1];
    
    NSError *error;
    CustomQuery *query = [[CustomQuery alloc] initWithJson:queryJson database:db];
    CBLQueryResultSet *result = [query execute:&error];
    
    if ([self checkError:command error:error message:@"Unable to execute query"]) {
      return;
    }

    [queryResultSets setObject:result forKey: [@(_queryCount) stringValue]];
    NSInteger queryId = _queryCount;
    _queryCount++;
    
    [self resolve:command data:@{ @"id": @(queryId) }];
  //}];
}

-(void)ResultSet_Next:(CDVInvokedUrlCommand*)command {
  [self.commandDelegate runInBackground:^{
    NSString *name = [command argumentAtIndex:0];
    int queryId = [[command argumentAtIndex:1] intValue];
    
    CBLQueryResultSet *rs = [self->queryResultSets objectForKey:[@(queryId) stringValue]];
    if (rs == NULL) {
      [self reject:command message:@"No such result set"];
      return;
    }
    CBLQueryResult *result = [rs nextObject];
    
    if (result == NULL) {
      return [self resolve:command];
    }
    
    return [self resolve:command data:[self resultToMap:result dbName:name]];
  }];
}

-(void)ResultSet_NextBatch:(CDVInvokedUrlCommand*)command {
  [self.commandDelegate runInBackground:^{
    NSString *name = [command argumentAtIndex:0];
    int queryId = [[command argumentAtIndex:1] intValue];
    
    CBLQueryResultSet *rs = [self->queryResultSets objectForKey:[@(queryId) stringValue]];
    if (rs == NULL) {
      [self reject:command message:@"No such result set"];
      return;
    }
    long chunkSize = self->_allResultsChunkSize;
    NSMutableArray<NSDictionary *> *resultsChunk = [[NSMutableArray alloc] initWithCapacity:chunkSize];
    
    
    CBLQueryResult *result;
    int i = 0;
    while(i++ < chunkSize && (result = [rs nextObject]) != NULL) {
      [resultsChunk addObject:[self resultToMap:result dbName:name]];
    };
    
    return [self resolve:command array:resultsChunk];
  }];
}

-(void)ResultSet_AllResults:(CDVInvokedUrlCommand*)command {
  __weak IonicCouchbaseLite *weakSelf = self;
  [self.commandDelegate runInBackground:^{
    NSString *name = [command argumentAtIndex:0];
    int queryId = [[command argumentAtIndex:1] intValue];
    long chunkSize = self->_allResultsChunkSize;
    CBLQueryResultSet *rs = [self->queryResultSets objectForKey:[@(queryId) stringValue]];
    
    if (rs == NULL) {
      [weakSelf reject:command message:@"No such result set"];
      return;
    }
    NSMutableArray *resultsChunk = NULL;
    
    int i = 0;
    CBLQueryResult *queryResult;
    while ((queryResult = [rs nextObject]) != NULL) {
      if (i % chunkSize == 0) {
        if (resultsChunk != NULL) {
          CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsArray:resultsChunk];
          
          [result setKeepCallbackAsBool:TRUE];
          [weakSelf.commandDelegate sendPluginResult:result callbackId:command.callbackId];
          [resultsChunk removeAllObjects];
        } else {
          resultsChunk = [[NSMutableArray alloc] initWithCapacity:chunkSize];
        }
      }
      [resultsChunk addObject:[self resultToMap:queryResult dbName:name]];
      i++;
    }
    
    if (resultsChunk != NULL && [resultsChunk count] > 0) {
      CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsArray:resultsChunk];
      [result setKeepCallbackAsBool:TRUE];
      [weakSelf.commandDelegate sendPluginResult:result callbackId:command.callbackId];
    }
    CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsArray:[NSMutableArray new]];
    [weakSelf.commandDelegate sendPluginResult:result callbackId:command.callbackId];
  }];
}

-(void)ResultSet_AllResults2:(CDVInvokedUrlCommand*)command {
  //__weak IonicCouchbaseLite *weakSelf = self;
  IonicCouchbaseLite *weakSelf = self;
  [self.commandDelegate runInBackground:^{
    NSString *name = [command argumentAtIndex:0];
    int queryId = [[command argumentAtIndex:1] intValue];
    int chunkSize = (int) self->_allResultsChunkSize;
    CBLQueryResultSet *rs = [self->queryResultSets objectForKey:[@(queryId) stringValue]];
    
    if (rs == NULL) {
      [weakSelf reject:command message:@"No such result set"];
      return;
    }
    
    NSArray<CBLQueryResult *> *results = [rs allResults];
    //NSMutableArray *resultsMapped = [NSMutableArray new];
    NSMutableArray *resultsChunk = NULL;
    for (int i = 0; i < [results count]; i++) {
      if (i % chunkSize == 0) {
        if (resultsChunk != NULL) {
          CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsArray:resultsChunk];
          
          [result setKeepCallbackAsBool:TRUE];
          [weakSelf.commandDelegate sendPluginResult:result callbackId:command.callbackId];
        }
        resultsChunk = [NSMutableArray new];
      }
      CBLQueryResult *result = [results objectAtIndex:i];
      [resultsChunk addObject:[self resultToMap:result dbName:name]];
    }
    
    if (resultsChunk != NULL && [resultsChunk count] > 0) {
      CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsArray:resultsChunk];
      [result setKeepCallbackAsBool:TRUE];
      [weakSelf.commandDelegate sendPluginResult:result callbackId:command.callbackId];
    }
    CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsArray:[NSMutableArray new]];
    [weakSelf.commandDelegate sendPluginResult:result callbackId:command.callbackId];
  }];
}

-(void)ResultSet_Cleanup:(CDVInvokedUrlCommand*)command {
  [self.commandDelegate runInBackground:^{
    int queryId = [[command argumentAtIndex:1] intValue];
    CBLQueryResultSet *rs = [self->queryResultSets objectForKey:[@(queryId) stringValue]];

    if (rs != NULL) {
      [self->queryResultSets removeObjectForKey:[@(queryId) stringValue]];
    }
  }];
}

-(void)Replicator_Create:(CDVInvokedUrlCommand*)command {
  NSString *name = [command argumentAtIndex:0];
  NSDictionary *config = [command argumentAtIndex:1];

  CBLDatabase *db = [self getDatabase:name];
  if (db == NULL) {
    [self reject:command message:@"No such open database"];
    return;
  }
  [self.commandDelegate runInBackground:^{
    CBLReplicatorConfiguration *replicatorConfig = [self replicatorConfigFromJson:db data:config];
    CBLReplicator *replicator = [[CBLReplicator alloc] initWithConfig:replicatorConfig];
        
    NSInteger replicatorId = self->_replicatorCount++;
    [self->replicators setObject:replicator forKey:[@(replicatorId) stringValue]];
    return [self resolve:command data:@{ @"replicatorId": @(replicatorId) }];
  }];
}

-(void)Replicator_Start:(CDVInvokedUrlCommand*)command {
  NSInteger replicatorId = [[command argumentAtIndex:0] intValue];
  
  [self.commandDelegate runInBackground:^{
    CBLReplicator *replicator = [self->replicators objectForKey:[@(replicatorId) stringValue]];
    if (replicator == NULL) {
      return [self reject:command message:@"No such replicator"];
    }
    
    [replicator start];
    
    [self resolve:command];
  }];
}

-(CBLReplicatorConfiguration *)replicatorConfigFromJson:(CBLDatabase *)db data:(NSDictionary *)data {
  NSDictionary *authenticatorData = [data objectForKey:@"authenticator"];
  NSDictionary *target = [data objectForKey:@"target"];
  NSString *url = [target objectForKey:@"url"];
  NSString *replicatorType = [data objectForKey:@"replicatorType"];
  BOOL continuous = [data objectForKey:@"continuous"];
  
  CBLURLEndpoint *endpoint = [[CBLURLEndpoint alloc] initWithURL:[NSURL URLWithString:url]];
  
  CBLReplicatorConfiguration *replConfig = [[CBLReplicatorConfiguration alloc] initWithDatabase:db target:endpoint];
  
  if ([replicatorType isEqualToString:@"PUSH_AND_PULL"]) {
    [replConfig setReplicatorType:kCBLReplicatorTypePushAndPull];
  } else if ([replicatorType isEqualToString:@"PULL"]) {
    [replConfig setReplicatorType:kCBLReplicatorTypePull];
  } else if ([replicatorType isEqualToString:@"PUSH"]) {
    [replConfig setReplicatorType:kCBLReplicatorTypePush];
  }
    
  NSArray *channels = [data objectForKey:@"channels"];
  if (channels != NULL) {
    [replConfig setChannels:channels];
  }
    
  [replConfig setContinuous:continuous];
  
  CBLAuthenticator *authenticator = [self replicatorAuthenticatorFromConfig:authenticatorData];
  
  if (authenticator != NULL) {
    [replConfig setAuthenticator:authenticator];
  }
  
  return replConfig;
}

-(CBLAuthenticator *)replicatorAuthenticatorFromConfig:(NSDictionary *)config {
  NSString *type = [config objectForKey:@"type"];
  NSDictionary *data = [config objectForKey:@"data"];
  if ([type isEqualToString:@"session"]) {
    NSString *sessionID = [data objectForKey:@"sessionID"];
    NSString *cookieName = [data objectForKey:@"cookieName"];
    CBLSessionAuthenticator *auth = [[CBLSessionAuthenticator alloc] initWithSessionID:sessionID cookieName:cookieName];
    return auth;
  } else if ([type isEqualToString:@"basic"]) {
    NSString *username = [data objectForKey:@"username"];
    NSString *password = [data objectForKey:@"password"];
    CBLBasicAuthenticator *auth = [[CBLBasicAuthenticator alloc] initWithUsername:username password:password];
    return auth;
  }
  return NULL;
}

-(void)Replicator_Stop:(CDVInvokedUrlCommand*)command {
  NSInteger replicatorId = [[command argumentAtIndex:0] intValue];
  
  [self.commandDelegate runInBackground:^{
    CBLReplicator *replicator = [self->replicators objectForKey:[@(replicatorId) stringValue]];
    if (replicator == NULL) {
      return [self reject:command message:@"No such replicator"];
    }
    
    [replicator stop];
    
    [self resolve:command];
  }];
}
-(void)Replicator_ResetCheckpoint:(CDVInvokedUrlCommand*)command {
  NSInteger replicatorId = [[command argumentAtIndex:0] intValue];
  
  [self.commandDelegate runInBackground:^{
    CBLReplicator *replicator = [self->replicators objectForKey:[@(replicatorId) stringValue]];
    if (replicator == NULL) {
      return [self reject:command message:@"No such replicator"];
    }
    
    [replicator resetCheckpoint];
    
    [self resolve:command];
  }];
}

-(void)Replicator_GetStatus:(CDVInvokedUrlCommand*)command {
  NSInteger replicatorId = [[command argumentAtIndex:0] intValue];
  
  [self.commandDelegate runInBackground:^{
    CBLReplicator *replicator = [self->replicators objectForKey:[@(replicatorId) stringValue]];
    if (replicator == NULL) {
      return [self reject:command message:@"No such replicator"];
    }
    
    CBLReplicatorStatus *status = [replicator status];

    NSDictionary *statusJson = [self generateStatusJson:status];
    
    [self resolve:command data:statusJson];
  }];
}

-(NSDictionary *)generateStatusJson:(CBLReplicatorStatus *)status {
    NSDictionary *errorJson = nil;
    NSError *error = status.error;
    if (error != nil) {
      errorJson = @{
        @"code": @(error.code),
        @"domain": error.domain,
        @"message": error.localizedDescription
      };
    }
    
    CBLReplicatorProgress progress = status.progress;
    NSDictionary *progressJson = @{
      @"completed": @(progress.completed),
      @"total": @(progress.total)
    };
  if (errorJson != nil) {
    return @{
      @"activityLevel": @(status.activity),
      @"error": errorJson,
      @"progress": progressJson
    };
  }
  else {
    return @{
      @"activityLevel": @(status.activity),
      @"progress": progressJson
    };
  }
}

-(void)Replicator_AddChangeListener:(CDVInvokedUrlCommand*)command {
  NSInteger replicatorId = [[command argumentAtIndex:0] intValue];
  
  [self.commandDelegate runInBackground:^{
    CBLReplicator *replicator = [self->replicators objectForKey:[@(replicatorId) stringValue]];
    if (replicator == NULL) {
      return [self reject:command message:@"No such replicator"];
    }
    
    id listener = [replicator addChangeListener:^(CBLReplicatorChange *change) {
      NSDictionary *statusJson = [self generateStatusJson:change.status];
      CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:statusJson];
      
      [result setKeepCallbackAsBool:TRUE];
      [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
    }];
    
    [self->replicatorChangeListeners setObject:listener forKey:[@(replicatorId) stringValue]];
  }];
}

-(NSDictionary *)generateReplicationJson:(CBLDocumentReplication *)replication {
  NSMutableArray* docs = [[NSMutableArray alloc] init];
  
  for (CBLReplicatedDocument* document in replication.documents) {
    NSMutableArray* flags = [[NSMutableArray alloc] init];
    if ((document.flags & kCBLDocumentFlagsDeleted) != 0) {
      [flags addObject:@"DELETED"];
    }
    if ((document.flags & kCBLDocumentFlagsAccessRemoved) != 0) {
      [flags addObject:@"ACCESS_REMOVED"];
    }
    NSMutableDictionary* documentDictionary = [[NSMutableDictionary alloc] initWithDictionary:@{@"id":document.id, @"flags": flags}];
    
    NSError *error = document.error;
    if (error != nil) {
      [documentDictionary setValue:@{@"code": @(error.code), @"domain": error.domain, @"message": error.localizedDescription} forKey:@"error"];
    }
    
    [docs addObject:documentDictionary];
  }
  
  return @{
    @"direction": (replication.isPush) ? @"PUSH" : @"PULL",
    @"documents": docs
  };
}

-(void)Replicator_AddDocumentListener:(CDVInvokedUrlCommand*)command {
  NSInteger replicatorId = [[command argumentAtIndex:0] intValue];
  
  [self.commandDelegate runInBackground:^{
    CBLReplicator *replicator = [self->replicators objectForKey:[@(replicatorId) stringValue]];
    if (replicator == NULL) {
      return [self reject:command message:@"No such replicator"];
    }
    
    id listener = [replicator addDocumentReplicationListener:^(CBLDocumentReplication *replication) {
      NSDictionary *eventJson = [self generateReplicationJson:replication];
      CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:eventJson];
      
      [result setKeepCallbackAsBool:TRUE];
      [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
    }];
    
    [self->replicatorDocumentListeners setObject:listener forKey:[@(replicatorId) stringValue]];
  }];
}

-(void)Replicator_Cleanup:(CDVInvokedUrlCommand*)command {
  NSInteger replicatorId = [[command argumentAtIndex:0] intValue];
  
  [self.commandDelegate runInBackground:^{
    NSString *key = [@(replicatorId) stringValue];
    CBLReplicator *replicator = [self->replicators objectForKey:key];
    if (replicator == NULL) {
      return [self reject:command message:@"No such replicator"];
    }
    
    [self->replicators removeObjectForKey:key];
    
    id listener = [self->replicatorChangeListeners objectForKey:key];
    if (listener != NULL) {
      [replicator removeChangeListenerWithToken:listener];
      [self->replicatorChangeListeners removeObjectForKey:key];
    }
    
    listener = [self->replicatorDocumentListeners objectForKey:key];
    if (listener != NULL) {
      [replicator removeChangeListenerWithToken:listener];
      [self->replicatorDocumentListeners removeObjectForKey:key];
    }
    
    [self resolve:command];
  }];
}

-(void)Replicator_Restart:(CDVInvokedUrlCommand*)command {
  NSInteger replicatorId = [[command argumentAtIndex:0] intValue];
  
  [self.commandDelegate runInBackground:^{
    NSString *key = [@(replicatorId) stringValue];
    CBLReplicator *replicator = [self->replicators objectForKey:key];
    if (replicator != NULL) {
      [replicator start];
    }
    [self resolve:command];
  }];
}

-(void)Test_Query:(CDVInvokedUrlCommand*)command {
    CBLMutableDocument *d = [[CBLMutableDocument alloc] init];
    [d setString:@"Escape" forKey:@"name"];
    [d setString:@"hotel" forKey:@"type"];
    
    [d setString:NULL forKey:@"asdf"];
    CBLMutableArray *array = [[CBLMutableArray alloc] initWithData:@[
        @"hello",
        @"really",
        @"cool"
    ]];

    [d setArray:array forKey:@"items"];
    
    NSError *error;
    
    [CBLDatabase deleteDatabase:@"asdfasdf" inDirectory:NULL error:NULL];
    CBLDatabase *database = [[CBLDatabase alloc] initWithName:@"asdfasdf" config:NULL error:&error];
    [database saveDocument:d error:&error];
    
    CBLQuery *query = [CBLQueryBuilder select:@[[CBLQuerySelectResult all]]
                                         from:[CBLQueryDataSource database:database]];
    NSEnumerator* rs = [query execute:&error];
    for (CBLQueryResult *result in rs) {
        NSDictionary *resultsDict = [result toDictionary];
        NSLog(@"%@", resultsDict);
    }
    /*
      .setArray("items", ["hello", {
        "really": "cool"
      }, 123, true])
      //.setBlob('profile', new Blob('image/jpeg', 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P//PwAGBAL/VJiKjgAAAABJRU5ErkJggg=='))
      .setArray("someWithNull", [
        1,
        null,
        4
      ])
      .setDictionary("config", {
        "size": "large",
        "isCool": false
      })
      .setDate("created", new Date());
    */
    [self resolve:command];
}
@end
