package com.ionicframework.couchbase;

import com.couchbase.lite.Database;
import com.couchbase.litecore.fleece.AllocSlice;
import com.couchbase.litecore.fleece.MContext;

public class CustomResultContext extends MContext {
  private Database _db;

  CustomResultContext(Database db) {
    super(new AllocSlice("{}".getBytes()));
    _db = db;
  }


  Database getDatabase() {
    return _db;
  }
}
