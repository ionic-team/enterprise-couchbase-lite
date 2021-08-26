import { Result } from './result';
import { Query } from './query';
import { Database } from './database';

export class ResultSet {
  constructor(
    private query: Query,
    private resultSetId: string,
    private columnNames: any,
  ) {}

  allResults(): Promise<Result[]> {
    return new Promise((resolve, reject) => {
      const db = this.query.getFrom().getSource() as Database;
      const results: any = [];
      db.getEngine().ResultSet_AllResults(
        db,
        this.resultSetId,
        (data: any[], err: any) => {
          if (err) {
            reject(err);
            return;
          }
          if (data.length === 0) {
            resolve(results);
          }
          results.push(...data);
        },
      );
    });
  }

  next(): Promise<Result> {
    const db = this.query.getFrom().getSource() as Database;
    return db.getEngine().ResultSet_Next(db, this.resultSetId);
  }

  async nextBatch(): Promise<Result[]> {
    const db = this.query.getFrom().getSource() as Database;
    return (await db.getEngine().ResultSet_NextBatch(db, this.resultSetId))
      .results;
  }

  cleanup(): Promise<void> {
    const db = this.query.getFrom().getSource() as Database;
    return db.getEngine().ResultSet_Cleanup(db, this.resultSetId);
  }

  async forEach(itemHandler: (result: Result) => void) {
    let result;
    while ((result = await this.next())) {
      itemHandler(result);
    }
  }
}