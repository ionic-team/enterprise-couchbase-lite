# @ionic-enterprise/couchbase-lite

Integration for Couchbase Lite in Ionic enterprise apps

## Install

```bash
npm install @ionic-enterprise/couchbase-lite
npx cap sync
```

## API

<docgen-index>

* [`pluginConfigure(...)`](#pluginconfigure)
* [`databaseOpen(...)`](#databaseopen)
* [`databaseSave(...)`](#databasesave)
* [`databaseGetCount(...)`](#databasegetcount)
* [`databaseGetPath(...)`](#databasegetpath)
* [`databaseCopy(...)`](#databasecopy)
* [`databaseCreateIndex(...)`](#databasecreateindex)
* [`databaseDeleteIndex(...)`](#databasedeleteindex)
* [`databaseGetIndexes(...)`](#databasegetindexes)
* [`databaseExists(...)`](#databaseexists)
* [`databaseClose(...)`](#databaseclose)
* [`databaseCompact(...)`](#databasecompact)
* [`databaseDelete(...)`](#databasedelete)
* [`databasePurgeDocument(...)`](#databasepurgedocument)
* [`databaseDeleteDocument(...)`](#databasedeletedocument)
* [`databaseGetDocument(...)`](#databasegetdocument)
* [`databaseAddChangeListener(...)`](#databaseaddchangelistener)
* [`databaseSetLogLevel(...)`](#databasesetloglevel)
* [`databaseSetFileLoggingConfig(...)`](#databasesetfileloggingconfig)
* [`databaseGetBlobContent(...)`](#databasegetblobcontent)
* [`queryExecute(...)`](#queryexecute)
* [`resultSetNext(...)`](#resultsetnext)
* [`resultSetNextBatch(...)`](#resultsetnextbatch)
* [`resultSetAllResults(...)`](#resultsetallresults)
* [`resultSetCleanup(...)`](#resultsetcleanup)
* [`replicatorCreate(...)`](#replicatorcreate)
* [`replicatorStart(...)`](#replicatorstart)
* [`replicatorRestart(...)`](#replicatorrestart)
* [`replicatorAddChangeListener(...)`](#replicatoraddchangelistener)
* [`replicatorAddDocumentListener(...)`](#replicatoradddocumentlistener)
* [`replicatorStop(...)`](#replicatorstop)
* [`replicatorResetCheckpoint(...)`](#replicatorresetcheckpoint)
* [`replicatorGetStatus(...)`](#replicatorgetstatus)
* [`replicatorCleanup(...)`](#replicatorcleanup)
* [Interfaces](#interfaces)
* [Enums](#enums)

</docgen-index>

<docgen-api>
<!--Update the source file JSDoc comments and rerun docgen to update the docs below-->

### pluginConfigure(...)

```typescript
pluginConfigure(args: PluginConfigureArgs) => any
```

| Param      | Type                                                                |
| ---------- | ------------------------------------------------------------------- |
| **`args`** | <code><a href="#pluginconfigureargs">PluginConfigureArgs</a></code> |

**Returns:** <code>any</code>

--------------------


### databaseOpen(...)

```typescript
databaseOpen(args: DatabaseOpenArgs) => any
```

| Param      | Type                                                          |
| ---------- | ------------------------------------------------------------- |
| **`args`** | <code><a href="#databaseopenargs">DatabaseOpenArgs</a></code> |

**Returns:** <code>any</code>

--------------------


### databaseSave(...)

```typescript
databaseSave(args: DatabaseSaveArgs) => any
```

| Param      | Type                                                          |
| ---------- | ------------------------------------------------------------- |
| **`args`** | <code><a href="#databasesaveargs">DatabaseSaveArgs</a></code> |

**Returns:** <code>any</code>

--------------------


### databaseGetCount(...)

```typescript
databaseGetCount(args: DatabaseArgs) => any
```

| Param      | Type                                                  |
| ---------- | ----------------------------------------------------- |
| **`args`** | <code><a href="#databaseargs">DatabaseArgs</a></code> |

**Returns:** <code>any</code>

--------------------


### databaseGetPath(...)

```typescript
databaseGetPath(args: DatabaseArgs) => any
```

| Param      | Type                                                  |
| ---------- | ----------------------------------------------------- |
| **`args`** | <code><a href="#databaseargs">DatabaseArgs</a></code> |

**Returns:** <code>any</code>

--------------------


### databaseCopy(...)

```typescript
databaseCopy(args: DatabaseCopyArgs) => any
```

| Param      | Type                                                          |
| ---------- | ------------------------------------------------------------- |
| **`args`** | <code><a href="#databasecopyargs">DatabaseCopyArgs</a></code> |

**Returns:** <code>any</code>

--------------------


### databaseCreateIndex(...)

```typescript
databaseCreateIndex(args: DatabaseCreateIndexArgs) => any
```

| Param      | Type                                                                        |
| ---------- | --------------------------------------------------------------------------- |
| **`args`** | <code><a href="#databasecreateindexargs">DatabaseCreateIndexArgs</a></code> |

**Returns:** <code>any</code>

--------------------


### databaseDeleteIndex(...)

```typescript
databaseDeleteIndex(args: DatabaseDeleteIndexArgs) => any
```

| Param      | Type                                                                        |
| ---------- | --------------------------------------------------------------------------- |
| **`args`** | <code><a href="#databasedeleteindexargs">DatabaseDeleteIndexArgs</a></code> |

**Returns:** <code>any</code>

--------------------


### databaseGetIndexes(...)

```typescript
databaseGetIndexes(args: DatabaseArgs) => any
```

| Param      | Type                                                  |
| ---------- | ----------------------------------------------------- |
| **`args`** | <code><a href="#databaseargs">DatabaseArgs</a></code> |

**Returns:** <code>any</code>

--------------------


### databaseExists(...)

```typescript
databaseExists(args: DatabaseExistsArgs) => any
```

| Param      | Type                                                              |
| ---------- | ----------------------------------------------------------------- |
| **`args`** | <code><a href="#databaseexistsargs">DatabaseExistsArgs</a></code> |

**Returns:** <code>any</code>

--------------------


### databaseClose(...)

```typescript
databaseClose(args: DatabaseArgs) => any
```

| Param      | Type                                                  |
| ---------- | ----------------------------------------------------- |
| **`args`** | <code><a href="#databaseargs">DatabaseArgs</a></code> |

**Returns:** <code>any</code>

--------------------


### databaseCompact(...)

```typescript
databaseCompact(args: DatabaseArgs) => any
```

| Param      | Type                                                  |
| ---------- | ----------------------------------------------------- |
| **`args`** | <code><a href="#databaseargs">DatabaseArgs</a></code> |

**Returns:** <code>any</code>

--------------------


### databaseDelete(...)

```typescript
databaseDelete(args: DatabaseArgs) => any
```

| Param      | Type                                                  |
| ---------- | ----------------------------------------------------- |
| **`args`** | <code><a href="#databaseargs">DatabaseArgs</a></code> |

**Returns:** <code>any</code>

--------------------


### databasePurgeDocument(...)

```typescript
databasePurgeDocument(args: DatabasePurgeDocumentArgs) => any
```

| Param      | Type                                                                            |
| ---------- | ------------------------------------------------------------------------------- |
| **`args`** | <code><a href="#databasepurgedocumentargs">DatabasePurgeDocumentArgs</a></code> |

**Returns:** <code>any</code>

--------------------


### databaseDeleteDocument(...)

```typescript
databaseDeleteDocument(args: DatabaseDeleteDocumentArgs) => any
```

| Param      | Type                                                                              |
| ---------- | --------------------------------------------------------------------------------- |
| **`args`** | <code><a href="#databasedeletedocumentargs">DatabaseDeleteDocumentArgs</a></code> |

**Returns:** <code>any</code>

--------------------


### databaseGetDocument(...)

```typescript
databaseGetDocument(args: DatabaseGetDocumentArgs) => any
```

| Param      | Type                                                                        |
| ---------- | --------------------------------------------------------------------------- |
| **`args`** | <code><a href="#databasegetdocumentargs">DatabaseGetDocumentArgs</a></code> |

**Returns:** <code>any</code>

--------------------


### databaseAddChangeListener(...)

```typescript
databaseAddChangeListener(args: DatabaseArgs, cb: PluginCallback) => any
```

| Param      | Type                                                                        |
| ---------- | --------------------------------------------------------------------------- |
| **`args`** | <code><a href="#databaseargs">DatabaseArgs</a></code>                       |
| **`cb`**   | <code>(data: PluginResultData, error?: PluginResultError) =&gt; void</code> |

**Returns:** <code>any</code>

--------------------


### databaseSetLogLevel(...)

```typescript
databaseSetLogLevel(args: DatabaseSetLogLevelArgs) => any
```

| Param      | Type                                                                        |
| ---------- | --------------------------------------------------------------------------- |
| **`args`** | <code><a href="#databasesetloglevelargs">DatabaseSetLogLevelArgs</a></code> |

**Returns:** <code>any</code>

--------------------


### databaseSetFileLoggingConfig(...)

```typescript
databaseSetFileLoggingConfig(args: DatabaseSetFileLoggingConfigArgs) => any
```

| Param      | Type                                                                                          |
| ---------- | --------------------------------------------------------------------------------------------- |
| **`args`** | <code><a href="#databasesetfileloggingconfigargs">DatabaseSetFileLoggingConfigArgs</a></code> |

**Returns:** <code>any</code>

--------------------


### databaseGetBlobContent(...)

```typescript
databaseGetBlobContent(args: DatabaseGetBlobContentArgs) => any
```

| Param      | Type                                                                              |
| ---------- | --------------------------------------------------------------------------------- |
| **`args`** | <code><a href="#databasegetblobcontentargs">DatabaseGetBlobContentArgs</a></code> |

**Returns:** <code>any</code>

--------------------


### queryExecute(...)

```typescript
queryExecute(args: QueryExecuteArgs) => any
```

| Param      | Type                                                          |
| ---------- | ------------------------------------------------------------- |
| **`args`** | <code><a href="#queryexecuteargs">QueryExecuteArgs</a></code> |

**Returns:** <code>any</code>

--------------------


### resultSetNext(...)

```typescript
resultSetNext(args: ResultSetNextArgs) => any
```

| Param      | Type                                                            |
| ---------- | --------------------------------------------------------------- |
| **`args`** | <code><a href="#resultsetnextargs">ResultSetNextArgs</a></code> |

**Returns:** <code>any</code>

--------------------


### resultSetNextBatch(...)

```typescript
resultSetNextBatch(args: ResultSetNextBatchArgs) => any
```

| Param      | Type                                                                      |
| ---------- | ------------------------------------------------------------------------- |
| **`args`** | <code><a href="#resultsetnextbatchargs">ResultSetNextBatchArgs</a></code> |

**Returns:** <code>any</code>

--------------------


### resultSetAllResults(...)

```typescript
resultSetAllResults(args: ResultSetAllResultsArgs, callback: PluginCallback) => any
```

| Param          | Type                                                                        |
| -------------- | --------------------------------------------------------------------------- |
| **`args`**     | <code><a href="#resultsetallresultsargs">ResultSetAllResultsArgs</a></code> |
| **`callback`** | <code>(data: PluginResultData, error?: PluginResultError) =&gt; void</code> |

**Returns:** <code>any</code>

--------------------


### resultSetCleanup(...)

```typescript
resultSetCleanup(args: ResultSetCleanupArgs) => any
```

| Param      | Type                                                                  |
| ---------- | --------------------------------------------------------------------- |
| **`args`** | <code><a href="#resultsetcleanupargs">ResultSetCleanupArgs</a></code> |

**Returns:** <code>any</code>

--------------------


### replicatorCreate(...)

```typescript
replicatorCreate(args: ReplicatorCreateArgs) => any
```

| Param      | Type                                                                  |
| ---------- | --------------------------------------------------------------------- |
| **`args`** | <code><a href="#replicatorcreateargs">ReplicatorCreateArgs</a></code> |

**Returns:** <code>any</code>

--------------------


### replicatorStart(...)

```typescript
replicatorStart(args: ReplicatorArgs) => any
```

| Param      | Type                                                      |
| ---------- | --------------------------------------------------------- |
| **`args`** | <code><a href="#replicatorargs">ReplicatorArgs</a></code> |

**Returns:** <code>any</code>

--------------------


### replicatorRestart(...)

```typescript
replicatorRestart(args: ReplicatorArgs) => any
```

| Param      | Type                                                      |
| ---------- | --------------------------------------------------------- |
| **`args`** | <code><a href="#replicatorargs">ReplicatorArgs</a></code> |

**Returns:** <code>any</code>

--------------------


### replicatorAddChangeListener(...)

```typescript
replicatorAddChangeListener(args: ReplicatorArgs, cb: PluginCallback) => any
```

| Param      | Type                                                                        |
| ---------- | --------------------------------------------------------------------------- |
| **`args`** | <code><a href="#replicatorargs">ReplicatorArgs</a></code>                   |
| **`cb`**   | <code>(data: PluginResultData, error?: PluginResultError) =&gt; void</code> |

**Returns:** <code>any</code>

--------------------


### replicatorAddDocumentListener(...)

```typescript
replicatorAddDocumentListener(args: ReplicatorArgs, cb: PluginCallback) => any
```

| Param      | Type                                                                        |
| ---------- | --------------------------------------------------------------------------- |
| **`args`** | <code><a href="#replicatorargs">ReplicatorArgs</a></code>                   |
| **`cb`**   | <code>(data: PluginResultData, error?: PluginResultError) =&gt; void</code> |

**Returns:** <code>any</code>

--------------------


### replicatorStop(...)

```typescript
replicatorStop(args: ReplicatorArgs) => any
```

| Param      | Type                                                      |
| ---------- | --------------------------------------------------------- |
| **`args`** | <code><a href="#replicatorargs">ReplicatorArgs</a></code> |

**Returns:** <code>any</code>

--------------------


### replicatorResetCheckpoint(...)

```typescript
replicatorResetCheckpoint(args: ReplicatorArgs) => any
```

| Param      | Type                                                      |
| ---------- | --------------------------------------------------------- |
| **`args`** | <code><a href="#replicatorargs">ReplicatorArgs</a></code> |

**Returns:** <code>any</code>

--------------------


### replicatorGetStatus(...)

```typescript
replicatorGetStatus(args: ReplicatorArgs) => any
```

| Param      | Type                                                      |
| ---------- | --------------------------------------------------------- |
| **`args`** | <code><a href="#replicatorargs">ReplicatorArgs</a></code> |

**Returns:** <code>any</code>

--------------------


### replicatorCleanup(...)

```typescript
replicatorCleanup(args: ReplicatorArgs) => any
```

| Param      | Type                                                      |
| ---------- | --------------------------------------------------------- |
| **`args`** | <code><a href="#replicatorargs">ReplicatorArgs</a></code> |

**Returns:** <code>any</code>

--------------------


### Interfaces


#### PluginConfigureArgs

| Prop         | Type             |
| ------------ | ---------------- |
| **`config`** | <code>any</code> |


#### DatabaseOpenArgs

| Prop         | Type                               |
| ------------ | ---------------------------------- |
| **`config`** | <code>DatabaseConfiguration</code> |


#### DatabaseSaveArgs

| Prop           | Type                                 |
| -------------- | ------------------------------------ |
| **`id`**       | <code>string</code>                  |
| **`document`** | <code>{ [key: string]: any; }</code> |


#### DatabaseArgs

| Prop       | Type                |
| ---------- | ------------------- |
| **`name`** | <code>string</code> |


#### DatabaseCopyArgs

| Prop          | Type                               |
| ------------- | ---------------------------------- |
| **`path`**    | <code>string</code>                |
| **`newName`** | <code>string</code>                |
| **`config`**  | <code>DatabaseConfiguration</code> |


#### DatabaseCreateIndexArgs

| Prop            | Type                |
| --------------- | ------------------- |
| **`indexName`** | <code>string</code> |
| **`index`**     | <code>any</code>    |


#### DatabaseDeleteIndexArgs

| Prop            | Type                |
| --------------- | ------------------- |
| **`indexName`** | <code>string</code> |


#### DatabaseExistsArgs

| Prop             | Type                |
| ---------------- | ------------------- |
| **`existsName`** | <code>string</code> |
| **`directory`**  | <code>string</code> |


#### DatabasePurgeDocumentArgs

| Prop        | Type                |
| ----------- | ------------------- |
| **`docId`** | <code>string</code> |


#### DatabaseDeleteDocumentArgs

| Prop                     | Type                                                              |
| ------------------------ | ----------------------------------------------------------------- |
| **`docId`**              | <code>string</code>                                               |
| **`document`**           | <code>{ [key: string]: any; }</code>                              |
| **`concurrencyControl`** | <code><a href="#concurrencycontrol">ConcurrencyControl</a></code> |


#### DatabaseGetDocumentArgs

| Prop        | Type                |
| ----------- | ------------------- |
| **`docId`** | <code>string</code> |


#### PluginListenerHandle

| Prop         | Type                      |
| ------------ | ------------------------- |
| **`remove`** | <code>() =&gt; any</code> |


#### DatabaseSetLogLevelArgs

| Prop           | Type                |
| -------------- | ------------------- |
| **`domain`**   | <code>string</code> |
| **`logLevel`** | <code>number</code> |


#### DatabaseSetFileLoggingConfigArgs

| Prop         | Type                                                                                          |
| ------------ | --------------------------------------------------------------------------------------------- |
| **`config`** | <code><a href="#databasefileloggingconfiguration">DatabaseFileLoggingConfiguration</a></code> |


#### DatabaseFileLoggingConfiguration

| Prop                 | Type                 |
| -------------------- | -------------------- |
| **`level`**          | <code>number</code>  |
| **`directory`**      | <code>string</code>  |
| **`maxRotateCount`** | <code>number</code>  |
| **`maxSize`**        | <code>number</code>  |
| **`usePlaintext`**   | <code>boolean</code> |


#### DatabaseGetBlobContentArgs

| Prop             | Type                |
| ---------------- | ------------------- |
| **`documentId`** | <code>string</code> |
| **`key`**        | <code>string</code> |


#### QueryExecuteArgs

| Prop        | Type             |
| ----------- | ---------------- |
| **`query`** | <code>any</code> |


#### ResultSetNextArgs

| Prop              | Type                |
| ----------------- | ------------------- |
| **`resultSetId`** | <code>string</code> |


#### ResultSetNextBatchArgs

| Prop              | Type                |
| ----------------- | ------------------- |
| **`resultSetId`** | <code>string</code> |


#### ResultSetAllResultsArgs

| Prop              | Type                |
| ----------------- | ------------------- |
| **`resultSetId`** | <code>string</code> |


#### ResultSetCleanupArgs

| Prop              | Type                |
| ----------------- | ------------------- |
| **`resultSetId`** | <code>string</code> |


#### ReplicatorCreateArgs

| Prop         | Type             |
| ------------ | ---------------- |
| **`config`** | <code>any</code> |


#### ReplicatorArgs

| Prop               | Type                |
| ------------------ | ------------------- |
| **`replicatorId`** | <code>string</code> |


### Enums


#### ConcurrencyControl

| Members                | Value          |
| ---------------------- | -------------- |
| **`LAST_WRITE_WINS`**  | <code>0</code> |
| **`FAIL_ON_CONFLICT`** | <code>1</code> |

</docgen-api>
