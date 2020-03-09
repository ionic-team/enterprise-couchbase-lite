package com.ionicframework.couchbase;

import android.support.annotation.NonNull;
import android.util.Log;
import android.util.Pair;

import com.couchbase.lite.AbstractReplicator;
import com.couchbase.lite.Authenticator;
import com.couchbase.lite.BasicAuthenticator;
import com.couchbase.lite.Blob;
import com.couchbase.lite.ConcurrencyControl;
import com.couchbase.lite.CouchbaseLite;
import com.couchbase.lite.CouchbaseLiteException;
import com.couchbase.lite.Database;
import com.couchbase.lite.DatabaseChange;
import com.couchbase.lite.DatabaseChangeListener;
import com.couchbase.lite.DatabaseConfiguration;
import com.couchbase.lite.Document;
import com.couchbase.lite.EncryptionKey;
import com.couchbase.lite.Endpoint;
import com.couchbase.lite.FullTextIndexItem;
import com.couchbase.lite.Index;
import com.couchbase.lite.IndexBuilder;
import com.couchbase.lite.ListenerToken;
import com.couchbase.lite.LogDomain;
import com.couchbase.lite.LogFileConfiguration;
import com.couchbase.lite.LogLevel;
import com.couchbase.lite.MutableArray;
import com.couchbase.lite.MutableDictionary;
import com.couchbase.lite.MutableDocument;
import com.couchbase.lite.Query;
import com.couchbase.lite.QueryChange;
import com.couchbase.lite.QueryChangeListener;
import com.couchbase.lite.Replicator;
import com.couchbase.lite.ReplicatorChange;
import com.couchbase.lite.ReplicatorChangeListener;
import com.couchbase.lite.ReplicatorConfiguration;
import com.couchbase.lite.Result;
import com.couchbase.lite.ResultSet;
import com.couchbase.lite.SessionAuthenticator;
import com.couchbase.lite.URLEndpoint;
import com.couchbase.lite.ValueIndexItem;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.lang.reflect.Method;
import java.net.URI;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;

@SuppressWarnings("unused")
public class IonicCouchbaseLite extends CordovaPlugin {
  private static final String TAG = "IonicCouchbaseLite";

  Class<IonicCouchbaseLite> myClass;

  private Map<String, Database> openDatabases = new HashMap<>();
  private Map<Number, ResultSet> queryResultSets = new HashMap<>();
  private Map<Number, Pair<ListenerToken, Query>> liveQueries = new HashMap<>();
  private Map<Number, Replicator> replicators = new HashMap<>();
  private Map<Number, ListenerToken> replicatorListeners = new HashMap<>();

  /**
   * HashMap of database listeners. Key = database name.
   *
   * There is only ever one listener per database--multiple listeners are handled in JS.
   */
  private Map<String, ListenerToken> databaseListeners = new HashMap<>();

  private int queryCount = 0;
  private int liveQueryCount = 0;
  private int replicatorCount = 0;
  private int allResultsChunkSize = 256;

  @Override
  public void pluginInitialize() {
    this.myClass = (Class<IonicCouchbaseLite>) this.getClass();
    CouchbaseLite.init(cordova.getContext());
  }

  public boolean execute(final String action, final JSONArray args, final CallbackContext callbackContext) throws JSONException {
    Log.d(TAG, "IonicCouchbaseLite execute - " + action);
    final IonicCouchbaseLite cbl = this;

    if (action.equals("Database_Open")) {
      // Run these on the main thread
      try {
        Database_Open(args, callbackContext);
        return true;
      } catch (Exception ex) {
        // Handle
        Log.e(TAG, "Unable to open database", ex);
        // TODO: Perhaps some more nuance
        callbackContext.error(ex.getMessage());
        return true;
      }
    }

    if (action.equals("Database_Delete")) {
      // Run these on the main thread
      try {
        Database_Delete(args, callbackContext);
        return true;
      } catch (Exception ex) {
        // Handle
        Log.e(TAG, "Unable to delete database", ex);
        // TODO: Perhaps some more nuance
        callbackContext.error(ex.getMessage());
        return true;
      }
    }

    this.cordova.getThreadPool().execute(new Runnable() {
      @Override
      public void run() {
        try {
          Method actionHandle = myClass.getMethod(action, JSONArray.class, CallbackContext.class);
          actionHandle.invoke(cbl, args, callbackContext);
        } catch (Exception ex) {
          // Handle
          Log.e(TAG, "Unable to execute action", ex);
          // TODO: Perhaps some more nuance
          callbackContext.error(ex.getMessage());
        }
      }
    });
    return true;
  }

  private Database getDatabase(String name) {
    return this.openDatabases.get(name);
  }

  private Map<String, Object> documentToMap(Document d) {
    Map<String, Object> docMap = new HashMap<>();

    Map<String, Object> documentAsMap = d.toMap();

    Map<String, Object> finalDocumentMap = new HashMap<>();

    for (String key : documentAsMap.keySet()) {
      Object value = documentAsMap.get(key);
      if (value instanceof Blob) {
        finalDocumentMap.put(key, ((Blob) value).getProperties());
      } else {
        finalDocumentMap.put(key, value);
      }
    }

    docMap.put("_data", finalDocumentMap);
    docMap.put("_id", d.getId());
    docMap.put("_sequence", d.getSequence());
    return docMap;
  }

  private Map<String, Object> resultToMap(Result result) {
    Map<String, Object> data = result.toMap();

    if (data.containsKey("_id")) {
      data.put("id", data.get("_id"));
      data.remove("_id");
    }

    if (data.containsKey("_sequence")) {
      data.put("sequence", data.get("_sequence"));
      data.remove("_sequence");
    }

    if (data.containsKey("_deleted")) {
      data.put("deleted", data.get("_deleted"));
      data.remove("_deleted");
    }

    if (data.containsKey("_expiration")) {
      data.put("expiration", data.get("_expiration"));
      data.remove("_expiration");
    }

    return data;
  }

  private void resolve(final CallbackContext callbackContext) {
    PluginResult result = new PluginResult(PluginResult.Status.OK);
    callbackContext.sendPluginResult(result);
  }

  private void resolve(final CallbackContext callbackContext, JSONObject data) {
    PluginResult result = new PluginResult(PluginResult.Status.OK, data);
    callbackContext.sendPluginResult(result);
  }

  private void resolve(final CallbackContext callbackContext, JSONArray data) {
    PluginResult result = new PluginResult(PluginResult.Status.OK, data);
    callbackContext.sendPluginResult(result);
  }

  private void resolve(final CallbackContext callbackContext, String message) {
    PluginResult result = new PluginResult(PluginResult.Status.OK, message);
    callbackContext.sendPluginResult(result);
  }

  private void resolve(final CallbackContext callbackContext, int number) {
    PluginResult result = new PluginResult(PluginResult.Status.OK, number);
    callbackContext.sendPluginResult(result);
  }

  private void resolve(final CallbackContext callbackContext, long number) {
    PluginResult result = new PluginResult(PluginResult.Status.OK, number);
    callbackContext.sendPluginResult(result);
  }

  private void reject(final CallbackContext callbackContext, JSONObject data) {
    PluginResult result = new PluginResult(PluginResult.Status.ERROR, data);
    callbackContext.sendPluginResult(result);
  }

  private void reject(final CallbackContext callbackContext, String message) {
    PluginResult result = new PluginResult(PluginResult.Status.ERROR, message);
    callbackContext.sendPluginResult(result);
  }

  private void resolve(final CallbackContext callbackContext, boolean value) {
    PluginResult result = new PluginResult(PluginResult.Status.ERROR, value);
    callbackContext.sendPluginResult(result);
  }

  private JSONObject json(Map<String, Object> data) {
    return new JSONObject(data);
  }

  private JSONArray jsonArray(List<Map<String, Object>> data) {
    return new JSONArray(data);
  }

  private Map<String, Object> toMap(JSONObject o) throws JSONException {
    Map<String, Object> items = new HashMap<>();

    Iterator<String> keys = o.keys();
    while (keys.hasNext()) {
      String key = keys.next();
      Object value = o.get(key);
      if (value.equals(null)) {
        items.put(key, null);
      } else if (value instanceof JSONObject) {
        JSONObject subValue = (JSONObject) value;
        String type = subValue.optString("_type");

        // Handle blobs
        if (type != null && type.equals("blob")) {
          JSONObject blobData = subValue.getJSONObject("data");
          String contentType = blobData.getString("contentType");
          JSONArray byteData = blobData.getJSONArray("data");
          byte[] data = new byte[byteData.length()];
          for (int i = 0; i < byteData.length(); i++) {
            data[i] = ((Integer) byteData.get(i)).byteValue();
          }
          items.put(key, new Blob(contentType, data));
        } else {
          MutableDictionary d = new MutableDictionary(toMap((JSONObject) value));
          items.put(key, d);
        }
      } else if (value instanceof JSONArray) {
        JSONArray a = (JSONArray) value;
        MutableArray ma = new MutableArray();
        for (int i = 0; i < a.length(); i++) {
          Object ov = a.get(i);
          if (ov.equals(null)) {
            ma.addValue(null);
          } else if (ov instanceof JSONObject) {
            MutableDictionary d = new MutableDictionary(toMap((JSONObject) ov));
            ma.addDictionary(d);
          } else {
            ma.addValue(ov);
          }
        }
        items.put(key, ma);
      } else {
        items.put(key, o.get(key));
      }
    }
    return items;
  }

  private <T> String getQueryJson(T q) {
    try {
      Method method = (q.getClass().getSuperclass()).getDeclaredMethod("encodeAsJSON");
      method.setAccessible(true);
      return (String) method.invoke(q);
    } catch (Exception ex) {
    }
    return null;
  }

  public static boolean areEqual(String s1, String s2) {
    try {
      JSONObject obj1 = new JSONObject(s1);
      JSONObject obj2 = new JSONObject(s2);
      Object obj1Converted = convertJsonElement(obj1);
      Object obj2Converted = convertJsonElement(obj2);
      return obj1Converted.equals(obj2Converted);
    } catch (JSONException ex) {
    }
    return false;
  }

  private static Object convertJsonElement(Object elem) throws JSONException {
    if (elem instanceof JSONObject) {
      JSONObject obj = (JSONObject) elem;
      Iterator<String> keys = obj.keys();
      Map<String, Object> jsonMap = new HashMap<>();
      while (keys.hasNext()) {
        String key = keys.next();
        jsonMap.put(key, convertJsonElement(obj.get(key)));
      }
      return jsonMap;
    } else if (elem instanceof JSONArray) {
      JSONArray arr = (JSONArray) elem;
      Set<Object> jsonSet = new HashSet<>();
      for (int i = 0; i < arr.length(); i++) {
        jsonSet.add(convertJsonElement(arr.get(i)));
      }
      return jsonSet;
    } else {
      return elem;
    }
  }

  public void Plugin_Configure(JSONArray args, final CallbackContext callbackContext) throws JSONException, CouchbaseLiteException {
    JSONObject config = config = args.getJSONObject(0);
    int chunkSize = config.optInt("allResultsChunkSize", 256);
    this.allResultsChunkSize = chunkSize;
  }

  @SuppressWarnings("unused")
  public void Database_Open(JSONArray args, final CallbackContext callbackContext) throws JSONException, CouchbaseLiteException {
    String name = args.getString(0);
    JSONObject config = new JSONObject();
    if (args.length() > 1) {
      config = args.getJSONObject(1);
    }
    Log.d(TAG, "Opening database: " + name);

    DatabaseConfiguration c = new DatabaseConfiguration();

    String directory = config.optString("directory", null);

    String encKey = config.optString("encryptionKey", null);
    if (directory != null) {
      c.setDirectory(directory);
    }
    if (encKey != null) {
      c.setEncryptionKey(new EncryptionKey(encKey));
    }

    Database d = new Database(name, c);

    this.openDatabases.put(name, d);

    resolve(callbackContext);
  }

  public void Database_Exists(JSONArray args, final CallbackContext callbackContext) throws JSONException, CouchbaseLiteException {
    String name = args.getString(0);
    Database d = getDatabase(name);
    if (d == null) {
      reject(callbackContext, "No such database");
      return;
    }
    String existsName = args.getString(1);
    String directory = args.getString(2);
    boolean exists = d.exists(existsName, new File(directory));
    resolve(callbackContext, exists);
  }

  @SuppressWarnings("unused")
  public void Database_Save(JSONArray args, final CallbackContext callbackContext) throws JSONException, CouchbaseLiteException {
    String name = args.getString(0);
    String id = args.getString(1);
    JSONObject document = args.getJSONObject(2);
    int concurrencyControlValue = args.optInt(3, ConcurrencyControl.LAST_WRITE_WINS.getValue());
    Database d = getDatabase(name);
    if (d == null) {
      reject(callbackContext, "No such database");
      return;
    }

    ConcurrencyControl concurrencyControl = makeConcurrencyControl(concurrencyControlValue);

    MutableDocument m;
    if (!id.equals("null")) {
      m = new MutableDocument(id, toMap(document));
    } else {
      m = new MutableDocument(toMap(document));
    }

    d.save(m, concurrencyControl);

    Log.d(TAG, "Saved document, new id: " + m.getId());

    resolve(callbackContext, json(new HashMap<String, Object>() {{
      put("_id", m.getId());
    }}));
  }

  private ConcurrencyControl makeConcurrencyControl(int concurrencyControlValue) {
    switch (concurrencyControlValue) {
      case 0:
        return ConcurrencyControl.LAST_WRITE_WINS;
      case 1:
        return ConcurrencyControl.FAIL_ON_CONFLICT;
    }
    return ConcurrencyControl.LAST_WRITE_WINS;
  }

  @SuppressWarnings("unused")
  public void Database_GetCount(JSONArray args, final CallbackContext callbackContext) throws JSONException, CouchbaseLiteException {
    String name = args.getString(0);
    Database d = getDatabase(name);
    if (d == null) {
      reject(callbackContext, "No such database");
      return;
    }
    resolve(callbackContext, d.getCount());
  }

  public void Database_GetPath(JSONArray args, final CallbackContext callbackContext) throws JSONException, CouchbaseLiteException {
    String name = args.getString(0);
    Database d = getDatabase(name);
    if (d == null) {
      reject(callbackContext, "No such database");
      return;
    }
    resolve(callbackContext, d.getPath());
  }

  public void Database_Copy(JSONArray args, final CallbackContext callbackContext) throws JSONException, CouchbaseLiteException {
    String name = args.getString(0);
    Database d = getDatabase(name);
    if (d == null) {
      reject(callbackContext, "No such database");
      return;
    }
    String path = args.getString(1);
    String name2 = args.getString(2);
    Database targetDb = null;
    JSONObject config = args.getJSONObject(3);

    DatabaseConfiguration c = new DatabaseConfiguration();

    String directory = config.optString("directory", null);

    String encKey = config.optString("encryptionKey", null);
    if (directory != null) {
      c.setDirectory(directory);
    }
    if (encKey != null) {
      c.setEncryptionKey(new EncryptionKey(encKey));
    }

    Database.copy(new File(path), name2, c);

    resolve(callbackContext);
  }

  public void Database_CreateIndex(JSONArray args, final CallbackContext callbackContext) throws JSONException, CouchbaseLiteException {
    String name = args.getString(0);
    Database d = getDatabase(name);
    if (d == null) {
      reject(callbackContext, "No such database");
      return;
    }
    String indexName = args.getString(1);
    JSONObject indexData = args.getJSONObject(2);

    String type = indexData.getString("type");
    JSONArray items = indexData.getJSONArray("items");

    Index index = null;

    if (type.equals("value")) {
      index = IndexBuilder.valueIndex(makeValueIndexItems(items));
    } else if (type.equals("full-text")) {
      index = IndexBuilder.fullTextIndex(makeFullTextIndexItems(items));
    }

    d.createIndex(indexName, index);

    resolve(callbackContext);
  }

  ValueIndexItem[] makeValueIndexItems(JSONArray items) throws JSONException {
    List<ValueIndexItem> valueItems = new ArrayList<>();

    for (int i = 0; i < items.length(); i++) {
      JSONArray item = items.getJSONArray(i);
      String strEntry = item.getString(0);
      String propName = strEntry.substring(1);
      valueItems.add(ValueIndexItem.property(propName));
    }
    return valueItems.toArray(new ValueIndexItem[0]);
  }

  FullTextIndexItem[] makeFullTextIndexItems(JSONArray items) throws JSONException {
    List<FullTextIndexItem> valueItems = new ArrayList<>();

    for (int i = 0; i < items.length(); i++) {
      JSONArray item = items.getJSONArray(i);
      String strEntry = item.getString(0);
      String propName = strEntry.substring(1);
      valueItems.add(FullTextIndexItem.property(propName));
    }
    return valueItems.toArray(new FullTextIndexItem[0]);
  }

  public void Database_DeleteIndex(JSONArray args, final CallbackContext callbackContext) throws JSONException, CouchbaseLiteException {
    String name = args.getString(0);
    Database d = getDatabase(name);
    if (d == null) {
      reject(callbackContext, "No such database");
      return;
    }
    String indexName = args.getString(1);
    d.deleteIndex(indexName);
    resolve(callbackContext);
  }

  public void Database_GetIndexes(JSONArray args, final CallbackContext callbackContext) throws JSONException, CouchbaseLiteException {
    String name = args.getString(0);
    Database d = getDatabase(name);
    if (d == null) {
      reject(callbackContext, "No such database");
      return;
    }
    resolve(callbackContext, new JSONArray(d.getIndexes()));
  }

  @SuppressWarnings("unused")
  public void Database_AddChangeListener(JSONArray args, final CallbackContext callbackContext) throws JSONException, CouchbaseLiteException {
    String name = args.getString(0);
    Database d = getDatabase(name);
    if (d == null) {
      reject(callbackContext, "No such database");
      return;
    }

    ListenerToken token = d.addChangeListener(new DatabaseChangeListener() {
      @Override
      public void changed(DatabaseChange change) {
        JSONObject ret = new JSONObject();
        try {
          ret.put("documentIDs", new JSONArray(change.getDocumentIDs()));
        } catch (JSONException ex) {}
        PluginResult r = new PluginResult(PluginResult.Status.OK, ret);
        r.setKeepCallback(true);
        callbackContext.sendPluginResult(r);
      }
    });

    databaseListeners.put(name, token);
  }

  @SuppressWarnings("unused")
  public void Database_RemoveChangeListener(JSONArray args, final CallbackContext callbackContext) throws JSONException, CouchbaseLiteException {
    String name = args.getString(0);
    Database d = getDatabase(name);
    if (d == null) {
      reject(callbackContext, "No such database");
      return;
    }

    ListenerToken token = databaseListeners.remove(name);

    if (token != null) {
      d.removeChangeListener(token);
    }

    resolve(callbackContext);
  }

  @SuppressWarnings("unused")
  public void Database_Close(JSONArray args, final CallbackContext callbackContext) throws JSONException, CouchbaseLiteException {
    String name = args.getString(0);
    Database d = getDatabase(name);
    if (d == null) {
      reject(callbackContext, "No such database");
      return;
    }

    try {
      d.close();
    } finally {
      openDatabases.remove(d);
    }

    resolve(callbackContext);
  }

  public void Database_Delete(JSONArray args, final CallbackContext callbackContext) throws JSONException, CouchbaseLiteException {
    String name = args.getString(0);
    Database d = getDatabase(name);
    if (d == null) {
      reject(callbackContext, "No such database");
      return;
    }

    d.delete();

    resolve(callbackContext);
  }

  public void Database_DeleteDocument(JSONArray args, final CallbackContext callbackContext) throws JSONException, CouchbaseLiteException {
    String name = args.getString(0);
    String id = args.getString(1);
    Database db = this.openDatabases.get(name);
    JSONObject document = args.getJSONObject(2);
    int concurrencyControlValue = args.optInt(3, ConcurrencyControl.LAST_WRITE_WINS.getValue());
    ConcurrencyControl concurrencyControl = makeConcurrencyControl(concurrencyControlValue);

    Document d = db.getDocument(id);

    if (d == null) {
      reject(callbackContext, "No such document");
      return;
    }

    db.delete(d, concurrencyControl);

    resolve(callbackContext);
  }

  public void Database_PurgeDocument(JSONArray args, final CallbackContext callbackContext) throws JSONException, CouchbaseLiteException {
    String name = args.getString(0);
    String id = args.getString(1);
    Database db = this.openDatabases.get(name);
    JSONObject document = args.getJSONObject(2);
    Document d = db.getDocument(id);

    if (d == null) {
      reject(callbackContext, "No such document");
      return;
    }

    db.purge(d);

    resolve(callbackContext);
  }

  @SuppressWarnings("unused")
  public void Database_Compact(JSONArray args, final CallbackContext callbackContext) throws JSONException, CouchbaseLiteException {
    String name = args.getString(0);
    Database db = this.openDatabases.get(name);

    db.compact();

    resolve(callbackContext);
  }

  public void Database_GetDocument(JSONArray args, final CallbackContext callbackContext) throws JSONException, CouchbaseLiteException {

    String name = args.getString(0);
    Database db = this.openDatabases.get(name);
    String documentId = args.getString(1);
    Document d = db.getDocument(documentId);

    if (d != null) {
      Map<String, Object> docMap = documentToMap(d);
      resolve(callbackContext, json(docMap));
    } else {
      resolve(callbackContext, (String) null);
    }
  }

  public void Database_SetLogLevel(JSONArray args, final CallbackContext callbackContext) throws JSONException, CouchbaseLiteException {

    String name = args.getString(0);
    Database db = this.openDatabases.get(name);
    String domain = args.getString(1);
    int logLevelValue = args.getInt(2);

    LogLevel logLevel = getLogLevel(logLevelValue);

    db.setLogLevel(LogDomain.valueOf(domain), logLevel);

    resolve(callbackContext, (String) null);
  }

  private LogLevel getLogLevel(int logLevelValue) {
    switch (logLevelValue) {
      case 0: return LogLevel.DEBUG;
      case 1: return LogLevel.VERBOSE;
      case 2: return LogLevel.INFO;
      case 3: return LogLevel.WARNING;
      case 4: return LogLevel.ERROR;
      case 5: return LogLevel.NONE;
    }
    return LogLevel.DEBUG;
  }

  public void Database_SetFileLoggingConfig(JSONArray args, final CallbackContext callbackContext) throws JSONException, CouchbaseLiteException {
    String name = args.getString(0);
    Database db = this.openDatabases.get(name);

    JSONObject config = args.getJSONObject(1);

    Object levelValue = config.opt("level");

    String directory = config.getString("directory");
    Integer maxRotateCount = config.optInt("maxRotateCount", -1);
    Integer maxSize = config.optInt("maxSize", -1);
    Object usePlaintext = config.opt("usePlaintext");

    LogFileConfiguration fileConfig = new LogFileConfiguration(directory);
    if (maxRotateCount >= 0) {
      fileConfig.setMaxRotateCount(maxRotateCount);
    }
    if (maxSize >= 0) {
      fileConfig.setMaxSize(maxSize);
    }
    if (usePlaintext != null) {
      fileConfig.setUsePlaintext((Boolean) usePlaintext);
    }

    db.log.getFile().setConfig(fileConfig);

    if (levelValue != null) {
      LogLevel logLevel = getLogLevel((int) levelValue);
      db.log.getFile().setLevel(logLevel);
    }
  }


  public void Document_GetBlobContent(JSONArray args, final CallbackContext callbackContext) throws JSONException, CouchbaseLiteException {
    String name = args.getString(0);
    Database db = this.openDatabases.get(name);
    String documentId = args.getString(1);
    String key = args.getString(2);

    Document d = db.getDocument(documentId);

    if (d != null) {
      Blob b = d.getBlob(key);
      byte[] content = b.getContent();
      resolve(callbackContext, new JSONArray(content));
    } else {
      resolve(callbackContext, (String) null);
    }
  }


  private Map<String, Object> blobToDictionary(Blob b) {
    Map<String, Object> data = new HashMap<>();
    data.put("contentType", b.getContentType());
    data.put("data", b.getContent());
    return data;
  }

  @SuppressWarnings("unused")
  public void Query_Execute(JSONArray args, final CallbackContext callbackContext) throws JSONException, CouchbaseLiteException {
    String name = args.getString(0);
    String queryJson = args.getString(1);
    Database db = this.openDatabases.get(name);

    Query q = JsonQueryBuilder.buildQuery(db, queryJson);
    ResultSet rs = q.execute();
    Log.d(TAG, "Built query: " + q);

    int id = queryCount++;

    this.queryResultSets.put(id, rs);

    resolve(callbackContext, json(new HashMap<String, Object>() {{
      put("id", id);
    }}));
  }

  @SuppressWarnings("unused")
  public void LiveQuery_Execute(JSONArray args, final CallbackContext callbackContext) throws JSONException, CouchbaseLiteException {
    String name = args.getString(0);
    String queryJson = args.getString(1);
    Database db = this.openDatabases.get(name);

    Query q = JsonQueryBuilder.buildQuery(db, queryJson);

    int id = liveQueryCount++;

    ListenerToken token = q.addChangeListener(new QueryChangeListener() {
      @Override
      public void changed(@NonNull QueryChange change) {
        JSONObject ret = new JSONObject();
        Throwable err = change.getError();
        PluginResult r;

        List<Result> rs = change.getResults().allResults();
        JSONArray results = new JSONArray();

        for (Result result : rs) {
          results.put(json(resultToMap(result)));
        }

        if (err == null) {
          try {
            ret.put("id", id);
            ret.put("results", results);
          } catch (JSONException ex) {}
          r = new PluginResult(PluginResult.Status.OK, ret);
        } else {
          r = new PluginResult(PluginResult.Status.ERROR, err.toString());
        }

        r.setKeepCallback(true);
        callbackContext.sendPluginResult(r);
      }
    });

    liveQueries.put(id, new Pair<>(token, q));

    q.execute();
    Log.d(TAG, "Built live query: " + q);
  }

  @SuppressWarnings("unused")
  public void LiveQuery_End(JSONArray args, final CallbackContext callbackContext) throws JSONException {
    String name = args.getString(0);
    int id = args.getInt(1);

    Database db = this.openDatabases.get(name);
    Pair<ListenerToken, Query> p = this.liveQueries.get(id);
    ListenerToken token = p.first;
    Query q = p.second;

    q.removeChangeListener(token);

    resolve(callbackContext);
  }

  public void ResultSet_Next(JSONArray args, final CallbackContext callbackContext) throws JSONException, CouchbaseLiteException {
    String name = args.getString(0);
    int id = args.getInt(1);
    ResultSet r = this.queryResultSets.get(id);
    if (r == null) {
      resolve(callbackContext, json(new HashMap<String, Object>() {{
      }}));
      return;
    }
    Log.d(TAG, "Moving to next result...");
    Result result = r.next();
    if (result == null) {
      Log.d(TAG, "No results");
      resolve(callbackContext, (String) null);
      return;
    }

    Map<String, Object> data = resultToMap(result);
    Log.d(TAG, data.toString());
    resolve(callbackContext, json(data));
  }

  public void ResultSet_NextBatch(JSONArray args, final CallbackContext callbackContext) throws JSONException, CouchbaseLiteException {
    String name = args.getString(0);
    int id = args.getInt(1);
    ResultSet r = this.queryResultSets.get(id);
    if (r == null) {
      resolve(callbackContext, json(new HashMap<String, Object>() {{
      }}));
      return;
    }
    int chunkSize = allResultsChunkSize;
    List<Map<String, Object>> resultsChunk = new ArrayList<>(chunkSize);

    Log.d(TAG, "Moving to next result...");
    Result result;
    int i = 0;
    while (i++ < chunkSize && ((result = r.next()) != null)) {
      resultsChunk.add(result.toMap());
    }

    resolve(callbackContext, new JSONArray(resultsChunk));
  }

  public void ResultSet_AllResults(JSONArray args, final CallbackContext callbackContext) throws JSONException, CouchbaseLiteException {
    String name = args.getString(0);
    int id = args.getInt(1);
    ResultSet r = this.queryResultSets.get(id);
    if (r == null) {
      resolve(callbackContext, json(new HashMap<String, Object>() {{
      }}));
      return;
    }

    int chunkSize = this.allResultsChunkSize;
    /*
    List<Result> results = r.allResults();
    if (results == null) {
      Log.d(TAG, "No results");
      return;
    }
    */

    List<Map<String, Object>> resultsChunk = null;

    int i = 0;
    Result queryResult;
    while ((queryResult = r.next()) != null) {
      if (i % chunkSize == 0) {
        if (resultsChunk != null) {
          PluginResult result = new PluginResult(PluginResult.Status.OK, new JSONArray(resultsChunk));
          result.setKeepCallback(true);
          callbackContext.sendPluginResult(result);
          resultsChunk.clear();
        } else {
          resultsChunk = new ArrayList<>(chunkSize);
        }
      }

      resultsChunk.add(queryResult.toMap());
      i++;
    }

    if (resultsChunk != null && resultsChunk.size() > 0) {
      PluginResult result = new PluginResult(PluginResult.Status.OK, new JSONArray(resultsChunk));
      result.setKeepCallback(true);
      callbackContext.sendPluginResult(result);
    }

    resolve(callbackContext, new JSONArray());
  }

  public void ResultSet_Cleanup(JSONArray args, final CallbackContext callbackContext) throws JSONException, CouchbaseLiteException {
    String name = args.getString(0);
    int id = args.getInt(1);
    ResultSet r = this.queryResultSets.get(id);
    if (r == null) {
      resolve(callbackContext, json(new HashMap<String, Object>() {{
      }}));
      return;
    }

    this.queryResultSets.remove(r);

    resolve(callbackContext);
  }

  public void Replicator_Start(JSONArray args, final CallbackContext callbackContext) throws JSONException, CouchbaseLiteException {
    String name = args.getString(0);
    Database db = this.openDatabases.get(name);
    JSONObject config = args.getJSONObject(1);
    try {
      ReplicatorConfiguration replicatorConfig = replicatorConfigFromJson(db, config);
      Replicator r = new Replicator(replicatorConfig);

      r.start();

      int id = replicatorCount++;
      this.replicators.put(id, r);
      resolve(callbackContext, json(new HashMap<String, Object>() {{
        put("replicatorId", id);
      }}));
    } catch (Exception ex) {
      reject(callbackContext, "Error starting replicator: " + ex.getMessage());
    }
  }

  public void Replicator_Stop(JSONArray args, final CallbackContext callbackContext) throws JSONException, CouchbaseLiteException {
    int replicatorId = args.getInt(0);
    Replicator r = this.replicators.get(replicatorId);
    if (r == null) {
      reject(callbackContext, "No such replicator");
      return;
    }
    r.stop();
    resolve(callbackContext);
  }

  public void Replicator_ResetCheckpoint(JSONArray args, final CallbackContext callbackContext) throws JSONException, CouchbaseLiteException {
    int replicatorId = args.getInt(0);
    Replicator r = this.replicators.get(replicatorId);
    if (r == null) {
      reject(callbackContext, "No such replicator");
      return;
    }
    r.resetCheckpoint();
    resolve(callbackContext);
  }

  public void Replicator_GetStatus(JSONArray args, final CallbackContext callbackContext) throws JSONException, CouchbaseLiteException {
    int replicatorId = args.getInt(0);
    Replicator r = this.replicators.get(replicatorId);
    if (r == null) {
      reject(callbackContext, "No such replicator");
      return;
    }
    Replicator.Status status = r.getStatus();

    JSONObject statusJson = generateStatusJson(status);

    resolve(callbackContext, statusJson);
  }

  private JSONObject generateStatusJson(Replicator.Status status) {
    CouchbaseLiteException error = status.getError();
    JSONObject errorJson = new JSONObject();
    if (error != null) {
      try {
        errorJson.put("code", error.getCode());
        errorJson.put("domain", error.getDomain());
        errorJson.put("info", error.getInfo());
      } catch (Exception ex) {}
    }
    AbstractReplicator.Progress progress = status.getProgress();
    JSONObject progressJson = new JSONObject();
    if (progress != null) {
      try {
        progressJson.put("completed", progress.getCompleted());
        progressJson.put("total", progress.getTotal());
      } catch (Exception ex) {}
    }

    int activityLevel = 0;
    AbstractReplicator.ActivityLevel av = status.getActivityLevel();
    if (av != null) {
      activityLevel = av.ordinal();
    }
    final int activityLevelVal = activityLevel;

    return new JSONObject(new HashMap<String, Object>() {{
      put("activityLevel", activityLevelVal);
      put("error", errorJson);
      put("progress", progressJson);
    }});
  }

  public void Replicator_AddChangeListener(JSONArray args, final CallbackContext callbackContext) throws JSONException, CouchbaseLiteException {
    int replicatorId = args.getInt(0);
    Replicator r = this.replicators.get(replicatorId);
    if (r == null) {
      reject(callbackContext, "No such replicator");
      return;
    }

    ListenerToken token = r.addChangeListener(new ReplicatorChangeListener() {
      @Override
      public void changed(ReplicatorChange change) {
        JSONObject statusJson = generateStatusJson(change.getStatus());
        PluginResult r = new PluginResult(PluginResult.Status.OK, statusJson);
        r.setKeepCallback(true);
        callbackContext.sendPluginResult(r);
      }
    });

    replicatorListeners.put(replicatorId, token);
  }

  public void Replicator_Cleanup(JSONArray args, final CallbackContext callbackContext) throws JSONException, CouchbaseLiteException {
    int replicatorId = args.getInt(0);
    Replicator r = this.replicators.get(replicatorId);
    if (r == null) {
      reject(callbackContext, "No such replicator");
      return;
    }

    ListenerToken token = replicatorListeners.get(replicatorId);

    if (token != null) {
      r.removeChangeListener(token);
      replicatorListeners.remove(replicatorId);
    }

    replicators.remove(replicatorId);

    resolve(callbackContext);
  }

  public void Replicator_Restart(JSONArray args, final CallbackContext callbackContext) throws JSONException, CouchbaseLiteException {
    int replicatorId = args.getInt(0);
    Replicator r = this.replicators.get(replicatorId);
    if (r != null) {
      r.start();
    }

    resolve(callbackContext);
  }

  // Utilities

  private ReplicatorConfiguration replicatorConfigFromJson(Database db, JSONObject json) throws Exception {
    JSONObject authenticatorData = json.getJSONObject("authenticator");
    String authenticatorType = authenticatorData.getString("type");
    String replicatorType = json.getString("replicatorType");
    boolean continuous = json.getBoolean("continuous");
    JSONObject target = json.getJSONObject("target");
    if (target == null) {
      throw new CouchbaseLiteException("No target specified for replicator");
    }

    String url = target.getString("url");
    Endpoint endpoint = new URLEndpoint(new URI(url));
    ReplicatorConfiguration config = new ReplicatorConfiguration(db, endpoint);

    if (replicatorType.equals("PUSH_AND_PULL")) {
      config.setReplicatorType(ReplicatorConfiguration.ReplicatorType.PUSH_AND_PULL);
    } else if (replicatorType.equals("PUSH")) {
      config.setReplicatorType(ReplicatorConfiguration.ReplicatorType.PUSH);
    } else if (replicatorType.equals("PULL")) {
      config.setReplicatorType(ReplicatorConfiguration.ReplicatorType.PULL);
    }

    config.setContinuous(continuous);

    Authenticator authenticator = this.replicatorAuthenticatorFromConfig(authenticatorData);

    if (authenticator != null) {
      config.setAuthenticator(authenticator);
    }

    return config;
  }

  private Authenticator replicatorAuthenticatorFromConfig(JSONObject config) throws JSONException {
    String type = config.getString("type");
    JSONObject data = config.getJSONObject("data");
    if (type.equals("session")) {
      String sessionID = data.getString("sessionID");
      String cookieName = data.getString("cookieName");
      return new SessionAuthenticator(sessionID, cookieName);
    }

    if (type.equals("basic")) {
      String username = data.getString("username");
      String password = data.getString("password");
      return new BasicAuthenticator(username, password);
    }

    return null;
  }
}
