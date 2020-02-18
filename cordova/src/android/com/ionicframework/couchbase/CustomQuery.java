package com.ionicframework.couchbase;

import android.util.Log;

import com.couchbase.lite.AbstractReplicator;
import com.couchbase.lite.CouchbaseLiteException;
import com.couchbase.lite.Database;
import com.couchbase.lite.Parameters;
import com.couchbase.lite.internal.core.C4Database;
import com.couchbase.lite.internal.core.C4Query;
import com.couchbase.lite.internal.core.C4QueryEnumerator;
import com.couchbase.lite.internal.core.C4QueryOptions;
import com.couchbase.lite.LiteCoreException;
import com.couchbase.lite.internal.fleece.AllocSlice;
import com.couchbase.lite.internal.fleece.FLEncoder;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class CustomQuery {
  private final Object lock = new Object(); // lock for thread-safety

  private Parameters parameters = null;
  private Database database;
  private Map<String, Integer> columnNames = null;
  private String json;

  private C4Query c4query;
  private C4Database c4db;
  private C4QueryEnumerator c4enum;

  CustomQuery(Database database, String json) {
    this.json = json;
    this.database = database;
    this.c4db = getC4Database(database);
  }

  String getJson() {
    return this.json;
  }

  CustomResultSet execute() throws CouchbaseLiteException {
    try {
      C4QueryOptions options = new C4QueryOptions();
      if (parameters == null) { parameters = new Parameters(); }

      FLEncoder e = new FLEncoder();
      e.write(new HashMap<>());
      final AllocSlice params = e.finish2();
      final C4QueryEnumerator c4enum;
      synchronized (getLock(database)) {
        check();
        c4enum = c4query.run(options, params);
      }

      return new CustomResultSet(this, database, c4enum);
    } catch (LiteCoreException e) {
      throw new CouchbaseLiteException(e);
    }
  }

  Object getLock(Database database) {
    try {
      Method method = database.getClass().getSuperclass().getDeclaredMethod("getLock");
      method.setAccessible(true);
      return method.invoke(database);
    } catch (NoSuchMethodException e) {
      e.printStackTrace();
    } catch (IllegalAccessException e) {
      e.printStackTrace();
    } catch (InvocationTargetException e) {
      e.printStackTrace();
    }
    return null;
  }

  private void check() throws CouchbaseLiteException {
    synchronized (lock) {
      if (c4query != null)
        return;

      /*
      if (columnNames == null)
        columnNames = generateColumnNames();

      */

      try {
        c4query = getC4Database(this.database).createQuery(json);
      } catch (LiteCoreException e) {
        throw new CouchbaseLiteException(e.getMessage());
      }
    }
  }

  private C4Database getC4Database(Database database) {
    try {
      Method method = database.getClass().getSuperclass().getDeclaredMethod("getC4Database");
      method.setAccessible(true);
      return (C4Database) method.invoke(database);
    } catch (Exception ex) {
    }
    return null;
  }
}
