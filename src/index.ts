import { registerPlugin } from '@capacitor/core';

import type { IonicCouchbaseLitePlugin } from './definitions';

const IonicCouchbaseLite = registerPlugin<IonicCouchbaseLitePlugin>('IonicCouchbaseLite', {
  web: () => import('./web').then(m => new m.IonicCouchbaseLiteWeb()),
});

export * from './definitions';
export { IonicCouchbaseLite };
