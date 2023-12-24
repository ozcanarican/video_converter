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
const luxon_1 = require("luxon");
const child_process_1 = require("child_process");
const process = require("process");
let file = process.argv[2];
//variables
let files_location = path.join(__dirname, 'files.json');
var files = require(files_location);
let msgbody = "";
const log = (msg) => {
    console.log(msg);
    msgbody += msg + "\n";
};
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
const convertNews = () => __awaiter(void 0, void 0, void 0, function* () {
    let startTime = luxon_1.DateTime.now();
    log("Converting " + file);
    yield sendMessage("MediaServer Transcode", "file_folder");
    let p = path.dirname(file);
    let container = path.extname(file);
    let newfile = (path.basename(file)).replace(container, "") + ".mp4";
    let output = path.join(p, newfile);
    let temp = path.join(p, "temp.transcode");
    if (fs.existsSync(temp)) {
        fs.rmSync(temp);
    }
    let cmd = `HandBrakeCLI -i "${file}" -o "${temp}" -e x264 --preset "Very Fast 1080p30"`;
    (0, child_process_1.execSync)(cmd);
    fs.unlinkSync(file);
    fs.renameSync(temp, output);
    let fark = luxon_1.DateTime.now().diff(startTime);
    log(`Conversation has done for ${newfile} (${fark.toFormat("mm:ss")})`);
    yield sendMessage("MediaServer Transcode", "file_folder");
});
convertNews();
