package io.ionic.enterprise.couchbaselite;

import com.couchbase.lite.DataSource;
import com.couchbase.lite.Database;
import com.couchbase.lite.LiteCoreException;
import com.couchbase.lite.Log;
import com.couchbase.lite.Query;
import com.couchbase.lite.QueryBuilder;
import com.couchbase.lite.internal.core.C4Database;
import com.couchbase.lite.internal.core.C4Query;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class JsonQueryBuilder {
  public static Query buildQuery(Database db, String json) {
    Query query = null;

    try {
      DataSource source = DataSource.database(db);
      query = QueryBuilder.select().from(source);

      C4Database c4database = getC4Database(db);

      setC4Query(query, c4database.createQuery(json));
      setColumnNames(query, generateColumnNames(db, json));
    } catch (NoSuchFieldException | NoSuchMethodException | InvocationTargetException | IllegalAccessException | LiteCoreException ex) {
      ex.printStackTrace();
    }

    return query;
  }

  private static Map<String, Integer> generateColumnNames(Database db, String json) {
    Map<String, Integer> columns = new HashMap<>();

    try {
      JSONObject queryJson = new JSONObject(json);
      JSONArray what = queryJson.getJSONArray("WHAT");

      JSONArray from = null;
      try {
        from = queryJson.getJSONArray("FROM");
      } catch (Exception ex) {}

      String as = null;

      if (from != null) {
        for (int i = 0; i < from.length(); i++) {
          try {
            JSONObject item = from.getJSONObject(i);
            if (item.has("AS")) {
              as = item.getString("AS") + ".";
              break;
            }
          } catch (Exception ex) {
          }
        }
      }

      for (int i = 0; i < what.length(); i++) {
        JSONArray item = what.getJSONArray(i);
        Pattern p = Pattern.compile("\\.(.*)\\.");
        Matcher m = p.matcher(item.getString(0));
        String alias = null;
        while (m.find()) {
          alias = m.group(1);
        }
        String column = item.getString(0).replaceFirst("\\..*\\.", "");
        if (column != null) {
          if (column.equals(".") || column.equals("")) {
            String columnName = db.getName();
            if (alias != null) {
              columns.put(alias, i);
            } else {
              columns.put(columnName, i);
            }
          } else {
            if (column.charAt(0) == '.') {
              columns.put(column.substring(1), i);
            } else {
              columns.put(column, i);
            }
          }
        }
      }
    } catch (JSONException ex) {
      ex.printStackTrace();
    }

    return columns;
  }

  private static C4Database getC4Database(Database db) throws NoSuchMethodException, InvocationTargetException, IllegalAccessException {
    Class cls = db.getClass().getSuperclass(); // AbstractDatabase
    Method m = cls.getDeclaredMethod("getC4Database", null);
    m.setAccessible(true);

    return (C4Database) m.invoke(db, null);
  }

  private static void setC4Query(Query query, C4Query c4query) throws IllegalAccessException, NoSuchFieldException {
    Class queryClass = query.getClass().getSuperclass(); // AbstractQuery
    Field f = queryClass.getDeclaredField("c4query");
    f.setAccessible(true);
    f.set(query, c4query);
  }

  private static void setColumnNames(Query query, Map<String, Integer> columnNames) throws NoSuchFieldException, IllegalAccessException {
    Class queryClass = query.getClass().getSuperclass(); // AbstractQuery
    Field f = queryClass.getDeclaredField("columnNames");
    f.setAccessible(true);
    f.set(query, columnNames);
  }
}
