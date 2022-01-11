import {
  IonButton,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import './Home.css';

import {
  ArrayFunction,
  BasicAuthenticator,
  Blob,
  ConcurrencyControl,
  Database,
  DatabaseChange,
  DatabaseConfiguration,
  DataSource,
  Expression,
  FullTextExpression,
  FullTextIndexItem,
  Function,
  IndexBuilder,
  Join,
  LogDomain,
  LogLevel,
  Meta,
  MutableDocument,
  Ordering,
  QueryBuilder,
  Replicator,
  ReplicatorChange,
  ReplicatorConfiguration,
  Result,
  ResultSet,
  SelectResult,
  URLEndpoint,
  ValueIndexItem,
} from '@ionic-enterprise/couchbase-lite';

class CBLTester {
  database: Database;
  database2: Database;
  doc: MutableDocument;
  replicator: Replicator;

  lastDocId: string;

  output: string;

  _query1Results: ResultSet;

  _queryTestResults: ResultSet[] = [];

  constructor() {
    console.log('IONIC CBL ON READY');
    const config = new DatabaseConfiguration();
    config.setEncryptionKey('secret');
    const database = new Database('thedb9', config);
    /*
    database.setEngine(
      new CapacitorEngine({
        allResultsChunkSize: 9999,
      }),
    );
    */
    // const database2 = new Database("thedb6", config)
    // database2.setEngine(new CordovaEngine());
    this.database = database;
    //this.database2 = database2;
  }

  openDocRepl() {
    // this.router.navigateByUrl('/document');
  }

  outputChanged(value: string) {}
  out(value: string) {
    this.output = value;
    this.outputChanged(value);
  }

  async init() {
    await this.openDbs();
    this.database.addChangeListener((change: DatabaseChange) => {
      console.log('DATABASE CHANGE', change, change.documentIDs);
    });
    this.out(`Opened db`);
  }

  async openDbs() {
    await this.database.open();
    // await this.database2.open();
  }

  async exists() {
    let doesExist = await this.database.exists('test', 'test');
    console.log('Does it exist?', doesExist);
    this.out(`Exists? ${doesExist}`);
  }

  async queryTest() {
    if (!this.database) {
      return;
    }

    const database = this.database;

    const query1 = QueryBuilder.select(
      SelectResult.expression(Meta.id),
      SelectResult.property('name'),
      SelectResult.property('type'),
    )
      .from(DataSource.database(database))
      .where(Expression.property('type').equalTo(Expression.string('hotel')))
      .orderBy(Ordering.expression(Meta.id));

    const query2 = QueryBuilder.select(SelectResult.all())
      .from(DataSource.database(database))
      .where(Expression.property('type').equalTo(Expression.string('SDK')));

    const query3 = QueryBuilder.select(SelectResult.all())
      .from(DataSource.database(database))
      .where(Expression.property('type').equalTo(Expression.string('hotel')))
      .limit(Expression.intValue(10));

    console.log('Query 3 to json', query3.toJson());

    const query4 = QueryBuilder.select(
      SelectResult.expression(Meta.id),
      SelectResult.property('name'),
      SelectResult.property('public_likes'),
    )
      .from(DataSource.database(database))
      .where(
        Expression.property('type')
          .equalTo(Expression.string('hotel'))
          .and(
            ArrayFunction.contains(
              Expression.property('public_likes'),
              Expression.string('Armani Langworth'),
            ),
          ),
      );

    const values: Expression[] = [
      Expression.property('first'),
      Expression.property('last'),
      Expression.property('username'),
    ];

    const query5 = QueryBuilder.select(SelectResult.all())
      .from(DataSource.database(database))
      .where(Expression.string('Armani').in(...values));

    const query6 = QueryBuilder.select(
      SelectResult.expression(Meta.id),
      SelectResult.property('country'),
      SelectResult.property('name'),
    )
      .from(DataSource.database(database))
      .where(
        Expression.property('type')
          .equalTo(Expression.string('landmark'))
          .and(
            Expression.property('name').like(
              Expression.string('Royal Engineers Museum'),
            ),
          ),
      );

    const query7 = QueryBuilder.select(
      SelectResult.expression(Meta.id),
      SelectResult.property('country'),
      SelectResult.property('name'),
    )
      .from(DataSource.database(database))
      .where(
        Expression.property('type')
          .equalTo(Expression.string('landmark'))
          .and(Expression.property('name').like(Expression.string('Eng%e%'))),
      );

    const query8 = QueryBuilder.select(
      SelectResult.expression(Meta.id),
      SelectResult.property('country'),
      SelectResult.property('name'),
    )
      .from(DataSource.database(database))
      .where(
        Expression.property('type')
          .equalTo(Expression.string('landmark'))
          .and(Expression.property('name').like(Expression.string('Eng____r'))),
      );

    const query9 = QueryBuilder.select(
      SelectResult.expression(Meta.id),
      SelectResult.property('country'),
      SelectResult.property('name'),
    )
      .from(DataSource.database(database))
      .where(
        Expression.property('type')
          .equalTo(Expression.string('landmark'))
          .and(
            Expression.property('name').regex(
              Expression.string('\\bEng.*r\\b'),
            ),
          ),
      );

    const query10 = QueryBuilder.select(
      SelectResult.expression(Expression.property('name').from('airline')),
      SelectResult.expression(Expression.property('callsign').from('airline')),
      SelectResult.expression(
        Expression.property('destinationairport').from('route'),
      ),
      SelectResult.expression(Expression.property('stops').from('route')),
      SelectResult.expression(Expression.property('airline').from('route')),
    )
      .from(DataSource.database(database).as('airline'))
      .join(
        Join.join(DataSource.database(database).as('route')).on(
          Meta.id
            .from('airline')
            .equalTo(Expression.property('airlineid').from('route')),
        ),
      )
      .where(
        Expression.property('type')
          .from('route')
          .equalTo(Expression.string('route'))
          .and(
            Expression.property('type')
              .from('airline')
              .equalTo(Expression.string('airline')),
          )
          .and(
            Expression.property('sourceairport')
              .from('route')
              .equalTo(Expression.string('RIX')),
          ),
      );

    const query11 = QueryBuilder.select(
      SelectResult.expression(Function.count(Expression.string('*'))),
      SelectResult.property('country'),
      SelectResult.property('tz'),
    )
      .from(DataSource.database(database))
      .where(
        Expression.property('type')
          .equalTo(Expression.string('airport'))
          .and(
            Expression.property('geo.alt').greaterThanOrEqualTo(
              Expression.intValue(300),
            ),
          ),
      )
      .groupBy(Expression.property('country'), Expression.property('tz'))
      .orderBy(
        Ordering.expression(
          Function.count(Expression.string('*')),
        ).descending(),
      );

    const query12 = QueryBuilder.select(
      SelectResult.expression(Meta.id),
      SelectResult.property('name'),
    )
      .from(DataSource.database(database))
      .where(Expression.property('type').equalTo(Expression.string('hotel')))
      .orderBy(Ordering.property('name').ascending())
      .limit(Expression.intValue(10));

    try {
      /*
      await window.IonicCouchbaseLite.exec('Query_Test', [
        this.database.getName(),
        query1.toJson(),
        query2.toJson(),
        query3.toJson(),
        query4.toJson(),
        query5.toJson(),
        query6.toJson(),
        query7.toJson(),
        query8.toJson(),
        query9.toJson(),
        query10.toJson(),
        query11.toJson(),
        query12.toJson(),
      ]);
      */
    } catch (e) {
      this.out('Fail: ' + e);
    }
  }

  async close() {
    this.database && this.database.close();
    this.out(`Closed db`);
  }

  async compact() {
    this.database && this.database.compact();
    this.out(`Compacted db`);
  }

  async delete() {
    if (!this.database) {
      return;
    }
    await this.database.deleteDatabase();

    this.out(`Deleted db`);
  }

  async createIndex() {
    if (!this.database) {
      return;
    }

    await this.database.createIndex(
      'TypeNameIndex',
      IndexBuilder.valueIndex(
        ValueIndexItem.property('type'),
        ValueIndexItem.property('name'),
      ),
    );

    let index = IndexBuilder.fullTextIndex(FullTextIndexItem.property('name'));
    index.setIgnoreAccents(false);
    await this.database.createIndex('nameFTSIndex', index);

    this.out(`Created indexes`);
  }

  async deleteIndex() {
    if (!this.database) {
      return;
    }

    await this.database.deleteIndex('TypeNameIndex');
    this.out('Deleted index');
  }

  async getIndexes() {
    if (!this.database) {
      return;
    }

    const indexes = await this.database.getIndexes();
    this.out(`Got indexes: ${indexes}`);
  }

  async save() {
    let doc = new MutableDocument()
      .setString('name', 'Escape')
      .setString('type', 'hotel')
      .setString('asdf', null)
      .setArray('items', [
        'hello',
        {
          really: 'cool',
        },
        123,
        true,
      ])
      //.setBlob('profile', new Blob('image/jpeg', 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P//PwAGBAL/VJiKjgAAAABJRU5ErkJggg=='))
      .setArray('someWithNull', [1, null, 4])
      .setDictionary('config', {
        size: 'large',
        isCool: false,
      })
      .setDate('created', new Date());

    let doc2 = new MutableDocument()
      .setString('name', 'Space')
      .setString('type', 'house')
      .setDate('created', new Date());

    let doc3 = new MutableDocument()
      .setString('name', 'Ice Cream')
      .setString('type', 'parlour')
      .setDate('created', new Date());

    let doc4 = new MutableDocument()
      .setString('name', 'Sleep')
      .setString('type', 'hotel')
      .setDate('created', new Date());

    await this.database.save(doc, ConcurrencyControl.FAIL_ON_CONFLICT);
    await this.database.save(doc2);
    await this.database.save(doc3);
    await this.database.save(doc4);

    this.lastDocId = doc.getId();

    console.log('Saved document, id is', doc.getId());

    this.out(`Saved document. Last id ${doc.getId()}`);

    this.doc = doc;
  }

  async saveMany() {
    for (let i = 0; i < 10000; i++) {
      let doc = new MutableDocument()
        .setString('name', 'Saved Doc')
        .setString('type', 'hotel')
        .setString('asdf', null)
        .setArray('items', [
          'hello',
          {
            really: 'cool',
          },
          123,
          true,
        ])
        .setArray('someWithNull', [1, null, 4])
        .setDictionary('config', {
          size: 'large',
          isCool: false,
        })
        .setDate('created', new Date());
      this.database.save(doc);
    }
    this.out(`Saved many`);
  }

  async getPath() {
    if (!this.database) {
      return;
    }

    const path = await this.database.getPath();

    this.out(`DB path: ${path}`);
    console.log(`DB path: ${path}`);
  }

  async getCount() {
    if (!this.database) {
      return;
    }

    const count = await this.database.getCount();

    this.out(`Doc count: ${count}`);
    console.log(`Doc count: ${count}`);
  }

  async update() {
    if (!this.doc) {
      return;
    }

    this.doc.setBoolean('isAwesome', true);

    await this.database.save(this.doc);

    this.out(`Updated document. id ${this.doc.getId()}`);

    console.log('Updated document. Id is', this.doc.getId());
  }

  async getDocument() {
    if (!this.lastDocId) {
      return;
    }
    const doc = await this.database.getDocument(this.lastDocId);
    console.log('Got document', doc);

    this.out(`Got document: ${JSON.stringify(doc.toDictionary())}`);
  }

  async deleteDocument() {
    if (!this.lastDocId) {
      return;
    }
    const doc = await this.database.getDocument(this.lastDocId);
    console.log('Deleteing document', doc);

    await this.database.deleteDocument(doc);

    this.out(`Deleted document ${doc.getId()}`);
  }

  async purgeDocument() {
    if (!this.lastDocId) {
      return;
    }
    const doc = await this.database.getDocument(this.lastDocId);
    console.log('Got document', doc);

    await this.database.purgeDocument(doc);

    this.out(`Purged document ${doc.getId()}`);
  }

  async query1() {
    console.log('Building query 1');
    let query = QueryBuilder.select(
      SelectResult.all(),
      SelectResult.property('name'),
      SelectResult.expression(Meta.id),
    )
      .from(DataSource.database(this.database))
      .where(Expression.property('type').equalTo(Expression.string('hotel')))
      .orderBy(Ordering.expression(Meta.id));

    const ret = await query.execute();
    this._query1Results = ret;
    console.log('Executed query', ret);

    this.out(`Executed query`);
  }

  async query1n1ql() {
    console.log('Building query 1 n1ql');
    let query = this.database.createQuery(
      'select META().id as thisId from _ where type = \"hotel\"'
    );

    const ret = await query.execute();
    this._query1Results = ret;
    console.log('Executed query', ret);

    this.out(`Executed query`);
  }

  async ftsQuery() {
    console.log('Building fts query 1');

    let whereClause = FullTextExpression.index('nameFTSIndex').match('ice');
    let query = QueryBuilder.select(SelectResult.all())
      .from(DataSource.database(this.database))
      .where(whereClause);

    const ret = await query.execute();
    this._query1Results = ret;
    console.log('Executed fts query', ret);

    this.out(`Executed fts query`);
  }

  async next1() {
    if (!this._query1Results) {
      return;
    }
    const ret = await this._query1Results.next();
    console.log('Moved next', ret);
    this.out(`Next result: ${JSON.stringify(ret)}`);
  }

  async nextBatch() {
    if (!this._query1Results) {
      return;
    }
    const ret = await this._query1Results.nextBatch();
    console.log('Moved next batch', ret);
    this.out(`Next batch: ${ret.length}`);
  }

  async all1() {
    if (!this._query1Results) {
      return;
    }
    const ret = await this._query1Results.allResults();
    console.log('All results', ret);
    this.out(`All results: ${JSON.stringify(ret)}`);
  }

  async queryDeleted() {
    console.log('Building query deleted');
    let query = QueryBuilder.select(
      SelectResult.all(),
      SelectResult.property('name'),
      SelectResult.expression(Meta.id),
    )
      .from(DataSource.database(this.database))
      .where(Meta.deleted);

    const ret = await query.execute();
    this._query1Results = ret;
    const all = await ret.allResults();
    console.log('Executed delete query', ret);
    console.log(all);

    this.out(`Executed deleted query`);
  }

  async query2() {
    console.log('Building query 2');
    let query = QueryBuilder.select(
      SelectResult.all(),
      SelectResult.property('name'),
      SelectResult.expression(Meta.id),
    )
      .from(DataSource.database(this.database))
      .where(
        Expression.property('name').equalTo(Expression.string('Saved Doc')),
      )
      .orderBy(Ordering.expression(Meta.id));

    const ret = await query.execute();
    this._query1Results = ret;
    console.log('Executed query', ret);

    this.out(`Executed query`);
  }

  async all2() {
    if (!this._query1Results) {
      return;
    }
    const ret = await this._query1Results.allResults();
    console.log('All results', ret.length);
    this.out(`All results: ${ret.length}`);
  }

  async allBatched() {
    if (!this._query1Results) {
      return;
    }

    let num = 0;
    let docs;
    while ((docs = await this._query1Results.nextBatch()).length) {
      console.log('Loaded ', docs.length);
      num += docs.length;
    }
    console.log(docs && docs.length);
    console.log('All results', num);
    this.out(`All results: ${num}`);
  }

  async foreach1() {
    if (!this._query1Results) {
      return;
    }
    console.log('For each');
    this._query1Results.forEach((result: Result) => {
      console.log('FOR', result);
    });
    this.out(`For query`);
  }

  async queryCreateTest() {
    for (let i = 0; i < 10000; i++) {
      let query = QueryBuilder.select(
        SelectResult.all(),
        SelectResult.property('name'),
        SelectResult.expression(Meta.id),
      )
        .from(DataSource.database(this.database))
        .where(Expression.property('type').equalTo(Expression.string('hotel')))
        .orderBy(Ordering.expression(Meta.id));

      query.execute().then(rs => this._queryTestResults.push(rs));
    }
  }

  async queryCreateTestCleanup() {
    this._queryTestResults.forEach(r => {
      r.cleanup();
    });
    this._queryTestResults = [];
  }

  async rsCleanup() {
    if (!this._query1Results) {
      return;
    }

    this._query1Results.cleanup();
  }

  async documentIdTest() {
    let doc = new MutableDocument()
      .setString('id', 'SuperId2')
      .setString('_id', 'SuperId');

    await this.database.save(doc);

    const newId = doc.getId();

    console.log('Got doc id', newId);

    const foundDoc = await this.database.getDocument(newId);

    console.log('Found doc', foundDoc);
    console.log(foundDoc.getId());

    const query1 = QueryBuilder.select(
      SelectResult.expression(Meta.id),
      SelectResult.property('id'),
    )
      .from(DataSource.database(this.database))
      //.where(Meta.id.equalTo(Expression.string('SuperId')));
      .where(Expression.property('id').equalTo(Expression.string('SuperId2')));

    const rs = await query1.execute();
    const all = await rs.allResults();
    console.log('Got all results', all);
  }

  async replicatorStart() {
    if (!this.database) {
      return;
    }

    if (this.replicator) {
      await this.replicator.start();
      this.out(`Replicator start`);
      return;
    }

    const database = this.database;
    // Create replicators to push and pull changes to and from the cloud.
    const targetEndpoint = new URLEndpoint('ws://localhost:4984/thedb5');
    const replConfig = new ReplicatorConfiguration(database, targetEndpoint);
    replConfig.setReplicatorType(
      ReplicatorConfiguration.ReplicatorType.PUSH_AND_PULL,
    );
    replConfig.setContinuous(true);

    // Add authentication.
    replConfig.setAuthenticator(
      new BasicAuthenticator('sync_gateway', 'testtest'),
    );
    //replConfig.setAuthenticator(new SessionAuthenticator('12345', 'token'));

    // Create replicator.
    const replicator = new Replicator(replConfig);

    // Listen to replicator change events.
    replicator.addChangeListener((change: ReplicatorChange) => {
      console.log('Replicator change!', JSON.stringify(change));
      if (change.error) {
        console.log('Error:: ', JSON.stringify(change.error));
      }
    });

    // Start replication.
    await replicator.start();

    this.replicator = replicator;

    this.out(`Replicator start`);
  }

  async replicatorStop() {
    if (!this.replicator) {
      return;
    }

    await this.replicator.stop();
    this.out(`Replicator stop`);
  }

  async replicatorResetCheckpoint() {
    if (!this.replicator) {
      return;
    }

    await this.replicator.resetCheckpoint();
    this.out(`Replicator reset checkpoint`);
  }

  async replicatorGetStatus() {
    if (!this.replicator) {
      return;
    }

    const status = await this.replicator.getStatus();
    this.out(`Replicator getStatus: ${JSON.stringify(status)}`);
  }

  async toggleLogLevel() {
    await this.database.setLogLevel(LogDomain.ALL, LogLevel.VERBOSE);
    this.out(`Log level toggled`);
  }

  async setFileConfig() {
    /*
    try {
      console.log('Setting file logging config in node');
      const req = window.require;
      const os = req('os');
      const path = req('path');
      console.log('Got path', os, path);
      await this.database.log.setFileConfig({
        level: LogLevel.VERBOSE,
        directory: path.join(process.env.HOME, '.cblenterprise'),
        maxRotateCount: 5
      });
      console.log('Configured logging!');
    } catch {
      */
    /*
    await this.database.log.setFileConfig({
      level: LogLevel.VERBOSE,
      directory: this.file.documentsDirectory,
      maxRotateCount: 5,
    });
    */
    /*
  }
  */
  }

  async replicatorTest() {
    const database = this.database;
    // Create replicators to push and pull changes to and from the cloud.
    const targetEndpoint = new URLEndpoint('ws://localhost:4984/example_sg_db');
    const replConfig = new ReplicatorConfiguration(database, targetEndpoint);
    replConfig.setReplicatorType(
      ReplicatorConfiguration.ReplicatorType.PUSH_AND_PULL,
    );

    // Add authentication.
    // replConfig.setAuthenticator(new BasicAuthenticator('john', 'pass'));
    // replConfig.setAuthenticator(new SessionAuthenticator('12345', 'token'));

    // Create replicator.
    const replicator = new Replicator(replConfig);

    // Listen to replicator change events.
    const listener = (change: ReplicatorChange) => {
      console.log('Replicator change in here!', change);
      if (change.error != null) {
        console.log('Error code ::  ' + change.error);
      }
    };

    replicator.addChangeListener(listener);

    // Start replication.
    await replicator.start();

    this.replicator = replicator;

    this.out(`Replicator start`);

    setTimeout(() => {
      this.out(`Replicator removed`);
      replicator.removeChangeListener(listener);
      setTimeout(() => {
        this.out(`Replicator added again`);
        replicator.addChangeListener(listener);
      }, 2000);
    }, 10000);
  }

  wait(n: number) {
    return new Promise<void>(resolve => {
      setTimeout(() => {
        resolve();
      }, n);
    });
  }

  async replicatorTest2() {
    const database = this.database;
    // Create replicators to push and pull changes to and from the cloud.
    const targetEndpoint = new URLEndpoint('ws://localhost:4984/example_sg_db');
    const replConfig = new ReplicatorConfiguration(database, targetEndpoint);
    replConfig.setReplicatorType(
      ReplicatorConfiguration.ReplicatorType.PUSH_AND_PULL,
    );

    let which = 1;

    // Add authentication.
    replConfig.setAuthenticator(new BasicAuthenticator('john', 'pass'));
    // replConfig.setAuthenticator(new SessionAuthenticator('12345', 'token'));
    // Create replicator.
    let replicator = new Replicator(replConfig);

    // Listen to replicator change events.
    const listener = (change: ReplicatorChange) => {
      console.log('Replicator change for!', which, change);
      if (change.error != null) {
        console.log('Error code ::  ' + change.error);
      }
    };

    replicator.addChangeListener(listener);

    // Start replication.
    await replicator.start();

    await this.wait(2000);

    await replicator.stop();
    await replicator.cleanup();
    await this.wait(5000);

    replicator.removeChangeListener(listener);
    await this.delete();
    await this.database.open();

    replicator = new Replicator(replConfig);

    which = 2;

    replicator.addChangeListener((change: ReplicatorChange) => {
      console.log('Replicator change 222222 for!', which, change);
      if (change.error != null) {
        console.log('Error code ::  ' + change.error);
      }
    });

    await replicator.start();
  }

  base64ToArrayBuffer(base64) {
    var binary_string = window.atob(base64);
    var len = binary_string.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer as ArrayBuffer;
  }

  arrayBufferToBase64(buffer: ArrayBuffer) {
    var binary = '';
    var bytes = new Uint8Array(buffer);
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  async blobTest() {
    let doc = new MutableDocument()
      .setString('name', 'Thing')
      .setBlob(
        'profile',
        new Blob(
          'image/jpeg',
          this.base64ToArrayBuffer(
            'iVBORw0KGgoAAAANSUhEUgAAAH4AAAAsCAMAAACUu/xGAAAAq1BMVEUAAABlZVJlZVKsrJthYU+zs6Grq5ylpZazs6FlZVJfX01lZVJlZVKsrJurq5urq5xlZVKtrZ1lZVJlZVKvr52zs6GysqCoqJeqqpmzs6Grq5xlZVJgYE6zs6Gnp5mrq5yiopRjY1CRkX2rq5yzs6FlZVKRkX2goJKKineRkX2Pj3yrq5yIiHWRkX2RkX2RkX1lZVKRkX2rq5yzs6GoqJdfX02goJKHh3SHh3VrpzVsAAAAMHRSTlMAQIDHx3+Ax0Ag7qBgIA9AEFCPMLOgMO7bYKBQ24+zYNuzkY9wcAXu0oiocPFBMHYlVbK0AAAD3UlEQVRYw6SW7Y6qMBCGB0IkLfKdnB9ocFmjru7HERL03P+VnXY6bdmWjcF9f2inxjydvjMDcHy99zP693oEpTpQYjBR7W4VmzA81GoZCDn/ycrValVmYOJcKBWL1/4HnUEpupLGxOI47iQmDkfc4GEBEFyNQkClzYDKQQs3VmJBufu6G7zRWNMeUzEHUnLVWs/gy9vg4NNB4wUIPOG2h7e8NcV0HRt7QPDxfzTd4ptleB5F6ro3NtsIc7UnjMKKXyuN30ZS+PuLRMW7PN+l2vlhAZ6yqCZmcrm05stfOrwVpvEBaJWStIOpVk/gC8Rb62tjRj25Fx/fEsgqE27cluKB8GR9hDFzeX44CFbmJb9/Cn8w1ldA5tO9VD/gc8FpveTbxfi1LXWOl10Z80c0Yx7/jpyyjRtd9zuxU8ZL8FEYJjZFpg6yIfOpKsf1FJ+EUkzddKkabQ+o0zCcwMN/vZm+uLh4UmW7nptTCBVq5nUF4Y0CgBaNVip18jsPn370909cfX708/gusF3fkQfrKZHXHh45Wi8meRefvfVCfwGOZ9zx8TZ9TjWY2M6vVf4jm8e3WYrDJ1Vj4N3FHwVd6vKFCxefBMFmq7ub6UI7TMZw0SEv8ryPDVaoxPiWufhL/02zY0cm3ZH1VgxIIYa1U/nIibH/EZjjp4M/9w/x9FijbyuqdzOVH+BbWQJxHMupd4pjINhDPKVH1lslBl9g6OKb73j0wmoBHrMj691nsJ0QLn4l0/09nrIm6wv7nGdQqwjGucvPJSWjN4z8aXyBlkfK+i2gmDI/HENGjXA9uPhsUJ22p2OQFg3daaFx0/9qnWBRbOl9hHlvOw3OW/xs4Hf4rcnYzj+OeFOIHj4dtG7/2y+b3IhBGAqjUiQWQ9JI/ErDpop6gcei9z9ZIXHIhLaLSGRW8zYxIuaTZccxqsGfHDXvH4cf37Z4e3ihxVOTp5bf4E8N2u+3PWB2SP7tXsfsFl80rtOeZX/gvz6//7tmnFFzD2mkxnFgL710ToHH1eCcm/LU2aA9m027v+kBH8ipyHbACxAMWaV5I4v2ZgAzIxkUGXIqkn3xrhw4wVe8hoMmOwBmYJMiJy+lHPriNcSyrvgEgUS2h/vl1BcvSqgcZsPbbABrhgdgvhgvS6hIYsPP8MwTVR5SLZA4573xHMpCV7xGZBFmxyProfR64yNCgKh4hygjXIuvpdcbPyEayA2vsEpRHcgl6gtzr8A9ho0RlgQnBPoK4tV45gBfGQZ6KQBDqzRcjdeAqQwHUfYp+SohcQdc1/Ukm4Gw4dV6vqTkM+uQpRv8E2VPF/sPp9xSb2qlGH4AAAAASUVORK5CYII=',
          ),
        ),
      );

    await this.database.save(doc);

    console.log('Saved doc', doc);
    let query = QueryBuilder.select(
      SelectResult.all(),
      SelectResult.property('name'),
      SelectResult.expression(Meta.id),
    )
      .from(DataSource.database(this.database))
      .where(Expression.property('name').equalTo(Expression.string('Thing')));

    const rs = await query.execute();

    const allDocs = await rs.allResults();
    console.log('Got all results', allDocs);
    const newDoc = await this.database.getDocument(doc.getId());
    console.log('Got new doc', newDoc);
    const blob = doc.getBlob('profile');
    const blobContent = await doc.getBlobContent('profile', this.database);
    console.log('Got blob', blob);
    console.log('Got blob content', blobContent);
    const b64 = this.arrayBufferToBase64(blobContent);
    console.log('Blob content to b64', b64);
    const newBlob = newDoc.getBlob('profile');
    const newBlobContent = await newDoc.getBlobContent(
      'profile',
      this.database,
    );
    console.log('Got new doc', newDoc);
    console.log('Got new blob', newBlob);
    const b642 = this.arrayBufferToBase64(newBlobContent);
    console.log('Got new blob content', b642);
    console.log(b642);
    // console.log('Got profile blob', newDoc.getBlob('profile'));
  }
}

const tester = new CBLTester();

const Home: React.FC = () => {
  const outputRef = useRef<HTMLDivElement | null>(null);
  const [output, setOutput] = useState('');

  const testerRef = useRef<CBLTester>(tester);

  const doChange = useCallback(() => {
    console.log('OUTPUT CHANGED', tester.output);
    setOutput(tester.output);
  }, []);
  useEffect(() => {
    tester.outputChanged = doChange;
  }, [tester.output]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Blank</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Blank</IonTitle>
          </IonToolbar>
        </IonHeader>
        <div id="output" dangerouslySetInnerHTML={{ __html: output }} />
        <IonButton onClick={() => testerRef.current.toggleLogLevel()}>
          Toggle Log Level
        </IonButton>
        <IonButton onClick={() => testerRef.current.setFileConfig()}>
          Set File Logging Config
        </IonButton>
        <IonButton onClick={() => testerRef.current.init()}>Open DB</IonButton>
        <IonButton onClick={() => testerRef.current.close()}>
          Close DB
        </IonButton>
        <hr />
        <IonButton onClick={() => testerRef.current.exists()}>
          DB Exists
        </IonButton>
        <IonButton onClick={() => testerRef.current.queryTest()}>
          Query Test
        </IonButton>
        <IonButton onClick={() => testerRef.current.delete()}>
          Delete DB
        </IonButton>
        <IonButton onClick={() => testerRef.current.compact()}>
          Compact DB
        </IonButton>
        <IonButton onClick={() => testerRef.current.getPath()}>
          Get DB Path
        </IonButton>
        <IonButton onClick={() => testerRef.current.delete()}>
          Delete DB
        </IonButton>
        <hr />
        <IonButton onClick={() => testerRef.current.createIndex()}>
          Create Index
        </IonButton>
        <IonButton onClick={() => testerRef.current.deleteIndex()}>
          Delete Index
        </IonButton>
        <IonButton onClick={() => testerRef.current.getIndexes()}>
          Get Indexes
        </IonButton>
        <hr />
        <IonButton onClick={() => testerRef.current.save()}>
          Save Document
        </IonButton>
        <IonButton onClick={() => testerRef.current.saveMany()}>
          Save Many
        </IonButton>
        <IonButton onClick={() => testerRef.current.getCount()}>
          Get Count
        </IonButton>
        <IonButton onClick={() => testerRef.current.update()}>
          Update Document
        </IonButton>
        <IonButton onClick={() => testerRef.current.getDocument()}>
          Get Document
        </IonButton>
        <IonButton onClick={() => testerRef.current.deleteDocument()}>
          Delete Document
        </IonButton>
        <IonButton onClick={() => testerRef.current.purgeDocument()}>
          Purge Document
        </IonButton>
        <hr />
        <IonButton onClick={() => testerRef.current.blobTest()}>
          Blob Test
        </IonButton>
        <hr />
        <IonButton onClick={() => testerRef.current.query1()}>
          Query 1
        </IonButton>
        <IonButton onClick={() => testerRef.current.query1n1ql()}>
          Query 1 N1QL
        </IonButton>
        <IonButton onClick={() => testerRef.current.ftsQuery()}>
          FTS Query
        </IonButton>
        <IonButton onClick={() => testerRef.current.next1()}>
          Next Result 1
        </IonButton>
        <IonButton onClick={() => testerRef.current.nextBatch()}>
          Next Result Batch 1
        </IonButton>
        <IonButton onClick={() => testerRef.current.all1()}>
          All Results 1
        </IonButton>
        <hr />
        <IonButton onClick={() => testerRef.current.queryDeleted()}>
          Query Deleted
        </IonButton>
        <hr />
        <IonButton onClick={() => testerRef.current.query2()}>
          Query many
        </IonButton>
        <IonButton onClick={() => testerRef.current.all2()}>
          All Results many
        </IonButton>
        <IonButton onClick={() => testerRef.current.allBatched()}>
          All Results many batched
        </IonButton>
        <IonButton onClick={() => testerRef.current.foreach1()}>
          For Each 1
        </IonButton>
        <hr />
        <IonButton onClick={() => testerRef.current.queryCreateTest()}>
          Query Memory Test
        </IonButton>
        <IonButton onClick={() => testerRef.current.queryCreateTestCleanup()}>
          Query Memory Test Cleanup
        </IonButton>
        <IonButton onClick={() => testerRef.current.documentIdTest()}>
          Document ID Test
        </IonButton>
        <hr />
        <IonButton onClick={() => testerRef.current.replicatorStart()}>
          Replicator Start
        </IonButton>
        <IonButton onClick={() => testerRef.current.replicatorStop()}>
          Replicator Stop
        </IonButton>
        <IonButton
          onClick={() => testerRef.current.replicatorResetCheckpoint()}
        >
          Replicator Reset Checkpoint
        </IonButton>
        <IonButton onClick={() => testerRef.current.replicatorGetStatus()}>
          Replicator Get Status
        </IonButton>
        <IonButton onClick={() => testerRef.current.replicatorTest()}>
          Replicator Test
        </IonButton>
        <IonButton onClick={() => testerRef.current.replicatorTest2()}>
          Replicator Test 2
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Home;
