'use strict';

export class AngularIndexedDB {
    utils: Utils;
    dbWrapper: DbWrapper;

    constructor(dbName: string, version: number) {
        this.utils = new Utils();
        this.dbWrapper = new DbWrapper(dbName, version);
    }

    openDatabase(version: number, upgradeCallback?: Function) {
        let self = this;
        return new Promise<any>((resolve, reject)=> {
            this.dbWrapper.dbVersion = version;
            let request = this.utils.indexedDB.open(this.dbWrapper.dbName, version);
            request.onsuccess = function (e) {
                self.dbWrapper.db = request.result;
                resolve(request.result);
            };

            request.onerror = function (e) {
                reject('IndexedDB error: ' + (<any>e.target).errorCode ?
                    (<any>e.target).errorCode  + ' (' + (<any>e.target).error + ')' :
                    (<any>e.target).errorCode);
            };

            if (typeof upgradeCallback === "function") {
                request.onupgradeneeded = function (e) {
                    upgradeCallback(e, self.dbWrapper.db);
                };
            }
        });
    }

    getByKey(storeName: string, key: any) {
        let self = this;
        return new Promise<any>((resolve, reject)=> {
            self.dbWrapper.validateBeforeTransaction(storeName, reject);

            let transaction = self.dbWrapper.createTransaction({ storeName: storeName,
                    dbMode: "readonly",
                    error: (e: Event) => {
                        reject(e);
                    },
                    complete: (e: Event) => {
                    }
                }),
                objectStore = transaction.objectStore(storeName),
                request: IDBRequest;

            request = objectStore.get(key);
            request.onsuccess = function (event: Event) {
                resolve((<any>event.target).result);
            }
        });
    }

    getAll(storeName: string, keyRange?: IDBKeyRange, indexDetails?: IndexDetails) {
        let self = this;
        return new Promise<any>((resolve, reject)=> {
            self.dbWrapper.validateBeforeTransaction(storeName, reject);

            let transaction = self.dbWrapper.createTransaction({ storeName: storeName,
                    dbMode: "readonly",
                    error: (e: Event) => {
                        reject(e);
                    },
                    complete: (e: Event) => {
                    }
                }),
                objectStore = transaction.objectStore(storeName),
                result: Array<any> = [],
                request: IDBRequest;
                if(indexDetails) {
                    let index = objectStore.index(indexDetails.indexName),
                        order = (indexDetails.order === 'desc') ? 'prev' : 'next';
                    request = index.openCursor(keyRange, <IDBCursorDirection>order);
                }
                else {
                    request = objectStore.openCursor(keyRange);
                }

            request.onerror = function (e) {
                reject(e);
            };

            request.onsuccess = function (evt: Event) {
                let cursor = (<IDBOpenDBRequest>evt.target).result;
                if (cursor) {
                    result.push(cursor["value"]);
                    cursor["continue"]();
                } else {
                    resolve(result);
                }
            };
        });
    }

    add(storeName: string, value: any, key?: any) {
        let self = this;
        return new Promise<any>((resolve, reject)=> {
            self.dbWrapper.validateBeforeTransaction(storeName, reject);

            let transaction = self.dbWrapper.createTransaction({ storeName: storeName,
                    dbMode: "readwrite",
                    error: (e: Event) => {
                        reject(e);
                    },
                    complete: (e: Event) => {
                        resolve({ key: key, value: value });
                    }
                }),
                objectStore = transaction.objectStore(storeName);

            let request = objectStore.add(value, key);
            request.onsuccess = (evt: any) => {
                key = evt.target.result;
            }
        });
    }

    update(storeName: string, value: any, key?: any) {
        let self = this;
        return new Promise<any>((resolve, reject)=> {
            self.dbWrapper.validateBeforeTransaction(storeName, reject);

            let transaction = self.dbWrapper.createTransaction({ storeName: storeName,
                    dbMode: "readwrite",
                    error: (e: Event) => {
                        reject(e);
                    },
                    complete: (e: Event) => {
                        resolve(value);
                    },
                    abort: (e: Event) => {
                        reject(e);
                    }
                }),
                objectStore = transaction.objectStore(storeName);

            objectStore.put(value, key);
        });
    }

    delete(storeName: string, key: any) {
        let self = this;
        return new Promise<any>((resolve, reject)=> {
            self.dbWrapper.validateBeforeTransaction(storeName, reject);

            let transaction = self.dbWrapper.createTransaction({ storeName: storeName,
                    dbMode: "readwrite",
                    error: (e: Event) => {
                        reject(e);
                    },
                    complete: (e: Event) => {
                        resolve();
                    },
                    abort: (e: Event) => {
                        reject(e);
                    }
                }),
                objectStore = transaction.objectStore(storeName);

            objectStore["delete"](key);
        });
    }

    openCursor(storeName: string, cursorCallback: (evt: Event) => void, keyRange?: IDBKeyRange) {
        let self = this;
        return new Promise<any>((resolve, reject)=> {
            self.dbWrapper.validateBeforeTransaction(storeName, reject);

            let transaction = self.dbWrapper.createTransaction({ storeName: storeName,
                    dbMode: "readonly",
                    error: (e: Event) => {
                        reject(e);
                    },
                    complete: (e: Event) => {
                        resolve();
                    },
                    abort: (e: Event) => {
                        reject(e);
                    }
                }),
                objectStore = transaction.objectStore(storeName),
                request = objectStore.openCursor(keyRange);

            request.onsuccess = (evt: Event) => {
                cursorCallback(evt);
                resolve();
            };
        });
    }

    clear(storeName: string) {
        let self = this;
        return new Promise<any>((resolve, reject)=> {
            self.dbWrapper.validateBeforeTransaction(storeName, reject);

            let transaction = self.dbWrapper.createTransaction({ storeName: storeName,
                    dbMode: "readwrite",
                    error: (e: Event) => {
                        reject(e);
                    },
                    complete: (e: Event) => {
                        resolve();
                    },
                    abort: (e: Event) => {
                        reject(e);
                    }
                }),
                objectStore = transaction.objectStore(storeName);
            objectStore.clear();
            resolve();
        });
    }

    getByIndex(storeName: string, indexName: string, key: any) {
        let self = this;
        return new Promise<any>((resolve, reject)=> {
            self.dbWrapper.validateBeforeTransaction(storeName, reject);

            let transaction = self.dbWrapper.createTransaction({ storeName: storeName,
                    dbMode: "readonly",
                    error: (e: Event) => {
                        reject(e);
                    },
                    abort: (e: Event) => {
                        reject(e);
                    },
                    complete: (e: Event) => {
                    }
                }),
                objectStore = transaction.objectStore(storeName),
                index = objectStore.index(indexName),
                request = index.get(key);

            request.onsuccess = (event) => {
                resolve((<IDBOpenDBRequest>event.target).result);
            };
        });
    }
}

export class Utils {
    indexedDB: IDBFactory;

    constructor() {
        this.indexedDB = window.indexedDB || (<any>window).mozIndexedDB || (<any>window).webkitIndexedDB || (<any>window).msIndexedDB;
    }
}

export interface IndexDetails {
    indexName: string;
    order: string;
}

export class DbWrapper {
    dbName: string;
    dbVersion: number;
    db: IDBDatabase;

    constructor(dbName: string, version: number) {
        this.dbName = dbName;
        this.dbVersion = version || 1;
        this.db = null;
    }

    validateStoreName(storeName: string) {
        return this.db.objectStoreNames.contains(storeName);
    };

    validateBeforeTransaction(storeName: string, reject: Function) {
        if (!this.db) {
            reject('You need to use the openDatabase function to create a database before you query it!');
        }
        if (!this.validateStoreName(storeName)) {
            reject(('objectStore does not exists: ' + storeName));
        }
    }

    createTransaction(options: { storeName: string, dbMode: IDBTransactionMode, error: (e: Event) => any, complete: (e: Event) => any, abort?: (e:Event) => any }): IDBTransaction {
        let trans: IDBTransaction = this.db.transaction(options.storeName, options.dbMode);
        trans.onerror = options.error;
        trans.oncomplete = options.complete;
        trans.onabort = options.abort;
        return trans;
    }
}
