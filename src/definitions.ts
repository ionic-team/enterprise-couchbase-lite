export interface IonicCouchbaseLitePlugin {
  echo(options: { value: string }): Promise<{ value: string }>;
}
