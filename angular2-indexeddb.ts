'use strict';

import {Injectable} from '@angular/core';

@Injectable()
export class AngularIndexedDB {
    private utils: Utils;
    private dbWrapper: DbWrapper;

    constructor(dbName, version) {
        this.utils = new Utils();
        this.dbWrapper = new DbWrapper(dbName, version);
    }

    createStore(version, upgradeCallback) {
        let self = this,
            promise = new Promise<any>((resolve, reject)=> {
                this.dbWrapper.dbVersion = version;
                let request = this.utils.indexedDB.open(this.dbWrapper.dbName, version);
                request.onsuccess = function (e) {
                    self.dbWrapper.db = request.result;
                    resolve();
                };

                request.onerror = function (e) {
                    reject("IndexedDB error: " + e.target.errorCode);
                };

                request.onupgradeneeded = function (e) {
                    upgradeCallback(e, self.dbWrapper.db);
                };
            });

        return promise;
    }

    getByKey(storeName: string, key: any) {
        let self = this;
        let promise = new Promise<any>((resolve, reject)=> {
            self.dbWrapper.validateBeforeTransaction(storeName, reject);

            let transaction = self.dbWrapper.createTransaction({ storeName: storeName,
                    dbMode: self.utils.dbMode.readOnly,
                    error: (e: Event) => {
                        reject(e);
                    },
                    complete: (e: Event) => {
                    }
                }),
                objectStore = transaction.objectStore(storeName),
                request;

            request = objectStore.get(key);
            request.onsuccess = function (event) {
                resolve(event.target.result);
            }
        });

        return promise;
    }

    getAll(storeName: string) {
        let self = this;
        let promise = new Promise<any>((resolve, reject)=> {
            self.dbWrapper.validateBeforeTransaction(storeName, reject);

            let transaction = self.dbWrapper.createTransaction({ storeName: storeName,
                    dbMode: self.utils.dbMode.readOnly,
                    error: (e: Event) => {
                        reject(e);
                    },
                    complete: (e: Event) => {
                    }
                }),
                objectStore = transaction.objectStore(storeName),
                result = [],
                request = objectStore.openCursor();

            request.onerror = function (e) {
                reject(e);
            };

            request.onsuccess = function (evt) {
                let cursor = (<IDBOpenDBRequest>evt.target).result;
                if (cursor) {
                    result.push(cursor.value);
                    cursor["continue"]();
                } else {
                    resolve(result);
                }
            };
        });

        return promise;
    }

    add(storeName: string, value: any, key: any) {
        let self = this;
        let promise = new Promise<any>((resolve, reject)=> {
            self.dbWrapper.validateBeforeTransaction(storeName, reject);

            let transaction = self.dbWrapper.createTransaction({ storeName: storeName,
                    dbMode: self.utils.dbMode.readWrite,
                    error: (e: Event) => {
                        reject(e);
                    },
                    complete: (e: Event) => {
                        resolve({ key: key, value: value });
                    }
                }),
                objectStore = transaction.objectStore(storeName);

            objectStore.add(value, key);
        });

        return promise;
    }

    update(storeName: string, value: any, key: any) {
        let self = this;
        let promise = new Promise<any>((resolve, reject)=> {
            self.dbWrapper.validateBeforeTransaction(storeName, reject);

            let transaction = self.dbWrapper.createTransaction({ storeName: storeName,
                    dbMode: self.utils.dbMode.readWrite,
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

        return promise;
    }

    delete(storeName: string, key: any) {
        let self = this;
        let promise = new Promise<any>((resolve, reject)=> {
            self.dbWrapper.validateBeforeTransaction(storeName, reject);

            let transaction = self.dbWrapper.createTransaction({ storeName: storeName,
                    dbMode: self.utils.dbMode.readWrite,
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

        return promise;
    }

    openCursor(storeName, cursorCallback: (evt) => void) {
        let self = this;
        let promise = new Promise<any>((resolve, reject)=> {
            self.dbWrapper.validateBeforeTransaction(storeName, reject);

            let transaction = self.dbWrapper.createTransaction({ storeName: storeName,
                    dbMode: self.utils.dbMode.readOnly,
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
                request = objectStore.openCursor();

            request.onsuccess = (evt) => {
                cursorCallback(evt);
                resolve();
            };
        });

        return promise;
    }

    clear(storeName: string) {
        let self = this;
        let promise = new Promise<any>((resolve, reject)=> {
            self.dbWrapper.validateBeforeTransaction(storeName, reject);

            let transaction = self.dbWrapper.createTransaction({ storeName: storeName,
                    dbMode: self.utils.dbMode.readWrite,
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

        return promise;
    }

    getByIndex(storeName: string, indexName: string, key: any) {
        let self = this;
        let promise = new Promise<any>((resolve, reject)=> {
            self.dbWrapper.validateBeforeTransaction(storeName, reject);

            let transaction = self.dbWrapper.createTransaction({ storeName: storeName,
                    dbMode: self.utils.dbMode.readOnly,
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

        return promise;
    }
}

class Utils {
    dbMode: DbMode;
    indexedDB;

    constructor() {
        this.indexedDB = window.indexedDB || (<any>window).mozIndexedDB || (<any>window).webkitIndexedDB || (<any>window).msIndexedDB;
        this.dbMode = {
            readOnly: "readonly",
            readWrite: "readwrite"
        };
    }
}

interface DbMode {
    readOnly: string;
    readWrite: string;
}

class DbWrapper {
    dbName: string;
    dbVersion: number;
    db: IDBDatabase;

    constructor(dbName, version) {
        this.dbName = dbName;
        this.dbVersion = version || 1;
        this.db = null;
    }

    validateStoreName(storeName) {
        return this.db.objectStoreNames.contains(storeName);
    };

    validateBeforeTransaction(storeName: string, reject) {
        if (!this.db) {
            reject('You need to use the createStore function to create a database before you query it!');
        }
        if (!this.validateStoreName(storeName)) {
            reject(('objectStore does not exists: ' + storeName));
        }
    }

    createTransaction(options: { storeName: string, dbMode: string, error: (e: Event) => any, complete: (e: Event) => any, abort?: (e:Event) => any }): IDBTransaction {
        let trans: IDBTransaction = this.db.transaction(options.storeName, options.dbMode);
        trans.onerror = options.error;
        trans.oncomplete = options.complete;
        trans.onabort = options.abort;
        return trans;
    }
}
