import { WebPlugin } from '@capacitor/core';

import type { IonicCouchbaseLitePlugin } from './definitions';

export class IonicCouchbaseLiteWeb extends WebPlugin implements IonicCouchbaseLitePlugin {
  async echo(options: { value: string }): Promise<{ value: string }> {
    console.log('ECHO', options);
    return options;
  }
}
