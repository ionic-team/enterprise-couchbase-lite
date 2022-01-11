import { Database } from '.';
import { Query } from './query';
import { ResultSet } from './result-set';

export class N1qlQuery extends Query {
  constructor(private database: Database, public n1qlQuery: string) {
    super();
  }

  execute(): Promise<ResultSet> {
    return this.database.getEngine().Query_ExecuteN1ql(this.database, this);
  }
}