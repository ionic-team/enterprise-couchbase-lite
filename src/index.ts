import { registerPlugin } from '@capacitor/core';

import type { IonicCouchbaseLitePlugin } from './definitions';

export * from './couchbase-lite/index';

const IonicCouchbaseLite = registerPlugin<IonicCouchbaseLitePlugin>(
  'IonicCouchbaseLite',
  {
    ios: () => import('./impl').then(m => new m.IonicCouchbaseLite()),
    android: () => import('./impl').then(m => new m.IonicCouchbaseLite()),
    windows: () => import('./impl').then(m => new m.IonicCouchbaseLite()),
  },
);

export * from './definitions';
export { IonicCouchbaseLite };
