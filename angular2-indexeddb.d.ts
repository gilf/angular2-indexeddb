export declare class AngularIndexedDB {
    private utils;
    private dbWrapper;
    constructor(dbName: string, version: number);
    createStore(version: number, upgradeCallback: Function): Promise<any>;
    getByKey(storeName: string, key: any): Promise<any>;
    getAll(storeName: string, keyRange?: IDBKeyRange, indexName?: string): Promise<any>;
    add(storeName: string, value: any, key?: any): Promise<any>;
    update(storeName: string, value: any, key?: any): Promise<any>;
    delete(storeName: string, key: any): Promise<any>;
    openCursor(storeName: string, cursorCallback: (evt: Event) => void, keyRange?: IDBKeyRange): Promise<any>;
    clear(storeName: string): Promise<any>;
    getByIndex(storeName: string, indexName: string, key: any): Promise<any>;
}
