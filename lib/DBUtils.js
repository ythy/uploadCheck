"use strict";
exports.__esModule = true;
var mysql = require("mysql");
var DB_H5_HISTORY = 'h5_mp_history';
var DB_JTRAC_LIST = 'jtrac_list';
var CURRENT_TIMESTAMP = { toSqlString: function () { return 'CURRENT_TIMESTAMP()'; } };
var DBUtils = /** @class */ (function () {
    function DBUtils(config) {
        this.connection = mysql.createConnection(config);
        this.connection.connect();
    }
    DBUtils.prototype.addVersion = function (version, files) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.connection.query("INSERT INTO ".concat(DB_H5_HISTORY, " SET ?"), {
                version: version,
                files: files,
                created_time: CURRENT_TIMESTAMP
            }, function (error, results, fields) {
                if (error) {
                    throw error;
                    reject(error);
                }
                else {
                    resolve(results);
                }
            });
        });
    };
    DBUtils.prototype.getFilsByVersion = function (version) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            // error will be an Error if one occurred during the query
            // results will contain the results of the query
            // fields will contain information about the returned results fields (if any)
            _this.connection.query("SELECT * FROM ".concat(DB_H5_HISTORY, " WHERE version = ?"), [version], function (error, results, fields) {
                if (error) {
                    throw error;
                    reject(error);
                }
                else {
                    resolve(results);
                }
            });
        });
    };
    DBUtils.prototype.getLastTwoFils = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            // error will be an Error if one occurred during the query
            // results will contain the results of the query
            // fields will contain information about the returned results fields (if any)
            _this.connection.query("SELECT * FROM ".concat(DB_H5_HISTORY, " ORDER BY id DESC LIMIT 2"), function (error, results, fields) {
                if (error) {
                    throw error;
                    reject(error);
                }
                else {
                    resolve(results);
                }
            });
        });
    };
    DBUtils.prototype.getJtracInfo = function (jtrac) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            // error will be an Error if one occurred during the query
            // results will contain the results of the query
            // fields will contain information about the returned results fields (if any)
            _this.connection.query("SELECT * FROM ".concat(DB_JTRAC_LIST, " WHERE jtrac_no = ? AND status = 'A'"), [jtrac], function (error, results, fields) {
                if (error) {
                    throw error;
                    reject(error);
                }
                else {
                    resolve(results);
                }
            });
        });
    };
    DBUtils.prototype.getJtracByVersion = function (version) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            // error will be an Error if one occurred during the query
            // results will contain the results of the query
            // fields will contain information about the returned results fields (if any)
            _this.connection.query("SELECT * FROM ".concat(DB_JTRAC_LIST, " WHERE version = ? AND status = 'A'"), [version], function (error, results, fields) {
                if (error) {
                    throw error;
                    reject(error);
                }
                else {
                    resolve(results);
                }
            });
        });
    };
    /*
    *  OkPacket {
    *  fieldCount: 0,
    *  affectedRows: 1,
    *  insertId: 0,
    *  serverStatus: 34,
    *  warningCount: 0,
    *  message: '(Rows matched: 1  Changed: 1  Warnings: 0',
    *  protocol41: true,
    *  changedRows: 1
    *  }
    */
    DBUtils.prototype.updateJtracTo45 = function (version, modules) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.connection.query("UPDATE ".concat(DB_JTRAC_LIST, " SET status = 'B', module_list = ? WHERE version = ? AND status = 'A' "), [modules, version], function (error, results, fields) {
                if (error) {
                    throw error;
                    reject(error);
                }
                else {
                    resolve(results);
                }
            });
        });
    };
    DBUtils.prototype.close = function () {
        this.connection.end();
    };
    return DBUtils;
}());
exports["default"] = DBUtils;
