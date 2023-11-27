const { readdir } = require("node:fs/promises");
import * as fs from 'fs';
import * as path from "path"
var exec = require('child_process').exec;
import  {DateTime}  from "luxon";

//settings
const videoFolder = "D:/multimedia"
let allowedType = [".mp4",".webm",".mkv",".avi"]
var isWin = process.platform === "win32";
const deleteOldFile = true

//variables
var files: string[] = require('./files.json')
let scannerDirs:string[] = []
let scannedFiles: string[] = []
let newFiles: string[] = []
let msgbody = "";



const execPromise = function(cmd:string) {
  return new Promise(function(resolve, reject) {
    log(`Executing: "${cmd}"`)
      exec(cmd, function(err:any, stdout:string) {
          if (err) return reject(err);
          resolve(stdout);
      });
  });
}


const log = (msg: string) => {
  console.log(msg)
  msgbody += msg + "\n"
}

const addToData = async(file:string) => {
  let filesData = JSON.parse(fs.readFileSync('./files.json', 'utf8'));
  if (!filesData.includes(file)) {
    filesData.push(file)
    fs.writeFileSync("files.json", JSON.stringify(filesData))
  }
}


async function getFiles(dir: string) {
  if(scannerDirs.includes(dir)) {
    return
  }
  scannerDirs.push(dir)
  const files: fs.Dirent[] = await readdir(dir, { recursive: true, withFileTypes: true });
  await Promise.all(files.map(async (file) => {
    if (file.isFile() && !scannedFiles.includes((path.join(file.path, file.name)))) {
      if (allowedType.includes(path.extname(file.name))) {
        scannedFiles.push(path.join(file.path, file.name))
      }
    } else {
      await getFiles(file.path)
    }

  }))
}

const startUp = async () => {
  log("Starting a scan")
  await getFiles(videoFolder)
  log(`Scan has done with **${scannedFiles.length}** files.`)
  scannedFiles.map((file) => {
    if (!files.includes(file)) {
      newFiles.push(file)
    }
  })
  log(`**${newFiles.length}** new files found.`)
  
  if (newFiles.length > 0) {
    sendMessage("MediaServer New Files")
    let combined = files.concat(newFiles)
    fs.writeFileSync("files.json", JSON.stringify(combined))
    convertNews()
  }
}

const convertNews = async () => {
  console.log("Conversation has been started")
  newFiles.map(async(file)=>{
    let startTime = DateTime.now()
    console.log("Converting " + file)
    let p = path.dirname(file as string)
    let container = path.extname(file as string)
    let newfile = (path.basename(file as string)).replace(container,"") + ".mp4"
    let output = path.join(p,newfile)
    let temp = path.join(p,"temp.mp4")
    let cmd = ""
    if(isWin) {
      cmd = `HandBrakeCLI -i "${file}" -o "${temp}" -e x264 --preset "Very Fast 1080p30"`
    } else {
      cmd = `HandBrakeCLI -i "${file}" -o "${temp}" -e x264 --preset "Very Fast 1080p30"`
    }
    await execPromise(cmd)
    if(deleteOldFile) {
      fs.unlinkSync(file as string);
    } else {
      fs.renameSync(file,file + ".old")
      addToData(file + ".old")
    }
    fs.renameSync(temp,output)
    addToData(output)
    let fark = DateTime.now().diff(startTime)
    log(`Conversation has done for ${newfile} (${fark.toFormat("mm:ss")})`)
    sendMessage("MediaServer Transcode","file_folder")
  })
}

const sendMessage = (title:string, icon:string='video_camera') => {
  fetch('https://ntfy.sh/55oarican_network', {
    method: 'POST',
    body: msgbody,
    headers: {
      'Title': title,
      'Tags': icon,
      'Markdown': 'yes'
    }
  }).then(async (res) => {
    console.log(await res.text())
    msgbody = ""
  })
}

startUp()
