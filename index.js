"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.compareVersion = exports.insertVersion = void 0;
var fs = require("fs");
var path = require("path");
var fileUtils_1 = require("./lib/fileUtils");
var DBUtils_1 = require("./lib/DBUtils");
var _baseDir = process.cwd();
var CONFIG_FILE = 'upload_check_config.json';
var _config = {}; //必备参数
function insertVersion(version) {
    return __awaiter(this, void 0, void 0, function () {
        var rootFiles, files, dbUtils;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('start insertVersion: ' + version);
                    return [4 /*yield*/, loadConfig()];
                case 1:
                    _config = _a.sent();
                    return [4 /*yield*/, (0, fileUtils_1.readdir)(path.resolve(_baseDir, _config.entry))];
                case 2:
                    rootFiles = _a.sent();
                    files = [];
                    return [4 /*yield*/, recordByDir(path.resolve(_baseDir, _config.entry), rootFiles, files)];
                case 3:
                    _a.sent();
                    dbUtils = new DBUtils_1["default"](_config);
                    dbUtils.addVersion(version, JSON.stringify(files));
                    dbUtils.close();
                    return [2 /*return*/];
            }
        });
    });
}
exports.insertVersion = insertVersion;
function compareVersion(newVersion, oldVersion) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function () {
        var dbUtils, newFiles, oldFiles, changedFiles, oldFileList, newFileList;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    console.log('start compareVersion : ' + "".concat(newVersion, " vs ").concat(oldVersion));
                    return [4 /*yield*/, loadConfig()];
                case 1:
                    _config = _c.sent();
                    dbUtils = new DBUtils_1["default"](_config);
                    return [4 /*yield*/, dbUtils.getFilsByVersion(newVersion)];
                case 2:
                    newFiles = _c.sent();
                    return [4 /*yield*/, dbUtils.getFilsByVersion(oldVersion)];
                case 3:
                    oldFiles = _c.sent();
                    dbUtils.close();
                    if (!((_a = oldFiles === null || oldFiles === void 0 ? void 0 : oldFiles[0]) === null || _a === void 0 ? void 0 : _a.version) || !((_b = newFiles === null || newFiles === void 0 ? void 0 : newFiles[0]) === null || _b === void 0 ? void 0 : _b.version)) {
                        console.log('invalid version !');
                        return [2 /*return*/];
                    }
                    changedFiles = [];
                    oldFileList = JSON.parse(oldFiles[0].files);
                    newFileList = JSON.parse(newFiles[0].files);
                    newFileList.forEach(function (file) {
                        var old = oldFileList.find(function (f) { return f.name === file.name; });
                        if (!old || (old && old.date !== file.date)) {
                            changedFiles.push(JSON.stringify({
                                name: file.name,
                                newDate: dateFormat(file.date),
                                oldDate: (old === null || old === void 0 ? void 0 : old.date) ? dateFormat(old === null || old === void 0 ? void 0 : old.date) : ''
                            }));
                        }
                    });
                    console.log('result: \n', changedFiles.join('\n'));
                    return [2 /*return*/];
            }
        });
    });
}
exports.compareVersion = compareVersion;
function loadConfig() {
    return (0, fileUtils_1.readJsonFile)(path.resolve(_baseDir, CONFIG_FILE));
}
function recordByDir(rootPath, dir, data) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                    var filesFilter, _i, filesFilter_1, file, fileName, files, record, fileStat;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                filesFilter = dir.filter(function (filefilter) {
                                    return (filefilter.isFile() && _config.extension.includes((0, fileUtils_1.getFileExtension)(filefilter.name))) || filefilter.isDirectory();
                                });
                                _i = 0, filesFilter_1 = filesFilter;
                                _a.label = 1;
                            case 1:
                                if (!(_i < filesFilter_1.length)) return [3 /*break*/, 7];
                                file = filesFilter_1[_i];
                                fileName = path.resolve(rootPath, file.name);
                                if (!file.isDirectory()) return [3 /*break*/, 4];
                                return [4 /*yield*/, (0, fileUtils_1.readdir)(fileName)];
                            case 2:
                                files = _a.sent();
                                return [4 /*yield*/, recordByDir(fileName, files, data)];
                            case 3:
                                record = _a.sent();
                                return [3 /*break*/, 6];
                            case 4: return [4 /*yield*/, (0, fileUtils_1.stat)(fileName)];
                            case 5:
                                fileStat = _a.sent();
                                data.push({
                                    name: fileName.substr(path.resolve(_baseDir, _config.entry).length),
                                    size: fileStat.size,
                                    date: fileStat.mtimeMs
                                });
                                _a.label = 6;
                            case 6:
                                _i++;
                                return [3 /*break*/, 1];
                            case 7:
                                resolve(true);
                                return [2 /*return*/];
                        }
                    });
                }); })];
        });
    });
}
//弃用 writeHistory(historyPath, _historyInfo);
function writeHistory(path, data) {
    return new Promise(function (resolve, reject) {
        fs.writeFile(path, JSON.stringify(data), function (err) {
            if (err) {
                resolve(false);
            }
            resolve(true);
        });
    });
}
function dateFormat(timestamp) {
    return new Date(timestamp).toLocaleDateString('zh-CN', {
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: false
    });
}
