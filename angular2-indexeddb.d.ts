export declare class AngularIndexedDB {
    private utils;
    private dbWrapper;
    constructor(dbName: any, version: any);
    createStore(version: any, upgradeCallback: any): any;
    getByKey(storeName: string, key: any): any;
    getAll(storeName: string): any;
    add(storeName: string, value: any, key: any): any;
    update(storeName: string, value: any, key: any): any;
    delete(storeName: string, key: any): any;
    openCursor(storeName: any, cursorCallback: (evt) => void): any;
    clear(storeName: string): any;
    getByIndex(storeName: string, indexName: string, key: any): any;
}
