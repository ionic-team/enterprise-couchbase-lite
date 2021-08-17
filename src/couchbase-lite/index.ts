export * from './abstract-index';
export * from './authenticator';
export * from './array-function';
export * from './basic-authenticator';
export * from './blob';
export * from './collation';
export * from './couchbase-lite-exception';
export * from './data-source';
export * from './database-configuration';
export * from './database';
export * from './definitions';
export * from './document';
export * from './document-replication';
export * from './endpoint';
export * from './engine/index';
export * from './engine/cordova';
export * from './expression';
export * from './from';
export * from './function';
export * from './full-text-expression';
export * from './full-text-index';
export * from './group-by';
export * from './having';
export * from './index-builder';
export * from './join';
export * from './joins';
export * from './limit';
export * from './meta';
export * from './meta-expression';
export * from './mutable-document';
export * from './order-by';
export * from './ordering';
export * from './parameters';
export * from './query-builder';
export * from './query';
export * from './replicator';
export * from './replicator-change';
export * from './replicator-configuration';
export * from './replicated-document';
export * from './result';
export * from './result-set';
export * from './select-result';
export * from './select';
export * from './session-authenticator';
export * from './url-endpoint';
export * from './value-index';
export * from './where';

declare var window: any;
export class IonicCBL {
  static _onReady: () => void = null;
  static onReady(cb: () => void) {
    this._onReady = cb;
    document.addEventListener('deviceready', () => {
      this.fireOnReady();
    });

    if (window.process) {
      // Electron fire on ready
      this.fireOnReady();
    }
  }
  static fireOnReady() {
    console.log('FIRING ON READY', this._onReady);
    this._onReady && this._onReady();
  }
}
