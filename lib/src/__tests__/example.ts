import { Database } from "../database";
import { MutableDocument } from "../mutable-document";
import { QueryBuilder } from "../query-builder";
import { SelectResult } from "../select-result";
import { Expression } from "../expression";
import { DataSource } from "../data-source";


import { green, bold, italic } from 'colorette';
import { Meta } from "../meta";
import { Ordering } from "../ordering";
import { Query } from "../query";
import { CordovaEngine } from "../engine/cordova";
import { Result } from "../result";
import { URLEndpoint } from "../url-endpoint";
import { ReplicatorConfiguration } from "../replicator-configuration";
import { BasicAuthenticator } from "../basic-authenticator";
import { Replicator } from "../replicator";
import { ReplicatorChange } from "../replicator-change";

declare var global:any;

class CouchbaseLiteMock {
  dbs: any = {};
  docCount = 0;
  resultSetCount = 0;
  resultIndex = 0;
  results = [{
    id: '1',
    type: 'hotel',
  }, {
    id: '2',
    type: 'hotel',
  }, {
    id: '3',
    type: 'hotel',
  }]

  constructor() {
  }

  exec(action: string, args: any[]) {
    console.log(green(bold('[Couchbase]')), action, ...args);
    switch (action) {
      case 'Database_Open': 
        console.log('Opening database', action, args);
        this.dbs[args[0]] =  { name: args }
        break;
      case 'Database_Save': {
        const dbname = args[0];
        const db = this.dbs[dbname];
        console.log('Saving database', db);
        return Promise.resolve({
          id: this.docCount++
        });
      }
      case 'Database_Close': {
        const dbname = args[0];
        const db = this.dbs[dbname];
        console.log('Closing database', db);
        break;
      }
      case 'Query_Execute': {
        console.log('Executing query');
        // Reset the result index
        this.resultIndex = 0;
        return Promise.resolve({
          id: this.resultSetCount++
        })
      }
      case 'ResultSet_Next': {
        return Promise.resolve(this.results[this.resultIndex++] || null)
      }
      case 'ResultSet_AllResults': {
        return Promise.resolve({});
      }
    }
  }
}

global.IonicCouchbaseLite = new CouchbaseLiteMock();

class Example {
  database: Database;
  constructor() {
  }

  async run() {
    const database = new Database("mydb")
    database.setEngine(new CordovaEngine());
    database.open();
    this.database = database;

    let doc = new MutableDocument()
                .setFloat("version", 2.0)
                .setString("type", 'SDK');
    
    await database.save(doc);

    doc = MutableDocument.fromDocument((await database.getDocument(doc.getId())));

    doc.setString("language", "Java");

    await database.save(doc);

    const document = await database.getDocument(doc.getId());

    console.log("Document ID:", document.getId());
    console.log("Learning ", document.getString("language"));

    const query = QueryBuilder.select(SelectResult.all())
                  .from(DataSource.database(database))
                  .where(Expression.property('type').equalTo(Expression.string('SDK')));

    const result = await query.execute();

    console.log('Number of rows', (await result.allResults()).length);
  }
}

describe('Example', () => {
  it('Should run example', async () => {
    try {
      const example = new Example();
      await example.run();
    } catch (e) {
      console.error('Exception when running example', e);
    }
    expect(1).toBe(1);
  });
})

describe('Queries', () => {
  let database: Database;
  let query: Query;

  beforeEach(async () => {
    database = new Database("mydb")
    console.log('Setting engine');
    database.setEngine(new CordovaEngine());
    await database.open();

    query = QueryBuilder.select(SelectResult.expression(Meta.id),
        SelectResult.property("name"),
        SelectResult.property("type"))
    .from(DataSource.database(database))
    .where(Expression.property("type").equalTo(Expression.string("hotel")))
    .orderBy(Ordering.expression(Meta.id));
  });
  it('Should generate basic query', async () => {
    expect(query.toJson()).toEqual({
      "ORDER_BY": [
        [
          "._id",
        ],
      ],
      "WHAT": [
        [
          "._id",
        ],
        [
          ".name",
        ],
        [
          ".type",
        ],
      ],
      "WHERE": [
        "=",
        [
          ".type",
        ],
        "hotel",
      ],
    });
  })

  it('Should forEach loop results', async () => {
    const ret = await query.execute();

    const resultHandler = jest.fn();

    await ret.forEach(resultHandler)

    expect(resultHandler).toHaveBeenCalledTimes(global.IonicCouchbaseLite.results.length);
  });
});

describe('Replicator', () => {
  let database: Database;

  beforeEach(async () => {
    database = new Database("mydb")
    console.log('Setting engine');
    database.setEngine(new CordovaEngine());
    await database.open();
  });

  it('Should init replicator', () => {
    // Create replicators to push and pull changes to and from the cloud.
    const targetEndpoint = new URLEndpoint("ws://localhost:4984/example_sg_db");
    const replConfig = new ReplicatorConfiguration(database, targetEndpoint);
    replConfig.setReplicatorType(ReplicatorConfiguration.ReplicatorType.PUSH_AND_PULL);

    // Add authentication.
    replConfig.setAuthenticator(new BasicAuthenticator("john", "pass"));

    // Create replicator.
    const replicator = new Replicator(replConfig);

    // Listen to replicator change events.
    replicator.addChangeListener((change: ReplicatorChange) => {
      if (change.error != null) {
        console.log("Error code ::  " + change.error.code);
      }
    });

    // Start replication.
    replicator.start();
  })
});
