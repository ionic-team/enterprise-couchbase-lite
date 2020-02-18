
package com.ionicframework.couchbase;

import com.couchbase.lite.CouchbaseLiteException;
import com.couchbase.lite.Database;
import com.couchbase.lite.LogDomain;
import com.couchbase.lite.internal.support.Log;

import com.couchbase.lite.internal.core.C4QueryEnumerator;
import com.couchbase.lite.LiteCoreException;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;

public class CustomResultSet implements Iterable<CustomResult> {

  //---------------------------------------------
  // static variables
  //---------------------------------------------
  private static final LogDomain DOMAIN = LogDomain.QUERY;

  //---------------------------------------------
  // member variables
  //---------------------------------------------
  private final AtomicBoolean isAlive = new AtomicBoolean(true);

  private Database database;
  private C4QueryEnumerator c4enum;
  private Map<String, Integer> columnNames;
  private CustomResultContext context;
  private CustomQuery query;
  private boolean isAllEnumerated;

  CustomResultSet(CustomQuery query, Database database, C4QueryEnumerator c4enum) {
    this.query = query;
    this.database = database;
    this.c4enum = c4enum;
    this.columnNames = generateColumnNames();
    this.context = new CustomResultContext(database);
  }


  //---------------------------------------------
  // API - public methods
  //---------------------------------------------

  /**
   * Move the cursor forward one row from its current row position.
   * Caution: next() method and iterator() method share same data structure.
   * Please don't use them together.
   * Caution: In case ResultSet is obtained from QueryChangeListener, and QueryChangeListener is
   * already removed from Query, ResultSet is already freed. And this next() method returns null.
   *
   * @return the Result after moving the cursor forward. Returns {@code null} value
   * if there are no more rows, or ResultSet is freed already.
   */
  public CustomResult next() {
    if (query == null) { throw new IllegalStateException("_query variable is null"); }
    if (!isAlive.get()) { return null; }

    synchronized (getLock(getDatabase())) {
      try {
        if (c4enum == null) { return null; }
        else if (isAllEnumerated) {
          Log.w(DOMAIN, "All query results have already been enumerated.");
          return null;
        }
        else if (!c4enum.next()) {
          Log.i(DOMAIN, "End of query enumeration");
          isAllEnumerated = true;
          return null;
        }
        else { return currentObject(); }
      }
      catch (LiteCoreException e) {
        Log.w(DOMAIN, "Query enumeration error: %s", e.toString());
        return null;
      }
    }
  }

  /**
   * Return List of Results. List is unmodifiable and only supports
   * int get(int index), int size(), boolean isEmpty() and Iterator<Result> iterator() methods.
   * Once called allResults(), next() method return null. Don't call next() and allResults()
   * together.
   *
   * @return List of Results
   */
  public List<CustomResult> allResults() {
    List<CustomResult> results = new ArrayList<>();
    CustomResult result;
    while ((result = next()) != null)
      results.add(result);
    return results;
  }

  //---------------------------------------------
  // Iterable implementation
  //---------------------------------------------

  /**
   * Return Iterator of Results.
   * Once called iterator(), next() method return null. Don't call next() and iterator()
   * together.
   *
   * @return an iterator over the elements in this list in proper sequence
   */
  @Override
  public Iterator<CustomResult> iterator() {
    return allResults().iterator();
  }

  //---------------------------------------------
  // protected methods
  //---------------------------------------------

  @Override
  protected void finalize() throws Throwable {
    free();
    super.finalize();
  }

  //---------------------------------------------
  // Package level access
  //---------------------------------------------

  void free() {
    if (c4enum != null) {
      synchronized (getLock(getDatabase())) {
        c4enum.close();
      }
      c4enum.free();
      c4enum = null;
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

  CustomResultSet refresh() throws CouchbaseLiteException {
    synchronized (getLock(getDatabase())) {
      try {
        C4QueryEnumerator newEnum = c4enum.refresh();
        return newEnum != null ? new CustomResultSet(this.query, database, newEnum) : null;
      } catch (LiteCoreException e) {
        throw new CouchbaseLiteException(e.getMessage());
      }
    }
  }

  int columnCount() {
    return columnNames.size();
  }

  Map<String, Integer> getColumnNames() {
    return generateColumnNames();
  }

  private Map<String, Integer> generateColumnNames() {
    String json = query.getJson();
    Map<String, Integer> columns = new HashMap<>();
    try {
      JSONObject queryJson = new JSONObject(json);
      JSONArray what = queryJson.getJSONArray("WHAT");
      for (int i = 0; i < what.length(); i++) {
        JSONArray item = what.getJSONArray(i);
        String column = item.getString(0);
        if (column != null) {
          if (column.equals(".")) {
            String columnName = database.getName();
            columns.put(columnName, i);
          } else {
            String columnName = column.substring(1);
            columns.put(columnName, i);
          }
        }
      }
    } catch (JSONException ex) {
    }
    return columns;
  }


  //---------------------------------------------
  // Private level access
  //---------------------------------------------
  Database getDatabase() {
    return this.database;
  }

  private CustomResult currentObject() {
    return new CustomResult(this, c4enum, context);
  }

}
