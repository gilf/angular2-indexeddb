'use strict';

import {Injectable} from 'angular2/core';

@Injectable()
export class AngularIndexedDB {
    utils: Utils;
    dbWrapper: DbWrapper;

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

    getByKey(storeName: string, key) {
        let self = this;
        let promise = new Promise<any>((resolve, reject)=> {
            if (!self.dbWrapper.db) {
                 reject('You need to use the createStore function to create a database before you query it!');
            }
            if (!self.dbWrapper.validateStoreName(storeName)) {
                reject('objectStore does not exists: ' + storeName);
            }

            let transaction = self.dbWrapper.createTransaction({ storeName: storeName,
                    dbMode: self.utils.dbMode.readonly,
                    error: (e: Event) => {
                        reject(e);
                    },
                    complete: (e: Event) => {
                        resolve(result);
                    }
                }),
                objectStore = transaction.objectStore(storeName),
                result,
                request;

            request = objectStore.get(key);
            request.onsuccess = function (event) {
                result = event.target.result;
            }
        });

        return promise;
    }

    getAll(storeName: string) {
        let self = this;
        let promise = new Promise<any>((resolve, reject)=> {
            if (!self.dbWrapper.db) {
                reject('You need to use the createStore function to create a database before you query it!');
            }
            if (!self.dbWrapper.validateStoreName(storeName)) {
                reject('objectStore does not exists: ' + storeName);
            }

            let transaction = self.dbWrapper.createTransaction({ storeName: storeName,
                    dbMode: self.utils.dbMode.readonly,
                    error: (e: Event) => {
                        reject(e);
                    },
                    complete: (e: Event) => {
                        resolve(result);
                    }
                }),
                objectStore = transaction.objectStore(storeName),
                result = [],
                request = objectStore.openCursor();

            request.onerror = function (e) {
                reject(e);
            };

            request.onsuccess = function (evt) {
                var cursor = evt.target.result;
                if (cursor) {
                    result.push(cursor.value);
                    cursor["continue"]();
                }
            };
        });

        return promise;
    }

    add(storeName: string, key: any, value: any) {
        let self = this;
        let promise = new Promise<any>((resolve, reject)=> {
            if (!self.dbWrapper.db) {
                reject('You need to use the createStore function to create a database before you query it!');
            }
            if (!self.dbWrapper.validateStoreName(storeName)) {
                reject('objectStore does not exists: ' + storeName);
            }

            let transaction = self.dbWrapper.createTransaction({ storeName: storeName,
                    dbMode: self.utils.dbMode.readwrite,
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

    update(storeName: string, value: any) {
        let self = this;
        let promise = new Promise<any>((resolve, reject)=> {
            if (!self.dbWrapper.db) {
                reject('You need to use the createStore function to create a database before you query it!');
            }
            if (!self.dbWrapper.validateStoreName(storeName)) {
                reject('objectStore does not exists: ' + storeName);
            }

            let transaction = self.dbWrapper.createTransaction({ storeName: storeName,
                    dbMode: self.utils.dbMode.readwrite,
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

            objectStore.put(value);
        });

        return promise;
    }

    delete(storeName: string, key: any) {
        let self = this;
        let promise = new Promise<any>((resolve, reject)=> {
            if (!self.dbWrapper.db) {
                reject('You need to use the createStore function to create a database before you query it!');
            }
            if (!self.dbWrapper.validateStoreName(storeName)) {
                reject('objectStore does not exists: ' + storeName);
            }

            let transaction = self.dbWrapper.createTransaction({ storeName: storeName,
                    dbMode: self.utils.dbMode.readwrite,
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
            if (!self.dbWrapper.db) {
                reject('You need to use the createStore function to create a database before you query it!');
            }
            if (!self.dbWrapper.validateStoreName(storeName)) {
                reject('objectStore does not exists: ' + storeName);
            }

            let transaction = self.dbWrapper.createTransaction({ storeName: storeName,
                    dbMode: self.utils.dbMode.readonly,
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
}

class Utils {
    dbMode: DbMode;
    indexedDB;

    constructor() {
        this.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
        this.dbMode = {
            readonly: "readonly",
            readwrite: "readwrite"
        };
    }
}

interface DbMode {
    readonly: string;
    readwrite: string;
}

class DbWrapper {
    dbName: string;
    dbVersion: number;
    db;
    storeNames: Array<string>;

    constructor(dbName, version) {
        this.dbName = dbName;
        this.dbVersion = version || 1;
        this.db = null;
        this.storeNames = [];
    }

    validateStoreName = function(storeName) {
        return this.db.objectStoreNames.contains(storeName);
    };

    createTransaction(options: { storeName: string, dbMode: string, error: (e: Event) => any, complete: (e: Event) => any, abort?: (e:Event) => any }): IDBTransaction {
        let trans: IDBTransaction = this.db.transaction(options.storeName, options.dbMode);
        trans.onerror = options.error;
        trans.oncomplete = options.complete;
        trans.onabort = options.abort;
        return trans;
    }
}