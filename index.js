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
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
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
Object.defineProperty(exports, "__esModule", { value: true });
var readdir = require("node:fs/promises").readdir;
var fs = require("fs");
var path = require("path");
var exec = require('child_process').exec;
var luxon_1 = require("luxon");
var child_process_1 = require("child_process");
//settings
var videoFolder = "D:/multimedia";
var allowedType = [".mp4", ".webm", ".mkv", ".avi"];
var isWin = process.platform === "win32";
var deleteOldFile = true;
//variables
var files = require('./files.json');
var scannerDirs = [];
var scannedFiles = [];
var newFiles = [];
var msgbody = "";
var log = function (msg) {
    console.log(msg);
    msgbody += msg + "\n";
};
var addToData = function (file) { return __awaiter(void 0, void 0, void 0, function () {
    var filesData;
    return __generator(this, function (_a) {
        filesData = JSON.parse(fs.readFileSync('./files.json', 'utf8'));
        if (!filesData.includes(file)) {
            filesData.push(file);
            fs.writeFileSync("files.json", JSON.stringify(filesData));
        }
        return [2 /*return*/];
    });
}); };
function getFiles(dir) {
    return __awaiter(this, void 0, void 0, function () {
        var files;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (scannerDirs.includes(dir)) {
                        return [2 /*return*/];
                    }
                    scannerDirs.push(dir);
                    return [4 /*yield*/, readdir(dir, { recursive: true, withFileTypes: true })];
                case 1:
                    files = _a.sent();
                    return [4 /*yield*/, Promise.all(files.map(function (file) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (!(file.isFile() && !scannedFiles.includes((path.join(file.path, file.name))) && file.name != "temp.mp4")) return [3 /*break*/, 1];
                                        if (allowedType.includes(path.extname(file.name))) {
                                            scannedFiles.push(path.join(file.path, file.name));
                                        }
                                        return [3 /*break*/, 3];
                                    case 1: return [4 /*yield*/, getFiles(file.path)];
                                    case 2:
                                        _a.sent();
                                        _a.label = 3;
                                    case 3: return [2 /*return*/];
                                }
                            });
                        }); }))];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
var startUp = function () { return __awaiter(void 0, void 0, void 0, function () {
    var combined;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                log("Starting a scan");
                return [4 /*yield*/, getFiles(videoFolder)];
            case 1:
                _a.sent();
                log("Scan has done with **".concat(scannedFiles.length, "** files."));
                scannedFiles.map(function (file) {
                    if (!files.includes(file)) {
                        newFiles.push(file);
                    }
                });
                log("**".concat(newFiles.length, "** new files found."));
                if (newFiles.length > 0) {
                    sendMessage("MediaServer New Files");
                    combined = files.concat(newFiles);
                    fs.writeFileSync("files.json", JSON.stringify(combined));
                    convertNews();
                }
                return [2 /*return*/];
        }
    });
}); };
var convertNews = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log("Conversation has been started");
                return [4 /*yield*/, Promise.all(newFiles.map(function (file) { return __awaiter(void 0, void 0, void 0, function () {
                        var startTime, p, container, newfile, output, temp, cmd, fark;
                        return __generator(this, function (_a) {
                            startTime = luxon_1.DateTime.now();
                            console.log("Converting " + file);
                            p = path.dirname(file);
                            container = path.extname(file);
                            newfile = (path.basename(file)).replace(container, "") + ".mp4";
                            output = path.join(p, newfile);
                            temp = path.join(p, "temp.mp4");
                            if (fs.existsSync(temp)) {
                                fs.rmSync(temp);
                            }
                            cmd = "";
                            if (isWin) {
                                cmd = "HandBrakeCLI -i \"".concat(file, "\" -o \"").concat(temp, "\" -e x264 --preset \"Very Fast 1080p30\"");
                            }
                            else {
                                cmd = "HandBrakeCLI -i \"".concat(file, "\" -o \"").concat(temp, "\" -e x264 --preset \"Very Fast 1080p30\"");
                            }
                            (0, child_process_1.execSync)(cmd);
                            if (deleteOldFile) {
                                fs.unlinkSync(file);
                            }
                            else {
                                fs.renameSync(file, file + ".old");
                                addToData(file + ".old");
                            }
                            fs.renameSync(temp, output);
                            addToData(output);
                            fark = luxon_1.DateTime.now().diff(startTime);
                            log("Conversation has done for ".concat(newfile, " (").concat(fark.toFormat("mm:ss"), ")"));
                            sendMessage("MediaServer Transcode", "file_folder");
                            return [2 /*return*/];
                        });
                    }); }))];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
var sendMessage = function (title, icon) {
    if (icon === void 0) { icon = 'video_camera'; }
    fetch('https://ntfy.sh/55oarican_network', {
        method: 'POST',
        body: msgbody,
        headers: {
            'Title': title,
            'Tags': icon,
            'Markdown': 'yes'
        }
    }).then(function (res) { return __awaiter(void 0, void 0, void 0, function () {
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _b = (_a = console).log;
                    return [4 /*yield*/, res.text()];
                case 1:
                    _b.apply(_a, [_c.sent()]);
                    msgbody = "";
                    return [2 /*return*/];
            }
        });
    }); });
};
startUp();
