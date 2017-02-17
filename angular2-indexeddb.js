'use strict';
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var core_1 = require("@angular/core");
var AngularIndexedDB = (function () {
    function AngularIndexedDB(dbName, version) {
        this.utils = new Utils();
        this.dbWrapper = new DbWrapper(dbName, version);
    }
    AngularIndexedDB.prototype.createStore = function (version, upgradeCallback) {
        var _this = this;
        var self = this, promise = new Promise(function (resolve, reject) {
            _this.dbWrapper.dbVersion = version;
            var request = _this.utils.indexedDB.open(_this.dbWrapper.dbName, version);
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
    };
    AngularIndexedDB.prototype.getByKey = function (storeName, key) {
        var self = this;
        var promise = new Promise(function (resolve, reject) {
            self.dbWrapper.validateBeforeTransaction(storeName, reject);
            var transaction = self.dbWrapper.createTransaction({ storeName: storeName,
                dbMode: self.utils.dbMode.readOnly,
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
        return promise;
    };
    AngularIndexedDB.prototype.getAll = function (storeName, keyRange) {
        var self = this;
        var promise = new Promise(function (resolve, reject) {
            self.dbWrapper.validateBeforeTransaction(storeName, reject);
            var transaction = self.dbWrapper.createTransaction({ storeName: storeName,
                dbMode: self.utils.dbMode.readOnly,
                error: function (e) {
                    reject(e);
                },
                complete: function (e) {
                }
            }), objectStore = transaction.objectStore(storeName), result = [], request = objectStore.openCursor(keyRange);
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
        return promise;
    };
    AngularIndexedDB.prototype.add = function (storeName, value, key) {
        var self = this;
        var promise = new Promise(function (resolve, reject) {
            self.dbWrapper.validateBeforeTransaction(storeName, reject);
            var transaction = self.dbWrapper.createTransaction({ storeName: storeName,
                dbMode: self.utils.dbMode.readWrite,
                error: function (e) {
                    reject(e);
                },
                complete: function (e) {
                    resolve({ key: key, value: value });
                }
            }), objectStore = transaction.objectStore(storeName);
            objectStore.add(value, key);
        });
        return promise;
    };
    AngularIndexedDB.prototype.update = function (storeName, value, key) {
        var self = this;
        var promise = new Promise(function (resolve, reject) {
            self.dbWrapper.validateBeforeTransaction(storeName, reject);
            var transaction = self.dbWrapper.createTransaction({ storeName: storeName,
                dbMode: self.utils.dbMode.readWrite,
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
        return promise;
    };
    AngularIndexedDB.prototype.delete = function (storeName, key) {
        var self = this;
        var promise = new Promise(function (resolve, reject) {
            self.dbWrapper.validateBeforeTransaction(storeName, reject);
            var transaction = self.dbWrapper.createTransaction({ storeName: storeName,
                dbMode: self.utils.dbMode.readWrite,
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
        return promise;
    };
    AngularIndexedDB.prototype.openCursor = function (storeName, cursorCallback, keyRange) {
        var self = this;
        var promise = new Promise(function (resolve, reject) {
            self.dbWrapper.validateBeforeTransaction(storeName, reject);
            var transaction = self.dbWrapper.createTransaction({ storeName: storeName,
                dbMode: self.utils.dbMode.readOnly,
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
        return promise;
    };
    AngularIndexedDB.prototype.clear = function (storeName) {
        var self = this;
        var promise = new Promise(function (resolve, reject) {
            self.dbWrapper.validateBeforeTransaction(storeName, reject);
            var transaction = self.dbWrapper.createTransaction({ storeName: storeName,
                dbMode: self.utils.dbMode.readWrite,
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
        return promise;
    };
    AngularIndexedDB.prototype.getByIndex = function (storeName, indexName, key) {
        var self = this;
        var promise = new Promise(function (resolve, reject) {
            self.dbWrapper.validateBeforeTransaction(storeName, reject);
            var transaction = self.dbWrapper.createTransaction({ storeName: storeName,
                dbMode: self.utils.dbMode.readOnly,
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
        return promise;
    };
    return AngularIndexedDB;
}());
AngularIndexedDB = __decorate([
    core_1.Injectable(),
    __metadata("design:paramtypes", [String, Number])
], AngularIndexedDB);
exports.AngularIndexedDB = AngularIndexedDB;
var Utils = (function () {
    function Utils() {
        this.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
        this.dbMode = {
            readOnly: "readonly",
            readWrite: "readwrite"
        };
    }
    return Utils;
}());
var DbWrapper = (function () {
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
//# sourceMappingURL=angular2-indexeddb.js.map