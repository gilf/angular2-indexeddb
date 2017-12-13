'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var AngularIndexedDB = /** @class */ (function () {
    function AngularIndexedDB(dbName, version) {
        this.utils = new Utils();
        this.dbWrapper = new DbWrapper(dbName, version);
    }
    AngularIndexedDB.prototype.openDatabase = function (version, upgradeCallback) {
        var _this = this;
        var self = this;
        return new Promise(function (resolve, reject) {
            _this.dbWrapper.dbVersion = version;
            var request = _this.utils.indexedDB.open(_this.dbWrapper.dbName, version);
            request.onsuccess = function (e) {
                self.dbWrapper.db = request.result;
                resolve();
            };
            request.onerror = function (e) {
                reject("IndexedDB error: " + e.target.errorCode);
            };
            if (typeof upgradeCallback === "function") {
                request.onupgradeneeded = function (e) {
                    upgradeCallback(e, self.dbWrapper.db);
                };
            }
        });
    };
    AngularIndexedDB.prototype.getByKey = function (storeName, key) {
        var self = this;
        return new Promise(function (resolve, reject) {
            self.dbWrapper.validateBeforeTransaction(storeName, reject);
            var transaction = self.dbWrapper.createTransaction({ storeName: storeName,
                dbMode: "readonly",
                error: function (e) {
                    reject(e);
                },
                complete: function (e) {
                }
            }), objectStore = transaction.objectStore(storeName), request;
            request = objectStore.get(key);
            request.onsuccess = function (event) {
                resolve(event.target.result);
            };
        });
    };
    AngularIndexedDB.prototype.getAll = function (storeName, keyRange, indexDetails) {
        var self = this;
        return new Promise(function (resolve, reject) {
            self.dbWrapper.validateBeforeTransaction(storeName, reject);
            var transaction = self.dbWrapper.createTransaction({ storeName: storeName,
                dbMode: "readonly",
                error: function (e) {
                    reject(e);
                },
                complete: function (e) {
                }
            }), objectStore = transaction.objectStore(storeName), result = [], request;
            if (indexDetails) {
                var index = objectStore.index(indexDetails.indexName), order = (indexDetails.order === 'desc') ? 'prev' : 'next';
                request = index.openCursor(keyRange, order);
            }
            else {
                request = objectStore.openCursor(keyRange);
            }
            request.onerror = function (e) {
                reject(e);
            };
            request.onsuccess = function (evt) {
                var cursor = evt.target.result;
                if (cursor) {
                    result.push(cursor.value);
                    cursor["continue"]();
                }
                else {
                    resolve(result);
                }
            };
        });
    };
    AngularIndexedDB.prototype.add = function (storeName, value, key) {
        var self = this;
        return new Promise(function (resolve, reject) {
            self.dbWrapper.validateBeforeTransaction(storeName, reject);
            var transaction = self.dbWrapper.createTransaction({ storeName: storeName,
                dbMode: "readwrite",
                error: function (e) {
                    reject(e);
                },
                complete: function (e) {
                    resolve({ key: key, value: value });
                }
            }), objectStore = transaction.objectStore(storeName);
            var request = objectStore.add(value, key);
            request.onsuccess = function (evt) {
                key = evt.target.result;
            };
        });
    };
    AngularIndexedDB.prototype.update = function (storeName, value, key) {
        var self = this;
        return new Promise(function (resolve, reject) {
            self.dbWrapper.validateBeforeTransaction(storeName, reject);
            var transaction = self.dbWrapper.createTransaction({ storeName: storeName,
                dbMode: "readwrite",
                error: function (e) {
                    reject(e);
                },
                complete: function (e) {
                    resolve(value);
                },
                abort: function (e) {
                    reject(e);
                }
            }), objectStore = transaction.objectStore(storeName);
            objectStore.put(value, key);
        });
    };
    AngularIndexedDB.prototype.delete = function (storeName, key) {
        var self = this;
        return new Promise(function (resolve, reject) {
            self.dbWrapper.validateBeforeTransaction(storeName, reject);
            var transaction = self.dbWrapper.createTransaction({ storeName: storeName,
                dbMode: "readwrite",
                error: function (e) {
                    reject(e);
                },
                complete: function (e) {
                    resolve();
                },
                abort: function (e) {
                    reject(e);
                }
            }), objectStore = transaction.objectStore(storeName);
            objectStore["delete"](key);
        });
    };
    AngularIndexedDB.prototype.openCursor = function (storeName, cursorCallback, keyRange) {
        var self = this;
        return new Promise(function (resolve, reject) {
            self.dbWrapper.validateBeforeTransaction(storeName, reject);
            var transaction = self.dbWrapper.createTransaction({ storeName: storeName,
                dbMode: "readonly",
                error: function (e) {
                    reject(e);
                },
                complete: function (e) {
                    resolve();
                },
                abort: function (e) {
                    reject(e);
                }
            }), objectStore = transaction.objectStore(storeName), request = objectStore.openCursor(keyRange);
            request.onsuccess = function (evt) {
                cursorCallback(evt);
                resolve();
            };
        });
    };
    AngularIndexedDB.prototype.clear = function (storeName) {
        var self = this;
        return new Promise(function (resolve, reject) {
            self.dbWrapper.validateBeforeTransaction(storeName, reject);
            var transaction = self.dbWrapper.createTransaction({ storeName: storeName,
                dbMode: "readwrite",
                error: function (e) {
                    reject(e);
                },
                complete: function (e) {
                    resolve();
                },
                abort: function (e) {
                    reject(e);
                }
            }), objectStore = transaction.objectStore(storeName);
            objectStore.clear();
            resolve();
        });
    };
    AngularIndexedDB.prototype.getByIndex = function (storeName, indexName, key) {
        var self = this;
        return new Promise(function (resolve, reject) {
            self.dbWrapper.validateBeforeTransaction(storeName, reject);
            var transaction = self.dbWrapper.createTransaction({ storeName: storeName,
                dbMode: "readonly",
                error: function (e) {
                    reject(e);
                },
                abort: function (e) {
                    reject(e);
                },
                complete: function (e) {
                }
            }), objectStore = transaction.objectStore(storeName), index = objectStore.index(indexName), request = index.get(key);
            request.onsuccess = function (event) {
                resolve(event.target.result);
            };
        });
    };
    return AngularIndexedDB;
}());
exports.AngularIndexedDB = AngularIndexedDB;
var Utils = /** @class */ (function () {
    function Utils() {
        this.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    }
    return Utils;
}());
exports.Utils = Utils;
var DbWrapper = /** @class */ (function () {
    function DbWrapper(dbName, version) {
        this.dbName = dbName;
        this.dbVersion = version || 1;
        this.db = null;
    }
    DbWrapper.prototype.validateStoreName = function (storeName) {
        return this.db.objectStoreNames.contains(storeName);
    };
    ;
    DbWrapper.prototype.validateBeforeTransaction = function (storeName, reject) {
        if (!this.db) {
            reject('You need to use the createStore function to create a database before you query it!');
        }
        if (!this.validateStoreName(storeName)) {
            reject(('objectStore does not exists: ' + storeName));
        }
    };
    DbWrapper.prototype.createTransaction = function (options) {
        var trans = this.db.transaction(options.storeName, options.dbMode);
        trans.onerror = options.error;
        trans.oncomplete = options.complete;
        trans.onabort = options.abort;
        return trans;
    };
    return DbWrapper;
}());
exports.DbWrapper = DbWrapper;
//# sourceMappingURL=angular2-indexeddb.js.map