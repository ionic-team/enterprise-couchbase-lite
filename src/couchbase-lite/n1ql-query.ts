import { Database } from '.';
import { DataSource } from './data-source';
import { Query } from './query';
import { ResultSet } from './result-set';

export class N1qlQuery extends Query {
  private datasource: DataSource;

  constructor(private database: Database, public n1qlQuery: string) {
    super();
    this.datasource = new DataSource(database);
  }

  execute(): Promise<ResultSet> {
    return this.database.getEngine().Query_ExecuteN1ql(this.database, this);
  }

  getFrom(): DataSource {
      return this.datasource;
  }
}