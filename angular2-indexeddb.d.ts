/// <reference types="es6-promise" />
export declare class AngularIndexedDB {
    private utils;
    private dbWrapper;
    constructor(dbName: any, version: any);
    createStore(version: any, upgradeCallback: any): Promise<any>;
    getByKey(storeName: string, key: any): Promise<any>;
    getAll(storeName: string, keyRange?: IDBKeyRange): Promise<any>;
    add(storeName: string, value: any, key?: any): Promise<any>;
    update(storeName: string, value: any, key?: any): Promise<any>;
    delete(storeName: string, key: any): Promise<any>;
    openCursor(storeName: any, cursorCallback: (evt) => void, keyRange?: IDBKeyRange): Promise<any>;
    clear(storeName: string): Promise<any>;
    getByIndex(storeName: string, indexName: string, key: any): Promise<any>;
}
