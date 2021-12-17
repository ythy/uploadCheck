"use strict";
exports.__esModule = true;
exports.copy = exports.readdir = exports.stat = exports.access = exports.readJsonFile = exports.getFileExtension = void 0;
var fs = require("fs");
var path = require("path");
function getFileExtension(path) {
    return path && path.split('.').pop();
}
exports.getFileExtension = getFileExtension;
function readJsonFile(path) {
    return new Promise(function (resolve, reject) {
        fs.readFile(path, 'utf8', function (err, data) {
            if (err) {
                console.error('ReadJsonFile Error: ' + err);
                reject(err);
            }
            resolve(JSON.parse(data));
        });
    });
}
exports.readJsonFile = readJsonFile;
/**
 * @expamles
 * const historyPath = path.resolve(_baseDir, _config.history);
 * const isHistoryExist = await access(historyPath);
 */
function access(path) {
    return new Promise(function (resolve, reject) {
        fs.access(path, fs.constants.W_OK, function (err) {
            if (err) {
                resolve(false);
            }
            resolve(true);
        });
    });
}
exports.access = access;
function stat(path) {
    return new Promise(function (resolve, reject) {
        fs.stat(path, function (err, stats) {
            if (err) {
                reject(err);
            }
            resolve(stats);
        });
    });
}
exports.stat = stat;
function readdir(path) {
    return new Promise(function (resolve, reject) {
        fs.readdir(path, { withFileTypes: true }, function (err, files) {
            if (err) {
                reject(err);
            }
            resolve(files);
        });
    });
}
exports.readdir = readdir;
function copy(pathInput, fromDir, toDir) {
    return new Promise(function (resolve, reject) {
        fs.mkdir(path.dirname(path.resolve(toDir, pathInput)), { recursive: true }, function (err) {
            if (err) {
                reject(err);
            }
            fs.copyFile(path.resolve(fromDir, pathInput), path.resolve(toDir, pathInput), function (err) {
                if (err) {
                    reject(err);
                }
                resolve(true);
            });
        });
    });
}
exports.copy = copy;
