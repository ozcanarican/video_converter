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
const luxon_1 = require("luxon");
const express = require('express');
//settings
const videoFolder = "/mnt/usb1/multimedia";
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
let index = 0;
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
    newFiles = [];
    index = 0;
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
    convertNews();
    log(`**${newFiles.length}** new files found.`);
});
const convertNews = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Conversation has been started");
    files = [...files, ...newFiles];
    fs.writeFileSync(files_location, JSON.stringify(files));
    yield sendMessage("MediaServer Transcode", "file_folder");
    if (newFiles.length > 0) {
        isRunning = true;
        convert();
    }
});
const convert = () => __awaiter(void 0, void 0, void 0, function* () {
    if (index >= files.length) {
        log("All proccess is done");
        yield sendMessage("MediaServer Transcode", "file_folder");
        isRunning = false;
        startUp();
    }
    else {
        let file = newFiles[index];
        let startTime = luxon_1.DateTime.now();
        log("Converting " + file);
        yield sendMessage("MediaServer Transcode", "file_folder");
        let p = path.dirname(file);
        let container = path.extname(file);
        let newfile = (path.basename(file)).replace(container, "") + ".mp4";
        let output = path.join(p, newfile);
        files = [...files, output];
        fs.writeFileSync(files_location, JSON.stringify(files));
        let temp = path.join(p, "temp.transcode");
        if (fs.existsSync(temp)) {
            fs.rmSync(temp);
        }
        let cmd = `HandBrakeCLI -i "${file}" -o "${temp}" -e x264 --preset "Very Fast 1080p30"`;
        (0, child_process_1.execSync)(cmd, { stdio: "inherit" });
        fs.unlinkSync(file);
        fs.renameSync(temp, output);
        let fark = luxon_1.DateTime.now().diff(startTime);
        log(`Conversation has done for ${newfile} (${fark.toFormat("mm:ss")})`);
        yield sendMessage("MediaServer Transcode", "file_folder");
        index++;
        convert();
    }
});
const sendMessage = (title_1, ...args_1) => __awaiter(void 0, [title_1, ...args_1], void 0, function* (title, icon = 'video_camera') {
    try {
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
    }
    catch (error) {
        console.log("notification error", error);
    }
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
app.post("/", (req, res) => {
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
    startUp();
});
