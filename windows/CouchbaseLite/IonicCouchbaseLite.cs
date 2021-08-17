using System;
using System.Reflection;
using System.Reflection.Emit;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Runtime.InteropServices;
using System.Runtime.CompilerServices;
using System.Diagnostics;

using Couchbase.Lite;
using Couchbase.Lite.Sync;
using Couchbase.Lite.Logging;
using Couchbase.Lite.Query;

using LiteCore;
using LiteCore.Util;
using LiteCore.Interop;

using Newtonsoft.Json.Linq;

using Capacitor;

namespace IonicCouchbaseLite {
    using Doc = Dictionary<string, object>;
    using ResolveFn = Func<object, bool, Task>;
    using RejectFn = Func<Exception, string, Task>;

    public class XQueryPatch {
        public static string Json { get; set; }
        public static string DbName { get; set; }

        private string EncodeAsJSON() {
            return Json;
        }

        private unsafe Dictionary<string, int> CreateColumnNames(object q) {
            string json = EncodeAsJSON();
            var parsed = JObject.Parse(json);
            JArray what = (JArray)parsed["WHAT"];
            var columns = new Dictionary<string, int>();

            int i = -1;
            foreach (var item in what) {
                i++;
                try {
                    JArray entry = (JArray)(item);
                    string column = (string)entry[0];
                    if (column != null) {
                        string columnName;
                        if (column == ".") {
                            columnName = DbName;
                        } else {
                            columnName = column.Substring(1);
                        }
                        columns[columnName] = i;
                    }
                } catch {
                    continue;
                }
            }

            return columns;
        }
    }


    public static class DynamicMojo {
        /// <summary>
        /// Swaps the function pointers for a and b, effectively swapping the method bodies.
        /// </summary>
        /// <exception cref="ArgumentException">
        /// a and b must have same signature
        /// </exception>
        /// <param name="a">Method to swap</param>
        /// <param name="b">Method to swap</param>
        public static void SwapMethodBodies(MethodInfo a, MethodInfo b) {
            /*
            if (!HasSameSignature(a, b)) {
              throw new ArgumentException("a and b must have have same signature");
            }
            */

            RuntimeHelpers.PrepareMethod(a.MethodHandle);
            RuntimeHelpers.PrepareMethod(b.MethodHandle);

            unsafe {
                if (IntPtr.Size == 4) {
                    int* inj = (int*)b.MethodHandle.Value.ToPointer() + 2;
                    int* tar = (int*)a.MethodHandle.Value.ToPointer() + 2;

                    Console.WriteLine("\nVersion x86 Release\n");
                    *tar = *inj;
                } else {

                    long* inj = (long*)b.MethodHandle.Value.ToPointer() + 1;
                    long* tar = (long*)a.MethodHandle.Value.ToPointer() + 1;
                    /*
                    if (Debugger.IsAttached) {
                      Console.WriteLine("\nVersion x64 Debug\n");
                      byte* injInst = (byte*)*inj;
                      byte* tarInst = (byte*)*tar;


                      int* injSrc = (int*)(injInst + 1);
                      int* tarSrc = (int*)(tarInst + 1);

                      *tarSrc = (((int)injInst + 5) + *injSrc) - ((int)tarInst + 5);
                    }
                    else {*/
                    Console.WriteLine("\nVersion x64 Release\n");
                    *tar = *inj;
                    //}
                }
            }
        }

        private static bool HasSameSignature(MethodInfo a, MethodInfo b) {
            bool sameParams = !a.GetParameters().Any(x => !b.GetParameters().Any(y => x == y));
            bool sameReturnType = a.ReturnType == b.ReturnType;
            return sameParams && sameReturnType;
        }
    }

    public static class DictUtils {
        public static TV GetValue<TK, TV>(this IDictionary<TK, TV> dict, TK key, TV defaultValue = default(TV)) {
            TV value;
            return dict.TryGetValue(key, out value) ? value : defaultValue;
        }
    }

    [CapacitorPlugin]
    public class IonicCouchbaseLite : Plugin {
        Dictionary<string, Database> openDatabases = new Dictionary<string, Database>();
        Dictionary<string, IResultSet> queryResultSets = new Dictionary<string, IResultSet>();
        Dictionary<string, IEnumerator<Result>> queryResultSetEnumerators = new Dictionary<string, IEnumerator<Result>>();
        Dictionary<string, Replicator> replicators = new Dictionary<string, Replicator>();
        Dictionary<string, ListenerToken> replicatorChangeListeners = new Dictionary<string, ListenerToken>();
        Dictionary<string, ListenerToken> replicatorDocumentListeners = new Dictionary<string, ListenerToken>();

        private int queryCount = 0;
        private int replicatorCount = 0;

        private int allResultsChunkSize = 256;

        public IonicCouchbaseLite() {
            PatchQuery();
            // Database.SetLogLevel(LogDomain.All, LogLevel.Verbose);
        }

        private Database getDatabase(string name) {
            if (openDatabases.ContainsKey(name)) {
                return openDatabases[name];
            }
            return null;
        }

        void PatchQuery() {
            var DLL = Assembly.Load("Couchbase.Lite");

            Type native = DLL.GetType("Couchbase.Lite.Internal.Query.XQuery");


            var xqpType = typeof(XQueryPatch);
            var methodToReplace = native.GetMethod("EncodeAsJSON", BindingFlags.Instance | BindingFlags.Static | BindingFlags.NonPublic | BindingFlags.Public);
            var methodToInject = xqpType.GetMethod("EncodeAsJSON", BindingFlags.Instance | BindingFlags.Static | BindingFlags.NonPublic | BindingFlags.Public);
            DynamicMojo.SwapMethodBodies(methodToReplace, methodToInject);

            var methodToReplace2 = native.GetMethod("CreateColumnNames", BindingFlags.Instance | BindingFlags.Static | BindingFlags.NonPublic | BindingFlags.Public);
            var methodToInject2 = xqpType.GetMethod("CreateColumnNames", BindingFlags.Instance | BindingFlags.Static | BindingFlags.NonPublic | BindingFlags.Public);
            DynamicMojo.SwapMethodBodies(methodToReplace2, methodToInject2);
        }

        public void Plugin_Configure(Doc config, ResolveFn resolve, RejectFn reject) {
            var chunkSizeVal = (long)config.GetValueOrDefault("allResultsChunkSize", 256L);
            allResultsChunkSize = Convert.ToInt32(chunkSizeVal);
            resolve.Invoke(null, false);
        }

        [PluginMethod(PluginMethodReturnType.Promise)]
        public void Database_Open(PluginCall call) {
            var name = call.GetString("name");
            var config = call.GetObject("config");

            DatabaseConfiguration dbConfig = buildDBConfig(config);

            try {
                var db = new Database(name, dbConfig);
                openDatabases[name] = db;
            } catch (Exception e) {
                call.Reject("Unable to open database", e);
                return;
            }
            call.Resolve();
        }

        private DatabaseConfiguration buildDBConfig(Doc config) {
            DatabaseConfiguration c = new DatabaseConfiguration();

            var encKey = DictUtils.GetValue(config, "encryptionKey") as string;
            var directory = DictUtils.GetValue(config, "directory") as string;
            if (directory != null) {
                c.Directory = directory;
            }
            if (encKey != null) {
                c.EncryptionKey = new EncryptionKey(encKey);
            }
            return c;
        }


        [PluginMethod(PluginMethodReturnType.Promise)]
        public void Database_Exists(PluginCall call) {
            var dbName = call.GetString("name");
            var existsName = call.GetString("existsName");
            var directory = call.GetString("directory");

            var db = getDatabase(dbName);
            if (db == null) {
                call.Reject("Database not found");
                return;
            }
            call.Resolve(new JSObject() {
                {  "existsName", Database.Exists(existsName, directory) }
            });
        }


        [PluginMethod(PluginMethodReturnType.Promise)]
        public void Database_Save(PluginCall call) {
            var dbName = call.GetString("name");
            var id = call.GetString("id");
            var document = call.GetObject("document");
            var db = getDatabase(dbName);
            if (db == null) {
                call.Reject("Database not found");
                return;
            }

            MutableDocument m;
            if (id != null) {
                m = new MutableDocument(id, jsonWithCBLObjects(document));
            } else {
                m = new MutableDocument(jsonWithCBLObjects(document));
            }

            db.Save(m);

            call.Resolve(new JSObject() {
                {
                    "document", new Doc {
                        { "_id", m.Id }
                    }
                }
            });
        }

        private Doc jsonWithCBLObjects(Doc document) {
            return document;
            /*
            var items  = new Doc();
            foreach(var item in document) {
              var key = item.Key;
              var value = item.Value;


              // var t = value.GetType();
              if (value is JObject) {
                var subValue = (JObject) value;
                var typeToken = subValue["_type"];

                if (typeToken != null) {
                  var type = typeToken.ToObject<string>();

                  if (type == "blob") {
                    var blobData = (Doc) subValue["data"].ToObject<Dictionary<string, object>>();
                    var contentType = blobData["contentType"];
                    var byteData = ((JArray) blobData["data"]).ToObject<byte[]>();
                    var blob = new Blob((string) contentType, byteData);
                    items[key] = blob;
                    continue;
                  }
                }
              }

              items[key] = value;
            }


            return items;
            */
        }

        public void Database_Close(string dbName, ResolveFn resolve, RejectFn reject) {
            var db = getDatabase(dbName);
            if (db == null) {
                reject(null, "Database not found");
                return;
            }
            db.Close();
            resolve(null, false);
        }

        public void Database_Compact(string dbName, ResolveFn resolve, RejectFn reject) {
            var db = getDatabase(dbName);
            if (db == null) {
                reject(null, "Database not found");
                return;
            }
            db.Compact();
            resolve(null, false);
        }

        public void Database_Delete(string dbName, ResolveFn resolve, RejectFn reject) {
            var db = getDatabase(dbName);
            if (db == null) {
                reject(null, "Database not found");
                return;
            }
            db.Delete();
            resolve(null, false);
        }

        public void Database_GetPath(string dbName, ResolveFn resolve, RejectFn reject) {
            var db = getDatabase(dbName);
            if (db == null) {
                reject(null, "Database not found");
                return;
            }
            resolve(db.Path, false);
        }

        public void Database_GetCount(string dbName, ResolveFn resolve, RejectFn reject) {
            var db = getDatabase(dbName);
            if (db == null) {
                reject(null, "Database not found");
                return;
            }
            resolve(db.Count, false);
        }

        public void Database_AddChangeListener(string dbName, ResolveFn resolve, RejectFn reject) {
            var db = getDatabase(dbName);
            if (db == null) {
                reject(null, "Database not found");
                return;
            }

            db.AddChangeListener((object sender, DatabaseChangedEventArgs e) => {
                resolve(new Dictionary<string, object> {
          { "documentIDs", e.DocumentIDs }
        }, true);
            });
        }


        void HandleEventHandler(object sender, DatabaseChangedEventArgs e) {
        }

        public void Database_Copy(string dbName, string path, string name2, Doc config, ResolveFn resolve, RejectFn reject) {
            DatabaseConfiguration dbConfig = buildDBConfig(config);

            Database.Copy(path, name2, dbConfig);

            resolve(null, false);
        }

        public void Database_DeleteDocument(string dbName, string id, Doc document, ResolveFn resolve, RejectFn reject) {
            var db = getDatabase(dbName);
            if (db == null) {
                reject(null, "Database not found");
                return;
            }
            Document d = db.GetDocument(id);

            if (d == null) {
                // TODO: throw
                return;
            }

            db.Delete(d);
            resolve(null, false);
        }

        public void Database_PurgeDocument(string dbName, string id, ResolveFn resolve, RejectFn reject) {
            var db = getDatabase(dbName);
            if (db == null) {
                reject(null, "Database not found");
                return;
            }
            db.Purge(id);
            resolve(null, false);
        }

        public void Database_GetDocument(string dbName, string documentId, ResolveFn resolve, RejectFn reject) {
            var db = getDatabase(dbName);
            if (db == null) {
                reject(null, "Database not found");
                return;
            }
            Document d = db.GetDocument(documentId);

            if (d != null) {
                string docId = d.Id;

                Doc docDict = new Doc();
                docDict["_sequence"] = d.Sequence;
                docDict["_data"] = documentToJson(d);
                docDict["_id"] = docId;
                resolve(docDict, false);
            } else {
                resolve(null, false);
            }
        }

        private Doc documentToJson(Document d) {
            return documentDictToJson(d.ToDictionary());
        }

        private Doc documentDictToJson(Doc documentAsMap) {
            return documentAsMap;
            /*
            var docMap = new Doc();
            foreach (var item in documentAsMap) {
              var key = item.Key;
              var value = item.Value;

              if (value != null) {
                var t = value.GetType();

                if (value is Blob) {
                  docMap[key] = ((Blob) value).Properties;
                } else if(t.IsGenericType && t.GetGenericTypeDefinition() == typeof(Dictionary<,>)) {
                  docMap[key] = documentDictToJson((Doc) value);
                } else {
                  docMap[key] = value;
                }
              } else {
                docMap[key] = null;
              }
            }
            return docMap;
            */
        }

        public void Database_SetLogLevel(string dbName, string domainValue, Int64 logLevelValue, ResolveFn resolve, RejectFn reject) {
            LogLevel logLevel = (LogLevel)logLevelValue;
            LogDomain domain = LogDomain.All;

            switch (domainValue) {
                case "ALL": domain = LogDomain.All; break;
                case "DATABASE": domain = LogDomain.Database; break;
                case "QUERY": domain = LogDomain.Query; break;
                case "NETWORK": domain = LogDomain.Network; break;
                case "REPLICATOR": domain = LogDomain.Replicator; break;
            }

            Database.SetLogLevel(domain, logLevel);
            resolve(null, false);
        }

        private LogLevel GetLogLevel(int logLevelValue) {
            switch (logLevelValue) {
                case 0: return LogLevel.Debug;
                case 1: return LogLevel.Verbose;
                case 2: return LogLevel.Info;
                case 3: return LogLevel.Warning;
                case 4: return LogLevel.Error;
                case 5: return LogLevel.None;
            }
            return LogLevel.Debug;
        }

        public void Database_SetFileLoggingConfig(string dbName, Doc config, ResolveFn resolve, RejectFn reject) {
            Console.WriteLine($"Setting file logging config");
            Console.WriteLine(config);
            var db = getDatabase(dbName);
            if (db == null) {
                reject(null, "Database not found");
                return;
            }

            var levelValue = DictUtils.GetValue(config, "level") as int?;

            var directory = DictUtils.GetValue(config, "directory") as string;
            var maxRotateCount = DictUtils.GetValue(config, "maxRotateCount") as int? ?? -1;
            var maxSize = DictUtils.GetValue(config, "maxSize") as int? ?? -1;
            var usePlaintext = DictUtils.GetValue(config, "usePlaintext");

            LogFileConfiguration fileConfig = new LogFileConfiguration(directory);
            if (maxRotateCount >= 0) {
                fileConfig.MaxRotateCount = maxRotateCount;
            }
            if (maxSize >= 0) {
                fileConfig.MaxSize = maxSize;
            }
            if (usePlaintext != null) {
                fileConfig.UsePlaintext = (Boolean)usePlaintext;
            }

            Database.Log.File.Config = fileConfig;

            if (levelValue != null) {
                LogLevel logLevel = GetLogLevel((int)levelValue);
                Database.Log.File.Level = logLevel;
            }

            Console.WriteLine("Set config!");
            resolve(null, false);
        }

        public void Database_CreateIndex(string dbName, string indexName, Doc indexData, ResolveFn resolve, RejectFn reject) {
            var db = getDatabase(dbName);
            if (db == null) {
                reject(null, "Database not found");
                return;
            }
            string type = DictUtils.GetValue(indexData, "type") as string;
            var itemType = DictUtils.GetValue(indexData, "items") as JArray;
            var items = itemType.Select(jv => jv.ToObject<object[]>()).ToArray();

            IIndex index = null;
            if (type == "value") {
                index = IndexBuilder.ValueIndex(makeValueIndexItems(items));
            } else if (type == "full-text") {
                index = IndexBuilder.FullTextIndex(makeFullTextIndexItems(items));
            }

            db.CreateIndex(indexName, index);
            resolve(null, false);
        }

        private IValueIndexItem[] makeValueIndexItems(object[] items) {
            var valueItems = new List<IValueIndexItem>();
            foreach (object[] item in items) {
                //var itemDict = item as object[];
                var strEntry = item[0] as string;
                var propName = strEntry.Substring(1);
                valueItems.Add(ValueIndexItem.Property(propName));
            }
            return valueItems.ToArray();
        }

        private IFullTextIndexItem[] makeFullTextIndexItems(object[] items) {
            var valueItems = new List<IFullTextIndexItem>();
            foreach (object[] item in items) {
                var strEntry = item[0] as string;
                var propName = strEntry.Substring(1);
                valueItems.Add(FullTextIndexItem.Property(propName));
            }
            return valueItems.ToArray();
        }

        public void Database_DeleteIndex(string dbName, string indexName, ResolveFn resolve, RejectFn reject) {
            var db = getDatabase(dbName);
            if (db == null) {
                reject(null, "Database not found");
                return;
            }
            db.DeleteIndex(indexName);
            resolve(null, false);
        }

        public void Database_GetIndexes(string dbName, ResolveFn resolve, RejectFn reject) {
            var db = getDatabase(dbName);
            if (db == null) {
                reject(null, "Database not found");
                return;
            }
            resolve(db.GetIndexes(), false);
        }

        public void Document_GetBlobContent(string dbName, string documentId, string key, ResolveFn resolve, RejectFn reject) {
            Database db = getDatabase(dbName);
            if (db == null) {
                reject(null, "Database not found");
                return;
            }

            Document d = db.GetDocument(documentId);

            if (d == null) {
                reject(null, "No such document");
                return;
            }

            var blob = d.GetBlob(key);
            if (blob == null) {
                reject(null, "No blob found in document");
                return;
            }

            var content = blob.Content;
            resolve(new List<Byte>(content), false);
        }

        public void Query_Execute(string dbName, string json, ResolveFn resolve, RejectFn reject) {
            Database db = getDatabase(dbName);
            if (db == null) {
                reject(null, "Database not found");
                return;
            }
            XQueryPatch.Json = json;
            XQueryPatch.DbName = dbName;
            var query = QueryBuilder.Select(SelectResult.All()).From(DataSource.Database(db));
            var rs = query.Execute();

            queryResultSets["" + queryCount] = rs;

            var queryId = queryCount;
            queryCount++;

            resolve(new Dictionary<string, object> {
        { "id", queryId }
      }, false);
        }

        public void ResultSet_Next(string dbName, long resultSetId, ResolveFn resolve, RejectFn reject) {
            Database db = getDatabase(dbName);
            if (db == null) {
                reject(null, "Database not found");
                return;
            }

            IEnumerator<Result> e = null;
            var rsId = "" + resultSetId;

            if (queryResultSets.ContainsKey(rsId)) {
                if (queryResultSetEnumerators.ContainsKey(rsId)) {
                    e = queryResultSetEnumerators[rsId];
                } else {
                    var rs = queryResultSets[rsId];
                    e = rs.GetEnumerator();
                    queryResultSetEnumerators[rsId] = e;
                }

                if (e.MoveNext()) {
                    var result = e.Current;
                    if (result != null) {
                        var resultDict = documentDictToJson(result.ToDictionary());
                        resolve(resultDict, false);
                        return;
                    }
                }
            }

            resolve(null, false);
        }

        public void ResultSet_NextBatch(string dbName, long resultSetId, ResolveFn resolve, RejectFn reject) {
            Database db = getDatabase(dbName);
            if (db == null) {
                reject(null, "Database not found");
                return;
            }

            IEnumerator<Result> e = null;
            var rsId = "" + resultSetId;

            if (queryResultSets.ContainsKey(rsId)) {
                if (queryResultSetEnumerators.ContainsKey(rsId)) {
                    e = queryResultSetEnumerators[rsId];
                } else {
                    var rs = queryResultSets[rsId];
                    e = rs.GetEnumerator();
                    queryResultSetEnumerators[rsId] = e;
                }

                var i = 0;
                int chunkSize = allResultsChunkSize;
                var resultsChunk = new List<Doc>(chunkSize);

                Result result = null;
                while (i++ < chunkSize && e.MoveNext()) {
                    result = e.Current;
                    if (result != null) {
                        var resultDict = documentDictToJson(result.ToDictionary());
                        resultsChunk.Add(resultDict);
                    }
                }
                resolve(resultsChunk, false);
            } else {
                resolve(new List<Doc>(), false);
            }

        }

        public void ResultSet_AllResults(string dbName, long resultSetId, ResolveFn resolve, RejectFn reject) {
            var db = getDatabase(dbName);
            if (db == null) {
                reject(null, "Database not found");
                return;
            }

            var docs = new List<Doc>();

            var rsId = "" + resultSetId;

            if (queryResultSets.ContainsKey(rsId)) {
                var rs = queryResultSets["" + resultSetId];
                foreach (var r in rs.AllResults()) {
                    docs.Add(documentDictToJson(r.ToDictionary()));
                }
            }

            resolve(docs.ToArray(), true);

            // Send empty list to end the response
            resolve(new List<Doc>(), false);
        }

        public void ResultSet_Cleanup(string dbName, long resultSetId, ResolveFn resolve, RejectFn reject) {
            var rsId = "" + resultSetId;

            if (queryResultSets.ContainsKey(rsId)) {
                queryResultSets.Remove(rsId);
            }
            resolve(null, false);
        }

        public void Replicator_Create(string dbName, Doc config, ResolveFn resolve, RejectFn reject) {
            Console.WriteLine("Replicator Create!");
            Database db = getDatabase(dbName);
            if (db == null) {
                reject(null, "Database not found");
                return;
            }

            var replicatorConfig = replicatorConfigFromJson(db, config);
            var replicator = new Replicator(replicatorConfig);

            var id = replicatorCount++;

            replicators["" + id] = replicator;
            resolve(new Dictionary<string, object> {
        { "replicatorId", "" + id }
      }, false);
        }

        public void Replicator_Start(string replicatorId, ResolveFn resolve, RejectFn reject) {
            Console.WriteLine("Replicator Start!");
            if (replicators.ContainsKey(replicatorId)) {
                Replicator r = replicators[replicatorId];
                r.Start();
            }
            resolve(null, false);
        }

        private ReplicatorConfiguration replicatorConfigFromJson(Database db, Doc json) {
            var authenticatorDataJ = json["authenticator"] as JObject;
            var authenticatorData = authenticatorDataJ.ToObject<Dictionary<string, object>>();

            var authenticatorType = authenticatorData["type"] as string;
            var targetJ = json["target"] as JObject;
            if (targetJ == null) {
                // TODO: Throw
                throw new IonicCouchbaseLiteException("Missing target");
            }

            var target = targetJ.ToObject<Dictionary<string, object>>();

            var url = target["url"] as string;
            var replicatorType = json["replicatorType"] as string;
            var continuous = json["continuous"] as bool?;

            var endpoint = new URLEndpoint(new Uri(url));

            var config = new ReplicatorConfiguration(db, endpoint);

            if (json.ContainsKey("channels")) {
                var channels = json["channels"] as string[];

                if (channels != null) {
                    config.Channels = channels;
                }
            }

            if (replicatorType == "PUSH_AND_PULL") {
                config.ReplicatorType = ReplicatorType.PushAndPull;
            } else if (replicatorType == "PULL") {
                config.ReplicatorType = ReplicatorType.Pull;
            } else if (replicatorType == "PUSH") {
                config.ReplicatorType = ReplicatorType.Push;
            }

            if (continuous.HasValue) {
                config.Continuous = continuous.Value;
            }


            Authenticator authenticator = this.replicatorAuthenticatorFromConfig(authenticatorData);
            if (authenticator != null) {
                config.Authenticator = authenticator;
            }
            return config;
        }

        private Authenticator replicatorAuthenticatorFromConfig(Doc config) {
            var type = config["type"] as string;
            var dataJ = config["data"] as JObject;
            var data = dataJ.ToObject<Dictionary<string, object>>();
            if (type == "session") {
                var sessionID = data["sessionID"] as string;
                var cookieName = data["cookieName"] as string;
                return new SessionAuthenticator(sessionID, cookieName);
            } else if (type == "basic") {
                var username = data["username"] as string;
                var password = data["password"] as string;
                return new BasicAuthenticator(username, password);
            }
            return null;
        }

        public void Replicator_Restart(string replicatorId, ResolveFn resolve, RejectFn reject) {
            Console.WriteLine($"Restarting. {replicatorId}");
            if (replicators.ContainsKey(replicatorId)) {
                Replicator r = replicators[replicatorId];
                Console.WriteLine($"Restart got it {replicatorId}");
                r.Start();
            }
            resolve(null, false);
        }

        public void Replicator_Stop(string replicatorId, ResolveFn resolve, RejectFn reject) {
            Console.WriteLine($"Stopping replicator. {replicatorId}");
            if (replicators.ContainsKey(replicatorId)) {
                Replicator r = replicators[replicatorId];
                Console.WriteLine($"Stop got it {replicatorId}");
                r.Stop();
            }
            resolve(null, false);
        }


        public void Replicator_ResetCheckpoint(string replicatorId, ResolveFn resolve, RejectFn reject) {
            Console.WriteLine($"Resetting replicator checkpoint. {replicatorId}");
            if (replicators.ContainsKey(replicatorId)) {
                Replicator r = replicators[replicatorId];
                Console.WriteLine($"Got it here");
                r.ResetCheckpoint();
            }
            resolve(null, false);
        }

        public void Replicator_GetStatus(string replicatorId, ResolveFn resolve, RejectFn reject) {
            if (replicators.ContainsKey(replicatorId)) {
                Replicator r = replicators[replicatorId];
                var status = r.Status;
                var statusJson = generateStatusJson(status);
                resolve(statusJson, false);
            } else {
                resolve(null, false);
            }
        }

        private Doc generateStatusJson(ReplicatorStatus status) {
            var error = status.Error;
            var errorJson = new Dictionary<string, dynamic>();
            if (error != null) {
                CouchbaseException ex = (CouchbaseException)error;
                errorJson = new Dictionary<string, dynamic> {
          { "code", ex.Error },
          { "domain", ex.Domain},
          { "info", ex.Data }
        };
            }

            return new Dictionary<string, dynamic> {
        { "activityLevel", status.Activity },
        { "error", errorJson },
        {
          "progress", new Dictionary<string, object> {
            { "completed", status.Progress.Completed },
            { "total", status.Progress.Total }
          }
        }
      };
        }

        public void Replicator_AddChangeListener(string replicatorId, ResolveFn resolve, RejectFn reject) {
            Replicator r;
            if (replicators.ContainsKey(replicatorId)) {
                r = replicators[replicatorId];
            } else {
                reject(null, "No such replicator");
                return;
            }

            var listener = r.AddChangeListener((object sender, ReplicatorStatusChangedEventArgs e) => {
                resolve(generateStatusJson(e.Status), true);
            });

            replicatorChangeListeners.Add(replicatorId, listener);
        }

        private Doc generateReplicationJson(DocumentReplicationEventArgs replication) {
            var docs = new List<Doc>();

            foreach (var doc in replication.Documents) {
                var flags = new List<string>();

                if (doc.Flags.HasFlag(DocumentFlags.Deleted)) {
                    flags.Add("DELETED");
                }
                if (doc.Flags.HasFlag(DocumentFlags.AccessRemoved)) {
                    flags.Add("ACCESS_REMOVED");
                }

                var documentDictionary = new Doc();
                documentDictionary["id"] = doc.Id;
                documentDictionary["flags"] = flags;

                if (doc.Error != null) {
                    var ex = doc.Error;
                    documentDictionary["error"] = new Dictionary<string, dynamic> {
            { "code", ex.Error },
            { "domain", ex.Domain},
            { "message", ex.Data }
          };
                }

                docs.Add(documentDictionary);
            }

            var direction = replication.IsPush ? "PUSH" : "PULL";
            return new Dictionary<string, dynamic> {
        { "direction", direction },
        { "documents", docs }
      };
        }

        public void Replicator_AddDocumentListener(string replicatorId, ResolveFn resolve, RejectFn reject) {
            Replicator r;
            if (replicators.ContainsKey(replicatorId)) {
                r = replicators[replicatorId];
            } else {
                reject(null, "No such replicator");
                return;
            }

            var listener = r.AddDocumentReplicationListener((object sender, DocumentReplicationEventArgs e) => {
                resolve(generateReplicationJson(e), true);
            });

            replicatorDocumentListeners.Add(replicatorId, listener);
        }

        public void Replicator_Cleanup(string replicatorId, ResolveFn resolve, RejectFn reject) {
            Replicator r;
            if (replicators.ContainsKey(replicatorId)) {
                r = replicators[replicatorId];
            } else {
                reject(null, "No such replicator");
                return;
            }

            if (replicatorChangeListeners.ContainsKey(replicatorId)) {
                var token = replicatorChangeListeners[replicatorId];
                r.RemoveChangeListener(token);
                replicatorChangeListeners.Remove(replicatorId);
            }

            if (replicatorDocumentListeners.ContainsKey(replicatorId)) {
                var token = replicatorDocumentListeners[replicatorId];
                r.RemoveChangeListener(token);
                replicatorDocumentListeners.Remove(replicatorId);
            }

            replicators.Remove(replicatorId);
            resolve(null, false);
        }

    }

    class IonicCouchbaseLiteException : Exception {
        //public string message;
        internal IonicCouchbaseLiteException(string message) : base(message) { }
    }
}