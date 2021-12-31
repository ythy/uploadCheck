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
exports.copyCompileFiles = exports.compareLastVersion = exports.compareVersion = exports.insertVersion = void 0;
var fs = require("fs");
var path = require("path");
var fileUtils_1 = require("./lib/fileUtils");
var DBUtils_1 = require("./lib/DBUtils");
var SftpClient = require('ssh2-sftp-client');
var _baseDir = process.cwd();
var CONFIG_FILE = 'upload_check_config.json';
var _config = {}; //必备参数
function insertVersion(version) {
    return __awaiter(this, void 0, void 0, function () {
        var rootFiles, files, dbUtils, compares, modules, oldFileList, newFileList;
        var _this = this;
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
                    return [4 /*yield*/, dbUtils.addVersion(version, JSON.stringify(files))];
                case 4:
                    _a.sent();
                    console.log('end insertVersion: ' + version);
                    return [4 /*yield*/, dbUtils.getLastTwoFils()];
                case 5:
                    compares = _a.sent();
                    console.log('start compareVersion : ' + "".concat(compares[0].version, " vs ").concat(compares[1].version));
                    modules = [];
                    oldFileList = JSON.parse(compares[1].files);
                    newFileList = JSON.parse(compares[0].files);
                    newFileList.forEach(function (file) {
                        var old = oldFileList.find(function (f) { return f.name === file.name; });
                        if (!old || (old && old.date !== file.date)) {
                            modules.push(file.name.split('\\').join('/'));
                        }
                    });
                    console.log('start update modules: ' + modules.join(','));
                    dbUtils.updateJtracTo45(version, modules.join(',')).then(function (result) { return __awaiter(_this, void 0, void 0, function () {
                        var client, modulesCombined_2, _i, modulesCombined_1, modulePath, result_1, jspResult;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    dbUtils.close();
                                    if (!(!result.changedRows || result.changedRows < 1)) return [3 /*break*/, 1];
                                    console.log("error in update jtrac: changedRows < 1");
                                    return [3 /*break*/, 8];
                                case 1:
                                    console.log("update jtrac status success: changedRows ( ".concat(result === null || result === void 0 ? void 0 : result.changedRows, " )"));
                                    //开始上传FTP
                                    console.log('start upload files ');
                                    client = new SftpClient();
                                    return [4 /*yield*/, client.connect({
                                            host: _config.ftp_host,
                                            port: 22,
                                            username: _config.ftp_user,
                                            password: _config.ftp_pw
                                        })];
                                case 2:
                                    _a.sent();
                                    modulesCombined_2 = [];
                                    modules.forEach(function (originPath) {
                                        modulesCombined_2.push(originPath, originPath + '.gz', originPath + '.map');
                                    });
                                    _i = 0, modulesCombined_1 = modulesCombined_2;
                                    _a.label = 3;
                                case 3:
                                    if (!(_i < modulesCombined_1.length)) return [3 /*break*/, 6];
                                    modulePath = modulesCombined_1[_i];
                                    console.log('upload file: ' + modulePath);
                                    return [4 /*yield*/, client.put(path.join(_config.entry, modulePath), _config.remote_entry_script + modulePath)["catch"](function (err) {
                                            console.log('upload file error: ' + err);
                                        })];
                                case 4:
                                    result_1 = _a.sent();
                                    console.log('upload file result: ' + result_1);
                                    _a.label = 5;
                                case 5:
                                    _i++;
                                    return [3 /*break*/, 3];
                                case 6: return [4 /*yield*/, client.put(_config.local_entry_jsp, _config.remote_entry_jsp)["catch"](function (err) {
                                        console.log('upload jsp error: ' + err);
                                    })];
                                case 7:
                                    jspResult = _a.sent();
                                    console.log('upload jsp result: ' + jspResult);
                                    console.log('end upload files ');
                                    client.end();
                                    _a.label = 8;
                                case 8: return [2 /*return*/];
                            }
                        });
                    }); })["catch"](function (error) {
                        dbUtils.close();
                        console.log("error in in update jtrac: ", error);
                        throw error;
                    });
                    return [2 /*return*/];
            }
        });
    });
}
exports.insertVersion = insertVersion;
function compareVersion(newVersion, oldVersion) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function () {
        var dbUtils, newFiles, oldFiles, changedFiles, copiedFiles, oldFileList, newFileList;
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
                    copiedFiles = [];
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
                            copiedFiles.push(file.name.split('\\').join('/'));
                        }
                    });
                    console.log('result:', "\n".concat(changedFiles.join('\n')));
                    console.log("  ----------------------------------------------------\n  --------------------- Copy\u2193 -----------------------\n  ----------------------------------------------------");
                    console.log("".concat(copiedFiles.join('\n')));
                    return [2 /*return*/];
            }
        });
    });
}
exports.compareVersion = compareVersion;
function compareLastVersion() {
    return __awaiter(this, void 0, void 0, function () {
        var dbUtils, files, changedFiles, copiedFiles, oldFileList, newFileList;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, loadConfig()];
                case 1:
                    _config = _a.sent();
                    dbUtils = new DBUtils_1["default"](_config);
                    return [4 /*yield*/, dbUtils.getLastTwoFils()];
                case 2:
                    files = _a.sent();
                    dbUtils.close();
                    if ((files === null || files === void 0 ? void 0 : files.length) !== 2) {
                        console.log('invalid row length !');
                        return [2 /*return*/];
                    }
                    console.log('start compareVersion : ' + "".concat(files[0].version, " vs ").concat(files[1].version));
                    changedFiles = [];
                    copiedFiles = [];
                    oldFileList = JSON.parse(files[1].files);
                    newFileList = JSON.parse(files[0].files);
                    newFileList.forEach(function (file) {
                        var old = oldFileList.find(function (f) { return f.name === file.name; });
                        if (!old || (old && old.date !== file.date)) {
                            changedFiles.push(JSON.stringify({
                                name: file.name,
                                newDate: dateFormat(file.date),
                                oldDate: (old === null || old === void 0 ? void 0 : old.date) ? dateFormat(old === null || old === void 0 ? void 0 : old.date) : ''
                            }));
                            copiedFiles.push(file.name.split('\\').join('/'));
                        }
                    });
                    console.log('result:', "\n".concat(changedFiles.join('\n')));
                    console.log("  ----------------------------------------------------\n  --------------------- Copy\u2193 -----------------------\n  ----------------------------------------------------");
                    console.log("".concat(copiedFiles.join('\n')));
                    return [2 /*return*/];
            }
        });
    });
}
exports.compareLastVersion = compareLastVersion;
function copyCompileFiles(version) {
    return __awaiter(this, void 0, void 0, function () {
        var dbUtils;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, loadConfig()];
                case 1:
                    _config = _a.sent();
                    dbUtils = new DBUtils_1["default"](_config);
                    dbUtils.getJtracByVersion(version).then(function (jtracFiles) { return __awaiter(_this, void 0, void 0, function () {
                        var _i, jtracFiles_1, jtrac, filelist, _loop_1, _a, filelist_1, file, _loop_2, _b, _c, fixedFile;
                        var _d;
                        return __generator(this, function (_e) {
                            switch (_e.label) {
                                case 0:
                                    dbUtils.close();
                                    if (!(jtracFiles === null || jtracFiles === void 0 ? void 0 : jtracFiles.length) || (jtracFiles === null || jtracFiles === void 0 ? void 0 : jtracFiles.length) === 0) {
                                        console.log('error in search');
                                        return [2 /*return*/];
                                    }
                                    _i = 0, jtracFiles_1 = jtracFiles;
                                    _e.label = 1;
                                case 1:
                                    if (!(_i < jtracFiles_1.length)) return [3 /*break*/, 6];
                                    jtrac = jtracFiles_1[_i];
                                    console.log("start copy jtrac: ".concat(jtrac.jtrac_no));
                                    filelist = (_d = jtrac.file_list) === null || _d === void 0 ? void 0 : _d.split(',');
                                    _loop_1 = function (file) {
                                        var result;
                                        return __generator(this, function (_f) {
                                            switch (_f.label) {
                                                case 0: return [4 /*yield*/, (0, fileUtils_1.copy)(file, _config.updateEntry, _config.compileEntry)["catch"](function (error) {
                                                        console.log("error in copy ".concat(file, ": "), error);
                                                        throw error;
                                                    })];
                                                case 1:
                                                    result = _f.sent();
                                                    if (result) {
                                                        console.log('copied: ', file);
                                                    }
                                                    return [2 /*return*/];
                                            }
                                        });
                                    };
                                    _a = 0, filelist_1 = filelist;
                                    _e.label = 2;
                                case 2:
                                    if (!(_a < filelist_1.length)) return [3 /*break*/, 5];
                                    file = filelist_1[_a];
                                    return [5 /*yield**/, _loop_1(file)];
                                case 3:
                                    _e.sent();
                                    _e.label = 4;
                                case 4:
                                    _a++;
                                    return [3 /*break*/, 2];
                                case 5:
                                    _i++;
                                    return [3 /*break*/, 1];
                                case 6:
                                    _loop_2 = function (fixedFile) {
                                        var result;
                                        return __generator(this, function (_g) {
                                            switch (_g.label) {
                                                case 0: return [4 /*yield*/, (0, fileUtils_1.copy)(fixedFile, _config.updateEntry, _config.compileEntry)["catch"](function (error) {
                                                        console.log("error in copy ".concat(fixedFile, ": "), error);
                                                        throw error;
                                                    })];
                                                case 1:
                                                    result = _g.sent();
                                                    if (result) {
                                                        console.log('copied: ', fixedFile);
                                                    }
                                                    return [2 /*return*/];
                                            }
                                        });
                                    };
                                    _b = 0, _c = _config.copiedFiles;
                                    _e.label = 7;
                                case 7:
                                    if (!(_b < _c.length)) return [3 /*break*/, 10];
                                    fixedFile = _c[_b];
                                    return [5 /*yield**/, _loop_2(fixedFile)];
                                case 8:
                                    _e.sent();
                                    _e.label = 9;
                                case 9:
                                    _b++;
                                    return [3 /*break*/, 7];
                                case 10: return [2 /*return*/];
                            }
                        });
                    }); });
                    return [2 /*return*/];
            }
        });
    });
}
exports.copyCompileFiles = copyCompileFiles;
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
