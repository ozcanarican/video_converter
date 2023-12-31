"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const { readdir } = require("node:fs/promises");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const express = require('express');
//settings
const videoFolder = "D:/multimedia";
let allowedType = [".mp4", ".webm", ".mkv", ".avi"];
var isWin = process.platform === "win32";
const deleteOldFile = false;
const app = express();
const port = 3333;
//variables
let files_location = path.join(__dirname, 'files.json');
var files = require(files_location);
let scannerDirs = [];
let scannedFiles = [];
let newFiles = [];
let msgbody = "";
let isRunning = false;
let currentIndex = 0;
const log = (msg) => {
    console.log(msg);
    msgbody += msg + "\n";
};
const addToData = (file) => __awaiter(void 0, void 0, void 0, function* () {
    let filesData = JSON.parse(fs.readFileSync(files_location, 'utf8'));
    if (!filesData.includes(file)) {
        filesData.push(file);
        fs.writeFileSync(files_location, JSON.stringify(filesData));
    }
});
function getFiles(dir) {
    return __awaiter(this, void 0, void 0, function* () {
        if (scannerDirs.includes(dir)) {
            return;
        }
        scannerDirs.push(dir);
        const files = yield readdir(dir, { recursive: true, withFileTypes: true });
        yield Promise.all(files.map((file) => __awaiter(this, void 0, void 0, function* () {
            if (file.isFile() && !scannedFiles.includes((path.join(file.path, file.name))) && file.name != "temp.mp4") {
                if (allowedType.includes(path.extname(file.name))) {
                    scannedFiles.push(path.join(file.path, file.name));
                }
            }
            else {
                yield getFiles(file.path);
            }
        })));
    });
}
const startUp = () => __awaiter(void 0, void 0, void 0, function* () {
    scannerDirs = [];
    scannedFiles = [];
    files = yield JSON.parse(fs.readFileSync(files_location, "utf-8"));
    log("Starting a scan");
    yield getFiles(videoFolder);
    log(`Scan has done with **${scannedFiles.length}** files.`);
    scannedFiles.map((file) => {
        if (!files.includes(file)) {
            if (!newFiles.includes(file)) {
                log(`Feature task: ${file}`);
                newFiles.push(file);
            }
        }
    });
    if (newFiles.length > 0 && !isRunning) {
        isRunning = true;
        convertNews();
        log(`**${newFiles.length}** new files found.`);
    }
});
const convertNews = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Conversation has been started");
    if (currentIndex < newFiles.length) {
        isRunning = true;
        let file = newFiles[currentIndex];
        currentIndex++;
        let child = (0, child_process_1.exec)(`node C:\\Users\\ozcan\\video_converter\\converter.js "${file}"`);
        child.on('close', function (code) {
            files.push(file);
            fs.writeFileSync(files_location, JSON.stringify(files));
            convertNews();
        });
    }
    else {
        isRunning = false;
    }
});
const sendMessage = (title, icon = 'video_camera') => __awaiter(void 0, void 0, void 0, function* () {
    let res = yield fetch('https://ntfy.sh/55oarican_network', {
        method: 'POST',
        body: msgbody,
        headers: {
            'Title': title,
            'Tags': icon,
            'Markdown': 'yes'
        }
    });
    console.log(yield res.text());
    msgbody = "";
});
app.get("/", (req, res) => {
    if (!isRunning) {
        let kac = startUp();
        res.send(`Started to scan`);
    }
    else {
        res.send("Already running");
    }
});
app.listen(port, () => {
    console.log("Listening port: " + port);
});
//startUp()
