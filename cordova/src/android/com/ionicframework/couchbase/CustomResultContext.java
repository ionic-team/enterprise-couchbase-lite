package com.ionicframework.couchbase;

import com.couchbase.lite.Database;
import com.couchbase.lite.internal.fleece.FLSliceResult;
import com.couchbase.lite.internal.fleece.MContext;

public class CustomResultContext extends MContext {
  private Database _db;

  CustomResultContext(Database db) {
    super(new FLSliceResult("{}".getBytes()));
    _db = db;
  }


  Database getDatabase() {
    return _db;
  }
}
